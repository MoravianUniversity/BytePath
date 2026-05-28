import { Answer, Topic, createQuestion, EvalLastLineSubtopic, GenerateContext } from '../topics';
import { randInt, randInts, randChoice, randChoices, randVars, randFuncs, range, STRINGS } from '../util';
import { STRING_CONCAT } from './StringConcat';
import { STRING_LENGTH } from './StringLength';
import { STRING_INDEX } from './StringIndexing';
import { BASIC_FUNCTIONS } from './BasicFunctions';
import { FUNC_WITH_MULTIPLE_ARGS } from './FuncWithMultipleArgs';
import { FUNC_WITH_MULTIPLE_CALLS } from './FuncWithMultipleCalls';
import dedent from 'dedent-js';

// Example Shared Code:
// def foo(b):
//     return b + 2
// def bar(b):
//     return b[0]
// def baz(x, y):
//     return x * 2 + y
// x = 2
// y = 3
// a = 'hello'
// b = "​​world"

// Example Questions:
// foo(1)
// foo(x)
// foo(y)
// bar('alice')
// bar(a)
// bar(b)
// foo(foo(0))
// foo(foo(x))
// foo(len(bar(a)))
// str(foo(x)) + bar(b)
// foo(y) + len(bar(a))
// baz(x, y)
// baz(y, x)
// baz(len(a), len(b))

function createVarsVals(): [string[], string[], [bigint, bigint, string, string]] {
  const [fun1, fun2, fun3] = randFuncs(3);
  const [var1, var2, var3, var4] = randVars(4);
  const [val1, val2] = randInts(1n, 8n, 2);
  const [val3, val4] = randChoices(STRINGS, 2);
  //const val1 = randInt(1n, BigInt(Math.min(val2.length, val3.length)));
  return [[fun1, fun2, fun3], [var1, var2, var3, var4], [val1, val2, val3, val4]];
}
function createCode(funs: string[], vars: string[], vals: [bigint, bigint, string, string]): string {
  const [fun1, fun2, fun3] = funs;
  const [var1, var2, var3, var4] = vars;
  const [val1, val2, val3, val4] = vals;
  return dedent`
    def ${fun1}(${var3}):
        return ${var3} + 2
    def ${fun2}(${var4}):
        return ${var4}[0]
    def ${fun3}(${var1}, ${var2}):
        return ${var1} * 2 + ${var2}
    ${var1} = ${val1}
    ${var2} = ${val2}
    ${var3} = '${val3}'
    ${var4} = "${val4}"
  `;
}

class Practice03ABasicFunctions extends Topic {
  funs: string[];
  vars: string[];
  vals: [bigint, bigint, string, string];
  constructor() {
    const [funs, vars, vals] = createVarsVals();
    const code = createCode(funs, vars, vals);
    super('practice-03a-basic-functions', '03a Basic Functions', [
      new Practice03ABasicFunctions_1(funs, vars, vals, code),
      new Practice03ABasicFunctions_2(funs, vars, vals, code),
      new Practice03ABasicFunctions_3(funs, vars, vals, code),
      new Practice03ABasicFunctions_4(funs, vars, vals, code),
      new Practice03ABasicFunctions_5(funs, vars, vals, code),
      new Practice03ABasicFunctions_6(funs, vars, vals, code),
      new Practice03ABasicFunctions_7(funs, vars, vals, code),
      new Practice03ABasicFunctions_8(funs, vars, vals, code),
      new Practice03ABasicFunctions_9(funs, vars, vals, code),
      new Practice03ABasicFunctions_10(funs, vars, vals, code),
      new Practice03ABasicFunctions_11(funs, vars, vals, code),
      new Practice03ABasicFunctions_12(funs, vars, vals, code),
      new Practice03ABasicFunctions_13(funs, vars, vals, code),
      new Practice03ABasicFunctions_14(funs, vars, vals, code),
    ], [BASIC_FUNCTIONS, FUNC_WITH_MULTIPLE_ARGS, FUNC_WITH_MULTIPLE_CALLS, STRING_CONCAT, STRING_LENGTH, STRING_INDEX], {order: 'sequential', sharedCode: code});
    this.funs = funs;
    this.vars = vars;
    this.vals = vals;
  }

  start(): void {
    const [funs, vars, vals] = createVarsVals();
    this.funs.splice(0, this.funs.length, ...funs);
    this.vars.splice(0, this.vars.length, ...vars);
    this.vals.splice(0, this.vals.length, ...vals);
    this.sharedCode = createCode(funs, vars, vals);
    for (const subtopic of this.subtopics) {
      if (subtopic instanceof SubtopicBase) {
        subtopic.sharedCode = this.sharedCode;
      }
    }
  }
}

abstract class SubtopicBase extends EvalLastLineSubtopic {
  funs: string[];
  vars: string[];
  vals: [bigint, bigint, string, string];
  sharedCode: string;
  constructor(funs: string[], vars: string[], vals: [bigint, bigint, string, string], sharedCode: string) {
    super(); this.funs = funs; this.vars = vars; this.vals = vals; this.sharedCode = sharedCode;
  }
  generateQuestion(ctx: GenerateContext) {
    const code = this.genCode();
    const opts = this.genOptions();
    return createQuestion(code, opts, {sharedCode: this.sharedCode}, ctx);
  }
  abstract genCode(): string
  abstract genOptions(): Answer[]
}

