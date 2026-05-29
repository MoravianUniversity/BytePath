import { Topic, EvalLastLineSubtopic, EvalLastLineQuestionGen } from '../topics';
import { randInts, randVariable, randVars, range, STRINGS, randChoices } from '../util';
import { BASIC_ARITHMETIC } from './BasicArithmetic';
import { BASIC_VARIABLES } from './BasicVariables';
import { STRING_CONCAT } from './StringConcat';

export class CompoundAdd extends EvalLastLineSubtopic {
    readonly help = [
        {
            afterFailedAttempts: 2,
            message: 'The compound operator += is equivalent to the simple operator (+) followed by an assignment (=).',
        },
    ];
    gen(): EvalLastLineQuestionGen {
        const var1 = randVariable();
        const [a, b] = randInts(1n, 5n, 2);
        const op = '+';
        return { code: `
            ${var1} = ${a}
            ${var1} ${op}= ${b}
            ${var1}`, options: [a, b, a + b, var1, Symbol(var1), ...range(0n, 10n)] };
    }
}

export class CompoundSubtract extends EvalLastLineSubtopic {
    readonly help = [
        {
            afterFailedAttempts: 2,
            message: 'The compound operator -= is equivalent to the simple operator (-) followed by an assignment (=). Make sure to subtract the right side from the left side.',
        },
    ];
    gen(): EvalLastLineQuestionGen {
        const var1 = randVariable();
        const [a, b] = randInts(1n, 5n, 2);
        const op = '-';
        return { code: `
            ${var1} = ${a}
            ${var1} ${op}= ${b}
            ${var1}`,
            options: [a, b, a - b, var1, Symbol(var1), ...range(-5n, 5n)],
        };
    }
}

export class CompoundMultiply extends EvalLastLineSubtopic {
    readonly help = [
        {
            afterFailedAttempts: 2,
            message: 'The compound operator *= is equivalent to the simple operator (*) followed by an assignment (=).',
        },
    ];
    gen(): EvalLastLineQuestionGen {
        const var1 = randVariable();
        const [a, b] = randInts(1n, 3n, 2);
        const op = '*';
        return { code: `
            ${var1} = ${a}
            ${var1} ${op}= ${b}
            ${var1}`, options: [a, b, a * b, var1, Symbol(var1), ...range(0n, 10n)] };
    }
}

export class CompoundMulti extends EvalLastLineSubtopic {
    readonly help = [
        {
            afterFailedAttempts: 2,
            message: 'You must evaluate the expression on the right side of the compound operator before performing the multiplication and assignment.',
        },
    ];
    gen(): EvalLastLineQuestionGen {
        const var1 = randVariable();
        const [a, b, c] = randInts(1n, 4n, 3);
        return { code: `
            ${var1} = ${a}
            ${var1} *= ${b} + ${c}
            ${var1}`,
            options: [a, b, c, a * (b + c), ...range(0n, 10n)],
        };
    }
}

export class CompoundConcat extends EvalLastLineSubtopic {
    readonly help = [
        {
            afterFailedAttempts: 2,
            message: 'Remember that + with strings concatenates the strings, not adds.',
        },
    ];
    gen(): EvalLastLineQuestionGen {
        const var1 = randVariable();
        const [a, b] = randChoices(STRINGS, 2);
        const op = '+';
        return { code: `
            ${var1} = "${a}"
            ${var1} ${op}= "${b}"
            ${var1}`,
            options: [a, b, a + b, var1, Symbol(var1), b + a],
        };
    }
}

export class CompoundAddVar extends EvalLastLineSubtopic {
    gen(): EvalLastLineQuestionGen {
        const [var1, var2] = randVars(2);
        const [a, b] = randInts(1n, 5n, 2);
        const op = '+';
        return { code: `
            ${var1} = ${a}
            ${var2} = ${b}
            ${var1} ${op}= ${var2}
            ${var1}`,
            options: [a, b, a + b, var1, Symbol(var1), var2, Symbol(var2), var1 + var2, Symbol(var1 + var2), ...range(0n, 10n)],
        };
    }
}

export class CompoundConcatVar extends EvalLastLineSubtopic {
    gen(): EvalLastLineQuestionGen {
        const [var1, var2] = randVars(2);
        const [a, b] = randChoices(STRINGS, 2);
        const op = '+';
        return { code: `
            ${var1} = "${a}"
            ${var2} = "${b}"
            ${var1} ${op}= ${var2}
            ${var1}`,
            options: [a, b, a + b, b + a, var1, Symbol(var1), var2, Symbol(var2), var1 + var2, Symbol(var1 + var2)],
        };
    }
}

export const COMPOUND_OPERATORS: Topic = new Topic('compound-operators', 'Compound Operators', [
    new CompoundAdd(),
    new CompoundSubtract(),
    new CompoundMultiply(),
    new CompoundMulti(),
    new CompoundConcat(),
    new CompoundAddVar(),
    new CompoundConcatVar(),
], [BASIC_ARITHMETIC, BASIC_VARIABLES, STRING_CONCAT]);
