import { Topic, EvalLastLineSubtopic, EvalLastLineQuestionGen } from '../topics';
import { randInt, randIntNum, randChoice, randChoices, randVariable, STRINGS, range, VARS } from '../util';
import { createException, toPyAtom, toPyStr } from '../python';
import { BASIC_VARIABLES } from './BasicVariables';
import { STRING_CONCAT } from './StringConcat';
import { STRING_LENGTH } from './StringLength';
import { STRING_INDEX } from './StringIndexing';

export function createDict<K, V>(keys: K[], values: V[], length: number, unique: boolean = true): Map<K, V> {
  const k = randChoices(keys, length);
  const v = randChoices(values, length, unique);
  const result: Map<K, V> = new Map();
  k.forEach((key, i) => result.set(key, v[i]));
  return result;
}

export function createDict_StrToInt(length: number): Map<string, bigint> {
  return createDict(VARS, range(10n, 100n), length);
}

export function createDict_StrToString(length: number): Map<string, string> {
  return createDict(VARS, STRINGS, length);
}

export function createDict_IntToStr(length: number): Map<bigint, string> {
  return createDict(range(10n, 100n), STRINGS, length);
}

export function createDict_IntToInt(length: number): Map<bigint, bigint> {
  return createDict(range(10n, 100n), range(10n, 100n), length);
}

export function toTuples<K, V>(dict: Map<K, V>): (readonly [K, V])[] {
  return Array.from(dict.entries()).map((entry) => Object.freeze(entry));
}

export class DictLength_StrToInt extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const dict = createDict_StrToInt(randIntNum(3, 5));
    return { code: `
      ${x} = ${toPyAtom(dict)}
      len(${x})`,
      options: range(3n, 10n),
    };
  }
}

export class DictLength_StrToString extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const dict = createDict_StrToString(randIntNum(3, 5));
    return { code: `
      ${x} = ${toPyAtom(dict)}
      len(${x})`,
      options: range(3n, 10n),
    };
  }
}

export class DictIndex_StrToInt extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const dict = createDict_StrToInt(randIntNum(3, 5));
    const key = randChoice(Array.from(dict.keys()));
    return { code: `
      ${x} = ${toPyAtom(dict)}
      ${x}[${toPyStr(key)}]`,
      options: [...dict.values(), ...dict.keys(), ...toTuples(dict)],
    };
  }
}

export class DictIndex_IntToStr extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const dict = createDict_IntToStr(randIntNum(3, 5));
    const key = randChoice(Array.from(dict.keys()));
    return { code: `
      ${x} = ${toPyAtom(dict)}
      ${x}[${key}]`,
      options: [...dict.values(), ...dict.keys(), ...toTuples(dict)],
    };
  }
}

export class DictIndex_IntToInt extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const dict = createDict_IntToInt(randIntNum(3, 5));
    const key = randChoice(Array.from(dict.keys()));
    return { code: `
      ${x} = ${toPyAtom(dict)}
      ${x}[${key}]`,
      options: [...dict.values(), ...dict.keys(), ...toTuples(dict)],
    };
  }
}

export class DictIndexSetNew extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const dict = createDict_StrToInt(randIntNum(2, 3));
    let key = randVariable();
    while (dict.has(key)) { key = randVariable(); }
    let value = randInt(10n, 100n);
    return { code: `
      ${x} = ${toPyAtom(dict)}
      ${x}[${toPyStr(key)}] = ${value}
      ${x}`,
      options: [
        dict,
        new Map().set(key, value),
        createException('KeyError', `Key ${toPyStr(key)} not found in dictionary`),
        createException('AttributeError', `'dict' object has no attribute 'set'`),
      ],
    };
  }
}

export class DictIndexSetExisting extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const dict = createDict_StrToInt(randIntNum(2, 3));
    const key = randChoice(Array.from(dict.keys()));
    let value = randInt(10n, 100n);
    while (dict.get(key) === value) { value = randInt(10n, 100n); }
    return { code: `
      ${x} = ${toPyAtom(dict)}
      ${x}[${toPyStr(key)}] = ${value}
      ${x}`,
      options: [
        dict,
        new Map().set(key, value),
        createException('KeyError', `Key ${toPyStr(key)} not found in dictionary`),
        createException('AttributeError', `'dict' object has no attribute 'set'`)
      ],
    };
  }
}

export class DictIn extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const dict = createDict_StrToInt(randIntNum(3, 5));
    const key = randChoice(Array.from(dict.keys()));
    return { code: `
      ${x} = ${toPyAtom(dict)}
      ${toPyStr(key)} in ${x}`,
      options: [true, false],
    };
  }
}

export class DictNotIn extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const dict = createDict_StrToInt(randIntNum(3, 5));
    const key = randChoice(Array.from(dict.keys()));
    return { code: `
      ${x} = ${toPyAtom(dict)}
      ${toPyStr(key)} not in ${x}`,
      options: [true, false],
    };
  }
}

