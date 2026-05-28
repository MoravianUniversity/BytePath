import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext } from '../topics';
import { randBool, randBools } from '../util';
import { toPyBool } from '../python';
import { BASIC_ARITHMETIC } from './BasicArithmetic';

export class BooleanOperator extends EvalLastLineSubtopic {
  op: string;
  constructor(op: string) { super(); this.op = op; }
  generateQuestion(ctx: GenerateContext) {
    const [a, b] = randBools(2);
    return createQuestion(`
      ${toPyBool(a)} ${this.op} ${toPyBool(b)}`, [true, false], {}, ctx);
  }
}

export class AndOperator_True_True extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const a = true;
    const b = true;
    return createQuestion(`
      ${toPyBool(a)} and ${toPyBool(b)}`, [true, false], {}, ctx);
  }
}

export class AndOperator_True_False extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const a = true;
    const b = false;
    return createQuestion(`
      ${toPyBool(a)} and ${toPyBool(b)}`, [true, false], {}, ctx);
  }
}

export class AndOperator_False_True extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const a = false;
    const b = true;
    return createQuestion(`
      ${toPyBool(a)} and ${toPyBool(b)}`, [true, false], {}, ctx);
  }
}

export class AndOperator_False_False extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const a = false;
    const b = false;
    return createQuestion(`
      ${toPyBool(a)} and ${toPyBool(b)}`, [true, false], {}, ctx);
  }
}

export class OrOperator_True_True extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const a = true;
    const b = true;
    return createQuestion(`
      ${toPyBool(a)} or ${toPyBool(b)}`, [true, false], {}, ctx);
  }
}

export class OrOperator_True_False extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const a = true;
    const b = false;
    return createQuestion(`
      ${toPyBool(a)} or ${toPyBool(b)}`, [true, false], {}, ctx);
  }
}

export class OrOperator_False_True extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const a = false;
    const b = true;
    return createQuestion(`
      ${toPyBool(a)} or ${toPyBool(b)}`, [true, false], {}, ctx);
  }
}

export class OrOperator_False_False extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const a = false;
    const b = false;
    return createQuestion(`
      ${toPyBool(a)} or ${toPyBool(b)}`, [true, false], {}, ctx);
  }
}

export class NotOperator extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const a = randBool();
    return createQuestion(`not ${toPyBool(a)}`, [true, false], {}, ctx);
  }
}

export class NotOperator_True extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const a = true;
    return createQuestion(`not ${toPyBool(a)}`, [true, false], {}, ctx);
  }
}

export class NotOperator_False extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const a = false;
    return createQuestion(`not ${toPyBool(a)}`, [true, false], {}, ctx);
  }
}

export const BASIC_BOOLEAN_OPERATORS = new Topic('basic-boolean-operators', 'Basic Boolean Operators', [
    new BooleanOperator('and'),
    new AndOperator_True_True(),
    new AndOperator_True_False(),
    new AndOperator_False_True(),
    new AndOperator_False_False(),
    new OrOperator_True_True(),
    new OrOperator_True_True(), // twice for practice
    new OrOperator_True_False(),
    new OrOperator_False_True(),
    new OrOperator_False_False(),
    new NotOperator(),
    new NotOperator_True(),
    new NotOperator_False(),
], [BASIC_ARITHMETIC], {order: 'random'});
