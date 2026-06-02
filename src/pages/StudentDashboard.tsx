import { useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay } from '@fortawesome/free-solid-svg-icons';

import type { User } from '../services/auth';
import { progressService, type TopicProgress } from '../services/progress';
import { responsesService, type StudentResponse } from '../services/responses';
import './Dashboards.css';
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
  accuracy?: number;
  avgTime?: number;
  medianTime?: number;
}

const buildSummary = (responses: StudentResponse[]): SummaryStats => {
  const correct = responses.filter((r) => r.status === 'correct').length;
  const incorrect = responses.filter((r) => r.status === 'incorrect').length;
  const skipped = responses.filter((r) => r.status === 'skipped').length;
  const totalQuestions = correct + incorrect;
  const accuracy = totalQuestions > 0 ? (correct / totalQuestions) * 100 : undefined;

  const timedResponses = responses.filter(
    (r) => r.status !== 'skipped' && r.time_spent != null,
  );
  const n = timedResponses.length;
  const avgTime = n > 0 ? timedResponses.reduce((sum, r) => sum + (r.time_spent!), 0) / n : undefined;
  const medianTime = n > 0 ? timedResponses.sort((a, b) => (a.time_spent!) - (b.time_spent!))[Math.floor(n/2)].time_spent! : undefined;

  return {
    totalQuestions,
    correct,
    incorrect,
    skipped,
    accuracy,
    avgTime,
    medianTime,
  };
};

type InProgressTopicSort = 'recent' | 'accuracy-asc' | 'completion-desc' | 'completion-asc';
type CompletedTopicSort = 'recent' | 'accuracy-asc';

const getTopicAccuracy = (
  topicId: string,
  responsesByTopic: Record<string, StudentResponse[]>,
): number | null => {
  const summary = buildSummary(responsesByTopic[topicId] ?? []);
  return summary.accuracy ?? null;
};

const sortTopics = (
  topics: TopicProgress[],
  sort: InProgressTopicSort | CompletedTopicSort,
  responsesByTopic: Record<string, StudentResponse[]>,
): TopicProgress[] => {
  const copy = [...topics];
  const byName = (a: TopicProgress, b: TopicProgress) =>
    (a.topic_name ?? a.topic).localeCompare(b.topic_name ?? b.topic);

  switch (sort) {
    case 'recent':
      return copy.sort(
        (a, b) =>
          new Date(b.last_accessed || 0).getTime() -
          new Date(a.last_accessed || 0).getTime(),
      );
    case 'accuracy-asc':
      return copy.sort((a, b) => {
        const accA = getTopicAccuracy(a.topic, responsesByTopic) ?? -1;
        const accB = getTopicAccuracy(b.topic, responsesByTopic) ?? -1;
        if (accA !== accB) return accA - accB;
        return byName(a, b);
      });
    case 'completion-desc':
      return copy.sort((a, b) => {
        const diff = b.completion_percentage - a.completion_percentage;
        if (diff !== 0) return diff;
        return byName(a, b);
      });
    case 'completion-asc':
      return copy.sort((a, b) => {
        const diff = a.completion_percentage - b.completion_percentage;
        if (diff !== 0) return diff;
        return byName(a, b);
      });
    default:
      return copy;
  }
};

