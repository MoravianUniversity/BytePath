import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext } from '../topics';
import { randIntNum, randVars } from '../util';
import { toPyAtom } from '../python';
import { DICT_BASICS, createDict_StrToInt, toTuples } from './DictionaryBasics';
import { FOR_LOOP_BASICS } from './ForLoopBasics';

function getDictPrints(dict: Map<string, bigint>): string[] {
  const tuples = [...toTuples(dict)];
  return [
    tuples.map(([key, value]) => `${toPyAtom(key)}: ${value}`).join('\n'),
    tuples.map(([key, value]) => `(${toPyAtom(key)}, ${value})`).join('\n'),
    tuples.map(([key, value]) => `${key} ${value}`).join('\n'),
    [...dict.keys()].join('\n'),
    [...dict.values()].join('\n')
  ];
}

export class DictForIn extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const dict = createDict_StrToInt(randIntNum(3, 5));
    return createQuestion(`
      ${x} = ${toPyAtom(dict)}
      for ${y} in ${x}:
          print(${y})
    `, getDictPrints(dict), {}, ctx);
  }
}

export class DictForInKeys extends EvalLastLineSubtopic {
    generateQuestion(ctx: GenerateContext) {
      const [x, y] = randVars(2);
      const dict = createDict_StrToInt(randIntNum(3, 5));
      return createQuestion(`
        ${x} = ${toPyAtom(dict)}
        for ${y} in ${x}.keys():
            print(${y})
      `, getDictPrints(dict), {}, ctx);
  }
}

export class DictForInValues extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const dict = createDict_StrToInt(randIntNum(3, 5));
    return createQuestion(`
      ${x} = ${toPyAtom(dict)}
      for ${y} in ${x}.values():
          print(${y})
    `, getDictPrints(dict), {}, ctx);
  }
}

export class DictForInItems extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const dict = createDict_StrToInt(randIntNum(3, 5));
    return createQuestion(`
      ${x} = ${toPyAtom(dict)}
      for ${y} in ${x}.items():
          print(${y})
    `, getDictPrints(dict), {}, ctx);
  }
}

export class DictForInItems2 extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y, z] = randVars(3);
    const dict = createDict_StrToInt(randIntNum(3, 5));
    return createQuestion(`
      ${x} = ${toPyAtom(dict)}
      for ${y}, ${z} in ${x}.items():
          print(${y}, ${z})
    `, getDictPrints(dict), {}, ctx);
  }
}

export class DictForValuesUsingKeys extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(3);
    const dict = createDict_StrToInt(randIntNum(3, 5));
    return createQuestion(`
      ${x} = ${toPyAtom(dict)}
      for ${y} in ${x}:
          print(${x}[${y}])
    `, getDictPrints(dict), {}, ctx);
  }
}

export const DICT_WITH_LOOPS = new Topic('dict-with-loops', 'Dicts with Loops', [
    new DictForIn(),
    new DictForInKeys(),
    new DictForInValues(),
    new DictForInItems(),
    new DictForInItems2(),
    new DictForValuesUsingKeys(),
], [DICT_BASICS, FOR_LOOP_BASICS]);