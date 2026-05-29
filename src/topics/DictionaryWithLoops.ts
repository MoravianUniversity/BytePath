import { Topic, CodeOutputSubtopic, CodeOutputQuestionGen } from '../topics';
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

export class DictForIn extends CodeOutputSubtopic {
  gen(): CodeOutputQuestionGen {
    const [x, y] = randVars(2);
    const dict = createDict_StrToInt(randIntNum(3, 5));
    return { code: `
        ${x} = ${toPyAtom(dict)}
        for ${y} in ${x}:
            print(${y})
      `,
      options: getDictPrints(dict),
    };
  }
}

export class DictForInKeys extends CodeOutputSubtopic {
  gen(): CodeOutputQuestionGen {
    const [x, y] = randVars(2);
    const dict = createDict_StrToInt(randIntNum(3, 5));
    return { code: `
        ${x} = ${toPyAtom(dict)}
        for ${y} in ${x}.keys():
            print(${y})
      `,
      options: getDictPrints(dict),
    };
  }
}

export class DictForInValues extends CodeOutputSubtopic {
  gen(): CodeOutputQuestionGen {
    const [x, y] = randVars(2);
    const dict = createDict_StrToInt(randIntNum(3, 5));
    return { code: `
        ${x} = ${toPyAtom(dict)}
        for ${y} in ${x}.values():
            print(${y})
      `,
      options: getDictPrints(dict),
    };
  }
}

export class DictForInItems extends CodeOutputSubtopic {
  gen(): CodeOutputQuestionGen {
    const [x, y] = randVars(2);
    const dict = createDict_StrToInt(randIntNum(3, 5));
    return { code: `
        ${x} = ${toPyAtom(dict)}
        for ${y} in ${x}.items():
            print(${y})
      `,
      options: getDictPrints(dict),
    };
  }
}

export class DictForInItems2 extends CodeOutputSubtopic {
  gen(): CodeOutputQuestionGen {
    const [x, y, z] = randVars(3);
    const dict = createDict_StrToInt(randIntNum(3, 5));
    return { code: `
      ${x} = ${toPyAtom(dict)}
        for ${y}, ${z} in ${x}.items():
            print(${y}, ${z})
      `,
      options: getDictPrints(dict),
    };
  }
}

export class DictForValuesUsingKeys extends CodeOutputSubtopic {
  gen(): CodeOutputQuestionGen {
    const [x, y] = randVars(3);
    const dict = createDict_StrToInt(randIntNum(3, 5));
    return { code: `
      ${x} = ${toPyAtom(dict)}
      for ${y} in ${x}:
          print(${x}[${y}])
      `,
      options: getDictPrints(dict),
    };
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