const navigateToTopic = (topicId: string) => {
  window.location.hash = topicId;
};

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

  // progress is all topics that the user has started
  const inProgressTopics = useMemo(
    () =>
      progress.filter(
        (p) => p.total_subtopics && p.subtopics_completed < p.total_subtopics,
      ),
    [progress],
  );
  const completedTopics = useMemo(
    () =>
      progress.filter(
        (p) => p.total_subtopics && p.subtopics_completed >= p.total_subtopics,
      ),
    [progress],
  );

  const responsesByTopic = useMemo(() => {
    const grouped: Record<string, StudentResponse[]> = {};
    for (const r of responses) {
      if (!grouped[r.topic]) grouped[r.topic] = [];
      grouped[r.topic].push(r);
    }
    return grouped;
  }, [responses]);

  const lastTopic = useMemo(() => {
    const mostRecent = (topics: TopicProgress[]) =>
      sortTopics(topics, 'recent', responsesByTopic)[0];
    const inProgressRecent = mostRecent(inProgressTopics);
    const completedRecent = mostRecent(completedTopics);
    const inProgressLastTime = inProgressRecent?.last_accessed;
    const completedLastTime = completedRecent?.last_accessed;
    if (
      inProgressLastTime != null &&
      (completedLastTime == null ||
        new Date(inProgressLastTime).getTime() > new Date(completedLastTime).getTime())
    ) {
      return inProgressRecent;
    }
    return completedRecent;
  }, [responsesByTopic]);

  const handleContinueLearning = () => {
    if (!lastTopic) return;
    navigateToTopic(lastTopic.topic);
  };

  return (
    <div className="student-dashboard">
      <header className="student-dashboard__hero">
        <h1>Welcome back, {user.name}!</h1>
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
                <p className="stat-card__detail">Skipped: {summary.skipped}</p>
              </div>
            </div>

            <div className="stat-card stat-card--accent">
              <div className="stat-card__content">
                <p className="stat-card__label">Accuracy</p>
                <p className="stat-card__value">{summary.accuracy?.toFixed(0) ?? 'No data yet'}%</p>
                <p className="stat-card__detail">Correct: {summary.correct} • Incorrect: {summary.incorrect}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card__content">
                <p className="stat-card__label">Median Question Time</p>
                <p className="stat-card__value">{summary.medianTime?.toFixed(0) ?? 'No data yet'}s</p>
                <p className="stat-card__detail">Average: {summary.avgTime?.toFixed(0) ?? 'No data yet'}s</p>
              </div>
            </div>

            <div className="stat-card stat-card--success">
              <div className="stat-card__content">
                <p className="stat-card__label">Progress</p>
                <p className="stat-card__value">
                  {topicsCompleted} / {activeTopics}
                </p>
                <p className="stat-card__detail">topics completed</p>
              </div>
            </div>
          </section>

          <section className="student-dashboard__section">
            {inProgressTopics.length > 0 && (
              <TopicScrollSection
                variant="in-progress"
                title="Your In-Progress Topics"
                topics={inProgressTopics}
                expandedTopicId={expandedTopic}
                onExpandedChange={setExpandedTopic}
                responsesByTopic={responsesByTopic}
              />
            )}

            {completedTopics.length > 0 && (
              <TopicScrollSection
                variant="completed"
                title="Your Completed Topics"
                topics={completedTopics}
                expandedTopicId={expandedTopic}
                onExpandedChange={setExpandedTopic}
                responsesByTopic={responsesByTopic}
              />
            )}
          </section>

        </>
      )}
    </div>
  );
}

const IN_PROGRESS_SORT_OPTIONS: { value: InProgressTopicSort; label: string }[] = [
  { value: 'recent', label: 'Most recent' },
  { value: 'accuracy-asc', label: 'Accuracy (low to high)' },
  { value: 'completion-desc', label: 'Most complete' },
  { value: 'completion-asc', label: 'Least complete' },
];

const COMPLETED_SORT_OPTIONS: { value: CompletedTopicSort; label: string }[] = [
  { value: 'recent', label: 'Most recent' },
  { value: 'accuracy-asc', label: 'Accuracy (low to high)' },
];

