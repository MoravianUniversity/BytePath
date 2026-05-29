import { Topic, EvalLastLineSubtopic, EvalLastLineQuestionGen } from '../topics';
import { randBool, randBools } from '../util';
import { toPyBool } from '../python';
import { BASIC_ARITHMETIC } from './BasicArithmetic';

export class BooleanOperator extends EvalLastLineSubtopic {
  op: string;
  constructor(op: string) { super(); this.op = op; }
  gen(): EvalLastLineQuestionGen {
    const [a, b] = randBools(2);
    return {
      code: `${toPyBool(a)} ${this.op} ${toPyBool(b)}`,
      options: [true, false],
    };
  }
}

export class BooleanOperatorFixed extends EvalLastLineSubtopic {
  op: string;
  a: boolean;
  b: boolean;
  constructor(op: string, a: boolean, b: boolean) { super(); this.op = op; this.a = a; this.b = b; }
  gen(): EvalLastLineQuestionGen {
    return {
      code: `${toPyBool(this.a)} ${this.op} ${toPyBool(this.b)}`,
      options: [true, false],
    };
  }
}

export class AndOperator_True_True extends BooleanOperatorFixed {
  constructor() { super('and', true, true); }
}

export class AndOperator_True_False extends BooleanOperatorFixed {
  constructor() { super('and', true, false); }
}

export class AndOperator_False_True extends BooleanOperatorFixed {
  constructor() { super('and', false, true); }
}

export class AndOperator_False_False extends BooleanOperatorFixed {
  constructor() { super('and', false, false); }
}

export class OrOperator_True_True extends BooleanOperatorFixed {
  constructor() { super('or', true, true); }
}

export class OrOperator_True_False extends BooleanOperatorFixed {
  constructor() { super('or', true, false); }
}

export class OrOperator_False_True extends BooleanOperatorFixed {
  constructor() { super('or', false, true); }
}

export class OrOperator_False_False extends BooleanOperatorFixed {
  constructor() { super('or', false, false); }
}

export class NotOperator extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const a = randBool();
    return {
      code: `not ${toPyBool(a)}`,
      options: [true, false],
    };
  }
}

export class NotOperator_True extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const a = true;
    return {
      code: `not ${toPyBool(a)}`,
      options: [true, false],
    };
  }
}

export class NotOperator_False extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const a = false;
    return {
      code: `not ${toPyBool(a)}`,
      options: [true, false],
    };
  }
}

export const BASIC_BOOLEAN_OPERATORS = new Topic('basic-boolean-operators', 'Basic Boolean Operators', [
    new BooleanOperator('and'),
    new AndOperator_True_True(),
    new AndOperator_True_False(),
    new AndOperator_False_True(),
    new AndOperator_False_False(),
    new BooleanOperator('or'),
    new OrOperator_True_True(),
    new OrOperator_True_True(), // twice for practice
    new OrOperator_True_False(),
    new OrOperator_False_True(),
    new OrOperator_False_False(),
    new NotOperator(),
    new NotOperator_True(),
    new NotOperator_False(),
], [BASIC_ARITHMETIC], {order: 'random'});
