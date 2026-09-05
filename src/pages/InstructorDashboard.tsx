import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import Button from '../components/ui/Button';
import RosterPage from './RosterPage';
import TopicSettingsPage from './TopicSettingsPage';
import ResultsPage from './ResultsPage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faCheck, faCopy, faGaugeHigh, faTableCells, faUsers } from '@fortawesome/free-solid-svg-icons';
import { type Class } from '../services/classes';
import {
  reportsService,
  type ClassOverview,
  type StudentReport,
  type TopicReport,
  type QuestionAnalyticsResponse,
} from '../services/reports';
import { TOPICS } from '../all_topics';
import { Topic } from '../topics';
import './Dashboards.css';
import './InstructorDashboard.css';
import { getInitials } from '../util';

type DifficultyLevel = 'very-hard' | 'hard' | 'medium' | 'easy';
type SubtopicSortKey = 'order' | 'success' | 'completion' | 'time' | 'attempts';
type SubtopicSortDir = 'asc' | 'desc';

const SIDEBAR_TOPIC_IDS: string[] = [];
const SUBTOPIC_ORDER_BY_TOPIC_ID = new Map<string, string[]>();
(() => {
  const registerTopic = (topic: Topic) => {
    SIDEBAR_TOPIC_IDS.push(topic.id);
    const order: string[] = [];
    const seen = new Set<string>();
    for (const subtopic of topic.subtopics) {
      const typeName = subtopic.constructor.name;
      if (!seen.has(typeName)) {
        seen.add(typeName);
        order.push(typeName);
      }
    }
    SUBTOPIC_ORDER_BY_TOPIC_ID.set(topic.id, order);
  };

  for (const item of TOPICS) {
    if ('subtopics' in item && Array.isArray(item.subtopics)) {
      registerTopic(item);
    } else if ('topics' in item && Array.isArray(item.topics)) {
      for (const topic of item.topics) {
        registerTopic(topic);
      }
    }
  }
})();

const SUBTOPIC_SORT_OPTIONS: Array<{ key: SubtopicSortKey; label: string }> = [
  { key: 'order', label: 'Order' },
  { key: 'success', label: 'Success' },
  { key: 'completion', label: 'Complete' },
  { key: 'time', label: 'Time' },
  { key: 'attempts', label: 'Attempts' },
];

const defaultSubtopicSortDir = (key: SubtopicSortKey): SubtopicSortDir =>
  key === 'success' || key === 'order' ? 'asc' : 'desc';

const describeDifficulty = (accuracy: number): { level: DifficultyLevel; label: string } => {
  if (accuracy >= 80) return { level: 'easy', label: 'Easy' };
  if (accuracy >= 60) return { level: 'medium', label: 'Moderate' };
  if (accuracy >= 40) return { level: 'hard', label: 'Challenging' };
  return { level: 'very-hard', label: 'Critical' };
};

const sanitizeFilenamePart = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .slice(0, 80) || 'unknown';

const formatExportTimestamp = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
};

const buildExportFilename = (courseName: string | null, section: string | null) => {
  const course = sanitizeFilenamePart(courseName ?? 'class');
  const sectionPart =
    section === null
      ? 'All-Sections'
      : section === ''
        ? 'No-Section'
        : sanitizeFilenamePart(section);
  return `${course}_${sectionPart}_${formatExportTimestamp(new Date())}.json`;
};

