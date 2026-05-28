import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext } from '../topics';
import { randInts, randVariable, randIntNum, range } from "../util";
import { toPyAtom } from "../python";
import { LIST_BASICS } from "./ListBasics";

function makeNestedLists(length: number = randIntNum(3, 5)): any[] {
  const lists = randInts(1n, 10n, length);
  return lists.map(() => randInts(1n, 10n, randIntNum(2, 5)));
}

export class ListNestingLen extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const lists = makeNestedLists();
    const lengths = lists.map(list => BigInt(list.length));
    const lengthsNum = lengths.map(length => Number(length));
    const total = lengths.reduce((a, b) => a+b, 0n);
    return createQuestion(`${x} = ${toPyAtom(lists, true)}
len(${x})`, [...lengths, total, total + 1n, total + BigInt(lists.length), BigInt(Math.max(...lengthsNum)), BigInt(Math.min(...lengthsNum))], {}, ctx);
  }
}

export class ListNestingLenNoPretty extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const lists = makeNestedLists(2);
    const lengths = lists.map(list => BigInt(list.length));
    const lengthsNum = lengths.map(length => Number(length));
    const total = lengths.reduce((a, b) => a+b, 0n);
    return createQuestion(`${x} = ${toPyAtom(lists)}\nlen(${x})`,
      [...lengths, total, total + 1n, total + BigInt(lists.length), BigInt(Math.max(...lengthsNum)), BigInt(Math.min(...lengthsNum))], {}, ctx);
  }
}

export class ListNestingIndex extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const lists = makeNestedLists();
    const i = randIntNum(1, lists.length-1);
    return createQuestion(`${x} = ${toPyAtom(lists, true)}\n${x}[${i}]`,
      [lists[i][0], lists[0][i], lists[i][i], lists[i-1], lists[i+1], lists.slice(i, i+1), lists.slice(i-1, i)], {}, ctx);
  }
}

export class ListNestingIndexNoPretty extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const lists = makeNestedLists(2);
    const i = randIntNum(0, 1);
    return createQuestion(`${x} = ${toPyAtom(lists)}\n${x}[${i}]`,
      [lists[i][0], lists[0][i], lists[i][i], lists[i-1], lists[i+1], lists.slice(i, i+1), lists.slice(i-1, i)], {}, ctx);
  }
}

export class ListNestingIndexLength extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const lists = makeNestedLists();
    const i = randIntNum(0, lists.length-1);
    return createQuestion(`${x} = ${toPyAtom(lists, true)}\nlen(${x}[${i}])`, range(0n, 6n), {}, ctx);
  }
}

export class ListNestingIndexLengthNoPretty extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const lists = makeNestedLists(2);
    const i = randIntNum(0, lists.length-1);
    return createQuestion(`${x} = ${toPyAtom(lists)}\nlen(${x}[${i}])`, range(0n, 6n), {}, ctx);
  }
}


export class ListNestingIndexNested extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const lists = makeNestedLists();
    const i = randIntNum(0, lists.length-1);
    const j = randIntNum(0, lists[i].length-1);
    const flat = lists.flat();
    return createQuestion(`${x} = ${toPyAtom(lists, true)}\n${x}[${i}][${j}]`,
      [
        lists[i][j], lists[i][j-1], lists[i][j+1],
        j < lists.length ? lists[j][i] : [],
        j < lists.length ? lists[j][i-1] : [],
        j < lists.length ? lists[j][i+1] : [],
        j < lists.length ? [lists[i], lists[j]] : [lists[i]],
        j < lists.length ? [lists[j], lists[i]] : [],
        j < lists.length ? [...lists[i], ...lists[j]] : [...lists[i]],
        j < lists.length ? [...lists[j], ...lists[i]] : [],
        [flat[i], flat[j]], [flat[j], flat[i]],
        flat.slice(i, j), flat.slice(j, i),
      ], {}, ctx);
  }
}

export class ListNestingIndexNestedNoPretty extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const lists = makeNestedLists(2);
    const i = randIntNum(0, 1);
    const j = randIntNum(0, lists[i].length-1);
    const flat = lists.flat();
    return createQuestion(`${x} = ${toPyAtom(lists)}\n${x}[${i}][${j}]`,
      [
        lists[i][j], lists[i][j-1], lists[i][j+1],
        j < lists.length ? lists[j][i] : [],
        j < lists.length ? lists[j][i-1] : [],
        j < lists.length ? lists[j][i+1] : [],
        j < lists.length ? [lists[i], lists[j]] : [lists[i]],
        j < lists.length ? [lists[j], lists[i]] : [],
        j < lists.length ? [...lists[i], ...lists[j]] : [...lists[i]],
        j < lists.length ? [...lists[j], ...lists[i]] : [],
        [flat[i], flat[j]], [flat[j], flat[i]],
        flat.slice(i, j), flat.slice(j, i),
      ], {}, ctx);
  }
}

export const LIST_NESTING = new Topic('list-nesting', 'List Nesting', [
  new ListNestingLen(),
  new ListNestingLenNoPretty(),
  new ListNestingIndex(),
  new ListNestingIndexNoPretty(),
  new ListNestingIndexLength(),
  new ListNestingIndexLengthNoPretty(),
  new ListNestingIndexNested(),
  new ListNestingIndexNestedNoPretty(),
], [LIST_BASICS], {order: 'sequential'});
