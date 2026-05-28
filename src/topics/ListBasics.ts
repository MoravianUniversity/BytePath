import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext } from '../topics';
import { randInt, randInts, randIntNum, randChoice, randChoices, randVariable, randVars, STRINGS, randFloats, shuffle, range } from '../util';
import { toPyAtom, toPyStr } from '../python';
import { BASIC_VARIABLES } from './BasicVariables';
import { STRING_CONCAT } from './StringConcat';
import { STRING_LENGTH } from './StringLength';
import { STRING_INDEX } from './StringIndexing';

export class ListOfIntLength extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const list = randInts(1n, 10n, randIntNum(3, 5));
    return createQuestion(`
      ${x} = ${toPyAtom(list)}
      len(${x})`, range(0n, 6n), {}, ctx);
  }
}

export class ListOfIntIndex1 extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const list = randInts(1n, 10n, randIntNum(3, 5));
    return createQuestion(`
      ${x} = ${toPyAtom(list)}
      ${x}[1]`, [...list], {}, ctx);
  }
}

export class ListOfIntIndexNeg1 extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const list = randInts(1n, 10n, randIntNum(3, 5));
    return createQuestion(`
      ${x} = ${toPyAtom(list)}
      ${x}[-1]`, [...list], {}, ctx);
  }
}

export class ListOfIntIndex0 extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const list = randInts(1n, 10n, randIntNum(3, 5));
    return createQuestion(`
      ${x} = ${toPyAtom(list)}
      ${x}[0]`, [...list], {}, ctx);
  }
}

export class ListOfStrLength extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const list = randChoices(STRINGS, randIntNum(3, 5));
    const lengths = list.map(s => BigInt(s.length));
    return createQuestion(`
      ${x} = ${toPyAtom(list)}
      len(${x})`, [...range(0n, 6n), ...lengths, BigInt(lengths.reduce((a, b) => a + b, 0n))], {}, ctx);
  }
}

export class ListOfStrIndex0 extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const list = randChoices(STRINGS, randIntNum(3, 5));
    return createQuestion(`
      ${x} = ${toPyAtom(list)}
      ${x}[0]`, [...list, ...list[0], ...list[1]], {}, ctx);
  }
}

export class ListOfStrIndex extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const list = randChoices(STRINGS, randIntNum(3, 5));
    const i = randIntNum(1, list.length - 1);
    return createQuestion(`
      ${x} = ${toPyAtom(list)}
      ${x}[${i}]`, [...list, ...list[i]], {}, ctx);
  }
}

export class ListOfStrVarIndex extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const list = randChoices(STRINGS, randIntNum(3, 5));
    const i = randIntNum(1, list.length - 1);
    return createQuestion(`
      ${x} = ${toPyAtom(list)}
      ${y} = ${i}
      ${x}[${y}]`, [y, i, ...list, ...list[i]], {}, ctx);
  }
}

export class ListConcat extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y, z] = randVars(3);
    const list1 = randInts(1n, 10n, randIntNum(2, 4));
    const list2 = randChoices(STRINGS, randIntNum(2, 4));
    return createQuestion(`
      ${x} = ${toPyAtom(list1)}
      ${y} = ${toPyAtom(list2)}
      ${z} = ${x} + ${y}
      ${z}`, [list1, list2, [...list2,...list1]], {}, ctx);
  }
}

export class ListIndexSet extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const list = randInts(1n, 10n, randIntNum(3, 5));
    const i = randIntNum(1, list.length - 1);
    let value = randInt(1n, 10n);
    while (list.includes(value)) { value = randInt(1n, 10n); }
    return createQuestion(`
      ${x} = ${toPyAtom(list)}
      ${x}[${i}] = ${value}
      ${x}`, [list, list.map((v, index) => index === i-1 ? value : v), list.map((v, index) => index === i+1 ? value : v)], {}, ctx);
  }
}

export class ListAppend extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const list = randInts(1n, 10n, randIntNum(2, 4));
    const value = randChoice(STRINGS);
    return createQuestion(`
      ${x} = ${toPyAtom(list)}
      ${x}.append(${toPyStr(value)})
      ${x}`, [list, [...list, value], [value, ...list], [...list.slice(0, -1), value]], {}, ctx);
  }
}

function badLists(list: any[]): string[] {
  return [list.join(', '), list.join(' '), list.join(''), '[' + list.join(', ') + ']'];
}

function getAllPairs(list1: any[], list2: any[]) {
  const pairs = [];
  for (let i = 0; i < list1.length; i++) {
    for (let j = 0; j < list2.length; j++) {
      pairs.push(list1[i] + " " + list2[j]);
    }
  }
  return pairs;
}

export class PrintList extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const list = [...randInts(1n, 10n, randIntNum(1, 2)), ...randFloats(1, 2, randIntNum(1, 2))];
    return createQuestion(`
      ${x} = ${toPyAtom(list)}
      print(${x})
    `, badLists(list), {}, ctx);
  }
}

export class PrintListWithStr extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b] = randChoices(STRINGS, 2);
    let list: any[] = [b, ...randInts(1n, 10n, randIntNum(1, 2)), ...randFloats(1, 2, randIntNum(1, 2))];
    list = [Symbol(y), ...shuffle(list)];
    const listWithVar = list.map((x) => typeof x === 'symbol' ? x.description : x);
    return createQuestion(`
      ${y} = ${toPyStr(a)}
      ${x} = ${toPyAtom(list)}
      print(${x}[0], ${x})
    `, getAllPairs([toPyStr(a), x[0]], badLists(listWithVar)), {}, ctx);
  }
}

export const LIST_BASICS = new Topic('list-basics', "List Basics", [
  new ListOfIntLength(),
  new ListOfIntIndex1(),
  new ListOfIntIndexNeg1(),
  new ListOfIntIndex0(),
  new ListOfStrLength(),
  new ListOfStrIndex0(),
  new ListOfStrIndex(),
  new ListOfStrVarIndex(),
  new ListConcat(),
  new ListIndexSet(),
  new ListAppend(),
  new PrintList(),
  new PrintListWithStr(),
], [BASIC_VARIABLES, STRING_CONCAT, STRING_LENGTH, STRING_INDEX]);