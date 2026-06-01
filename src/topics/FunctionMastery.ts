import { Topic, EvalLastLineSubtopic, CodeOutputSubtopic, TopicContext, ConceptualQuestionGen, ConceptualSubtopic } from '../topics';
import { randChoice, randChoices, randVars, STRINGS, randIntNum, randInts } from '../util';
import { PRACTICE_03A_FUNCTIONS } from './03a - Functions';
import { WriteCallLine, WriteDefLine } from './FunctionWriteExercises';
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

const COMMON_MISTAKES = `Common mistakes:

* When in quotes, the string is literally those characters, when not in quotes, the string is the variable name.
* Be careful with the order of the arguments to a function compared to the order of the parameters in the function definition.
* When there are multiple function calls, evaluate inside parentheses first, using return values from one call as the argument for the next function call.`;

class FunctionMastery1 extends EvalLastLineSubtopic {
  readonly help = [{ afterFailedAttempts: 1, message: COMMON_MISTAKES }];
  gen(ctx: FunctionMasteryContext): string {
    return (ctx.n_args == 1) ? `${ctx.fun}("${ctx.var1}")` : `${ctx.fun}("${ctx.var1}", "${ctx.var2}")`;
  }
}

class FunctionMastery2 extends EvalLastLineSubtopic {
  readonly help = [{ afterFailedAttempts: 1, message: COMMON_MISTAKES }];
  gen(ctx: FunctionMasteryContext): string {
    return (ctx.n_args == 1) ? `${ctx.fun}(${ctx.var1})` : `${ctx.fun}(${ctx.var1}, ${ctx.var2})`;
  }
}

class FunctionMastery3 extends EvalLastLineSubtopic {
  readonly help = [{ afterFailedAttempts: 1, message: COMMON_MISTAKES }];
  gen(ctx: FunctionMasteryContext): string {
    return (ctx.n_args == 1) ? `${ctx.fun}(${ctx.fun}(${ctx.var2}))` : `${ctx.fun}(${ctx.var2}, ${ctx.fun}(${ctx.var1}, ${ctx.var2}))`;
  }
}

class ReadFunctionCode extends CodeOutputSubtopic {
  readonly help = [{ afterFailedAttempts: 1, message: COMMON_MISTAKES + `
* When printing a string, its contents are printed (without quotes).
* When printing multiple values, they are printed on the same line, separated by a space.
* Every function call has its own variables and are not shared with other function calls.
` }];
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

const VOCAB_OPTIONS = [
  'arguments/parameters',
  'input()',
  'print()',
  'return value',
  'variables',
  'literals',
  'strings',
  'numbers',
  'booleans',
];

export class InputsToFunctions extends ConceptualSubtopic {
  gen(): ConceptualQuestionGen {
    return {
      prompt: `What are the inputs to a function?`,
      correct: [
        'arguments/parameters', 'parameters/arguments', 'arguments/params', 'params/arguments',
        'args/params', 'params/args', 'params/arguments', 'arguments/params',
        'arguments', 'parameters', 'args', 'params',
      ],
      options: VOCAB_OPTIONS,
    };
  }
}

export class FunctionOutputs extends ConceptualSubtopic {
  gen(): ConceptualQuestionGen {
    return {
      prompt: `What are the outputs of a function?`,
      correct: ['return value', 'return', 'return values', 'returns'],
      options: VOCAB_OPTIONS,
    };
  }
}

export class UserInputs extends ConceptualSubtopic {
  gen(): ConceptualQuestionGen {
    return {
      prompt: `How do you get a value from the user?`,
      correct: ['input()', 'input'],
      options: VOCAB_OPTIONS,
    };
  }
}

export class UserOutputs extends ConceptualSubtopic {
  gen(): ConceptualQuestionGen {
    return {
      prompt: `How do you output a value to the user?`,
      correct: ['print()', 'print'],
      options: VOCAB_OPTIONS,
    };
  }
}

export const FUNCTIONS_MASTERY = new Topic('functions-mastery', 'Functions Mastery', [
  new FunctionMastery1(),
  new FunctionMastery2(),
  new FunctionMastery3(),
  new ReadFunctionCode(),
  new WriteCallLine(),
  new WriteDefLine(),
  new InputsToFunctions(),
  new FunctionOutputs(),
  new UserInputs(),
  new UserOutputs(),
], [PRACTICE_03A_FUNCTIONS], {order: 'sequential', forceQuiz: true, generateContext: () => new FunctionMasteryContext()});
