import { Topic, EvalLastLineSubtopic, EvalLastLineQuestionGen } from '../topics';
import { randVariable, randChoice, STRINGS, randIntNum, randChoices, range, maybeNot } from '../util';
import { toPyStr, toPyAtom } from '../python';
import { BASIC_ARITHMETIC } from './BasicArithmetic';

function randList(): (string | bigint)[] { return randChoices([...STRINGS, ...range(1n, 10n)], randIntNum(4, 8)); }
export function randListAndString(): [(string | bigint)[], string] {
  let a = randList();
  let item = randChoice(a);
  while (typeof item !== 'string') {
    a = randList();
    item = randChoice(a);
  }
  return [a, item];
}

export class CharInString extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const a = randChoice(STRINGS);
    const char = randChoice([...a]);
    return { code: `
      ${x} = ${toPyStr(a)}
      ${toPyStr(char)} ${maybeNot()}in ${x}`,
      options: [true, false],
    };
  }
}

export class CapitalCharInString extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const a = randChoice(STRINGS);
    const char = randChoice([...a]).toUpperCase();
    return { code: `
      ${x} = ${toPyStr(a)}
      ${toPyStr(char)} ${maybeNot()}in ${x}`,
      options: [true, false],
    };
  }
}

export class SubstringInString extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const a = randChoice(STRINGS);
    const i = randIntNum(0, a.length - 3);
    const sub = a.slice(i, i + 2);
    return { code: `
      ${x} = ${toPyStr(a)}
      ${toPyStr(sub)} ${maybeNot()}in ${x}`,
      options: [true, false],
    };
  }
}

export class SubstringNotInString extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const a = randChoice(STRINGS);
    let [char1, char2] = randChoices([...a], 2);
    while (char1 === char2 || a.includes(char1 + char2)) {
      [char1, char2] = randChoices([...a], 2);
    }
    const sub = char1 + char2;
    return { code: `
      ${x} = ${toPyStr(a)}
      ${toPyStr(sub)} ${maybeNot()}in ${x}`,
      options: [true, false],
    };
  }
}

export class StringInSubstring extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const a = randChoice(STRINGS);
    const i = randIntNum(1, a.length - 3);
    const j = randIntNum(i + 2, a.length - 1);
    const sub = a.slice(i, j);
    return {
      code: `${toPyStr(a)} ${maybeNot()}in ${toPyStr(sub)}`,
      options: [true, false],
    };
  }
}

export class ItemInList extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    let a = randList();
    let item = randChoice(a);
    while (typeof item !== 'number' && typeof item !== 'bigint') {
      a = randList();
      item = randChoice(a);
    }
    return { code: `
      ${x} = ${toPyAtom(a)}
      ${toPyAtom(item)} ${maybeNot()}in ${x}`,
      options: [true, false],
    };
  }
}

export class ItemNotInList extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    let a = randList();
    let item = randChoice(randList());
    while (a.includes(item) || typeof item !== 'number' && typeof item !== 'bigint') {
      a = randList();
      item = randChoice(randList());
    }
    return { code: `
      ${x} = ${toPyAtom(a)}
      ${toPyAtom(item)} ${maybeNot()}in ${x}`,
      options: [true, false],
    };
  }
}

export class StringInList extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    let [a, item] = randListAndString();
    return { code: `
      ${x} = ${toPyAtom(a)}
      ${toPyAtom(item)} ${maybeNot()}in ${x}`,
      options: [true, false],
    };
  }
}

export class StringNotInList extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    let [a, item] = randListAndString();
    item = item[0].toUpperCase() + item.slice(1);
    return { code: `
      ${x} = ${toPyAtom(a)}
      ${toPyAtom(item)} ${maybeNot()}in ${x}`,
      options: [true, false],
    };
  }
}

export class CharNotInList extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const [a, item] = randListAndString();
    const char = item[0];
    return { code: `
      ${x} = ${toPyAtom(a)}
      ${toPyAtom(char)} ${maybeNot()}in ${x}`,
      options: [true, false],
    };
  }
}

export class MembershipBackwards extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const a = randChoices([...range(1n, 10n)], randIntNum(4, 8));
    const item = randChoice(a);
    return { code: `
      ${x} = ${toPyAtom(a)}
      ${x} in ${toPyAtom(item)}`,
      options: [true, false],
    };
  }
}


export const MEMBERSHIP_OPERATORS = new Topic('membership-operators', 'Membership Operators', [
  new CharInString(),
  new CapitalCharInString(),
  new SubstringInString(),
  new SubstringNotInString(),
  new StringInSubstring(),
  new ItemInList(),
  new ItemNotInList(),
  new StringInList(),
  new StringNotInList(),
  new CharNotInList(),
  new MembershipBackwards(),
], [BASIC_ARITHMETIC]);
