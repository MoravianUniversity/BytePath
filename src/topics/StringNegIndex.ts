import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext } from '../topics';
import { randVariable, randIntNum, randChoice } from "../util";
import { toPyStr } from "../python";
import { STRING_LENGTH } from "./StringLength";
import { STRING_INDEX } from "./StringIndexing";
import { STRING_SLICING, StringSlicingBase, StringIndexLenMinus1, StringIndexLenMinus2, DEFAULT_START } from "./StringSlicing";

const STRINGS = [
    "Hello World", "Don't Panic", "Baby Steps", "Think Twice", "Keep Calm", "For Real",
    "Hocus Pocus", "About Face", "Ahoy Matey!", "Foul Ball", "Fizzle Out", "Gee Whiz",
    "Time Flies", "Why Me?", "Think Big", "Live Long", "Just Do It", "Good Grief",
];

function makeComment(s: string): string {
  return '#    01234567890123456789'.slice(0, s.length+5);
}

export class StringIndexNeg1 extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = randChoice(STRINGS);
    return createQuestion(`
      ${makeComment(a)}
      ${x} = ${toPyStr(a)}
      ${x}[-1]
    `, [a[0], a[1], a[a.length-1], a[a.length-2]], {}, ctx);
  }
}

export class StringIndexNeg2 extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = randChoice(STRINGS);
    return createQuestion(`
      ${makeComment(a)}
      ${x} = ${toPyStr(a)}
      ${x}[-2]
    `, [a[0], a[1], a[a.length-1], a[a.length-2], a[a.length-3]], {}, ctx);
  }
}

export class StringSlicingToNeg1 extends StringSlicingBase {
  generateQuestion(ctx: GenerateContext) {
    return this.genQuestion(ctx, DEFAULT_START, (s) => [`-1`, s.length - 1]);
  }
}

export class StringSlicingFromNegToNeg extends StringSlicingBase {
  generateQuestion(ctx: GenerateContext) {
    return this.genQuestion(
      ctx,
      (s) => {
        const n = randIntNum(3, Math.min(6, s.length - 1));
        return [`-${n}`, s.length - n];
      },
      (s) => [`-1`, s.length - 1]
    );
  }
}

export class StringSlicingFromNoneToNeg1 extends StringSlicingBase {
  generateQuestion(ctx: GenerateContext) {
    return this.genQuestion(ctx, () => ['', 0], (s) => ['-1', s.length - 1]);
  }
}

export class StringSlicingFromNegToNone extends StringSlicingBase {
  generateQuestion(ctx: GenerateContext) {
    return this.genQuestion(ctx, (s) => {
      const n = randIntNum(3, Math.min(5, s.length - 2));
      return [`-${n}`, s.length - n];
    }, (s) => ['', s.length]);
  }
}

export class StringSlicingFromPosToNeg extends StringSlicingBase {
  generateQuestion(ctx: GenerateContext) {
    return this.genQuestion(ctx, DEFAULT_START, (s, start) => {
      const n = s.length - randIntNum(start + 1, s.length - 1);
      return [`-${n}`, s.length - n];
    });
  }
}

export class StringSlicingFromNegToPos extends StringSlicingBase {
  generateQuestion(ctx: GenerateContext) {
    return this.genQuestion(
      ctx,
      (s) => {
        const n = randIntNum(3, Math.min(5, s.length - 2));
        return [`-${n}`, s.length - n];
      }
    );
  }
}

export const STRING_NEG_INDEX = new Topic('string-neg-index', 'String Negative Indexing', [
  new StringIndexLenMinus1(),
  new StringIndexNeg1(),
  new StringIndexLenMinus2(),
  new StringIndexNeg2(),
  new StringSlicingToNeg1(),
  new StringSlicingFromNoneToNeg1(),
  new StringSlicingFromNegToNone(),
  new StringSlicingFromPosToNeg(),
  //new StringSlicingFromNegToNeg(),
  //new StringSlicingFromNegToPos(),
], [STRING_LENGTH, STRING_INDEX, STRING_SLICING], {order: 'sequential'});
