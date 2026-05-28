import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext } from '../topics';
import { randInts, randInt } from '../util';
import { BASIC_ARITHMETIC } from './BasicArithmetic';

export class EqualTo_True extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const a = randInt(1n, 10n);
    return createQuestion(`${a} == ${a}`, [true, false, a], {}, ctx);
  }
}

export class EqualTo_False extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [a, b] = randInts(1n, 10n, 2);
    return createQuestion(`${a} == ${b}`, [true, false, a, b], {}, ctx);
  }
}
  
export class NotEqualTo_True extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [a, b] = randInts(1n, 10n, 2);
    return createQuestion(`${a} != ${b}`, [true, false, a, b], {}, ctx);
  }
}

export class NotEqualTo_False extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const a = randInt(1n, 10n);
    return createQuestion(`${a} != ${a}`, [true, false, a], {}, ctx);
  }
}

export class LessThan_True extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    let [a, b] = randInts(1n, 10n, 2);
    if (a > b) [a, b] = [b, a];
    return createQuestion(`${a} < ${b}`, [true, false, a, b], {}, ctx);
  }
}

export class LessThan_False extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    let [a, b] = randInts(1n, 10n, 2);
    if (a < b) [a, b] = [b, a];
    return createQuestion(`${a} < ${b}`, [true, false, a, b], {}, ctx);
  }
}

export class GreaterThan_True extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    let [a, b] = randInts(1n, 10n, 2);
    if (a < b) [a, b] = [b, a];
    return createQuestion(`${a} > ${b}`, [true, false, a, b], {}, ctx);
  }
}

export class GreaterThan_False extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    let [a, b] = randInts(1n, 10n, 2);
    if (a > b) [a, b] = [b, a];
    return createQuestion(`${a} > ${b}`, [true, false, a, b], {}, ctx);
  }
}

export class LessThanOrEqualTo_True extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    let [a, b] = randInts(1n, 10n, 2, false);
    if (a > b) [a, b] = [b, a];
    return createQuestion(`${a} <= ${b}`, [true, false, a, b], {}, ctx);
  }
}

export class LessThanOrEqualTo_False extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    let [a, b] = randInts(1n, 10n, 2, false);
    if (a <= b) [a, b] = [b, a];
    return createQuestion(`${a} <= ${b}`, [true, false, a, b], {}, ctx);
  }
}

export class GreaterThanOrEqualTo_True extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    let [a, b] = randInts(1n, 10n, 2, false);
    if (a < b) [a, b] = [b, a];
    return createQuestion(`${a} >= ${b}`, [true, false, a, b], {}, ctx);
  }
}

export class GreaterThanOrEqualTo_False extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    let [a, b] = randInts(1n, 10n, 2, false);
    if (a >= b) [a, b] = [b, a];
    return createQuestion(`${a} >= ${b}`, [true, false, a, b], {}, ctx);
  }
}


export const BASIC_RELATIONAL_OPERATORS = new Topic('basic-relational-operators', 'Basic Relational Operators', [
  new EqualTo_True(),
  new EqualTo_False(),
  new NotEqualTo_True(),
  new NotEqualTo_False(),
  new LessThan_True(),
  new LessThan_False(),
  new GreaterThan_True(),
  new GreaterThan_False(),
  new LessThanOrEqualTo_True(),
  new LessThanOrEqualTo_False(),
  new GreaterThanOrEqualTo_True(),
  new GreaterThanOrEqualTo_False(),
], [BASIC_ARITHMETIC], {order: 'random'});