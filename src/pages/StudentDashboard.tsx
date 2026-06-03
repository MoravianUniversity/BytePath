import { useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faXmark } from '@fortawesome/free-solid-svg-icons';

import type { User } from '../services/auth';
import { progressService, type TopicProgress } from '../services/progress';
import { responsesService, type StudentResponse } from '../services/responses';
import StatsQuestionRow from '../components/StatsQuestionRow';
import './Dashboards.css';
import './StudentDashboard.css';
import { formatDateTime } from '../util';
import { TopicMetadata, topicsService } from '../services/topics';

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
  medianTime?: number;
  medianTimeCorrect?: number;
  medianTimeIncorrect?: number;
}

const buildSummary = (responses: StudentResponse[]): SummaryStats => {
  const correct = responses.filter((r) => r.status === 'correct').length;
  const incorrect = responses.filter((r) => r.status === 'incorrect').length;
  const skipped = responses.filter((r) => r.status === 'skipped').length;
  const totalQuestions = correct + incorrect;
  const accuracy = totalQuestions > 0 ? (correct / totalQuestions) * 100 : undefined;

  const timedResponses = responses.filter(r => r.status !== 'skipped' && r.time_spent != null);
  const n = timedResponses.length;
  const medianTime = n > 0 ? timedResponses.sort((a, b) => (a.time_spent!) - (b.time_spent!))[Math.floor(n/2)].time_spent! : undefined;

  const correctResponses = timedResponses.filter(r => r.status === 'correct');
  const medianTimeCorrect = correctResponses.length > 0 ? correctResponses.sort((a, b) => (a.time_spent!) - (b.time_spent!))[Math.floor(correctResponses.length/2)].time_spent! : undefined;

  const incorrectResponses = timedResponses.filter(r => r.status === 'incorrect');
  const medianTimeIncorrect = incorrectResponses.length > 0 ? incorrectResponses.sort((a, b) => (a.time_spent!) - (b.time_spent!))[Math.floor(incorrectResponses.length/2)].time_spent! : undefined;

  return {
    totalQuestions,
    correct,
    incorrect,
    skipped,
    accuracy,
    medianTime,
    medianTimeCorrect,
    medianTimeIncorrect,
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
  const byName = (a: TopicProgress, b: TopicProgress) => a.topic_name.localeCompare(b.topic_name);

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
        const diff = b.best_completion_percentage - a.best_completion_percentage;
        if (diff !== 0) return diff;
        return byName(a, b);
      });
    case 'completion-asc':
      return copy.sort((a, b) => {
        const diff = a.best_completion_percentage - b.best_completion_percentage;
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

type ReviewResponseStatus = 'correct' | 'incorrect' | 'skipped';
type ReviewResponsesSort = 'recent' | 'toughest' | 'easiest';

const REVIEW_SORT_OPTIONS: { value: ReviewResponsesSort; label: string }[] = [
  { value: 'toughest', label: 'Toughest questions' },
  { value: 'easiest', label: 'Easiest questions' },
  { value: 'recent', label: 'Most recent' },
];

function normalizeResponseStatus(response: StudentResponse): ReviewResponseStatus {
  if (
    response.status === 'correct' ||
    response.status === 'incorrect' ||
    response.status === 'skipped'
  ) {
    return response.status;
  }
  if (response.student_answer === null) return 'skipped';
  return response.is_correct ? 'correct' : 'incorrect';
}

function subtopicAccuracyByName(responses: StudentResponse[]): Map<string, number | null> {
  const bySubtopic = new Map<string, StudentResponse[]>();
  for (const r of responses) {
    const group = bySubtopic.get(r.subtopic_type);
    if (group) group.push(r);
    else bySubtopic.set(r.subtopic_type, [r]);
  }
  const accuracies = new Map<string, number | null>();
  for (const [name, group] of bySubtopic) {
    const graded = group.filter((r) => normalizeResponseStatus(r) !== 'skipped');
    if (graded.length === 0) {
      accuracies.set(name, null);
    } else {
      const correct = graded.filter((r) => normalizeResponseStatus(r) === 'correct').length;
      accuracies.set(name, correct / graded.length);
    }
  }
  return accuracies;
}

function filterReviewResponses(
  responses: StudentResponse[],
  show: { correct: boolean; incorrect: boolean; skipped: boolean },
): StudentResponse[] {
  return responses.filter((r) => {
    const status = normalizeResponseStatus(r);
    if (status === 'correct') return show.correct;
    if (status === 'incorrect') return show.incorrect;
    return show.skipped;
  });
}

function subtopicDifficultyKey(
  subtopic: string,
  accuracyMap: Map<string, number | null>,
  sort: 'toughest' | 'easiest',
): number {
  const acc = accuracyMap.get(subtopic);
  if (acc == null) return sort === 'toughest' ? Infinity : -Infinity;
  return acc;
}

const STATUS_ORDER_TOUGHEST: Record<ReviewResponseStatus, number> = {
  incorrect: 0,
  skipped: 1,
  correct: 2,
};

const STATUS_ORDER_EASIEST: Record<ReviewResponseStatus, number> = {
  correct: 0,
  skipped: 1,
  incorrect: 2,
};

function sortWithinSubtopic(
  responses: StudentResponse[],
  sort: 'toughest' | 'easiest',
): StudentResponse[] {
  const statusOrder = sort === 'toughest' ? STATUS_ORDER_TOUGHEST : STATUS_ORDER_EASIEST;
  return [...responses].sort((a, b) => {
    const orderA = statusOrder[normalizeResponseStatus(a)];
    const orderB = statusOrder[normalizeResponseStatus(b)];
    if (orderA !== orderB) return orderA - orderB;
    return new Date(b.attempted_at).getTime() - new Date(a.attempted_at).getTime();
  });
}

type ReviewResponseGroup = {
  subtopicName: string;
  accuracy: number | null;
  responses: StudentResponse[];
};

type DisplayedReviewItems =
  | { mode: 'flat'; responses: StudentResponse[] }
  | { mode: 'grouped'; groups: ReviewResponseGroup[] };

function formatSubtopicAccuracy(accuracy: number | null): string {
  if (accuracy == null) return 'No graded answers';
  return `${(accuracy * 100).toFixed(0)}% accuracy`;
}

function buildGroupedReviewResponses(
  responses: StudentResponse[],
  sort: 'toughest' | 'easiest',
  subtopicAccuracy: Map<string, number | null>,
): ReviewResponseGroup[] {
  const bySubtopic = new Map<string, StudentResponse[]>();
  for (const r of responses) {
    const group = bySubtopic.get(r.subtopic_type);
    if (group) group.push(r);
    else bySubtopic.set(r.subtopic_type, [r]);
  }

  const subtopicNames = [...bySubtopic.keys()].sort((a, b) => {
    const keyA = subtopicDifficultyKey(a, subtopicAccuracy, sort);
    const keyB = subtopicDifficultyKey(b, subtopicAccuracy, sort);
    const diff = sort === 'toughest' ? keyA - keyB : keyB - keyA;
    if (diff !== 0) return diff;
    return a.localeCompare(b);
  });

  return subtopicNames.map((subtopicName) => ({
    subtopicName,
    accuracy: subtopicAccuracy.get(subtopicName) ?? null,
    responses: sortWithinSubtopic(bySubtopic.get(subtopicName)!, sort),
  }));
}

function prepareDisplayedReview(
  responses: StudentResponse[],
  sort: ReviewResponsesSort,
  subtopicAccuracy: Map<string, number | null>,
): DisplayedReviewItems {
  if (sort === 'recent') {
    return {
      mode: 'flat',
      responses: [...responses].sort(
        (a, b) => new Date(b.attempted_at).getTime() - new Date(a.attempted_at).getTime(),
      ),
    };
  }
  return {
    mode: 'grouped',
    groups: buildGroupedReviewResponses(responses, sort, subtopicAccuracy),
  };
}

function reviewItemCount(displayed: DisplayedReviewItems): number {
  if (displayed.mode === 'flat') return displayed.responses.length;
  return displayed.groups.reduce((n, g) => n + g.responses.length, 0);
}

function SummaryStatCards({
  summary,
  completed,
  total,
  progressDetail,
  className = 'summary-stat-cards',
  style = 'expanded',
}: {
  summary: SummaryStats;
  completed: number;
  total: number;
  progressDetail: string;
  className?: string;
  style?: 'compact' | 'expanded';
}) {
  const separator = style === 'compact' ? '\n' : ' • ';
  return (
    <section className={className}>
      <div className="stat-card stat-card--success">
        <div className="stat-card__content">
          <p className="stat-card__label">Progress</p>
          <p className="stat-card__value">{completed} / {total}{completed === total ? ' 😀' : ''}</p>
          <p className="stat-card__detail">{progressDetail}</p>
        </div>
      </div>

      <div className="stat-card stat-card--primary">
        <div className="stat-card__content">
          <p className="stat-card__label">Answers</p>
          <p className="stat-card__value">{summary.totalQuestions}</p>
          {summary.skipped > 0 && (
            <p className="stat-card__detail">Skipped: {summary.skipped}</p>
          )}
        </div>
      </div>

      <div className="stat-card stat-card--accent">
        <div className="stat-card__content">
          <p className="stat-card__label">Accuracy</p>
          <p className="stat-card__value">
            {summary.accuracy != null ? `${summary.accuracy.toFixed(0)}%` : 'No data yet'}{summary.accuracy === 100 ? ' 🥳' : ''}
          </p>
          {summary.incorrect > 0 && (
            <p className="stat-card__detail">Correct: {summary.correct}{separator}Incorrect: {summary.incorrect}</p>
          )}
        </div>
      </div>

      <div className="stat-card" title="Median question time, per question">
        <div className="stat-card__content">
          <p className="stat-card__label">Question Time</p>
          <p className="stat-card__value">
            {summary.medianTime != null ? `${summary.medianTime.toFixed(0)}s` : 'No data yet'}
          </p>
          {summary.incorrect > 0 ? (
            <p className="stat-card__detail">
              Correct: {summary.medianTimeCorrect!.toFixed(0)}s{separator}Incorrect: {summary.medianTimeIncorrect!.toFixed(0)}s
            </p>
          ) : (
            <p className="stat-card__detail">per question</p>
          )}
        </div>
      </div>
    </section>
  );
}

export default function StudentDashboard({ user, currentClassId }: StudentDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<TopicProgress[]>([]);
  const [responses, setResponses] = useState<StudentResponse[]>([]);
  const [topics, setTopics] = useState<TopicMetadata[]>([]);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      progressService.getUserProgress(user.id, currentClassId),
      responsesService.getStudentResponses(user.id, currentClassId),
      topicsService.getTopics(),
    ])
      .then(([progressData, responseData, topicsData]) => {
        if (!mounted) {
          return;
        }
        setProgress(progressData);
        setTopics(topicsData);
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

  // progress is all topics that the user has started
  const inProgressTopics = useMemo(
    () =>
      progress.filter(p => p.total_subtopics && p.max_subtopics_completed < p.total_subtopics),
    [progress],
  );
  const completedTopics = useMemo(
    () =>
      progress.filter(p => p.total_subtopics && p.max_subtopics_completed >= p.total_subtopics),
    [progress],
  );
  const topicsCompleted = completedTopics.length;
  const totalTopics = topics.filter(t => t.is_visible).length;

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
          <SummaryStatCards
            className="summary-stat-cards student-dashboard__quick-stats"
            summary={summary}
            completed={topicsCompleted}
            total={totalTopics}
            progressDetail="topics completed"
          />

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

const IN_PROGRESS_SORT_STORAGE_KEY = 'studentDashboardInProgressSort';
const COMPLETED_SORT_STORAGE_KEY = 'studentDashboardCompletedSort';

function readStoredTopicSort<T extends string>(
  key: string,
  valid: readonly T[],
  fallback: T,
): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved && (valid as readonly string[]).includes(saved)) {
      return saved as T;
    }
  } catch {
    // ignore quota / private mode errors
  }
  return fallback;
}

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
  const sortOptions = variant === 'in-progress' ? IN_PROGRESS_SORT_OPTIONS : COMPLETED_SORT_OPTIONS;
  const sortStorageKey =
    variant === 'in-progress' ? IN_PROGRESS_SORT_STORAGE_KEY : COMPLETED_SORT_STORAGE_KEY;
  const validSortValues = sortOptions.map((o) => o.value);

  const [sort, setSort] = useState<InProgressTopicSort | CompletedTopicSort>(() =>
    readStoredTopicSort(sortStorageKey, validSortValues, 'recent'),
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(sortStorageKey, sort);
  }, [sortStorageKey, sort]);

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
  const perc = topic.best_completion_percentage;
  const isComplete = perc >= 100;

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
          aria-label={`Open ${topic.topic_name}`}
          onClick={(e) => {
            e.stopPropagation();
            navigateToTopic(topic.topic);
          }}
        >
          {isComplete ? '' : `${perc.toFixed(0)}%`}
          <FontAwesomeIcon icon={faPlay} className="topic-card__badge-icon" aria-hidden />
        </button>
      </div>

      <div className="topic-card__stats">
        <div className="topic-stat">
          <span className="topic-stat__value">
            {topic.max_subtopics_completed} {isComplete ? '😀' : `/ ${topic.total_subtopics}`}
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
              {topicSummary.accuracy == null ? "No data yet" : topicSummary.accuracy === 100 ? '🥳' : `${topicSummary.accuracy.toFixed(0)}%`}
            </span>
            <span className="topic-stat__label">accuracy</span>
          </div>
        )}
      </div>

      {topic.last_accessed && (
        <div className="topic-card__footer">
          Last practiced: {formatDateTime(topic.last_accessed)}
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
  const reviewRef = useRef<HTMLDivElement>(null);
  const topicSummary = useMemo(() => buildSummary(responses), [responses]);
  const subtopicAccuracy = useMemo(() => subtopicAccuracyByName(responses), [responses]);
  const [showCorrect, setShowCorrect] = useState(true);
  const [showIncorrect, setShowIncorrect] = useState(true);
  const [showSkipped, setShowSkipped] = useState(true);
  const [reviewSort, setReviewSort] = useState<ReviewResponsesSort>('toughest');

  const displayedReview = useMemo(() => {
    const filtered = filterReviewResponses(responses, {
      correct: showCorrect,
      incorrect: showIncorrect,
      skipped: showSkipped,
    });
    return prepareDisplayedReview(filtered, reviewSort, subtopicAccuracy);
  }, [
    responses,
    showCorrect,
    showIncorrect,
    showSkipped,
    reviewSort,
    subtopicAccuracy,
  ]);

  useEffect(() => {
    reviewRef.current?.scrollTo({ top: 0 });
  }, [topic.topic, showCorrect, showIncorrect, showSkipped, reviewSort]);

  return (
    <div className="topic-expanded-panel">
      <div className="topic-expanded-panel__header">
        <h3>{topic.topic_name}</h3>
        <div className="topic-expanded-panel__header-actions">
          <button
            type="button"
            className="topic-card__badge"
            aria-label={`Open ${topic.topic_name}`}
            onClick={(e) => {
              e.stopPropagation();
              navigateToTopic(topic.topic);
            }}
          >
            Play
            <FontAwesomeIcon icon={faPlay} aria-hidden />
          </button>
          <button
            type="button" className="topic-expanded-panel__close"
              aria-label={`Close ${topic.topic_name} details`}
              onClick={onClose}
            >
            Close
            <FontAwesomeIcon icon={faXmark} aria-hidden />
          </button>
        </div>
      </div>
      <SummaryStatCards
        style="compact"
        className="summary-stat-cards topic-expanded-panel__stats"
        summary={topicSummary}
        completed={topic.max_subtopics_completed}
        total={topic.total_subtopics}
        progressDetail="subtopics completed"
      />
      {responses.length > 0 && (
        <div className="topic-expanded-panel__controls">
          <fieldset
            className="topic-expanded-panel__status-filters"
            aria-label="Show"
          >
            <span className="topic-expanded-panel__controls-label">Show:</span>
            <label className="topic-expanded-panel__status-option">
              <input
                type="checkbox"
                checked={showCorrect}
                onChange={(e) => setShowCorrect(e.target.checked)}
              />
              Correct
            </label>
            <label className="topic-expanded-panel__status-option">
              <input
                type="checkbox"
                checked={showIncorrect}
                onChange={(e) => setShowIncorrect(e.target.checked)}
              />
              Incorrect
            </label>
            <label className="topic-expanded-panel__status-option">
              <input
                type="checkbox"
                checked={showSkipped}
                onChange={(e) => setShowSkipped(e.target.checked)}
              />
              Skipped
            </label>
          </fieldset>
          <label className="topic-expanded-panel__review-sort topics-section__sort">
            <span className="topics-section__sort-label">Sort by</span>
            <select
              className="topics-section__sort-select"
              value={reviewSort}
              onChange={(e) => setReviewSort(e.target.value as ReviewResponsesSort)}
            >
              {REVIEW_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      <div className="topic-expanded-panel__review" ref={reviewRef}>
        {responses.length === 0 ? (
          <p className="completed-topic-item__empty">No recorded answers for this topic.</p>
        ) : reviewItemCount(displayedReview) === 0 ? (
          <p className="completed-topic-item__empty">No answers match the selected filters.</p>
        ) : displayedReview.mode === 'flat' ? (
          displayedReview.responses.map((r) => <StatsQuestionRow key={r.id} response={r} />)
        ) : (
          displayedReview.groups.map((group) => (
            <section
              key={group.subtopicName}
              className="topic-expanded-panel__subtopic-group"
            >
              <header className="topic-expanded-panel__subtopic-header">
                <span className="topic-expanded-panel__subtopic-name">{group.subtopicName}</span>
                <span className="topic-expanded-panel__subtopic-accuracy">
                  {formatSubtopicAccuracy(group.accuracy)}
                </span>
              </header>
              {group.responses.map((r) => (
                <StatsQuestionRow key={r.id} response={r} />
              ))}
            </section>
          ))
        )}
      </div>
    </div>
  );
}
