import type React from 'react';
import type {
  Question,
  QuestionFor,
  QuestionKind,
  UserAnswer,
  UserAnswerFor,
} from './types';
import { evalLastLineDef } from './eval-last-line';
import { codeOutputDef } from './code-output';
import { codeWriteDef } from './code-write.tsx';
import { funcWriteDef } from './func-write.tsx';
import { conceptualDef } from './conceptual.tsx';
import { SKIPPED } from '../App';

export interface SerializedResponse {
  questionPayload: string;
  studentAnswer: string | null;
  correctAnswer: string;
}

export interface QuestionViewProps<K extends QuestionKind> {
  question: QuestionFor<K>;
  // SKIPPED is a special value that indicates the question was skipped/unanswered
  // undefined is a special value that indicates the question was not answered yet
  userAnswer: UserAnswerFor<K> | typeof SKIPPED | undefined;
  isQuiz: boolean;
  readOnly: boolean;
  isCorrect: boolean;
  onSkip: (() => void) | undefined;
  helpMessage?: string;
  // onAnswer is called when the user answers the question
  // undefined and empty string are equivalent and indicate the question was skipped/unanswered
  onAnswer: (element: EventTarget | null, answer: UserAnswerFor<K> | undefined) => void;
}

export interface QuestionTypeDef<K extends QuestionKind> {
  kind: K;
  // user answer must be an actual answer, not undefined or SKIPPED
  checkAnswer: (question: QuestionFor<K>, user: UserAnswerFor<K>) => boolean | Promise<boolean>;
  // user answer must be an answer or null if the question was skipped/unanswered (one place where SKIPPED is not used, but null is)
  serialize: (question: QuestionFor<K>, user: UserAnswerFor<K> | null) => SerializedResponse;
  // user answer is returned as undefined if the question was skipped/unanswered/not yet answered
  unserialize: (response: SerializedResponse) => { question: QuestionFor<K>, userAnswer: UserAnswerFor<K> | undefined };
  View: React.FC<QuestionViewProps<K>>;
}

export const QUESTION_TYPES: { [K in QuestionKind]: QuestionTypeDef<K> } = {
  'eval-last-line': evalLastLineDef,
  'code-output': codeOutputDef,
  'code-write': codeWriteDef,
  'func-write': funcWriteDef,
  'conceptual': conceptualDef,
};

export function checkAnswer(
  question: Question,
  user: UserAnswer,
): boolean | Promise<boolean> {
  return QUESTION_TYPES[question.kind].checkAnswer(question as never, user as never);
}

export function serialize(
  question: Question,
  user: UserAnswer | null,
): SerializedResponse {
  return QUESTION_TYPES[question.kind].serialize(question as never, user as never);
}

export function unserialize(
  kind: QuestionKind,
  response: SerializedResponse,
): { question: QuestionFor<QuestionKind>, userAnswer: UserAnswerFor<QuestionKind> | undefined } | null {
  return QUESTION_TYPES[kind].unserialize(response);
}
