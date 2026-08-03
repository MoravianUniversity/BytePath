import { Topic, TopicGroup } from './topics';

import { BASIC_ARITHMETIC } from './topics/BasicArithmetic';
import { BASIC_VARIABLES } from './topics/BasicVariables';
import { STRING_CONCAT } from './topics/StringConcat';
import { STRING_LENGTH } from './topics/StringLength';
import { STRING_INDEX } from './topics/StringIndexing';
import { BASIC_PRINTS } from './topics/BasicPrints';

import { COMPOUND_OPERATORS } from './topics/CompoundOperators';
import { DIVISION } from './topics/Division';
import { CONVERTING_AND_ROUNDING } from './topics/ConvertingAndRounding';

import { STRING_SLICING } from './topics/StringSlicing';
import { STRING_NEG_INDEX } from './topics/StringNegIndex';
import { STRING_COMPARISONS } from './topics/StringComparisons';
import { ESCAPE_SEQUENCES } from './topics/EscapeSequences';
import { STRING_METHODS } from './topics/StringMethods';
import { SPLITTING_AND_JOINING } from './topics/SplittingAndJoining';
import { F_STRINGS } from './topics/FStrings';

import { LIST_BASICS } from './topics/ListBasics';
import { LIST_SLICING } from './topics/ListSlicing';
import { LIST_NESTING } from './topics/ListNesting';
import { TUPLES } from './topics/Tuples';

import { DICT_BASICS } from './topics/DictionaryBasics';
import { DICT_WITH_LOOPS } from './topics/DictionaryWithLoops';

import { BASIC_FUNCTIONS } from './topics/BasicFunctions';
import { FUNC_WITH_MULTIPLE_ARGS } from './topics/FuncWithMultipleArgs';
import { FUNC_WITH_MULT_OR_NO_RETURN } from './topics/FuncWithMultOrNoReturn';
import { FUNC_WITH_MULTIPLE_CALLS } from './topics/FuncWithMultipleCalls';
import { FUNC_WITH_PRINT } from './topics/FuncWithPrint';

import { BASIC_BRANCHING } from './topics/BasicBranching';
import { CHAINED_BRANCHES } from './topics/ChainedBranches';
import { NESTED_BRANCHES } from './topics/NestedBranches';
import { BASIC_RELATIONAL_OPERATORS } from './topics/BasicRelationalOperators';
import { RELATIONAL_OPERATORS } from './topics/RelationalOperators';
import { BASIC_BOOLEAN_OPERATORS } from './topics/BasicBooleanOperators';
import { BOOLEAN_OPERATORS } from './topics/BooleanOperators';
import { MEMBERSHIP_OPERATORS } from './topics/MembershipOperator';

import { WHILE_LOOPS } from './topics/WhileLoops';
import { FOR_LOOP_BASICS } from './topics/ForLoopBasics';
import { FOR_LOOP_WITH_RANGE } from './topics/ForLoopWithRange';
import { FOR_LOOP_NESTING } from './topics/ForLoopNesting';

import { PRACTICE_03A_BASIC_READING } from './topics/03a - Basic Reading';
import { PRACTICE_03A_BASIC_FUNCTIONS } from './topics/03a - Basic Functions';
import { PRACTICE_03A_FUNCTIONS } from './topics/03a - Functions';
import { PRACTICE_03A_FUNCTIONS_EXTRA } from './topics/03a - Functions - Extra';
import { PRACTICE_04A_DIVISION_AND_CONDITIONS } from './topics/04a - Division and Conditions';
import { PRACTICE_04B_STRINGS } from './topics/04b - Strings.ts';
import { PRACTICE_04B_LISTS } from './topics/04b - Lists.ts';
import { PRACTICE_05A_LOOPS } from './topics/05a - Loops.ts';
import { PRACTICE_05B_DICTS } from './topics/05b - Dicts.ts';

