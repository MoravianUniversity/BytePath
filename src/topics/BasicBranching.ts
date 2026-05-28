import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext } from '../topics';
import { randInts, randVars, randVariable, max, min } from '../util';
import { BASIC_VARIABLES } from './BasicVariables';
import { BASIC_PRINTS } from './BasicPrints';


export class IfEntered extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b, c, d] = randInts(1n, 10n, 4);
    return createQuestion(`
      ${x} = ${max(a, c)}
      ${y} = ${b}
      if ${x} > ${min(a, c)}:
          ${y} = ${d}
      ${y}
    `, [a, b, c, d, x, y], {}, ctx);
  }
}

export class IfSkipped extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b, c, d] = randInts(1n, 10n, 4);
    return createQuestion(`
      ${x} = ${min(a, c)}
      ${y} = ${b}
      if ${x} > ${max(a, c)}:
          ${y} = ${d}
      ${y}
    `, [a, b, c, d, x, y], {}, ctx);
  }
}

export class IfSkippedClose extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b, d] = randInts(1n, 10n, 3);
    return createQuestion(`
      ${x} = ${a}
      ${y} = ${b}
      if ${x} > ${a}:
          ${y} = ${d}
      ${y}
    `, [a, b, d, x, y], {}, ctx);
  }
}

export class IfWrongVar extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b, c, d] = randInts(1n, 10n, 4);
    return createQuestion(`
      ${x} = ${a}
      ${y} = ${b}
      if ${x} > ${c}:
          ${y} = ${d}
      ${x}
    `, [a, b, c, d, x, y], {}, ctx);
  }
}

export class IfElseEnterIf extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b, c, d, e] = randInts(1n, 10n, 5);
    return createQuestion(`
      ${x} = ${max(a, c)}
      ${y} = ${b}
      if ${x} > ${min(a, c)}:
          ${y} = ${d}
      else:
          ${y} = ${e}
      ${y}
    `, [a, b, c, d, e, x, y], {}, ctx);
  }
}

export class IfElseEnterElse extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b, c, d, e] = randInts(1n, 10n, 5);
    return createQuestion(`
      ${x} = ${min(a, c)}
      ${y} = ${b}
      if ${x} > ${max(a, c)}:
          ${y} = ${d}
      else:
          ${y} = ${e}
      ${y}
    `, [a, b, c, d, e, x, y], {}, ctx);
  }
}

export class IfElseDifferentVarsEnterIf extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y, z] = randVars(3);
    const [a, b, c, d, e, f] = randInts(1n, 10n, 6);
    return createQuestion(`
      ${x} = ${max(a, c)}
      ${y} = ${b}
      ${z} = ${f}
      if ${x} > ${min(a, c)}:
          ${y} = ${d}
      else:
          ${z} = ${e}
      ${y} + ${z}
    `, [a, b, c, d, e, f, b+f, d+e, b+e, d+f, a+c, x, y, z], {}, ctx);
  }
}

export class IfElseDifferentVarsEnterElse extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y, z] = randVars(3);
    const [a, b, c, d, e, f] = randInts(1n, 10n, 6);
    return createQuestion(`
      ${x} = ${min(a, c)}
      ${y} = ${b}
      ${z} = ${f}
      if ${x} > ${max(a, c)}:
          ${y} = ${d}
      else:
          ${z} = ${e}
      ${y} + ${z}
    `, [a, b, c, d, e, f, b+f, d+e, b+e, d+f, a+c, x, y, z], {}, ctx);
  }
}

export class IfWithPrintEntered extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const [a, b, c, d] = randInts(1n, 10n, 4);
    return createQuestion(`
      ${x} = ${min(a, b)}
      if ${x} > ${max(a, b)}:
          print(${c})
      print(${d})
    `, [
      `${a}`, `${b}`, `${c}`, `${d}`,
      `${a}\n${d}`, `${b}\n${c}`, `${a}\n${c}`, `${b}\n${d}`,
      `${a} ${b}`, `${c} ${d}`, `${a} ${c}`, `${b} ${d}`
    ], {}, ctx);
  }
}

export class IfWithPrintSkipped extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const [a, b, c, d] = randInts(1n, 10n, 4);
    return createQuestion(`
      ${x} = ${max(a, b)}
      if ${x} > ${min(a, b)}:
          print(${c})
      print(${d})
    `, [
        `${a}`, `${b}`, `${c}`, `${d}`,
        `${a}\n${d}`, `${b}\n${c}`, `${a}\n${c}`, `${b}\n${d}`,
        `${a} ${b}`, `${c} ${d}`, `${a} ${c}`, `${b} ${d}`
      ], {}, ctx);
  }
}

export class IfElseWithPrint extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const [a, b, c, d, e] = randInts(1n, 10n, 5);
    return createQuestion(`
      ${x} = ${a}
      if ${x} > ${b}:
          print(${c})
      else:
          print(${d})
      print(${e})
    `, [
      `${a}`, `${b}`, `${c}`, `${d}`, `${e}`,
      `${a}\n${d}`, `${b}\n${c}`, `${a}\n${c}`, `${b}\n${d}`, `${b}\n${e}`, `${c}\n${e}`, `${d}\n${e}`,
      `${a} ${b}`, `${c} ${d}`, `${a} ${c}`, `${b} ${d}`, `${a} ${e}`, `${b} ${e}`, `${c} ${e}`, `${d} ${e}`
    ], {}, ctx);
  }
}

export class IfCompareVarsEntered extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y, z] = randVars(3);
    const [a, b, c, d] = randInts(1n, 10n, 4);
    return createQuestion(`
      ${x} = ${max(a, b)}
      ${y} = ${min(a, b)}
      ${z} = ${c}
      if ${x} > ${y}:
          ${z} = ${d}
      ${z}
    `, [a, b, c, d, x, y, z], {}, ctx);
  }
}

export class IfCompareVarsSkipped extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y, z] = randVars(3);
    const [a, b, c, d] = randInts(1n, 10n, 4);
    return createQuestion(`
      ${x} = ${min(a, b)}
      ${y} = ${max(a, b)}
      ${z} = ${c}
      if ${x} > ${y}:
          ${z} = ${d}
      ${z}
    `, [a, b, c, d, x, y, z], {}, ctx);
  }
}

export class IfElseCompareVars extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y, z] = randVars(3);
    const [a, b, c, d, e] = randInts(1n, 10n, 5);
    return createQuestion(`
      ${x} = ${a}
      ${y} = ${b}
      ${z} = ${c}
      if ${x} > ${y}:
          ${z} = ${d}
      else:
          ${z} = ${e}
      ${z}
    `, [a, b, c, d, e, x, y, z], {}, ctx);
  }
}

export const BASIC_BRANCHING = new Topic('basic-branching', 'Basic Branching', [
  new IfEntered(),
  new IfSkipped(),
  new IfSkippedClose(),
  new IfWrongVar(),
  new IfElseEnterIf(),
  new IfElseEnterElse(),
  new IfElseDifferentVarsEnterIf(),
  new IfElseDifferentVarsEnterElse(),
  new IfWithPrintEntered(),
  new IfWithPrintSkipped(),
  new IfElseWithPrint(),
  new IfCompareVarsEntered(),
  new IfCompareVarsSkipped(),
  new IfElseCompareVars(),
], [BASIC_VARIABLES, BASIC_PRINTS]);
