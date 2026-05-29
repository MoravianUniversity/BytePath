import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext } from '../topics';
import { randInt, randIntNum, randVariable, randChoice } from '../util';
import { BASIC_ARITHMETIC } from './BasicArithmetic';
import { BASIC_VARIABLES } from './BasicVariables';


export class ConvertToIntZero extends EvalLastLineSubtopic {
    readonly help = [
        {
            afterFailedAttempts: 2,
            message: 'When converting to an integer, the decimal point and everything after it is dropped.',
        },
    ];
    generateQuestion(ctx: GenerateContext) {
      const x = randVariable();
      const a = randIntNum(1, 8);
      return createQuestion(`
        ${x} = ${a}.0
        int(${x})
      `, [a, Math.floor(a), Math.ceil(a), BigInt(Math.floor(a)), BigInt(Math.ceil(a))], {}, ctx);
    }
  }

export class ConvertToInt extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'When converting to an integer, the decimal point and everything after it is dropped.',
    },
  ];
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = randIntNum(1, 5) + randChoice([0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95]);
    return createQuestion(`
      ${x} = ${a}
      int(${x})
    `, [a, Math.floor(a), Math.ceil(a), BigInt(Math.floor(a)), BigInt(Math.ceil(a))], {}, ctx);
  }
}

export class ConvertToFloatWithHint extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'A float is a number with a decimal point, even if it is 0.',
    },
  ];
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = randInt(1n, 8n);
    return createQuestion(`
      ${x} = ${a}
      # hint: a float is a number with a decimal point
      float(${x})
    `, [a, Number(a)], {}, ctx);
  }
}

export class ConvertToFloat extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'A float is a number with a decimal point, even if it is 0.',
    },
  ];
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = randInt(1n, 8n);
    return createQuestion(`
      ${x} = ${a}
      float(${x})
    `, [a, Number(a)], {}, ctx);
  }
}

export class RoundWithBigFraction extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'The round() function rounds to the nearest integer.',
    },
  ];
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = randIntNum(1, 5) + randChoice([0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95]);
    return createQuestion(`
      ${x} = ${a}
      round(${x})
    `, [a, Math.floor(a), Math.ceil(a), BigInt(Math.floor(a)), BigInt(Math.ceil(a))], {}, ctx);
  }
}

export class RoundWithSmallFraction extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'The round() function rounds to the nearest integer.',
    },
  ];
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = randIntNum(1, 5) + randChoice([0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45]);
    return createQuestion(`
      ${x} = ${a}
      round(${x})
    `, [a, Math.floor(a), Math.ceil(a), BigInt(Math.floor(a)), BigInt(Math.ceil(a))], {}, ctx);
  }
}

export class RoundWithZeroFraction extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = randIntNum(1, 5);
    return createQuestion(`
      ${x} = ${a}.0
      round(${x})
    `, [a, BigInt(a)], {}, ctx);
  }
}

export const CONVERTING_AND_ROUNDING = new Topic('converting-and-rounding', 'Converting and Rounding', [
  new ConvertToIntZero(),
  new ConvertToInt(),
  new ConvertToFloatWithHint(),
  new ConvertToFloat(),
  new RoundWithBigFraction(),
  new RoundWithSmallFraction(),
  new RoundWithZeroFraction(),
], [BASIC_ARITHMETIC, BASIC_VARIABLES], {order: 'sequential'});
