import React from 'react';
import type { Answer } from '../topics.ts';
import { formatAnswer, isAnswerSame } from '../topics.ts';
import { parsePyAtom, createException, runLastLine } from '../python.ts';
import type { EvalLastLineQuestion, TopicContext, UserAnswerFor } from './types.ts';
import type { QuestionTypeDef, QuestionViewProps, SerializedResponse } from './registry.ts';
import { QuestionAnswerOptions, QuestionCodeBlock, QuestionInput, QuestionQuizInputAnswerDisplay, QuestionQuizInputSingleLine, QuestionPrompt, useQuizDisplayMode, getAnswerClass } from './QuestionComponents.tsx';
import { BuildCodeQuestionOpts, createCodeQuestionCore, prepareOptions } from './utils.ts';

function checkAnswer(
  question: EvalLastLineQuestion,
  answer: UserAnswerFor<'eval-last-line'>,
): boolean {
  return isAnswerSame(answer, question.correct);
}

function parseAnswer(raw: string): Answer | undefined {
  let answer = raw.trim();
  if (answer === '') { return undefined; }
  const errors = [
    'syntaxerror', 'nameerror', 'attributeerror', 'typeerror', 'valueerror',
    'zerodivisionerror', 'indexerror', 'keyerror',
  ];
  if (errors.includes(answer.toLowerCase())) { return createException(answer, ''); }
  if (answer.includes(':')) {
    const [error, message] = answer.split(':', 2);
    if (errors.includes(error.toLowerCase())) { return createException(error, message); }
  }
  try {
    const [py_atom, rem] = parsePyAtom(answer);
    if (rem !== '') { return createException('Invalid syntax', answer); }
    return py_atom;
  } catch {
    return createException('Invalid syntax: ' + answer);
  }
}

function formatHtmlAnswer(answer: Answer): React.ReactNode {
  if (answer instanceof Error) {  // Exception -> Error/Exception (name and message)
    if (!answer.message || answer.message === answer.name) { return answer.name; }
    if (answer.name === 'Error') { return answer.message; }
    return answer.name; //`${answer.name}: ${answer.message}`;
  }
  return <code className="language-python">{formatAnswer(answer)}</code>;
}

function serialize(
  question: EvalLastLineQuestion,
  user: UserAnswerFor<'eval-last-line'> | null,
): SerializedResponse {
  return {
    questionPayload: question.code,
    studentAnswer: user === null ? null : formatAnswer(user),
    correctAnswer: formatAnswer(question.correct),
  };
}

function unserialize(response: SerializedResponse): { question: EvalLastLineQuestion, userAnswer: Answer | undefined } {
  return {
    question: {
      kind: 'eval-last-line',
      code: response.questionPayload,
      correct: parseAnswer(response.correctAnswer) ?? response.correctAnswer,
      options: [],
    },
    userAnswer: response.studentAnswer ? parseAnswer(response.studentAnswer) : undefined,
  };
}

const EvalLastLineView: React.FC<QuestionViewProps<'eval-last-line'>> = ({
  question,
  userAnswer,
  isQuiz,
  readOnly,
  isCorrect,
  onSkip,
  helpMessage,
  onAnswer,
}) => {
  const useQuiz = useQuizDisplayMode(isQuiz, readOnly, question.options.length);
  const myGetAnswerClass = (answer: Answer) =>
    getAnswerClass(answer, userAnswer, question.correct, isCorrect, isAnswerSame);

  return (
    <>
      <QuestionCodeBlock code={question.code} />
      {!readOnly && <QuestionInput input={question.input} />}
      <QuestionPrompt
        prompt="What is the value of the final line of code?"
        helpMessage={helpMessage}
        onSkip={readOnly ? undefined : onSkip}
      />
      {useQuiz ? (
        <div className="quiz-input-container">
          {userAnswer !== undefined ? (
            <QuestionQuizInputAnswerDisplay
              userAnswer={userAnswer}
              correctAnswer={question.correct}
              isCorrect={isCorrect}
              formatAnswer={formatHtmlAnswer}
              isShowingStats={readOnly}
            />
          ) : (
            <QuestionQuizInputSingleLine
              onSubmit={onAnswer}
              parseAnswer={parseAnswer}
              placeholder="Remember to use the correct syntax!"
            />
          )}
        </div>
      ) : (
        <QuestionAnswerOptions
          options={question.options}
          onSelect={onAnswer}
          getAnswerClass={myGetAnswerClass}
          formatAnswer={formatHtmlAnswer}
          disabled={userAnswer !== undefined}
        />
      )}
    </>
  );
};

export const evalLastLineDef: QuestionTypeDef<'eval-last-line'> = {
  kind: 'eval-last-line',
  checkAnswer: checkAnswer,
  serialize,
  unserialize,
  View: EvalLastLineView,
};

export function createEvalLastLineQuestion(
  code: string,
  options: (Answer | undefined)[],
  opts: BuildCodeQuestionOpts<Answer>,
  ctx: TopicContext,
): EvalLastLineQuestion {
  const { code: cleaned_code, correct, input } = createCodeQuestionCore(
    code, opts, runLastLine, isAnswerSame, ctx
  );
  return {
    kind: 'eval-last-line',
    code: cleaned_code,
    correct: correct,
    options: prepareOptions(correct, options.map((o) => (typeof o === 'number' ? +o.toFixed(5) : o)), isAnswerSame),
    input,
  };
}
