import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext } from '../topics';
import { randChoice, randChoices, randVariable, STRINGS } from '../util';
import { STRING_CONCAT } from './StringConcat';

export class StringLen extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const a = randChoice(STRINGS);
    return createQuestion(`len("${a}")`, [
      BigInt(a.length + 1),
      BigInt(a.length + 2),
      BigInt(a.length - 1),
      BigInt(a.length - 2),
    ], {}, ctx);
  }
}

export class StringLenMulti extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [a, b] = randChoices(STRINGS, 2);
    return createQuestion(`len("${a}") + len("${b}")`, [
      BigInt(a.length),
      BigInt(b.length),
      BigInt(a.length + b.length + 1),
      BigInt(a.length + b.length - 1),
    ], {}, ctx);
  }
}

export class StringLenMultiConcat extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [a, b] = randChoices(STRINGS, 2);
    return createQuestion(`len("${a}" + "${b}")`, [
      BigInt(a.length),
      BigInt(b.length),
      BigInt(a.length + b.length + 1),
      BigInt(a.length + b.length - 1),
    ], {}, ctx);
  }
}

export class StringLenVar extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = randChoice(STRINGS);
    return createQuestion(`
      ${x} = "${a}"
      len(${x})
    `, [
      BigInt(a.length),
      BigInt(x.length),
      BigInt(a.length + 1),
      BigInt(a.length - 1),
    ], {}, ctx);
  }
}

export class StringLenMultiVar extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const [a, b] = randChoices(STRINGS, 2);
    return createQuestion(`
      ${x} = "${a}"
      len(${x}) + len("${b}")
    `, [
      BigInt(a.length),
      BigInt(b.length),
      BigInt(x.length),
      BigInt(a.length + b.length + 1),
      BigInt(a.length + b.length - 1),
    ], {}, ctx);
  }
}

export class StringLenMultiVarConcat extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const [a, b] = randChoices(STRINGS, 2);
    return createQuestion(`
      ${x} = "${a}"
      len("${b}" + ${x})
    `, [
      BigInt(a.length),
      BigInt(b.length),
      BigInt(x.length),
      BigInt(a.length + b.length + 1),
      BigInt(a.length + b.length - 1),
    ], {}, ctx);
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
