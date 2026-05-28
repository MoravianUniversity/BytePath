import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext } from '../topics';
import { randInt, randInts, randIntNum, randChoice, randChoices, randVariable, randVars, STRINGS, range } from '../util';
import { toPyAtom, toPyStr } from '../python';
import { LIST_BASICS } from './ListBasics';

export class TupleOfIntLength extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const list = Object.freeze(randInts(1n, 10n, randIntNum(3, 5)));
    return createQuestion(`
      ${x} = ${toPyAtom(list)}
      len(${x})`, range(0n, 6n), {}, ctx);
  }
}

export class TupleOfIntIndex extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const list = Object.freeze(randInts(1n, 10n, randIntNum(3, 5)));
    const i = randIntNum(1, list.length - 1);
    return createQuestion(`
      ${x} = ${toPyAtom(list)}
      ${x}[${i}]`, [...list], {}, ctx);
  }
}

export class TupleOfStrLength extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const list = Object.freeze(randChoices(STRINGS, randIntNum(3, 5)));
    const lengths = list.map(s => BigInt(s.length));
    return createQuestion(`
      ${x} = ${toPyAtom(list)}
      len(${x})`, [...range(0n, 6n), ...lengths, BigInt(lengths.reduce((a, b) => a + b, 0n))], {}, ctx);
  }
}

export class TupleOfStrIndex extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const list = Object.freeze(randChoices(STRINGS, randIntNum(3, 5)));
    const i = randIntNum(1, list.length - 1);
    return createQuestion(`
      ${x} = ${toPyAtom(list)}
      ${x}[${i}]`, [...list, ...list[i]], {}, ctx);
  }
}

export class TupleConcat extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y, z] = randVars(3);
    const list1 = Object.freeze(randInts(1n, 10n, randIntNum(2, 4)));
    const list2 = Object.freeze(randChoices(STRINGS, randIntNum(2, 4)));
    return createQuestion(`
      ${x} = ${toPyAtom(list1)}
      ${y} = ${toPyAtom(list2)}
      ${z} = ${x} + ${y}
      ${z}`, [
        list1, [...list1], list2, [...list2], [...list1,...list2],
      ], {}, ctx);
  }
}

export class TupleIndexSet extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const list = Object.freeze(randInts(1n, 10n, randIntNum(3, 5)));
    const i = randIntNum(1, list.length - 1);
    let value = randInt(1n, 10n);
    while (list.includes(value)) { value = randInt(1n, 10n); }
    return createQuestion(`
      ${x} = ${toPyAtom(list)}
      ${x}[${i}] = ${value}
      ${x}`, [
        list,
        list.map((v, index) => index === i ? value : v),
        Object.freeze(list.map((v, index) => index === i ? value : v)),
      ], {}, ctx);
  }
}

export class TupleAppend extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const list = Object.freeze(randInts(1n, 10n, randIntNum(2, 4)));
    const value = randChoice(STRINGS);
    return createQuestion(`
      ${x} = ${toPyAtom(list)}
      ${x}.append(${toPyStr(value)})
      ${x}`, [list, [...list, value], Object.freeze([...list, value])], {}, ctx);
  }
}

export const TUPLES = new Topic('tuples', "Tuples", [
   new TupleOfIntLength(),
   new TupleOfIntIndex(),
   new TupleOfStrLength(),
   new TupleOfStrIndex(),
   new TupleConcat(),
   new TupleIndexSet(),
   new TupleAppend(),
], [LIST_BASICS]);