class Practice03ABasicFunctions_1 extends SubtopicBase {
  genCode(): string { return `${this.funs[0]}(${randInt(1n, 8n)})`; }
  genOptions(): Answer[] { return range(1n, 12n); }
}

class Practice03ABasicFunctions_2 extends SubtopicBase {
  genCode(): string { return `${this.funs[0]}(${this.vars[1]})`; }
  genOptions(): Answer[] { return range(1n, 12n); }
}

class Practice03ABasicFunctions_3 extends SubtopicBase {
  genCode(): string { return `${this.funs[0]}(${this.vars[2]})`; }
  genOptions(): Answer[] { return range(1n, 12n); }
}

class Practice03ABasicFunctions_4 extends SubtopicBase {
  lastString: string = '';
  genCode(): string {
    this.lastString = randChoice(STRINGS);
    return `${this.funs[1]}("${this.lastString}")`;
  }
  genOptions(): Answer[] { return [this.lastString, this.vars[3], this.vals[3], 0n, this.funs[1], this.vals[2][1], this.vals[2][0], this.vals[2]]; }
}

class Practice03ABasicFunctions_5 extends SubtopicBase {
  genCode(): string { return `${this.funs[1]}(${this.vars[2]})`; }
  genOptions(): Answer[] { return [this.vars[2], this.vals[2], this.vars[3], this.vals[3], 0n, this.funs[1], this.vals[2][1], this.vals[2][0], this.vals[2]]; }
}

class Practice03ABasicFunctions_6 extends SubtopicBase {
  genCode(): string { return `${this.funs[1]}(${this.vars[3]})`; }
  genOptions(): Answer[] { return [this.vars[2], this.vals[2], this.vars[3], this.vals[3], 0n, this.funs[1], this.vals[2][1], this.vals[2][0], this.vals[2]]; }
}

class Practice03ABasicFunctions_7 extends SubtopicBase {
  genCode(): string { return `${this.funs[0]}(${this.funs[0]}(0))`; }
  genOptions(): Answer[] { return range(1n, 12n); }
}

class Practice03ABasicFunctions_8 extends SubtopicBase {
  genCode(): string { return `${this.funs[0]}(${this.funs[0]}(${this.vars[0]}))`; }
  genOptions(): Answer[] { return range(1n, 15n); }
}

class Practice03ABasicFunctions_9 extends SubtopicBase {
  genCode(): string { return `${this.funs[0]}(len(${this.funs[1]}(${this.vars[2]})))`; }
  genOptions(): Answer[] { return [...range(1n, 12n), this.vars[2], this.vals[2], this.vars[3], this.vals[3], 0n, this.funs[0], this.funs[1]]; }
}

class Practice03ABasicFunctions_10 extends SubtopicBase {
  genCode(): string { return `str(${this.funs[0]}(${this.vars[0]})) + ${this.funs[1]}(${this.vars[3]})`; }
  genOptions(): Answer[] { return [
    ...this.vars, ...this.vals, 0n, this.funs[0], this.funs[1],
    `3${this.vals[2][0]}`, `3${this.vals[2][1]}`,
    `4${this.vals[2][0]}`, `4${this.vals[2][1]}`,
    `5${this.vals[2][0]}`, `5${this.vals[2][1]}`,
    `6${this.vals[2][0]}`, `6${this.vals[2][1]}`,
    `7${this.vals[2][0]}`, `7${this.vals[2][1]}`,
    `8${this.vals[2][0]}`, `8${this.vals[2][1]}`,
    `9${this.vals[2][0]}`, `9${this.vals[2][1]}`,
    `10${this.vals[2][0]}`, `10${this.vals[2][1]}`,
  ]; }
}

class Practice03ABasicFunctions_11 extends SubtopicBase {
  genCode(): string { return `${this.funs[0]}(${this.vars[2]}) + len(${this.funs[1]}(${this.vars[3]}))`; }
  genOptions(): Answer[] { return range(0n, 15n); }
}

class Practice03ABasicFunctions_12 extends SubtopicBase {
  genCode(): string { return `${this.funs[2]}(${this.vars[0]}, ${this.vars[1]})`; }
  genOptions(): Answer[] { return range(0n, 20n); }
}

class Practice03ABasicFunctions_13 extends SubtopicBase {
  genCode(): string { return `${this.funs[2]}(${this.vars[1]}), ${this.vars[0]})`; }
  genOptions(): Answer[] { return range(0n, 20n); }
}

class Practice03ABasicFunctions_14 extends SubtopicBase {
  genCode(): string { return `${this.funs[2]}(len(${this.vars[2]}), len(${this.vars[3]}))`; }
  genOptions(): Answer[] { return range(0n, 20n); }
}

export const PRACTICE_03A_BASIC_FUNCTIONS: Topic = new Practice03ABasicFunctions();
