import { Topic, EvalLastLineSubtopic, CodeOutputSubtopic, EvalLastLineQuestionGen, CodeOutputQuestionGen } from '../topics';
import { randInt, randInts, randIntNum, randChoice, randChoices, randVariable, randVars, STRINGS, randFloats, shuffle, range } from '../util';
import { toPyAtom, toPyStr } from '../python';
import { BASIC_VARIABLES } from './BasicVariables';
import { STRING_CONCAT } from './StringConcat';
import { STRING_LENGTH } from './StringLength';
import { STRING_INDEX } from './StringIndexing';

export class ListOfIntLength extends EvalLastLineSubtopic {
  readonly help = [{afterFailedAttempts: 1, message: 'Remember that the length of a list is the number of elements in the list.'}];
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const list = randInts(1n, 10n, randIntNum(3, 5));
    return { code: `
      ${x} = ${toPyAtom(list)}
      len(${x})`,
      options: range(0n, 6n),
    };
  }
}

export class ListOfIntIndex1 extends EvalLastLineSubtopic {
  readonly help = [{afterFailedAttempts: 1, message: 'Remember that the index of the first element is 0.'}];
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const list = randInts(1n, 10n, randIntNum(3, 5));
    return { code: `
      ${x} = ${toPyAtom(list)}
      ${x}[1]`,
      options: [...list],
    };
  }
}

export class ListOfIntIndexNeg1 extends EvalLastLineSubtopic {
  readonly help = [{afterFailedAttempts: 1, message: 'Remember that the index of the last element of a list is -1.'}];
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const list = randInts(1n, 10n, randIntNum(3, 5));
    return { code: `
      ${x} = ${toPyAtom(list)}
      ${x}[-1]`,
      options: [...list],
    };
  }
}

export class ListOfIntIndex0 extends EvalLastLineSubtopic {
  readonly help = [{afterFailedAttempts: 1, message: 'Remember that the index of the first element is 0.'}];
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const list = randInts(1n, 10n, randIntNum(3, 5));
    return { code: `
      ${x} = ${toPyAtom(list)}
      ${x}[0]`,
      options: [...list],
    };
  }
}

export class ListOfStrLength extends EvalLastLineSubtopic {
  readonly help = [{afterFailedAttempts: 1, message: 'Remember that the length of a list is the number of elements in the list, not the number of characters in the strings in the list.'}];
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const list = randChoices(STRINGS, randIntNum(3, 5));
    const lengths = list.map(s => BigInt(s.length));
    return { code: `
      ${x} = ${toPyAtom(list)}
      len(${x})`,
      options: [...range(0n, 6n), ...lengths, BigInt(lengths.reduce((a, b) => a + b, 0n))],
    };
  }
}

export class ListOfStrIndex0 extends EvalLastLineSubtopic {
  readonly help = [{afterFailedAttempts: 1, message: 'Remember that the index of the first element is 0, and indexing gets the entire element.'}];
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const list = randChoices(STRINGS, randIntNum(3, 5));
    return { code: `
      ${x} = ${toPyAtom(list)}
      ${x}[0]`,
      options: [...list, ...list[0], ...list[1]],
    };
  }
}

export class ListOfStrIndex extends EvalLastLineSubtopic {
  readonly help = [{afterFailedAttempts: 1, message: 'Remember that the index of the first element is 0, and indexing gets the entire element.'}];
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const list = randChoices(STRINGS, randIntNum(3, 5));
    const i = randIntNum(1, list.length - 1);
    return { code: `
      ${x} = ${toPyAtom(list)}
      ${x}[${i}]`,
      options: [...list, ...list[i]],
    };
  }
}

export class ListOfStrVarIndex extends EvalLastLineSubtopic {
  readonly help = [{afterFailedAttempts: 1, message: 'Remember that the index of the first element is 0, and indexing gets the entire element.'}];
  gen(): EvalLastLineQuestionGen {
    const [x, y] = randVars(2);
    const list = randChoices(STRINGS, randIntNum(3, 5));
    const i = randIntNum(1, list.length - 1);
    return { code: `
      ${x} = ${toPyAtom(list)}
      ${y} = ${i}
      ${x}[${y}]`,
      options: [y, i, ...list, ...list[i]],
    };
  }
}

export class ListConcat extends EvalLastLineSubtopic {
  readonly help = [{afterFailedAttempts: 1, message: 'Remember that the concatenation operator (+) concatenates two lists, not two strings.'}];
  gen(): EvalLastLineQuestionGen {
    const [x, y, z] = randVars(3);
    const list1 = randInts(1n, 10n, randIntNum(2, 4));
    const list2 = randChoices(STRINGS, randIntNum(2, 4));
    return { code: `
      ${x} = ${toPyAtom(list1)}
      ${y} = ${toPyAtom(list2)}
      ${z} = ${x} + ${y}
      ${z}`,
      options: [list1, list2, [...list2,...list1]],
    };
  }
}

export class ListIndexSet extends EvalLastLineSubtopic {
  readonly help = [{afterFailedAttempts: 1, message: 'Remember that the index of the first element is 0, and that indexing will replace the entire element.'}];
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const list = randInts(1n, 10n, randIntNum(3, 5));
    const i = randIntNum(1, list.length - 1);
    let value = randInt(1n, 10n);
    while (list.includes(value)) { value = randInt(1n, 10n); }
    return { code: `
      ${x} = ${toPyAtom(list)}
      ${x}[${i}] = ${value}
      ${x}`,
      options: [list, list.map((v, index) => index === i-1 ? value : v), list.map((v, index) => index === i+1 ? value : v)],
    };
  }
}

export class ListAppend extends EvalLastLineSubtopic {
  readonly help = [{ afterFailedAttempts: 1, message: 'The append() method adds a single element to the end of the list.' }];
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const list = randInts(1n, 10n, randIntNum(2, 4));
    const value = randChoice(STRINGS);
    return { code: `
      ${x} = ${toPyAtom(list)}
      ${x}.append(${toPyStr(value)})
      ${x}`,
      options: [list, [...list, value], [value, ...list], [...list.slice(0, -1), value]],
    };
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

export class PrintList extends CodeOutputSubtopic {
  readonly help = [{ afterFailedAttempts: 1, message: 'When printing a list, its contents are printed just as they would be if they were written out in code (including quotes on strings).' }];
  gen(): CodeOutputQuestionGen {
    const x = randVariable();
    const list = [...randInts(1n, 10n, randIntNum(1, 2)), ...randFloats(1, 2, randIntNum(1, 2))];
    return { code: `
      ${x} = ${toPyAtom(list)}
      print(${x})
    `,
      options: badLists(list),
    };
  }
}

export class PrintListWithStr extends CodeOutputSubtopic {
  readonly help = [{ afterFailedAttempts: 1, message: 'When printing a list, its contents are printed just as they would be if they were written out in code (including quotes on strings).' }];
  gen(): CodeOutputQuestionGen {
    const [x, y] = randVars(2);
    const [a, b] = randChoices(STRINGS, 2);
    let list: any[] = [b, ...randInts(1n, 10n, randIntNum(1, 2)), ...randFloats(1, 2, randIntNum(1, 2))];
    list = [Symbol(y), ...shuffle(list)];
    const listWithVar = list.map((x) => typeof x === 'symbol' ? x.description : x);
    return { code: `
      ${y} = ${toPyStr(a)}
      ${x} = ${toPyAtom(list)}
      print(${x}[0], ${x})
    `,
      options: getAllPairs([toPyStr(a), x[0]], badLists(listWithVar)),
    };
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