import { QUIZ_3 } from './topics/Quiz3';
import { QUIZ_4 } from './topics/Quiz4';
import { FUNCTIONS_MASTERY } from './topics/FunctionMastery';
import { CONDITIONALS_MASTERY } from './topics/ConditionalsMastery';
import { STRINGS_MASTERY } from './topics/StringsMastery';
import { LIST_MASTERY } from './topics/ListMastery';
import { LOOPS_MASTERY } from './topics/LoopsMastery';
import { DICT_MASTERY } from './topics/DictMastery';


//////////////////////////////////
////////// Topic Groups //////////
//////////////////////////////////
const BASIC_CONCEPTS_GROUP = new TopicGroup('basics', 'Python Basics', [
  BASIC_ARITHMETIC,
  BASIC_VARIABLES,
  STRING_CONCAT,
  STRING_LENGTH,
  STRING_INDEX,
  BASIC_PRINTS,
]);

const ARITHMETIC_GROUP = new TopicGroup('arithmetic', 'Arithmetic', [
  COMPOUND_OPERATORS,
  DIVISION,
  CONVERTING_AND_ROUNDING,
]);

const STRING_GROUP = new TopicGroup('strings', 'Strings', [
  STRING_SLICING,
  STRING_NEG_INDEX,
  STRING_COMPARISONS,
  ESCAPE_SEQUENCES,
  STRING_METHODS,
  SPLITTING_AND_JOINING,
  F_STRINGS,
]);

const LIST_GROUP = new TopicGroup('lists', 'Lists', [
  LIST_BASICS,
  LIST_SLICING,
  LIST_NESTING,
  TUPLES,
]);

const DICT_GROUP = new TopicGroup('dictionaries', 'Dictionaries', [
  DICT_BASICS,
  DICT_WITH_LOOPS,
]);

const FUNCTIONS_GROUP = new TopicGroup('functions', 'Functions', [
  BASIC_FUNCTIONS,
  FUNC_WITH_MULTIPLE_ARGS,
  FUNC_WITH_MULT_OR_NO_RETURN,
  FUNC_WITH_PRINT,
  FUNC_WITH_MULTIPLE_CALLS,
]);

const BRANCHING_GROUP = new TopicGroup('branching', 'Branching & Logical Operators', [
  BASIC_BRANCHING,
  CHAINED_BRANCHES,
  NESTED_BRANCHES,
  BASIC_RELATIONAL_OPERATORS,
  RELATIONAL_OPERATORS,
  BASIC_BOOLEAN_OPERATORS,
  BOOLEAN_OPERATORS,
  MEMBERSHIP_OPERATORS,
]);

const LOOPS_GROUP = new TopicGroup('loops', 'Loops', [
  WHILE_LOOPS,
  FOR_LOOP_BASICS,
  FOR_LOOP_WITH_RANGE,
  FOR_LOOP_NESTING,
]);

const PRACTICE_GROUP = new TopicGroup('practice', 'Practice', [
  PRACTICE_03A_BASIC_READING,
  PRACTICE_03A_BASIC_FUNCTIONS,
  PRACTICE_03A_FUNCTIONS,
  PRACTICE_03A_FUNCTIONS_EXTRA,
  PRACTICE_04A_DIVISION_AND_CONDITIONS,
  PRACTICE_04B_STRINGS,
  PRACTICE_04B_LISTS,
  PRACTICE_05A_LOOPS,
  PRACTICE_05B_DICTS,
]);

const QUIZ_GROUP = new TopicGroup('quiz-review', 'Quiz Review', [
  QUIZ_3,
  QUIZ_4,
  FUNCTIONS_MASTERY,
  CONDITIONALS_MASTERY,
  STRINGS_MASTERY,
  LIST_MASTERY,
  LOOPS_MASTERY,
  DICT_MASTERY,
]);


////////////////////////////////
////////// All Topics //////////
////////////////////////////////
export const TOPICS: (Topic | TopicGroup)[] = [
  BASIC_CONCEPTS_GROUP,
  ARITHMETIC_GROUP,
  STRING_GROUP,
  LIST_GROUP,
  DICT_GROUP,
  FUNCTIONS_GROUP,
  BRANCHING_GROUP,
  LOOPS_GROUP,
  PRACTICE_GROUP,
  QUIZ_GROUP,
];
