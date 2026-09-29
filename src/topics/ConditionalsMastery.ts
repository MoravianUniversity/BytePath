import { Topic, EvalLastLineSubtopic, CodeOutputSubtopic, CodeWriteSubtopic, CodeWriteQuestionGen, TopicContext } from '../topics';
import { randChoice, randBool, randVars, randFunc, randInt, randInts, randIntNum, shuffle, VARS, ASCII_LOWER, DIGITS } from '../util';
import { toPyStr, PyType } from '../python';
import dedent from 'dedent-js';

import { BASIC_ARITHMETIC } from './BasicArithmetic';
import { BASIC_VARIABLES } from './BasicVariables';
import { STRING_INDEX } from './StringIndexing';
import { STRING_LENGTH } from './StringLength';
import { DIVISION } from './Division';
import { BASIC_PRINTS } from './BasicPrints';
import { BASIC_FUNCTIONS } from './BasicFunctions';
import { FUNC_WITH_MULTIPLE_ARGS } from './FuncWithMultipleArgs';
import { FUNC_WITH_MULTIPLE_CALLS } from './FuncWithMultipleCalls';
import { FUNC_WITH_PRINT } from './FuncWithPrint';
import { BASIC_RELATIONAL_OPERATORS } from './BasicRelationalOperators';
import { BASIC_BOOLEAN_OPERATORS } from './BasicBooleanOperators';
import { MEMBERSHIP_OPERATORS } from './MembershipOperator';
import { BASIC_BRANCHING } from './BasicBranching';
import { CHAINED_BRANCHES } from './ChainedBranches';

class ConditionalsMasteryContext extends TopicContext {
  var1: string;
  var2: string;
  var3: string;
  var4: string;
  int1: bigint;
  int2: bigint;
  str: string;
  ch: string;
  vals: [bigint, bigint, string, string];
  constructor() {
    super();
    const [var1, var2, var3, var4] = randVars(4);
    const int1 = randInt(3n, 10n);
    const int2 = 2n;
    const str = randChoice(["abcde", "uvwxyz", "hello"]);
    const ch = randChoice([..."abcdehABC"]);
    this.var1 = var1;
    this.var2 = var2;
    this.var3 = var3;
    this.var4 = var4;
    this.int1 = int1;
    this.int2 = int2;
    this.str = str;
    this.ch = ch;
    this.vals = [int1, int2, str, ch];
    this.sharedCode = dedent`
      ${var1} = ${int1}
      ${var2} = ${int2}
      ${var3} = ${toPyStr(str)}
      ${var4} = ${toPyStr(ch)}
    `;
  }
}

class ConditionalsMastery_0 extends EvalLastLineSubtopic {
  readonly contextConstructor = ConditionalsMasteryContext;
  gen(ctx: ConditionalsMasteryContext): string { return `${ctx.var1} ${randChoice(['+', '-', '*'])} ${ctx.var2}`; }
}
class ConditionalsMastery_1 extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'Remember that ** is the exponent operator.',
    },
  ];
  readonly contextConstructor = ConditionalsMasteryContext;
  gen(ctx: ConditionalsMasteryContext): string { return `${ctx.var1} ** ${ctx.var2}`; }
}
class ConditionalsMastery_2 extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'Remember that // is the integer division operator.',
    },
  ];
  readonly contextConstructor = ConditionalsMasteryContext;
  gen(ctx: ConditionalsMasteryContext): string { return `${ctx.var1} // ${ctx.var2}`; }
}
class ConditionalsMastery_3 extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'Remember that / is the float division operator.',
    },
  ];
  readonly contextConstructor = ConditionalsMasteryContext;
  gen(ctx: ConditionalsMasteryContext): string { return `${ctx.var1} / ${ctx.var2}`; }
}
class ConditionalsMastery_4 extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'Remember that % is the remainder operator.',
    },
  ];
  readonly contextConstructor = ConditionalsMasteryContext;
  gen(ctx: ConditionalsMasteryContext): string { return `${ctx.var1} % ${ctx.var2}`; }
}
class ConditionalsMastery_5 extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'Remember that True and False are the possible values of a boolean expression.',
    },
  ];
  readonly contextConstructor = ConditionalsMasteryContext;
  gen(ctx: ConditionalsMasteryContext): string {
    const cond1 = `${ctx.var2} ${randChoice(["<", "<="])} ${randInt(1n, 10n)}`;
    const cond2 = `${ctx.var1} ${randChoice([">", ">="])} ${randInt(1n, 10n)}`;
    return `${cond1} ${randChoice(["and", "or"])} ${cond2}`;
  }
}
class ConditionalsMastery_6 extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'Remember that in and not in are the membership operators and give a boolean value and the substring must be an exact match for an entire substring in the string.',
    },
  ];
  readonly contextConstructor = ConditionalsMasteryContext;
  gen(ctx: ConditionalsMasteryContext): string {
    return `${ctx.var3} ${randChoice(["in", "not in"])} ${ctx.var4}`;
  }
}
class ConditionalsMastery_7 extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'Remember that in and not in are the membership operators and give a boolean value and the substring must be an exact match for an entire substring in the string.',
    },
  ];
  readonly contextConstructor = ConditionalsMasteryContext;
  gen(ctx: ConditionalsMasteryContext): string {
    const idx = randIntNum(1, ctx.vals[2].length - 3);
    let string_sub = ctx.vals[2].slice(idx, idx + 2);
    if (randBool()) {
        string_sub = string_sub.split('').reverse().join('');
    }
    return `${toPyStr(string_sub)} in ${ctx.var3}`;
  }
}
class ConditionalsMastery_8 extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'Remember that len() gives the length of a string.',
    },
  ];
  readonly contextConstructor = ConditionalsMasteryContext;
  gen(ctx: ConditionalsMasteryContext): string {
    const len = BigInt(ctx.vals[2].length);
    return `len(${ctx.var3}) ${randChoice(['==', '!='])} ${randInt(len-1n, len+1n)}`;
  }
}
class ConditionalsMastery_9 extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'Remember that indexing starts at 0.',
    },
  ];
  readonly contextConstructor = ConditionalsMasteryContext;
  gen(ctx: ConditionalsMasteryContext): string {
    return `${ctx.var3}[${ctx.var2}] ${randChoice(['==', '!='])} ${toPyStr(ctx.vals[3])}`;
  }
}

