import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext, CodeOutputSubtopic } from '../topics';
import { randInt, randInts, randVariable, randVars, randIntNum, randChoice, randChoices, STRINGS, range, ASCII_LETTERS } from "../util";
import { toPyAtom, toPyStr } from "../python";
import { LIST_BASICS } from "./ListBasics";
import { STRING_SLICING } from "./StringSlicing";

function makeList(length: number = randIntNum(3, 5)): any[] {
  switch (randIntNum(1, 3)) {
    case 1: return range(1n, BigInt(length));
    case 2: return [...ASCII_LETTERS].slice(0, length);
    default: return randChoices([...randInts(1n, 10n, length), ...STRINGS], length);
  }
}

function toTuple(a: bigint | number): [string, number] { return [String(a), Number(a)]; }
const DEFAULT_START = (list: any[]) => toTuple(randInt(1n, BigInt(list.length - 3)));
const DEFAULT_END = (list: any[], start: number) => toTuple(randInt(BigInt(Math.max(start + 2, list.length - 2)), BigInt(list.length - 2)));

abstract class ListSlicingBase extends EvalLastLineSubtopic {
  genQuestion(
    ctx: GenerateContext,
    start: (list: any[]) => [string, number] = DEFAULT_START,
    end: (list: any[], start: number, x: string) => [string, number] = DEFAULT_END,
    length: number = randIntNum(3, 5),
  ) {
    const x = randVariable();
    const list = makeList(length);
    const [a, a_] = start(list);
    const [b, b_] = end(list, a_, x);
    return createQuestion(`
      ${x} = ${toPyAtom(list)}
      ${x}[${a}:${b}]`, [
        list, x,
        list[a_], list[a_-1], list[a_+1], list[b_-1], list[b_], list[b_+1],
        list.slice(a_, b_), list.slice(a_, b_+1), list.slice(a_+1, b_), list.slice(a_+1, b_+1),
        list.slice(Math.max(0, a_-1), b_), list.slice(Math.max(0, a_-1), b_+1)
      ], {}, ctx);
  }
}

export class ListSlicing extends ListSlicingBase {
  generateQuestion(ctx: GenerateContext) { return this.genQuestion(ctx); }
}

export class ListSlicingToVar extends ListSlicingBase {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const list = makeList();
    const [a, a_] = DEFAULT_START(list);
    const [b, b_] = DEFAULT_END(list, a_);
    return createQuestion(`
      ${x} = ${toPyAtom(list)}
      ${y} = ${b}
      ${x}[${a}:${y}]`, [
        list, x,
        list[a_], list[a_-1], list[a_+1], list[b_-1], list[b_], list[b_+1],
        list.slice(a_, b_), list.slice(a_, b_+1), list.slice(a_+1, b_), list.slice(a_+1, b_+1),
        list.slice(Math.max(0, a_-1), b_), list.slice(Math.max(0, a_-1), b_+1)
      ], {}, ctx);
  }
}

export class ListSlicingMakeEmpty extends ListSlicingBase {
  generateQuestion(ctx: GenerateContext) { return this.genQuestion(ctx,
    (list) => toTuple(randIntNum(1, list.length-2)),
    (_, start) => toTuple(start)
  ); }
}

export class ListSlicingMakeReallyEmpty extends ListSlicingBase {
  generateQuestion(ctx: GenerateContext) { return this.genQuestion(ctx,
    (list) => toTuple(randIntNum(2, list.length-2)),
    (_, start) => toTuple(start-1)
  ); }
}

export class ListSlicingFrom0 extends ListSlicingBase {
  generateQuestion(ctx: GenerateContext) { return this.genQuestion(ctx, () => ['0', 0]); }
}

export class ListSlicingToLen extends ListSlicingBase {
  generateQuestion(ctx: GenerateContext) {
    return this.genQuestion(ctx, DEFAULT_START, (s, _, x) => [`len(${x})`, s.length]);
  }
}

