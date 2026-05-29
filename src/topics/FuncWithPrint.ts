import { Topic, EvalLastLineSubtopic, CodeOutputSubtopic, EvalLastLineQuestionGen, CodeOutputQuestionGen } from '../topics';
import { randVariable, randVars, randFunc, randChoice, STRINGS } from '../util';
import { FUNC_WITH_MULTIPLE_ARGS } from './FuncWithMultipleArgs';
import { BASIC_PRINTS } from './BasicPrints';

class FuncWithPrint extends CodeOutputSubtopic {
    readonly help = [
        {
            afterFailedAttempts: 2,
            message: 'Content printed in a function is printed to the console, not returned.',
        },
    ];
    gen(): CodeOutputQuestionGen {
        const x = randVariable();
        const a = randChoice(STRINGS);
        const func = randFunc();
        return { code: `
          def ${func}(${x}):
              print("Hello", ${x})
          ${func}('${a}')`,
          options: [a, `${func}('${a}')`, `Hello ${a}`, `Hello ${x}`, `Hello ${func}`, `Hello `, 'None'],
        };
    }
}

class FuncWithPrintReturn extends CodeOutputSubtopic {
    readonly help = [
        {
            afterFailedAttempts: 2,
            message: 'Remember that a function that does not have an explicit return statement returns the special value `None`.',
        },
    ];
    gen(): CodeOutputQuestionGen {
        const x = randVariable();
        const a = randChoice(STRINGS);
        const func = randFunc();
        return { code: `
            def ${func}(${x}):
                print("Hello", ${x})
            print(${func}('${a}'))`,
            options: [`Hello ${a}`, `${func}('${a}')\nHello ${a}`, `${func}('${a}')\nHello ${x}`, `${func}('${a}')\nHello ${func}`, `Hello ${a}\n${func}('${a}')`, `Hello ${x}\n${func}('${a}')`, `Hello ${func}\n${func}('${a}')`],
          };
    }
}

class FuncWithPrintAround extends CodeOutputSubtopic {
    readonly help = [
        {
            afterFailedAttempts: 2,
            message: 'Make sure to evaluate the function only when it is called, not when it is defined.',
        },
    ];
    gen(): CodeOutputQuestionGen {
        const x = randVariable();
        const a = randChoice(STRINGS);
        const func = randFunc();
        return { code: `
            def ${func}(${x}):
                print("Hello", ${x})
            print("Hi")
            ${func}('${a}')
            print("Bye")`,
            options: [`Hello ${a}`, `Hi\nBye\nHello ${a}`, `Hi\nBye\nHello ${x}`, `Hi\n${func}('${a}')\nBye`],
          };
    }
}

class FuncWithPrintLastLine extends EvalLastLineSubtopic {
    readonly help = [
        {
            afterFailedAttempts: 1,
            message: 'Remember that a function that does not have an explicit return statement returns the special value `None`.',
        },
    ];
    gen(): EvalLastLineQuestionGen {
        const [x, y] = randVars(2);
        const a = randChoice(STRINGS);
        const func = randFunc();
        return { code: `
            def ${func}(${x}):
                print("Hello", ${x})
            ${y} = ${func}('${a}')
            ${y}`,
            options: [`Hello ${a}`, Symbol(y), Symbol(x), Symbol(func), a, `${func}('${a}')`],
          };
    }
}

export const FUNC_WITH_PRINT: Topic = new Topic('func-with-print', 'Functions with Print', [
  new FuncWithPrint(),
  new FuncWithPrintReturn(),
  new FuncWithPrintAround(),
  new FuncWithPrintLastLine(),
], [FUNC_WITH_MULTIPLE_ARGS, BASIC_PRINTS]);
