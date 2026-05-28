import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext } from '../topics';
import { randInts, randIntNum, randChoices, randVars, range, shuffle, randBool, ASCII_LOWER, ASCII_UPPER } from '../util';
import { toPyStr, toPyAtom } from '../python.ts';

import { DICT_BASICS } from './DictionaryBasics';
import { DICT_WITH_LOOPS } from './DictionaryWithLoops';
import dedent from 'dedent-js';

const ANIMALS = ["cat", "dog", "bird", "fish", "snake", "duck", "cow", "pig"]


function createVarsVals(): [string[], [bigint, bigint], [string, string]] {
  const [var1, var2, var3, var4] = randVars(4);
  let [int1, int2] = randInts(2n, 5n, 2);
  if (int1 > int2) { [int1, int2] = [int2, int1]; }
  const [str1, str2] = randChoices(ANIMALS, 2);
  return [[var1, var2, var3, var4], [int1, int2], [str1, str2]];
}
function createCode(vars: string[], ints: [bigint, bigint], strs: [string, string]): string {
  const [var1, var2, var3, var4] = vars;
  const [int1, int2] = ints;
  const [str1, str2] = strs;
  return dedent`
    ${var1} = ${int1}
    ${var2} = ${int2}
    ${var3} = ${toPyStr(str1)}
    ${var4} = {${toPyStr(var1)}: (${int1}, ${int2}), ${int1}: ${toPyStr(str2)}, ${var2}: ${toPyStr(str1)}, ${var3}: ${int1}}
  `;
}

class DictMastery extends Topic {
  vars: string[];
  ints: [bigint, bigint];
  strs: [string, string];
  constructor() {
    const [vars, ints, strs] = createVarsVals();
    const code = createCode(vars, ints, strs);
    super('dict-mastery', 'Dict Mastery', [
      new DictMastery_1(vars, ints, strs, code),
      new DictMastery_2(vars, ints, strs, code),
      new DictMastery_3(vars, ints, strs, code),
      new DictMastery_4(vars, ints, strs, code),
      new DictMastery_5(vars, ints, strs, code),
      new DictMastery_6(vars, ints, strs, code),
      new DictMastery_7(vars, ints, strs, code),
      new DictMastery_8(vars, ints, strs, code),
      new DictMastery_Long(),
    ], [DICT_BASICS, DICT_WITH_LOOPS],
    {order: 'sequential', sharedCode: code, forceQuiz: true});
    this.vars = vars;
    this.ints = ints;
    this.strs = strs;
  }

  start(): void {
    const [vars, ints, strs] = createVarsVals();
    this.vars.splice(0, this.vars.length, ...vars);
    this.ints.splice(0, this.ints.length, ...ints);
    this.strs.splice(0, this.strs.length, ...strs);
    this.sharedCode = createCode(vars, ints, strs);
    for (const subtopic of this.subtopics) {
      if (subtopic instanceof DictMasteryBase) {
        subtopic.sharedCode = this.sharedCode;
      }
    }
  }
}

abstract class DictMasteryBase extends EvalLastLineSubtopic {
  vars: string[];
  ints: [bigint, bigint];
  strs: [string, string];
  sharedCode: string;
  constructor(vars: string[], ints: [bigint, bigint], strs: [string, string], sharedCode: string) {
    super(); this.vars = vars; this.ints = ints; this.strs = strs; this.sharedCode = sharedCode;
  }
  generateQuestion(ctx: GenerateContext) {
    const code = this.genCode();
    return createQuestion(code, [], {sharedCode: this.sharedCode}, ctx);
  }
  abstract genCode(): string
}

class DictMastery_1 extends DictMasteryBase {
  genCode(): string { return `len(${this.vars[3]})`; }
}
class DictMastery_2 extends DictMasteryBase {
  genCode(): string { return `${this.vars[3]}[toPyStr(${this.vars[0]})]`; }
}
class DictMastery_3 extends DictMasteryBase {
  genCode(): string { return `${this.vars[3]}[${this.vars[0]}]`; }
}
class DictMastery_4 extends DictMasteryBase {
  genCode(): string { return `${this.vars[3]}[${this.ints[0]}]`; }
}
class DictMastery_5 extends DictMasteryBase {
  genCode(): string { return `${this.vars[1]} in ${this.vars[3]}`; }
}
class DictMastery_6 extends DictMasteryBase {
  genCode(): string { return `${toPyStr(this.vars[1])} in ${this.vars[3]}`; }
}
class DictMastery_7 extends DictMasteryBase {
  genCode(): string { return `${this.vars[2]} in ${this.vars[3]}`; }
}
class DictMastery_8 extends DictMasteryBase {
  genCode(): string { return `${toPyStr(this.strs[0])} in ${this.vars[3]}`; }
}

function sample_with_repeats<T>(data: T[],
  min_uniq: number, max_uniq: number,
  min_repeat: number, max_repeat: number): T[]
{
  data = randChoices(data, randIntNum(min_uniq, max_uniq));
  max_repeat = Math.min(max_repeat, data.length);
  const repeats = new Array(100).fill(data).flat();
  return shuffle([...data, ...randChoices(repeats, randIntNum(min_repeat, max_repeat), false)]);
}

class DictMastery_Long extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [var1, var2, i] = randVars(3);
    const elem1 = `${var1}[${i}]`;
    const elem2 = `${var2}[${i}]`;
    const style = 0; //randIntNum(0, 2);
    let data: string | bigint[] | Map<string, bigint|string>;
    let init: bigint | string;
    let init0: bigint | string;
    let add: string;
    if (style === 0) {
      // Counting - source is a string or list of ints
      if (randBool()) {
        data = sample_with_repeats(ASCII_LOWER, 3, 5, 1, 3).join("");  // 4 to 8
      } else {
        data = sample_with_repeats(range(0n, 9n), 2, 4, 1, 3);
      }
      init = 1n;
      init0 = 0n;
      add = " += 1";
    } else {
      // doesn't work yet
      let empty: string | bigint;
      let keyData: string[] | bigint[];
      if (randBool()) {
        keyData = ASCII_LOWER;
        empty = "";
      } else {
        keyData = range(0n, 9n);
        empty = 0n;
      }

      const values = sample_with_repeats<bigint|string>(keyData, 3, 5, 1, 3);
      const keys = randChoices(ASCII_UPPER, values.length);
      data = new Map();
      for (let i = 0; i < keys.length; i++) {
        data.set(keys[i], values[i]);
      }

      if (style === 1) {
        init = elem1;
        init0 = toPyAtom(empty);
        add = ` += ${elem1}`;
      } else {
        init = `[${elem1}]`;
        init0 = "[]";
        add = `append(${elem1}`;
      }
    }

    let code: string;
    if (randBool()) {
      code = `if ${i} in ${var2}:\n        ${elem2}${add}\n    else:\n        ${elem2} = ${init}`;
    } else {
      code = `if ${i} not in ${var2}:\n        ${elem2} = ${init0}\n    ${elem2}${add}`;
    }

    //data = textwrap.fill(repr(data), width=20, subsequent_indent="     ");
    code = `${var1} = ${toPyAtom(data)}
${var2} = {}
for ${i} in ${var1}:
    ${code}
${var2}`;
    return createQuestion(code, [], {}, ctx);
  }
}

export const DICT_MASTERY = new DictMastery();
