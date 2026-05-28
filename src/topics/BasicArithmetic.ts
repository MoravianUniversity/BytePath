/**
 * Basic arithmetic operations: addition, subtraction, multiplication, exponentiation, and
 * parentheses. Does not include division or modulo operations or floating point numbers,
 * those are in separate topics.
 */
import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext } from '../topics';
import { randInt } from '../util';

abstract class BasicArithmetic extends EvalLastLineSubtopic {
  operator: string;
  constructor(operator: string) { super(); this.operator = operator; }
  genQuestion(a: bigint, b: bigint, ctx: GenerateContext) {
    const correct = this.operator === '+' ? a + b : this.operator === '-' ? a - b : this.operator === '*' ? a * b : a ** b;
    return createQuestion(
      `${a} ${this.operator} ${b}`,
      [
        correct + randInt(1n, 3n),
        correct - randInt(1n, 3n),
        a * b, a + b, a - b, b - a,
      ],
      {correct}, ctx);
  }
}
export class Addition extends BasicArithmetic {
  constructor() { super('+'); }
  generateQuestion(ctx: GenerateContext) { return this.genQuestion(randInt(1n, 10n), randInt(1n, 10n), ctx); }
}
export class Subtraction extends BasicArithmetic {
  constructor() { super('-'); }
  generateQuestion(ctx: GenerateContext) { return this.genQuestion(randInt(1n, 10n), randInt(1n, 10n), ctx); }
}
export class Multiplication extends BasicArithmetic {
  constructor() { super('*'); }
  generateQuestion(ctx: GenerateContext) { return this.genQuestion(randInt(2n, 10n), randInt(2n, 10n), ctx); }
}
export class Exponentiation extends BasicArithmetic {
  constructor() { super('**'); }
  generateQuestion(ctx: GenerateContext) {
    let a = randInt(2n, 4n);
    let b = randInt(2n, 3n);
    while (a == 2n && b == 2n) {
      a = randInt(2n, 4n);
      b = randInt(2n, 3n);
    }
    return this.genQuestion(a, b, ctx);
  }
}
export class AdditionWithNegative extends BasicArithmetic {
  constructor() { super('+'); }
  generateQuestion(ctx: GenerateContext) { return this.genQuestion(randInt(-10n, -1n), randInt(-3n, 7n), ctx); }
}
export class SubtractionWithNegative extends BasicArithmetic {
  constructor() { super('-'); }
  generateQuestion(ctx: GenerateContext) { return this.genQuestion(randInt(-10n, -1n), randInt(-7n, 3n), ctx); }
}
export class MultiplicationWithNegative extends BasicArithmetic {
  constructor() { super('*'); }
  generateQuestion(ctx: GenerateContext) { return this.genQuestion(randInt(-10n, -2n), randInt(-5n, 5n), ctx); }
}
export class Parentheses1 extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 1,
      message: 'Work **inside the parentheses** first, then multiply.',
    },
    {
      afterFailedAttempts: 3,
      message: `Evaluate \`b * c\` first, add \`a\`, then multiply by \`d\`:

\`\`\`python
result = (a + b * c) * d
\`\`\``,
    },
  ];

  generateQuestion(ctx: GenerateContext) {
    const a = randInt(1n, 4n);
    const b = randInt(2n, 4n);
    const c = randInt(2n, 3n);
    const d = randInt(2n, 4n);
    const correct = (a + b*c) * d;
    return createQuestion(
      `(${a} + ${b} * ${c}) * ${d}`,
      [
        correct + randInt(1n, 3n),
        correct - randInt(1n, 3n),
        (a + b) * c * d,
        (a + b) * (c + d),
        (a * b) + (c * d),
        (a * b) * d + c * d,
        a * (b + c) * d,
      ],
      {correct}, ctx);
  }
}
export class Parentheses2 extends EvalLastLineSubtopic {
    generateQuestion(ctx: GenerateContext) {
      const a = randInt(2n, 4n);
      const b = randInt(1n, 4n);
      const c = randInt(1n, 3n);
      const d = randInt(2n, 4n);
      const correct = a * (b + c) * d;
      return createQuestion(
        `${a} * (${b} + ${c}) * ${d}`,
        [
          correct + randInt(1n, 3n),
          correct - randInt(1n, 3n),
          (a + b * c) * d,
          (a + b) * c * d,
          (a + b) * (c + d),
          (a * b) + (c * d),
          (a * b) * d + c * d,
        ],
        {correct}, ctx);
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
