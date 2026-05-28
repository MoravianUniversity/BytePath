import { Topic, Answer, createQuestion, EvalLastLineSubtopic, GenerateContext } from '../topics';
import { randInt, randIntNum, range, randVars, randChoice, randChoices, STRINGS } from '../util';
import { PRACTICE_03A_FUNCTIONS } from './03a - Functions';
import dedent from 'dedent-js';

// Example code:
// x = 2
// a = 'dog'
// b ​= "yak"
// def waldo(b):
//     return len(b) / 2
// def carmen(a, b):
//     return a[0] + b[1]

// Example Questions:
// len(a)
// b[x]
// len(a + b) 
// waldo("a")
// waldo("star")
// waldo(a)
// waldo(b)
// carmen("a", "bx")
// carmen(a, b)
// carmen(b, a)
// carmen(a, carmen(a, b))
// carmen(carmen(a, b), a)
// waldo(carmen(b, a))

function createVarsVals(): [string[], [bigint, string, string]] {
  const [var1, var2, var3] = randVars(3);
  const [val2, val3] = randChoices(STRINGS, 2);
  const val1 = randInt(1n, BigInt(Math.min(val2.length, val3.length)));
  return [[var1, var2, var3], [val1, val2, val3]];
}
function createCode(vars: string[], vals: [bigint, string, string]): string {
  const [var1, var2, var3] = vars;
  const [val1, val2, val3] = vals;
  return dedent`
    ${var1} = ${val1}
    ${var2} = "${val2}"
    ${var3} = '${val3}'
    def waldo(${var3}):
        return len(${var3}) / 2
    def carmen(${var1}, ${var2}):
        return ${var1}[0] + ${var2}[1]
  `;
}

class Func3AExtra extends Topic {
  vars: string[];
  vals: [bigint, string, string];
  constructor() {
    const [vars, vals] = createVarsVals();
    const code = createCode(vars, vals);
    super('practice-03a-functions-extra', '03a More Functions', [
      new Func3AExtra_1(vars, vals, code),
      new Func3AExtra_2(vars, vals, code),
      new Func3AExtra_3(vars, vals, code),
      new Func3AExtra_4(vars, vals, code),
      new Func3AExtra_5(vars, vals, code),
      new Func3AExtra_6(vars, vals, code),
      new Func3AExtra_7(vars, vals, code),
      new Func3AExtra_8(vars, vals, code),
      new Func3AExtra_9(vars, vals, code),
      new Func3AExtra_10(vars, vals, code),
      new Func3AExtra_11(vars, vals, code),
      new Func3AExtra_12(vars, vals, code),
    ], [PRACTICE_03A_FUNCTIONS], {order: 'sequential', sharedCode: code});
    this.vars = vars;
    this.vals = vals;
  }

  start(): void {
    const [vars, vals] = createVarsVals();
    this.vars.splice(0, this.vars.length, ...vars);
    this.vals.splice(0, this.vals.length, ...vals);
    this.sharedCode = createCode(vars, vals);
    for (const subtopic of this.subtopics) {
      if (subtopic instanceof Func3AExtraBase) {
        subtopic.sharedCode = this.sharedCode;
      }
    }
  }
}

abstract class Func3AExtraBase extends EvalLastLineSubtopic {
  vars: string[];
  vals: [bigint, string, string];
  sharedCode: string;
  constructor(vars: string[], vals: [bigint, string, string], sharedCode: string) { super(); this.vars = vars; this.vals = vals; this.sharedCode = sharedCode; }
  generateQuestion(ctx: GenerateContext) {
    const code = this.genCode();
    const opts = this.genOptions();
    return createQuestion(code, opts, {sharedCode: this.sharedCode}, ctx);
  }
  abstract genCode(): string
  abstract genOptions(): Answer[]
}


class Func3AExtra_1 extends Func3AExtraBase {
  genCode(): string { return `len(${this.vars[randIntNum(1, 2)]})`; }
  genOptions(): Answer[] { return [0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n]; }
} 

class Func3AExtra_2 extends Func3AExtraBase {
  genCode(): string { return `${this.vars[randIntNum(1, 2)]}[${this.vars[0]}]`; }
  genOptions(): Answer[] { return [...this.vals[1], ...this.vals[2]]; }
}

class Func3AExtra_3 extends Func3AExtraBase {
  genCode(): string {
    const [var1, var2] = randChoices(this.vars.slice(1), 2);
    return `len(${var1} + ${var2})`;
  }
  genOptions(): Answer[] { return [0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n, 11n, 12n, 13n, 14n, 15n]; }
}

class Func3AExtra_4 extends Func3AExtraBase {
  genCode(): string { return `waldo("${this.vars[randIntNum(1, 2)]}")`; }
  genOptions(): Answer[] { return [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 0n, 1n, 2n, 3n, 4n, 5n]; }
}

class Func3AExtra_5 extends Func3AExtraBase {
  genCode(): string { return `waldo("${randChoice(STRINGS)}")`; }
  genOptions(): Answer[] { return [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 0n, 1n, 2n, 3n, 4n, 5n]; }
}

class Func3AExtra_6 extends Func3AExtraBase {
  genCode(): string { return `waldo(${this.vars[randIntNum(1, 2)]})`; }
  genOptions(): Answer[] { return [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 0n, 1n, 2n, 3n, 4n, 5n]; }
}

