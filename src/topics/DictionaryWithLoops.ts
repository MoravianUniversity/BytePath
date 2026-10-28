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
  readonly help = [
    {afterFailedAttempts: 1, message: 'The for loop takes each *key* in the dict, one at a time.'},
    {afterFailedAttempts: 2, message: 'The for loop takes each *key* in the dict, one at a time, and the code block inside the loop prints the key, one at a time.'},
  ];
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
  readonly help = [
    {afterFailedAttempts: 1, message: 'The for loop takes each *key* in the dict, one at a time.'},
    {afterFailedAttempts: 2, message: 'The for loop takes each *key* in the dict, one at a time, and the code block inside the loop prints the key, one at a time.'},
  ];
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
  readonly help = [
    {afterFailedAttempts: 1, message: 'The for loop takes each *value* in the dict, one at a time.'},
    {afterFailedAttempts: 2, message: 'The for loop takes each *value* in the dict, one at a time, and the code block inside the loop prints the value, one at a time.'},
  ];
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
  readonly help = [
    {afterFailedAttempts: 1, message: 'The for loop takes each *key-value pair* in the dict (a `tuple`), one at a time.'},
    {afterFailedAttempts: 2, message: 'The for loop takes each *key-value pair* in the dict (a `tuple`), one at a time, and the code block inside the loop prints the key-value pair, one at a time.'},
  ];
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
  readonly help = [
    {afterFailedAttempts: 1, message: 'The for loop takes each *key-value pair* in the dict, one at a time, breaking it into two variables: the key and the value.'},
    {afterFailedAttempts: 2, message: 'The for loop takes each *key-value pair* in the dict, one at a time, breaking it into two variables: the key and the value, and the code block inside the loop prints the key and the value, one at a time.'},
  ];
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
  readonly help = [
    {afterFailedAttempts: 1, message: 'The for loop takes each *key* in the dict, one at a time.'},
    {afterFailedAttempts: 2, message: 'The for loop takes each *key* in the dict, one at a time, and the code block inside the loop prints the value associated with the key, one at a time.'},
  ];
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