const createDownload = (data: unknown, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

export default function InstructorDashboard({
  classId,
  className,
  activeTab = 'analytics',
  onTabChange,
  onClassRenamed,
}: {
  classId: number | null;
  className: string | null;
  activeTab?: 'analytics' | 'roster' | 'topics' | 'results';
  onTabChange?: (tab: 'analytics' | 'roster' | 'topics' | 'results') => void;
  onClassRenamed?: (cls: Class) => void;
}) {
  const ALL_SECTIONS_VALUE = '__all_sections__';
  const [classOverview, setClassOverview] = useState<ClassOverview | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [rosterSearchTerm, setRosterSearchTerm] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [showRoster, setShowRoster] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<ClassOverview['topics_overview'][number] | null>(null);
  const [topicReport, setTopicReport] = useState<TopicReport | null>(null);
  const [topicQuestionAnalytics, setTopicQuestionAnalytics] = useState<QuestionAnalyticsResponse | null>(null);
  const [topicLoading, setTopicLoading] = useState(false);
  const [topicError, setTopicError] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionAnalyticsResponse['analytics'][number] | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
  const [inProgressSort, setInProgressSort] = useState<'name' | 'percent'>('name');
  const [subtopicSort, setSubtopicSort] = useState<{
    key: SubtopicSortKey;
    dir: SubtopicSortDir;
  }>({ key: 'order', dir: 'asc' });
  const [copiedStatusKey, setCopiedStatusKey] = useState<string | null>(null);
  const [remainingTooltip, setRemainingTooltip] = useState<{
    studentId: number;
    labels: string[];
    left: number;
    top: number;
  } | null>(null);
  const remainingTooltipAnchorRef = useRef<HTMLElement | null>(null);
  const remainingTooltipRef = useRef(remainingTooltip);
  remainingTooltipRef.current = remainingTooltip;

  const positionRemainingTooltip = (
    anchor: HTMLElement,
    studentId: number,
    labels: string[],
  ) => {
    const rect = anchor.getBoundingClientRect();
    const estimatedHeight = Math.min(24 + labels.length * 18, 180);
    const spaceBelow = window.innerHeight - rect.bottom;
    const top =
      spaceBelow < estimatedHeight + 12
        ? Math.max(8, rect.top - estimatedHeight - 8)
        : rect.bottom + 8;
    setRemainingTooltip({
      studentId,
      labels,
      left: Math.min(rect.left, window.innerWidth - 260),
      top,
    });
  };

  useEffect(() => {
    if (!remainingTooltip) return;
    const reposition = () => {
      const anchor = remainingTooltipAnchorRef.current;
      const current = remainingTooltipRef.current;
      if (!anchor || !current) return;
      positionRemainingTooltip(anchor, current.studentId, current.labels);
    };
    document.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      document.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [remainingTooltip?.studentId]);
  const pageTitle = className
    ? `${className} ${activeTab === 'analytics' ? 'Analytics' : activeTab === 'roster' ? 'Roster' : activeTab === 'results' ? 'Results' : 'Topics'}`
    : activeTab === 'analytics'
      ? 'All Class Analytics'
      : activeTab === 'roster'
        ? 'Class Roster'
        : activeTab === 'results'
          ? 'Class Results'
          : 'Topic Settings';
  const pageSubtitle = activeTab === 'analytics'
    ? 'Comprehensive overview of student progress and performance'
    : activeTab === 'roster'
      ? 'Manage co-instructors and the class roster.'
      : activeTab === 'results'
        ? 'Student grades across assignments.'
        : 'Configure topic availability and schedules.';

  const renderDashboardTabs = () => (
    <>
      <button className={`dashboard-tab ${activeTab === 'analytics' ? 'is-active' : ''}`} onClick={() => onTabChange?.('analytics')}>
        <FontAwesomeIcon icon={faGaugeHigh} aria-hidden="true" />
        <span className="dashboard-tab__label">Analytics</span>
      </button>
      <button className={`dashboard-tab ${activeTab === 'results' ? 'is-active' : ''}`} onClick={() => onTabChange?.('results')}>
        <FontAwesomeIcon icon={faTableCells} aria-hidden="true" />
        <span className="dashboard-tab__label">Results</span>
      </button>
      <button className={`dashboard-tab ${activeTab === 'topics' ? 'is-active' : ''}`} onClick={() => onTabChange?.('topics')}>
        <FontAwesomeIcon icon={faBook} aria-hidden="true" />
        <span className="dashboard-tab__label">Topics</span>
      </button>
      <button className={`dashboard-tab ${activeTab === 'roster' ? 'is-active' : ''}`} onClick={() => onTabChange?.('roster')}>
        <FontAwesomeIcon icon={faUsers} aria-hidden="true" />
        <span className="dashboard-tab__label">Roster</span>
      </button>
    </>
  );

  useEffect(() => {
    setSelectedStudent(null);
    setLookupError(null);
    setShowRoster(false);
    setSelectedTopic(null);
    setTopicReport(null);
    setTopicQuestionAnalytics(null);
    setTopicError(null);
    setTopicLoading(false);
    setSelectedQuestion(null);
    setSelectedSubtopic(null);

    if (activeTab !== 'analytics') {
      setLoading(false);
      return;
    }

    setLoading(true);
    loadClassOverview();
  }, [classId, selectedSection, activeTab]);

  const loadClassOverview = async () => {
    try {
      const data = await reportsService.getClassOverview(classId, selectedSection);
      setClassOverview(data);
    } catch (error) {
      console.error('Failed to load class overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewStudentReport = async (studentId: number) => {
    try {
      setLookupError(null);
      const report = await reportsService.getStudentReport(studentId, classId, selectedSection);
      setSelectedStudent(report);
    } catch (error) {
      console.error('Failed to load student report:', error);
      setLookupError('Unable to load analytics for this student right now.');
    }
  };

  const handleExport = () => {
    if (!classOverview) {
      return;
    }
    createDownload(classOverview, buildExportFilename(className, selectedSection));
  };

  const openRosterModal = () => setShowRoster(true);
  const closeTopicModal = () => {
    setSelectedTopic(null);
    setTopicReport(null);
    setTopicQuestionAnalytics(null);
    setTopicError(null);
    setTopicLoading(false);
    setSelectedQuestion(null);
    setSelectedSubtopic(null);
    setInProgressSort('name');
    setCopiedStatusKey(null);
    setRemainingTooltip(null);
  };
  const closeQuestionModal = () => setSelectedQuestion(null);
  const handleRosterKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openRosterModal();
    }
  };

  const copyStudentEmails = async (
    statusKey: string,
    students: Array<{ student_email: string }>,
  ) => {
    const emails = students
      .map((student) => student.student_email?.trim())
      .filter((email): email is string => Boolean(email));
    if (emails.length === 0) return;
    try {
      await navigator.clipboard.writeText(emails.join(', '));
      setCopiedStatusKey(statusKey);
      window.setTimeout(() => {
        setCopiedStatusKey((current) => (current === statusKey ? null : current));
      }, 1500);
    } catch (error) {
      console.error('Failed to copy emails:', error);
    }
  };

  const topPerformers = classOverview?.top_performers ?? [];
  const topicsOverview = classOverview?.topics_overview ?? [];
  const rosteredStudents = classOverview?.rostered_students ?? [];
  const topicsInSidebarOrder = useMemo(() => {
    const orderIndex = new Map(SIDEBAR_TOPIC_IDS.map((id, index) => [id, index]));
    return topicsOverview.slice().sort((a, b) => {
      const aIndex = orderIndex.get(a.topic) ?? Number.MAX_SAFE_INTEGER;
      const bIndex = orderIndex.get(b.topic) ?? Number.MAX_SAFE_INTEGER;
      if (aIndex !== bIndex) return aIndex - bIndex;
      return a.topic_name.localeCompare(b.topic_name, undefined, { sensitivity: 'base' });
    });
  }, [topicsOverview]);
  const selectedTopicIndex = selectedTopic
    ? topicsInSidebarOrder.findIndex((topic) => topic.topic === selectedTopic.topic)
    : -1;
  const previousTopic =
    selectedTopicIndex > 0 ? topicsInSidebarOrder[selectedTopicIndex - 1] : null;
  const nextTopic =
    selectedTopicIndex >= 0 && selectedTopicIndex < topicsInSidebarOrder.length - 1
      ? topicsInSidebarOrder[selectedTopicIndex + 1]
      : null;
  const subtopicQuestions = useMemo(() => {
    if (!topicQuestionAnalytics || !selectedSubtopic) return [];
    return topicQuestionAnalytics.analytics
      .filter((question) => question.subtopic_type === selectedSubtopic)
      .slice()
      .sort((a, b) => a.success_rate - b.success_rate);
  }, [topicQuestionAnalytics, selectedSubtopic]);

  const sortedInProgressStudents = useMemo(() => {
    const students = topicReport?.student_status.in_progress ?? [];
    return students.slice().sort((a, b) => {
      if (inProgressSort === 'percent') {
        const percentDiff =
          (b.completion_percentage ?? 0) - (a.completion_percentage ?? 0);
        if (percentDiff !== 0) return percentDiff;
      }
      return (a.student_name || '').localeCompare(b.student_name || '', undefined, {
        sensitivity: 'base',
      });
    });
  }, [topicReport, inProgressSort]);

  const sortedSubtopics = useMemo(() => {
    const subtopics = topicReport?.subtopic_difficulty ?? [];
    if (subtopics.length === 0) return [];

    const topicId = topicReport?.topic ?? selectedTopic?.topic ?? '';
    const definedOrder = SUBTOPIC_ORDER_BY_TOPIC_ID.get(topicId) ?? [];
    const orderIndex = new Map(definedOrder.map((type, index) => [type, index]));
    const dirSign = subtopicSort.dir === 'asc' ? 1 : -1;

    const metricValue = (
      subtopic: (typeof subtopics)[number],
      key: Exclude<SubtopicSortKey, 'order'>,
    ) => {
      switch (key) {
        case 'success':
          return subtopic.success_rate;
        case 'completion':
          return subtopic.completion_rate ?? 0;
        case 'time':
          return subtopic.avg_time;
        case 'attempts':
          return subtopic.attempts;
      }
    };

    return subtopics.slice().sort((a, b) => {
      if (subtopicSort.key === 'order') {
        const aIndex = orderIndex.get(a.subtopic_type) ?? Number.MAX_SAFE_INTEGER;
        const bIndex = orderIndex.get(b.subtopic_type) ?? Number.MAX_SAFE_INTEGER;
        if (aIndex !== bIndex) return aIndex - bIndex;
      } else {
        const diff = (metricValue(a, subtopicSort.key) - metricValue(b, subtopicSort.key)) * dirSign;
        if (diff !== 0) return diff;
      }
      return a.subtopic_type.localeCompare(b.subtopic_type, undefined, { sensitivity: 'base' });
    });
  }, [topicReport, selectedTopic, subtopicSort]);

  const handleSubtopicSort = (key: SubtopicSortKey) => {
    setSubtopicSort((current) => {
      if (key === 'order') return { key: 'order', dir: 'asc' };
      if (current.key === key) {
        return { key, dir: current.dir === 'asc' ? 'desc' : 'asc' };
      }
      return { key, dir: defaultSubtopicSortDir(key) };
    });
  };
  const normalizedRosterSearch = rosterSearchTerm.trim().toLowerCase();
  const rosterMatches = useMemo(() => {
    if (!normalizedRosterSearch) return rosteredStudents;
    return rosteredStudents.filter((student) => {
      const name = student.student_name?.toLowerCase() ?? '';
      const email = student.student_email?.toLowerCase() ?? '';
      return name.includes(normalizedRosterSearch) || email.includes(normalizedRosterSearch);
    });
  }, [rosteredStudents, normalizedRosterSearch]);
  const sectionOptions = classOverview?.sections ?? [];
  const showSectionSelector = sectionOptions.length > 1;

  useEffect(() => {
    setSelectedSection(null);
  }, [classId]);

  const handleRosterSelection = (studentId: number | null) => {
    if (!studentId) {
      setLookupError('This student has not logged in yet, so analytics are unavailable.');
      return;
    }
    viewStudentReport(studentId);
  };

  const openTopicModal = async (topic: ClassOverview['topics_overview'][number]) => {
    setSelectedTopic(topic);
    setTopicError(null);
    setTopicLoading(true);
    setRemainingTooltip(null);
    try {
      const [report, analytics] = await Promise.all([
        reportsService.getTopicReport(topic.topic, classId, selectedSection),
        reportsService.getQuestionAnalytics(topic.topic, undefined, classId, selectedSection),
      ]);
      setTopicReport(report);
      setTopicQuestionAnalytics(analytics);
      setSelectedSubtopic(null);
      setCopiedStatusKey(null);
      setRemainingTooltip(null);
    } catch (error) {
      console.error('Failed to load topic analytics:', error);
      setTopicError('Unable to load topic analytics right now.');
      setTopicReport(null);
      setTopicQuestionAnalytics(null);
      setSelectedSubtopic(null);
    } finally {
      setTopicLoading(false);
    }
  };

  const handleTopicKey = (
    event: KeyboardEvent<HTMLDivElement>,
    topic: ClassOverview['topics_overview'][number],
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openTopicModal(topic);
    }
  };

  if (loading) {
    return (
      <div className="instructor-dashboard app-page">
        <header className="dashboard-header">
          <div className="dashboard-header__content">
            <h1>{pageTitle}</h1>
            <div className="dashboard-subtitle">Loading dashboard…</div>
          </div>
          <div className="dashboard-header__actions dashboard-header__actions--tabs">
            {renderDashboardTabs()}
          </div>
        </header>
      </div>
    );
  }

  if (selectedStudent) {
    const topicsCompleted = selectedStudent.topic_breakdown.filter(
      (topic) => topic.completion_percentage >= 100,
    ).length;
    const topicsStarted = selectedStudent.topic_breakdown.length;

    return (
      <div className="instructor-dashboard app-page">
        <header className="dashboard-header">
          <div className="dashboard-header__content">
            <h1>{pageTitle}</h1>
            <p className="dashboard-subtitle">{pageSubtitle}</p>
          </div>
          <div className="dashboard-header__actions dashboard-header__actions--tabs">
            {renderDashboardTabs()}
          </div>
        </header>
        <div className="dashboard-scroll-content">
          {activeTab === 'analytics' && (
            <div className="dashboard-toolbar">
              <button className="btn-secondary" type="button" onClick={handleExport}>Export Data</button>
              {showSectionSelector && (
                <select
                  className="dashboard-toolbar-select"
                  value={selectedSection ?? ALL_SECTIONS_VALUE}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedSection(value === ALL_SECTIONS_VALUE ? null : value);
                  }}
                >
                  <option value={ALL_SECTIONS_VALUE}>All Sections</option>
                  {sectionOptions.map((section) => (
                    <option key={section === '' ? '__empty_section__' : section} value={section}>
                      {section === '' ? '(No Section)' : section}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
          <Button onClick={() => setSelectedStudent(null)} className="back-button" variant="ghost">
            Back to Class Overview
          </Button>

          <div className="student-detail-header">
            <div>
              <h1>{selectedStudent.student_name}</h1>
              <p className="student-email">{selectedStudent.student_email}</p>
            </div>
          </div>

          <div className="stats-grid stats-grid--compact">
          <div className="stat-card">
            <div>
              <h3>Questions</h3>
              <p className="stat-value">
                {selectedStudent.overall_stats.total_questions_answered}
              </p>
              <p className="stat-detail">
                {selectedStudent.overall_stats.total_correct} correct ·{' '}
                {selectedStudent.overall_stats.total_incorrect} incorrect ·{' '}
                {selectedStudent.overall_stats.total_skipped} skipped
              </p>
            </div>
          </div>
          <div className="stat-card stat-card--accent">
            <div>
              <h3>Accuracy</h3>
              <p className="stat-value">
                {selectedStudent.overall_stats.overall_accuracy.toFixed(1)}%
              </p>
              <p className="stat-detail">Average across all topics</p>
            </div>
          </div>
          <div className="stat-card">
            <div>
              <h3>Average Time</h3>
              <p className="stat-value">
                {selectedStudent.overall_stats.avg_time_per_question.toFixed(0)}s
              </p>
              <p className="stat-detail">Per question</p>
            </div>
          </div>
          <div className="stat-card stat-card--success">
            <div>
              <h3>Topic Progress</h3>
              <p className="stat-value">
                {topicsCompleted}/{topicsStarted}
              </p>
              <p className="stat-detail">Topics completed</p>
            </div>
          </div>
          </div>

          <section className="dashboard-section">
            <h2>Topic Performance</h2>
            <div className="topics-grid">
            {selectedStudent.topic_breakdown.map((topic) => (
              <div key={topic.topic} className="topic-detail-card">
                <div className="topic-detail-card__header">
                  <h3>{topic.topic_name}</h3>
                  <span className="completion-badge">
                    {topic.completion_percentage.toFixed(0)}%
                  </span>
                </div>

                <div className="topic-metrics-row">
                  <div className="mini-metric">
                    <span>Accuracy</span>
                    <strong>{topic.accuracy.toFixed(0)}%</strong>
                  </div>
                  <div className="mini-metric">
                    <span>Questions</span>
                    <strong>{topic.questions_answered}</strong>
                  </div>
                  <div className="mini-metric">
                    <span>Avg Time</span>
                    <strong>{topic.avg_time.toFixed(0)}s</strong>
                  </div>
                </div>

                <div className="progress-bar-detailed">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min(topic.completion_percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
            </div>
          </section>

          {selectedStudent.struggling_subtopics &&
            selectedStudent.struggling_subtopics.length > 0 && (
              <section className="dashboard-section">
                <h2>Areas for Improvement</h2>
                <div className="struggling-topics">
                  {selectedStudent.struggling_subtopics.map((subtopic, index) => (
                    <div key={`${subtopic.topic}-${subtopic.subtopic_type}-${index}`} className="struggling-card">
                      <h4>
                        {subtopic.topic} · {subtopic.subtopic_type}
                      </h4>
                      <div className="struggling-stats">
                        <span>{subtopic.attempts} attempts</span>
                        <span className="accuracy-low">
                          {subtopic.accuracy.toFixed(0)}% accuracy
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="instructor-dashboard app-page">
      {showRoster && (
        <div
          className="roster-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Class roster"
          onClick={() => setShowRoster(false)}
        >
          <div className="roster-modal__content" onClick={(event) => event.stopPropagation()}>
            <div className="roster-modal__header">
              <div>
                <p className="roster-modal__label">Class Roster</p>
                <h2>{rosteredStudents.length} Students</h2>
              </div>
              <Button className="roster-modal__close" variant="muted" size="small" onClick={() => setShowRoster(false)}>
                Close
              </Button>
            </div>

            <div className="roster-list">
              {rosteredStudents.length === 0 ? (
                <div className="roster-empty">No students on this roster yet.</div>
              ) : (
                rosteredStudents.map((student, index) => (
                  <div
                    key={student.student_id ?? student.student_email ?? index}
                    className="roster-row"
                  >
                    <div className="roster-avatar">
                      {getInitials(student.student_name)}
                    </div>
                    <div className="roster-info">
                      <div className="roster-name">
                        <span className="roster-rank">#{index + 1}</span>
                        <strong>{student.student_name}</strong>
                      </div>
                      <div className="roster-email">{student.student_email}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {selectedTopic && (
        <div
          className="topic-analytics-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Topic analytics"
          onClick={closeTopicModal}
        >
          <div className="topic-analytics-modal__content" onClick={(event) => event.stopPropagation()}>
            <div className="topic-analytics-modal__header">
              <div className="topic-analytics-modal__title-block">
                <p className="topic-analytics-modal__label">Topic Analytics</p>
                <h2>{selectedTopic.topic_name}</h2>
                <div className="topic-analytics-modal__nav">
                  {previousTopic ? (
                    <button
                      type="button"
                      className="topic-analytics-modal__nav-link"
                      onClick={() => openTopicModal(previousTopic)}
                    >
                      ← {previousTopic.topic_name}
                    </button>
                  ) : (
                    <span className="topic-analytics-modal__nav-link topic-analytics-modal__nav-link--disabled">
                      ← Previous
                    </span>
                  )}
                  {nextTopic ? (
                    <button
                      type="button"
                      className="topic-analytics-modal__nav-link"
                      onClick={() => openTopicModal(nextTopic)}
                    >
                      {nextTopic.topic_name} →
                    </button>
                  ) : (
                    <span className="topic-analytics-modal__nav-link topic-analytics-modal__nav-link--disabled">
                      Next →
                    </span>
                  )}
                </div>
              </div>
              <Button
                className="topic-analytics-modal__close"
                variant="muted"
                size="small"
                onClick={closeTopicModal}
              >
                Close
              </Button>
            </div>

            <div
              className={`topic-analytics-modal__body${
                topicLoading && topicReport ? ' topic-analytics-modal__body--loading' : ''
              }`}
              aria-busy={topicLoading}
            >
              {topicLoading && !topicReport && (
                <div className="topic-analytics-loading">Loading topic analytics…</div>
              )}
              {!topicLoading && topicError && <div className="topic-analytics-error">{topicError}</div>}

              {topicReport && !topicError && (
                <>
                  <div className="topic-analytics-grid">
                    <div className="topic-analytics-card">
                      <p>Completed / Started</p>
                      <strong>
                        {topicReport.overall_stats.students_completed} / {topicReport.overall_stats.students_started}
                      </strong>
                    </div>
                    <div className="topic-analytics-card">
                      <p>Avg Accuracy</p>
                      <strong>{topicReport.overall_stats.avg_accuracy.toFixed(0)}%</strong>
                    </div>
                    <div className="topic-analytics-card">
                      <p>Avg Time</p>
                      <strong>{topicReport.overall_stats.avg_time_per_question.toFixed(0)}s</strong>
                    </div>
                    <div className="topic-analytics-card">
                      <p>Total Attempts</p>
                      <strong>{topicReport.overall_stats.total_attempts}</strong>
                    </div>
                  </div>

                  <div className="topic-analytics-section">
                    <h3>Student Status</h3>
                    <div className="topic-student-status">
                      {(
                        [
                          {
                            key: 'not_started' as const,
                            label: 'Not started',
                            students: topicReport.student_status.not_started,
                          },
                          {
                            key: 'in_progress' as const,
                            label: 'In progress',
                            students: sortedInProgressStudents,
                          },
                          {
                            key: 'completed' as const,
                            label: 'Completed',
                            students: topicReport.student_status.completed,
                          },
                        ]
                      ).map((column) => (
                        <div key={column.key} className="topic-student-status__column">
                          <div className="topic-student-status__header">
                            <h4>
                              {column.label}{' '}
                              <span className="topic-student-status__count">
                                ({column.students.length})
                              </span>
                            </h4>
                            <div className="topic-student-status__header-actions">
                              {column.key === 'in_progress' && column.students.length > 0 && (
                                <div
                                  className="topic-student-status__sort"
                                  role="group"
                                  aria-label="Sort in-progress students"
                                >
                                  <button
                                    type="button"
                                    className={`topic-student-status__sort-btn${
                                      inProgressSort === 'name' ? ' topic-student-status__sort-btn--active' : ''
                                    }`}
                                    onClick={() => setInProgressSort('name')}
                                    aria-pressed={inProgressSort === 'name'}
                                  >
                                    Name
                                  </button>
                                  <button
                                    type="button"
                                    className={`topic-student-status__sort-btn${
                                      inProgressSort === 'percent' ? ' topic-student-status__sort-btn--active' : ''
                                    }`}
                                    onClick={() => setInProgressSort('percent')}
                                    aria-pressed={inProgressSort === 'percent'}
                                  >
                                    %
                                  </button>
                                </div>
                              )}
                              <button
                                type="button"
                                className="topic-student-status__copy"
                                onClick={() => copyStudentEmails(column.key, column.students)}
                                disabled={column.students.length === 0}
                                title={
                                  copiedStatusKey === column.key
                                    ? 'Copied'
                                    : 'Copy emails'
                                }
                                aria-label={`Copy ${column.label.toLowerCase()} student emails`}
                              >
                                <FontAwesomeIcon
                                  icon={copiedStatusKey === column.key ? faCheck : faCopy}
                                  aria-hidden="true"
                                />
                              </button>
                            </div>
                          </div>
                          <div className="topic-student-status__list">
                            {column.students.length === 0 ? (
                              <p className="topic-student-status__empty">No students</p>
                            ) : (
                              column.students.map((student) => {
                                const percent =
                                  column.key === 'in_progress'
                                    ? Math.round(student.completion_percentage ?? 0)
                                    : null;
                                // Use the loaded report's topic id so switching topics
                                // does not mix the new title with the previous report.
                                const remainingSubtopics =
                                  column.key === 'in_progress' &&
                                  topicReport &&
                                  (!topicLoading || topicReport.topic === selectedTopic?.topic)
                                    ? (student.remaining_subtopics ?? [])
                                    : [];
                                const showRemainingTooltip =
                                  column.key === 'in_progress' &&
                                  !topicLoading &&
                                  topicReport?.topic === selectedTopic?.topic;
                                return (
                                  <div
                                    key={student.student_id}
                                    className={`topic-student-status__row${
                                      column.key === 'in_progress'
                                        ? ' topic-student-status__row--progress'
                                        : ''
                                    }`}
                                    onMouseEnter={
                                      showRemainingTooltip
                                        ? (event) => {
                                            const anchor = event.currentTarget;
                                            remainingTooltipAnchorRef.current = anchor;
                                            const labels =
                                              remainingSubtopics.length > 0
                                                ? remainingSubtopics
                                                : ['No remaining subtopics found'];
                                            positionRemainingTooltip(
                                              anchor,
                                              student.student_id,
                                              labels,
                                            );
                                          }
                                        : undefined
                                    }
                                    onMouseLeave={
                                      showRemainingTooltip
                                        ? () => {
                                            remainingTooltipAnchorRef.current = null;
                                            setRemainingTooltip(null);
                                          }
                                        : undefined
                                    }
                                  >
                                    <div className="topic-student-status__row-main">
                                      <div className="roster-avatar">
                                        {getInitials(student.student_name)}
                                      </div>
                                      <div className="roster-info">
                                        <strong>{student.student_name}</strong>
                                        <span className="roster-email">{student.student_email}</span>
                                      </div>
                                      {percent !== null && (
                                        <span className="topic-student-status__percent">{percent}%</span>
                                      )}
                                    </div>
                                    {percent !== null && (
                                      <div
                                        className="topic-student-status__bar"
                                        aria-hidden="true"
                                      >
                                        <div
                                          className="topic-student-status__bar-fill"
                                          style={{ width: `${Math.min(percent, 100)}%` }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="topic-analytics-section">
                    <div className="ranked-subtopics-header">
                      <h3>Subtopics</h3>
                      {topicReport.subtopic_difficulty.length > 0 && (
                        <div
                          className="ranked-subtopics-sort"
                          role="group"
                          aria-label="Sort subtopics"
                        >
                          {SUBTOPIC_SORT_OPTIONS.map((option) => {
                            const isActive = subtopicSort.key === option.key;
                            const directionHint =
                              isActive && option.key !== 'order'
                                ? subtopicSort.dir === 'asc'
                                  ? ' ↑'
                                  : ' ↓'
                                : '';
                            return (
                              <button
                                key={option.key}
                                type="button"
                                className={`ranked-subtopics-sort__btn${
                                  isActive ? ' ranked-subtopics-sort__btn--active' : ''
                                }`}
                                onClick={() => handleSubtopicSort(option.key)}
                                aria-pressed={isActive}
                                title={
                                  option.key === 'order'
                                    ? 'Sort by defined topic order'
                                    : isActive
                                      ? `Sort by ${option.label.toLowerCase()} (${
                                          subtopicSort.dir === 'asc' ? 'low to high' : 'high to low'
                                        }). Click again to reverse.`
                                      : `Sort by ${option.label.toLowerCase()}`
                                }
                              >
                                {option.label}
                                {directionHint}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {topicReport.subtopic_difficulty.length === 0 ? (
                      <p className="topic-analytics-empty">No subtopic analytics available yet.</p>
                    ) : (
                      <div className="ranked-subtopics-list">
                        {sortedSubtopics.map((subtopic, index) => {
                            const isSelected = selectedSubtopic === subtopic.subtopic_type;
                            return (
                              <div
                                key={subtopic.subtopic_type}
                                className={`ranked-subtopic-row ${isSelected ? 'ranked-subtopic-row--active' : ''}`}
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelectedSubtopic(subtopic.subtopic_type)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    setSelectedSubtopic(subtopic.subtopic_type);
                                  }
                                }}
                              >
                                <span className="ranked-subtopic-rank">#{index + 1}</span>
                                <span className="ranked-subtopic-name">{subtopic.subtopic_type}</span>
                                <span className="ranked-subtopic-metric">
                                  {subtopic.success_rate.toFixed(0)}% success
                                  {' · '}
                                  {(subtopic.completion_rate ?? 0).toFixed(0)}% complete
                                  {' · '}
                                  {subtopic.avg_time.toFixed(0)}s avg
                                  {' · '}
                                  {subtopic.attempts} attempts
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  <div className="topic-analytics-section">
                    <h3>Questions for Selected Subtopic</h3>
                    {!selectedSubtopic ? (
                      <p className="topic-analytics-empty">Select a subtopic to view its questions.</p>
                    ) : subtopicQuestions.length === 0 ? (
                      <p className="topic-analytics-empty">No question analytics available for this subtopic.</p>
                    ) : (
                      <div className="topic-analytics-list">
                        {subtopicQuestions.map((question, index) => (
                          <div
                            key={`${question.question_code}-${question.subtopic_type}-${index}`}
                            className="analytics-list-row"
                            title={`${question.question_code} · ${question.subtopic_type}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedQuestion(question)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                setSelectedQuestion(question);
                              }
                            }}
                          >
                            <span className="analytics-list-rank">#{index + 1}</span>
                            <span className="analytics-list-subtopic">{question.subtopic_type}</span>
                            <span className="analytics-list-metric">
                              {question.success_rate.toFixed(0)}% success
                            </span>
                            <span className="analytics-list-metric">
                              {question.times_shown} attempts
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </>
              )}
            </div>
          </div>
        </div>
      )}

      {remainingTooltip &&
        createPortal(
          <div
            className="topic-student-status__tooltip-portal"
            role="tooltip"
            style={{ left: remainingTooltip.left, top: remainingTooltip.top }}
          >
            <p className="topic-student-status__tooltip-label">Still to do</p>
            <ul>
              {remainingTooltip.labels.map((subtopic) => (
                <li key={subtopic}>{subtopic}</li>
              ))}
            </ul>
          </div>,
          document.body,
        )}

      {selectedQuestion && (
        <div
          className="question-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Question details"
          onClick={closeQuestionModal}
        >
          <div className="question-modal__content" onClick={(event) => event.stopPropagation()}>
            <div className="question-modal__header">
              <div>
                <p className="question-modal__label">Question Details</p>
                <h3>{selectedQuestion.subtopic_type}</h3>
              </div>
              <Button
                className="question-modal__close"
                variant="muted"
                size="small"
                onClick={closeQuestionModal}
              >
                Close
              </Button>
            </div>
            <div className="question-modal__body">
              <div className="question-modal__stats">
                <span>{selectedQuestion.times_shown} attempts</span>
                <span>{selectedQuestion.success_rate.toFixed(0)}% success</span>
                <span>{selectedQuestion.avg_time_spent.toFixed(0)}s avg time</span>
              </div>
              <pre className="question-modal__code">{selectedQuestion.question_code}</pre>
            </div>
          </div>
        </div>
      )}

      <header className="dashboard-header">
        <div className="dashboard-header__content">
          <h1>{pageTitle}</h1>
          <p className="dashboard-subtitle">{pageSubtitle}</p>
        </div>
        <div className="dashboard-header__actions dashboard-header__actions--tabs">
          {renderDashboardTabs()}
        </div>
      </header>
      <div className="dashboard-scroll-content">
        {activeTab === 'analytics' && (
          <div className="dashboard-toolbar">
            <button className="btn-secondary" type="button" onClick={handleExport}>Export Data</button>
            {showSectionSelector && (
              <select
                className="dashboard-toolbar-select"
                value={selectedSection ?? ALL_SECTIONS_VALUE}
                onChange={(event) => {
                  const value = event.target.value;
                  setSelectedSection(value === ALL_SECTIONS_VALUE ? null : value);
                }}
              >
                <option value={ALL_SECTIONS_VALUE}>All Sections</option>
                {sectionOptions.map((section) => (
                  <option key={section === '' ? '__empty_section__' : section} value={section}>
                    {section === '' ? '(No Section)' : section}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {activeTab === 'roster' ? (
          <RosterPage classId={classId} className={className} onClassRenamed={onClassRenamed} />
        ) : activeTab === 'topics' ? (
          <TopicSettingsPage classId={classId} />
        ) : activeTab === 'results' ? (
          <ResultsPage classId={classId} />
        ) : (
          <>
      <section className="dashboard-overview">
        <div className="overview-stats">
          <div
            className="stat-card stat-card--large stat-card--clickable"
            role="button"
            tabIndex={0}
            onClick={openRosterModal}
            onKeyDown={handleRosterKey}
            aria-label="View class roster"
          >
            <div className="stat-card__content">
              <p className="stat-card__label">Total Students</p>
              <p className="stat-card__value">{classOverview?.total_students ?? 0}</p>
              <p className="stat-card__detail">
                {classOverview?.active_students_last_week ?? 0} active this week
              </p>
            </div>
          </div>

          <div className="stat-card stat-card--large stat-card--accent">
            <div className="stat-card__content">
              <p className="stat-card__label">Class Average</p>
              <p className="stat-card__value">
                {(classOverview?.class_avg_accuracy ?? 0).toFixed(1)}%
              </p>
              <p className="stat-card__detail">
                {classOverview?.total_questions_answered ?? 0} questions answered
              </p>
            </div>
          </div>

          <div className="stat-card stat-card--large stat-card--success">
            <div className="stat-card__content">
              <p className="stat-card__label">Top Performer</p>
              <p className="stat-card__value">
                {topPerformers[0]?.accuracy?.toFixed(1) ?? '0.0'}%
              </p>
              <p className="stat-card__detail">
                {topPerformers[0]?.student_name ?? 'No data'}
              </p>
            </div>
          </div>
        </div>

      </section>

      <section className="dashboard-section">
        <h2>Topics Performance</h2>
        <div className="topics-performance-grid">
          {topicsOverview
            .slice()
            .sort((a, b) => a.avg_accuracy - b.avg_accuracy)
            .map((topic) => {
              const difficulty = describeDifficulty(topic.avg_accuracy);
              const completionRate =
                topic.students_started > 0
                  ? (topic.students_completed / topic.students_started) * 100
                  : 0;
              return (
                <div
                  key={topic.topic}
                  className={`topic-card topic-card--${difficulty.level}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => openTopicModal(topic)}
                  onKeyDown={(event) => handleTopicKey(event, topic)}
                >
                  <div className="topic-card__header">
                    <h3>{topic.topic_name}</h3>
                    <span className={`difficulty-badge difficulty-badge--${difficulty.level}`}>
                      {difficulty.label}
                    </span>
                  </div>
                  <div className="topic-card__metrics">
                    <div className="metric">
                      <span className="metric__label">Accuracy</span>
                      <span className="metric__value">{topic.avg_accuracy.toFixed(0)}%</span>
                    </div>
                    <div className="metric">
                      <span className="metric__label">Completion</span>
                      <span className="metric__value">{completionRate.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="topic-card__stats">
                    <span>{topic.students_started} started</span>
                    <span>·</span>
                    <span>{topic.students_completed} completed</span>
                  </div>
                  <div className="topic-card__progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.min(topic.avg_accuracy, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-header">
          <h2>Student Lookup</h2>
          <input
            type="search"
            placeholder="Search by name or email…"
            className="search-input"
            value={rosterSearchTerm}
            onChange={(event) => {
              setRosterSearchTerm(event.target.value);
              setLookupError(null);
            }}
          />
        </div>

        {lookupError && <div className="inline-alert">{lookupError}</div>}

        <div className="roster-lookup-grid">
          {rosterMatches.length === 0 ? (
            <div className="students-table__empty">No students match that search.</div>
          ) : (
            rosterMatches.map((student, index) => (
              <button
                key={`${student.student_email}-${student.student_id ?? `pending-${index}`}`}
                className="roster-lookup-card"
                onClick={() => handleRosterSelection(student.student_id)}
                type="button"
              >
                <div className="roster-lookup-card__avatar">
                  {getInitials(student.student_name)}
                </div>
                <div className="roster-lookup-card__info">
                  <div className="roster-lookup-card__name">{student.student_name}</div>
                  <div className="roster-lookup-card__email">{student.student_email}</div>
                </div>
                <div
                  className={`roster-lookup-card__status ${
                    student.student_id ? 'roster-lookup-card__status--ready' : 'roster-lookup-card__status--inactive'
                  }`}
                >
                  {student.student_id ? 'View analytics' : 'Not signed in yet'}
                </div>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="dashboard-section dashboard-section--spacer" aria-hidden="true" />
          </>
        )}
      </div>
    </div>
  );
}