class Func3AExtra_7 extends Func3AExtraBase {
  genCode(): string { return `carmen("${this.vars[1]}", "${this.vars[2]}${this.vars[0]}")`; }
  genOptions(): Answer[] { return [
    `"${this.vars[1]}${this.vars[2]}${this.vars[0]}"`,
    `"${this.vars[0]}${this.vars[1]}${this.vars[2]}"`,
    `"${this.vars[2]}${this.vars[0]}${this.vars[1]}"`,
    `"${this.vars[2]}${this.vars[1]}${this.vars[0]}"`,
    `"${this.vars[1]}${this.vars[0]}${this.vars[2]}"`,
    `"${this.vars[0]}${this.vars[2]}${this.vars[1]}"`,
    `"${this.vars[2]}${this.vars[1]}${this.vars[0]}"`,
    `"${this.vars[1]}${this.vars[0]}${this.vars[2]}"`,
    `"${this.vars[0]}${this.vars[2]}${this.vars[1]}"`,
    `"${this.vals[1][0]}${this.vals[2][1]}"`,
    `"${this.vals[2][0]}${this.vals[1][1]}"`,
  ]; }
}

class Func3AExtra_8 extends Func3AExtraBase {
  genCode(): string { return `carmen(${this.vars[1]}, ${this.vars[2]})`; }
  genOptions(): Answer[] { return [
    `"${this.vars[1]}${this.vars[2]}"`,
    `"${this.vars[2]}${this.vars[1]}"`,
    `"${this.vals[2]}${this.vals[1]}"`,
    `"${this.vals[1][0]}${this.vals[2][1]}"`,
    `"${this.vals[2][0]}${this.vals[1][1]}"`,
    `"${this.vals[1][1]}${this.vals[2][2]}"`,
    `"${this.vals[2][1]}${this.vals[1][2]}"`,
    `"${this.vals[1][1]}${this.vals[2][0]}"`,
    `"${this.vals[2][1]}${this.vals[1][0]}"`,
  ]; }
}

class Func3AExtra_9 extends Func3AExtraBase {
  genCode(): string { return `carmen(${this.vars[2]}, ${this.vars[1]})`; }
  genOptions(): Answer[] { return [
    `"${this.vars[1]}${this.vars[2]}"`,
    `"${this.vars[2]}${this.vars[1]}"`,
    `"${this.vals[2]}${this.vals[1]}"`,
    `"${this.vals[1][0]}${this.vals[2][1]}"`,
    `"${this.vals[2][0]}${this.vals[1][1]}"`,
    `"${this.vals[1][1]}${this.vals[2][2]}"`,
    `"${this.vals[2][1]}${this.vals[1][2]}"`,
    `"${this.vals[1][1]}${this.vals[2][0]}"`,
    `"${this.vals[2][1]}${this.vals[1][0]}"`,
  ]; }
}

class Func3AExtra_10 extends Func3AExtraBase {
  genCode(): string { return `carmen(${this.vars[1]}, carmen(${this.vars[1]}, ${this.vars[2]}))`; }
  genOptions(): Answer[] { return [
    `"${this.vars[1]}${this.vars[1]}${this.vars[2]}"`,
    `"${this.vars[2]}${this.vars[2]}${this.vars[1]}"`,
    `"${this.vals[2]}${this.vals[1]}${this.vals[1]}"`,
    `"${this.vars[1]}${this.vars[2]}${this.vars[2]}"`,
    `"${this.vals[1][0]}${this.vals[1][1]}${this.vals[2][1]}"`,
    `"${this.vals[2][0]}${this.vals[1][1]}${this.vals[2][1]}"`,
    `"${this.vals[1][1]}${this.vals[2][2]}${this.vals[1][2]}"`,
    `"${this.vals[2][1]}${this.vals[1][2]}${this.vals[2][2]}"`,
    `"${this.vals[1][1]}${this.vals[2][0]}${this.vals[1][0]}"`,
    `"${this.vals[2][1]}${this.vals[1][0]}${this.vals[2][0]}"`,
  ]; }
}

class Func3AExtra_11 extends Func3AExtraBase {
  genCode(): string { return `carmen(carmen(${this.vars[1]}, ${this.vars[2]}), ${this.vars[1]})`; }
  genOptions(): Answer[] { return [
    `"${this.vars[1]}${this.vars[1]}${this.vars[2]}"`,
    `"${this.vars[2]}${this.vars[2]}${this.vars[1]}"`,
    `"${this.vals[2]}${this.vals[1]}${this.vals[1]}"`,
    `"${this.vars[1]}${this.vars[2]}${this.vars[2]}"`,
    `"${this.vals[1][0]}${this.vals[1][1]}${this.vals[2][1]}"`,
    `"${this.vals[2][0]}${this.vals[1][1]}${this.vals[2][1]}"`,
    `"${this.vals[1][1]}${this.vals[2][2]}${this.vals[1][2]}"`,
    `"${this.vals[2][1]}${this.vals[1][2]}${this.vals[2][2]}"`,
    `"${this.vals[1][1]}${this.vals[2][0]}${this.vals[1][0]}"`,
    `"${this.vals[2][1]}${this.vals[1][0]}${this.vals[2][0]}"`,
  ]; }
}

class Func3AExtra_12 extends Func3AExtraBase {
  genCode(): string { return `waldo(carmen(${this.vars[2]}, ${this.vars[1]}))`; }
  genOptions(): Answer[] { return [
    range(0n, 5n),
    `"${this.vars[1]}${this.vars[2]}"`,
    `"${this.vars[2]}${this.vars[1]}"`,
    `"${this.vals[2]}${this.vals[1]}"`,
  ]; }
}

export const PRACTICE_03A_FUNCTIONS_EXTRA = new Func3AExtra();
