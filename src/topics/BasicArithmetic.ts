/**
 * Basic arithmetic operations: addition, subtraction, multiplication, exponentiation, and
 * parentheses. Does not include division or modulo operations or floating point numbers,
 * those are in separate topics.
 */
import { Topic, EvalLastLineSubtopic, EvalLastLineQuestionGen } from '../topics';
import { randInt } from '../util';

abstract class BasicArithmetic extends EvalLastLineSubtopic {
  operator: string;
  constructor(operator: string) { super(); this.operator = operator; }
  genQuestion(a: bigint, b: bigint): EvalLastLineQuestionGen {
    const correct = this.operator === '+' ? a + b : this.operator === '-' ? a - b : this.operator === '*' ? a * b : a ** b;
    return {
      code: `${a} ${this.operator} ${b}`,
      options: [correct + randInt(1n, 3n), correct - randInt(1n, 3n), a * b, a + b, a - b, b - a],
      opts: {correct},
    };
  }
}
export class Addition extends BasicArithmetic {
  constructor() { super('+'); }
  gen(): EvalLastLineQuestionGen { return this.genQuestion(randInt(1n, 10n), randInt(1n, 10n)); }
}
export class Subtraction extends BasicArithmetic {
  constructor() { super('-'); }
  gen(): EvalLastLineQuestionGen { return this.genQuestion(randInt(1n, 10n), randInt(1n, 10n)); }
}
export class Multiplication extends BasicArithmetic {
  constructor() { super('*'); }
  gen(): EvalLastLineQuestionGen { return this.genQuestion(randInt(2n, 10n), randInt(2n, 10n)); }
}
export class Exponentiation extends BasicArithmetic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'The exponent is the power to which the base is raised.',
    },
  ];

  constructor() { super('**'); }
  gen(): EvalLastLineQuestionGen {
    let a = randInt(2n, 4n);
    let b = randInt(2n, 3n);
    while (a == 2n && b == 2n) {
      a = randInt(2n, 4n);
      b = randInt(2n, 3n);
    }
    return this.genQuestion(a, b);
  }
}
export class AdditionWithNegative extends BasicArithmetic {
  constructor() { super('+'); }
  gen(): EvalLastLineQuestionGen { return this.genQuestion(randInt(-10n, -1n), randInt(-3n, 7n)); }
}
export class SubtractionWithNegative extends BasicArithmetic {
  readonly help = [
    {
      afterFailedAttempts: 1,
      message: 'Subtracting a negative number is the same as adding a positive number.',
    },
  ];
  constructor() { super('-'); }
  gen(): EvalLastLineQuestionGen { return this.genQuestion(randInt(-10n, -1n), randInt(-7n, 3n)); }
}
export class MultiplicationWithNegative extends BasicArithmetic {
  constructor() { super('*'); }
  gen(): EvalLastLineQuestionGen { return this.genQuestion(randInt(-10n, -2n), randInt(-5n, 5n)); }
}
export class Parentheses1 extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 1,
      message: 'Work **inside the parentheses** first, then multiply.',
    },
    {
      afterFailedAttempts: 3,
      message: `Evaluate \`b * c\` first, add \`a\`, then multiply by \`d\`.`,
    },
  ];

  gen(): EvalLastLineQuestionGen {
    const a = randInt(1n, 4n);
    const b = randInt(2n, 4n);
    const c = randInt(2n, 3n);
    const d = randInt(2n, 4n);
    const correct = (a + b*c) * d;
    return {
      code: `(${a} + ${b} * ${c}) * ${d}`,
      options: [
        correct + randInt(1n, 3n), correct - randInt(1n, 3n),
        (a + b) * c * d, (a + b) * (c + d), (a * b) + (c * d), (a * b) * d + c * d, a * (b + c) * d
      ],
      opts: {correct},
    };
  }
}
export class Parentheses2 extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const a = randInt(2n, 4n);
    const b = randInt(1n, 4n);
    const c = randInt(1n, 3n);
    const d = randInt(2n, 4n);
    const correct = a * (b + c) * d;
    return {
      code: `${a} * (${b} + ${c}) * ${d}`,
      options: [
        correct + randInt(1n, 3n),
        correct - randInt(1n, 3n),
        (a + b * c) * d,
        (a + b) * c * d,
        (a + b) * (c + d),
        (a * b) + (c * d),
        (a * b) * d + c * d,
        a * (b + c) * d,
      ],
      opts: {correct},
    };
  }
}

export const BASIC_ARITHMETIC: Topic = new Topic('basic-arithmetic', 'Basic Arithmetic', [
  new Addition(),
  new AdditionWithNegative(),
  new Subtraction(),
  new SubtractionWithNegative(),
  new Multiplication(),
  new MultiplicationWithNegative(),
  new Exponentiation(),
  new Parentheses1(),
  new Parentheses2(),
]);
