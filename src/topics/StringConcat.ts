import { Answer, raw, Topic, createQuestion, EvalLastLineSubtopic, GenerateContext } from '../topics';
import { randInt, randInts, randChoice, randChoices, randVars, STRINGS } from '../util';
import { toPyStr } from '../python';
import { BASIC_VARIABLES } from './BasicVariables';

abstract class StringConcatBase extends EvalLastLineSubtopic {
  genQuestion(a: string | bigint, b: string | bigint, ctx: GenerateContext, backwards: boolean = false) {
    const [x, y] = randVars(2);
    const options: Answer[] = [
      a + ' ' + b,
      `${a}${b}`, `${b}${a}`,
      raw(`"${a}""${b}"`), raw(`"${b}""${a}"`),
      raw(`"${a}" "${b}"`), raw(`"${b}" "${a}"`),
      `${x}`, `${y}`, `${x}${y}`, `${y}${x}`,
    ];
    options.push(a);
    options.push(b);
    if (typeof a === 'bigint') {
      options.push(a - 1n);
      options.push(a + 1n);
    }
    if (typeof b === 'bigint') {  
      options.push(b - 1n);
      options.push(b + 1n);
    }
    if (typeof a === 'bigint' && typeof b === 'bigint') {
      options.push(a + b);
      options.push(a - b);
    }
    // if (typeof a === 'string') {
    //   options.push(a[0]);
    //   options.push(a[0] + b);
    // }
    // if (typeof b === 'string') {
    //   options.push(b[0]);
    //   options.push(a + b[0]);
    // }
    if (typeof a === 'string' && typeof b === 'string') {
      options.push(a[0] + b[0]);
    }
    return createQuestion(`
      ${x} = ${toPyStr(a.toString())}
      ${y} = ${toPyStr(b.toString())}
      ${backwards ? y : x} + ${backwards ? x : y}`, options, {}, ctx);
  }
}

export class StringConcat extends StringConcatBase {
  generateQuestion(ctx: GenerateContext) {
    const [a, b] = randChoices(STRINGS, 2);
    return this.genQuestion(a, b, ctx);
  }
}

export class StringConcatBackwards extends StringConcatBase {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'Be careful to read the variables and operation in the correct order.',
    },
  ];
  generateQuestion(ctx: GenerateContext) {
    const [a, b] = randChoices(STRINGS, 2);
    return this.genQuestion(a, b, ctx, true);
  }
}

export class StringConcat_1IntLike extends StringConcatBase {
  generateQuestion(ctx: GenerateContext) {
    const a = randChoice(STRINGS);
    const b = randInt(1n, 9n);
    return this.genQuestion(a, b, ctx);
  }
}

export class StringConcat_1IntLikeBackwards extends StringConcatBase {
  generateQuestion(ctx: GenerateContext) {
    const a = randChoice(STRINGS);
    const b = randInt(1n, 9n);
    return this.genQuestion(a, b, ctx, true);
  }
}

export class StringConcat_2IntLike extends StringConcatBase {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'When in quotes, the contents are treated literally, not as numbers.',
    },
  ];
  generateQuestion(ctx: GenerateContext) {
    const [a, b] = randInts(1n, 9n, 2);
    return this.genQuestion(a, b, ctx);
  }
}

export class StringConcat_2IntLikeBackwards extends StringConcatBase {
  generateQuestion(ctx: GenerateContext) {
    const [a, b] = randInts(1n, 9n, 2);
    return this.genQuestion(a, b, ctx, true);
  }
}

export const STRING_CONCAT: Topic = new Topic('string-concat', 'String Concatenation', [
  new StringConcat(),
  new StringConcatBackwards(),
  new StringConcat_1IntLike(),
  new StringConcat_1IntLikeBackwards(),
  new StringConcat_2IntLike(),
  new StringConcat_2IntLikeBackwards(),
], [BASIC_VARIABLES]);
