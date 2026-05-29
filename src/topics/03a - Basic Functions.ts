import { Topic, EvalLastLineSubtopic, EvalLastLineQuestionGen, TopicContext } from '../topics';
import { randInt, randInts, randChoice, randChoices, randVars, randFuncs, range, STRINGS } from '../util';
import { STRING_CONCAT } from './StringConcat';
import { STRING_LENGTH } from './StringLength';
import { STRING_INDEX } from './StringIndexing';
import { BASIC_FUNCTIONS } from './BasicFunctions';
import { FUNC_WITH_MULTIPLE_ARGS } from './FuncWithMultipleArgs';
import { FUNC_WITH_MULTIPLE_CALLS } from './FuncWithMultipleCalls';
import dedent from 'dedent-js';

// Example Shared Code:
// def foo(b):
//     return b + 2
// def bar(b):
//     return b[0]
// def baz(x, y):
//     return x * 2 + y
// x = 2
// y = 3
// a = 'hello'
// b = "​​world"

// Example Questions:
// foo(1)
// foo(x)
// foo(y)
// bar('alice')
// bar(a)
// bar(b)
// foo(foo(0))
// foo(foo(x))
// foo(len(bar(a)))
// str(foo(x)) + bar(b)
// foo(y) + len(bar(a))
// baz(x, y)
// baz(y, x)
// baz(len(a), len(b))

class Practice03ABasicFunctionsContext extends TopicContext {
  funs: string[];
  var1: string;
  var2: string;
  var3: string;
  var4: string;
  val1: bigint;
  val2: bigint;
  val3: string;
  val4: string;
  constructor() {
    super();
    const [fun1, fun2, fun3] = randFuncs(3);
    const [var1, var2, var3, var4] = randVars(4);
    const [val1, val2] = randInts(1n, 8n, 2);
    const [val3, val4] = randChoices(STRINGS, 2);
    this.funs = [fun1, fun2, fun3];
    this.var1 = var1;
    this.var2 = var2;
    this.var3 = var3;
    this.var4 = var4;
    this.val1 = val1;
    this.val2 = val2;
    this.val3 = val3;
    this.val4 = val4;
    this.sharedCode = dedent`
      def ${fun1}(${var3}):
          return ${var3} + 2
      def ${fun2}(${var4}):
          return ${var4}[0]
      def ${fun3}(${var1}, ${var2}):
          return ${var1} * 2 + ${var2}
      ${var1} = ${val1}
      ${var2} = ${val2}
      ${var3} = '${val3}'
      ${var4} = "${val4}"
    `;
  }
}

class Practice03ABasicFunctions_1 extends EvalLastLineSubtopic {
  gen(ctx: Practice03ABasicFunctionsContext): EvalLastLineQuestionGen {
    return { code: `${ctx.funs[0]}(${randInt(1n, 8n)})`, options: [...range(1n, 12n)] };
  }
}

class Practice03ABasicFunctions_2 extends EvalLastLineSubtopic {
  gen(ctx: Practice03ABasicFunctionsContext): EvalLastLineQuestionGen {
    return { code: `${ctx.funs[0]}(${ctx.var2})`, options: [...range(1n, 12n)] };
  }
}

class Practice03ABasicFunctions_3 extends EvalLastLineSubtopic {
  gen(ctx: Practice03ABasicFunctionsContext): EvalLastLineQuestionGen {
    return { code: `${ctx.funs[0]}(${ctx.var3})`, options: [...range(1n, 12n)] };
  }
}

class Practice03ABasicFunctions_4 extends EvalLastLineSubtopic {
  gen(ctx: Practice03ABasicFunctionsContext): EvalLastLineQuestionGen {
    const lastString = randChoice(STRINGS);
    return {
      code: `${ctx.funs[1]}("${lastString}")`,
      options: [lastString, ctx.var4, ctx.val4, 0n, ctx.funs[1], ctx.val3[1], ctx.val3[0], ctx.val3],
    };
  }
}

class Practice03ABasicFunctions_5 extends EvalLastLineSubtopic {
  gen(ctx: Practice03ABasicFunctionsContext): EvalLastLineQuestionGen {
    return {
      code: `${ctx.funs[1]}(${ctx.var3})`,
      options: [ctx.var3, ctx.val3, ctx.var4, ctx.val4, 0n, ctx.funs[1], ctx.val3[1], ctx.val3[0], ctx.val3],
    };
  }
}

class Practice03ABasicFunctions_6 extends EvalLastLineSubtopic {
  gen(ctx: Practice03ABasicFunctionsContext): EvalLastLineQuestionGen {
    return {
      code: `${ctx.funs[1]}(${ctx.var4})`,
      options: [ctx.var3, ctx.val3, ctx.var4, ctx.val4, 0n, ctx.funs[1], ctx.val3[1], ctx.val3[0], ctx.val3],
    };
  }
}

