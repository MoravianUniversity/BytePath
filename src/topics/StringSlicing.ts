import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext } from '../topics';
import { randInt, randVariable, randVars, randIntNum, randChoice } from "../util";
import { toPyStr } from "../python";
import { STRING_LENGTH } from "./StringLength";
import { STRING_INDEX } from "./StringIndexing";

const STRINGS = [
    "Hello World", "Don't Panic", "Baby Steps", "Think Twice", "Keep Calm", "For Real",
    "Hocus Pocus", "About Face", "Ahoy Matey!", "Foul Ball", "Fizzle Out", "Gee Whiz",
    "Time Flies", "Why Me?", "Think Big", "Live Long", "Just Do It", "Good Grief",
];

export function toTuple(a: bigint | number): [string, number] { return [String(a), Number(a)]; }
export const DEFAULT_START = (s: string) => toTuple(randInt(2n, BigInt(s.indexOf(' ') - 1)));
export const DEFAULT_END = (s: string, start: number) => toTuple(randInt(BigInt(Math.max(start + 2, s.indexOf(' ') + 1)), BigInt(s.length - 2)));

export function makeComment(s: string): string {
  return '#    01234567890123456789'.slice(0, s.length+5);
}

export class StringIndex1 extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = randChoice(STRINGS);
    return createQuestion(`
      ${makeComment(a)}
      ${x} = ${toPyStr(a)}
      ${x}[1]
    `, [a[0], a[1], a[a.length-1], a[a.length-2]], {}, ctx);
  }
}

export abstract class StringSlicingBase extends EvalLastLineSubtopic {
  genQuestion(
    ctx: GenerateContext,
    start: (s: string) => [string, number] = DEFAULT_START,
    end: (s: string, start: number, x: string) => [string, number] = DEFAULT_END
  ) {
    const x = randVariable();
    const s = randChoice(STRINGS);
    const [a, a_] = start(s);
    const [b, b_] = end(s, a_, x);
    return createQuestion(`
      ${makeComment(s)}
      ${x} = ${toPyStr(s)}
      ${x}[${a}:${b}]`, [
        s, x,
        s[a_], s[a_-1], s[a_+1], s[b_-1], s[b_], s[b_+1],
        s.slice(a_, b_), s.slice(a_, b_+1), s.slice(a_+1, b_), s.slice(a_+1, b_+1),
      ], {}, ctx);
  }
}

export class StringSlicing extends StringSlicingBase {
  generateQuestion(ctx: GenerateContext) { return this.genQuestion(ctx); }
}

export class StringSlicingMake1Char extends StringSlicingBase {
  generateQuestion(ctx: GenerateContext) { return this.genQuestion(ctx, (s) => toTuple(randIntNum(1, s.length-2)), (_, start) => toTuple(start+1)); }
}

export class StringSlicingMakeEmpty extends StringSlicingBase {
  generateQuestion(ctx: GenerateContext) { return this.genQuestion(ctx, (s) => toTuple(randIntNum(1, s.length-2)), (_, start) => toTuple(start)); }
}

export class StringSlicingFrom0 extends StringSlicingBase {
  generateQuestion(ctx: GenerateContext) { return this.genQuestion(ctx, () => ['0', 0]); }
}

export class StringSlicingToLen extends StringSlicingBase {
  generateQuestion(ctx: GenerateContext) {
    return this.genQuestion(ctx, DEFAULT_START, (s, _, x) => [`len(${x})`, s.length]);
  }
}

export class StringSlicingChained extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    let s = randChoice(STRINGS);
    let [a, a_] = DEFAULT_START(s);
    let [b, b_] = DEFAULT_END(s, a_);
    let sub = s.slice(a_, b_);
    while (sub.length <= 5) {
      s = randChoice(STRINGS);
      [a, a_] = DEFAULT_START(s);
      [b, b_] = DEFAULT_END(s, a_);
      sub = s.slice(a_, b_);
    }
    let [c, c_] = toTuple(randIntNum(1, sub.length-3));
    let [d, d_] = toTuple(randIntNum(c_+2, sub.length-1));
    return createQuestion(`
      ${makeComment(s)}
      ${x} = ${toPyStr(s)}
      ${y} = ${x}[${a}:${b}]
      ${y}[${c}:${d}]
      `, [
        s, sub,
        sub.slice(c_, d_), sub.slice(c_, d_-1), sub.slice(c_, d_+1),
        sub.slice(c_+1, d_), sub.slice(c_+1, d_-1), sub.slice(c_+1, d_+1),
        sub.slice(c_-1, d_), sub.slice(c_-1, d_-1), sub.slice(c_-1, d_+1),
      ], {}, ctx);
  }
}

export class StringIndexLenMinus1 extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = randChoice(STRINGS);
    return createQuestion(`
      ${makeComment(a)}
      ${x} = ${toPyStr(a)}
      ${x}[len(${x})-1]
    `, [a[0], a[1], a[a.length-1], a[a.length-2]], {}, ctx);
  }
}

export class StringIndexLenMinus2 extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = randChoice(STRINGS);
    return createQuestion(`
      ${makeComment(a)}
      ${x} = ${toPyStr(a)}
      ${x}[len(${x})-2]
    `, [a[0], a[1], a[a.length-1], a[a.length-2], a[a.length-3]], {}, ctx);
  }
}

export class StringSlicingToLenMinus1 extends StringSlicingBase {
  generateQuestion(ctx: GenerateContext) {
    return this.genQuestion(ctx, DEFAULT_START, (s, _, x) => [`len(${x})-1`, s.length - 1]);
  }
}

export class StringSlicingToNone extends StringSlicingBase {
  generateQuestion(ctx: GenerateContext) {
    return this.genQuestion(ctx, DEFAULT_START, (s) => ['', s.length]);
  }
}

export class StringSlicingFromNone extends StringSlicingBase {
  generateQuestion(ctx: GenerateContext) {
    return this.genQuestion(ctx, () => ['', 0]);
  }
}

export class StringSlicingFromNoneToNone extends StringSlicingBase {
  generateQuestion(ctx: GenerateContext) {
    return this.genQuestion(ctx, () => ['', 0], (s) => ['', s.length]);
  }
}


export const STRING_SLICING = new Topic('string-slicing', 'String Slicing', [
  new StringIndex1(),
  new StringSlicing(),
  new StringSlicingFrom0(),
  new StringSlicingToLen(),
  new StringSlicingMake1Char(),
  new StringSlicingMakeEmpty(),
  new StringSlicingChained(),
  new StringSlicingToLenMinus1(),
  new StringSlicingToNone(),
  new StringSlicingFromNone(),
  new StringSlicingFromNoneToNone(),
], [STRING_LENGTH, STRING_INDEX], {order: 'sequential'});
