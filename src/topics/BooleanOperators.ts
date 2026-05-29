import { Topic, EvalLastLineSubtopic, EvalLastLineQuestionGen } from '../topics';
import { randBools, randChoice, randChoices, randInts, randVars, maybeNot } from '../util';
import { toPyBool } from '../python';
import { BASIC_BOOLEAN_OPERATORS } from './BasicBooleanOperators';
import { BASIC_RELATIONAL_OPERATORS } from './BasicRelationalOperators';
import { BASIC_VARIABLES } from './BasicVariables';

const OPS = ['and', 'or'];
const REL_OPS = ['<', '<=', '>', '>='];
function randOp(): string { return randChoice(OPS); }
function randOps(n: number): string[] { return randChoices(OPS, n, false); }
function randRelOps(n: number, unique: boolean = false): string[] { return randChoices(REL_OPS, n, unique); }

export class BooleanOperators3a extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const [a, b, c] = randBools(3);
    const [op1, op2] = randOps(2);
    return {
      code: `${maybeNot()}(${toPyBool(a)} ${op1} ${toPyBool(b)}) ${op2} ${maybeNot()}${toPyBool(c)}`,
      options: [true, false, a, b, c],
    };
  }
}

export class BooleanOperators3b extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const [a, b, c] = randBools(3);
    const [op1, op2] = randOps(3);
    return {
      code: `${maybeNot()}${toPyBool(a)} ${op1} ${maybeNot()}(${toPyBool(b)} ${op2} ${toPyBool(c)})`,
      options: [true, false, a, b, c],
    };
  }
}

export class BooleanOperators4a extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const [a, b, c, d] = randBools(4);
    const [op1, op2, op3] = randOps(3);
    return {
      code: `${maybeNot()}(${toPyBool(a)} ${op1} ${maybeNot()}${toPyBool(b)}) ${op2} ${maybeNot()}(${toPyBool(c)} ${op3} ${toPyBool(d)})`,
      options: [true, false, a, b, c, d],
    };
  }
}

export class BooleanOperators4b extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const [a, b, c, d] = randBools(4);
    const [op1, op2, op3] = randOps(3);
    return {
      code: `${maybeNot()}${toPyBool(a)} ${op1} ${maybeNot()}(${maybeNot()}(${toPyBool(b)} ${op2} ${toPyBool(c)}) ${op3} ${maybeNot()}${toPyBool(d)})`,
      options: [true, false, a, b, c, d],
    };
  }
}

export class BooleanOpsWithRelOps extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const [a, b, c, d] = randInts(1n, 10n, 4);
    const op = randOp();
    const [rel1, rel2] = randRelOps(2);
    return {
      code: `${maybeNot(.1)}(${a} ${rel1} ${b}) ${op} ${maybeNot(.1)}(${c} ${rel2} ${d})`,
      options: [true, false, a, b, c, d],
    };
  }
}

export class BooleanOpsWithRelOpsAndVars extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const [x, y] = randVars(2);
    const [a, b, c, d] = randInts(1n, 10n, 4);
    const op = randOp();
    const [rel1, rel2] = randRelOps(2);
    return { code: `
      ${x} = ${a} ${rel1} ${b}
      ${y} = ${c} ${rel2} ${d}
      ${maybeNot(.1)}${x} ${op} ${maybeNot(.1)}${y}`,
      options: [true, false, x, y, a, b, c, d],
    };
  }
}

export class BooleanOpsWithRelOpsAndVars2 extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const [x, y, z, w] = randVars(4);
    const [a, b, c, d] = randInts(1n, 10n, 4);
    const op = randOp();
    const [rel1, rel2] = randRelOps(2);
    return { code: `
      ${z} = ${a}
      ${w} = ${b}
      ${x} = ${z} ${rel1} ${c}
      ${y} = ${d} ${rel2} ${w}
      ${maybeNot(.1)}${x} ${op} ${maybeNot(.1)}${y}`,
      options: [true, false, x, y, z, w, a, b, c, d],
    };
  }
}

export const BOOLEAN_OPERATORS = new Topic('boolean-operators', 'Boolean Operators', [
  new BooleanOperators3a(),
  new BooleanOperators3b(),
  new BooleanOperators4a(),
  new BooleanOperators4b(),
  new BooleanOpsWithRelOps(),
  new BooleanOpsWithRelOps(),
  new BooleanOpsWithRelOps(),
  new BooleanOpsWithRelOpsAndVars(),
  new BooleanOpsWithRelOpsAndVars(),
  new BooleanOpsWithRelOpsAndVars(),
  new BooleanOpsWithRelOpsAndVars2(),
  new BooleanOpsWithRelOpsAndVars2(),
], [BASIC_BOOLEAN_OPERATORS, BASIC_RELATIONAL_OPERATORS, BASIC_VARIABLES], {order: 'random'});