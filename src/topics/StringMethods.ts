import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext } from '../topics';
import { randChoice, randIntNum, randIntsNum, randVariable, STRINGS, capitalize } from "../util";
import { toPyStr, createException } from "../python";
import { BASIC_VARIABLES } from "./BasicVariables";

export class StringLower extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = capitalize(randChoice(STRINGS));
    return createQuestion(`
        ${x} = ${toPyStr(a)}
        ${x}.lower()`,
        [a, capitalize(a), a.toLowerCase(), a.toUpperCase(), x, x.toLowerCase(), x.toUpperCase(), `${x}.lower()`, `${a}.lower()`], {}, ctx);
  }
}

export class StringUpper extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = capitalize(randChoice(STRINGS));
    return createQuestion(`
        ${x} = ${toPyStr(a)}
        ${x}.upper()`,
        [a, capitalize(a), a.toLowerCase(), a.toUpperCase(), x, x.toLowerCase(), x.toUpperCase(), `${x}.upper()`, `${a}.upper()`], {}, ctx);
  }
}

export class StringStrip extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = `  ${randChoice(STRINGS)} ${randChoice(STRINGS)}   `;
    return createQuestion(`
        ${x} = ${toPyStr(a)}
        ${x}.strip()`, [a, a.replaceAll(' ', ''), a.trimStart(), a.trimEnd(), a.trim()], {}, ctx);
  }
}

export class StringReplace extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = randChoice(STRINGS);
    let b = randChoice([...a]);
    let c = randVariable();
    while (a.includes(c)) { c = randVariable(); }
    return createQuestion(`
        ${x} = ${toPyStr(a)}
        ${x}.replace(${toPyStr(b)}, ${toPyStr(c)})`,
        [a, b, c, a.replace(b, c), ''], {}, ctx);
  }
}

export class StringReplaceNothing extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = randChoice(STRINGS);
    let b = randVariable();
    while (a.includes(b)) { b = randVariable(); }
    let c = randChoice([...a]);
    return createQuestion(`
        ${x} = ${toPyStr(a)}
        ${x}.replace(${toPyStr(b)}, ${toPyStr(c)})`,
        [a, b, c, ''], {}, ctx);
  }
}

export class StringUpperReplace extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = randChoice(STRINGS);
    let b = randChoice([...a.toUpperCase()]);
    let c = randVariable();
    while (a.includes(c)) { c = randVariable(); }
    return createQuestion(`
        ${x} = ${toPyStr(a)}
        ${x}.upper().replace(${toPyStr(b)}, ${toPyStr(c)})`,
        [a, b, c, a.replace(b, c).toUpperCase(), a.replace(b.toLowerCase(), c).toUpperCase(), a.toUpperCase().replace(b, c), ''], {}, ctx);
  }
}

export class StringReplaceUpper extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = randChoice(STRINGS);
    let b = randChoice([...a.toUpperCase()]);
    let c = randVariable();
    while (a.includes(c)) { c = randVariable(); }
    return createQuestion(`
        ${x} = ${toPyStr(a)}
        ${x}.replace(${toPyStr(b)}, ${toPyStr(c)}).upper()`,
        [a, b, c, a.replace(b, c).toUpperCase(), a.replace(b.toLowerCase(), c).toUpperCase(), a.toUpperCase().replace(b, c), ''], {}, ctx);
  }
}

export class StringFind extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = randChoice(STRINGS);
    let b = randChoice([...a]);
    return createQuestion(`
        ${x} = ${toPyStr(a)}
        ${x}.find(${toPyStr(b)})`,
        [x, a, b, BigInt(a.indexOf(b)), BigInt(a.indexOf(b) + 1), BigInt(a.indexOf(b) - 1)], {}, ctx);
  }
}

export class StringFindSub extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = randChoice(STRINGS);
    const i = randIntNum(0, a.length - 2);
    const b = a.slice(i, i + 2);
    return createQuestion(`
        ${x} = ${toPyStr(a)}
        ${x}.find(${toPyStr(b)})`,
        [x, a, b, BigInt(a.indexOf(b)), BigInt(a.indexOf(b) + 1), BigInt(a.indexOf(b) - 1)], {}, ctx);
  }
}

export class StringFindMissing extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = randChoice(STRINGS);
    let b = randVariable();
    while (a.includes(b)) { b = randVariable(); }
    return createQuestion(`
        ${x} = ${toPyStr(a)}
        ${x}.find(${toPyStr(b)})`,
        [x, a, b, '', null, 0n, -1n, createException('ValueError', 'substring not found')], {}, ctx);
  }
}

export class StringIndex extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = randChoice(STRINGS);
    let b = randChoice([...a]);
    return createQuestion(`
        ${x} = ${toPyStr(a)}
        ${x}.index(${toPyStr(b)})`,
        [x, a, b, BigInt(a.indexOf(b)), BigInt(a.indexOf(b) + 1), BigInt(a.indexOf(b) - 1)], {}, ctx);
  }
}

export class StringIndexMissing extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = randChoice(STRINGS);
    let b = randVariable();
    while (a.includes(b)) { b = randVariable(); }
    return createQuestion(`
        ${x} = ${toPyStr(a)}
        ${x}.index(${toPyStr(b)})`,
        [x, a, b, '', null, 0n, -1n, createException('ValueError', 'substring not found')], {}, ctx);
  }
}

export class StringIsDigit extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = randChoice(STRINGS);
    return createQuestion(`
        ${x} = ${toPyStr(a)}
        ${x}.isdigit()`,
        [a, true, false, ''], {}, ctx);
  }
}

export class StringIsDigit2 extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = randIntsNum(0, 9, 4).join('');
    return createQuestion(`
        ${x} = ${toPyStr(a)}
        ${x}.isdigit()`,
        [a, true, false, ''], {}, ctx);
  }
}

export class StringIsDigit3 extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = "-" + randIntsNum(0, 9, 4).join('');
    return createQuestion(`
        ${x} = ${toPyStr(a)}
        ${x}.isdigit()`,
        [a, a.slice(1), true, false, '-'], {}, ctx);
  }
}

export const STRING_METHODS: Topic = new Topic('string-methods', 'String Methods', [
  new StringLower(),
  new StringUpper(),
  new StringStrip(),
  new StringReplace(),
  new StringReplaceNothing(),
  new StringUpperReplace(),
  new StringReplaceUpper(),
  new StringFind(),
  new StringFindSub(),
  new StringFindMissing(),
  new StringIndex(),
  new StringIndexMissing(),
  new StringIsDigit(),
  new StringIsDigit2(),
  new StringIsDigit3(),
], [BASIC_VARIABLES]);