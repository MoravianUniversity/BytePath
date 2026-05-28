import { Topic, createQuestion, EvalLastLineSubtopic, CodeOutputSubtopic, GenerateContext } from '../topics';
import { randChoice, randChoices, randVars, randInt, randInts, randIntNum, randBool, shuffle } from '../util';
import { toPyStr, toPyAtom } from '../python';
import dedent from 'dedent-js';
import { MEMBERSHIP_OPERATORS } from './MembershipOperator';
import { LIST_BASICS } from './ListBasics';
import { LIST_SLICING } from './ListSlicing';

const ANIMALS = ["cat", "dog", "bird", "fish", "frog", "snake", "turtle", "duck", "cow", "pig"]

function createVarsVals(): [string[], [bigint, string, string[]], {start: bigint, stop: bigint}] {
  const [var1, var2, var3] = randVars(3);
  const list_len = randIntNum(4, 7);
  const int = randInt(2n, BigInt(list_len));
  const str = randChoice(ANIMALS);
  const list = randChoices(ANIMALS, list_len);
  let [start, stop] = randInts(1n, BigInt(list_len - 2), 2);
  if (start > stop) { [start, stop] = [stop, start]; }
  return [[var1, var2, var3], [int, str, list], {start, stop}];
}
function createCode(vars: string[], vals: [bigint, string, string[]]): string {
  const [var1, var2, var3] = vars;
  const [int, str, list] = vals;
  return dedent`
    ${var1} = ${int}
    ${var2} = ${toPyStr(str)}
    ${var3} = ${toPyAtom(list)}
  `;
}

class ListMastery extends Topic {
  vars: string[];
  vals: [bigint, string, string[]];
  values: {start: bigint, stop: bigint};
  constructor() {
    const [vars, vals, values] = createVarsVals();
    const code = createCode(vars, vals);
    super('list-mastery', 'List Mastery', [
      new ListMastery_1(vars, vals, values, code),
      new ListMastery_2(vars, vals, values, code),
      new ListMastery_3(vars, vals, values, code),
      new ListMastery_4(vars, vals, values, code),
      new ListMastery_5(vars, vals, values, code),
      new ListMastery_6(vars, vals, values, code),
      new ListMastery_7(vars, vals, values, code),
      new ListMastery_8(vars, vals, values, code),
      new ListMastery_9(vars, vals, values, code),
      new ListMastery_10(vars, vals, values, code),
      new ListMastery_Long(),
    ], [LIST_BASICS, MEMBERSHIP_OPERATORS, LIST_SLICING],
    {order: 'sequential', sharedCode: code, forceQuiz: true});
    this.vars = vars;
    this.vals = vals;
    this.values = values;
  }

  start(): void {
    const [vars, vals, values] = createVarsVals();
    this.vars.splice(0, this.vars.length, ...vars);
    this.vals.splice(0, this.vals.length, ...vals);
    this.values.start = values.start;
    this.values.stop = values.stop;
    this.sharedCode = createCode(vars, vals);
    for (const subtopic of this.subtopics) {
      if (subtopic instanceof ListMasteryBase) {
        subtopic.sharedCode = this.sharedCode;
      }
    }
  }
}

abstract class ListMasteryBase extends EvalLastLineSubtopic {
  vars: string[];
  vals: [bigint, string, string[]];
  values: {start: bigint, stop: bigint};
  sharedCode: string;
  constructor(vars: string[], vals: [bigint, string, string[]], values: {start: bigint, stop: bigint}, sharedCode: string) {
    super(); this.vars = vars; this.vals = vals; this.values = values; this.sharedCode = sharedCode;
  }
  generateQuestion(ctx: GenerateContext) {
    const code = this.genCode();
    return createQuestion(code, [], {sharedCode: this.sharedCode}, ctx);
  }
  abstract genCode(): string
}

class ListMastery_1 extends ListMasteryBase {
  genCode(): string { return `${this.vars[2]}[1]`; }
}
class ListMastery_2 extends ListMasteryBase {
  genCode(): string { return `${this.vars[2]}[-1]`; }
}
class ListMastery_3 extends ListMasteryBase {
  genCode(): string { return `${this.vars[2]}[${this.vars[0]}]`; }
}
class ListMastery_4 extends ListMasteryBase {
  genCode(): string { return `${this.vars[2]}[${this.values.start}:${this.values.stop}]`; }
}
class ListMastery_5 extends ListMasteryBase {
  genCode(): string { return `${this.vars[2]}[:${this.values.start}] + ${this.vars[2]}[${this.values.stop}:]`; }
}
class ListMastery_6 extends ListMasteryBase {
  genCode(): string { return `len(${this.vars[2]})`; }
}
class ListMastery_7 extends ListMasteryBase {
  genCode(): string { return `len(${this.vars[2]}[${randInt(1n, BigInt(this.vals[2].length-1))}]))`; }
}
class ListMastery_8 extends ListMasteryBase {
  genCode(): string { return `${this.vars[1]} ${randChoice(["not ", ""])}in ${this.vars[2]}`; }
}
class ListMastery_9 extends ListMasteryBase {
  genCode(): string {
    const ch = randChoice([...this.vals[2].slice(0, 2).join("")]);
    return `${toPyAtom(ch)} ${randChoice(["not ", ""])}in ${this.vars[2]}`; }
}
class ListMastery_10 extends ListMasteryBase {
  genCode(): string {
    const ch = randChoice([...this.vals[2].slice(1, 3).join("")]);
    return `${toPyAtom(ch)} in ${this.vars[2]}[${randInt(1n, 3n)}]`;
  }
}

class ListMastery_Long extends CodeOutputSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [lst_var, item_var, none_var] = randVars(3);
    const alphabet = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
    const list_len = randIntNum(3, 5);
    const lst = randChoices(alphabet, list_len+2);
    const ch1 = lst[0];
    const ch2 = lst[1];
    lst.splice(0, 2);
    const [index1, index2, index3] = randInts(0n, BigInt(list_len+1), 3);
    const lst_repr = lst.map(item => toPyStr(item));
    lst_repr.splice(Number(index3), 0, item_var);
    const option = randIntNum(0, 2);

    let code = `${item_var} = ${toPyStr(ch1)}\n`
    code += `${lst_var} = [${lst_repr.join(", ")}]\n`
    if (option <= 1) {
      code += `${item_var} = ${lst_var}[${index1}]\n`
    }
    if (option >= 1) {
      code += `${lst_var}[${index2}] = ${item_var}\n`
    }
    if (randBool(0.67)) {
      code += `${none_var} = ${lst_var}.append(${toPyStr(ch2)})\n`
    } else {
      code += `${none_var} = ${lst_var}.sort()\n`
    }
    const vars = shuffle([item_var, none_var, lst_var]);
    code += `print(${vars[0]}, ${vars[1]}, ${vars[2]})`
    return createQuestion(code, [], {usesOutput: true}, ctx);
  }
}

export const LIST_MASTERY = new ListMastery();
