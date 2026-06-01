import { PyType, toPyAtom, toPyStr } from '../python';
import { Topic, EvalLastLineSubtopic, CodeOutputSubtopic, TopicContext, ConceptualQuestionGen, ConceptualSubtopic, CodeWriteQuestionGen, CodeWriteSubtopic } from '../topics';
import { randChoice, randChoices, randVars, STRINGS, randIntNum, randInts, randFunc, range, VARS, written_list_of_values, ASCII_LOWER } from '../util';
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

function tryRemove(array: string[], item: string): void {
  const index = array.indexOf(item);
  if (index !== -1) { array.splice(index, 1); }
}

export class WriteCallLine extends CodeWriteSubtopic {
  gen(): CodeWriteQuestionGen {
    const str_arguments = ["hi", "star", "fred", "bat", "cat", "dog", "fish", "goat", "horse",
                           "jellyfish", "kangaroo", "llama", "monkey", "newt", "owl", "penguin",
                           "quail", "rabbit", "snake", "tiger", "unicorn", "vulture", "walrus",
                           "xray", "yak", "zebra"];
    const int_arguments = range(0n, 12n);
    const var_names = [...VARS];
    const all_arguments = {str: str_arguments, int: int_arguments, var: var_names};
    const numbers = {
      1: "one", 2: "two", 3: "three", 4: "four", 5: "five",
      6: "six", 7: "seven", 8: "eight", 9: "nine", 10: "ten",
    };

    // Get the function name
    const function_name = randFunc();

    // Get the output variable
    tryRemove(var_names, function_name);
    const out_var = randChoice(var_names);
    tryRemove(var_names, out_var);

    // Get the arguments
    tryRemove(str_arguments, function_name);
    tryRemove(str_arguments, out_var);
    const num_args = randIntNum(2, 3);
    const func_arguments = [];
    let in_var: string | null = null;
    let in_value: string | null = null;
    const expected: PyType[] = [];
    for (let i = 0; i < num_args; i++) {
        const arg_type = randChoice(Object.keys(all_arguments)) as keyof typeof all_arguments;
        const arg = randChoice(all_arguments[arg_type] as any[]);
        delete all_arguments[arg_type];
        if (arg_type == "var") {
          in_var = arg;
          in_value = randChoice(STRINGS);
          func_arguments.push(in_var);
          expected.push(in_value);
        } else {
          func_arguments.push(toPyAtom(arg));
          expected.push(arg);
        }
    }

    // Write the question and answer
    const num = numbers[num_args as keyof typeof numbers];
    const args = written_list_of_values(func_arguments.map((a) => `\`${a}\``));
    const question = `The function \`${function_name}()\` takes ${num} arguments and returns a single ` +
                     `value. Write a statement that calls \`${function_name}()\` with the values ${args} ` +
                     `and stores the returned values in the variable \`${out_var}\`.` + 
                     '\n\nNote: the error message will be cryptic if you get this wrong due to the auto-checker.';
    const answer = `${out_var} = ${function_name}(${func_arguments.join(', ')})`;
    const params = ASCII_LOWER.slice(0, num_args).join(', ');

    return {
      prompt: question,
      correct: answer,
      testCases: [{ values: [], expected }],
      transform: (answer) => {
        const var_assign = in_var ? `${in_var} = ${toPyStr(in_value!)}` : '';
        return `
        ${var_assign}
        def ${function_name}(${params}):
            return [${params}]
        ${answer}
        ${out_var}
        `;
      },
    };
  }
}

export class WriteDefLine extends CodeWriteSubtopic {
  gen(): CodeWriteQuestionGen {
    const func = randFunc();
    const num_args = randIntNum(2, 4);
    let params = randVars(num_args);
    while (params.includes(func)) { params = randVars(num_args); }
    const values = range(0n, BigInt(num_args-1));
    return {
      prompt: `Write the function *definition* line for \`${func}\` that has ${num_args} parameters: ${written_list_of_values(params.map((p) => `\`${p}\``))}.\n\nNote: the error message will be cryptic if you get this wrong due to the auto-checker.`,
      correct: `def ${func}(${params}):`,
      testCases: [{ values: [], expected: values }],
      transform: (answer) => {
        if (!answer.endsWith(':')) { answer += ':'; }
        return `
        ${answer}
            return [${params.join(', ')}]
        ${func}(${values.map((i) => i.toString()).join(', ')})
        `;
      },
    };
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