const ORDINALS: Record<number, string> = {
  1: 'first', 2: 'second', 3: 'third', 4: 'fourth', 5: 'fifth',
  6: 'sixth', 7: 'seventh', 8: 'eighth', 9: 'ninth', 10: 'tenth',
};

type CondParts = {
  text: string;
  code: string;
  testCases: { values: PyType[]; expected: boolean }[];
  options: string[];
};

function randomStringOfLength(length: number): string {
  return Array.from({ length }, () => randChoice(ASCII_LOWER)).join('');
}

function writeCondStr1(varName: string): CondParts {
  const count = randIntNum(3, 10);
  const cond1 = `at least ${count} characters in it`;
  const cond1Code = `len(${varName}) >= ${count}`;
  const pos = randIntNum(1, Math.min(count, 10));
  const char = randChoice([...ASCII_LOWER, ...DIGITS]);
  const cond2 = `the ${ORDINALS[pos]} (index ${pos - 1}) character is '${char}'`;
  const cond2Code = `${varName}[${pos - 1}] == '${char}'`;
  const idx = pos - 1;

  const withCharAt = (length: number, ch: string): string => {
    const s = [...randomStringOfLength(Math.max(length, pos))];
    s[idx] = ch;
    return s.slice(0, length).join('');
  };
  const otherChar = randChoice([...ASCII_LOWER, ...DIGITS].filter((c) => c !== char));
  const trueLen = count + randIntNum(0, 2);
  const shortLen = Math.max(pos, Math.min(count - 1, pos)); // indexable but may fail length when pos < count

  const testCases: { values: PyType[]; expected: boolean }[] = [
    { values: [withCharAt(trueLen, char)], expected: true },
    { values: [withCharAt(trueLen, otherChar)], expected: false },
  ];
  if (shortLen < count) {
    testCases.push({ values: [withCharAt(shortLen, char)], expected: false });
  }
  testCases.push({ values: [withCharAt(count + 3, otherChar)], expected: false });

  return {
    text: `${cond1} and ${cond2}`,
    code: `${cond1Code} and ${cond2Code}`,
    testCases,
    options: [
      `${cond1Code} or ${cond2Code}`,
      `len(${varName}) > ${count} and ${varName}[${pos - 1}] == '${char}'`,
      `len(${varName}) >= ${count} and ${varName}[${pos}] == '${char}'`,
      `len(${varName}) >= ${count} and ${varName}[${pos - 1}] = '${char}'`,
    ],
  };
}