export class DictInMissing extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const dict = createDict_StrToString(randIntNum(3, 5));
    let key = randVariable();
    while (dict.has(key)) { key = randVariable(); }
    return { code: `
      ${x} = ${toPyAtom(dict)}
      ${toPyStr(key)} in ${x}`,
      options: [true, false],
    };
  }
}

export class DictInValues extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const dict = createDict_StrToString(randIntNum(3, 5));
    const key = randChoice(Array.from(dict.values()));
    return { code: `
      ${x} = ${toPyAtom(dict)}
      ${toPyStr(key)} in ${x}`,
      options: [true, false],
    };
  }
}

export class DictIndexInValues extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const dict = createDict_StrToString(randIntNum(3, 4));
    const key = randChoice(Array.from(dict.values()));
    return { code: `
      ${x} = ${toPyAtom(dict)}
      ${x}[${toPyStr(key)}]`,
      options: [...dict.values(), ...dict.keys(), ...toTuples(dict), null],
    };
  }
}
export class DictIndexMissing extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const dict = createDict_StrToString(randIntNum(3, 4));
    let key = randVariable();
    while (dict.has(key)) { key = randVariable(); }
    return { code: `
      ${x} = ${toPyAtom(dict)}
      ${x}[${toPyStr(key)}]`,
      options: [...dict.values(), ...dict.keys(), ...toTuples(dict), null],
    };
  }
}

export class DictIndexGet extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const dict = createDict_StrToString(randIntNum(3, 4));
    const key = randChoice(Array.from(dict.keys()));
    return { code: `
      ${x} = ${toPyAtom(dict)}
      ${x}.get(${toPyStr(key)})`,
      options: [...dict.values(), ...dict.keys(), ...toTuples(dict), null, createException('KeyError', `Key ${toPyStr(key)} not found in dictionary`)],
    };
  }
}

export class DictIndexGetInValues extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const dict = createDict_StrToString(randIntNum(3, 4));
    const key = randChoice(Array.from(dict.values()));
    return { code: `
      ${x} = ${toPyAtom(dict)}
      ${x}.get(${toPyStr(key)})`,
      options: [...dict.values(), ...dict.keys(), ...toTuples(dict), null, createException('KeyError', `Key ${toPyStr(key)} not found in dictionary`)],
    };
  }
}

export class DictIndexGetMissing extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const dict = createDict_StrToString(randIntNum(3, 4));
    let key = randVariable();
    while (dict.has(key)) { key = randVariable(); }
    return { code: `
      ${x} = ${toPyAtom(dict)}
      ${x}.get(${toPyStr(key)})`,
      options: [...dict.values(), ...dict.keys(), ...toTuples(dict), null, createException('KeyError', `Key ${toPyStr(key)} not found in dictionary`)],
    };
  }
}

export class DictIndexGetWithDefault extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const dict = createDict_StrToString(randIntNum(3, 4));
    const key = randChoice(Array.from(dict.keys()));
    const default_value = randInt(10n, 100n);
    return { code: `
      ${x} = ${toPyAtom(dict)}
      ${x}.get(${toPyStr(key)}, ${default_value})`,
      options: [
        ...dict.values(), ...dict.keys(), ...toTuples(dict), default_value, null,
        createException('KeyError', `Key ${toPyStr(key)} not found in dictionary`)
      ],
    };
  }
}

export class DictIndexGetWithDefaultMissing extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const dict = createDict_StrToString(randIntNum(3, 4));
    let key = randVariable();
    while (dict.has(key)) { key = randVariable(); }
    const default_value = randInt(10n, 100n);
    return { code: `
      ${x} = ${toPyAtom(dict)}
      ${x}.get(${toPyStr(key)}, ${default_value})`,
      options: [
        ...dict.values(), ...dict.keys(), ...toTuples(dict), default_value, null,
        createException('KeyError', `Key ${toPyStr(key)} not found in dictionary`)
      ],
    };
  }
}

export const DICT_BASICS = new Topic('dict-basics', "Dictionary Basics", [
  new DictLength_StrToInt(),
  new DictLength_StrToString(),
  new DictIndex_StrToInt(),
  new DictIndex_IntToStr(),
  new DictIndex_IntToInt(),
  new DictIndexSetNew(),
  new DictIndexSetExisting(),
  new DictIn(),
  new DictNotIn(),
  new DictInMissing(),
  new DictInValues(),
  new DictIndexInValues(),
  new DictIndexMissing(),
  new DictIndexGet(),
  new DictIndexGetInValues(),
  new DictIndexGetMissing(),
  new DictIndexGetWithDefault(),
  new DictIndexGetWithDefaultMissing(),
], [BASIC_VARIABLES, STRING_CONCAT, STRING_LENGTH, STRING_INDEX]);
