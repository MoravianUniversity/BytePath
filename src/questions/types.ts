import type { Answer } from '../topics';

export type QuestionKind =
  | 'eval-last-line'
  | 'code-output'
  | 'code-edit'
  | 'trace-order'
  | 'conceptual';

export interface GenerateContext {
  sharedCode?: string;
  mode: 'learning' | 'quiz';
}

interface QuestionBase<K extends QuestionKind> {
  kind: K;
  forceQuiz?: boolean;
}

export interface EvalLastLineQuestion extends QuestionBase<'eval-last-line'> {
  code: string;
  correct: Answer;
  options: Answer[];
  input?: string[] | string;
}

export interface CodeOutputQuestion extends QuestionBase<'code-output'> {
  code: string;
  correct: string;
  options: string[];
  input?: string[] | string;
}

export interface CodeEditQuestion extends QuestionBase<'code-edit'> {
  starterCode: string;
}

export interface TraceOrderQuestion extends QuestionBase<'trace-order'> {
  items: string[];
  correctOrder: number[];
}

export interface ConceptualQuestion extends QuestionBase<'conceptual'> {
  prompt: string;
  correct: string;
  options: string[];
}

export type Question =
  | EvalLastLineQuestion
  | CodeOutputQuestion
  | CodeEditQuestion
  | TraceOrderQuestion
  | ConceptualQuestion;

export type QuestionFor<K extends QuestionKind> = Extract<Question, { kind: K }>;

export type UserAnswerFor<K extends QuestionKind> =
  K extends 'eval-last-line' ? Answer :
  K extends 'code-output' ? string :
  K extends 'code-edit' ? string :
  K extends 'trace-order' ? number[] :
  K extends 'conceptual' ? string :
  never;

export type UserAnswer = UserAnswerFor<QuestionKind>;
