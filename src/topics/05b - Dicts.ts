import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext } from '../topics';
import { randInts, randIntNum, STRINGS, randChoices, randVars, range, shuffle, ASCII_LETTERS } from '../util';
import { toPyAtom, toPyStr, tuple, PyType, Immutable } from '../python.ts';

import { createDict, DICT_BASICS } from './DictionaryBasics';
import { DICT_WITH_LOOPS } from './DictionaryWithLoops';

function createCode(): {code: string, dict: Map<Immutable, PyType>, vars: string[], vals: bigint[]}  {
  const vars = randVars(4);
  const [x, y, z, w] = vars;
  const vals = randInts(1n, 10n, 4);
  const [a, b, c, d] = vals;
  const [m, n] = randChoices(STRINGS, 2);
  const dict: Map<Immutable, PyType> = new Map();
  dict.set(x, tuple(c, d)!);
  dict.set(a, m);
  dict.set(b, n);
  dict.set(n, a);
  dict.set(z, b);

  const entries = [
    `${toPyStr(x)}: (${c}, ${d})`,
    `${a}: ${toPyStr(m)}`,
    `${y}: ${toPyStr(n)}`,
    `${z}: ${a}`,
    `${toPyStr(z)}: ${b}`,
  ];
  
  const code = `
    ${x} = ${a}
    ${y} = ${b}
    ${z} = ${toPyStr(n)}
    ${w} = {${shuffle(entries).join(', ')}}
    `;

    return {code, dict, vars, vals};
}

class DictLen extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const {code, vars} = createCode();
    return createQuestion(code + `len(${vars[3]})`, range(3n, 12n), {}, ctx);
  }
}

class DictIndexStr extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const {code, dict, vars} = createCode();
    return createQuestion(code + `${vars[3]}[${toPyStr(vars[0])}]`, [...dict.values(), ...dict.keys()], {}, ctx);
  }
}

class DictIndexVar extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const {code, dict, vars} = createCode();
    return createQuestion(code + `${vars[3]}[${vars[0]}]`, [...dict.values(), ...dict.keys()], {}, ctx);
  }
}

class DictIndexInt extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const {code, dict, vars, vals} = createCode();
    return createQuestion(code + `${vars[3]}[${vals[0]}]`, [...dict.values(), ...dict.keys()], {}, ctx);
  }
}

class DictVarIn extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const {code, vars} = createCode();
    return createQuestion(code + `${vars[1]} in ${vars[3]}`, [true, false], {}, ctx);
  }
}

class DictStrIn extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const {code, vars} = createCode();
    return createQuestion(code + `${toPyStr(vars[1])} in ${vars[3]}`, [true, false], {}, ctx);
  }
}
class DictVarIn2 extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const {code, vars} = createCode();
    return createQuestion(code + `${vars[2]} in ${vars[3]}`, [true, false], {}, ctx);
  }
}

class DictStrIn2 extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const {code, vars} = createCode();
    return createQuestion(code + `${toPyStr(vars[2])} in ${vars[3]}`, [true, false], {}, ctx);
  }
}

class LongRead extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y, z] = randVars(3);
    const dict = createDict([...ASCII_LETTERS], [2n, 3n, 4n], randIntNum(4, 7), false);
    return createQuestion(`
      ${x} = ${toPyAtom(dict)}
      ${y} = {}
      for ${z} in ${x}:
          if ${x}[${z}] not in ${y}:
              ${y}[${x}[${z}]] = []
          ${y}[${x}[${z}]].append(${z})
      ${y}
    `, [], {}, ctx);
  }
}

export const PRACTICE_05B_DICTS = new Topic('practice-05b-dicts', '05b - Dicts', [
  new DictLen(),
  new DictIndexStr(),
  new DictIndexVar(),
  new DictIndexInt(),
  new DictVarIn(),
  new DictStrIn(),
  new DictVarIn2(),
  new DictStrIn2(),
  new LongRead(),
], [DICT_BASICS, DICT_WITH_LOOPS], {order: 'random'});