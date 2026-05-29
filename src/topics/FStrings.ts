import { Topic, EvalLastLineSubtopic, EvalLastLineQuestionGen } from '../topics';
import { STRINGS, randChoices, randFloat, randFloats, randVariable, randVars } from "../util";
import { toPyStr } from "../python";
import { BASIC_VARIABLES } from "./BasicVariables";
import { STRING_CONCAT } from "./StringConcat";
import { STRING_LENGTH } from "./StringLength";

export class FStringSingle extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const [a, b] = randChoices(STRINGS, 2);
    return { code: `
        ${x} = ${toPyStr(a)}
        f"${b} {${x}}"`,
      options: [a, b, `${a} ${b}`, `${b} ${x}`],
    };
  }
}

export class FStringNone extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const [a, b] = randChoices(STRINGS, 2);
    return { code: `
        ${x} = ${toPyStr(a)}
        f"${b} ${x}"`,
      options: [a, b, `${a} ${b}`, `${b} ${x}`],
    };
  }
}

export class FStringMulti extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const [x, y] = randVars(2);
    const [a, b] = randChoices(STRINGS, 2);
    return { code: `
        ${x} = ${toPyStr(a)}
        ${y} = ${toPyStr(b)}
        f"{${x}} {${y}}"`,
      options: [a, b, `${a} ${b}`, `${x} ${y}`],
    };
  }
}

export class FStringFloats extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const [x, y] = randVars(2);
    const [a, b] = randFloats(1, 10, 2, false, 5);
    return { code: `
        ${x} = ${a}
        ${y} = ${b}
        f"Values: {${x}:.1f} {${y}:.2f}"`,
      options: [
        `Values: ${a.toFixed(2)} ${b.toFixed(2)}`,
        `Values: ${a.toFixed(1)} ${b.toFixed(1)}`,
        `Values: ${a.toFixed(0)} ${b.toFixed(1)}`,
        `Values: ${a.toFixed(0)}.1 ${b.toFixed(0)}.2`,
      ],
    };
  }
}

export class FStringCash extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const a = randFloat(1, 10, 1);
    return { code: `
        ${x} = ${a}
        f"Amount owed: \${${x}:.2f}"`,
      options: [
        `Amount owed: \$${a.toFixed(2)}`,
        `Amount owed: \$${a.toFixed(1)}`,
        `Amount owed: \$${a.toFixed(0)}`,
        `Amount owed: \$${a.toFixed(0)}.2`,
        `Amount owed: \$${a.toFixed(0)}.20`,
      ],
    };
  }
}

export const F_STRINGS: Topic = new Topic('f-strings', 'F-Strings', [
    new FStringSingle(),
    new FStringNone(),
    new FStringMulti(),
    new FStringFloats(),
    new FStringCash(),
], [BASIC_VARIABLES, STRING_CONCAT, STRING_LENGTH]);