class Practice03ABasicFunctions_7 extends EvalLastLineSubtopic {
  gen(ctx: Practice03ABasicFunctionsContext): EvalLastLineQuestionGen {
    return { code: `${ctx.funs[0]}(${ctx.funs[0]}(0))`, options: [...range(1n, 12n)] };
  }
}

class Practice03ABasicFunctions_8 extends EvalLastLineSubtopic {
  gen(ctx: Practice03ABasicFunctionsContext): EvalLastLineQuestionGen {
    return { code: `${ctx.funs[0]}(${ctx.funs[0]}(${ctx.var1}))`, options: [...range(1n, 15n)] };
  }
}

class Practice03ABasicFunctions_9 extends EvalLastLineSubtopic {
  gen(ctx: Practice03ABasicFunctionsContext): EvalLastLineQuestionGen {
    return {
      code: `${ctx.funs[0]}(len(${ctx.funs[1]}(${ctx.var3})))`,
      options: [...range(1n, 12n), ctx.var3, ctx.val3, ctx.var4, ctx.val4, 0n, ctx.funs[0], ctx.funs[1]],
    };
  }
}

class Practice03ABasicFunctions_10 extends EvalLastLineSubtopic {
  gen(ctx: Practice03ABasicFunctionsContext): EvalLastLineQuestionGen {
    return {
      code: `str(${ctx.funs[0]}(${ctx.var1})) + ${ctx.funs[1]}(${ctx.var4})`,
      options: [
        ctx.var1, ctx.var2, ctx.var3, ctx.var4,
        ctx.val1, ctx.val2, ctx.val3, ctx.val4,
        0n, ctx.funs[0], ctx.funs[1],
        `3${ctx.val3[0]}`, `3${ctx.val3[1]}`,
        `4${ctx.val3[0]}`, `4${ctx.val3[1]}`,
        `5${ctx.val3[0]}`, `5${ctx.val3[1]}`,
        `6${ctx.val3[0]}`, `6${ctx.val3[1]}`,
        `7${ctx.val3[0]}`, `7${ctx.val3[1]}`,
        `8${ctx.val3[0]}`, `8${ctx.val3[1]}`,
        `9${ctx.val3[0]}`, `9${ctx.val3[1]}`,
        `10${ctx.val3[0]}`, `10${ctx.val3[1]}`,
      ],
    };
  }
}

class Practice03ABasicFunctions_11 extends EvalLastLineSubtopic {
  gen(ctx: Practice03ABasicFunctionsContext): EvalLastLineQuestionGen {
    return { code: `${ctx.funs[0]}(${ctx.var3}) + len(${ctx.funs[1]}(${ctx.var4}))`, options: [...range(0n, 15n)] };
  }
}

class Practice03ABasicFunctions_12 extends EvalLastLineSubtopic {
  gen(ctx: Practice03ABasicFunctionsContext): EvalLastLineQuestionGen {
    return { code: `${ctx.funs[2]}(${ctx.var1}, ${ctx.var2})`, options: [...range(0n, 20n)] };
  }
}

class Practice03ABasicFunctions_13 extends EvalLastLineSubtopic {
  gen(ctx: Practice03ABasicFunctionsContext): EvalLastLineQuestionGen {
    return { code: `${ctx.funs[2]}(${ctx.var2}), ${ctx.var1})`, options: [...range(0n, 20n)] };
  }
}

class Practice03ABasicFunctions_14 extends EvalLastLineSubtopic {
  gen(ctx: Practice03ABasicFunctionsContext): EvalLastLineQuestionGen {
    return { code: `${ctx.funs[2]}(len(${ctx.var3}), len(${ctx.var4}))`, options: [...range(0n, 20n)] };
  }
}

export const PRACTICE_03A_BASIC_FUNCTIONS = new Topic('practice-03a-basic-functions', '03a Basic Functions', [
  new Practice03ABasicFunctions_1(),
  new Practice03ABasicFunctions_2(),
  new Practice03ABasicFunctions_3(),
  new Practice03ABasicFunctions_4(),
  new Practice03ABasicFunctions_5(),
  new Practice03ABasicFunctions_6(),
  new Practice03ABasicFunctions_7(),
  new Practice03ABasicFunctions_8(),
  new Practice03ABasicFunctions_9(),
  new Practice03ABasicFunctions_10(),
  new Practice03ABasicFunctions_11(),
  new Practice03ABasicFunctions_12(),
  new Practice03ABasicFunctions_13(),
  new Practice03ABasicFunctions_14(),
], [BASIC_FUNCTIONS, FUNC_WITH_MULTIPLE_ARGS, FUNC_WITH_MULTIPLE_CALLS, STRING_CONCAT, STRING_LENGTH, STRING_INDEX],
{order: 'sequential', generateContext: () => new Practice03ABasicFunctionsContext()});
