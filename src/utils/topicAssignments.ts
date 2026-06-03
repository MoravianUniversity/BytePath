import { TOPICS } from '../all_topics';
import { Topic, TopicGroup } from '../topics';
import type { ClassTopicSetting, ClassTopicSettingsResponse } from '../services/classTopicSettings';
import type { TopicProgress } from '../services/progress';
import type { StudentResponse } from '../services/responses';
import { parseServerUtc, serverTimestampMs } from '../util';

export type EffectiveTopicAssignment = {
  topicId: string;
  isAssigned: boolean;
  dueAt: string | null;
  effectiveEnabled: boolean;
};

export type AssignmentListItem = {
  topic: TopicProgress;
  dueAt: string | null;
  hasStarted: boolean;
  isIncomplete: boolean;
};

export type AssignmentDueSort = 'due-asc' | 'due-desc' | 'priority';

export type AssignmentSortContext = {
  completedTopicIds: Set<string>;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const topicById = (() => {
  const map = new Map<string, Topic>();
  for (const item of TOPICS) {
    if (item instanceof TopicGroup) {
      for (const topic of item.topics) {
        map.set(topic.id, topic);
      }
    } else if (item instanceof Topic) {
      map.set(item.id, item);
    }
  }
  return map;
})();

const topicCurriculumOrder = (() => {
  const order = new Map<string, number>();
  let index = 0;
  for (const item of TOPICS) {
    if (item instanceof TopicGroup) {
      for (const topic of item.topics) {
        order.set(topic.id, index++);
      }
    } else if (item instanceof Topic) {
      order.set(item.id, index++);
    }
  }
  return order;
})();

function assignmentMatchesGlobal(section: ClassTopicSetting, global: ClassTopicSetting | undefined): boolean {
  if (!global) return false;
  return (
    section.is_assigned === global.is_assigned
    && (section.due_at ?? null) === (global.due_at ?? null)
  );
}

export function resolveEffectiveAssignments(
  settings: ClassTopicSettingsResponse,
  studentSection: string | null | undefined,
): Map<string, EffectiveTopicAssignment> {
  const globalByTopic = new Map(
    settings.global_settings.map((row) => [row.topic_id, row]),
  );
  const sectionKey = studentSection?.trim() ?? '';
  const sectionRows = settings.section_overrides[sectionKey] ?? [];

  const result = new Map<string, EffectiveTopicAssignment>();

  for (const global of settings.global_settings) {
    const section = sectionRows.find((row) => row.topic_id === global.topic_id);
    const effective = section && !assignmentMatchesGlobal(section, global) ? section : global;
    result.set(global.topic_id, {
      topicId: global.topic_id,
      isAssigned: Boolean(effective.is_assigned),
      dueAt: effective.due_at ?? null,
      effectiveEnabled: effective.effective_enabled !== false,
    });
  }

  for (const row of sectionRows) {
    if (result.has(row.topic_id)) continue;
    const global = globalByTopic.get(row.topic_id);
    if (global && assignmentMatchesGlobal(row, global)) continue;
    result.set(row.topic_id, {
      topicId: row.topic_id,
      isAssigned: Boolean(row.is_assigned),
      dueAt: row.due_at ?? null,
      effectiveEnabled: row.effective_enabled !== false,
    });
  }

  return result;
}

/** Visible topics that are effectively enabled for this student (respects section overrides). */
export function buildEffectiveEnabledTopicIds(
  settings: ClassTopicSettingsResponse | null,
  studentSection: string | null | undefined,
  visibleTopicIds: Set<string>,
): Set<string> {
  if (!settings) {
    return new Set(visibleTopicIds);
  }

  const effective = resolveEffectiveAssignments(settings, studentSection);
  const enabled = new Set<string>();
  for (const topicId of visibleTopicIds) {
    const row = effective.get(topicId);
    if (row === undefined || row.effectiveEnabled) {
      enabled.add(topicId);
    }
  }
  return enabled;
}

const topicSubtopicCounts = (() => {
  const counts = new Map<string, number>();
  for (const item of TOPICS) {
    if (item instanceof TopicGroup) {
      for (const topic of item.topics) {
        counts.set(topic.id, topic.subtopics.length);
      }
    } else if (item instanceof Topic) {
      counts.set(item.id, item.subtopics.length);
    }
  }
  return counts;
})();

export function getTopicSubtopicCount(topicId: string): number {
  return topicSubtopicCounts.get(topicId) ?? 0;
}

export function hasTopicProgressStarted(progress: TopicProgress | undefined): boolean {
  if (!progress) return false;
  return (
    progress.questions_answered > 0
    || progress.max_subtopics_completed > 0
    || progress.last_accessed != null
  );
}

export function isAssignmentIncomplete(progress: TopicProgress, totalSubtopics: number): boolean {
  if (totalSubtopics <= 0) return true;
  return progress.max_subtopics_completed < totalSubtopics;
}

export function buildAssignmentProgress(
  topicId: string,
  topicName: string,
  progressByTopic: Map<string, TopicProgress>,
): TopicProgress {
  const existing = progressByTopic.get(topicId);
  if (existing) return existing;
  const totalSubtopics = getTopicSubtopicCount(topicId);
  return {
    user_id: 0,
    topic: topicId,
    topic_name: topicName,
    subtopics_completed: 0,
    max_subtopics_completed: 0,
    total_subtopics: totalSubtopics,
    completion_percentage: 0,
    best_completion_percentage: 0,
    questions_answered: 0,
    last_accessed: null,
  };
}

export function buildAssignmentListItems(
  assignments: Map<string, EffectiveTopicAssignment>,
  progress: TopicProgress[],
  topicNames: Map<string, string>,
  visibleTopicIds: Set<string>,
  now: Date = new Date(),
): { upcoming: AssignmentListItem[]; past: AssignmentListItem[] } {
  const progressByTopic = new Map(progress.map((row) => [row.topic, row]));
  const upcoming: AssignmentListItem[] = [];
  const past: AssignmentListItem[] = [];

  for (const [topicId, assignment] of assignments) {
    if (!assignment.isAssigned || !assignment.effectiveEnabled) continue;
    if (!visibleTopicIds.has(topicId)) continue;

    const topicName = topicNames.get(topicId) ?? topicId;
    const topicProgress = buildAssignmentProgress(topicId, topicName, progressByTopic);
    const totalSubtopics = topicProgress.total_subtopics || getTopicSubtopicCount(topicId);
    const item: AssignmentListItem = {
      topic: topicProgress,
      dueAt: assignment.dueAt,
      hasStarted: hasTopicProgressStarted(progressByTopic.get(topicId)),
      isIncomplete: isAssignmentIncomplete(topicProgress, totalSubtopics),
    };

    const dueMs = assignment.dueAt ? parseServerUtc(assignment.dueAt).getTime() : null;
    if (dueMs != null && dueMs < now.getTime()) {
      past.push(item);
    } else {
      upcoming.push(item);
    }
  }

  return { upcoming, past };
}

function dueTimestamp(dueAt: string | null): number {
  return dueAt ? parseServerUtc(dueAt).getTime() : Number.POSITIVE_INFINITY;
}

function countUnmetDependencies(
  topic: Topic | undefined,
  completedTopicIds: Set<string>,
): number {
  if (!topic) return 0;
  return topic.dependencies.filter((dep) => !completedTopicIds.has(dep.id)).length;
}

function compareByRequirements(
  topicIdA: string,
  topicIdB: string,
  completedTopicIds: Set<string>,
): number {
  const topicA = topicById.get(topicIdA);
  const topicB = topicById.get(topicIdB);

  const aRequirementsMet = topicA?.isAccessible(completedTopicIds) ?? true;
  const bRequirementsMet = topicB?.isAccessible(completedTopicIds) ?? true;
  if (aRequirementsMet !== bRequirementsMet) {
    return aRequirementsMet ? -1 : 1;
  }

  const aUnmet = countUnmetDependencies(topicA, completedTopicIds);
  const bUnmet = countUnmetDependencies(topicB, completedTopicIds);
  if (aUnmet !== bUnmet) {
    return aUnmet - bUnmet;
  }

  const aOrder = topicCurriculumOrder.get(topicIdA) ?? Number.MAX_SAFE_INTEGER;
  const bOrder = topicCurriculumOrder.get(topicIdB) ?? Number.MAX_SAFE_INTEGER;
  if (aOrder !== bOrder) {
    return aOrder - bOrder;
  }

  return topicIdA.localeCompare(topicIdB);
}

function compareUpcomingByPriority(
  a: AssignmentListItem,
  b: AssignmentListItem,
  completedTopicIds: Set<string>,
): number {
  const aComplete = !a.isIncomplete;
  const bComplete = !b.isIncomplete;
  if (aComplete !== bComplete) {
    return aComplete ? 1 : -1;
  }

  const aDue = dueTimestamp(a.dueAt);
  const bDue = dueTimestamp(b.dueAt);
  if (aDue !== bDue) {
    return aDue - bDue;
  }

  const progressDiff = b.topic.best_completion_percentage - a.topic.best_completion_percentage;
  if (progressDiff !== 0) {
    return progressDiff;
  }

  if (!a.hasStarted && !b.hasStarted) {
    return compareByRequirements(a.topic.topic, b.topic.topic, completedTopicIds);
  }

  return a.topic.topic_name.localeCompare(b.topic.topic_name);
}

function compareByLowestDependency(
  topicIdA: string,
  topicIdB: string,
  completedTopicIds: Set<string>,
): number {
  return compareByRequirements(topicIdA, topicIdB, completedTopicIds);
}

function compareByHighestDependency(topicIdA: string, topicIdB: string): number {
  const topicA = topicById.get(topicIdA);
  const topicB = topicById.get(topicIdB);
  const aDeps = topicA?.dependencies.length ?? 0;
  const bDeps = topicB?.dependencies.length ?? 0;
  if (aDeps !== bDeps) {
    return bDeps - aDeps;
  }

  const aOrder = topicCurriculumOrder.get(topicIdA) ?? Number.MIN_SAFE_INTEGER;
  const bOrder = topicCurriculumOrder.get(topicIdB) ?? Number.MIN_SAFE_INTEGER;
  if (aOrder !== bOrder) {
    return bOrder - aOrder;
  }

  return topicIdB.localeCompare(topicIdA);
}

export function pickHeroContinueTopic(options: {
  upcomingAssignments: AssignmentListItem[];
  enabledTopicIds: Set<string>;
  completedTopicIds: Set<string>;
  progressByTopic: Map<string, TopicProgress>;
  topicNames: Map<string, string>;
}): TopicProgress | null {
  const {
    upcomingAssignments,
    enabledTopicIds,
    completedTopicIds,
    progressByTopic,
    topicNames,
  } = options;

  const resolveProgress = (topicId: string): TopicProgress =>
    progressByTopic.get(topicId)
    ?? buildAssignmentProgress(topicId, topicNames.get(topicId) ?? topicId, progressByTopic);

  const incompleteDue = upcomingAssignments.filter(
    (item) =>
      enabledTopicIds.has(item.topic.topic)
      && item.isIncomplete
      && item.dueAt != null,
  );
  if (incompleteDue.length > 0) {
    const [top] = sortAssignmentItems(incompleteDue, 'priority', { completedTopicIds });
    return top?.topic ?? null;
  }

  const incompleteAvailable: string[] = [];
  for (const topicId of enabledTopicIds) {
    const topic = topicById.get(topicId);
    if (!topic?.isAccessible(completedTopicIds)) continue;

    const topicProgress = resolveProgress(topicId);
    const totalSubtopics = topicProgress.total_subtopics || getTopicSubtopicCount(topicId);
    if (!isAssignmentIncomplete(topicProgress, totalSubtopics)) continue;

    incompleteAvailable.push(topicId);
  }

  if (incompleteAvailable.length > 0) {
    incompleteAvailable.sort((a, b) =>
      compareByLowestDependency(a, b, completedTopicIds),
    );
    return resolveProgress(incompleteAvailable[0]);
  }

  const enabled = [...enabledTopicIds];
  if (enabled.length === 0) return null;

  enabled.sort((a, b) => compareByHighestDependency(a, b));
  return resolveProgress(enabled[0]);
}

export function sortAssignmentItems(
  items: AssignmentListItem[],
  sort: AssignmentDueSort,
  context?: AssignmentSortContext,
): AssignmentListItem[] {
  const copy = [...items];

  if (sort === 'priority') {
    const completedTopicIds = context?.completedTopicIds ?? new Set<string>();
    return copy.sort((a, b) => compareUpcomingByPriority(a, b, completedTopicIds));
  }

  return copy.sort((a, b) => {
    const aDue = dueTimestamp(a.dueAt);
    const bDue = dueTimestamp(b.dueAt);
    if (aDue !== bDue) {
      return sort === 'due-asc' ? aDue - bDue : bDue - aDue;
    }
    return a.topic.topic_name.localeCompare(b.topic.topic_name);
  });
}

export function daysUntilDue(dueAt: string | null, now: Date = new Date()): number | null {
  if (!dueAt) return null;
  const dueMs = parseServerUtc(dueAt).getTime();
  if (Number.isNaN(dueMs)) return null;
  return (dueMs - now.getTime()) / MS_PER_DAY;
}

export function isUpcomingAssignmentDueSoon(
  assignment: EffectiveTopicAssignment | undefined,
  progress: TopicProgress | undefined,
  withinDays: number,
  now: Date = new Date(),
): boolean {
  if (!assignment?.isAssigned || assignment.effectiveEnabled === false) return false;
  if (!assignment.dueAt) return false;

  const dueMs = parseServerUtc(assignment.dueAt).getTime();
  if (Number.isNaN(dueMs) || dueMs < now.getTime()) return false;

  const days = daysUntilDue(assignment.dueAt, now);
  if (days == null || days > withinDays) return false;

  const totalSubtopics = progress?.total_subtopics || getTopicSubtopicCount(assignment.topicId);
  const topicProgress = progress ?? buildAssignmentProgress(
    assignment.topicId,
    assignment.topicId,
    new Map(),
  );
  return isAssignmentIncomplete(topicProgress, totalSubtopics);
}

export function responsesBeforeDueDate(
  responses: StudentResponse[],
  dueAt: string | null,
): StudentResponse[] {
  if (!dueAt) return responses;
  const dueMs = serverTimestampMs(dueAt);
  if (!dueMs) return responses;
  return responses.filter((r) => serverTimestampMs(r.attempted_at) <= dueMs);
}

/** Reconstruct topic progress and responses as they stood at the assignment due date. */
export function buildProgressAsOfDueDate(
  topic: TopicProgress,
  responses: StudentResponse[],
  dueAt: string | null,
): { progress: TopicProgress; responses: StudentResponse[] } {
  const clipped = responsesBeforeDueDate(responses, dueAt);
  if (!dueAt) {
    return { progress: topic, responses: clipped };
  }

  const latestBySubtopic = new Map<string, StudentResponse>();
  for (const response of clipped) {
    const existing = latestBySubtopic.get(response.subtopic_type);
    if (
      !existing
      || serverTimestampMs(response.attempted_at) > serverTimestampMs(existing.attempted_at)
    ) {
      latestBySubtopic.set(response.subtopic_type, response);
    }
  }

  let completedSubtopics = 0;
  for (const response of latestBySubtopic.values()) {
    if (response.is_correct) {
      completedSubtopics += 1;
    }
  }

  const totalSubtopics = topic.total_subtopics || getTopicSubtopicCount(topic.topic);
  const completionPercentage = totalSubtopics > 0
    ? (completedSubtopics / totalSubtopics) * 100
    : 0;

  let lastAccessed: string | null = null;
  for (const response of clipped) {
    if (
      !lastAccessed
      || serverTimestampMs(response.attempted_at) > serverTimestampMs(lastAccessed)
    ) {
      lastAccessed = response.attempted_at;
    }
  }

  return {
    progress: {
      ...topic,
      subtopics_completed: completedSubtopics,
      max_subtopics_completed: completedSubtopics,
      completion_percentage: completionPercentage,
      best_completion_percentage: completionPercentage,
      questions_answered: clipped.filter((r) => r.status !== 'skipped').length,
      last_accessed: lastAccessed,
    },
    responses: clipped,
  };
}
