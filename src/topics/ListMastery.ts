import { Topic, EvalLastLineSubtopic, CodeOutputSubtopic, TopicContext } from '../topics';
import { randChoice, randChoices, randVars, randInt, randInts, randIntNum, randBool, shuffle } from '../util';
import { toPyStr, toPyAtom } from '../python';
import dedent from 'dedent-js';
import { MEMBERSHIP_OPERATORS } from './MembershipOperator';
import { LIST_BASICS } from './ListBasics';
import { LIST_SLICING } from './ListSlicing';

const ANIMALS = ["cat", "dog", "bird", "fish", "frog", "snake", "turtle", "duck", "cow", "pig"]

class ListMasteryContext extends TopicContext {
  var1: string;
  var2: string;
  var3: string;
  int: bigint;
  str: string;
  list: string[];
  start: bigint;
  stop: bigint;
  constructor() {
    super();
    const [var1, var2, var3] = randVars(3);
    const list_len = randIntNum(4, 7);
    const int = randInt(2n, BigInt(list_len));
    const str = randChoice(ANIMALS);
    const list = randChoices(ANIMALS, list_len);
    let [start, stop] = randInts(1n, BigInt(list_len - 2), 2);
    if (start > stop) { [start, stop] = [stop, start]; }
    this.var1 = var1;
    this.var2 = var2;
    this.var3 = var3;
    this.int = int;
    this.str = str;
    this.list = list;
    this.start = start;
    this.stop = stop;
    this.sharedCode = dedent`
      ${var1} = ${this.int}
      ${var2} = ${toPyStr(this.str)}
      ${var3} = ${toPyAtom(this.list)}
    `;
  }
}

class ListMastery_1 extends EvalLastLineSubtopic {
  gen(ctx: ListMasteryContext): string { return `${ctx.var3}[1]`; }
}
class ListMastery_2 extends EvalLastLineSubtopic {
  gen(ctx: ListMasteryContext): string { return `${ctx.var3}[-1]`; }
}
class ListMastery_3 extends EvalLastLineSubtopic {
  gen(ctx: ListMasteryContext): string { return `${ctx.var3}[${ctx.var1}]`; }
}
class ListMastery_4 extends EvalLastLineSubtopic {
  gen(ctx: ListMasteryContext): string { return `${ctx.var3}[${ctx.start}:${ctx.stop}]`; }
}
class ListMastery_5 extends EvalLastLineSubtopic {
  gen(ctx: ListMasteryContext): string { return `${ctx.var3}[:${ctx.start}] + ${ctx.var3}[${ctx.stop}:]`; }
}
class ListMastery_6 extends EvalLastLineSubtopic {
  gen(ctx: ListMasteryContext): string { return `len(${ctx.var3})`; }
}
class ListMastery_7 extends EvalLastLineSubtopic {
  gen(ctx: ListMasteryContext): string { return `len(${ctx.var3}[${randInt(1n, BigInt(ctx.list.length-1))}]))`; }
}
class ListMastery_8 extends EvalLastLineSubtopic {
  gen(ctx: ListMasteryContext): string { return `${ctx.var2} ${randChoice(["not ", ""])}in ${ctx.var3}`; }
}
class ListMastery_9 extends EvalLastLineSubtopic {
  gen(ctx: ListMasteryContext): string {
    const ch = randChoice([...ctx.list.slice(0, 2).join("")]);
    return `${toPyAtom(ch)} ${randChoice(["not ", ""])}in ${ctx.var3}`;
  }
}
class ListMastery_10 extends EvalLastLineSubtopic {
  gen(ctx: ListMasteryContext): string {
    const ch = randChoice([...ctx.list.slice(1, 3).join("")]);
    return `${toPyAtom(ch)} in ${ctx.var3}[${randInt(1n, 3n)}]`;
  }
}

class ListMastery_Long extends CodeOutputSubtopic {
  gen(): string {
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
    return code;
  }
}

export const LIST_MASTERY = new Topic('list-mastery', 'List Mastery', [
  new ListMastery_1(),
  new ListMastery_2(),
  new ListMastery_3(),
  new ListMastery_4(),
  new ListMastery_5(),
  new ListMastery_6(),
  new ListMastery_7(),
  new ListMastery_8(),
  new ListMastery_9(),
  new ListMastery_10(),
  new ListMastery_Long(),
], [LIST_BASICS, MEMBERSHIP_OPERATORS, LIST_SLICING],
{order: 'sequential', forceQuiz: true, generateContext: () => new ListMasteryContext()});
