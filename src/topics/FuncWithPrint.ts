import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext, CodeOutputSubtopic } from '../topics';
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
    generateQuestion(ctx: GenerateContext) {
        const x = randVariable();
        const a = randChoice(STRINGS);
        const func = randFunc();
        return createQuestion(`
          def ${func}(${x}):
              print("Hello", ${x})
          ${func}('${a}')`, [a, `${func}('${a}')`, `Hello ${a}`, `Hello ${x}`, `Hello ${func}`, `Hello `, 'None'], {usesOutput: true}, ctx);
    }
}

class FuncWithPrintReturn extends CodeOutputSubtopic {
    readonly help = [
        {
            afterFailedAttempts: 2,
            message: 'Remember that a function that does not have an explicit return statement returns the special value `None`.',
        },
    ];
    generateQuestion(ctx: GenerateContext) {
        const x = randVariable();
        const a = randChoice(STRINGS);
        const func = randFunc();
        return createQuestion(`
            def ${func}(${x}):
                print("Hello", ${x})
            print(${func}('${a}'))`, [`Hello ${a}`, `${func}('${a}')\nHello ${a}`, `${func}('${a}')\nHello ${x}`, `${func}('${a}')\nHello ${func}`, `Hello ${a}\n${func}('${a}')`, `Hello ${x}\n${func}('${a}')`, `Hello ${func}\n${func}('${a}')`], {usesOutput: true}, ctx);
    }
}

class FuncWithPrintAround extends CodeOutputSubtopic {
    readonly help = [
        {
            afterFailedAttempts: 2,
            message: 'Make sure to evaluate the function only when it is called, not when it is defined.',
        },
    ];
    generateQuestion(ctx: GenerateContext) {
        const x = randVariable();
        const a = randChoice(STRINGS);
        const func = randFunc();
        return createQuestion(`
            def ${func}(${x}):
                print("Hello", ${x})
            print("Hi")
            ${func}('${a}')
            print("Bye")`, [`Hello ${a}`, `Hi\nBye\nHello ${a}`, `Hi\nBye\nHello ${x}`, `Hi\n${func}('${a}')\nBye`], {usesOutput: true}, ctx);
    }
}

class FuncWithPrintLastLine extends EvalLastLineSubtopic {
    readonly help = [
        {
            afterFailedAttempts: 2,
            message: 'Remember that a function that does not have an explicit return statement returns the special value `None`.',
        },
    ];
    generateQuestion(ctx: GenerateContext) {
        const [x, y] = randVars(2);
        const a = randChoice(STRINGS);
        const func = randFunc();
        return createQuestion(`
            def ${func}(${x}):
                print("Hello", ${x})
            ${y} = ${func}('${a}')
            ${y}`, [`Hello ${a}`, Symbol(y), Symbol(x), Symbol(func), a, `${func}('${a}')`], {usesOutput: false}, ctx);
    }
}

export const FUNC_WITH_PRINT: Topic = new Topic('func-with-print', 'Functions with Print', [
  new FuncWithPrint(),
  new FuncWithPrintReturn(),
  new FuncWithPrintAround(),
  new FuncWithPrintLastLine(),
], [FUNC_WITH_MULTIPLE_ARGS, BASIC_PRINTS]);
