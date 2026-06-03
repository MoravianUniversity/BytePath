import { useEffect, useMemo } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';

import { SKIPPED } from '../App';
import { TOPICS } from '../all_topics';
import { QUESTION_TYPES, unserialize } from '../questions/registry';
import { Topic, TopicGroup, Subtopic } from '../topics';
import type { StudentResponse } from '../services/responses';
import type { QuestionFor, QuestionKind, UserAnswerFor } from '../questions/types';
import { formatDateTime } from '../util';
import '../code.css';


function statusIndicator(status: string): string {
  if (status === 'correct') return '✓';
  if (status === 'incorrect') return '✗';
  return '—';
}

function collectTopics(items: (Topic | TopicGroup)[]): Topic[] {
  const topics: Topic[] = [];
  for (const item of items) {
    if (item instanceof Topic) {
      topics.push(item);
    } else if (item instanceof TopicGroup) {
      topics.push(...collectTopics(item.topics));
    }
  }
  return topics;
}

const ALL_TOPICS = collectTopics(TOPICS);

function findSubtopic(topicId: string, subtopicType: string): Subtopic | null {
  const topic = ALL_TOPICS.find((t) => t.id === topicId);
  if (!topic) return null;
  return topic.subtopics.find((s) => s.constructor.name === subtopicType) ?? null;
}

export function unserializeResponse(
  response: StudentResponse,
): { subtopic: Subtopic, question: QuestionFor<QuestionKind>, userAnswer: UserAnswerFor<QuestionKind> | null | undefined } | null {
  const subtopic = findSubtopic(response.topic, response.subtopic_type);
  if (!subtopic) return null;
  const deserialized = unserialize(subtopic.kind, {
    questionPayload: response.question_code,
    studentAnswer: response.student_answer ?? null,
    correctAnswer: response.correct_answer,
  });
  if (!deserialized) return null;
  return { subtopic, ...deserialized };
}

function StatsQuestionRowFallback({ response }: { response: StudentResponse }) {
  const status =
    response.status === 'correct' || response.status === 'incorrect' || response.status === 'skipped'
      ? response.status
      : 'skipped';

  return (
    <div className={`stats-question-row stats-question-row--${status}`}>
      <div className="stats-question-row__aside">
        <div className={`activity-item__indicator activity-item__indicator--${status}`}>
          {statusIndicator(status)}
        </div>
        <div className="stats-question-row__time">{response.time_spent}s</div>
      </div>
      <div className="stats-question-row__body">
        <div className="stats-question-row__subtopic">{response.subtopic_type}</div>
        <pre className="stats-question-row__code-fallback">{response.question_code}</pre>
        <div className="stats-question-row__answers-fallback">
          {response.status === 'correct' ? (
            <>
              Your answer:{' '}
              <span className="response-row__correct">{response.student_answer}</span>
            </>
          ) : (
            <>
              {response.student_answer != null ? (
                <>
                  Your answer:{' '}
                  <span className="response-row__student">{response.student_answer}</span>
                </>
              ) : (
                <span className="response-row__skipped">Skipped.</span>
              )}
              Correct:{' '}
              <span className="response-row__correct">{response.correct_answer}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StatsQuestionRow({ response }: { response: StudentResponse }) {
  const {subtopic, question, userAnswer} = useMemo(() =>
    unserializeResponse(response) ?? {subtopic: null, question: null, userAnswer: null}, [response]);
  if (!question) { return <StatsQuestionRowFallback response={response} />; }

  const status =
    response.status === 'correct' || response.status === 'incorrect' || response.status === 'skipped'
      ? response.status
      : response.student_answer === null
        ? 'skipped'
        : response.is_correct
          ? 'correct'
          : 'incorrect';

  useEffect(() => {
    Prism.highlightAll();
  }, [question, userAnswer, response.id]);

  const def = QUESTION_TYPES[question.kind];
  const isCorrect = response.is_correct && userAnswer !== undefined && userAnswer !== SKIPPED;

  return (
    <div className={`stats-question-row stats-question-row--${status}`}>
      <div className="stats-question-row__aside">
        <div className={`activity-item__indicator activity-item__indicator--${status}`}>
          {statusIndicator(status)}
        </div>
        <div className="stats-question-row__time">{response.time_spent}s</div>
        <div className="stats-question-row__datetime">{formatDateTime(response.attempted_at)?.replace(',', '\n')}</div>
      </div>
      <div className="stats-question-row__body">
        <div className="stats-question-row__subtopic">{response.subtopic_type}</div>
        <div className="stats-question-view">
          <def.View
            question={question as never}
            userAnswer={userAnswer === undefined ? SKIPPED : userAnswer as never}
            isQuiz={false}
            readOnly={true}
            isCorrect={isCorrect}
            onSkip={undefined}
            onAnswer={() => {}}
            helpMessage={subtopic?.getMostHelpfulMessage()}
          />
        </div>
      </div>
    </div>
  );
}
