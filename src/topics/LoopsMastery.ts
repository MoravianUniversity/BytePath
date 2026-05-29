import { Topic, EvalLastLineSubtopic, CodeOutputSubtopic, EvalLastLineQuestionGen, CodeOutputQuestionGen } from '../topics';
import { randInts, randChoice, randChoices, randIntNum, randVars, randInt } from '../util';
import { toPyAtom, toPyStr } from '../python.ts';

import { WHILE_LOOPS } from './WhileLoops';
import { FOR_LOOP_BASICS } from './ForLoopBasics';
import { FOR_LOOP_WITH_RANGE } from './ForLoopWithRange';
import { FOR_LOOP_NESTING } from './ForLoopNesting';

const ANIMALS = ["cat", "dog", "bird", "fish", "snake", "turtle", "duck", "cow", "pig"]
const VAR_NAMES_LONG = ["foo", "bar", "baz", "qux", "quux"]

class ReadRangeBasic extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const a = randInt(3n, 6n);
    return {
      code: `# The list() creates a list of all of the numbers from the range()
list(range(${a}))`,
    };
  }
}

class ReadRangeStartStop extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    let [a, b] = randInts(3n, 6n, 2);
    if (a > b) { [a, b] = [b, a]; }
    return { code: `list(range(${a}, ${b}))` };
  }
}

class ReadRangeStartStopBackwards extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    let [a, b] = randInts(3n, 6n, 2);
    if (a < b) { [a, b] = [b, a]; }
    return { code: `list(range(${a}, ${b}))` };
  }
}

class NumberOfLoopsList extends EvalLastLineSubtopic {
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
  gen(): CodeOutputQuestionGen {
    let [outer, inner] = randInts(2n, 4n, 2);
    if (outer > inner) { [outer, inner] = [inner, outer]; }
    if (outer === 2n) { [outer, inner] = [inner, outer]; }
    const [x, y, z] = randVars(3);
    return { code: `
      for ${x} in range(1, ${outer}):
          ${y} = ''
          for ${z} in range(${inner}):
              ${y} += str(${z})
          print(${x}, ${y})` };
  }
}

class LongCode extends CodeOutputSubtopic {
  gen(): CodeOutputQuestionGen {
    const fun = randChoice(["build", "compute", "process", "fun"]);
    const var_names = randVars(3);
    const param = var_names.pop();
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
      const [v1, v2] = var_names;
      fun_code = `    ${v1} = ${toPyStr(letter)}
        for ${v2} in range(${param}):
            ${v1} += str(${v2})
        return ${v1}`;
    } else if (style === 3) {
      // list of str -> str
      const [v1, v2] = var_names;
      fun_code = `    ${v1} = ""
        for ${v2} in range(len(${param})):
            if ${v2} > 2:
                ${v1} += ${param}[${v2}].lower()
            else:
                ${v1} += ${param}[${v2}].upper()
        return ${v1}`;
    } else if (style === 4) {
      // str -> list of str
      const [v1, v2] = var_names;
      fun_code = `    ${v1} = []
        for ${v2} in ${param}:
            if ${v2} in "aeiou":
                ${v1}.append(${v2})
            else:
                ${v1}.append(${v2}.upper())
        return ${v1}`;
    }

    let main_code = "";
    if (style == 1 || style == 2) {
      const [v1, v2] = randChoices(var_names, 2);
      main_code = `    ${v1} = ${randInt(1n, 5n)}
        ${v2} = ${fun}(${v1})
        print(len(${v2}))
        for ${v1} in ${v2}:
            print(${v1})`;
    } else if (style == 3 || style == 4) {
      const [v1, v2] = randChoices(var_names, 2);
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
{order: 'sequential', forceQuiz: true});
