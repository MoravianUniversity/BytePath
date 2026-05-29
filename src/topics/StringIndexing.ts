import { CodeWriteQuestion } from '../questions/types';
import { Topic, EvalLastLineSubtopic, EvalLastLineQuestionGen, CodeWriteSubtopic, CodeWriteQuestionGen } from '../topics';
import { randChoice, randChoices, randVariable, randVars, randIntNum, randIntsNum, randInt, STRINGS } from '../util';
import { STRING_CONCAT } from './StringConcat';

export class StringIndex0 extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 1,
      message: '`[]` is used to get a single character from a string, starting at index 0 (the first character).',
    },
  ];
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
  readonly help = [
    {
      afterFailedAttempts: 1,
      message: '`[]` is used to get a single character from a string, starting at index 0 (the first character).',
    },
  ];
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
  readonly help = [
    {
      afterFailedAttempts: 1,
      message: '`[]` is used to get a single character from a string, starting at index 0 (the first character).',
    },
  ];
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
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'Each `[]` is getting a single character from a string, so concatenate those characters together.',
    },
  ];
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
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'Concatenate the strings first, then get the character at the given index.',
    },
  ];
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
  readonly help = [
    {
      afterFailedAttempts: 1,
      message: 'The index can be a variable (or even math!), make sure to use the actual value.',
    },
  ];
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
      options: [a, x, y, i, a[Number(i)], a[Number(i)+1], a[Number(i)-1]],
    };
  }
}

export class StringIndexVarPlus1 extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 1,
      message: 'The index can be a variable (or even math!), make sure to use the actual value.',
    },
  ];
  gen(): EvalLastLineQuestionGen {
    const [x, y] = randVars(2);
    const a = randChoice(STRINGS);
    const i = randInt(0n, BigInt(a.length - 2));
    return {
      code: `
        ${x} = "${a}"
        ${y} = ${i}
        ${x}[${y} + 1]
      `,
      options: [a, x, y, i, a[Number(i)], a[Number(i)+1], a[Number(i)-1]],
    };
  }
}

export class StringGetChar extends CodeWriteSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 1,
      message: '`[]` is used to get a single character from a string, starting at index 0 (the first character).',
    },
  ];
  gen(): CodeWriteQuestionGen {
    const x = randVariable();
    const i = randIntNum(0, 3);
    const numberNames = ['first', 'second', 'third', 'fourth'];
    return {
      prompt: `What is the code to get the ${numberNames[i]} character of the string in the variable \`${x}\`?`,
      correct: `${x}[${i}]`,
      options: [
        x, i > 0 ? x.repeat(i) : x, x.repeat(i+1), i > 1 ? x.repeat(i-1) : x,
        `"${x}"`, `"${i > 0 ? x.repeat(i) : x}"`, `"${x.repeat(i+1)}"`, `"${i > 1 ? x.repeat(i-1) : x}"`,
        `${x}[0]`, `${x}[1]`, `${x}[2]`, `${x}[3]`, `${x}[4]`
      ],
      variables: [x],
      testCases: [
        { values: [STRINGS[0]], expected: STRINGS[0][i] },
        { values: [STRINGS[1]], expected: STRINGS[1][i] },
        { values: [STRINGS[2]], expected: STRINGS[2][i] },
      ],
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
    new StringIndexVarPlus1(),
    new StringIndex0(),
    new StringGetChar(),
], [STRING_CONCAT]);
