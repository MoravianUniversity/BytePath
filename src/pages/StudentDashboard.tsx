import { useEffect, useMemo, useState } from 'react';

import type { User } from '../services/auth';
import { progressService, type TopicProgress } from '../services/progress';
import { responsesService, type StudentResponse } from '../services/responses';
import './StudentDashboard.css';

interface StudentDashboardProps {
  user: User;
  currentClassId: number | null;
}

interface SummaryStats {
  totalQuestions: number;
  correct: number;
  incorrect: number;
  skipped: number;
  accuracy: number;
  avgTime: number;
}

const buildSummary = (responses: StudentResponse[]): SummaryStats => {
  const totalQuestions = responses.length;
  const correct = responses.filter((r) => r.status === 'correct').length;
  const incorrect = responses.filter((r) => r.status === 'incorrect').length;
  const skipped = responses.filter((r) => r.status === 'skipped').length;
  const accuracy =
    totalQuestions > 0 ? (correct / (correct + incorrect || 1)) * 100 : 0;

  const timedResponses = responses.filter(
    (r) => r.status !== 'skipped' && r.time_spent != null,
  );
  const avgTime =
    timedResponses.length > 0
      ? timedResponses.reduce((sum, r) => sum + (r.time_spent ?? 0), 0) /
        timedResponses.length
      : 0;

  return {
    totalQuestions,
    correct,
    incorrect,
    skipped,
    accuracy: Number.isFinite(accuracy) ? accuracy : 0,
    avgTime: Number.isFinite(avgTime) ? avgTime : 0,
  };
};

// const getEncouragement = (accuracy: number): string => {
//   if (accuracy >= 80) return 'Excellent momentum!';
//   if (accuracy >= 60) return 'Great progress—keep refining those skills!';
//   if (accuracy > 0) return 'Practice makes perfect—keep going!';
//   return 'Ready to start your Python journey?';
// };

