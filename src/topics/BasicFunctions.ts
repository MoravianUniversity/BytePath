import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext } from '../topics';
import { randInt, randInts, randVariable, randVars, randFunc, math } from '../util';
import { BASIC_ARITHMETIC } from './BasicArithmetic';
import { BASIC_VARIABLES, randOperation } from './BasicVariables';

export class FuncNoArgs extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'When a function is "called" using its name and parentheses, it is executed and the returned value is used in place of the function call.',
    },
  ];
  generateQuestion(ctx: GenerateContext) {
    const a = randInt(1n, 10n);
    const func = randFunc();
    return createQuestion(`
      def ${func}():
          return ${a}
      ${func}()`, [func, Symbol(func), `${func}()`, 0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n], {}, ctx);
  }
}

export class FuncArg extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'When a function is called with an argument, the parameter variable takes the value of the argument within the function body.',
    },
  ];
  generateQuestion(ctx: GenerateContext) {
    const a = randInt(1n, 10n);
    const arg = randVariable();
    const func = randFunc();
    return createQuestion(`
      def ${func}(${arg}):
          return ${arg}
      ${func}(${a})`, [arg, Symbol(arg), `${func}(${a})`, 0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n], {}, ctx);
  }
}

export class FuncArgUnused extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [a, b] = randInts(1n, 10n, 2);
    const arg = randVariable();
    const func = randFunc();
    return createQuestion(`
      def ${func}(${arg}):
          return ${a}
      ${func}(${b})`, [arg, Symbol(arg), `${func}(${b})`, 0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n], {}, ctx);
  }
}

export class FuncArgWithMath extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'When a function is called with an argument, the argument is substituted for the parameter variable in the function body',
    },
  ];
  generateQuestion(ctx: GenerateContext) {
    const [a, b] = randInts(1n, 5n, 2);
    const op = randOperation();
    const arg = randVariable();
    const func = randFunc();
    return createQuestion(`
      def ${func}(${arg}):
          return ${arg} ${op} ${a}
      ${func}(${b})`, [arg, Symbol(arg), `${func}(${b})`, 0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n], {}, ctx);
  }
}

export class FuncArgWithMathRepeated extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const a = randInt(1n, 5n);
    const arg = randVariable();
    const func = randFunc();
    return createQuestion(`
      def ${func}(${arg}):
          return ${arg} + ${arg}
      ${func}(${a})`, [arg, Symbol(arg), `${func}(${a})`, 0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n], {}, ctx);
  }
}

export class FuncWithMathAfter extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'The function is called and the returned value is used in the math expression in place of the function call.',
    },
  ];
  generateQuestion(ctx: GenerateContext) {
    const [a, b] = randInts(1n, 5n, 2);
    const op = randOperation();
    const func = randFunc();
    return createQuestion(`
      def ${func}():
          return ${a}
      ${func}() ${op} ${b}`, [0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n], {}, ctx);
  }
}

export class FuncWithMathBefore extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'The function is called and the returned value is used in the math expression in place of the function call.',
    },
  ];
  generateQuestion(ctx: GenerateContext) {
    const [a, b] = randInts(1n, 5n, 2);
    const op = randOperation();
    const func = randFunc();
    return createQuestion(`
      def ${func}():
          return ${a}
      ${b} ${op} ${func}()`, [0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n], {}, ctx);
  }
}

export class FuncArgWithMathAfter extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [a, b] = randInts(1n, 5n, 2);
    const op = randOperation();
    const arg = randVariable();
    const func = randFunc();
    return createQuestion(`
      def ${func}(${arg}):
          return ${arg}
      ${func}(${a}) ${op} ${b}`, [0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n], {}, ctx);
  }
}

export class FuncArgWithMathInAndOutside extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [a, b, c] = randInts(1n, 5n, 3);
    const op1 = randOperation();
    const op2 = randOperation();
    const arg = randVariable();
    const func = randFunc();
    const correct = math(math(b, op1, a), op2, c);
    return createQuestion(`
      def ${func}(${arg}):
          return ${arg} ${op1} ${a}
      ${func}(${b}) ${op2} ${c}`, [0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n, correct+1n, correct-1n, correct+2n, correct-2n, correct+3n, correct-3n], {correct}, ctx);
  }
}

export class FuncArgAndSaveResult extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const a = randInt(1n, 10n);
    const [arg, x] = randVars(2);
    const func = randFunc();
    return createQuestion(`
      def ${func}(${arg}):
          return ${arg}
      ${x} = ${func}(${a})
      ${x}`, [x, Symbol(x), arg, Symbol(arg), `${func}(${a})`, 0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n], {}, ctx);
  }
}

export class FuncArgAndSaveResultMath extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [a, b] = randInts(1n, 5n, 2);
    const op = randOperation();
    const [arg, x] = randVars(2);
    const func = randFunc();
    const correct = math(a, op, b);
    return createQuestion(`
      def ${func}(${arg}):
          return ${arg}
      ${x} = ${func}(${a})
      ${x} ${op} ${b}`, [0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n, correct+1n, correct-1n, correct+2n, correct-2n, correct+3n, correct-3n], {correct}, ctx);
  }
}

export class FuncArgAndSaveResultMath2 extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [a, b] = randInts(1n, 5n, 2);
    const op = randOperation();
    const [arg, x] = randVars(2);
    const func = randFunc();
    const correct = math(a, op, b);
    return createQuestion(`
      def ${func}(${arg}):
          return ${arg}
      ${x} = ${func}(${a}) ${op} ${b}
      ${x}`, [0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n, correct+1n, correct-1n, correct+2n, correct-2n, correct+3n, correct-3n], {correct}, ctx);
  }
}

export class FuncArgAndSaveResultMath3 extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [a, b, c, d] = randInts(1n, 5n, 4);
    const op1 = randOperation();
    const op2 = randOperation();
    const op3 = randOperation();
    const [arg, x] = randVars(2);
    const func = randFunc();
    const correct = math(math(math(a, op1, b), op2, c), op3, d);
    return createQuestion(`
      def ${func}(${arg}):
          return ${arg} ${op1} ${b}
      ${x} = ${func}(${a}) ${op2} ${c}
      ${x} ${op3} ${d}`, [0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n, correct+1n, correct-1n, correct+2n, correct-2n, correct+3n, correct-3n], {correct}, ctx);
  }
}

export class FuncArgVarInAndOutside extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [a, b] = randInts(1n, 5n, 2);
    const op = randOperation();
    const [arg, x, y] = randVars(3);
    const func = randFunc();
    const correct = math(a, op, b);
    return createQuestion(`
      def ${func}(${arg}):
          ${y} = ${arg} ${op} ${b}
          return ${y}
      ${x} = ${func}(${a})
      ${x}`, [0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n, correct+1n, correct-1n, correct+2n, correct-2n, correct+3n, correct-3n], {correct}, ctx);
  }
}

export const BASIC_FUNCTIONS: Topic = new Topic('basic-functions', 'Basic Functions', [
  new FuncNoArgs(),
  new FuncArg(),
  new FuncArgUnused(),
  new FuncArgWithMath(),
  new FuncArgWithMathRepeated(),
  new FuncWithMathAfter(),
  new FuncWithMathBefore(),
  new FuncArgWithMathAfter(),
  new FuncArgWithMathInAndOutside(),
  new FuncArgAndSaveResult(),
  new FuncArgAndSaveResultMath(),
  new FuncArgAndSaveResultMath2(),
  new FuncArgAndSaveResultMath3(),
  new FuncArgVarInAndOutside(),
], [BASIC_VARIABLES, BASIC_ARITHMETIC]);
