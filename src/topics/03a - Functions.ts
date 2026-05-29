import { Topic, CodeOutputSubtopic, CodeOutputQuestionGen } from '../topics';
import { randVars, randFuncs, randInts } from '../util';
import { PRACTICE_03A_BASIC_FUNCTIONS } from './03a - Basic Functions';



// def area(x, y):
//     x = x * y
//     return y

// def main():
//     x = 2
//     y = 3
//     a = area(y, x)
//     print(x, "x", y, "->", a)

// if __name__ == "__main__":
//     main()

export class Functions1 extends CodeOutputSubtopic {
  gen(): CodeOutputQuestionGen {
    const [x, y, z] = randVars(3);
    const [a, b] = randInts(2n, 5n, 2);
    return {
      code: `
        def area(${x}, ${y}):
            ${x} = ${x} * ${y}
            return ${y}

        def main():
            ${x} = ${a}
            ${y} = ${b}
            ${z} = area(${y}, ${x})
            print(${x}, "x", ${y}, "->", ${z})

        if __name__ == "__main__":
            main()
      `,
      options: [
        `${a}x${b}->${a * b}`, `${b}x${a}->${b * a}`, `${a} x ${b} -> ${a * b}`, `${b} x ${a} -> ${b * a}`,
        `${x}x${y}->area`, `${y}x${x}->area`, `${x} x ${y} -> area`, `${y} x ${x} -> area`,
        `${a*b} x ${b} -> ${a}`,
      ],
    };
  }
}

// def add(x, y):
//     x = x - y
//     return x

// def main():
//     x = 3
//     y = 2
//     z = add(y, add(y, x))
//     print(z, x, y)

// if __name__ == "__main__":
//     main()

export class Functions2 extends CodeOutputSubtopic {
  gen(): CodeOutputQuestionGen {
    const [x, y, z] = randVars(3);
    const [a, b] = randInts(2n, 5n, 2);
    return {
      code: `
        def add(${x}, ${y}):
            ${x} = ${x} - ${y}
            return ${x}

        def main():
            ${x} = ${a}
            ${y} = ${b}
            ${z} = add(${y}, add(${y}, ${x}))
            print(${z}, ${x}, ${y})
        
        if __name__ == "__main__":
            main()
      `,
      options: [
        `${z}, ${x}, ${y}`, `${x}, ${y}, ${z}`, `${y}, ${x}, ${z}`, `${z}, ${y}, ${x}`,
        `${z} ${x} ${y}`, `${x} ${y} ${z}`, `${y} ${x} ${z}`, `${z} ${y} ${x}`,
        `${a}, ${b}, ${a}`, `${a}, ${a}, ${b}`, `${b}, ${a}, ${a}`,
        `${a} ${b} ${a}`, `${a} ${a} ${b}`, `${b} ${a} ${a}`,
      ],
    };
  }
}

// def a(x, y):
//     y = x + 2*y
//     return y

// def b(y):
//     return a(y, 2)

// def main():
//     x = 4
//     y = 1
//     x = a(b(x), y) + b(y)
//     print(x, y)

// if __name__ == "__main__":
//     main()


export class Functions3 extends CodeOutputSubtopic {
  gen(): CodeOutputQuestionGen {
    const [x, y] = randVars(2);
    const [f, g] = randFuncs(2);
    const [a, b] = randInts(2n, 5n, 2);
    return {
      code: `
        def ${f}(${x}, ${y}):
            ${y} = ${x} + 2*${y}
            return ${y}

        def ${g}(${y}):
            return ${f}(${y}, 2)

        def main():
            ${x} = ${a}
            ${y} = ${b}
            ${x} = ${f}(${g}(${x}), ${y}) + ${g}(${y})
            print(${x}, ${y})

        if __name__ == "__main__":
            main()
      `,
      options: [
        `${a}, ${b}`, `${b}, ${a}`, `${a} ${b}`, `${b} ${a}`,
        `${x}, ${y}`, `${y}, ${x}`, `${x} ${y}`, `${y} ${x}`,
      ],
    };
  }
}

// def g(x):
//     y = int(input(x+" x: "))
//     return y

// def h(x, y):
//     return x + y

// def main():
//     x = h(g("a"), g("b"))
//     print(x)

// if __name__ == "__main__":
//     main()


// TODO: this does not work in quiz mode (they cannot type the echoed input correctly)
//  also the wrong answers don't have the correct echos either
// class Functions4 extends CodeOutputSubtopic {
//   gen(): CodeOutputQuestionGen {
//     const [x, y] = randVars(2);
//     const [f, g] = randFuncs(2);
//     const [a, b] = randChoices(STRINGS, 2);
//     const [c, d] = randInts(2n, 5n, 2);
//     return {
//       code: `
//       def ${f}(${x}):
//           ${y} = int(input(${x}+" ${x}: "))
//           return ${y}

//       def ${g}(${x}, ${y}):
//           return ${x} + ${y}

//       def main():
//           ${x} = ${g}(${f}("${a}"), ${f}("${b}"))
//           print(${x})

//       if __name__ == "__main__":
//           main()
//       `,
//       options: [`${a}, ${b}`, `${b}, ${a}`, `${a} ${b}`, `${b} ${a}`],
//     };
//   }
// }

export const PRACTICE_03A_FUNCTIONS: Topic = new Topic('practice-03a-functions', '03a Functions', [
  new Functions1(),
  new Functions2(),
  new Functions3(),
  // new Functions4(),
], [PRACTICE_03A_BASIC_FUNCTIONS]);