const formatLastAccessed = (isoDate: string | null): string | null => {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function StudentDashboard({ user, currentClassId }: StudentDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<TopicProgress[]>([]);
  const [responses, setResponses] = useState<StudentResponse[]>([]);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      progressService.getUserProgress(user.id, currentClassId),
      responsesService.getStudentResponses(user.id, currentClassId),
    ])
      .then(([progressData, responseData]) => {
        if (!mounted) {
          return;
        }
        setProgress(progressData);
        setResponses(
          responseData.sort(
            (a, b) =>
              new Date(b.attempted_at).getTime() -
              new Date(a.attempted_at).getTime(),
          ),
        );
      })
      .catch((err) => {
        if (mounted) {
          console.error('Failed to load student dashboard data', err);
          setError('Unable to load dashboard data. Please try again.');
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [user.id, currentClassId]);

  const summary = useMemo(() => buildSummary(responses), [responses]);

  const topicsCompleted = progress.filter(
    (p) => p.total_subtopics && p.subtopics_completed >= p.total_subtopics,
  ).length;
  const activeTopics = progress.length;

  const sortedTopics = useMemo(
    () =>
      [...progress].sort(
        (a, b) =>
          new Date(b.last_accessed || 0).getTime() -
          new Date(a.last_accessed || 0).getTime(),
      ),
    [progress],
  );

  const lastTopic = sortedTopics[0];

  const responsesByTopic = useMemo(() => {
    const grouped: Record<string, StudentResponse[]> = {};
    for (const r of responses) {
      if (!grouped[r.topic]) grouped[r.topic] = [];
      grouped[r.topic].push(r);
    }
    return grouped;
  }, [responses]);

  const handleContinueLearning = () => {
    if (!lastTopic) return;
    window.location.hash = lastTopic.topic;
  };

  return (
    <div className="student-dashboard">
      <header className="student-dashboard__hero">
        <div className="hero__content">
          <h1>Welcome back, {user.name}!</h1>
          <p className="hero__subtitle">
            {summary.totalQuestions > 0
              ? `You've answered ${summary.totalQuestions} questions with ${summary.accuracy.toFixed(
                  0,
                )}% accuracy.`
              : 'Ready to start your Python journey? Pick a topic from the sidebar to begin!'}
          </p>
        </div>
        {lastTopic && (
          <button className="hero__cta" onClick={handleContinueLearning}>
            Continue {lastTopic.topic_name ?? 'Learning'} →
          </button>
        )}
      </header>

      {loading && <div className="student-dashboard__loading">Loading dashboard…</div>}

      {error && !loading && (
        <div className="student-dashboard__error">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <section className="student-dashboard__quick-stats">
            <div className="stat-card stat-card--primary">
              <div className="stat-card__content">
                <p className="stat-card__label">Questions</p>
                <p className="stat-card__value">{summary.totalQuestions}</p>
                <p className="stat-card__detail">
                  Correct: {summary.correct} • Incorrect: {summary.incorrect} • Skipped: {summary.skipped}
                </p>
              </div>
            </div>

            <div className="stat-card stat-card--accent">
              <div className="stat-card__content">
                <p className="stat-card__label">Accuracy</p>
                <p className="stat-card__value">{summary.accuracy.toFixed(0)}%</p>
                {/* <p className="stat-card__detail">{(summary.accuracy)}</p> */}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card__content">
                <p className="stat-card__label">Avg Time</p>
                <p className="stat-card__value">{summary.avgTime.toFixed(0)}s</p>
                <p className="stat-card__detail">per question</p>
              </div>
            </div>

            <div className="stat-card stat-card--success">
              <div className="stat-card__content">
                <p className="stat-card__label">Progress</p>
                <p className="stat-card__value">
                  {topicsCompleted}/{activeTopics}
                </p>
                <p className="stat-card__detail">topics completed</p>
              </div>
            </div>
          </section>

          <section className="student-dashboard__section">
            <h2>Your Active Topics</h2>
            {sortedTopics.length === 0 ? (
              <div className="empty-state">
                <p>No topics started yet</p>
                <p className="empty-state__hint">
                  Choose a topic from the sidebar to begin learning!
                </p>
              </div>
            ) : (
              <div className="topics-grid">
                {sortedTopics.map((topic) => {
                  const isComplete = topic.completion_percentage >= 100;
                  const totalSubtopics =
                    topic.total_subtopics != null ? topic.total_subtopics : '?';
                  const isExpanded = expandedTopic === topic.topic;
                  const topicResponses = responsesByTopic[topic.topic] ?? [];
                  const topicSummary = buildSummary(topicResponses);
                  return (
                    <div
                      key={topic.topic}
                      className={`topic-card ${isComplete ? 'topic-card--complete' : ''} ${isComplete && isExpanded ? 'topic-card--expanded' : ''}`}
                      onClick={() => isComplete && setExpandedTopic(isExpanded ? null : topic.topic)}
                      style={isComplete ? { cursor: 'pointer' } : undefined}
                    >
                      <div className="topic-card__header">
                        <h3>{topic.topic_name}</h3>
                        {isComplete && (
                          <span className="topic-card__badge">
                            {isExpanded ? '▲' : '✓'} Complete
                          </span>
                        )}
                      </div>

                        <div className="topic-card__stats">
                          <div className="topic-stat">
                            <span className="topic-stat__value">{topic.subtopics_completed}</span>
                            <span className="topic-stat__label">/ {totalSubtopics} subtopics</span>
                          </div>
                          <div className="topic-stat">
                            <span className="topic-stat__value">{topic.questions_answered}</span>
                            <span className="topic-stat__label">questions</span>
                          </div>
                          {isComplete && topicResponses.length > 0 && (
                            <div className="topic-stat">
                              <span className="topic-stat__value">{topicSummary.accuracy.toFixed(0)}%</span>
                              <span className="topic-stat__label">accuracy</span>
                            </div>
                          )}
                        </div>

                      <div className="topic-card__progress">
                        <div className="progress-ring">
                          <svg width="60" height="60" viewBox="0 0 60 60">
                            <circle
                              cx="30"
                              cy="30"
                              r="25"
                              fill="none"
                              stroke="var(--border-subtle)"
                              strokeWidth="4"
                            />
                            <circle
                              cx="30"
                              cy="30"
                              r="25"
                              fill="none"
                              stroke={isComplete ? 'var(--color-success-bright)' : 'var(--color-primary)'}
                              strokeWidth="4"
                              strokeDasharray={`${
                                (Math.min(topic.completion_percentage, 100) / 100) * 157
                              } 157`}
                              strokeLinecap="round"
                              transform="rotate(-90 30 30)"
                            />
                            <text
                              x="30"
                              y="35"
                              textAnchor="middle"
                              fill="white"
                              fontSize="14"
                              fontWeight="600"
                            >
                              {Math.round(Math.min(topic.completion_percentage, 100))}%
                            </text>
                          </svg>
                        </div>
                      </div>

                      {topic.last_accessed && (
                        <div className="topic-card__footer">
                          Last practiced: {formatLastAccessed(topic.last_accessed)}
                        </div>
                      )}

                      {isExpanded && (
                        <div className="topic-card__review">
                          {topicResponses.length === 0 ? (
                            <p className="completed-topic-item__empty">
                              No recorded answers for this topic.
                            </p>
                          ) : (
                            topicResponses.map((r) => (
                              <div
                                key={r.id}
                                className={`response-row response-row--${r.status}`}
                              >
                                <div
                                  className={`activity-item__indicator activity-item__indicator--${r.status}`}
                                >
                                  {r.status === 'correct' ? '✓' : r.status === 'incorrect' ? '✗' : '—'}
                                </div>
                                <div className="response-row__content">
                                  <div className="response-row__subtopic">{r.subtopic_type}</div>
                                  <pre className="response-row__code">{r.question_code}</pre>
                                  <div className="response-row__answers">
                                    {r.status !== 'correct' && (
                                      <span className="response-row__student">
                                        Your answer: {r.student_answer ?? 'skipped'}
                                      </span>
                                    )}
                                    <span className="response-row__correct">
                                      Correct: {r.correct_answer}
                                    </span>
                                  </div>
                                </div>
                                <div className="response-row__time">{r.time_spent}s</div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

        </>
      )}
    </div>
  );
}

