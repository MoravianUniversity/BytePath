/**
 * Division operations: division, modulo, and floating point division.
 */
import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext } from '../topics';
import { randInt, randChoice, range, rangeNum } from '../util';
import { BASIC_ARITHMETIC } from './BasicArithmetic';

abstract class DivisionArithmetic extends EvalLastLineSubtopic {
  operator: string;
  constructor(operator: string) { super(); this.operator = operator; }
  genQuestion(a: bigint, b: bigint, ctx: GenerateContext, step: number|null = null, hint: string|null = null) {
    const correct = this.operator === '//' ? a / b : this.operator === '/' ? Number(a) / Number(b) : a % b;
    step = step === null ? b === 2n ? 0.5 : b === 4n ? 0.25 : b === 5n ? 0.2 : 0.1 : step;
    return createQuestion(
      `${a} ${this.operator} ${b}${hint ? `  # hint: ${hint}` : ''}`,
      [
        Number(correct), BigInt(Math.round(Number(correct))),
        a / b, Number(a) / Number(b), a % b, ...rangeNum(0.0, 5.0, step), ...range(0n, 5n)
      ],
      {correct}, ctx);
  }
}
export class FloatDivisionWithFraction extends DivisionArithmetic {
    constructor() { super('/'); }
    generateQuestion(ctx: GenerateContext) { return this.genQuestion(randChoice([1n, 3n, 7n, 9n]), randChoice([2n, 4n, 5n]), ctx); }
}
export class PerfectFloatDivision2 extends DivisionArithmetic {
    constructor() { super('/'); }
    generateQuestion(ctx: GenerateContext) { return this.genQuestion(randInt(1n, 5n)*2n, 2n, ctx, 1); }
}
export class PerfectFloatDivision3 extends DivisionArithmetic {
    constructor() { super('/'); }
    generateQuestion(ctx: GenerateContext) { return this.genQuestion(randInt(1n, 4n)*3n, 3n, ctx, 1); }
}
export class PerfectIntDivision2WithHint extends DivisionArithmetic {
    constructor() { super('//'); }
    generateQuestion(ctx: GenerateContext) { return this.genQuestion(randInt(2n, 5n)*2n, 2n, ctx, 1, '// is "integer division"'); }
}
export class PerfectIntDivision2 extends DivisionArithmetic {
    constructor() { super('//'); }
    generateQuestion(ctx: GenerateContext) { return this.genQuestion(randInt(2n, 5n)*2n, 2n, ctx, 1); }
}
export class PerfectIntDivision3 extends DivisionArithmetic {
    constructor() { super('//'); }
    generateQuestion(ctx: GenerateContext) { return this.genQuestion(randInt(1n, 4n)*3n, 3n, ctx, 1); }
}
export class IntDivision extends DivisionArithmetic {
    constructor() { super('//'); }
    generateQuestion(ctx: GenerateContext) { return this.genQuestion(randChoice([3n, 7n, 9n, 11n]), randChoice([2n, 4n, 5n]), ctx); }
}
export class ModuloWithHint extends DivisionArithmetic {
    constructor() { super('%'); }
    generateQuestion(ctx: GenerateContext) { return this.genQuestion(randChoice([3n, 7n, 9n, 11n]), 2n, ctx, 1, '% is "remainder"'); }
}
export class Modulo extends DivisionArithmetic {
    constructor() { super('%'); }
    generateQuestion(ctx: GenerateContext) { return this.genQuestion(randChoice([3n, 7n, 9n, 11n]), 2n, ctx, 1); }
}
export class ModuloToZero extends DivisionArithmetic {
    constructor() { super('%'); }
    generateQuestion(ctx: GenerateContext) { return this.genQuestion(randChoice([2n, 5n])*2n, 2n, ctx, 1); }
}

export const DIVISION: Topic = new Topic('division', 'Division', [
    new FloatDivisionWithFraction(),
    new FloatDivisionWithFraction(), // make sure they really get it
    new PerfectFloatDivision2(),
    new PerfectFloatDivision3(),
    new PerfectIntDivision2WithHint(),
    new PerfectIntDivision3(),
    new IntDivision(),
    new IntDivision(), // make sure they really get it
    new ModuloWithHint(),
    new Modulo(),
    new ModuloToZero(),
], [BASIC_ARITHMETIC], {order: 'sequential'});
