import type { Answer } from '../topics';
import type { Exception, PyType } from '../python';

export type QuestionKind =
  | 'eval-last-line'
  | 'code-output'
  | 'code-write'
  | 'func-write'
  | 'conceptual';

export class TopicContext {
  sharedCode: string|undefined = undefined;
  constructor(sharedCode: string|undefined = undefined) {
    this.sharedCode = sharedCode;
  }
}

interface QuestionBase<K extends QuestionKind> {
  kind: K;
}

export interface EvalLastLineQuestion extends QuestionBase<'eval-last-line'> {
  code: string;
  correct: Answer;
  options: Answer[];
  input?: string[] | string;
  sharedCode?: string;
}

export interface CodeOutputQuestion extends QuestionBase<'code-output'> {
  code: string;
  correct: string | Exception;
  options: (string | Exception)[];
  input?: string[] | string;
  sharedCode?: string;
}

export interface CodeWriteQuestion extends QuestionBase<'code-write'> {
  prompt: string;
  correct: string;
  options: string[];
  variables: string[];
  testCases: { values: PyType[], expected: PyType }[];
  testsUseOutput?: boolean;
  transform?: (answer: string) => string;
}

export interface FuncWriteQuestion extends QuestionBase<'func-write'> {
  prompt: string;
  correct: string;
  options: string[];
  name: string;
  testCases: { args: PyType[], expected: PyType }[];
  testsUseOutput?: boolean;
}

export interface ConceptualQuestion extends QuestionBase<'conceptual'> {
  prompt: string;
  correct: string | string[] | { display: string, check: (answer: string) => boolean };
  options: string[];
  fuzzyMatch?: boolean;
}

export type Question =
  | EvalLastLineQuestion
  | CodeOutputQuestion
  | CodeWriteQuestion
  | FuncWriteQuestion
  | ConceptualQuestion;

export type QuestionFor<K extends QuestionKind> = Extract<Question, { kind: K }>;

export type UserAnswerFor<K extends QuestionKind> =
  K extends 'eval-last-line' ? Answer :
  K extends 'code-output' ? string | Exception :
  K extends 'code-write' ? string :
  K extends 'func-write' ? string :
  K extends 'conceptual' ? string :
  never;

export type UserAnswer = UserAnswerFor<QuestionKind>;
