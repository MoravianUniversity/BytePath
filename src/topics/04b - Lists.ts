import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext } from '../topics';
import { randChoice, randVars, randVariable, randIntNum, STRINGS, maybeNot, range, randChoices } from '../util';
import { toPyStr, toPyAtom } from '../python';
import { BASIC_PRINTS } from './BasicPrints';
import { CharNotInList, MEMBERSHIP_OPERATORS, StringInList, StringNotInList, randListAndString } from './MembershipOperator';
import { LIST_BASICS, ListOfIntIndexNeg1, ListOfStrLength, ListOfStrIndex, ListOfStrVarIndex, PrintListWithStr, ListAppend, ListIndexSet } from './ListBasics';
import { LIST_SLICING, ListSlicingToVar } from './ListSlicing';
import { TUPLES } from './Tuples';

export class ConcatSlices extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = randChoices(STRINGS, randIntNum(5, 8));
    const i = randIntNum(1, a.length - 1);
    const j = randIntNum(i+2, a.length - 2);
    return createQuestion(`
      ${x} = ${toPyAtom(a)}
      ${x}[:${i}] + ${x}[${j}:]`, [
        a, a.slice(0, i), a.slice(j), [...a.slice(0, i), ...a.slice(j)],
        [...a.slice(0, i+1), ...a.slice(j)], [...a.slice(0, i), ...a.slice(j+1)],
      ], {}, ctx);
  }
}

export class LengthOfListItem extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const [a, item] = randListAndString();
    const i = a.indexOf(item);
    return createQuestion(`
      ${x} = ${toPyAtom(a)}
      len(${x}[${i}])`, range(0n, 8n), {}, ctx);
  }
}

export class LengthOfListItemConcat extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, item] = randListAndString();
    const str = randChoice(STRINGS);
    const i = a.indexOf(item);
    return createQuestion(`
      ${x} = ${toPyAtom(a)}
      ${y} = ${toPyStr(str)}
      len(${x}[${i}]+${y})`, range(0n, 10n), {}, ctx);
  }
}

export class CharInListItem extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const [a, item] = randListAndString();
    const i = a.indexOf(item);
    const char = item[0];
    return createQuestion(`
      ${x} = ${toPyAtom(a)}
      ${toPyAtom(char)} ${maybeNot()}in ${x}[${i}]`, [true, false], {}, ctx);
  }
}


export const PRACTICE_04B_LISTS: Topic = new Topic('practice-04b-lists', '04b Lists', [
  new ListOfStrLength(),
  new ListOfStrIndex(),
  new ListOfStrVarIndex(),
  new ListOfIntIndexNeg1(),
  new ListSlicingToVar(),
  new ConcatSlices(),
  new LengthOfListItem(),
  new LengthOfListItemConcat(),
  new StringInList(),
  new StringNotInList(),
  new CharNotInList(),
  new CharInListItem(),
  new ListIndexSet(),
  new ListAppend(),
  new PrintListWithStr(),
], [BASIC_PRINTS, MEMBERSHIP_OPERATORS, LIST_BASICS, LIST_SLICING, TUPLES], {order: 'random'});
