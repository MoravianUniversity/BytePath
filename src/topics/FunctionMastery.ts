import { Topic, EvalLastLineSubtopic, CodeOutputSubtopic, TopicContext } from '../topics';
import { randChoice, randChoices, randVars, STRINGS, randIntNum, randInts } from '../util';
import { PRACTICE_03A_FUNCTIONS } from './03a - Functions';
import dedent from 'dedent-js';

class FunctionMasteryContext extends TopicContext {
  var1: string;
  var2: string;
  val1: string;
  val2: string;
  fun: string;
  n_args: number;
  constructor() {
    super();
    const [var1, var2, fun] = randVars(3);
    const [val1, val2] = randChoices(STRINGS, 2);
    const n_args = randIntNum(1, 2);
    const args = randVars(n_args);
    const funcs = [
      ["{0} + str(len({0}))", "str(len({0})) + {0}", "{0} + {0}[0]", "{0}[0] + {0}"],
      ["{0} + {1}[0]", "{0}[0] + {1}", "{1}[0] + {0}", "{1}[0] + {0} + {1}"],
    ];
    let func = randChoice(funcs[n_args - 1]).replaceAll("{0}", args[0]);
    if (n_args > 1) { func = func.replaceAll("{1}", args[1]); }
    this.var1 = var1
    this.var2 = var2;
    this.val1 = val1;
    this.val2 = val2;
    this.fun = fun;
    this.n_args = n_args;
    this.sharedCode = dedent`
      ${var1} = "${val1}"
      ${var2} = '${val2}'
      def ${fun}(${args.join(', ')}):
          return ${func}
    `;
  }
}

class FunctionMastery1 extends EvalLastLineSubtopic {
  gen(ctx: FunctionMasteryContext): string {
    return (ctx.n_args == 1) ? `${ctx.fun}("${ctx.var1}")` : `${ctx.fun}("${ctx.var1}", "${ctx.var2}")`;
  }
}

class FunctionMastery2 extends EvalLastLineSubtopic {
  gen(ctx: FunctionMasteryContext): string {
    return (ctx.n_args == 1) ? `${ctx.fun}(${ctx.var1})` : `${ctx.fun}(${ctx.var1}, ${ctx.var2})`;
  }
}

class FunctionMastery3 extends EvalLastLineSubtopic {
  gen(ctx: FunctionMasteryContext): string {
    return (ctx.n_args == 1) ? `${ctx.fun}(${ctx.fun}(${ctx.var2}))` : `${ctx.fun}(${ctx.var2}, ${ctx.fun}(${ctx.var1}, ${ctx.var2}))`;
  }
}

class ReadFunctionCode extends CodeOutputSubtopic {
  gen(): string {
    const function_name = randChoice(["perim", "area", "circum", "volume", "surface"])
    const function2_name = randChoice(["foo", "bar", "baz"])
    const [var1, var2] = randChoice([["a", "b"], ["x", "y"]])
    const var3 = function_name[0]
    const args = randChoice([`${var1}, ${var2}`, `${var1}, ${var1}`, `${var2}, ${var2}`])
    const paramsChoices = [`${var2}, ${var1}`, `${var1}, ${var2}`]
    if (args in paramsChoices) { paramsChoices.splice(paramsChoices.indexOf(args), 1) }
    const params = randChoice(paramsChoices)
    const sym = randChoice(["+", "*", "#", var1, var2])
    const [op1, op2] = randChoices(["+", "-", "*"], 2)
    const [val1, val2] = randInts(1n, 5n, 2)

    let code: string;
    if (randChoice([true, false])) {
      code = `def ${function_name}(${params}):
    ${var2} = ${var2} ${op1} ${var1}
    return ${var1} ${op2} ${var2}

def main():
    ${var1} = ${val1}
    ${var2} = ${val2}
    ${var3} = ${function_name}(${args})
    print(${var1},"${sym}",${var2},"->",${var3})`;
    } else {
      code = `def ${function2_name}(${var1}):
    ${var1} = ${var1} + ${val1}
    return ${var1}

def ${function_name}(${params}):
    ${var2} = ${var2} ${op1} ${var1}
    return ${var1} ${op2} ${var2}

def main():
    ${var1} = ${val1}
    ${var2} = ${val2}
    ${var2} = ${function_name}(${function2_name}(${var2}), ${var1})
    print("${var1}", ${var1}, '${var2}', ${var2})`
    }

    return `${code}\n\nif __name__ == "__main__":\n    main()`;
  }
}

export const FUNCTIONS_MASTERY = new Topic('functions-mastery', 'Functions Mastery', [
  new FunctionMastery1(),
  new FunctionMastery2(),
  new FunctionMastery3(),
  new ReadFunctionCode(),
], [PRACTICE_03A_FUNCTIONS], {order: 'sequential', forceQuiz: true, generateContext: () => new FunctionMasteryContext()});
