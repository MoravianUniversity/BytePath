import { Topic, EvalLastLineSubtopic, EvalLastLineQuestionGen } from '../topics';
import { randChoice, randChoices, randVariable, STRINGS } from '../util';
import { STRING_CONCAT } from './StringConcat';

export class StringLen extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const a = randChoice(STRINGS);
    return {
      code: `len("${a}")`,
      options: [
        BigInt(a.length + 1),
        BigInt(a.length + 2),
        BigInt(a.length - 1),
        BigInt(a.length - 2),
      ],
    };
  }
}

export class StringLenMulti extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const [a, b] = randChoices(STRINGS, 2);
    return {
      code: `len("${a}") + len("${b}")`,
      options: [
        BigInt(a.length),
        BigInt(b.length),
        BigInt(a.length + b.length + 1),
        BigInt(a.length + b.length - 1),
      ],
    };
  }
}

export class StringLenMultiConcat extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const [a, b] = randChoices(STRINGS, 2);
    return {
      code: `len("${a}" + "${b}")`,
      options: [
        BigInt(a.length),
        BigInt(b.length),
        BigInt(a.length + b.length + 1),
        BigInt(a.length + b.length - 1),
      ],
    };
  }
}

export class StringLenVar extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const a = randChoice(STRINGS);
    return { code: `
        ${x} = "${a}"
        len(${x})
      `,
      options: [
        BigInt(a.length),
        BigInt(x.length),
        BigInt(a.length + 1),
        BigInt(a.length - 1),
      ],
    };
  }
}

export class StringLenMultiVar extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const [a, b] = randChoices(STRINGS, 2);
    return { code: `
        ${x} = "${a}"
        len(${x}) + len("${b}")
      `,
      options: [
        BigInt(a.length),
        BigInt(b.length),
        BigInt(x.length),
        BigInt(a.length + b.length + 1),
        BigInt(a.length + b.length - 1),
      ],
    };
  }
}

export class StringLenMultiVarConcat extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const [a, b] = randChoices(STRINGS, 2);
    return { code: `
        ${x} = "${a}"
        len("${b}" + ${x})
      `,
      options: [
        BigInt(a.length),
        BigInt(b.length),
        BigInt(x.length),
        BigInt(a.length + b.length + 1),
        BigInt(a.length + b.length - 1),
      ],
    };
  }
}

export const STRING_LENGTH: Topic = new Topic('string-length', 'String Length', [
  new StringLen(),
  new StringLenMulti(),
  new StringLenMultiConcat(),
  new StringLenVar(),
  new StringLenMultiVar(),
  new StringLenMultiVarConcat(),
], [STRING_CONCAT]);
