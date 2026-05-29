import { Topic, EvalLastLineSubtopic, EvalLastLineQuestionGen, TopicContext } from '../topics';
import { randInt, randIntNum, range, randVars, randChoice, randChoices, STRINGS } from '../util';
import { PRACTICE_03A_FUNCTIONS } from './03a - Functions';
import dedent from 'dedent-js';

// Example code:
// x = 2
// a = 'dog'
// b ​= "yak"
// def waldo(b):
//     return len(b) / 2
// def carmen(a, b):
//     return a[0] + b[1]

// Example Questions:
// len(a)
// b[x]
// len(a + b) 
// waldo("a")
// waldo("star")
// waldo(a)
// waldo(b)
// carmen("a", "bx")
// carmen(a, b)
// carmen(b, a)
// carmen(a, carmen(a, b))
// carmen(carmen(a, b), a)
// waldo(carmen(b, a))

class Func3AExtraContext extends TopicContext {
  vars: string[];
  val1: bigint;
  val2: string;
  val3: string;
  constructor() {
    super();
    const [var1, var2, var3] = randVars(3);
    const [val2, val3] = randChoices(STRINGS, 2);
    const val1 = randInt(1n, BigInt(Math.min(val2.length, val3.length)));
    this.vars = [var1, var2, var3];
    this.val1 = val1;
    this.val2 = val2;
    this.val3 = val3;
    this.sharedCode = dedent`
      ${var1} = ${val1}
      ${var2} = "${val2}"
      ${var3} = '${val3}'
      def waldo(${var3}):
          return len(${var3}) / 2
      def carmen(${var1}, ${var2}):
          return ${var1}[0] + ${var2}[1]
    `;
  }
}

class Func3AExtra_1 extends EvalLastLineSubtopic {
  gen(ctx: Func3AExtraContext): EvalLastLineQuestionGen {
    return { code: `len(${ctx.vars[randIntNum(1, 2)]})`, options: [0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n] };
  }
}

class Func3AExtra_2 extends EvalLastLineSubtopic {
  gen(ctx: Func3AExtraContext): EvalLastLineQuestionGen {
    return { code: `${ctx.vars[randIntNum(1, 2)]}[${ctx.vars[0]}]`, options: [...ctx.val2, ...ctx.val3] };
  }
}

class Func3AExtra_3 extends EvalLastLineSubtopic {
  gen(ctx: Func3AExtraContext): EvalLastLineQuestionGen {
    const [var1, var2] = randChoices(ctx.vars.slice(1), 2);
    return {
      code: `len(${var1} + ${var2})`,
      options: [0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n, 11n, 12n, 13n, 14n, 15n],
    };
  }
}

class Func3AExtra_4 extends EvalLastLineSubtopic {
  gen(ctx: Func3AExtraContext): EvalLastLineQuestionGen {
    return {
      code: `waldo("${ctx.vars[randIntNum(1, 2)]}")`,
      options: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 0n, 1n, 2n, 3n, 4n, 5n],
    };
  }
}

class Func3AExtra_5 extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    return {
      code: `waldo("${randChoice(STRINGS)}")`,
      options: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 0n, 1n, 2n, 3n, 4n, 5n],
    };
  }
}

class Func3AExtra_6 extends EvalLastLineSubtopic {
  gen(ctx: Func3AExtraContext): EvalLastLineQuestionGen {
    return {
      code: `waldo(${ctx.vars[randIntNum(1, 2)]})`,
      options: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 0n, 1n, 2n, 3n, 4n, 5n],
    };
  }
}

class Func3AExtra_7 extends EvalLastLineSubtopic {
  gen(ctx: Func3AExtraContext): EvalLastLineQuestionGen {
    return {
      code: `carmen("${ctx.vars[1]}", "${ctx.vars[2]}${ctx.vars[0]}")`,
      options: [
        `"${ctx.vars[1]}${ctx.vars[2]}${ctx.vars[0]}"`,
        `"${ctx.vars[0]}${ctx.vars[1]}${ctx.vars[2]}"`,
        `"${ctx.vars[2]}${ctx.vars[0]}${ctx.vars[1]}"`,
        `"${ctx.vars[2]}${ctx.vars[1]}${ctx.vars[0]}"`,
        `"${ctx.vars[1]}${ctx.vars[0]}${ctx.vars[2]}"`,
        `"${ctx.vars[0]}${ctx.vars[2]}${ctx.vars[1]}"`,
        `"${ctx.vars[2]}${ctx.vars[1]}${ctx.vars[0]}"`,
        `"${ctx.vars[1]}${ctx.vars[0]}${ctx.vars[2]}"`,
        `"${ctx.vars[0]}${ctx.vars[2]}${ctx.vars[1]}"`,
        `"${ctx.val2[0]}${ctx.val3[1]}"`,
        `"${ctx.val3[0]}${ctx.val2[1]}"`,
      ],
    };
  }
}