function writeCondStr2(varName: string): CondParts {
  const lower = randIntNum(1, 6);
  const upper = randIntNum(lower + 1, 10);
  const code = `len(${varName}) >= ${lower} and len(${varName}) <= ${upper}`;
  return {
    text: `has between ${lower} and ${upper} characters in it (inclusive)`,
    code,
    testCases: [
      { values: [randomStringOfLength(lower)], expected: true },
      { values: [randomStringOfLength(upper)], expected: true },
      { values: [randomStringOfLength(Math.floor((lower + upper) / 2))], expected: true },
      { values: [randomStringOfLength(Math.max(0, lower - 1))], expected: false },
      { values: [randomStringOfLength(upper + 1)], expected: false },
    ],
    options: [
      `len(${varName}) > ${lower} and len(${varName}) < ${upper}`,
      `len(${varName}) >= ${lower} or len(${varName}) <= ${upper}`,
      `len(${varName}) > ${lower} and len(${varName}) <= ${upper}`,
      `len(${varName}) >= ${lower} and len(${varName}) < ${upper}`,
    ],
  };
}

function writeCondStr3(varName: string): CondParts {
  const lower = randIntNum(1, 6);
  const upper = randIntNum(lower + 1, 10);
  const code = `len(${varName}) < ${lower} or len(${varName}) > ${upper}`;
  return {
    text: `has less than ${lower} characters in it or more than ${upper} characters in it`,
    code,
    testCases: [
      { values: [randomStringOfLength(Math.max(0, lower - 1))], expected: true },
      { values: [randomStringOfLength(upper + 1)], expected: true },
      { values: [randomStringOfLength(lower)], expected: false },
      { values: [randomStringOfLength(upper)], expected: false },
      { values: [randomStringOfLength(Math.floor((lower + upper) / 2))], expected: false },
    ],
    options: [
      `len(${varName}) < ${lower} and len(${varName}) > ${upper}`,
      `len(${varName}) <= ${lower} or len(${varName}) >= ${upper}`,
      `len(${varName}) > ${lower} or len(${varName}) < ${upper}`,
      `len(${varName}) < ${lower} or len(${varName}) >= ${upper}`,
    ],
  };
}

function writeCondInt1(varName: string): CondParts {
  const limit = randIntNum(2, 10);
  const direction = randChoice(['less', 'greater'] as const);
  const oddOrEven = randChoice(['odd', 'even'] as const);
  const rem = oddOrEven === 'even' ? 0 : 1;
  const op = direction === 'less' ? '<' : '>';
  const code = `${varName} ${op} ${limit} and ${varName} % 2 == ${rem}`;

  // Match Python's % on negatives: ((n % 2) + 2) % 2
  const pyRem2 = (n: number) => ((n % 2) + 2) % 2;
  const isMatch = (n: number) =>
    (direction === 'less' ? n < limit : n > limit) && pyRem2(n) === rem;
  const candidates = Array.from({ length: 31 }, (_, i) => i - 10);
  const trues = candidates.filter(isMatch);
  const falses = candidates.filter((n) => !isMatch(n));

  return {
    text: `is ${direction} than ${limit} and ${oddOrEven} ` +
      `(hint: when dividing ${oddOrEven} numbers by 2 you get a remainder of ${rem})`,
    code,
    testCases: [
      { values: [BigInt(randChoice(trues))], expected: true },
      { values: [BigInt(randChoice(trues))], expected: true },
      { values: [BigInt(randChoice(falses))], expected: false },
      { values: [BigInt(randChoice(falses))], expected: false },
      { values: [BigInt(limit)], expected: false },
    ],
    options: [
      `${varName} ${op} ${limit} or ${varName} % 2 == ${rem}`,
      `${varName} ${op}= ${limit} and ${varName} % 2 == ${rem}`,
      `${varName} ${op} ${limit} and ${varName} % 2 == ${1 - rem}`,
      `${varName} ${direction === 'less' ? '>' : '<'} ${limit} and ${varName} % 2 == ${rem}`,
    ],
  };
}

function writeCondInt2(varName: string): CondParts {
  const lower = randIntNum(-10, 0);
  const upper = randIntNum(10, 20);
  const code = `${varName} < ${lower} or ${varName} > ${upper}`;
  return {
    text: `is less than ${lower} or greater than ${upper}`,
    code,
    testCases: [
      { values: [BigInt(lower - 1)], expected: true },
      { values: [BigInt(upper + 1)], expected: true },
      { values: [BigInt(lower)], expected: false },
      { values: [BigInt(upper)], expected: false },
      { values: [BigInt(Math.floor((lower + upper) / 2))], expected: false },
    ],
    options: [
      `${varName} < ${lower} and ${varName} > ${upper}`,
      `${varName} <= ${lower} or ${varName} >= ${upper}`,
      `${varName} > ${lower} or ${varName} < ${upper}`,
      `${lower} < ${varName} < ${upper}`,
    ],
  };
}

