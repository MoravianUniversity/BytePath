import { useEffect, useMemo, useState } from "react";
import { TOPICS } from "../all_topics";
import { Topic, TopicGroup } from "../topics";
import {
  classTopicSettingsService,
  type ClassTopicSetting,
} from "../services/classTopicSettings";
import { studentsService } from "../services/students";
import "./TopicSettingsPage.css";

type TopicDraft = {
  topic_id: string;
  name: string;
  is_enabled: boolean;
  available_at: string | null;
  is_assigned: boolean;
  due_at: string | null;
};

const ALL_SECTIONS_VALUE = "__all_sections__";
const DEFAULT_AVAILABLE_TIME = "00:00";
const DEFAULT_DUE_TIME = "23:59";

function parseServerUtc(iso: string): Date {
  const normalized = /(?:Z|[+-]\d{2}:\d{2})$/.test(iso) ? iso : `${iso}Z`;
  return new Date(normalized);
}

function toLocalDateValue(iso: string | null): string {
  if (!iso) return "";
  const d = parseServerUtc(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toLocalTimeValue(iso: string | null): string {
  if (!iso) return "";
  const d = parseServerUtc(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIsoFromLocalParts(dateValue: string, timeValue: string): string | null {
  if (!dateValue) return null;
  const time = /^\d{2}:\d{2}$/.test(timeValue) ? timeValue : DEFAULT_AVAILABLE_TIME;
  return new Date(`${dateValue}T${time}`).toISOString();
}

function isFuture(iso: string | null): boolean {
  if (!iso) return false;
  return parseServerUtc(iso).getTime() > Date.now();
}

function dateTimeEqual(a: string | null, b: string | null): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return parseServerUtc(a).getTime() === parseServerUtc(b).getTime();
}

function draftsMatchGlobalEnable(sectionDraft: TopicDraft, globalDraft: TopicDraft): boolean {
  return (
    sectionDraft.is_enabled === globalDraft.is_enabled
    && dateTimeEqual(sectionDraft.available_at, globalDraft.available_at)
  );
}

function draftsMatchGlobalAssignment(sectionDraft: TopicDraft, globalDraft: TopicDraft): boolean {
  return (
    sectionDraft.is_assigned === globalDraft.is_assigned
    && dateTimeEqual(sectionDraft.due_at, globalDraft.due_at)
  );
}

function draftsMatchGlobal(sectionDraft: TopicDraft, globalDraft: TopicDraft): boolean {
  return (
    draftsMatchGlobalEnable(sectionDraft, globalDraft)
    && draftsMatchGlobalAssignment(sectionDraft, globalDraft)
  );
}

function buildTopicOverrideSections(
  sectionOverrideDrafts: Record<string, Record<string, TopicDraft>>,
  globalDrafts: Record<string, TopicDraft>,
  matchesGlobal: (sectionDraft: TopicDraft, globalDraft: TopicDraft) => boolean,
): Map<string, string[]> {
  const byTopic = new Map<string, Set<string>>();
  for (const [section, rows] of Object.entries(sectionOverrideDrafts)) {
    for (const row of Object.values(rows)) {
      const global = globalDrafts[row.topic_id];
      if (!global || matchesGlobal(row, global)) continue;
      if (!byTopic.has(row.topic_id)) byTopic.set(row.topic_id, new Set());
      byTopic.get(row.topic_id)!.add(section);
    }
  }
  const result = new Map<string, string[]>();
  for (const [topicId, sections] of byTopic) {
    result.set(topicId, [...sections].sort(compareSections));
  }
  return result;
}

function formatSectionLabel(section: string): string {
  return section === "" ? "(No Section)" : section;
}

function compareSections(a: string, b: string): number {
  return formatSectionLabel(a).localeCompare(formatSectionLabel(b));
}

function formatOverriddenInLabel(sections: string[]): string {
  return `Overridden in: ${sections.map(formatSectionLabel).join(", ")}`;
}

function datetimeClassName(inactive: boolean): string {
  return inactive
    ? "topic-settings-datetime topic-settings-datetime--inactive"
    : "topic-settings-datetime";
}

function getTimezoneLabel(): string {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offsetMinutes = -new Date().getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absolute = Math.abs(offsetMinutes);
  const hours = Math.floor(absolute / 60);
  const minutes = absolute % 60;
  return `${zone} (UTC${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")})`;
}

export default function TopicSettingsPage({ classId }: { classId: number | null }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [globalDrafts, setGlobalDrafts] = useState<Record<string, TopicDraft>>({});
  const [sectionOverrideDrafts, setSectionOverrideDrafts] = useState<
    Record<string, Record<string, TopicDraft>>
  >({});
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [sectionOptions, setSectionOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const timezoneLabel = useMemo(() => getTimezoneLabel(), []);

  const allTopics = useMemo(() => {
    const topics: Topic[] = [];
    for (const item of TOPICS) {
      if (item instanceof TopicGroup) {
        topics.push(...item.topics);
      } else {
        topics.push(item);
      }
    }
    return topics;
  }, []);

  const applyServerSettings = (
    globalSettings: ClassTopicSetting[],
    sectionOverrides: Record<string, ClassTopicSetting[]>,
  ) => {
    const byGlobalTopic = new Map<string, ClassTopicSetting>(
      globalSettings.map((s) => [s.topic_id, s]),
    );
    const nextGlobal: Record<string, TopicDraft> = {};
    for (const topic of allTopics) {
      const setting = byGlobalTopic.get(topic.id);
      nextGlobal[topic.id] = {
        topic_id: topic.id,
        name: topic.name,
        is_enabled: setting?.is_enabled ?? setting?.effective_enabled ?? true,
        available_at: setting?.available_at ?? null,
        is_assigned: setting?.is_assigned ?? false,
        due_at: setting?.due_at ?? null,
      };
    }

    const nextOverrides: Record<string, Record<string, TopicDraft>> = {};
    for (const [section, rows] of Object.entries(sectionOverrides ?? {})) {
      const byTopic: Record<string, TopicDraft> = {};
      for (const row of rows) {
        const topic = allTopics.find((t) => t.id === row.topic_id);
        const draft: TopicDraft = {
          topic_id: row.topic_id,
          name: topic?.name ?? row.topic_id,
          is_enabled: row.is_enabled ?? row.effective_enabled ?? true,
          available_at: row.available_at ?? null,
          is_assigned: row.is_assigned ?? false,
          due_at: row.due_at ?? null,
        };
        const globalDraft = nextGlobal[row.topic_id];
        if (globalDraft && draftsMatchGlobal(draft, globalDraft)) continue;
        byTopic[row.topic_id] = draft;
      }
      nextOverrides[section] = byTopic;
    }

    setGlobalDrafts(nextGlobal);
    setSectionOverrideDrafts(nextOverrides);
  };

  const load = async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const [settings, sections] = await Promise.all([
        classTopicSettingsService.getSettings(classId),
        studentsService.listSections(classId, true),
      ]);
      applyServerSettings(settings.global_settings, settings.section_overrides);
      setSectionOptions(sections);
      setDirty(false);
    } catch (error) {
      alert(`Failed to load topic settings: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!classId) {
      setGlobalDrafts({});
      setSectionOverrideDrafts({});
      setSectionOptions([]);
      setSelectedSection(null);
      setDirty(false);
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  useEffect(() => {
    if (selectedSection === null) return;
    if (!sectionOptions.includes(selectedSection)) {
      setSelectedSection(null);
    }
  }, [sectionOptions, selectedSection]);

  const updateTopic = (topicId: string, patch: Partial<TopicDraft>) => {
    if (selectedSection === null) {
      setGlobalDrafts((prev) => ({
        ...prev,
        [topicId]: { ...prev[topicId], ...patch },
      }));
    } else {
      const globalDraft = globalDrafts[topicId];
      if (!globalDraft) return;
      setSectionOverrideDrafts((prev) => {
        const currentSection = prev[selectedSection] ?? {};
        const base = currentSection[topicId] ?? globalDraft;
        const next: TopicDraft = { ...base, ...patch };
        if (draftsMatchGlobal(next, globalDraft)) {
          const { [topicId]: _removed, ...rest } = currentSection;
          return { ...prev, [selectedSection]: rest };
        }
        return {
          ...prev,
          [selectedSection]: {
            ...currentSection,
            [topicId]: next,
          },
        };
      });
    }
    setDirty(true);
  };

  const isSectionMode = selectedSection !== null;

  const topicEnableOverrideSections = useMemo(
    () => buildTopicOverrideSections(
      sectionOverrideDrafts,
      globalDrafts,
      draftsMatchGlobalEnable,
    ),
    [sectionOverrideDrafts, globalDrafts],
  );

  const topicAssignmentOverrideSections = useMemo(
    () => buildTopicOverrideSections(
      sectionOverrideDrafts,
      globalDrafts,
      draftsMatchGlobalAssignment,
    ),
    [sectionOverrideDrafts, globalDrafts],
  );

  const hasEnableOverride = (topicId: string) => {
    if (selectedSection === null) return false;
    const override = sectionOverrideDrafts[selectedSection]?.[topicId];
    const global = globalDrafts[topicId];
    if (!override || !global) return false;
    return !draftsMatchGlobalEnable(override, global);
  };

  const hasAssignmentOverride = (topicId: string) => {
    if (selectedSection === null) return false;
    const override = sectionOverrideDrafts[selectedSection]?.[topicId];
    const global = globalDrafts[topicId];
    if (!override || !global) return false;
    return !draftsMatchGlobalAssignment(override, global);
  };

  const effectiveDraft = (topicId: string): TopicDraft => {
    if (selectedSection !== null) {
      return sectionOverrideDrafts[selectedSection]?.[topicId] ?? globalDrafts[topicId];
    }
    return globalDrafts[topicId];
  };

  const isTopicEffectivelyOn = (topicId: string): boolean => {
    const draft = effectiveDraft(topicId);
    return draft ? draft.is_enabled && !isFuture(draft.available_at) : true;
  };

  const updateGroupEnabled = (group: TopicGroup, enabled: boolean) => {
    for (const topic of group.topics) {
      updateTopic(topic.id, { is_enabled: enabled, available_at: null });
    }
  };

  const updateGroupSchedule = (group: TopicGroup, dateValue: string, timeValue: string) => {
    const iso = toIsoFromLocalParts(dateValue, timeValue);
    if (!iso) return;
    for (const topic of group.topics) {
      updateTopic(topic.id, { is_enabled: false, available_at: iso });
    }
  };

  const updateGroupAssigned = (group: TopicGroup, assigned: boolean) => {
    for (const topic of group.topics) {
      updateTopic(topic.id, { is_assigned: assigned, due_at: null });
    }
  };

  const updateGroupDueSchedule = (group: TopicGroup, dateValue: string, timeValue: string) => {
    const iso = toIsoFromLocalParts(dateValue, timeValue);
    if (!iso) return;
    for (const topic of group.topics) {
      updateTopic(topic.id, { is_assigned: true, due_at: iso });
    }
  };

  const onSave = async () => {
    if (!classId || !dirty) return;
    setSaving(true);
    try {
      const payload = selectedSection === null
        ? Object.values(globalDrafts)
        : Object.values(sectionOverrideDrafts[selectedSection] ?? {});
      const settings = await classTopicSettingsService.updateSettings(
        classId,
        payload.map((draft) => ({
          topic_id: draft.topic_id,
          name: draft.name,
          is_enabled: draft.is_enabled,
          available_at: draft.available_at,
          is_assigned: draft.is_assigned,
          due_at: draft.due_at,
        })),
        {
          section: selectedSection,
          replace_scope: selectedSection !== null,
        },
      );
      applyServerSettings(settings.global_settings, settings.section_overrides);
      setDirty(false);
    } catch (error) {
      alert(`Failed to save topic settings: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  if (!classId) {
    return (
      <div className="topic-settings-page">
        <div className="topic-settings-empty">
          Select a class to manage topic availability.
        </div>
      </div>
    );
  }

  return (
    <div className="topic-settings-page">
      <div className="topic-settings-header topic-settings-header--compact">
        <p className="topic-settings-timezone">Times are displayed in local timezone: {timezoneLabel}</p>
        <div className="topic-settings-actions">
          <select
            className="topic-settings-datetime"
            value={selectedSection ?? ALL_SECTIONS_VALUE}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedSection(value === ALL_SECTIONS_VALUE ? null : value);
            }}
          >
            <option value={ALL_SECTIONS_VALUE}>All Sections (global)</option>
            {sectionOptions.map((section) => (
              <option key={section === "" ? "__empty_section__" : section} value={section}>
                {section === "" ? "(No Section)" : section}
              </option>
            ))}
          </select>
          {dirty && <span className="topic-settings-dirty">Unsaved changes</span>}
          <button
            type="button"
            className="topic-settings-save"
            onClick={onSave}
            disabled={!dirty || saving || loading}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading topic settings...</p>
      ) : (
        <div className="topic-settings-groups">
          {TOPICS.map((item) => {
            if (!(item instanceof TopicGroup)) return null;
            const isOpen = expanded.has(item.id);
            const groupEnabledStates = item.topics.map((topic) => isTopicEffectivelyOn(topic.id));
            const groupAllEnabled = groupEnabledStates.every(Boolean);
            const groupSomeEnabled = groupEnabledStates.some(Boolean);
            const groupCheckboxIndeterminate = groupSomeEnabled && !groupAllEnabled;
            const groupEnableOverrideSections = [
              ...new Set(
                item.topics.flatMap((topic) => topicEnableOverrideSections.get(topic.id) ?? []),
              ),
            ].sort(compareSections);
            const groupAssignmentOverrideSections = [
              ...new Set(
                item.topics.flatMap((topic) => topicAssignmentOverrideSections.get(topic.id) ?? []),
              ),
            ].sort(compareSections);
            const groupHasEnableSectionOverrides = groupEnableOverrideSections.length > 0;
            const groupHasAssignmentSectionOverrides = groupAssignmentOverrideSections.length > 0;
            const groupHasAnyEnableOverride = item.topics.some((topic) => hasEnableOverride(topic.id));
            const groupHasAnyAssignmentOverride = item.topics.some((topic) => hasAssignmentOverride(topic.id));
            const groupHasAnyEnableInherited =
              isSectionMode && item.topics.some((topic) => !hasEnableOverride(topic.id));
            const groupHasAnyAssignmentInherited =
              isSectionMode && item.topics.some((topic) => !hasAssignmentOverride(topic.id));
            const groupDrafts = item.topics
              .map((topic) => effectiveDraft(topic.id))
              .filter(Boolean) as TopicDraft[];
            const firstGroupDate = groupDrafts.length
              ? toLocalDateValue(groupDrafts[0].available_at)
              : "";
            const sameGroupDate = groupDrafts.every(
              (draft) => toLocalDateValue(draft.available_at) === firstGroupDate,
            );
            const groupDateValue = sameGroupDate ? firstGroupDate : "";
            const firstGroupTime = groupDrafts.length
              ? (toLocalTimeValue(groupDrafts[0].available_at) || "00:00")
              : "00:00";
            const sameGroupTime = groupDrafts.every(
              (draft) => (toLocalTimeValue(draft.available_at) || "00:00") === firstGroupTime,
            );
            const groupTimeValue = sameGroupDate && sameGroupTime ? firstGroupTime : "00:00";
            const groupAssignedStates = item.topics.map((topic) => effectiveDraft(topic.id)?.is_assigned ?? false);
            const groupAllAssigned = groupAssignedStates.every(Boolean);
            const groupSomeAssigned = groupAssignedStates.some(Boolean);
            const groupAssignedIndeterminate = groupSomeAssigned && !groupAllAssigned;
            const firstGroupDueDate = groupDrafts.length
              ? toLocalDateValue(groupDrafts[0].due_at)
              : "";
            const sameGroupDueDate = groupDrafts.every(
              (draft) => toLocalDateValue(draft.due_at) === firstGroupDueDate,
            );
            const groupDueDateValue = sameGroupDueDate ? firstGroupDueDate : "";
            const firstGroupDueTime = groupDrafts.length
              ? (toLocalTimeValue(groupDrafts[0].due_at) || DEFAULT_DUE_TIME)
              : DEFAULT_DUE_TIME;
            const sameGroupDueTime = groupDrafts.every(
              (draft) => (toLocalTimeValue(draft.due_at) || DEFAULT_DUE_TIME) === firstGroupDueTime,
            );
            const groupDueTimeValue = sameGroupDueDate && sameGroupDueTime ? firstGroupDueTime : DEFAULT_DUE_TIME;

            return (
              <section key={item.id} className="topic-settings-group">
                <div className="topic-settings-group-header">
                  <div className="topic-settings-group-title-col">
                    <button
                      type="button"
                      className="topic-settings-group-title"
                      onClick={() =>
                        setExpanded((prev) => {
                          const next = new Set(prev);
                          if (next.has(item.id)) next.delete(item.id);
                          else next.add(item.id);
                          return next;
                        })
                      }
                    >
                      <span className={`expand-icon ${isOpen ? "expanded" : ""}`}>▶</span>
                      {item.name}
                    </button>
                  </div>

                  <div className="topic-settings-group-side">
                    <div className="topic-settings-meta-row">
                      <div className="topic-settings-badge-row">
                        {!isSectionMode && groupHasEnableSectionOverrides && (
                          <span
                            className="topic-settings-override-badge"
                            title={formatOverriddenInLabel(groupEnableOverrideSections)}
                          >
                            {formatOverriddenInLabel(groupEnableOverrideSections)}
                          </span>
                        )}
                        {groupHasAnyEnableInherited && (
                          <span className="topic-settings-inherited-badge" title="Availability inherits from All Sections">Inherited</span>
                        )}
                        {groupHasAnyEnableOverride && (
                          <span className="topic-settings-override-active-badge" title="Availability overrides the global default">Overrides</span>
                        )}
                      </div>
                      <div className="topic-settings-control-row">
                      <label className="topic-settings-toggle">
                        <input
                          type="checkbox"
                          ref={(el) => {
                            if (el) el.indeterminate = groupCheckboxIndeterminate;
                          }}
                          checked={groupAllEnabled}
                          onChange={(e) => updateGroupEnabled(item, e.target.checked)}
                        />
                        All enabled
                      </label>
                      <input
                        type="date"
                        className={datetimeClassName(groupAllEnabled)}
                        value={groupDateValue}
                        onChange={(e) =>
                          updateGroupSchedule(item, e.target.value, groupTimeValue || "00:00")
                        }
                        title="Schedule date for all topics in this group"
                      />
                      <input
                        type="time"
                        step={60}
                        className={datetimeClassName(groupAllEnabled)}
                        value={groupTimeValue}
                        onChange={(e) => {
                          if (!groupDateValue) return;
                          updateGroupSchedule(item, groupDateValue, e.target.value);
                        }}
                        disabled={!groupDateValue}
                        title="Schedule time for all topics in this group"
                      />
                      </div>
                    </div>
                    <div className="topic-settings-meta-row">
                      <div className="topic-settings-badge-row">
                        {!isSectionMode && groupHasAssignmentSectionOverrides && (
                          <span
                            className="topic-settings-override-badge"
                            title={formatOverriddenInLabel(groupAssignmentOverrideSections)}
                          >
                            {formatOverriddenInLabel(groupAssignmentOverrideSections)}
                          </span>
                        )}
                        {groupHasAnyAssignmentInherited && (
                          <span className="topic-settings-inherited-badge" title="Assignment inherits from All Sections">Inherited</span>
                        )}
                        {groupHasAnyAssignmentOverride && (
                          <span className="topic-settings-override-active-badge" title="Assignment overrides the global default">Overrides</span>
                        )}
                      </div>
                      <div className="topic-settings-control-row">
                      <label className="topic-settings-toggle">
                        <input
                          type="checkbox"
                          ref={(el) => {
                            if (el) el.indeterminate = groupAssignedIndeterminate;
                          }}
                          checked={groupAllAssigned}
                          onChange={(e) => updateGroupAssigned(item, e.target.checked)}
                        />
                        All assigned
                      </label>
                      <input
                        type="date"
                        className={datetimeClassName(!groupAllAssigned)}
                        value={groupDueDateValue}
                        onChange={(e) =>
                          updateGroupDueSchedule(item, e.target.value, groupDueTimeValue || DEFAULT_DUE_TIME)
                        }
                        title="Due date for all topics in this group"
                      />
                      <input
                        type="time"
                        step={60}
                        className={datetimeClassName(!groupAllAssigned)}
                        value={groupDueTimeValue}
                        onChange={(e) => {
                          if (!groupDueDateValue) return;
                          updateGroupDueSchedule(item, groupDueDateValue, e.target.value);
                        }}
                        disabled={!groupDueDateValue}
                        title="Due time for all topics in this group"
                      />
                      </div>
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="topic-settings-topic-list">
                    {item.topics.map((topic) => {
                      const draft = effectiveDraft(topic.id);
                      if (!draft) return null;
                      const enableOverrideSections = topicEnableOverrideSections.get(topic.id);
                      const assignmentOverrideSections = topicAssignmentOverrideSections.get(topic.id);
                      const status = isFuture(draft.available_at)
                        ? "scheduled"
                        : draft.is_enabled
                          ? "on"
                          : "off";
                      const assignmentStatus = draft.is_assigned ? "assigned" : "unassigned";
                      const topicEnabled = isTopicEffectivelyOn(topic.id);

                      return (
                        <div key={topic.id} className="topic-settings-topic-row">
                          <div className="topic-settings-topic-label-col">
                            <div className="topic-settings-topic-name">{topic.name}</div>
                          </div>
                          <div className="topic-settings-topic-side">
                            <div className="topic-settings-meta-row">
                              <div className="topic-settings-badge-row">
                                <span className={`topic-status ${status}`}>{status}</span>
                                {!isSectionMode && enableOverrideSections && enableOverrideSections.length > 0 && (
                                  <span
                                    className="topic-settings-override-badge"
                                    title={formatOverriddenInLabel(enableOverrideSections)}
                                  >
                                    {formatOverriddenInLabel(enableOverrideSections)}
                                  </span>
                                )}
                                {isSectionMode && !hasEnableOverride(topic.id) && (
                                  <span className="topic-settings-inherited-badge" title="Availability inherited from All Sections">Inherited</span>
                                )}
                                {isSectionMode && hasEnableOverride(topic.id) && (
                                  <span className="topic-settings-override-active-badge" title="Availability overrides the global default">Overrides</span>
                                )}
                              </div>
                              <div className="topic-settings-control-row">
                                <label className="topic-settings-toggle">
                                  <input
                                    type="checkbox"
                                    checked={isTopicEffectivelyOn(topic.id)}
                                    onChange={(e) =>
                                      updateTopic(topic.id, {
                                        is_enabled: e.target.checked,
                                        available_at: null,
                                      })
                                    }
                                  />
                                  Enabled
                                </label>
                                <input
                                  type="date"
                                  className={datetimeClassName(topicEnabled)}
                                  value={toLocalDateValue(draft.available_at)}
                                  onChange={(e) =>
                                    updateTopic(topic.id, {
                                      is_enabled: false,
                                      available_at: toIsoFromLocalParts(
                                        e.target.value,
                                        toLocalTimeValue(draft.available_at) || "00:00",
                                      ),
                                    })
                                  }
                                />
                                <input
                                  type="time"
                                  step={60}
                                  className={datetimeClassName(topicEnabled)}
                                  value={toLocalTimeValue(draft.available_at) || "00:00"}
                                  disabled={!toLocalDateValue(draft.available_at)}
                                  onChange={(e) => {
                                    const dateValue = toLocalDateValue(draft.available_at);
                                    if (!dateValue) return;
                                    updateTopic(topic.id, {
                                      is_enabled: false,
                                      available_at: toIsoFromLocalParts(dateValue, e.target.value),
                                    });
                                  }}
                                />
                              </div>
                            </div>
                            <div className="topic-settings-meta-row">
                              <div className="topic-settings-badge-row">
                                <span className={`topic-status topic-status--assignment ${assignmentStatus}`}>
                                  {assignmentStatus}
                                </span>
                                {!isSectionMode && assignmentOverrideSections && assignmentOverrideSections.length > 0 && (
                                  <span
                                    className="topic-settings-override-badge"
                                    title={formatOverriddenInLabel(assignmentOverrideSections)}
                                  >
                                    {formatOverriddenInLabel(assignmentOverrideSections)}
                                  </span>
                                )}
                                {isSectionMode && !hasAssignmentOverride(topic.id) && (
                                  <span className="topic-settings-inherited-badge" title="Assignment inherited from All Sections">Inherited</span>
                                )}
                                {isSectionMode && hasAssignmentOverride(topic.id) && (
                                  <span className="topic-settings-override-active-badge" title="Assignment overrides the global default">Overrides</span>
                                )}
                              </div>
                              <div className="topic-settings-control-row">
                                <label className="topic-settings-toggle">
                                  <input
                                    type="checkbox"
                                    checked={draft.is_assigned}
                                    onChange={(e) =>
                                      updateTopic(topic.id, {
                                        is_assigned: e.target.checked,
                                        due_at: null,
                                      })
                                    }
                                  />
                                  Assigned
                                </label>
                                <input
                                  type="date"
                                  className={datetimeClassName(!draft.is_assigned)}
                                  value={toLocalDateValue(draft.due_at)}
                                  onChange={(e) =>
                                    updateTopic(topic.id, {
                                      is_assigned: true,
                                      due_at: toIsoFromLocalParts(
                                        e.target.value,
                                        toLocalTimeValue(draft.due_at) || DEFAULT_DUE_TIME,
                                      ),
                                    })
                                  }
                                />
                                <input
                                  type="time"
                                  step={60}
                                  className={datetimeClassName(!draft.is_assigned)}
                                  value={toLocalTimeValue(draft.due_at) || DEFAULT_DUE_TIME}
                                  disabled={!toLocalDateValue(draft.due_at)}
                                  onChange={(e) => {
                                    const dateValue = toLocalDateValue(draft.due_at);
                                    if (!dateValue) return;
                                    updateTopic(topic.id, {
                                      is_assigned: true,
                                      due_at: toIsoFromLocalParts(dateValue, e.target.value),
                                    });
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