class Func3AExtra_8 extends EvalLastLineSubtopic {
  gen(ctx: Func3AExtraContext): EvalLastLineQuestionGen {
    return {
      code: `carmen(${ctx.vars[1]}, ${ctx.vars[2]})`,
      options: [
        `"${ctx.vars[1]}${ctx.vars[2]}"`,
        `"${ctx.vars[2]}${ctx.vars[1]}"`,
        `"${ctx.val3}${ctx.val2}"`,
        `"${ctx.val2[0]}${ctx.val3[1]}"`,
        `"${ctx.val3[0]}${ctx.val2[1]}"`,
        `"${ctx.val2[1]}${ctx.val3[2]}"`,
        `"${ctx.val3[1]}${ctx.val2[2]}"`,
        `"${ctx.val2[1]}${ctx.val3[0]}"`,
        `"${ctx.val3[1]}${ctx.val2[0]}"`,
      ],
    };
  }
}

class Func3AExtra_9 extends EvalLastLineSubtopic {
  gen(ctx: Func3AExtraContext): EvalLastLineQuestionGen {
    return {
      code: `carmen(${ctx.vars[2]}, ${ctx.vars[1]})`,
      options: [
        `"${ctx.vars[1]}${ctx.vars[2]}"`,
        `"${ctx.vars[2]}${ctx.vars[1]}"`,
        `"${ctx.val3}${ctx.val2}"`,
        `"${ctx.val2[0]}${ctx.val3[1]}"`,
        `"${ctx.val3[0]}${ctx.val2[1]}"`,
        `"${ctx.val2[1]}${ctx.val3[2]}"`,
        `"${ctx.val3[1]}${ctx.val2[2]}"`,
        `"${ctx.val2[1]}${ctx.val3[0]}"`,
        `"${ctx.val3[1]}${ctx.val2[0]}"`,
      ],
    };
  }
}

class Func3AExtra_10 extends EvalLastLineSubtopic {
  gen(ctx: Func3AExtraContext): EvalLastLineQuestionGen {
    return {
      code: `carmen(${ctx.vars[1]}, carmen(${ctx.vars[1]}, ${ctx.vars[2]}))`,
      options: [
        `"${ctx.vars[1]}${ctx.vars[1]}${ctx.vars[2]}"`,
        `"${ctx.vars[2]}${ctx.vars[2]}${ctx.vars[1]}"`,
        `"${ctx.val3}${ctx.val2}${ctx.val2}"`,
        `"${ctx.vars[1]}${ctx.vars[2]}${ctx.vars[2]}"`,
        `"${ctx.val2[0]}${ctx.val2[1]}${ctx.val3[1]}"`,
        `"${ctx.val3[0]}${ctx.val2[1]}${ctx.val3[1]}"`,
        `"${ctx.val2[1]}${ctx.val3[2]}${ctx.val2[2]}"`,
        `"${ctx.val3[1]}${ctx.val2[2]}${ctx.val3[2]}"`,
        `"${ctx.val2[1]}${ctx.val3[0]}${ctx.val2[0]}"`,
        `"${ctx.val3[1]}${ctx.val2[0]}${ctx.val3[0]}"`,
      ],
    };
  }
}

class Func3AExtra_11 extends EvalLastLineSubtopic {
  gen(ctx: Func3AExtraContext): EvalLastLineQuestionGen {
    return {
      code: `carmen(carmen(${ctx.vars[1]}, ${ctx.vars[2]}), ${ctx.vars[1]})`,
      options: [
        `"${ctx.vars[1]}${ctx.vars[1]}${ctx.vars[2]}"`,
        `"${ctx.vars[2]}${ctx.vars[2]}${ctx.vars[1]}"`,
        `"${ctx.val3}${ctx.val2}${ctx.val2}"`,
        `"${ctx.vars[1]}${ctx.vars[2]}${ctx.vars[2]}"`,
        `"${ctx.val2[0]}${ctx.val2[1]}${ctx.val3[1]}"`,
        `"${ctx.val3[0]}${ctx.val2[1]}${ctx.val3[1]}"`,
        `"${ctx.val2[1]}${ctx.val3[2]}${ctx.val2[2]}"`,
        `"${ctx.val3[1]}${ctx.val2[2]}${ctx.val3[2]}"`,
        `"${ctx.val2[1]}${ctx.val3[0]}${ctx.val2[0]}"`,
        `"${ctx.val3[1]}${ctx.val2[0]}${ctx.val3[0]}"`,
      ],
    };
  }
}

class Func3AExtra_12 extends EvalLastLineSubtopic {
  gen(ctx: Func3AExtraContext): EvalLastLineQuestionGen {
    return {
      code: `waldo(carmen(${ctx.vars[2]}, ${ctx.vars[1]}))`,
      options: [
        ...range(0n, 5n),
        `"${ctx.vars[1]}${ctx.vars[2]}"`,
        `"${ctx.vars[2]}${ctx.vars[1]}"`,
        `"${ctx.val3}${ctx.val2}"`,
      ],
    };
  }
}

export const PRACTICE_03A_FUNCTIONS_EXTRA = new Topic('practice-03a-functions-extra', '03a More Functions', [
  new Func3AExtra_1(),
  new Func3AExtra_2(),
  new Func3AExtra_3(),
  new Func3AExtra_4(),
  new Func3AExtra_5(),
  new Func3AExtra_6(),
  new Func3AExtra_7(),
  new Func3AExtra_8(),
  new Func3AExtra_9(),
  new Func3AExtra_10(),
  new Func3AExtra_11(),
  new Func3AExtra_12(),
], [PRACTICE_03A_FUNCTIONS], {order: 'sequential', generateContext: () => new Func3AExtraContext()});
