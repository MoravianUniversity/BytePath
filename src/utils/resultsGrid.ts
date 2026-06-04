import { TOPICS } from '../all_topics';
import { TopicGroup } from '../topics';
import type {
  ClassResultsResponse,
  ResultsActivityBounds,
  ResultsProgressCell,
} from '../services/reports';
import type { ClassTopicSettingsResponse } from '../services/classTopicSettings';
import { resolveEffectiveAssignments } from './topicAssignments';
import { formatDateTime, parseServerUtc, serverTimestampMs } from '../util';

export type ResultsTimeRange = {
  startMs: number;
  endMs: number;
};

export type AssignmentGroupMode = 'topic' | 'due-time' | 'due-day';
export type GradeMetric = 'subtopics-completed';

export type ResultsColumn = {
  id: string;
  label: string;
  /** Second line under the column title. */
  subtitle?: string | null;
  /** Tooltip for the subtitle (e.g. topic names when subtitle is "N Topics"). */
  subtitleTitle?: string | null;
  topicIds: string[];
  dueAt: string | null;
};

const topicGroupByTopicId = (() => {
  const map = new Map<string, TopicGroup>();
  for (const item of TOPICS) {
    if (item instanceof TopicGroup) {
      for (const topic of item.topics) {
        map.set(topic.id, item);
      }
    }
  }
  return map;
})();

function resolveGroupColumnSubtitle(
  topicIds: string[],
  topicNames: Record<string, string>,
): { subtitle: string; subtitleTitle?: string } {
  if (topicIds.length === 1) {
    const topicId = topicIds[0];
    return { subtitle: topicNames[topicId] ?? topicId };
  }

  const topicNameList = topicIds.map((id) => topicNames[id] ?? id);
  const groups = topicIds.map((id) => topicGroupByTopicId.get(id));
  const firstGroup = groups[0];

  if (
    firstGroup
    && groups.every((group) => group?.id === firstGroup.id)
  ) {
    const columnTopicSet = new Set(topicIds);
    const groupTopicIds = firstGroup.topics.map((topic) => topic.id);
    const coversEntireGroup = groupTopicIds.length === columnTopicSet.size
      && groupTopicIds.every((id) => columnTopicSet.has(id));

    if (coversEntireGroup) {
      return {
        subtitle: firstGroup.name,
        subtitleTitle: `${firstGroup.name}: ${topicNameList.join(', ')}`,
      };
    }
  }

  return {
    subtitle: `${topicIds.length} Topics`,
    subtitleTitle: topicNameList.join(', '),
  };
}

export type AssignmentDueDatePip = {
  ms: number;
  markerLabel: string;
  title: string;
  /** Click sets range end to this pip instead of collapsing both handles. */
  isToday?: boolean;
};

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

/** End of today in local time (aligns with typical 11:59 PM due times). */
export function getTodayEndMs(now: Date = new Date()): number {
  const end = new Date(now);
  end.setHours(23, 59);
  return end.getTime();
}

function isTodayNearExistingPip(
  pips: AssignmentDueDatePip[],
  todayMs: number,
): boolean {
  return pips.some((pip) => Math.abs(pip.ms - todayMs) <= TWELVE_HOURS_MS);
}

export function isTodayWithinBounds(
  bounds: ResultsTimeRange,
  now: Date = new Date(),
): boolean {
  const todayMs = getTodayEndMs(now);
  return todayMs >= bounds.startMs && todayMs <= bounds.endMs;
}

/** Default selection: full start through today (or max if today is after max). */
export function getDefaultResultsTimeRange(
  bounds: ResultsTimeRange,
  now: Date = new Date(),
): ResultsTimeRange {
  const todayEnd = getTodayEndMs(now);
  return {
    startMs: bounds.startMs,
    endMs: Math.min(todayEnd, bounds.endMs),
  };
}

export function buildTimeRangeSliderPips(
  dueDatePips: AssignmentDueDatePip[],
  bounds: ResultsTimeRange,
  now: Date = new Date(),
): AssignmentDueDatePip[] {
  const pips = [...dueDatePips];
  if (!isTodayWithinBounds(bounds, now)) {
    return pips.sort((a, b) => a.ms - b.ms);
  }

  const todayMs = getTodayEndMs(now);
  if (isTodayNearExistingPip(pips, todayMs)) {
    return pips.sort((a, b) => a.ms - b.ms);
  }

  const existing = pips.find((pip) => pip.ms === todayMs);
  if (existing) {
    existing.markerLabel = 'Today';
    existing.title = existing.title ? `Today — ${existing.title}` : 'Today';
    existing.isToday = true;
  } else {
    pips.push({
      ms: todayMs,
      markerLabel: 'Today',
      title: 'Today',
      isToday: true,
    });
  }

  return pips.sort((a, b) => a.ms - b.ms);
}