function TopicScrollSection({
  variant,
  title,
  topics,
  expandedTopicId,
  onExpandedChange,
  responsesByTopic,
}: {
  variant: 'in-progress' | 'completed';
  title: string;
  topics: TopicProgress[];
  expandedTopicId: string | null;
  onExpandedChange: (topicId: string | null) => void;
  responsesByTopic: Record<string, StudentResponse[]>;
}) {
  const [sort, setSort] = useState<InProgressTopicSort | CompletedTopicSort>('recent');
  const scrollRef = useRef<HTMLDivElement>(null);
  const sortOptions = variant === 'in-progress' ? IN_PROGRESS_SORT_OPTIONS : COMPLETED_SORT_OPTIONS;

  const sortedTopics = useMemo(
    () => sortTopics(topics, sort, responsesByTopic),
    [topics, sort, responsesByTopic],
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ left: 0 });
  }, [sort]);

  const expandedTopic = expandedTopicId
    ? topics.find((t) => t.topic === expandedTopicId)
    : undefined;

  return (
    <div className="topics-section">
      <div className="topics-section__header">
        <h2>{title}</h2>
        <label className="topics-section__sort">
          <span className="topics-section__sort-label">Sort by</span>
          <select
            className="topics-section__sort-select"
            value={sort}
            onChange={(e) =>
              setSort(e.target.value as InProgressTopicSort | CompletedTopicSort)
            }
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="topics-scroll" ref={scrollRef}>
        {sortedTopics.map((topic) => (
          <TopicCard
            key={topic.topic}
            topic={topic}
            responses={responsesByTopic[topic.topic] ?? []}
            isSelected={expandedTopicId === topic.topic}
            onSelect={() =>
              onExpandedChange(expandedTopicId === topic.topic ? null : topic.topic)
            }
          />
        ))}
      </div>
      <TopicExpandedPanelShell
        open={!!expandedTopic}
        topic={expandedTopic}
        responses={
          expandedTopic ? responsesByTopic[expandedTopic.topic] ?? [] : []
        }
        onClose={() => onExpandedChange(null)}
      />
    </div>
  );
}

