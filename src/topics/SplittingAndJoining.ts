import { Topic, EvalLastLineSubtopic, EvalLastLineQuestionGen } from '../topics';
import { randChoice, randChoices, randIntNum, randInts, randVariable, randVars, STRINGS } from "../util";
import { toPyStr } from "../python";
import { BASIC_ARITHMETIC } from "./BasicArithmetic";
import { BASIC_VARIABLES } from "./BasicVariables";
import { STRING_CONCAT } from "./StringConcat";
import { STRING_LENGTH } from "./StringLength";

const PHRASES = [
  "Quick brown fox jumps over the lazy dog.",
  "There's a JERTAIN in the CURTAIN.",
  "I talk to the ZELF up on the SHELF.",
  "There's a NINK in the SINK.",
  "That YOTTLE In the BOTTLE!",
  "I like the ZABLE on the TABLE.",
  "But the BOFA on the SOFA...",
];

export class StringSplit extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const s = randChoice(PHRASES);
    return { code: `
      s = ${toPyStr(s)}
      s.split()`,
      options: [s.split(' ').join(''), s.split(' ').join(',')],
    };
  }
}

export class StringSplitLen extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const s = randChoice(PHRASES);
    const n = BigInt(s.split(' ').length);
    return { code: `
      s = ${toPyStr(s)}
      len(s.split())`,
      options: [BigInt(s.split(' ').join('').length), BigInt(s.split(' ').join(',').length), BigInt(s.length), n, n-1n, n+1n],
    };
  }
}

export class StringSplitChar extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    let s = randChoice(PHRASES);
    let c = randChoice([...s]);
    while (c === ' ' || s.split(c).length <= 3) {
      s = randChoice(PHRASES);
      c = randChoice([...s]);
    }
    return { code: `
      s = ${toPyStr(s)}
      s.split('${c}')`,
      options: [s.split(c).join(''), s.split(c).join(','), c],
    };
  }
}

export class StringSplitCharLen extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    let s = randChoice(PHRASES);
    let c = randChoice([...s]);
    let n = s.split(c).length;
    while (c === ' ' || n <= 3) {
      s = randChoice(PHRASES);
      c = randChoice([...s]);
      n = s.split(c).length;
    }
    return { code: `
      s = ${toPyStr(s)}
      len(s.split('${c}'))`,
      options: [BigInt(s.length), BigInt(s.split(c).join('').length), BigInt(n), BigInt(n-1), BigInt(n+1)],
    };
  }
}

export class StringSplitVars extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const [x, y] = randVars(2);
    const [a, b] = randInts(1n, 9n, 2);
    const str = `${a},${b}`;
    return { code: `
      ${x}, ${y} = ${toPyStr(str)}.split(',')
      ${x} + ${y}`,
      options: [a+b, a, b, str, `${a}${b}`, `${b}${a}`, `${x}${y}`, `${y}${x}`],
    };
  }
}

const SYMBOLS = ['-', ',', '~', '_', '+'];

export class StringJoinList extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const sym = randChoice(SYMBOLS);
    const strs = randChoices(STRINGS, randIntNum(3, 5));
    const quoted = strs.map(s => `"${s}"`);
    const list = "[" + quoted.join(', ') + "]";
    return {
      code: `${toPyStr(sym)}.join(${list})`,
      options: [strs.join(sym), strs.join(''), strs, quoted.join(sym), quoted.join(''), quoted],
    };
  }
}

export class StringJoinStr extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const sym = randChoice(SYMBOLS);
    const str = randChoice(STRINGS);
    const chars = [...str];
    return {
      code: `${toPyStr(sym)}.join(${toPyStr(str)})`,
      options: [chars.join(sym), chars.join(''), chars],
    };
  }
}

export class StringSplitJoin extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const s = randChoice(PHRASES);
    return { code: `
      ${x} = ${toPyStr(s)}
      ${toPyStr('')}.join(${x}.split())`,
      options: [s.split('').join(''), s.split(' ').join(','), s, s.split(' ')],
    };
  }
}

export class StringSplitJoinSym extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const s = randChoice(PHRASES);
    const sym = randChoice(SYMBOLS);
    return { code: `
      ${x} = ${toPyStr(s)}
      ${toPyStr(sym)}.join(${x}.split())`,
      options: [s.split('').join(sym), s.split(' ').join(sym), s, s.split(' ')],
    };
  }
}

export const SPLITTING_AND_JOINING: Topic = new Topic('splitting-and-joining', 'Splitting and Joining', [
  new StringSplit(),
  new StringSplitLen(),
  new StringSplitChar(),
  new StringSplitCharLen(),
  new StringSplitVars(),
  new StringJoinList(),
  new StringJoinStr(),
  new StringSplitJoin(),
  new StringSplitJoinSym(),
], [BASIC_ARITHMETIC, BASIC_VARIABLES, STRING_CONCAT, STRING_LENGTH]);
