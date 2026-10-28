import { Topic, EvalLastLineSubtopic, CodeOutputSubtopic, EvalLastLineQuestionGen, CodeOutputQuestionGen } from '../topics';
import { randInts, randChoice, randChoices, randIntNum, randVars, randInt } from '../util';
import { toPyAtom, toPyStr } from '../python.ts';

import { WHILE_LOOPS } from './WhileLoops';
import { FOR_LOOP_BASICS } from './ForLoopBasics';
import { FOR_LOOP_WITH_RANGE } from './ForLoopWithRange';
import { FOR_LOOP_NESTING } from './ForLoopNesting';

const ANIMALS = ["cat", "dog", "bird", "fish", "snake", "turtle", "duck", "cow", "pig"]
const VAR_NAMES_LONG = ["foo", "bar", "baz", "qux", "quux"]
const VAR_NAMES_SHORT = ["a", "b", "c", "d", "s", "x", "y", "z"]

class ReadRangeBasic extends EvalLastLineSubtopic {
  readonly help = [
    {afterFailedAttempts: 1, message: 'The range function generates a sequence of numbers, starting from 0 and incrementing by 1, up to but not including the second argument. The `list()` function converts the range into a list.'}
  ];
  gen(): EvalLastLineQuestionGen {
    const a = randInt(3n, 6n);
    return {
      code: `# The list() creates a list of all of the numbers from the range()
list(range(${a}))`,
    };
  }
}

class ReadRangeStartStop extends EvalLastLineSubtopic {
  readonly help = [
    {afterFailedAttempts: 1, message: 'The range function generates a sequence of numbers, starting from the first argument and incrementing by 1, up to but not including the second argument. The `list()` function converts the range into a list.'}
  ];
  gen(): EvalLastLineQuestionGen {
    let [a, b] = randInts(3n, 6n, 2);
    if (a > b) { [a, b] = [b, a]; }
    return { code: `list(range(${a}, ${b}))` };
  }
}

class ReadRangeStartStopBackwards extends EvalLastLineSubtopic {
  readonly help = [
    {afterFailedAttempts: 1, message: 'The range function generates a sequence of numbers, starting from the first argument and incrementing by 1, up to but not including the second argument. The `list()` function converts the range into a list.'}
  ];
  gen(): EvalLastLineQuestionGen {
    let [a, b] = randInts(3n, 6n, 2);
    if (a < b) { [a, b] = [b, a]; }
    return { code: `list(range(${a}, ${b}))` };
  }
}

class NumberOfLoopsList extends EvalLastLineSubtopic {
  readonly help = [
    {afterFailedAttempts: 1, message: 'This counts the number of iterations of the loop, which is the number of elements in the list.'}
  ];
  gen(): EvalLastLineQuestionGen {
    const v = randChoice(VAR_NAMES_LONG);
    const [x, y] = randVars(2);
    const lst = randChoices(ANIMALS, randIntNum(2, 4));
    return { code: `
      ${v} = ${toPyAtom(lst)}
      ${y} = 0
      for ${x} in ${v}:
          ${y} += 1
      ${y}` };
  }
}

class NumberOfLoopsStr extends EvalLastLineSubtopic {
  readonly help = [
    {afterFailedAttempts: 1, message: 'This counts the number of iterations of the loop, which is the number of characters in the string.'}
  ];
  gen(): EvalLastLineQuestionGen {
    const v = randChoice(VAR_NAMES_LONG);
    const [x, y] = randVars(2);
    const str = randChoice(ANIMALS);
    return { code: `
      ${v} = ${toPyStr(str)}
      ${y} = 0
      for ${x} in ${v}:
          ${y} += 1
      ${y}` };
  }
}

class NumberOfLoopsRange extends EvalLastLineSubtopic {
  readonly help = [
    {afterFailedAttempts: 1, message: 'This counts the number of iterations of the loop, which is the number of elements in the range.'}
  ];
  gen(): EvalLastLineQuestionGen {
    const [x, y] = randVars(3);
    const num = randInt(3n, 5n);
    return { code: `
      ${y} = 0
      for ${x} in range(${num}):
          ${y} += 1
      ${y}` };
  }
}

class NumberOfLoopsRangeNested extends EvalLastLineSubtopic {
  readonly help = [
    {afterFailedAttempts: 1, message: 'This counts the number of iterations of the inner loop, which is the iterations of the outer loop times the iterations of the inner loop.'}
  ];
  gen(): EvalLastLineQuestionGen {
    const [x, y, z] = randVars(3);
    const [a, b] = randInts(2n, 4n, 2);
    return { code: `
      ${z} = 0
      for ${x} in range(${a}):
          for ${y} in range(${b}):
              ${z} += 1
      ${z}` };
  }
}

