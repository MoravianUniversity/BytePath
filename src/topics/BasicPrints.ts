import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext } from '../topics';
import { randInt, randChoice, randChoices, STRINGS, randVariable } from '../util';
import { STRING_CONCAT } from './StringConcat';

export class PrintString extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [a, b] = randChoices(STRINGS, 2);
    return createQuestion(`
      print("${a}")
      print('${b}')
    `, [
      a, b,
      `${a}\n${b}`, 
      `${b}\n${a}`,
      `"${a}"\n'${b}'`,
      `'${b}'\n"${a}"`,
      `"${a}${b}"`,
      `"${a} ${b}"`,
      `${a}${b}`,
      `${b}${a}`,
      `${a} ${b}`,
    ], {}, ctx);
  }
}

export class PrintStringMulti extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [a, b] = randChoices(STRINGS, 2);
    return createQuestion(`
      print('${a}', "${b}")
    `, [
      `${b}\n${a}`,
      `"${a}"\n'${b}'`,
      `'${b}'\n"${a}"`,
      `"${a}${b}"`,
      `"${a}" "${b}"`,
      `'${a}' "${b}"`,
      `"${a} ${b}"`,
      `${a}${b}`,
      `${b}${a}`,
      `${a} ${b}`,
    ], {}, ctx);
  }
}

export class PrintStringVar extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = randChoice(STRINGS);
    return createQuestion(`
      ${x} = "${a}"
      print(${x})
    `, [
      x, a,
      `"${x}"`,
      `'${x}'`,
      `"${a}"`,
      `'${a}'`
    ], {}, ctx);
  }
}

export class PrintStringVar2 extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const [a, b] = randChoices(STRINGS, 2);
    return createQuestion(`
      ${x} = "${a}"
      print(${x})
      print("${b}")
    `, [
      `${x}\n${b}`,
      `"${a}"\n'${b}'`,
      `'${b}'\n"${a}"`,
      `${x}${b}`,
      `${x} ${b}`,
      `${a}${b}`,
      `${b}${a}`,
      `${a} ${b}`,
    ], {}, ctx);
  }
}

export class PrintStringMultiVar extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const [a, b, c] = randChoices(STRINGS, 3);
    return createQuestion(`
      ${x} = "${a}"
      ${b} = "${c}"
      print(${x}, "${b}")
      print("${x}", ${b})
    `, [
      `${x} ${b}\n${x} ${b}`,
      `${x} ${b}\n${x} ${c}`,
      `${x} ${b}\n${a} ${b}`,
      `${x} ${b}\n${a} ${c}`,
      `${x} ${b}\n${a} ${b}`,
    ], {}, ctx);
  }
}

export class PrintStringUpdateVar extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const [a, b] = randChoices(STRINGS, 2);
    return createQuestion(`
      ${x} = "${a}"
      print(${x})
      ${x} = "${b}"
      print(${x})
    `, [
      `${a}\n${a}`,
      `${b}\n${b}`,
      `${b}\n${a}`,
      `${x}\n${a}`,
      `${x}\n${b}`,
      `${x}\n${x}`,
    ], {}, ctx);
  }
}

export class PrintStringWithMath extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const a = randInt(1n, 10n);
    const b = randInt(1n, 10n);
    return createQuestion(`
      print(${a} + ${b})
    `, [
      `${a} + ${b}`,
      `"${a} + ${b}"`,
      `"${a}" + "${b}"`,
      `${a}${b}`,
      `"${a}${b}"`,
    ], {}, ctx);
  }
}

export class PrintStringWithQuotedMath extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const a = randInt(1n, 10n);
    const b = randInt(1n, 10n);
    return createQuestion(`
      print("${a} + ${b}")
    `, [
      a + b,
      `"${a} + ${b}"`,
      `"${a}" + "${b}"`,
      `${a}${b}`,
      `"${a}${b}"`,
    ], {}, ctx);
  }
}

export class PrintStringWithQuotedMath2 extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const a = randInt(1n, 10n);
    const b = randInt(1n, 10n);
    return createQuestion(`
      print("${a}" + "${b}")
    `, [
      a + b,
      `"${a}" + "${b}"`,
      `"${a} + ${b}"`,
      `${a} + ${b}`,
      `"${a}${b}"`,
    ], {}, ctx);
  }
}

export const BASIC_PRINTS: Topic = new Topic('basic-prints', 'Basic Printing', [
  new PrintString(),
  new PrintStringMulti(),
  new PrintStringVar(),
  new PrintStringVar2(),
  new PrintStringMultiVar(),
  new PrintStringUpdateVar(),
  new PrintStringWithMath(),
  new PrintStringWithQuotedMath(),
  new PrintStringWithQuotedMath2(),
], [STRING_CONCAT]);
