import type { Answer } from '../topics';
import type { Exception, PyType } from '../python';

export type QuestionKind =
  | 'eval-last-line'
  | 'code-output'
  | 'code-write'
  | 'func-write'
  | 'code-edit'
  | 'trace-order'
  | 'conceptual';

export class TopicContext {
  sharedCode: string|undefined = undefined;
  constructor(sharedCode: string|undefined = undefined) {
    this.sharedCode = sharedCode;
  }
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
  correct: string | Exception;
  options: (string | Exception)[];
  input?: string[] | string;
}

export interface CodeWriteQuestion extends QuestionBase<'code-write'> {
  prompt: string;
  correct: string;
  options: string[];
  variables: string[];
  testCases: { values: PyType[], expected: PyType }[];
}

export interface FuncWriteQuestion extends QuestionBase<'func-write'> {
  prompt: string;
  correct: string;
  options: string[];
  name: string;
  testCases: { args: PyType[], expected: PyType }[];
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
  | CodeWriteQuestion
  | FuncWriteQuestion
  | CodeEditQuestion
  | TraceOrderQuestion
  | ConceptualQuestion;

export type QuestionFor<K extends QuestionKind> = Extract<Question, { kind: K }>;

export type UserAnswerFor<K extends QuestionKind> =
  K extends 'eval-last-line' ? Answer :
  K extends 'code-output' ? string | Exception :
  K extends 'code-write' ? string :
  K extends 'func-write' ? string :
  K extends 'code-edit' ? string :
  K extends 'trace-order' ? number[] :
  K extends 'conceptual' ? string :
  never;

export type UserAnswer = UserAnswerFor<QuestionKind>;
