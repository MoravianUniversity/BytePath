import dedent from 'dedent-js';
import { setInput, getInput } from '../python';
import type { TopicContext } from './types';
import { shuffle } from '../util';
import { deduplicate } from '../util';

export const MAX_OPTIONS = 10;

export type BuildCodeQuestionOpts<T> = {
  correct?: T;
  input?: string[] | string;
};

export function createCodeQuestionCore<T>(
  code: string,
  opts: BuildCodeQuestionOpts<T>,
  execute: (code: string) => T | undefined,
  isSame: (a: T, b: T) => boolean,
  ctx?: TopicContext | null,
): {
  code: string;
  correct: T;
  input: string[] | string | undefined;
} {
  if (code[0] === '\n' || code[0] === ' ') { code = dedent(code); }
  const { input } = opts;
  if (input !== undefined) { setInput(input); }
  const sharedCode = ctx?.sharedCode;
  const fullCode = sharedCode ? `${sharedCode}\n${code}` : code;
  const actual = execute(fullCode);
  const correct = opts.correct !== undefined ? opts.correct : actual;

  if (actual === undefined) {
    console.error('Syntax error in question');
    console.error(code);
    console.error(actual, correct);
  } else if (correct !== undefined && !isSame(actual, correct)) {
    console.error('Possible bug in question (answer)');
    console.error(code);
    console.error(actual, correct);
  }
  if (input !== undefined) {
    const remainingInput = getInput();
    if (remainingInput !== '') {
      console.error('Possible bug in question (input)');
      console.error(code);
      console.error(remainingInput, input);
    }
  }

  return {
    code,
    correct: correct as T, // if undefined, there is a serious bug in the question
    input,
  };
}

export function prepareOptions<T>(
  correct: T,
  distractors: (T | undefined)[],
  isSame: (a: T, b: T) => boolean = (a, b) => a === b,
): T[] {
  const all = [correct, ...distractors.filter((o): o is T => o !== undefined)];
  const unique = deduplicate(all, isSame);
  let opts = shuffle(unique).slice(0, Math.min(MAX_OPTIONS, unique.length));
  if (!opts.some((o) => isSame(o, correct))) {
    opts = shuffle([...opts.slice(1), correct]);
  }
  return opts;
}
