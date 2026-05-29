import { Topic, EvalLastLineSubtopic, EvalLastLineQuestionGen } from '../topics';
import { randChoice, randVars, randVariable, randIntNum, STRINGS, maybeNot, range, randChoices } from '../util';
import { toPyStr, toPyAtom } from '../python';
import { BASIC_PRINTS } from './BasicPrints';
import { CharNotInList, MEMBERSHIP_OPERATORS, StringInList, StringNotInList, randListAndString } from './MembershipOperator';
import { LIST_BASICS, ListOfIntIndexNeg1, ListOfStrLength, ListOfStrIndex, ListOfStrVarIndex, PrintListWithStr, ListAppend, ListIndexSet } from './ListBasics';
import { LIST_SLICING, ListSlicingToVar } from './ListSlicing';
import { TUPLES } from './Tuples';

export class ConcatSlices extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const a = randChoices(STRINGS, randIntNum(5, 8));
    const i = randIntNum(1, a.length - 1);
    const j = randIntNum(i+2, a.length - 2);
    return {
      code: `
        ${x} = ${toPyAtom(a)}
        ${x}[:${i}] + ${x}[${j}:]
      `,
      options: [
        a, a.slice(0, i), a.slice(j), [...a.slice(0, i), ...a.slice(j)],
        [...a.slice(0, i+1), ...a.slice(j)], [...a.slice(0, i), ...a.slice(j+1)],
      ],
    };
  }
}

export class LengthOfListItem extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const [a, item] = randListAndString();
    const i = a.indexOf(item);
    return {
      code: `
        ${x} = ${toPyAtom(a)}
        len(${x}[${i}])
      `,
      options: range(0n, 8n),
    };
  }
}

export class LengthOfListItemConcat extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const [x, y] = randVars(2);
    const [a, item] = randListAndString();
    const str = randChoice(STRINGS);
    const i = a.indexOf(item);
    return {
      code: `
        ${x} = ${toPyAtom(a)}
        ${y} = ${toPyStr(str)}
        len(${x}[${i}]+${y})
      `,
      options: range(0n, 10n),
    };
  }
}

export class CharInListItem extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const [a, item] = randListAndString();
    const i = a.indexOf(item);
    const char = item[0];
    return {
      code: `
        ${x} = ${toPyAtom(a)}
        ${toPyAtom(char)} ${maybeNot()}in ${x}[${i}]
      `,
      options: [true, false],
    };
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
