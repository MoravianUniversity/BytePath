import { Topic, EvalLastLineSubtopic, EvalLastLineQuestionGen } from '../topics';
import { randInts, randVars, randChoice, evalRelOp } from '../util';
import { BASIC_BRANCHING } from './BasicBranching';

const OPS = ['==', '<', '<=', '>', '>='];
export function randOp(): string { return randChoice(OPS); }
export function getTrueOp(a: bigint, b: bigint): string {
  let op = randOp();
  while (!evalRelOp(a, op, b)) { op = randOp(); }
  return op;
}
export function getFalseOp(a: bigint, b: bigint): string {
  let op = randOp();
  while (evalRelOp(a, op, b)) { op = randOp(); }
  return op;
}

export class ChainedFirst extends EvalLastLineSubtopic {
  readonly help = [
    {
        afterFailedAttempts: 2,
        message: 'The if/elif/else block executed is the first condition that is true, or the else block if no condition is true.',
    },
  ];
  gen(): EvalLastLineQuestionGen {
    const [x, y] = randVars(2);
    const [a, b, c, d, e, f, g] = randInts(1n, 15n, 7);
    let op1 = getTrueOp(a, c);
    let op2 = getFalseOp(a, e);
    return { code: `
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
        ${y} = ${d}
      elif ${x} ${op2} ${e}:
        ${y} = ${f}
      else:
        ${y} = ${g}
      ${y}
    `, options: [a, b, c, d, e, f, g] };
  }
}

export class ChainedSecond extends EvalLastLineSubtopic {
  readonly help = [
    {
        afterFailedAttempts: 2,
        message: 'The if/elif/else block executed is the first condition that is true, or the else block if no condition is true.',
    },
  ];
  gen(): EvalLastLineQuestionGen {
    const [x, y] = randVars(2);
    const [a, b, c, d, e, f, g] = randInts(1n, 15n, 7);
    let op1 = getFalseOp(a, c);
    let op2 = getTrueOp(a, e);
    return { code: `
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
        ${y} = ${d}
      elif ${x} ${op2} ${e}:
        ${y} = ${f}
      else:
        ${y} = ${g}
      ${y}
    `,
      options: [a, b, c, d, e, f, g],
    };
  }
}

export class ChainedBoth extends EvalLastLineSubtopic {
  readonly help = [
    {
        afterFailedAttempts: 2,
        message: 'The if/elif/else block executed is the first condition that is true, or the else block if no condition is true.',
    },
  ];
  gen(): EvalLastLineQuestionGen {
    const [x, y] = randVars(2);
    const [a, b, c, d, e, f, g] = randInts(1n, 15n, 7);
    let op1 = getTrueOp(a, c);
    let op2 = getTrueOp(a, e);
    return { code: `
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
        ${y} = ${d}
      elif ${x} ${op2} ${e}:
        ${y} = ${f}
      else:
        ${y} = ${g}
      ${y}
    `,
      options: [a, b, c, d, e, f, g],
    };
  }
}

export class ChainedNeither extends EvalLastLineSubtopic {
  readonly help = [
    {
        afterFailedAttempts: 2,
        message: 'The if/elif/else block executed is the first condition that is true, or the else block if no condition is true.',
    },
  ];
  gen(): EvalLastLineQuestionGen {
    const [x, y] = randVars(2);
    const [a, b, c, d, e, f, g] = randInts(1n, 15n, 7);
    let op1 = getFalseOp(a, c);
    let op2 = getFalseOp(a, e);
    return { code: `
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
        ${y} = ${d}
      elif ${x} ${op2} ${e}:
        ${y} = ${f}
      else:
        ${y} = ${g}
      ${y}
    `,
      options: [a, b, c, d, e, f, g],
    };
  }
}

export class ChainedSecondNoElse extends EvalLastLineSubtopic {
  readonly help = [
    {
        afterFailedAttempts: 2,
        message: 'The if/elif block executed is the first condition that is true, or none if no condition is true and there is no else block.',
    },
  ];
  gen(): EvalLastLineQuestionGen {
    const [x, y] = randVars(2);
    const [a, b, c, d, e, f] = randInts(1n, 15n, 6);
    let op1 = getFalseOp(a, c);
    let op2 = getTrueOp(a, e);
    return { code: `
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
        ${y} = ${d}
      elif ${x} ${op2} ${e}:
        ${y} = ${f}
      ${y}
    `,
      options: [a, b, c, d, e, f],
    };
  }
}

export class ChainedNeitherNoElse extends EvalLastLineSubtopic {
  readonly help = [
    {
        afterFailedAttempts: 2,
        message: 'The if/elif block executed is the first condition that is true, or none if no condition is true and there is no else block.',
    },
  ];
  gen(): EvalLastLineQuestionGen {
    const [x, y] = randVars(2);
    const [a, b, c, d, e, f] = randInts(1n, 15n, 6);
    let op1 = getFalseOp(a, c);
    let op2 = getFalseOp(a, e);
    return { code: `
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
        ${y} = ${d}
      elif ${x} ${op2} ${e}:
        ${y} = ${f}
      ${y}
    `,
      options: [a, b, c, d, e, f],
    };
  }
}

export class ChainedExtraElifEntered extends EvalLastLineSubtopic {
  readonly help = [
    {
        afterFailedAttempts: 2,
        message: 'The if/elif block executed is the first condition that is true, or none if no condition is true and there is no else block.',
    },
  ];
  gen(): EvalLastLineQuestionGen {
    const [x, y] = randVars(2);
    const [a, b, c, d, e, f, g, h] = randInts(1n, 15n, 8);
    let op1 = getFalseOp(a, c);
    let op2 = getFalseOp(a, e);
    let op3 = getTrueOp(a, g);
    return { code: `
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
        ${y} = ${d}
      elif ${x} ${op2} ${e}:
        ${y} = ${f}
      elif ${x} ${op3} ${g}:
        ${y} = ${h}
      ${y}
    `,
      options: [a, b, c, d, e, f, g, h],
    };
  }
}

