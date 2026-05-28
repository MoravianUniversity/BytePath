import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext } from '../topics';
import { randInt, randIntNum, randVariable, randVars, randFunc, range } from '../util';
import { FUNC_WITH_MULTIPLE_ARGS } from './FuncWithMultipleArgs';
import { randOperation } from './BasicVariables';


function genFunction(): [string, number, string] {
  const func = randFunc();
  const style = randIntNum(1, 15);
  if (style <= 3) {
    const arg = randVariable();
    return [func, 1, `
      def ${func}(${arg}):
          return ${arg}
      `];
  } else if (style === 4 || style === 5) {
    const a = randInt(1n, 5n);
    const op = randOperation();
    const arg = randVariable();
    return [func, 1, `
      def ${func}(${arg}):
          return ${arg} ${op} ${a}
      `];
  } else if (style === 6 || style === 7) {
    const op = randOperation();
    const [arg1, arg2] = randVars(2);
    return [func, 2, `
      def ${func}(${arg1}, ${arg2}):
          return ${arg1} ${op} ${arg2}
      `];
  } else if (style === 8 || style === 9) {
    const [arg1, arg2, var1] = randVars(3);
    const op = randOperation();
    return [func, 2, `
      def ${func}(${arg1}, ${arg2}):
          ${var1} = ${arg1} ${op} ${arg2}
          return ${var1}
      `];
  } else if (style === 10) {
    const [arg1, arg2, var1] = randVars(3);
    const c = randInt(1n, 5n);
    const op1 = randOperation();
    const op2 = randOperation();
    return [func, 2, `
      def ${func}(${arg1}, ${arg2}):
          ${var1} = ${arg1} ${op1} ${c}
          return ${var1} ${op2} ${arg2}
      `];
  } else if (style === 11) {
    const [arg1, arg2, var1] = randVars(3);
    const c = randInt(1n, 5n);
    const op1 = randOperation();
    const op2 = randOperation();
    return [func, 2, `
      def ${func}(${arg1}, ${arg2}):
          ${var1} = ${arg1} ${op1} ${c}
          return ${var1} ${op2} ${arg2}
      `];
  } else if (style === 12) {
    const [arg1, arg2, var1] = randVars(3);
    const c = randInt(1n, 5n);
    const op1 = randOperation();
    const op2 = randOperation();
    return [func, 2, `
      def ${func}(${arg1}, ${arg2}):
          ${var1} = ${arg1} ${op1} ${arg2}
          return ${var1} ${op2} ${c}
      `];
  } else if (style === 13 || style === 14) {
    const [arg1, arg2] = randVars(2);
    const op = randOperation();
    return [func, 2, `
      def ${func}(${arg1}, ${arg2}):
          ${arg1} = ${arg1} ${op} ${arg2}
          return ${arg1}
      `];
  } else {
    const [arg1, arg2, arg3] = randVars(3);
    const op1 = randOperation();
    const op2 = randOperation();
    return [func, 3, `
      def ${func}(${arg1}, ${arg2}, ${arg3}):
          return ${arg1} ${op1} ${arg2} ${op2} ${arg3}
      `];
  }
}

function args(numArgs: number, fixedArgs: string[] = []): string {
  const args = [];
  for (let i = 0; i < numArgs; i++) {
    args.push(fixedArgs[i] || randInt(1n, 6n).toString());
  }
  return args.join(', ');
}


class FuncCallsAdd extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [func, numArgs, funcCode] = genFunction();
    const args1 = args(numArgs);
    const args2 = args(numArgs);
    const code = `${funcCode}
      ${func}(${args1}) + ${func}(${args2})
    `;
    return createQuestion(code, range(-15n, 15n), {}, ctx);
  }
}

class FuncCallsSub extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [func, numArgs, funcCode] = genFunction();
    const args1 = args(numArgs);
    const args2 = args(numArgs);
    const code = `${funcCode}
      ${func}(${args1}) - ${func}(${args2})
    `;
    return createQuestion(code, range(-15n, 15n), {}, ctx);
  }
}

class FuncCallsNested extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [func, numArgs, funcCode] = genFunction();
    const args1 = args(numArgs);
    const args2 = args(numArgs, [`${func}(${args1})`]);
    const code = `${funcCode}
      ${func}(${args2})
    `;
    return createQuestion(code, range(-15n, 15n), {}, ctx);
  }
}

