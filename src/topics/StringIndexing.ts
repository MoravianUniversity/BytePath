import { Topic, EvalLastLineSubtopic, EvalLastLineQuestionGen } from '../topics';
import { randChoice, randChoices, randVariable, randVars, randIntNum, randIntsNum, randInt, STRINGS } from '../util';
import { STRING_CONCAT } from './StringConcat';

export class StringIndex0 extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const a = randChoice(STRINGS);
    return { code: `
        ${x} = "${a}"
        ${x}[0]
      `,
      options: [
        a, x,
        `${x}[0]`,
        `${x}0`,
        `${a}0`,
        `${a}[0]`,
        a[1], a[2],
      ],
    };
  }
}

export class StringIndex1 extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const a = randChoice(STRINGS);
    return { code: `
        ${x} = "${a}"
        ${x}[1]
      `,
      options: [
        a, x,
        `${x}[1]`,
        `${x}1`,
        `${a}1`,
        `${a}[1]`,
        a[0], a[2],
      ],
    };
  }
}

export class StringIndexN extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    let a = randChoice(STRINGS);
    while (a.length < 4) { a = randChoice(STRINGS); }
    const i = randIntNum(2, a.length - 2);
    return { code: `
        ${x} = "${a}"
        ${x}[${i}]
      `, options: [
        a, x,
        `${x}[${i}]`,
        `${x}${i}`,
        `${a}${i}`,
        `${a}[${i}]`,
        a[0], a[i - 1], a[i + 1],
      ],
    };
  }
}

export class StringIndexConcat extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const [x, y] = randVars(2);
    let [a, b] = randChoices(STRINGS, 2);
    while (a.length < 4 || b.length < 4) {
      [a, b] = randChoices(STRINGS, 2);
    }
    const [i, j] = randIntsNum(0, Math.min(a.length, b.length) - 2, 2);
    return { code: `
        ${x} = "${a}"
        ${y} = "${b}"
        ${x}[${i}] + ${y}[${j}]
      `,
      options: [
        a, b, a+b, x, y, x+y,
        a[j] + b[i], a[i+1] + b[j+1],
      ],
    };
  }
}

export class StringIndexPostConcat extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const [x, y, z] = randVars(3);
    let [a, b] = randChoices(STRINGS, 2);
    const i = randIntNum(0, a.length + b.length - 2);
    return { code: `
        ${x} = "${a}"
        ${y} = "${b}"
        ${z} = ${x} + ${y}
        ${z}[${i}]
      `,
      options: [
        a, b, a+b, x, y, z, x+y,
        a[i], b[i], a[i+1], b[i+1],
        (a + b)[i+1], (a + b)[i-1],
      ],
    };
  }
}

export class StringIndexVar extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const [x, y] = randVars(2);
    const a = randChoice(STRINGS);
    const i = randInt(0n, BigInt(a.length - 1));
    return {
      code: `
        ${x} = "${a}"
        ${y} = ${i}
        ${x}[${y}]
      `,
      options: [a, x, y, i],
    };
  }
}

export const STRING_INDEX: Topic = new Topic('string-index', 'String Indexing', [
    new StringIndex1(),
    new StringIndex1(),
    new StringIndex0(),
    new StringIndexN(),
    new StringIndexConcat(),
    new StringIndexPostConcat(),
    new StringIndexVar(),
    new StringIndexVar(),
    new StringIndex0(),
], [STRING_CONCAT]);
