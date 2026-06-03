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
  userAnswer: UserAnswerFor<K> | typeof SKIPPED | undefined;
  isQuiz: boolean;
  isShowingStats?: boolean;
  isCorrect: boolean;
  onSkip: (() => void) | undefined;
  helpMessage?: string;
  onAnswer: (element: EventTarget | null, answer: UserAnswerFor<K> | undefined) => void;
}

export interface QuestionTypeDef<K extends QuestionKind> {
  kind: K;
  checkAnswer: (
    question: QuestionFor<K>,
    user: UserAnswerFor<K>,
  ) => boolean | Promise<boolean>;
  serializeResponse: (
    question: QuestionFor<K>,
    user: UserAnswerFor<K> | null,
  ) => SerializedResponse;
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
  const def = QUESTION_TYPES[question.kind];
  return def.checkAnswer(question as never, user as never);
}

export function serializeQuestionResponse(
  question: Question,
  user: UserAnswer | null,
): SerializedResponse {
  const def = QUESTION_TYPES[question.kind];
  return def.serializeResponse(question as never, user as never);
}
