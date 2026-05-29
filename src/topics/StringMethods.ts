import { Topic, EvalLastLineSubtopic, EvalLastLineQuestionGen } from '../topics';
import { randChoice, randIntNum, randIntsNum, randVariable, STRINGS, capitalize } from "../util";
import { toPyStr, createException } from "../python";
import { BASIC_VARIABLES } from "./BasicVariables";

export class StringLower extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const a = capitalize(randChoice(STRINGS));
    return { code: `
        ${x} = ${toPyStr(a)}
        ${x}.lower()
      `,
      options: [a, capitalize(a), a.toLowerCase(), a.toUpperCase(), x, x.toLowerCase(), x.toUpperCase(), `${x}.lower()`, `${a}.lower()`],
    };
  }
}

export class StringUpper extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const a = capitalize(randChoice(STRINGS));
    return { code: `
        ${x} = ${toPyStr(a)}
        ${x}.upper()
      `,
      options: [a, capitalize(a), a.toLowerCase(), a.toUpperCase(), x, x.toLowerCase(), x.toUpperCase(), `${x}.upper()`, `${a}.upper()`],
    };
  }
}

export class StringStrip extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const a = `  ${randChoice(STRINGS)} ${randChoice(STRINGS)}   `;
    return { code: `
        ${x} = ${toPyStr(a)}
        ${x}.strip()
      `,
      options: [a, a.replaceAll(' ', ''), a.trimStart(), a.trimEnd(), a.trim()],
    };
  }
}

export class StringReplace extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const a = randChoice(STRINGS);
    let b = randChoice([...a]);
    let c = randVariable();
    while (a.includes(c)) { c = randVariable(); }
    return { code: `
        ${x} = ${toPyStr(a)}
        ${x}.replace(${toPyStr(b)}, ${toPyStr(c)})
      `,
      options: [a, b, c, a.replace(b, c), ''],
    };
  }
}

export class StringReplaceNothing extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const a = randChoice(STRINGS);
    let b = randVariable();
    while (a.includes(b)) { b = randVariable(); }
    let c = randChoice([...a]);
    return { code: `
        ${x} = ${toPyStr(a)}
        ${x}.replace(${toPyStr(b)}, ${toPyStr(c)})
      `,
      options: [a, b, c, ''],
    };
  }
}

export class StringUpperReplace extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const a = randChoice(STRINGS);
    let b = randChoice([...a.toUpperCase()]);
    let c = randVariable();
    while (a.includes(c)) { c = randVariable(); }
    return { code: `
        ${x} = ${toPyStr(a)}
        ${x}.upper().replace(${toPyStr(b)}, ${toPyStr(c)})
      `,
      options: [a, b, c, a.replace(b, c).toUpperCase(), a.replace(b.toLowerCase(), c).toUpperCase(), a.toUpperCase().replace(b, c), ''],
    };
  }
}

export class StringReplaceUpper extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const a = randChoice(STRINGS);
    let b = randChoice([...a.toUpperCase()]);
    let c = randVariable();
    while (a.includes(c)) { c = randVariable(); }
    return { code: `
        ${x} = ${toPyStr(a)}
        ${x}.replace(${toPyStr(b)}, ${toPyStr(c)}).upper()
      `,
      options: [a, b, c, a.replace(b, c).toUpperCase(), a.replace(b.toLowerCase(), c).toUpperCase(), a.toUpperCase().replace(b, c), ''],
    };
  }
}

export class StringFind extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const a = randChoice(STRINGS);
    let b = randChoice([...a]);
    return { code: `
        ${x} = ${toPyStr(a)}
        ${x}.find(${toPyStr(b)})
      `,
      options: [x, a, b, BigInt(a.indexOf(b)), BigInt(a.indexOf(b) + 1), BigInt(a.indexOf(b) - 1)],
    };
  }
}

export class StringFindSub extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const a = randChoice(STRINGS);
    const i = randIntNum(0, a.length - 2);
    const b = a.slice(i, i + 2);
    return { code: `
        ${x} = ${toPyStr(a)}
        ${x}.find(${toPyStr(b)})
      `,
      options: [x, a, b, BigInt(a.indexOf(b)), BigInt(a.indexOf(b) + 1), BigInt(a.indexOf(b) - 1)],
    };
  }
}

export class StringFindMissing extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const a = randChoice(STRINGS);
    let b = randVariable();
    while (a.includes(b)) { b = randVariable(); }
    return { code: `
        ${x} = ${toPyStr(a)}
        ${x}.find(${toPyStr(b)})
      `,
      options: [x, a, b, '', null, 0n, -1n, createException('ValueError', 'substring not found')],
    };
  }
}

export class StringIndex extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const a = randChoice(STRINGS);
    let b = randChoice([...a]);
    return { code: `
        ${x} = ${toPyStr(a)}
        ${x}.index(${toPyStr(b)})
      `,
      options: [x, a, b, BigInt(a.indexOf(b)), BigInt(a.indexOf(b) + 1), BigInt(a.indexOf(b) - 1)],
    };
  }
}

export class StringIndexMissing extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const a = randChoice(STRINGS);
    let b = randVariable();
    while (a.includes(b)) { b = randVariable(); }
    return { code: `
        ${x} = ${toPyStr(a)}
        ${x}.index(${toPyStr(b)})
      `,
      options: [x, a, b, '', null, 0n, -1n, createException('ValueError', 'substring not found')],
    };
  }
}

export class StringIsDigit extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const a = randChoice(STRINGS);
    return { code: `
        ${x} = ${toPyStr(a)}
        ${x}.isdigit()
      `,
      options: [a, true, false, ''],
    };
  }
}

export class StringIsDigit2 extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const a = randIntsNum(0, 9, 4).join('');
    return { code: `
        ${x} = ${toPyStr(a)}
        ${x}.isdigit()
      `,
      options: [a, true, false, ''],
    };
  }
}

export class StringIsDigit3 extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const a = "-" + randIntsNum(0, 9, 4).join('');
    return { code: `
        ${x} = ${toPyStr(a)}
        ${x}.isdigit()
      `,
      options: [a, a.slice(1), true, false, '-'],
    };
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