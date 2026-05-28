import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext } from '../topics';
import { randVariable, randVars, randFunc, randChoice, STRINGS } from '../util';
import { FUNC_WITH_MULTIPLE_ARGS } from './FuncWithMultipleArgs';
import { BASIC_PRINTS } from './BasicPrints';

class FuncWithPrint extends EvalLastLineSubtopic {
    generateQuestion(ctx: GenerateContext) {
        const x = randVariable();
        const a = randChoice(STRINGS);
        const func = randFunc();
        return createQuestion(`
          def ${func}(${x}):
              print("Hello", ${x})
          ${func}('${a}')`, [a, `${func}('${a}')`, `Hello ${a}`, `Hello ${x}`, `Hello ${func}`, `Hello `, 'None'], {}, ctx);
    }
}

class FuncWithPrintReturn extends EvalLastLineSubtopic {
    generateQuestion(ctx: GenerateContext) {
        const x = randVariable();
        const a = randChoice(STRINGS);
        const func = randFunc();
        return createQuestion(`
            def ${func}(${x}):
                print("Hello", ${x})
            print(${func}('${a}'))`, [`Hello ${a}`, `${func}('${a}')\nHello ${a}`, `${func}('${a}')\nHello ${x}`, `${func}('${a}')\nHello ${func}`, `Hello ${a}\n${func}('${a}')`, `Hello ${x}\n${func}('${a}')`, `Hello ${func}\n${func}('${a}')`], {}, ctx);
    }
}

class FuncWithPrintAround extends EvalLastLineSubtopic {
    generateQuestion(ctx: GenerateContext) {
        const x = randVariable();
        const a = randChoice(STRINGS);
        const func = randFunc();
        return createQuestion(`
            def ${func}(${x}):
                print("Hello", ${x})
            print("Hi")
            ${func}('${a}')
            print("Bye")`, [`Hello ${a}`, `Hi\nBye\nHello ${a}`, `Hi\nBye\nHello ${x}`, `Hi\n${func}('${a}')\nBye`], {}, ctx);
    }
}

class FuncWithPrintLastLine extends EvalLastLineSubtopic {
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
