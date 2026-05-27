import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import Button from '../components/ui/Button';
import {
  reportsService,
  type ClassOverview,
  type StudentReport,
  type TopicReport,
  type QuestionAnalyticsResponse,
} from '../services/reports';
import './InstructorDashboard.css';

type DifficultyLevel = 'very-hard' | 'hard' | 'medium' | 'easy';

const describeDifficulty = (accuracy: number): { level: DifficultyLevel; label: string } => {
  if (accuracy >= 80) return { level: 'easy', label: 'Easy' };
  if (accuracy >= 60) return { level: 'medium', label: 'Moderate' };
  if (accuracy >= 40) return { level: 'hard', label: 'Challenging' };
  return { level: 'very-hard', label: 'Critical' };
};

const createDownload = (data: unknown, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

export default function InstructorDashboard({ classId, className }: { classId: number | null; className: string | null }) {
  const [classOverview, setClassOverview] = useState<ClassOverview | null>(null);
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
    setLoading(true);
    loadClassOverview();
  }, [classId]);

  const loadClassOverview = async () => {
    try {
      const data = await reportsService.getClassOverview(classId);
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
      const report = await reportsService.getStudentReport(studentId, classId);
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
    createDownload(classOverview, 'class-overview.json');
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
  };
  const closeQuestionModal = () => setSelectedQuestion(null);
  const handleRosterKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openRosterModal();
    }
  };

  const topPerformers = classOverview?.top_performers ?? [];
  const topicsOverview = classOverview?.topics_overview ?? [];
  const rosteredStudents = classOverview?.rostered_students ?? [];
  const subtopicQuestions = useMemo(() => {
    if (!topicQuestionAnalytics || !selectedSubtopic) return [];
    return topicQuestionAnalytics.analytics
      .filter((question) => question.subtopic_type === selectedSubtopic)
      .slice()
      .sort((a, b) => a.success_rate - b.success_rate);
  }, [topicQuestionAnalytics, selectedSubtopic]);

  const normalizedRosterSearch = rosterSearchTerm.trim().toLowerCase();
  const rosterMatches = useMemo(() => {
    if (!normalizedRosterSearch) return rosteredStudents;
    return rosteredStudents.filter((student) => {
      const name = student.student_name?.toLowerCase() ?? '';
      const email = student.student_email?.toLowerCase() ?? '';
      return name.includes(normalizedRosterSearch) || email.includes(normalizedRosterSearch);
    });
  }, [rosteredStudents, normalizedRosterSearch]);

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
    setSelectedSubtopic(null);
    try {
      const [report, analytics] = await Promise.all([
        reportsService.getTopicReport(topic.topic, classId),
        reportsService.getQuestionAnalytics(topic.topic, undefined, classId),
      ]);
      setTopicReport(report);
      setTopicQuestionAnalytics(analytics);
    } catch (error) {
      console.error('Failed to load topic analytics:', error);
      setTopicError('Unable to load topic analytics right now.');
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
            <h1>{className ? `${className} Analytics` : 'All Class Analytics'}</h1>
            <div className="dashboard-subtitle">Loading dashboard…</div>
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
                      {student.student_name?.charAt(0)?.toUpperCase() || '?'}
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
              <div>
                <p className="topic-analytics-modal__label">Topic Analytics</p>
                <h2>{selectedTopic.topic_name}</h2>
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

            <div className="topic-analytics-modal__body">
              {topicLoading && <div className="topic-analytics-loading">Loading topic analytics…</div>}
              {!topicLoading && topicError && <div className="topic-analytics-error">{topicError}</div>}

              {!topicLoading && !topicError && topicReport && (
                <>
                  <div className="topic-analytics-grid">
                    <div className="topic-analytics-card">
                      <p>Total Students</p>
                      <strong>{topicReport.overall_stats.total_students}</strong>
                    </div>
                    <div className="topic-analytics-card">
                      <p>Started</p>
                      <strong>{topicReport.overall_stats.students_started}</strong>
                    </div>
                    <div className="topic-analytics-card">
                      <p>Completed</p>
                      <strong>{topicReport.overall_stats.students_completed}</strong>
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
                    <h3>Subtopics Ranked by Difficulty</h3>
                    {topicReport.subtopic_difficulty.length === 0 ? (
                      <p className="topic-analytics-empty">No subtopic analytics available yet.</p>
                    ) : (
                      <div className="ranked-subtopics-list">
                        {topicReport.subtopic_difficulty
                          .slice()
                          .sort((a, b) => a.success_rate - b.success_rate)
                          .map((subtopic, index) => {
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
          <h1>{className ? `${className} Analytics` : 'All Class Analytics'}</h1>
          <p className="dashboard-subtitle">
            Comprehensive overview of student progress and performance
          </p>
        </div>
        <div className="dashboard-header__actions">
          <button className="btn-secondary" onClick={handleExport}>Export Data</button>
        </div>
      </header>

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
                  {student.student_name?.charAt(0)?.toUpperCase() || '?'}
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
    </div>
  );
}