class ShortCode1 extends CodeOutputSubtopic {
  readonly help = [
    {afterFailedAttempts: 1, message: 'The for loop takes each word in the list, one at a time.'},
  ];
  gen(): CodeOutputQuestionGen {
    const words = (Math.random() < 0.7) ? randChoices(ANIMALS, 3) : ["Coding", "Is", "Fun!"];
    const [x, y, z, w] = randVars(4);
    return { code: `
      ${x} = ${toPyAtom(words)}
      ${y} = 0
      for ${z} in ${x}:
          ${y} += len(${z})
          print(${y}, ${z})
      for ${w} in range(len(${x})):
          print(${w}, ${x}[${w}])` };
  }
}

class ShortCode2 extends CodeOutputSubtopic {
  readonly help = [
    {afterFailedAttempts: 1, message: 'The for loop takes each number in the range, one at a time.'},
  ];
  gen(): CodeOutputQuestionGen {
    const [outer, inner] = randInts(2n, 4n, 2);
    const start = randInt(0n, 2n);
    const [i, j, s] = randChoices(VAR_NAMES_SHORT, 3);
    const style = randIntNum(1, 3);
    if (style === 1) {
      return { code: `
        for ${i} in range(${start}, ${start + outer}):
            for ${j} in range(${inner}):
                print(${i}, ${j})` };
    } else if (style === 2) {
      return { code: `
        for ${i} in range(1, ${outer + 1n}):
            ${s} = ''
            for ${j} in range(${inner}):
                ${s} += str(${j})
            print(${i}, ${s})` };
    } else {
      return { code: `
        ${s} = 0
        for ${i} in range(${outer}):
            for ${j} in range(${inner}):
                ${s} += 1
            print(${i}, ${s})` };
    }
  }
}

class LongCode extends CodeOutputSubtopic {
  readonly help = [
    {afterFailedAttempts: 1, message: 'The for loop takes each number in the range, one at a time.'},
  ];
  readonly showWorkspace = true;
  gen(): CodeOutputQuestionGen {
    const fun = randChoice(["build", "compute", "process", "fun", "func"]);
    const param = randChoice(VAR_NAMES_SHORT);
    const var_names = VAR_NAMES_SHORT.filter(v => v !== param);
    const style = randIntNum(1, 4);

    let fun_code = "";
    if (style === 1) {
      // int -> list of int
      const v = randChoice(var_names);
      fun_code = `    ${v} = []
        while ${param} > 0:
            ${param} -= 1
            ${v}.append(${param}*2)
        return ${v}`;
    } else if (style === 2) {
      // int -> str
      const letter = randChoice(['', 'a', 'b', 'c']);
      const [v1, v2] = randChoices(var_names, 2);
      fun_code = `    ${v1} = ${toPyStr(letter)}
        for ${v2} in range(${param}):
            ${v1} += str(${v2})
        return ${v1}`;
    } else if (style === 3) {
      // list of str -> str
      const [v1, v2] = randChoices(var_names, 2);
      fun_code = `    ${v1} = ""
        for ${v2} in range(len(${param})):
            if ${v2} > 2:
                ${v1} += ${param}[${v2}].lower()
            else:
                ${v1} += ${param}[${v2}].upper()
        return ${v1}`;
    } else {
      // str -> list of str
      const [v1, v2] = randChoices(var_names, 2);
      fun_code = `    ${v1} = []
        for ${v2} in ${param}:
            if ${v2} in "aeiou":
                ${v1}.append(${v2})
        return ${v1}`;
    }

    const [v1, v2] = randChoices(VAR_NAMES_SHORT, 2);
    let main_code = "";
    if (style === 1 || style === 2) {
      main_code = `    ${v1} = ${randInt(1n, 5n)}
        ${v2} = ${fun}(${v1})
        print(${v2})`;
    } else if (style === 3) {
      main_code = `    ${v1} = ['a', 'c', ${toPyStr(randChoice(ANIMALS))}]
        ${v2} = ${fun}(${v1})
        print(${v2})`;
    } else {
      main_code = `    ${v1} = ${toPyStr(randChoice(ANIMALS))}
        ${v2} = ['a', 'c', ${v1}, 'd']
        ${v1} = ${fun}(${v2})
        print(${v1}, ${v2})`;
    }

    return { code: `
def ${fun}(${param}):
    ${fun_code}

def main():
    ${main_code}

    main()` };
  }
}

export const LOOPS_MASTERY = new Topic('loops-mastery', "Loops Mastery", [
  new ReadRangeBasic(),
  new ReadRangeStartStop(),
  new ReadRangeStartStopBackwards(),
  new NumberOfLoopsList(),
  new NumberOfLoopsStr(),
  new NumberOfLoopsRange(),
  new NumberOfLoopsRangeNested(),
  new ShortCode1(),
  new ShortCode2(),
  new LongCode(),
], [WHILE_LOOPS, FOR_LOOP_BASICS, FOR_LOOP_WITH_RANGE, FOR_LOOP_NESTING],
{order: 'sequential', forceQuiz: true, skippable: true});