class FuncCallsNested2 extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    let [func, numArgs, funcCode] = genFunction();
    while (numArgs !== 2) {
      [func, numArgs, funcCode] = genFunction();
    }
    const args1 = args(numArgs);
    const args2 = args(numArgs, ["", `${func}(${args1})`]);
    const code = `${funcCode}
      ${func}(${args2})
    `;
    return createQuestion(code, range(-15n, 15n), {}, ctx);
  }
}

class FuncCallsNested2Both extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    let [func, numArgs, funcCode] = genFunction();
    while (numArgs !== 2) {
      [func, numArgs, funcCode] = genFunction();
    }
    const args1 = args(numArgs);
    const args2 = args(numArgs);
    const args3 = args(numArgs, [`${func}(${args1})`, `${func}(${args2})`]);
    const code = `${funcCode}
      ${func}(${args3})
    `;
    return createQuestion(code, range(-15n, 15n), {}, ctx);
  }
}

class FuncCallsAddNested extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [func, numArgs, funcCode] = genFunction();
    const args1 = args(numArgs);
    const args2 = args(numArgs);
    const args3 = args(numArgs, [`${func}(${args1}) + ${func}(${args2})`]);
    const code = `${funcCode}
      ${func}(${args3})
    `;
    return createQuestion(code, range(-15n, 15n), {}, ctx);
  }
}

class FuncCallsNestedAdd extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [func, numArgs, funcCode] = genFunction();
    const args1 = args(numArgs);
    const args2 = args(numArgs, [`${func}(${args1})`]);
    const args3 = args(numArgs);
    const code = `${funcCode}
      ${func}(${args2}) + ${func}(${args3})
    `;
    return createQuestion(code, range(-15n, 15n), {}, ctx);
  }
}

class Func2CallsAdd extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [func1, numArgs1, funcCode1] = genFunction();
    let [func2, numArgs2, funcCode2] = genFunction();
    while (func2 === func1) {
      [func2, numArgs2, funcCode2] = genFunction();
    }
    const args1 = args(numArgs1);
    const args2 = args(numArgs2);
    const code = `${funcCode1}${funcCode2}
      ${func1}(${args1}) + ${func2}(${args2})
    `;
    return createQuestion(code, range(-15n, 15n), {}, ctx);
  }
}

class Func2CallsAddBackwards extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [func1, numArgs1, funcCode1] = genFunction();
    let [func2, numArgs2, funcCode2] = genFunction();
    while (func2 === func1) {
      [func2, numArgs2, funcCode2] = genFunction();
    }
    const args1 = args(numArgs1);
    const args2 = args(numArgs2);
    const code = `${funcCode1}${funcCode2}
      ${func2}(${args2}) + ${func1}(${args1})
    `;
    return createQuestion(code, range(-15n, 15n), {}, ctx);
  }
}

class Func2CallsNested extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [func1, numArgs1, funcCode1] = genFunction();
    let [func2, numArgs2, funcCode2] = genFunction();
    while (func2 === func1) {
      [func2, numArgs2, funcCode2] = genFunction();
    }
    const args2 = args(numArgs2);
    const args1 = args(numArgs1, [`${func2}(${args2})`]);
    const code = `${funcCode1}${funcCode2}
      ${func1}(${args1})
    `;
    return createQuestion(code, range(-15n, 15n), {}, ctx);
  }
}

class Func2CallsNestedBackwards extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [func1, numArgs1, funcCode1] = genFunction();
    let [func2, numArgs2, funcCode2] = genFunction();
    while (func2 === func1) {
      [func2, numArgs2, funcCode2] = genFunction();
    }
    const args1 = args(numArgs1);
    const args2 = args(numArgs2, [`${func1}(${args1})`]);
    const code = `${funcCode1}${funcCode2}
      ${func2}(${args2})
    `;
    return createQuestion(code, range(-15n, 15n), {}, ctx);
  }
}

export const FUNC_WITH_MULTIPLE_CALLS: Topic = new Topic('func-with-multiple-calls', 'Functions with Multiple Calls', [
  new FuncCallsAdd(),
  new FuncCallsSub(),
  new FuncCallsNested(),
  new FuncCallsNested2(),
  new FuncCallsNested2Both(),
  new FuncCallsAddNested(),
  new FuncCallsNestedAdd(),
  new Func2CallsAdd(),
  new Func2CallsAddBackwards(),
  new Func2CallsNested(),
  new Func2CallsNestedBackwards(),
], [FUNC_WITH_MULTIPLE_ARGS]);
