import React from 'react';
import type { Answer } from '../../topics';
import { formatAnswer, isAnswerSame } from '../../topics';
import { parsePyAtom, createException } from '../../python';
import type { EvalLastLineQuestion, UserAnswerFor } from '../types';
import type { QuestionTypeDef, QuestionViewProps } from '../registry';
import { QuestionAnswerOptions, QuestionCodeBlock, QuestionHelp, QuestionInput, QuestionQuizInputAnswerDisplay, QuestionSkipButton, QuestionQuizInputSingleLine } from '../QuestionComponents.tsx';

function parseQuizAnswer(raw: string): Answer | undefined {
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
    return createException('Invalid syntax', answer);
  }
}

function checkAnswer(
  question: EvalLastLineQuestion,
  user: UserAnswerFor<'eval-last-line'>,
): boolean {
  return isAnswerSame(user, question.correct);
}

function serialize(
  question: EvalLastLineQuestion,
  user: UserAnswerFor<'eval-last-line'> | null,
) {
  return {
    questionPayload: question.code,
    studentAnswer: user === null ? null : formatAnswer(user),
    correctAnswer: formatAnswer(question.correct),
  };
}

function formatHtmlAnswer(answer: Answer): React.ReactNode {
  if (answer instanceof Error) {  // Exception -> Error/Exception (name and message)
    if (!answer.message || answer.message === answer.name) { return answer.name; }
    if (answer.name === 'Error') { return answer.message; }
    return answer.name; //`${answer.name}: ${answer.message}`;
  }
  return <code className="language-python">{formatAnswer(answer)}</code>;
}

const EvalLastLineView: React.FC<QuestionViewProps<'eval-last-line'>> = ({
  question,
  userAnswer,
  isQuiz,
  isCorrect,
  onSkip,
  helpMessage,
  onAnswer,
}) => {
  const useQuiz = isQuiz || question.options.length <= 1;

  const getAnswerClass = (answer: Answer) => {
    const cn = answer instanceof Error ? 'exception ' : '';
    if (userAnswer === undefined) { return cn; }
    if (isAnswerSame(answer, question.correct)) { return cn + 'correct'; }
    if (isAnswerSame(answer, userAnswer) && !isCorrect) { return cn + 'incorrect'; }
    return cn;
  };

  return (
    <>
      <QuestionCodeBlock code={question.code} />
      <QuestionInput input={question.input} />
      <QuestionSkipButton onClick={onSkip} />
      <div className="question-type-row">
        <div className="question-type">
          What is the value of the final line of code?
        </div>
        <QuestionHelp helpMessage={helpMessage} />
      </div>
      {useQuiz ? (
        <div className="quiz-input-container">
          {userAnswer !== undefined ? (
            <QuestionQuizInputAnswerDisplay
              userAnswer={userAnswer}
              correctAnswer={question.correct}
              isCorrect={isCorrect}
              formatAnswer={formatHtmlAnswer}
            />
          ) : (
            <QuestionQuizInputSingleLine
              onSubmit={onAnswer}
              parseAnswer={parseQuizAnswer}
              placeholder="Remember to use the correct syntax!"
            />
          )}
        </div>
      ) : (
        <QuestionAnswerOptions
          options={question.options}
          onSelect={onAnswer}
          getAnswerClass={getAnswerClass}
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
  serializeResponse: serialize,
  View: EvalLastLineView,
};
