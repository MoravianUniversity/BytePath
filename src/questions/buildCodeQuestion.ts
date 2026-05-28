import dedent from 'dedent-js';
import { runLastLine, runGrabOutput, setInput, getInput } from '../python';
import { shuffle } from '../util';
import {
  type Answer,
  deduplicateAnswers,
  isAnswerSame,
} from '../topics';
import type {
  CodeOutputQuestion,
  EvalLastLineQuestion,
  GenerateContext,
} from './types';

const MAX_OPTIONS = 10;

export type BuildCodeQuestionOpts = {
  correct?: Answer;
  input?: string[] | string;
  forceQuiz?: boolean;
};

function prepareOptions(
  answer: Answer,
  distractors: (Answer | undefined)[],
): Answer[] {
  let opts = deduplicateAnswers([
    answer,
    ...distractors
      .filter((o): o is Answer => o !== undefined)
      .map((o) => (typeof o === 'number' ? +o.toFixed(5) : o)),
  ]);
  opts = shuffle(opts).slice(0, Math.min(MAX_OPTIONS, opts.length));
  if (!opts.some((o) => isAnswerSame(o, answer))) {
    opts.push(answer);
    opts = shuffle(opts);
  }
  return opts;
}

function prepareStringOptions(correct: string, distractors: (string | undefined)[]): string[] {
  const all = [correct, ...distractors.filter((o): o is string => o !== undefined)];
  const unique = all.filter((v, i) => all.findIndex((x) => x === v) === i);
  let opts = shuffle(unique).slice(0, Math.min(MAX_OPTIONS, unique.length));
  if (!opts.includes(correct)) {
    opts.push(correct);
    opts = shuffle(opts);
  }
  return opts;
}

export function buildCodeQuestion(
  mode: 'last-line',
  code: string,
  distractors: (Answer | undefined)[],
  opts: BuildCodeQuestionOpts,
  ctx: GenerateContext,
): EvalLastLineQuestion;
export function buildCodeQuestion(
  mode: 'output',
  code: string,
  distractors: (string | undefined)[],
  opts: BuildCodeQuestionOpts & { correct?: Answer },
  ctx: GenerateContext,
): CodeOutputQuestion;
export function buildCodeQuestion(
  mode: 'last-line' | 'output',
  code: string,
  distractors: (Answer | string | undefined)[],
  opts: BuildCodeQuestionOpts,
  ctx: GenerateContext,
): EvalLastLineQuestion | CodeOutputQuestion {
  if (code[0] === '\n' || code[0] === ' ') {
    code = dedent(code);
  }
  const { input, forceQuiz: forceQuizOpt } = opts;
  if (input !== undefined) {
    setInput(input);
  }
  const sharedCode = ctx.sharedCode;
  const fullCode = sharedCode ? `${sharedCode}\n${code}` : code;
  const usesOutput = mode === 'output';
  const actual = usesOutput ? runGrabOutput(fullCode) : runLastLine(fullCode);
  const answer = opts.correct !== undefined ? opts.correct : actual;

  if (actual === undefined) {
    console.error('Syntax error in question');
    console.error(code);
    console.error(actual, answer);
  } else if (answer !== undefined && !isAnswerSame(actual as Answer, answer as Answer)) {
    console.error('Possible bug in question (answer)');
    console.error(code);
    console.error(actual, answer);
  }
  if (input !== undefined) {
    const remainingInput = getInput();
    if (remainingInput !== '') {
      console.error('Possible bug in question (input)');
      console.error(code);
      console.error(remainingInput, input);
    }
  }

  const forceQuiz = forceQuizOpt ?? false;

  if (mode === 'output') {
    const correctStr = String(answer);
    const options = prepareStringOptions(
      correctStr,
      distractors as (string | undefined)[],
    );
    return {
      kind: 'code-output',
      code,
      correct: correctStr,
      options,
      input,
      forceQuiz: forceQuiz || options.length === 1,
    };
  }

  const options = prepareOptions(answer as Answer, distractors as (Answer | undefined)[]);
  return {
    kind: 'eval-last-line',
    code,
    correct: answer as Answer,
    options,
    input,
    forceQuiz: forceQuiz || options.length === 1,
  };
}

/** Convenience wrappers during migration; prefers explicit buildCodeQuestion for new code. */
// TODO: remove these wrappers after migration

function resolveMode(
  code: string,
  usesOutput?: boolean,
): 'last-line' | 'output' {
  if (usesOutput === false) {
    return 'last-line';
  }
  if (usesOutput === true) {
    return 'output';
  }
  return code.includes('print(') ? 'output' : 'last-line';
}
type CreateQuestionOpts = BuildCodeQuestionOpts & {
  usesOutput?: boolean;
  sharedCode?: string;
};
export function createQuestion(
  code: string,
  options: (Answer | undefined)[],
  opts: CreateQuestionOpts & { usesOutput?: false },
  ctx: GenerateContext,
): EvalLastLineQuestion;
export function createQuestion(
  code: string,
  options: (string | undefined)[],
  opts: CreateQuestionOpts & { usesOutput: true },
  ctx: GenerateContext,
): CodeOutputQuestion;
export function createQuestion(
  code: string,
  options: (Answer | string | undefined)[],
  opts: CreateQuestionOpts,
  ctx: GenerateContext,
): EvalLastLineQuestion | CodeOutputQuestion;
export function createQuestion(
  code: string,
  options: (Answer | string | undefined)[],
  opts: CreateQuestionOpts = {},
  ctx: GenerateContext,
): EvalLastLineQuestion | CodeOutputQuestion {
  const mode = resolveMode(code, opts.usesOutput);
  const mergedCtx: GenerateContext = {
    ...ctx,
    sharedCode: opts.sharedCode ?? ctx.sharedCode,
  };
  const { usesOutput: _u, sharedCode: _s, ...rest } = opts;
  if (mode === 'output') {
    return buildCodeQuestion(
      'output',
      code,
      options as (string | undefined)[],
      rest,
      mergedCtx,
    ) as CodeOutputQuestion;
  }
  return buildCodeQuestion(
    'last-line',
    code,
    options as (Answer | undefined)[],
    rest,
    mergedCtx,
  ) as EvalLastLineQuestion;
}