export class ChainedExtraElifNotEntered extends EvalLastLineSubtopic {
  readonly help = [
    {
        afterFailedAttempts: 2,
        message: 'The if/elif block executed is the first condition that is true, or none if no condition is true and there is no else block.',
    },
  ];
  gen(): EvalLastLineQuestionGen {
    const [x, y] = randVars(2);
    const [a, b, c, d, e, f, g, h] = randInts(1n, 15n, 8);
    let op1 = getFalseOp(a, c);
    let op2 = getFalseOp(a, e);
    let op3 = getFalseOp(a, g);
    return { code: `
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
        ${y} = ${d}
      elif ${x} ${op2} ${e}:
        ${y} = ${f}
      elif ${x} ${op3} ${g}:
        ${y} = ${h}
      ${y}
    `, options: [a, b, c, d, e, f, g, h] };
  }
}

export class ChainedSeparateChainsBoth extends EvalLastLineSubtopic {
  readonly help = [
    {
        afterFailedAttempts: 2,
        message: 'When there are multiple if\'s, each if is evaluated independently.',
    },
  ];
  gen(): EvalLastLineQuestionGen {
    const [x, y] = randVars(2);
    const [a, b, c, d, e, f] = randInts(1n, 15n, 6);
    let op1 = getTrueOp(a, c);
    let op2 = getTrueOp(a, e);
    return { code: `
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
        ${y} = ${d}
      if ${x} ${op2} ${e}:
        ${y} = ${f}
      ${y}
    `,
      options: [a, b, c, d, e, f],
    };
  }
}

export class ChainedSeparateChainsMost extends EvalLastLineSubtopic {
  readonly help = [
    {
        afterFailedAttempts: 2,
        message: 'When there are multiple if\'s, each if is evaluated independently.',
    },
  ];
  gen(): EvalLastLineQuestionGen {
    const [x, y] = randVars(2);
    const [a, b, c, d, e, f, g, h] = randInts(1n, 15n, 8);
    let op1 = getTrueOp(a, c);
    let op2 = getFalseOp(a, e);
    let op3 = getTrueOp(a, g);
    return { code: `
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
        ${y} = ${d}
      if ${x} ${op2} ${e}:
        ${y} = ${f}
      if ${x} ${op3} ${g}:
        ${y} = ${h}
      ${y}
    `,
      options: [a, b, c, d, e, f, g, h],
    };
  }
}

export class ChainedSeparateChainsElse extends EvalLastLineSubtopic {
  readonly help = [
    {
        afterFailedAttempts: 2,
        message: 'When there are multiple if\'s, each if is evaluated independently. The else block is only executed if it\'s corresponding if block is false.',
    },
  ];
  gen(): EvalLastLineQuestionGen {
    const [x, y] = randVars(2);
    const [a, b, c, d, e, f, h] = randInts(1n, 15n, 7);
    let op1 = getTrueOp(a, c);
    let op2 = getFalseOp(a, e);
    return { code: `
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
        ${y} = ${d}
      if ${x} ${op2} ${e}:
        ${y} = ${f}
      else:
        ${y} = ${h}
      ${y}
    `,
      options: [a, b, c, d, e, f, h],
    };
  }
}

export class ChainedSeparateChainsElseB extends EvalLastLineSubtopic {
  readonly help = [
    {
        afterFailedAttempts: 2,
        message: 'When there are multiple if\'s, each if is evaluated independently. The else block is only executed if it\'s corresponding if block is false.',
    },
  ];
  gen(): EvalLastLineQuestionGen {
    const [x, y] = randVars(2);
    const [a, b, c, d, e, f, h] = randInts(1n, 15n, 7);
    let op1 = getTrueOp(a, c);
    let op2 = getTrueOp(a, e);
    return { code: `
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
        ${y} = ${d}
      if ${x} ${op2} ${e}:
        ${y} = ${f}
      else:
        ${y} = ${h}
      ${y}
    `,
      options: [a, b, c, d, e, f, h],
    };
  }
}

export class ChainedChangeBoth extends EvalLastLineSubtopic {
  readonly help = [
    {
        afterFailedAttempts: 2,
        message: 'The if/elif block executed is the first condition that is true, or none if no condition is true and there is no else block.',
    },
  ];
  gen(): EvalLastLineQuestionGen {
    const [x, y] = randVars(2);
    const [a, b, c, d, e, f] = randInts(1n, 15n, 6);
    let op1 = getFalseOp(a, c);
    let op2 = getTrueOp(e, b);
    return { code: `
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
        ${y} = ${d}
      elif ${y} ${op2} ${e}:
        ${x} = ${f}
      ${y}
    `,
      options: [a, b, c, d, e, f],
    };
  }
}


export const CHAINED_BRANCHES = new Topic('chained-branches', 'Chained Branches', [
  new ChainedFirst(),
  new ChainedSecond(),
  new ChainedBoth(),
  new ChainedNeither(),
  new ChainedSecondNoElse(),
  new ChainedNeitherNoElse(),
  new ChainedExtraElifEntered(),
  new ChainedExtraElifNotEntered(),
  new ChainedSeparateChainsBoth(),
  new ChainedSeparateChainsMost(),
  new ChainedSeparateChainsElse(),
  new ChainedSeparateChainsElseB(),
  new ChainedChangeBoth(),
], [BASIC_BRANCHING]);
