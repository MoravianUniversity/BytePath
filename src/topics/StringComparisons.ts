import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext } from '../topics';
import { randChoice, randChoices, randIntNum, shuffle, STRINGS, capitalize } from "../util";
import { toPyStr } from "../python";
import { BASIC_RELATIONAL_OPERATORS } from "./BasicRelationalOperators";
import { MEMBERSHIP_OPERATORS } from "./MembershipOperator";

export class StringEqualsFalse extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [a, b] = randChoices(STRINGS, 2);
    return createQuestion(`${toPyStr(a)} == ${toPyStr(b)}`, [true, false], {}, ctx);
  }
}

export class StringEqualsTrue extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const a = randChoice(STRINGS);
    return createQuestion(`"${a}" == '${a}'`, [true, false], {}, ctx);
  }
}

export class StringEqualsCapitalized extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const a = randChoice(STRINGS);
    return createQuestion(`"${a}" == '${capitalize(a)}'`, [true, false], {}, ctx);
  }
}

export class StringLessThanFalse extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    let [a, b] = randChoices(STRINGS, 2);
    while (a <= b) { [a, b] = randChoices(STRINGS, 2); }
    return createQuestion(`${toPyStr(a)} < ${toPyStr(b)}`, [true, false], {}, ctx);
  }
}

export class StringLessThanTrue extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    let [a, b] = randChoices(STRINGS, 2);
    while (a >= b) { [a, b] = randChoices(STRINGS, 2); }
    return createQuestion(`${toPyStr(a)} < ${toPyStr(b)}`, [true, false], {}, ctx);
  }
}

export class StringLessThanLonger extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    let a = randChoice(STRINGS);
    return createQuestion(`${toPyStr(a)} <= ${toPyStr(a + 's')}`, [true, false], {}, ctx);
  }
}

export class StringLessThanCapitalized extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const a = randChoice(STRINGS);
    return createQuestion(`${toPyStr(a)} < ${toPyStr(capitalize(a))}`, [true, false], {}, ctx);
  }
}

export class StringLessThanOtherCaps extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    let [a, b] = randChoices(STRINGS, 2);
    while (a >= b) { [a, b] = randChoices(STRINGS, 2); }
    return createQuestion(`${toPyStr(a)} < ${toPyStr(capitalize(b))}`, [true, false], {}, ctx);
  }
}

export class StringLessThanBothCapsTrue extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    let [a, b] = randChoices(STRINGS, 2);
    while (a >= b) { [a, b] = randChoices(STRINGS, 2); }
    return createQuestion(`${toPyStr(capitalize(a))} < ${toPyStr(capitalize(b))}`, [true, false], {}, ctx);
  }
}

export class StringLessThanBothCapsFalse extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    let [a, b] = randChoices(STRINGS, 2);
    while (a <= b) { [a, b] = randChoices(STRINGS, 2); }
    return createQuestion(`${toPyStr(capitalize(a))} < ${toPyStr(capitalize(b))}`, [true, false], {}, ctx);
  }
}

export class StringLessThanOtherCapsTrue extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    let [a, b] = randChoices(STRINGS, 2);
    while (a >= b) { [a, b] = randChoices(STRINGS, 2); }
    return createQuestion(`${toPyStr(a)} < ${toPyStr(capitalize(b))}`, [true, false], {}, ctx);
  }
}

export class StringCharMembershipTrue extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const a = randChoice(STRINGS);
    const b = randChoice([...a]);
    return createQuestion(`${toPyStr(b)} in ${toPyStr(a)}`, [true, false], {}, ctx);
  }
}

export class StringCharMembershipFalse extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const a = randChoice(STRINGS);
    const b = randChoice([...a]);
    return createQuestion(`${toPyStr(capitalize(b))} in ${toPyStr(a)}`, [true, false], {}, ctx);
  }
}

export class StringMembershipTrue extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const a = randChoice(STRINGS);
    const i = randIntNum(0, a.length - 3);
    const b = a.slice(i, i + 3);
    return createQuestion(`${toPyStr(b)} in ${toPyStr(a)}`, [true, false], {}, ctx);
  }
}

export class StringMembershipFalse extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const a = randChoice(STRINGS);
    const i = randIntNum(0, a.length - 3);
    let b = a.slice(i, i + 3);
    while (a.includes(b)) { b = shuffle(b.split('')).join(''); }
    return createQuestion(`${toPyStr(b)} in ${toPyStr(a)}`, [true, false], {}, ctx);
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
