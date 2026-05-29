import { Topic, EvalLastLineSubtopic, EvalLastLineQuestionGen } from '../topics';
import { randChoice, randChoices, randIntNum, shuffle, STRINGS, capitalize } from "../util";
import { toPyStr } from "../python";
import { BASIC_RELATIONAL_OPERATORS } from "./BasicRelationalOperators";
import { MEMBERSHIP_OPERATORS } from "./MembershipOperator";

export class StringEqualsFalse extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const [a, b] = randChoices(STRINGS, 2);
    return { code: `${toPyStr(a)} == ${toPyStr(b)}`, options: [true, false] };
  }
}

export class StringEqualsTrue extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const a = randChoice(STRINGS);
    return { code: `"${a}" == '${a}'`, options: [true, false] };
  }
}

export class StringEqualsCapitalized extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const a = randChoice(STRINGS);
    return { code: `"${a}" == '${capitalize(a)}'`, options: [true, false] };
  }
}

export class StringLessThanFalse extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    let [a, b] = randChoices(STRINGS, 2);
    while (a <= b) { [a, b] = randChoices(STRINGS, 2); }
    return { code: `${toPyStr(a)} < ${toPyStr(b)}`, options: [true, false] };
  }
}

export class StringLessThanTrue extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    let [a, b] = randChoices(STRINGS, 2);
    while (a >= b) { [a, b] = randChoices(STRINGS, 2); }
    return { code: `${toPyStr(a)} < ${toPyStr(b)}`, options: [true, false] };
  }
}

export class StringLessThanLonger extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    let a = randChoice(STRINGS);
    return { code: `${toPyStr(a)} <= ${toPyStr(a + 's')}`, options: [true, false] };
  }
}

export class StringLessThanCapitalized extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const a = randChoice(STRINGS);
    return { code: `${toPyStr(a)} < ${toPyStr(capitalize(a))}`, options: [true, false] };
  }
}

export class StringLessThanOtherCaps extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    let [a, b] = randChoices(STRINGS, 2);
    while (a >= b) { [a, b] = randChoices(STRINGS, 2); }
    return { code: `${toPyStr(a)} < ${toPyStr(capitalize(b))}`, options: [true, false] };
  }
}

export class StringLessThanBothCapsTrue extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    let [a, b] = randChoices(STRINGS, 2);
    while (a >= b) { [a, b] = randChoices(STRINGS, 2); }
    return { code: `${toPyStr(capitalize(a))} < ${toPyStr(capitalize(b))}`, options: [true, false] };
  }
}

export class StringLessThanBothCapsFalse extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    let [a, b] = randChoices(STRINGS, 2);
    while (a <= b) { [a, b] = randChoices(STRINGS, 2); }
    return { code: `${toPyStr(capitalize(a))} < ${toPyStr(capitalize(b))}`, options: [true, false] };
  }
}

export class StringLessThanOtherCapsTrue extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    let [a, b] = randChoices(STRINGS, 2);
    while (a >= b) { [a, b] = randChoices(STRINGS, 2); }
    return { code: `${toPyStr(a)} < ${toPyStr(capitalize(b))}`, options: [true, false] };
  }
}

export class StringCharMembershipTrue extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const a = randChoice(STRINGS);
    const b = randChoice([...a]);
    return { code: `${toPyStr(b)} in ${toPyStr(a)}`, options: [true, false] };
  }
}

export class StringCharMembershipFalse extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const a = randChoice(STRINGS);
    const b = randChoice([...a]);
    return { code: `${toPyStr(capitalize(b))} in ${toPyStr(a)}`, options: [true, false] };
  }
}

export class StringMembershipTrue extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const a = randChoice(STRINGS);
    const i = randIntNum(0, a.length - 3);
    const b = a.slice(i, i + 3);
    return { code: `${toPyStr(b)} in ${toPyStr(a)}`, options: [true, false] };
  }
}

export class StringMembershipFalse extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const a = randChoice(STRINGS);
    const i = randIntNum(0, a.length - 3);
    let b = a.slice(i, i + 3);
    while (a.includes(b)) { b = shuffle(b.split('')).join(''); }
    return { code: `${toPyStr(b)} in ${toPyStr(a)}`, options: [true, false] };
  }
}

export const STRING_COMPARISONS: Topic = new Topic('string-comparisons', 'String Comparisons', [
  new StringEqualsFalse(),
  new StringEqualsTrue(),
  new StringEqualsCapitalized(),
  new StringLessThanFalse(),
  new StringLessThanTrue(),
  new StringLessThanLonger(),
  new StringLessThanCapitalized(),
  new StringLessThanOtherCapsTrue(),
  new StringLessThanBothCapsTrue(),
  new StringLessThanBothCapsFalse(),
  new StringMembershipTrue(),
  new StringMembershipFalse(),
  new StringCharMembershipTrue(),
  new StringCharMembershipFalse(),
], [BASIC_RELATIONAL_OPERATORS, MEMBERSHIP_OPERATORS]);
