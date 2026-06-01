import { PyType, toPyAtom, toPyStr } from '../python';
import { CodeWriteQuestionGen, CodeWriteSubtopic } from '../topics';
import { randChoice, randVars, STRINGS, randIntNum, randFunc, range, VARS, written_list_of_values, ASCII_LOWER } from '../util';

function tryRemove(array: string[], item: string): void {
  const index = array.indexOf(item);
  if (index !== -1) { array.splice(index, 1); }
}

export class WriteCallLine extends CodeWriteSubtopic {
  readonly help = [{ afterFailedAttempts: 1, message: `The error message will be cryptic if you get this wrong due to the auto-checker.
    
The answer should be a single line assignment statement: \`variable = function(...)\`. There is no \`def\` or \`return\` in the answer.` }];
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

    const function_name = randFunc();

    tryRemove(var_names, function_name);
    const out_var = randChoice(var_names);
    tryRemove(var_names, out_var);

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

    const num = numbers[num_args as keyof typeof numbers];
    const args = written_list_of_values(func_arguments.map((a) => `\`${a}\``));
    const question = `The function \`${function_name}()\` takes ${num} arguments and returns a single ` +
                     `value. Write a statement that calls \`${function_name}()\` with the values ${args} ` +
                     `and stores the returned values in the variable \`${out_var}\`.`;
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
  readonly help = [{ afterFailedAttempts: 1, message: `The error message will be cryptic if you get this wrong due to the auto-checker.
    
    The answer should be a single line \`def\` statement: \`def function(...):\`. No need to write the body of the function.` }];
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