export class ListSlicingLen1 extends ListSlicingBase {
  generateQuestion(ctx: GenerateContext) { return this.genQuestion(ctx,
    (list) => toTuple(randIntNum(1, list.length-2)),
    (_, start) => toTuple(start+1)
  ); }
}

export class ListIndex extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const list = makeList();
    const i = randIntNum(1, list.length-1);
    return createQuestion(`
      ${x} = ${toPyAtom(list)}
      ${x}[${i}]`, [
        list[i], list[i-1], list[i+1],
        list.slice(i, i+1), list.slice(i-1, i),
      ], {}, ctx);
  }
}

export class ListSlicingToLenMinus1 extends ListSlicingBase {
  generateQuestion(ctx: GenerateContext) {
    return this.genQuestion(ctx, DEFAULT_START, (list, _, x) => [`len(${x})-1`, list.length - 1]);
  }
}

export class ListSlicingToNeg1 extends ListSlicingBase {
  generateQuestion(ctx: GenerateContext) {
    return this.genQuestion(ctx, DEFAULT_START, (list) => [`-1`, list.length - 1]);
  }
}

export class ListSlicingToNone extends ListSlicingBase {
  generateQuestion(ctx: GenerateContext) {
    return this.genQuestion(ctx, DEFAULT_START, (list) => ['', list.length]);
  }
}

export class ListSlicingFromNone extends ListSlicingBase {
  generateQuestion(ctx: GenerateContext) {
    return this.genQuestion(ctx, () => ['', 0]);
  }
}

export class ListSlicingFromNoneToNone extends ListSlicingBase {
  generateQuestion(ctx: GenerateContext) {
    return this.genQuestion(ctx, () => ['', 0], (list) => ['', list.length]);
  }
}

export class ListCopyAndModify extends CodeOutputSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const list = makeList(randIntNum(2, 4));
    const i = randIntNum(0, list.length-1);
    let char = randChoice(ASCII_LETTERS);
    while (list.includes(char)) { char = randChoice(ASCII_LETTERS); }
    const result = [...list.slice(0, i), char, ...list.slice(i+1)];
    return createQuestion(`
      ${x} = ${toPyAtom(list)}
      ${y} = ${x}[:]
      ${y}[${i}] = ${toPyStr(char)}
      print(${x}, ${y})
      `, [
        toPyAtom(list) + " " + toPyAtom(list),
        toPyAtom(result) + " " + toPyAtom(result),
      ], {usesOutput: true}, ctx);
  }
}

export class ListAssignAndModify extends CodeOutputSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const list = makeList(randIntNum(2, 4));
    const i = randIntNum(0, list.length-1);
    let char = randChoice(ASCII_LETTERS);
    while (list.includes(char)) { char = randChoice(ASCII_LETTERS); }
    const result = [...list.slice(0, i), char, ...list.slice(i+1)];
    return createQuestion(`
      ${x} = ${toPyAtom(list)}
      ${y} = ${x}
      ${y}[${i}] = ${toPyStr(char)}
      print(${x}, ${y})
      `, [
        toPyAtom(list) + " " + toPyAtom(list),
        toPyAtom(result) + " " + toPyAtom(result),
      ], {usesOutput: true}, ctx);
  }
}


export const LIST_SLICING = new Topic('list-slicing', 'List Slicing', [
  new ListSlicing(),
  new ListSlicingFrom0(),
  new ListSlicingToLen(),
  new ListSlicingMakeEmpty(),
  new ListSlicingMakeReallyEmpty(),
  new ListSlicingLen1(),
  new ListSlicingToVar(),
  new ListIndex(),
  new ListSlicingToLenMinus1(),
  new ListSlicingToNeg1(),
  new ListSlicingToNone(),
  new ListSlicingFromNone(),
  new ListSlicingFromNoneToNone(),
  new ListCopyAndModify(),
], [LIST_BASICS, STRING_SLICING], {order: 'sequential'});
