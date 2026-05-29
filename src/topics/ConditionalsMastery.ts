import { Topic, EvalLastLineSubtopic, CodeOutputSubtopic, TopicContext } from '../topics';
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
  gen(ctx: ConditionalsMasteryContext): string { return `${ctx.var1} ${randChoice(['+', '-', '*'])} ${ctx.var2}`; }
}
class ConditionalsMastery_1 extends EvalLastLineSubtopic {
  gen(ctx: ConditionalsMasteryContext): string { return `${ctx.var1} ** ${ctx.var2}`; }
}
class ConditionalsMastery_2 extends EvalLastLineSubtopic {
  gen(ctx: ConditionalsMasteryContext): string { return `${ctx.var1} // ${ctx.var2}`; }
}
class ConditionalsMastery_3 extends EvalLastLineSubtopic {
  gen(ctx: ConditionalsMasteryContext): string { return `${ctx.var1} / ${ctx.var2}`; }
}
class ConditionalsMastery_4 extends EvalLastLineSubtopic {
  gen(ctx: ConditionalsMasteryContext): string { return `${ctx.var1} % ${ctx.var2}`; }
}
class ConditionalsMastery_5 extends EvalLastLineSubtopic {
  gen(ctx: ConditionalsMasteryContext): string {
    const cond1 = `${ctx.var2} ${randChoice(["<", "<="])} ${randInt(1n, 10n)}`;
    const cond2 = `${ctx.var1} ${randChoice([">", ">="])} ${randInt(1n, 10n)}`;
    return `${cond1} ${randChoice(["and", "or"])} ${cond2}`;
  }
}
class ConditionalsMastery_6 extends EvalLastLineSubtopic {
  gen(ctx: ConditionalsMasteryContext): string {
    return `${ctx.var3} ${randChoice(["in", "not in"])} ${ctx.var4}`;
  }
}
class ConditionalsMastery_7 extends EvalLastLineSubtopic {
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
  gen(ctx: ConditionalsMasteryContext): string {
    const len = BigInt(ctx.vals[2].length);
    return `len(${ctx.var3}) ${randChoice(['==', '!='])} ${randInt(len-1n, len+1n)}`;
  }
}
class ConditionalsMastery_9 extends EvalLastLineSubtopic {
  gen(ctx: ConditionalsMasteryContext): string {
    return `${ctx.var3}[${ctx.var2}] ${randChoice(['==', '!='])} ${toPyStr(ctx.vals[3])}`;
  }
}

class ConditionalsMastery_10 extends CodeOutputSubtopic {
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
  new ConditionalsMastery_10(),
], [
    BASIC_ARITHMETIC, BASIC_VARIABLES, BASIC_PRINTS, DIVISION, STRING_LENGTH, STRING_INDEX,
    BASIC_FUNCTIONS, FUNC_WITH_MULTIPLE_ARGS, FUNC_WITH_MULTIPLE_CALLS, FUNC_WITH_PRINT,
    BASIC_RELATIONAL_OPERATORS, BASIC_BOOLEAN_OPERATORS, MEMBERSHIP_OPERATORS,
    BASIC_BRANCHING, CHAINED_BRANCHES,
], {order: 'sequential', forceQuiz: true, generateContext: () => new ConditionalsMasteryContext()});
