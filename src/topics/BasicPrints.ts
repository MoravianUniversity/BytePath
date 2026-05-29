import { Topic, CodeOutputSubtopic, CodeOutputQuestionGen } from '../topics';
import { randInt, randChoice, randChoices, STRINGS, randVariable } from '../util';
import { STRING_CONCAT } from './StringConcat';

export class PrintString extends CodeOutputSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'When printing a string, the quotes are not shown in the output and each `print()` ends up on a new line.',
    },
  ];
  gen(): CodeOutputQuestionGen {
    const [a, b] = randChoices(STRINGS, 2);
    return { code: `
      print("${a}")
      print('${b}')
    `, options: [
      `${a}`, `${b}`,
      `${a}\n${b}`,
      `${b}\n${a}`,
      `"${a}"\n'${b}'`,
      `'${b}'\n"${a}"`,
      `"${a}${b}"`,
      `"${a} ${b}"`,
      `${a}${b}`,
      `${b}${a}`,
      `${a} ${b}`,
    ] };
  }
}

export class PrintStringMulti extends CodeOutputSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'When printing multiple strings with a single `print()`, they are printed on the same line, separated by a space.',
    },
  ];
  gen(): CodeOutputQuestionGen {
    const [a, b] = randChoices(STRINGS, 2);
    return { code: `
      print('${a}', "${b}")
    `, options: [
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
    ] };
  }
}

export class PrintStringVar extends CodeOutputSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'When printing a variable, the value of the variable is printed, not the variable name.',
    },
  ];
  gen(): CodeOutputQuestionGen {
    const x = randVariable();
    const a = randChoice(STRINGS);
    return { code: `
      ${x} = "${a}"
      print(${x})
    `, options: [
      x, a,
      `"${x}"`,
      `'${x}'`,
      `"${a}"`,
      `'${a}'`
    ] };
  }
}

export class PrintStringVar2 extends CodeOutputSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'Make sure to pay attention to variables vs string literals.',
    },
  ];
  gen(): CodeOutputQuestionGen {
    const x = randVariable();
    const [a, b] = randChoices(STRINGS, 2);
    return { code: `
      ${x} = "${a}"
      print(${x})
      print("${b}")
    `, options: [
      `${x}\n${b}`,
      `"${a}"\n'${b}'`,
      `'${b}'\n"${a}"`,
      `${x}${b}`,
      `${x} ${b}`,
      `${a}${b}`,
      `${b}${a}`,
      `${a} ${b}`,
    ] };
  }
}

export class PrintStringMultiVar extends CodeOutputSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'Make sure to pay attention to variables vs string literals when printing.',
    },
  ];
  gen(): CodeOutputQuestionGen {
    const x = randVariable();
    const [a, b, c] = randChoices(STRINGS, 3);
    return { code: `
      ${x} = "${a}"
      ${b} = "${c}"
      print(${x}, "${b}")
      print("${x}", ${b})
    `, options: [
      `${x} ${b}\n${x} ${b}`,
      `${x} ${b}\n${x} ${c}`,
      `${x} ${b}\n${a} ${b}`,
      `${x} ${b}\n${a} ${c}`,
      `${x} ${b}\n${a} ${b}`,
    ] };
  }
}

export class PrintStringUpdateVar extends CodeOutputSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'Remember to read each line of code one at a time and update the variable with the new value at the correct time.',
    },
  ];
  gen(): CodeOutputQuestionGen {
    const x = randVariable();
    const [a, b] = randChoices(STRINGS, 2);
    return { code: `
      ${x} = "${a}"
      print(${x})
      ${x} = "${b}"
      print(${x})
    `, options: [
      `${a}\n${a}`,
      `${b}\n${b}`,
      `${b}\n${a}`,
      `${x}\n${a}`,
      `${x}\n${b}`,
      `${x}\n${x}`,
    ] };
  }
}

export class PrintStringWithMath extends CodeOutputSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'The math expression is evaluated before printing the result.',
    },
  ];
  gen(): CodeOutputQuestionGen {
    const a = randInt(1n, 10n);
    const b = randInt(1n, 10n);
    return { code: `
      print(${a} + ${b})
    `, options: [
      `${a} + ${b}`,
      `"${a} + ${b}"`,
      `"${a}" + "${b}"`,
      `${a}${b}`,
      `"${a}${b}"`,
    ] };
  }
}

export class PrintStringWithQuotedMath extends CodeOutputSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'Inside a string literal, the math expression is never evaluated since it is literal text.',
    },
  ];
  gen(): CodeOutputQuestionGen {
    const a = randInt(1n, 10n);
    const b = randInt(1n, 10n);
    return { code: `
      print("${a} + ${b}")
    `, options: [
      `${a + b}`,
      `"${a} + ${b}"`,
      `"${a}" + "${b}"`,
      `${a}${b}`,
      `"${a}${b}"`,
    ] };
  }
}

export class PrintStringWithQuotedMath2 extends CodeOutputSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 2,
      message: 'Remember that string concatenation and not numeric addition is done when the values are string literals.',
    },
  ];
  gen(): CodeOutputQuestionGen {
    const a = randInt(1n, 10n);
    const b = randInt(1n, 10n);
    return { code: `
      print("${a}" + "${b}")
    `, options: [
      `${a + b}`,
      `"${a}" + "${b}"`,
      `"${a} + ${b}"`,
      `${a} + ${b}`,
      `"${a}${b}"`,
    ] };
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
