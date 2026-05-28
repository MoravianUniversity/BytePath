import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext } from '../topics';
import { randVariable, randVars, randFunc, range, randInts } from '../util';
import { FUNC_WITH_MULTIPLE_ARGS } from './FuncWithMultipleArgs';


class FuncWithMultReturnFirst extends EvalLastLineSubtopic {
    generateQuestion(ctx: GenerateContext) {
        const x = randVariable();
        const [c, d] = randVars(2);
        const [a, b] = randInts(1n, 5n, 2);
        const func = randFunc();
        return createQuestion(`
          def ${func}(${x}):
              return ${x}, ${x} + ${b}
          ${c}, ${d} = ${func}(${a})
          ${c}`, [...range(0n, 10n), null, Error()], {}, ctx);
    }
}

class FuncWithMultReturnSecond extends EvalLastLineSubtopic {
    generateQuestion(ctx: GenerateContext) {
        const x = randVariable();
        const [c, d] = randVars(2);
        const [a, b] = randInts(1n, 5n, 2);
        const func = randFunc();
        return createQuestion(`
          def ${func}(${x}):
              return ${x}, ${x} + ${b}
          ${c}, ${d} = ${func}(${a})
          ${d}`, [...range(0n, 10n), null, Error()], {}, ctx);
    }
}

class FuncWithMultReturnBoth extends EvalLastLineSubtopic {
    generateQuestion(ctx: GenerateContext) {
        const x = randVariable();
        const [c, d] = randVars(2);
        const [a, b] = randInts(1n, 5n, 2);
        const func = randFunc();
        return createQuestion(`
          def ${func}(${x}):
              return ${x}, ${x} - ${b}
          ${c}, ${d} = ${func}(${a})
          ${c} + ${d}`, [...range(0n, 10n), null, Error()], {}, ctx);
    }
}

class FuncWithNoReturn extends EvalLastLineSubtopic {
    generateQuestion(ctx: GenerateContext) {
        const [x, y, z] = randVars(3);
        const [a, b] = randInts(1n, 5n, 2, false);
        const func = randFunc();
        return createQuestion(`
          def ${func}(${x}, ${y}):
              ${x} + ${y}
          ${z} = ${func}(${a}, ${b})
          ${z}`, [...range(0n, 10n), null, Error()], {}, ctx);
    }
}

class FuncWithNoReturnNamed extends EvalLastLineSubtopic {
    generateQuestion(ctx: GenerateContext) {
        const [x, y, z] = randVars(3);
        const [a, b] = randInts(1n, 5n, 2, false);
        const func = randFunc();
        return createQuestion(`
          def ${func}(${x}, ${y}):
              ${func} = ${x} + ${y}
          ${z} = ${func}(${a}, ${b})
          ${z}`, [...range(0n, 10n), null, Error()], {}, ctx);
    }
}

class FuncWithNoReturnNamedOutside extends EvalLastLineSubtopic {
    generateQuestion(ctx: GenerateContext) {
        const [x, y, z] = randVars(3);
        const [a, b] = randInts(1n, 5n, 2, false);
        const func = randFunc();
        return createQuestion(`
          def ${func}(${x}, ${y}):
              ${z} = ${x} + ${y}
          ${z} = ${func}(${a}, ${b})
          ${z}`, [...range(0n, 10n), null, Error()], {}, ctx);
    }
}

export const FUNC_WITH_MULT_OR_NO_RETURN: Topic = new Topic('func-with-mult-or-no-return', 'Functions with Multiple/No Return', [
  new FuncWithMultReturnFirst(),
  new FuncWithMultReturnSecond(),
  new FuncWithMultReturnBoth(),
  new FuncWithNoReturn(),
  new FuncWithNoReturnNamed(),
  new FuncWithNoReturnNamedOutside(),
], [FUNC_WITH_MULTIPLE_ARGS]);
