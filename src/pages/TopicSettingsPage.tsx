import { useEffect, useMemo, useState } from "react";
import { TOPICS } from "../all_topics";
import { Topic, TopicGroup } from "../topics";
import {
  classTopicSettingsService,
  type ClassTopicSetting,
} from "../services/classTopicSettings";
import "./TopicSettingsPage.css";

type TopicDraft = {
  topic_id: string;
  name: string;
  is_enabled: boolean;
  available_at: string | null;
};

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
  const time = /^\d{2}:\d{2}$/.test(timeValue) ? timeValue : "00:00";
  return new Date(`${dateValue}T${time}`).toISOString();
}

function isFuture(iso: string | null): boolean {
  if (!iso) return false;
  return parseServerUtc(iso).getTime() > Date.now();
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
  const [drafts, setDrafts] = useState<Record<string, TopicDraft>>({});
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

  const load = async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const settings = await classTopicSettingsService.getSettings(classId);
      const byId = new Map<string, ClassTopicSetting>(
        settings.map((s) => [s.topic_id, s]),
      );
      const next: Record<string, TopicDraft> = {};
      for (const topic of allTopics) {
        const setting = byId.get(topic.id);
        next[topic.id] = {
          topic_id: topic.id,
          name: topic.name,
          is_enabled: setting?.is_enabled ?? setting?.effective_enabled ?? true,
          available_at: setting?.available_at ?? null,
        };
      }
      setDrafts(next);
      setDirty(false);
    } catch (error) {
      alert(`Failed to load topic settings: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!classId) {
      setDrafts({});
      setDirty(false);
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const updateTopic = (topicId: string, patch: Partial<TopicDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [topicId]: { ...prev[topicId], ...patch },
    }));
    setDirty(true);
  };

  const updateGroupEnabled = (group: TopicGroup, enabled: boolean) => {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const topic of group.topics) {
        next[topic.id] = {
          ...next[topic.id],
          is_enabled: enabled,
          available_at: null,
        };
      }
      return next;
    });
    setDirty(true);
  };

  const updateGroupSchedule = (group: TopicGroup, dateValue: string, timeValue: string) => {
    const iso = toIsoFromLocalParts(dateValue, timeValue);
    if (!iso) return;
    setDrafts((prev) => {
      const next = { ...prev };
      for (const topic of group.topics) {
        next[topic.id] = {
          ...next[topic.id],
          is_enabled: false,
          available_at: iso,
        };
      }
      return next;
    });
    setDirty(true);
  };

  const onSave = async () => {
    if (!classId || !dirty) return;
    setSaving(true);
    try {
      const settings = await classTopicSettingsService.updateSettings(
        classId,
        Object.values(drafts).map((draft) => ({
          topic_id: draft.topic_id,
          name: draft.name,
          is_enabled: draft.is_enabled,
          available_at: draft.available_at,
        })),
      );
      const byId = new Map<string, ClassTopicSetting>(
        settings.map((s) => [s.topic_id, s]),
      );
      setDrafts((prev) => {
        const next = { ...prev };
        for (const [topicId, draft] of Object.entries(next)) {
          const saved = byId.get(topicId);
          if (!saved) continue;
          next[topicId] = {
            ...draft,
            is_enabled: saved.is_enabled ?? saved.effective_enabled ?? true,
            available_at: saved.available_at ?? null,
          };
        }
        return next;
      });
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
        <p className="topic-settings-timezone">Times in local timezone: {timezoneLabel}</p>
        <div className="topic-settings-actions">
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
            const groupAllEnabled = item.topics.every((topic) => {
              const draft = drafts[topic.id];
              return draft ? draft.is_enabled && !isFuture(draft.available_at) : true;
            });
            const groupDrafts = item.topics
              .map((topic) => drafts[topic.id])
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

            return (
              <section key={item.id} className="topic-settings-group">
                <div className="topic-settings-group-header">
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

                  <div className="topic-settings-group-controls">
                    <label className="topic-settings-toggle">
                      <input
                        type="checkbox"
                        checked={groupAllEnabled}
                        onChange={(e) => updateGroupEnabled(item, e.target.checked)}
                      />
                      All on
                    </label>
                    <input
                      type="date"
                      className="topic-settings-datetime"
                      value={groupDateValue}
                      onChange={(e) =>
                        updateGroupSchedule(item, e.target.value, groupTimeValue || "00:00")
                      }
                      title="Schedule date for all topics in this group"
                    />
                    <input
                      type="time"
                      step={60}
                      className="topic-settings-datetime"
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

                {isOpen && (
                  <div className="topic-settings-topic-list">
                    {item.topics.map((topic) => {
                      const draft = drafts[topic.id];
                      if (!draft) return null;
                      const status = isFuture(draft.available_at)
                        ? "scheduled"
                        : draft.is_enabled
                          ? "on"
                          : "off";

                      return (
                        <div key={topic.id} className="topic-settings-topic-row">
                          <div className="topic-settings-topic-name">{topic.name}</div>
                          <div className="topic-settings-topic-controls">
                            <span className={`topic-status ${status}`}>{status}</span>
                            <label className="topic-settings-toggle">
                              <input
                                type="checkbox"
                                checked={draft.is_enabled && !isFuture(draft.available_at)}
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
                              className="topic-settings-datetime"
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
                              className="topic-settings-datetime"
                              value={toLocalTimeValue(draft.available_at) || "00:00"}
                              onChange={(e) => {
                                const dateValue = toLocalDateValue(draft.available_at);
                                if (!dateValue) return;
                                updateTopic(topic.id, {
                                  is_enabled: false,
                                  available_at: toIsoFromLocalParts(dateValue, e.target.value),
                                });
                              }}
                              disabled={!toLocalDateValue(draft.available_at)}
                            />
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