const formatPipDate = (ms: number): string => {
  const date = new Date(ms);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
};

const formatDueDateTime = (dueAt: string): string => formatDateTime(dueAt) ?? dueAt;

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

const formatDueDay = (dueAt: string): string => {
  const date = parseServerUtc(dueAt);
  const withinOneYear = Math.abs(Date.now() - date.getTime()) < MS_PER_YEAR;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(withinOneYear ? {} : { year: 'numeric' }),
  });
};

const dueDayKey = (dueAt: string | null): string => {
  if (!dueAt) return '__no_due_date__';
  const date = parseServerUtc(dueAt);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

function collectAssignedTopics(
  settings: ClassTopicSettingsResponse,
  sectionFilter: string | null,
): Map<string, { dueAt: string | null }> {
  const assigned = new Map<string, { dueAt: string | null }>();

  if (sectionFilter != null) {
    const effective = resolveEffectiveAssignments(settings, sectionFilter);
    for (const [topicId, row] of effective) {
      if (row.isAssigned && row.effectiveEnabled) {
        assigned.set(topicId, { dueAt: row.dueAt });
      }
    }
    return assigned;
  }

  const globalEffective = resolveEffectiveAssignments(settings, null);
  for (const [topicId, row] of globalEffective) {
    if (row.isAssigned && row.effectiveEnabled) {
      assigned.set(topicId, { dueAt: row.dueAt });
    }
  }

  for (const sectionKey of Object.keys(settings.section_overrides)) {
    const effective = resolveEffectiveAssignments(settings, sectionKey);
    for (const [topicId, row] of effective) {
      if (row.isAssigned && row.effectiveEnabled) {
        if (!assigned.has(topicId)) {
          assigned.set(topicId, { dueAt: row.dueAt });
        }
      }
    }
  }

  return assigned;
}

/** Unique due-date positions for slider pips (within slider bounds). */
export function collectAssignmentDueDatePips(
  data: ClassResultsResponse,
  sectionFilter: string | null,
  bounds: ResultsTimeRange,
): AssignmentDueDatePip[] {
  const assigned = collectAssignedTopics(data.topic_settings, sectionFilter);
  const topicNames = data.topic_names;
  const namesByMs = new Map<number, string[]>();

  for (const [topicId, meta] of assigned) {
    if (!meta.dueAt) continue;
    const ms = serverTimestampMs(meta.dueAt);
    if (!ms || ms < bounds.startMs || ms > bounds.endMs) continue;
    const names = namesByMs.get(ms) ?? [];
    names.push(topicNames[topicId] ?? topicId);
    namesByMs.set(ms, names);
  }

  return [...namesByMs.entries()]
    .sort(([a], [b]) => a - b)
    .map(([ms, names]) => {
      const dateLabel = formatPipDate(ms);
      const markerLabel = names.length === 1
        ? dateLabel
        : `${dateLabel} (${names.length})`;
      return {
        ms,
        markerLabel,
        title: names.join(', '),
      };
    });
}

/** Newest / future due dates first; assignments without a due date last. */
function dueSortKey(dueAt: string | null): number {
  if (!dueAt) return Number.NEGATIVE_INFINITY;
  const ms = serverTimestampMs(dueAt);
  return ms || Number.NEGATIVE_INFINITY;
}

function compareEntriesByDueDesc(
  a: { dueAt: string | null; name: string },
  b: { dueAt: string | null; name: string },
): number {
  const aDue = dueSortKey(a.dueAt);
  const bDue = dueSortKey(b.dueAt);
  if (aDue !== bDue) return bDue - aDue;
  return a.name.localeCompare(b.name);
}

function compareColumnsByDueDesc(a: ResultsColumn, b: ResultsColumn): number {
  const aDue = dueSortKey(a.dueAt);
  const bDue = dueSortKey(b.dueAt);
  if (aDue !== bDue) return bDue - aDue;
  return a.label.localeCompare(b.label);
}

export function isDueDateInRange(
  dueAt: string | null,
  range: ResultsTimeRange,
  fullBounds: ResultsTimeRange,
): boolean {
  if (isFullActivityRange(range, fullBounds)) {
    return true;
  }
  if (!dueAt) {
    return false;
  }
  const dueMs = serverTimestampMs(dueAt);
  return dueMs >= range.startMs && dueMs <= range.endMs;
}

export function buildResultsColumns(
  data: ClassResultsResponse,
  groupMode: AssignmentGroupMode,
  sectionFilter: string | null,
  timeRange?: ResultsTimeRange | null,
  fullTimeBounds?: ResultsTimeRange | null,
): ResultsColumn[] {
  const assigned = collectAssignedTopics(data.topic_settings, sectionFilter);
  const topicNames = data.topic_names;

  let entries = [...assigned.entries()].map(([topicId, meta]) => ({
    topicId,
    dueAt: meta.dueAt,
    name: topicNames[topicId] ?? topicId,
  }));

  if (timeRange && fullTimeBounds) {
    entries = entries.filter((entry) =>
      isDueDateInRange(entry.dueAt, timeRange, fullTimeBounds),
    );
  }

  entries.sort((a, b) => compareEntriesByDueDesc(a, b));

  if (groupMode === 'topic') {
    return entries.map((entry) => ({
      id: entry.topicId,
      label: entry.name,
      subtitle: entry.dueAt ? formatDueDateTime(entry.dueAt) : null,
      topicIds: [entry.topicId],
      dueAt: entry.dueAt,
    }));
  }

  const groups = new Map<string, typeof entries>();
  for (const entry of entries) {
    const key = groupMode === 'due-time'
      ? (entry.dueAt ?? '__no_due_date__')
      : dueDayKey(entry.dueAt);
    const bucket = groups.get(key) ?? [];
    bucket.push(entry);
    groups.set(key, bucket);
  }

  const columns: ResultsColumn[] = [];
  for (const [key, topics] of groups) {
    topics.sort((a, b) => a.name.localeCompare(b.name));
    const dueAt = topics[0]?.dueAt ?? null;
    const topicIds = topics.map((t) => t.topicId);

    let label: string;
    if (key === '__no_due_date__') {
      label = 'No due date';
    } else if (groupMode === 'due-day') {
      label = dueAt ? formatDueDay(dueAt) : 'No due date';
    } else {
      label = dueAt ? formatDueDateTime(dueAt) : 'No due date';
    }

    const { subtitle, subtitleTitle } = resolveGroupColumnSubtitle(
      topicIds,
      data.topic_names,
    );

    columns.push({
      id: key,
      label,
      subtitle,
      subtitleTitle,
      topicIds,
      dueAt,
    });
  }

  columns.sort((a, b) => compareColumnsByDueDesc(a, b));

  return columns;
}

const MIN_RANGE_SPAN_MS = 60 * 60 * 1000;
const DEFAULT_RANGE_SPAN_MS = 90 * 24 * 60 * 60 * 1000;

function padTimeRange(startMs: number, endMs: number): ResultsTimeRange {
  if (endMs > startMs) {
    const span = endMs - startMs;
    if (span >= MIN_RANGE_SPAN_MS) {
      return { startMs, endMs };
    }
    const pad = Math.ceil((MIN_RANGE_SPAN_MS - span) / 2);
    return { startMs: startMs - pad, endMs: endMs + pad };
  }

  const center = startMs || endMs || Date.now();
  const half = MIN_RANGE_SPAN_MS / 2;
  return { startMs: center - half, endMs: center + half };
}

export function getActivityBoundsMs(
  bounds: ResultsActivityBounds | null | undefined,
): ResultsTimeRange | null {
  if (!bounds?.min || !bounds?.max) return null;
  const startMs = serverTimestampMs(bounds.min);
  const endMs = serverTimestampMs(bounds.max);
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return null;
  return padTimeRange(startMs, endMs);
}

function dueDatesRangeMs(
  settings: ClassTopicSettingsResponse,
  sectionFilter: string | null,
): ResultsTimeRange | null {
  const assigned = collectAssignedTopics(settings, sectionFilter);
  let minDue = Number.POSITIVE_INFINITY;
  let maxDue = Number.NEGATIVE_INFINITY;

  for (const { dueAt } of assigned.values()) {
    if (!dueAt) continue;
    const dueMs = serverTimestampMs(dueAt);
    if (!dueMs) continue;
    minDue = Math.min(minDue, dueMs);
    maxDue = Math.max(maxDue, dueMs);
  }

  if (!Number.isFinite(minDue) || !Number.isFinite(maxDue)) {
    return null;
  }
  return padTimeRange(minDue, maxDue);
}

/** Full slider range: union of student activity and assignment due dates. */
export function resolveResultsTimeBounds(
  bounds: ResultsActivityBounds | null | undefined,
  settings?: ClassTopicSettingsResponse | null,
  sectionFilter?: string | null,
): ResultsTimeRange {
  const candidates: ResultsTimeRange[] = [];

  const fromActivity = getActivityBoundsMs(bounds);
  if (fromActivity) candidates.push(fromActivity);

  if (settings) {
    const fromDueDates = dueDatesRangeMs(settings, sectionFilter ?? null);
    if (fromDueDates) candidates.push(fromDueDates);
  }

  if (candidates.length > 0) {
    const startMs = Math.min(...candidates.map((range) => range.startMs));
    const endMs = Math.max(...candidates.map((range) => range.endMs));
    return padTimeRange(startMs, endMs);
  }

  const endMs = Date.now();
  return { startMs: endMs - DEFAULT_RANGE_SPAN_MS, endMs };
}

export function isFullActivityRange(
  range: ResultsTimeRange,
  fullBounds: ResultsTimeRange,
): boolean {
  const tolerance = 60_000;
  return (
    range.startMs <= fullBounds.startMs + tolerance
    && range.endMs >= fullBounds.endMs - tolerance
  );
}

/** Keep the user's range when bounds change (e.g. section switch), clamped to new limits. */
export function clampTimeRange(
  range: ResultsTimeRange,
  bounds: ResultsTimeRange,
): ResultsTimeRange {
  const startMs = Math.max(bounds.startMs, Math.min(range.startMs, bounds.endMs));
  const endMs = Math.max(bounds.startMs, Math.min(range.endMs, bounds.endMs));
  if (startMs >= endMs) {
    return { startMs: bounds.startMs, endMs: bounds.endMs };
  }
  return { startMs, endMs };
}

export function getStudentTopicProgress(
  progress: ClassResultsResponse['progress'],
  studentId: number | null,
  topicId: string,
): ResultsProgressCell | null {
  if (!studentId) return null;
  return progress[String(studentId)]?.[topicId] ?? null;
}

export function isTopicAssignedToStudent(
  settings: ClassTopicSettingsResponse,
  studentSection: string,
  topicId: string,
): boolean {
  const effective = resolveEffectiveAssignments(settings, studentSection);
  const row = effective.get(topicId);
  return Boolean(row?.isAssigned && row.effectiveEnabled);
}

export function computeCellGrade(
  data: ClassResultsResponse,
  student: ClassResultsResponse['students'][number],
  column: ResultsColumn,
  metric: GradeMetric,
): number | null {
  const applicableTopics = column.topicIds.filter((topicId) =>
    isTopicAssignedToStudent(data.topic_settings, student.section, topicId),
  );

  if (applicableTopics.length === 0) {
    return null;
  }

  if (!student.student_id) {
    return 0;
  }

  const values: number[] = [];
  for (const topicId of applicableTopics) {
    if (metric === 'subtopics-completed') {
      const cell = getStudentTopicProgress(data.progress, student.student_id, topicId);
      values.push(cell?.best_completion_percentage ?? 0);
    }
  }

  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

const GRADE_COLOR_ALPHA = 0.42;

export function gradeColor(pct: number): string {
  const clamped = Math.max(0, Math.min(100, pct));
  const red = { r: 220, g: 53, b: 69 };
  const yellow = { r: 255, g: 193, b: 7 };
  const green = { r: 40, g: 167, b: 69 };

  let r: number;
  let g: number;
  let b: number;

  if (clamped <= 50) {
    const t = clamped / 50;
    r = Math.round(red.r + (yellow.r - red.r) * t);
    g = Math.round(red.g + (yellow.g - red.g) * t);
    b = Math.round(red.b + (yellow.b - red.b) * t);
  } else {
    const t = (clamped - 50) / 50;
    r = Math.round(yellow.r + (green.r - yellow.r) * t);
    g = Math.round(yellow.g + (green.g - yellow.g) * t);
    b = Math.round(yellow.b + (green.b - yellow.b) * t);
  }

  return `rgba(${r}, ${g}, ${b}, ${GRADE_COLOR_ALPHA})`;
}

export function formatGrade(pct: number): string {
  return `${Math.round(pct)}%`;
}

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function columnExportHeader(column: ResultsColumn): string {
  if (column.subtitle) {
    return `${column.label} - ${column.subtitle}`;
  }
  return column.label;
}

export function buildResultsCsv(options: {
  data: ClassResultsResponse;
  columns: ResultsColumn[];
  gradeMetric: GradeMetric;
  includeSection: boolean;
}): string {
  const { data, columns, gradeMetric, includeSection } = options;
  const header = [
    'Student Name',
    'Email',
    ...(includeSection ? ['Section'] : []),
    ...columns.map(columnExportHeader),
  ];

  const lines = [
    header.map(escapeCsvField).join(','),
    ...data.students.map((student) => {
      const row = [
        student.student_name,
        student.student_email,
        ...(includeSection ? [student.section] : []),
        ...columns.map((column) => {
          const grade = computeCellGrade(data, student, column, gradeMetric);
          return grade == null ? '' : String(Math.round(grade));
        }),
      ];
      return row.map((cell) => escapeCsvField(cell)).join(',');
    }),
  ];

  return `${lines.join('\n')}\n`;
}

export function downloadResultsCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function buildResultsExportFilename(options: {
  classId: number;
  section: string | null;
}): string {
  const sectionPart = options.section == null
    ? 'All-Sections'
    : options.section === ''
      ? 'No-Section'
      : options.section.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '') || 'section';
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  return `results-class-${options.classId}_${sectionPart}_${stamp}.csv`;
}
