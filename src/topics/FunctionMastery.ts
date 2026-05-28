import { Topic, createQuestion, EvalLastLineSubtopic, CodeOutputSubtopic, GenerateContext } from '../topics';
import { randChoice, randChoices, randVars, STRINGS, randIntNum, randInts } from '../util';
import { PRACTICE_03A_FUNCTIONS } from './03a - Functions';
import dedent from 'dedent-js';


function createVarsVals(): [string[], [string, string], string, number] {
  const [var1, var2, fun] = randVars(3);
  const [val1, val2] = randChoices(STRINGS, 2);
  const n_args = randIntNum(1, 2);
  return [[var1, var2], [val1, val2], fun, n_args];
}
function createCode(vars: string[], vals: [string, string], fun: string, n_args: number): string {
  const [var1, var2] = vars;
  const [val1, val2] = vals;
  const args = randVars(n_args);
  const funcs = [
    ["{0} + str(len({0}))", "str(len({0})) + {0}", "{0} + {0}[0]", "{0}[0] + {0}"],
    ["{0} + {1}[0]", "{0}[0] + {1}", "{1}[0] + {0}", "{1}[0] + {0} + {1}"],
  ];
  let func = randChoice(funcs[n_args - 1]).replaceAll("{0}", args[0]);
  if (n_args > 1) { func = func.replaceAll("{1}", args[1]); }
  return dedent`
    ${var1} = "${val1}"
    ${var2} = '${val2}'
    def ${fun}(${args.join(', ')}):
        return ${func}
  `;
}

class FunctionMastery extends Topic {
  vars: string[];
  vals: [string, string];
  fun: string;
  n_args: number;
  constructor() {
    const [vars, vals, fun, n_args] = createVarsVals();
    const code = createCode(vars, vals, fun, n_args);
    super('functions-mastery', 'Functions Mastery', [
      new FunctionMastery1(vars, vals, fun, n_args, code),
      new FunctionMastery2(vars, vals, fun, n_args, code),
      new FunctionMastery3(vars, vals, fun, n_args, code),
      new ReadFunctionCode(),
    ], [PRACTICE_03A_FUNCTIONS], {order: 'sequential', sharedCode: code, forceQuiz: true});
    this.vars = vars;
    this.vals = vals;
    this.fun = fun;
    this.n_args = n_args;
  }

  start(): void {
    const [vars, vals, fun, n_args] = createVarsVals();
    this.vars.splice(0, this.vars.length, ...vars);
    this.vals.splice(0, this.vals.length, ...vals);
    this.fun = fun;
    this.n_args = n_args;
    this.sharedCode = createCode(vars, vals, fun, n_args);
    for (const subtopic of this.subtopics) {
      if (subtopic instanceof FunctionMasteryBase) {
        subtopic.fun = fun;
        subtopic.n_args = n_args;
        subtopic.sharedCode = this.sharedCode;
      }
    }
  }
}

abstract class FunctionMasteryBase extends EvalLastLineSubtopic {
  vars: string[];
  vals: [string, string];
  fun: string;
  n_args: number;
  sharedCode: string;
  constructor(vars: string[], vals: [string, string], fun: string, n_args: number, sharedCode: string) { super(); this.vars = vars; this.vals = vals; this.fun = fun; this.n_args = n_args; this.sharedCode = sharedCode; }
  generateQuestion(ctx: GenerateContext) {
    const code = this.genCode();
    return createQuestion(code, [], {sharedCode: this.sharedCode}, ctx);
  }
  abstract genCode(): string
}

class FunctionMastery1 extends FunctionMasteryBase {
  genCode(): string { return (this.n_args == 1) ? `${this.fun}("${this.vars[0]}")` : `${this.fun}("${this.vars[0]}", "${this.vars[1]}")`; }
}

class FunctionMastery2 extends FunctionMasteryBase {
  genCode(): string { return (this.n_args == 1) ? `${this.fun}(${this.vars[0]})` : `${this.fun}(${this.vars[0]}, ${this.vars[1]})`; }
}

class FunctionMastery3 extends FunctionMasteryBase {
  genCode(): string { return (this.n_args == 1) ? `${this.fun}(${this.fun}(${this.vars[1]}))` : `${this.fun}(${this.vars[1]}, ${this.fun}(${this.vars[0]}, ${this.vars[1]}))`; }
}

class ReadFunctionCode extends CodeOutputSubtopic {
  generateQuestion(ctx: GenerateContext) {
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

    return createQuestion(`${code}\n\nif __name__ == "__main__":\n    main()`, [], {usesOutput: true}, ctx);
  }
}

export const FUNCTIONS_MASTERY = new FunctionMastery();
