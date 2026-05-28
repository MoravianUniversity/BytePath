import { Topic, createQuestion, EvalLastLineSubtopic, CodeOutputSubtopic, GenerateContext } from '../topics';
import { randChoice, randBool, randVars, randFunc, randInt, randInts, randIntNum, shuffle } from '../util';
import { toPyStr } from '../python';
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


function createVarsVals(): [string[], [bigint, bigint, string, string]] {
  const [var1, var2, var3, var4] = randVars(4);
  const int1 = randInt(3n, 10n);
  const int2 = 2n;
  const str = randChoice(["abcde", "uvwxyz", "hello"]);
  const ch = randChoice([..."abcdehABC"]);
  return [[var1, var2, var3, var4], [int1, int2, str, ch]];
}
function createCode(vars: string[], vals: [bigint, bigint, string, string]): string {
  const [var1, var2, var3, var4] = vars;
  const [int1, int2, str, ch] = vals;
  return dedent`
    ${var1} = ${int1}
    ${var2} = ${int2}
    ${var3} = ${toPyStr(str)}
    ${var4} = ${toPyStr(ch)}
  `;
}

class ConditionalsMastery extends Topic {
  vars: string[];
  vals: [bigint, bigint, string, string];
  constructor() {
    const [vars, vals] = createVarsVals();
    const code = createCode(vars, vals);
    super('conditionals-mastery', 'Conditionals Mastery', [
      new ConditionalsMastery_0(vars, vals, code),
      new ConditionalsMastery_1(vars, vals, code),
      new ConditionalsMastery_2(vars, vals, code),
      new ConditionalsMastery_3(vars, vals, code),
      new ConditionalsMastery_4(vars, vals, code),
      new ConditionalsMastery_5(vars, vals, code),
      new ConditionalsMastery_6(vars, vals, code),
      new ConditionalsMastery_7(vars, vals, code),
      new ConditionalsMastery_8(vars, vals, code),
      new ConditionalsMastery_9(vars, vals, code),
      new ConditionalsMastery_10(),
    ], [
        BASIC_ARITHMETIC, BASIC_VARIABLES, BASIC_PRINTS, DIVISION, STRING_LENGTH, STRING_INDEX,
        BASIC_FUNCTIONS, FUNC_WITH_MULTIPLE_ARGS, FUNC_WITH_MULTIPLE_CALLS, FUNC_WITH_PRINT,
        BASIC_RELATIONAL_OPERATORS, BASIC_BOOLEAN_OPERATORS, MEMBERSHIP_OPERATORS,
        BASIC_BRANCHING, CHAINED_BRANCHES,
    ], {order: 'sequential', sharedCode: code, forceQuiz: true});
    this.vars = vars;
    this.vals = vals;
  }

  start(): void {
    const [vars, vals] = createVarsVals();
    this.vars.splice(0, this.vars.length, ...vars);
    this.vals.splice(0, this.vals.length, ...vals);
    this.sharedCode = createCode(vars, vals);
    for (const subtopic of this.subtopics) {
      if (subtopic instanceof ConditionalsMasteryBase) {
        subtopic.sharedCode = this.sharedCode;
      }
    }
  }
}

abstract class ConditionalsMasteryBase extends EvalLastLineSubtopic {
  vars: string[];
  vals: [bigint, bigint, string, string];
  sharedCode: string;
  constructor(vars: string[], vals: [bigint, bigint, string, string], sharedCode: string) { super(); this.vars = vars; this.vals = vals; this.sharedCode = sharedCode; }
  generateQuestion(ctx: GenerateContext) {
    const code = this.genCode();
    return createQuestion(code, [], {sharedCode: this.sharedCode}, ctx);
  }
  abstract genCode(): string
}

class ConditionalsMastery_0 extends ConditionalsMasteryBase {
  genCode(): string { return `${this.vars[0]} ${randChoice(['+', '-', '*'])} ${this.vars[1]}`; }
}
class ConditionalsMastery_1 extends ConditionalsMasteryBase {
  genCode(): string { return `${this.vars[0]} ** ${this.vars[1]}`; }
}
class ConditionalsMastery_2 extends ConditionalsMasteryBase {
  genCode(): string { return `${this.vars[0]} // ${this.vars[1]}`; }
}
class ConditionalsMastery_3 extends ConditionalsMasteryBase {
  genCode(): string { return `${this.vars[0]} / ${this.vars[1]}`; }
}
class ConditionalsMastery_4 extends ConditionalsMasteryBase {
  genCode(): string { return `${this.vars[0]} % ${this.vars[1]}`; }
}
class ConditionalsMastery_5 extends ConditionalsMasteryBase {
  genCode(): string {
    const cond1 = `${this.vars[1]} ${randChoice(["<", "<="])} ${randInt(1n, 10n)}`;
    const cond2 = `${this.vars[0]} ${randChoice([">", ">="])} ${randInt(1n, 10n)}`;
    return `${cond1} ${randChoice(["and", "or"])} ${cond2}`;
  }
}
class ConditionalsMastery_6 extends ConditionalsMasteryBase {
  genCode(): string {
    return `${this.vars[2]} ${randChoice(["in", "not in"])} ${this.vars[3]}`;
  }
}
class ConditionalsMastery_7 extends ConditionalsMasteryBase {
  genCode(): string {
    const idx = randIntNum(1, this.vals[2].length - 3);
    let string_sub = this.vals[2].slice(idx, idx + 2);
    if (randBool()) {
        string_sub = string_sub.split('').reverse().join('');
    }
    return `${toPyStr(string_sub)} in ${this.vars[2]}`;
  }
}
class ConditionalsMastery_8 extends ConditionalsMasteryBase {
  genCode(): string {
    const len = BigInt(this.vals[2].length);
    return `len(${this.vars[2]}) ${randChoice(['==', '!='])} ${randInt(len-1n, len+1n)}`;
  }
}
class ConditionalsMastery_9 extends ConditionalsMasteryBase {
  genCode(): string {
    return `${this.vars[2]}[${this.vars[1]}] ${randChoice(['==', '!='])} ${toPyStr(this.vals[3])}`;
  }
}
class ConditionalsMastery_10 extends CodeOutputSubtopic {
  generateQuestion(ctx: GenerateContext) {
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

    const code = dedent`
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

    return createQuestion(code, [], {usesOutput: true}, ctx);
  }
}

export const CONDITIONALS_MASTERY = new ConditionalsMastery();
