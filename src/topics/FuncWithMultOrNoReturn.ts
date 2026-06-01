import { Topic, EvalLastLineSubtopic, EvalLastLineQuestionGen, ConceptualSubtopic, ConceptualQuestionGen } from '../topics';
import { randVariable, randVars, randFunc, range, randInts } from '../util';
import { FUNC_WITH_MULTIPLE_ARGS } from './FuncWithMultipleArgs';


class FuncWithMultReturnFirst extends EvalLastLineSubtopic {
    readonly help = [
        {
            afterFailedAttempts: 2,
            message: 'When a function returns multiple values, the returned values are assigned to the variables in the order they are returned.',
        },
    ];
    gen(): EvalLastLineQuestionGen {
        const x = randVariable();
        const [c, d] = randVars(2);
        const [a, b] = randInts(1n, 5n, 2);
        const func = randFunc();
        return { code: `
          def ${func}(${x}):
              return ${x}, ${x} + ${b}
          ${c}, ${d} = ${func}(${a})
          ${c}`,
          options: [...range(0n, 10n), null, Error()],
        };
    }
}

class FuncWithMultReturnSecond extends EvalLastLineSubtopic {
    readonly help = [
        {
            afterFailedAttempts: 2,
            message: 'When a function returns multiple values, the returned values are assigned to the variables in the order they are returned.',
        },
    ];
    gen(): EvalLastLineQuestionGen {
        const x = randVariable();
        const [c, d] = randVars(2);
        const [a, b] = randInts(1n, 5n, 2);
        const func = randFunc();
        return { code: `
          def ${func}(${x}):
              return ${x}, ${x} + ${b}
          ${c}, ${d} = ${func}(${a})
          ${d}`,
          options: [...range(0n, 10n), null, Error()],
        };
    }
}

class FuncWithMultReturnBoth extends EvalLastLineSubtopic {
    gen(): EvalLastLineQuestionGen {
        const x = randVariable();
        const [c, d] = randVars(2);
        const [a, b] = randInts(1n, 5n, 2);
        const func = randFunc();
        return { code: `
          def ${func}(${x}):
              return ${x}, ${x} - ${b}
          ${c}, ${d} = ${func}(${a})
          ${c} - ${d}`,
          options: [...range(-5n, 5n), null, Error()],
        };
    }
}

class FuncWithNoReturn extends EvalLastLineSubtopic {
    readonly help = [
        {
            afterFailedAttempts: 2,
            message: 'When a function does not have an explicit return statement, it returns the special value `None`.',
        },
    ];
    gen(): EvalLastLineQuestionGen {
        const [x, y, z] = randVars(3);
        const [a, b] = randInts(1n, 5n, 2, false);
        const func = randFunc();
        return { code: `
          def ${func}(${x}, ${y}):
              ${x} + ${y}
          ${z} = ${func}(${a}, ${b})
          ${z}`,
          options: [...range(0n, 10n), null, Error()],
        };
    }
}

class FuncWithNoReturnNamed extends EvalLastLineSubtopic {
    readonly help = [
        {
            afterFailedAttempts: 2,
            message: 'When a function does not have an explicit return statement, it returns the special value `None`.',
        },
    ];
    gen(): EvalLastLineQuestionGen {
        const [x, y, z] = randVars(3);
        const [a, b] = randInts(1n, 5n, 2, false);
        const func = randFunc();
        return { code: `
          def ${func}(${x}, ${y}):
              ${func} = ${x} + ${y}
          ${z} = ${func}(${a}, ${b})
          ${z}`,
          options: [...range(0n, 10n), null, Error()],
        };
    }
}

class FuncWithNoReturnNamedOutside extends EvalLastLineSubtopic {
    readonly help = [
        {
            afterFailedAttempts: 2,
            message: 'When a function does not have an explicit return statement, it returns the special value `None`. The variables used in the function itself are not available outside the function.',
        },
    ];
    gen(): EvalLastLineQuestionGen {
        const [x, y, z] = randVars(3);
        const [a, b] = randInts(1n, 5n, 2, false);
        const func = randFunc();
        return { code: `
          def ${func}(${x}, ${y}):
              ${z} = ${x} + ${y}
          ${z} = ${func}(${a}, ${b})
          ${z}`,
          options: [...range(0n, 10n), null, Error()],
        };
    }
}

class FuncWithNoReturnWhatType extends ConceptualSubtopic {
  gen(): ConceptualQuestionGen {
    return {
      prompt: 'What value does a function that does not have an explicit return statement return?',
      correct: '`None`',
      options: ['`0`', 'Empty string', '`false`', 'Raises an error', '`None`'],
    };
  }
}

export const FUNC_WITH_MULT_OR_NO_RETURN: Topic = new Topic('func-with-mult-or-no-return', 'Functions with Multiple/No Return', [
  new FuncWithMultReturnFirst(),
  new FuncWithMultReturnSecond(),
  new FuncWithMultReturnBoth(),
  new FuncWithNoReturn(),
  new FuncWithNoReturnNamed(),
  new FuncWithNoReturnNamedOutside(),
  new FuncWithNoReturnWhatType(),
], [FUNC_WITH_MULTIPLE_ARGS]);
