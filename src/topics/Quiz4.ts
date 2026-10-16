import { Topic } from '../topics';
import { BASIC_VARIABLES, VariableAssignment, TwoVariableOp, TwoVariableOpBackwards } from './BasicVariables';
import { STRING_CONCAT, StringConcat, StringConcatBackwards, StringConcat_1IntLike } from './StringConcat';
import { STRING_LENGTH, StringLenVar, StringLenMultiVar } from './StringLength';
import { BASIC_PRINTS, PrintStringMultiVar } from './BasicPrints';
import { BASIC_FUNCTIONS, FuncArgWithMath, FuncArgWithMathInAndOutside, FuncArgAndSaveResultMath3, FuncArgVarInAndOutside } from './BasicFunctions';
import { FUNC_WITH_MULTIPLE_ARGS, Func2ArgsMult, Func2ArgsVar, Func2ArgsReassign } from './FuncWithMultipleArgs';
import { StringLenPlus } from './03a - Basic Reading';
import { Functions1, Functions2 } from './03a - Functions';

export const QUIZ_4: Topic = new Topic('quiz-4', 'Quiz 4 Practice', [
  new VariableAssignment(),
  new TwoVariableOp(),
  new TwoVariableOpBackwards(),
  new StringConcat(),
  new StringConcatBackwards(),
  new StringConcat_1IntLike(),
  new StringLenVar(),
  new StringLenMultiVar(),
  new StringLenPlus(),
  new PrintStringMultiVar(),
  new FuncArgWithMath(),
  new FuncArgWithMathInAndOutside(),
  new FuncArgVarInAndOutside(),
  new FuncArgAndSaveResultMath3(),
  new Func2ArgsMult(),
  new Func2ArgsVar(),
  new Func2ArgsReassign(),
  new Functions1(),
  new Functions2(),
], [BASIC_VARIABLES, STRING_CONCAT, STRING_LENGTH, BASIC_PRINTS, BASIC_FUNCTIONS, FUNC_WITH_MULTIPLE_ARGS], {skippable: true});