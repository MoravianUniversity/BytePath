import { Topic, EvalLastLineSubtopic, EvalLastLineQuestionGen } from '../topics';
import { randVariable, randInt, randFloat, randFloats, randChoice, randChoices } from '../util';
import { toPyFloat, toPyStr, createException } from '../python';
import { BASIC_RELATIONAL_OPERATORS } from './BasicRelationalOperators';
import { randOperation, BASIC_VARIABLES } from './BasicVariables';

const STRINGS = ["A", "B", "C", "D"];
const OPS = ['==', '!=', '<', '<=', '>', '>='];
function randOp(): string { return randChoice(OPS); }

export class CompareFloats extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const [a, b] = randFloats(1, 5, 2);
    const op = randOp();
    return { code: `
      ${x} = ${toPyFloat(a, 1)}
      ${x} ${op} ${toPyFloat(b, 1)}`, options: [true, false, createException('TypeError')] };
  }
}

export class CompareFloatWithInt extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const a = randFloat(1, 5);
    const b = randInt(1n, 5n);
    const op = randOp();
    return { code: `
      ${x} = ${toPyFloat(a, 1)}
      ${x} ${op} ${b}`,
      options: [true, false, createException('TypeError', `'${op}' not supported between instances of 'float' and 'int'`)],
    };
  }
}

export class CompareFloatWithIntEqual extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const a = randInt(1n, 5n);
    const b = Number(a);
    const op = "==";
    return { code: `
      ${x} = ${toPyFloat(b, 1)}
      ${a} ${op} ${x}`,
      options: [true, false, createException('TypeError', `'${op}' not supported between instances of 'float' and 'int'`)],
    };
  }
}
  
export class CompareWithMath extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'Compute the values of the math operations before comparing.',
    },
  ];
  gen(): EvalLastLineQuestionGen {
    const [a, b, c, d] = randFloats(1, 5, 4);
    const op1 = randOperation();
    const op2 = randOperation();
    const rel = randOp();
    return {
      code: `${a} ${op1} ${b} ${rel} ${c} ${op2} ${d}`,
      options: [true, false, createException('TypeError')],
    };
  }
}

export class CompareStrings extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'Strings are compared character by character and every character must be exactly the same to be equal.',
    },
  ];
  gen(): EvalLastLineQuestionGen {
    const [a, b] = randChoices(STRINGS, 2);
    let rel = randOp();
    while (rel == "==" || rel == "!=") { rel = randOp(); }
    return {
      code: `${toPyStr(a)} ${rel} ${toPyStr(b)}`,
      options: [true, false, createException('TypeError')],
    };
  }
}

export class CompareStringsEqual_True extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'Strings are compared character by character and every character must be exactly the same to be equal.',
    },
  ];
  gen(): EvalLastLineQuestionGen {
    const a = randChoice(STRINGS);
    const rel = "==";
    return {
      code: `"${a}" ${rel} '${a}'`,
      options: [true, false, createException('TypeError')],
    };
  }
}

export class CompareStringsEqual_False extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'Strings are compared character by character and every character must be exactly the same to be equal.',
    },
  ];
  gen(): EvalLastLineQuestionGen {
    const a = randChoice(STRINGS);
    const rel = "==";
    return {
      code: `"${a}" ${rel} "${a}"`,
      options: [true, false, createException('TypeError')],
    };
  }
}

export class CompareStringsIntEqual extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'Remember that str and int are different types, but we can ask if they are equal.',
    },
  ];
  gen(): EvalLastLineQuestionGen {
    const a = randChoice(STRINGS);
    const b = randInt(1n, 5n);
    const rel = "==";
    return {
      code: `"${a}" ${rel} ${b}`,
      options: [true, false, createException('TypeError', `'${rel}' not supported between instances of 'str' and 'int'`)],
    };
  }
}

export class CompareStringsIntEqual2 extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'Remember that str and int are different types, but we can ask if they are equal.',
    },
  ];
  gen(): EvalLastLineQuestionGen {
    const b = randInt(1n, 5n);
    const rel = "==";
    return {
      code: `"${b}" ${rel} ${b}`,
      options: [true, false, createException('TypeError', `'${rel}' not supported between instances of 'str' and 'int'`)],
    };
  }
}

export class CompareStringsIntLT extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'Remember that str and int are different types.',
    },
  ];
  gen(): EvalLastLineQuestionGen {
    const a = randChoice(STRINGS);
    const b = randInt(1n, 5n);
    const rel = "<";
    return {
      code: `"${a}" ${rel} ${b}`,
      options: [true, false, createException('TypeError', `'${rel}' not supported between instances of 'str' and 'int'`)],
    };
  }
}

export class CompareStringsIntLT2 extends EvalLastLineSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'Remember that str and int are different types.',
    },
  ];
  gen(): EvalLastLineQuestionGen {
    const b = randInt(1n, 5n);
    const rel = "<";
    return {
      code: `"${b-1n}" ${rel} ${b}`,
      options: [true, false, createException('TypeError', `'${rel}' not supported between instances of 'str' and 'int'`)],
    };
  }
}


export const RELATIONAL_OPERATORS = new Topic('relational-operators', 'Relational Operators', [
    new CompareFloats(),
    new CompareFloats(),
    new CompareFloatWithInt(),
    new CompareFloatWithInt(),
    new CompareFloatWithIntEqual(),
    new CompareWithMath(),
    new CompareWithMath(),
    new CompareStrings(),
    new CompareStrings(),
    new CompareStringsEqual_True(),
    new CompareStringsEqual_False(),
    new CompareStringsIntEqual(),
    new CompareStringsIntEqual2(),
    new CompareStringsIntLT(),
    new CompareStringsIntLT2(),
], [BASIC_RELATIONAL_OPERATORS, BASIC_VARIABLES], {order: 'random'});