class WriteCondition extends CodeWriteSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 1,
      message: 'Write only the condition expression — do not include `if` or a trailing `:`. Use `and` / `or` to combine parts, and remember string indexes start at 0.',
    },
  ];
  gen(): CodeWriteQuestionGen {
    const varType = randChoice(['string', 'int'] as const);
    const varName = randChoice(VARS);
    const parts = varType === 'string'
      ? randChoice([writeCondStr1, writeCondStr2, writeCondStr3])(varName)
      : randChoice([writeCondInt1, writeCondInt2])(varName);

    return {
      prompt: `Write the condition (just the condition, not the \`if\` or the \`:\`) for checking if the ${varType} variable \`${varName}\` ${parts.text}.`,
      correct: parts.code,
      options: parts.options,
      variables: [varName],
      testCases: parts.testCases,
    };
  }
}

class ConditionalsMastery_10 extends CodeOutputSubtopic {
  readonly showWorkspace = true;
  readonly help = [{ afterFailedAttempts: 1, message: `
* When in quotes, the string is literally those characters, when not in quotes, the string is the variable name.
* Be careful with the order of the arguments to a function compared to the order of the parameters in the function definition.
* When there are multiple function calls, evaluate inside parentheses first, using return values from one call as the argument for the next function call.
* When printing a string, its contents are printed (without quotes).
* When printing multiple values, they are printed on the same line, separated by a space.
* Every function call has its own variables and are not shared with other function calls.
` }];
  gen(): string {
    const func = randFunc();
    const [var1, var2] = randVars(2);
    let nums = randInts(0n, 10n, 6);
    let returns = shuffle([var1, var2, "-1"]);

    const main_code_1 = `${var2} = ${func}(${nums[0]}, ${nums[1]})`
    nums = nums.slice(2);
    const main_code_2 = randChoice([
        `${var1} = ${func}(${func}(${nums[0]}, ${nums[1]}), ${nums[2]})`,
        `${var1} = ${func}(${nums[0]}, ${func}(${nums[1]}, ${nums[2]}))`,
        `${var1} = ${func}(${nums[0]},${nums[1]})+${func}(${nums[2]},${nums[3]})`,
        `${var1} = ${func}(${var2}, ${nums[0]})`,
        `${var1} = ${func}(${nums[0]}, ${var2})`,
    ]);
    const print_code = `print("${var1}", ${var1}, "${var2}", ${var2})`;

    const cond1 = `${var1} > ${randInt(1n, 5n)}`;
    const cond2 = `${var2} < ${randInt(5n, 10n)}`;

    if (returns[0] == "-1" && randBool()) {
        returns = [`${returns[2]} = ${returns[1]}`, `return ${returns[1]}`, `return ${returns[2]}`];
    } else if (returns[1] == "-1" && randBool()) {
        returns = [`return ${returns[0]}`, `${returns[2]} = ${returns[0]}`, `return ${returns[2]}`];
    } else {
        returns = returns.map(r => `return ${r}`);
    }

    return dedent`
    def ${func}(${var1}, ${var2}):
        if ${cond1}:
            ${returns[0]}
        elif ${cond2}:
            ${returns[1]}
        ${returns[2]}

    def main():
        ${main_code_1}
        ${main_code_2}
        ${print_code}

    if __name__ == "__main__":
        main()
`;
  }
}

export const CONDITIONALS_MASTERY = new Topic('conditionals-mastery', 'Conditionals Mastery', [
  new ConditionalsMastery_0(),
  new ConditionalsMastery_1(),
  new ConditionalsMastery_2(),
  new ConditionalsMastery_3(),
  new ConditionalsMastery_4(),
  new ConditionalsMastery_5(),
  new ConditionalsMastery_6(),
  new ConditionalsMastery_7(),
  new ConditionalsMastery_8(),
  new ConditionalsMastery_9(),
  new WriteCondition(),
  new ConditionalsMastery_10(),
], [
    BASIC_ARITHMETIC, BASIC_VARIABLES, BASIC_PRINTS, DIVISION, STRING_LENGTH, STRING_INDEX,
    BASIC_FUNCTIONS, FUNC_WITH_MULTIPLE_ARGS, FUNC_WITH_MULTIPLE_CALLS, FUNC_WITH_PRINT,
    BASIC_RELATIONAL_OPERATORS, BASIC_BOOLEAN_OPERATORS, MEMBERSHIP_OPERATORS,
    BASIC_BRANCHING, CHAINED_BRANCHES,
], {order: 'sequential', forceQuiz: true});
