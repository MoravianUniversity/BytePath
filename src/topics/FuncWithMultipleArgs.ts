import { Topic, EvalLastLineSubtopic, EvalLastLineQuestionGen } from '../topics';
import { randInts, randFunc, randVars, range } from '../util';
import { BASIC_FUNCTIONS } from './BasicFunctions';
import { randOperation } from './BasicVariables';
import { WriteCallLine, WriteDefLine } from './FunctionWriteExercises';


export class Func2ArgsAdd extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'When a function is called with multiple arguments, the arguments are substituted for the parameters in the function body in the order they are given.',
    },
  ];
  gen(): EvalLastLineQuestionGen {
    const [x, y] = randVars(2);
    const [a, b] = randInts(1n, 5n, 2, false);
    const func = randFunc();
    return { code: `
      def ${func}(${x}, ${y}):
          return ${x} + ${y}
      ${func}(${a}, ${b})`,
      options: range(0n, 10n),
    };
  }
}

export class Func2ArgsSub extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'When a function is called with multiple arguments, the arguments are substituted for the parameters in the function body in the order they are given.',
    },
  ];
  gen(): EvalLastLineQuestionGen {
    const [x, y] = randVars(2);
    const [a, b] = randInts(1n, 5n, 2);
    const func = randFunc();
    return { code: `
      def ${func}(${x}, ${y}):
          return ${x} - ${y}
      ${func}(${a}, ${b})`,
      options: range(0n, 10n),
    };
  }
}

export class Func2ArgsSubBackwards extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'Make sure to read the variables and operation in the correct order.',
    },
  ];
  gen(): EvalLastLineQuestionGen {
    const [x, y] = randVars(2);
    const [a, b] = randInts(1n, 5n, 2);
    const func = randFunc();
    return { code: `
      def ${func}(${x}, ${y}):
          return ${y} - ${x}
      ${func}(${a}, ${b})`,
      options: range(0n, 10n),
    };
  }
}

export class Func2ArgsMult extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'When a function is called with multiple arguments, the arguments are substituted for the parameters in the function body in the order they are given.',
    },
  ];
  gen(): EvalLastLineQuestionGen {
    const [x, y] = randVars(2);
    const [a, b] = randInts(1n, 4n, 2);
    const func = randFunc();
    return { code: `
      def ${func}(${x}, ${y}):
          return ${x} * ${y}
      ${func}(${a}, ${b})`,
      options: range(0n, 16n),
    };
  }
}

export class Func2ArgsVar extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const [a, b, c] = randInts(1n, 5n, 3);
    const func = randFunc();
    const op1 = randOperation();
    const op2 = randOperation();
    const [var1, var2, var3] = randVars(3);
    return { code: `
      def ${func}(${var1}, ${var2}):
          ${var3} = ${var1} ${op1} ${c}
          return ${var3} ${op2} ${var2}
      ${func}(${a}, ${b})`,
      options: range(-15n, 15n),
    };
  }
}

export class Func2ArgsReassign extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 1,
      message: 'Parameters are like variables that can be reassigned within the function body.',
    },
  ];
  gen(): EvalLastLineQuestionGen {
    const [a, b, c] = randInts(1n, 5n, 3);
    const func = randFunc();
    const op1 = randOperation();
    const op2 = randOperation();
    const [var1, var2] = randVars(2);
    return { code: `
      def ${func}(${var1}, ${var2}):
          ${var2} = ${var1} ${op1} ${c}
          return ${var2} ${op2} ${var1}
      ${func}(${a}, ${b})`,
      options: range(-15n, 15n),
    };
  }
}

export const FUNC_WITH_MULTIPLE_ARGS: Topic = new Topic('func-with-multiple-args', 'Functions with Multiple Arguments', [
    new Func2ArgsAdd(),
    new Func2ArgsSub(),
    new Func2ArgsSubBackwards(),
    new Func2ArgsMult(),
    new Func2ArgsVar(),
    new Func2ArgsVar(),  // practice
    new Func2ArgsReassign(),
    new WriteCallLine(),
    new WriteDefLine(),
], [BASIC_FUNCTIONS]);