function TopicCard({
  topic,
  responses,
  isSelected,
  onSelect,
}: {
  topic: TopicProgress;
  responses: StudentResponse[];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const perc = topic.completion_percentage;
  const isComplete = perc >= 100;
  const totalSubtopics = topic.total_subtopics != null ? topic.total_subtopics : '?';

  const topicSummary = buildSummary(responses);
  return (
    <div
      role="button"
      tabIndex={0}
      className={`topic-card ${isComplete ? 'topic-card--complete' : ''} ${isSelected ? 'topic-card--selected' : ''}`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      style={
        isComplete
          ? undefined
          : {
              background: `linear-gradient(to right, var(--overlay-success-15) ${perc}%, var(--bg-dashboard-card) ${perc}%)`,
            }
      }
    >
      <div className="topic-card__header">
        <h3>{topic.topic_name}</h3>
        <button
          type="button"
          className="topic-card__badge"
          aria-label={`Open ${topic.topic_name ?? 'topic'}`}
          onClick={(e) => {
            e.stopPropagation();
            navigateToTopic(topic.topic);
          }}
        >
          {isComplete ? '✓' : `${perc.toFixed(0)}%`}
          <FontAwesomeIcon icon={faPlay} className="topic-card__badge-icon" aria-hidden />
        </button>
      </div>

      <div className="topic-card__stats">
        <div className="topic-stat">
          <span className="topic-stat__value">
            {topic.subtopics_completed} {isComplete ? '✓' : `/ ${totalSubtopics}`}
          </span>
          <span className="topic-stat__label">subtopics</span>
        </div>
        {responses.length > 0 ? (
          <div className="topic-stat">
            <span className="topic-stat__value">
              {topicSummary.correct} / {topicSummary.totalQuestions}
            </span>
            <span className="topic-stat__label">correct</span>
          </div>
        ) : (
          <div className="topic-stat">
            <span className="topic-stat__value">{topic.questions_answered}</span>
            <span className="topic-stat__label">questions answered</span>
          </div>
        )}
        {responses.length > 0 && (
          <div className="topic-stat">
            <span className="topic-stat__value">
              {topicSummary.accuracy?.toFixed(0) ?? 'No data yet'}%
            </span>
            <span className="topic-stat__label">accuracy</span>
          </div>
        )}
      </div>

      {topic.last_accessed && (
        <div className="topic-card__footer">
          Last practiced: {formatLastAccessed(topic.last_accessed)}
        </div>
      )}
    </div>
  );
}

function TopicExpandedPanelShell({
  open,
  topic,
  responses,
  onClose,
}: {
  open: boolean;
  topic: TopicProgress | undefined;
  responses: StudentResponse[];
  onClose: () => void;
}) {
  const [shown, setShown] = useState(open);
  const [expanded, setExpanded] = useState(open);
  const frozenTopic = useRef<TopicProgress | undefined>(topic);
  const frozenResponses = useRef(responses);
  const openRef = useRef(open);
  openRef.current = open;

  if (topic) {
    frozenTopic.current = topic;
    frozenResponses.current = responses;
  }

  useEffect(() => {
    if (open) {
      setShown(true);
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setExpanded(true));
      });
      return () => cancelAnimationFrame(frame);
    }
    setExpanded(false);
  }, [open]);

  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || e.propertyName !== 'grid-template-rows') {
      return;
    }
    if (!openRef.current) {
      setShown(false);
    }
  };

  if (!shown || !frozenTopic.current) {
    return null;
  }

  return (
    <div
      className={`topic-expanded-panel-shell ${expanded ? 'is-open' : ''}`}
      onTransitionEnd={handleTransitionEnd}
    >
      <div className="topic-expanded-panel-shell__inner">
        <TopicExpandedPanel
          topic={frozenTopic.current}
          responses={frozenResponses.current}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

function TopicExpandedPanel({
  topic,
  responses,
  onClose,
}: {
  topic: TopicProgress;
  responses: StudentResponse[];
  onClose: () => void;
}) {
  const perc = topic.completion_percentage;
  const isComplete = perc >= 100;

  return (
    <div className="topic-expanded-panel">
      <div
        className="topic-expanded-panel__header"
        role="button"
        tabIndex={0}
        aria-label={`Close ${topic.topic_name} details`}
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClose();
          }
        }}
      >
        <h3>{topic.topic_name}</h3>
        <div className="topic-expanded-panel__header-actions">
          <button
            type="button"
            className="topic-card__badge"
            aria-label={`Open ${topic.topic_name ?? 'topic'}`}
            onClick={(e) => {
              e.stopPropagation();
              navigateToTopic(topic.topic);
            }}
          >
            <FontAwesomeIcon icon={faPlay} className="topic-card__badge-icon" aria-hidden />
            {isComplete ? 'Complete' : `${perc.toFixed(0)}%`}
          </button>
          <span className="topic-expanded-panel__close">Close</span>
        </div>
      </div>
      <div className="topic-expanded-panel__review">
        {responses.length === 0 ? (
          <p className="completed-topic-item__empty">No recorded answers for this topic.</p>
        ) : (
          responses.map((r) => (
            <div key={r.id} className={`response-row response-row--${r.status}`}>
              <div
                className={`activity-item__indicator activity-item__indicator--${r.status}`}
              >
                {r.status === 'correct' ? '✓' : r.status === 'incorrect' ? '✗' : '—'}
              </div>
              <div className="response-row__content">
                <div className="response-row__subtopic">{r.subtopic_type}</div>
                <pre className="response-row__code">{r.question_code}</pre>
                <div className="response-row__answers">
                  {r.status === 'correct' ? (
                    <>
                      Your answer:{' '}
                      <span className="response-row__correct">{r.student_answer}</span>
                    </>
                  ) : (
                    <>
                      {r.student_answer != null ? (
                        <>
                          Your answer:{' '}
                          <span className="response-row__student">{r.student_answer}</span>
                        </>
                      ) : (
                        <span className="response-row__skipped">Skipped.</span>
                      )}
                      Correct:{' '}
                      <span className="response-row__correct">{r.correct_answer}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="response-row__time">{r.time_spent}s</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
