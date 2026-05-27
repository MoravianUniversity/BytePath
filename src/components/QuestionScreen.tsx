import React, { useEffect, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { SKIPPED } from '../App';
import { Question, Answer, isAnswerCorrect, isAnswerSame, formatAnswer } from '../topics';
import { parsePyAtom, createException } from '../python';
import './QuestionScreen.css';
import '../code.css';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import confetti from 'canvas-confetti';
import { HelpMarkdown } from './HelpMarkdown';

interface QuestionScreenProps {
  question: Question;
  userAnswer?: Answer | undefined;
  onAnswerSelect: (answer: Answer | undefined, question: Question) => void;
  isQuiz: boolean;
  canSkip: boolean;
  helpMessage?: string;
}

const QuestionScreen: React.FC<QuestionScreenProps> = ({
  question,
  userAnswer,
  onAnswerSelect,
  isQuiz,
  canSkip,
  helpMessage,
}) => {
  const isCompleted = userAnswer !== undefined;
  const isCorrect = isCompleted && isAnswerCorrect(userAnswer, question);
  const [inputValue, setInputValue] = useState('');

  // Apply syntax highlighting when component mounts or question changes
  useEffect(() => {
    Prism.highlightAll();
  }, [question, userAnswer, isQuiz]);
  // Prism setup code to run only once

  const formatAnswerCode = (answer: Answer): string | React.ReactNode => {
    if (question.usesOutput) {
      let outputs: React.ReactNode[] = [];
      let ans = String(answer);
      // Go through the string and find the \x02 and \x03 characters
      // Each time add a span with class "input-echo" around the text between the characters
      while (ans.includes('\x02')) {
        const start = ans.indexOf('\x02');
        const end = ans.indexOf('\x03');
        if (start === -1 || end === -1) { break; }
        const echo = <>{ans.slice(0, start)}<span className="input-echo">{ans.slice(start + 1, end)}</span></>;
        outputs.push(echo);
        ans = ans.slice(end + 1);
      }
      outputs.push(ans);
      return <code>{outputs}</code>;
    }
    if (answer instanceof Error) { // Exception -> Error/Exception (name and message)
      if (!answer.message || answer.message === answer.name) { return answer.name; }
      if (answer.name === 'Error') { return answer.message; }
      return answer.name; //`${answer.name}: ${answer.message}`;
    }
    return <code className="language-python">{formatAnswer(answer)}</code>;
  };

  const convertAnswer = (answer: string): Answer | undefined => {
    answer = answer.trim();
    if (answer === "") { return undefined; } // nothing typed
    if (question.usesOutput) { return answer; } // no processing needed

    // parse error messages
    const errors = ['syntaxerror', 'nameerror', 'attributeerror', 'typeerror', 'valueerror', 'zerodivisionerror', 'indexerror', 'keyerror'];
    if (errors.includes(answer.toLowerCase())) { return createException(answer, ""); }
    if (answer.includes(':')) {
      const [error, message] = answer.split(':', 2);
      if (errors.includes(error.toLowerCase())) { return createException(error, message); }
    }

    try {
      let [py_atom, rem] = parsePyAtom(answer);
      if (rem !== "") { return createException('Invalid syntax', answer); }
      return py_atom;
    } catch (e) {
      return createException('Invalid syntax', answer);
    }
  };

  const getCorrectClass = () => {
    const cn = (userAnswer instanceof Error) ? 'exception ' : '';
    if (userAnswer === undefined || userAnswer === SKIPPED) return cn;
    return cn + (isCorrect ? 'correct' : 'incorrect');
  };

  const getAnswerClass = (answer: Answer) => {
    const cn = (answer instanceof Error) ? 'exception ' : '';
    if (userAnswer === undefined) { return cn; }
    if (isAnswerCorrect(answer, question)) { return cn + 'correct'; }
    if (isAnswerSame(answer, userAnswer) && !isAnswerCorrect(userAnswer, question)) { return cn + 'incorrect'; }
    return cn;
  };

  const onSubmit = (element: EventTarget | null, answer: Answer | undefined) => {
    if (answer === undefined && !canSkip) { return; }
    onAnswerSelect(answer, question);
    if (element instanceof HTMLElement) {
      if (answer !== undefined && isAnswerCorrect(answer, question)) {
        var rect = element.getBoundingClientRect();
        var originX = (rect.x + (0.5 * rect.width)) / window.innerWidth;
        var originY = (rect.y + rect.height) / window.innerHeight;
        confetti({
          particleCount: 100,
          spread: 70,
          decay: 0.8,
          gravity: 1.5,
          origin: { x: originX, y: originY }
        });
      } else {
        // shake is done by css
      }
    }
  };

  return (
    <div className={`question-screen ${isCompleted ? 'completed' : ''} ${question.usesOutput ? 'uses-output' : ''} ${getCorrectClass()}`}>
      <div className="question-content">
        <div className="code-block">
          <code className="language-python">{question.code}</code>
        </div>

        {question.input && (
          <div className="question-input">
            The user typed:
            <code>{Array.isArray(question.input) ? question.input.join('\n') : question.input}</code>
          </div>
        )}
        {!isCompleted && canSkip && (
          <button className="skip-button" onClick={() => onSubmit(null, undefined)}>Skip</button>
        )}
        <div className="question-type-row">
          {question.usesOutput ? (
            <div className="question-type">What is the <em>output to the user</em>?</div>
          ) : (
            <div className="question-type">What is the value of the final line of code?</div>
          )}
          {helpMessage && (
            <span className="question-help" tabIndex={0}>
              <span className="question-help-icon" aria-hidden="true">?</span>
              <span className="question-help-tooltip" role="tooltip">
                <HelpMarkdown content={helpMessage} />
              </span>
            </span>
          )}
        </div>


        {isQuiz ? (
          <div className="quiz-input-container">
            {isCompleted ? (
              <div>
                <div className={"quiz-input " + getCorrectClass()}>
                  {formatAnswerCode(userAnswer)}
                </div>
                <button className={"feedback submit-button " + getCorrectClass()} disabled>{isCorrect ? '✓' : '✗'}</button>
                {!isCorrect &&
                  <div className={"quiz-input correct" + (userAnswer instanceof Error ? ' exception' : '')}>
                    {formatAnswerCode(question.correct)}
                  </div>
                }
              </div>
            ) : (
              <div>
                {question.usesOutput ? (
                  <TextareaAutosize
                    id="answer-input"
                    value={inputValue}
                    minRows={2}
                    maxRows={5}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { // ctrl+enter or cmd+enter to submit
                        e.preventDefault();
                        onSubmit(e.target, convertAnswer(inputValue));
                      }
                    }}
                    className="quiz-input"
                    autoFocus={true}
                  />
                ) : (
                  <input
                    id="answer-input"
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        onSubmit(e.target, convertAnswer(inputValue));
                      }
                    }}
                    className="quiz-input"
                    placeholder="Remember to use the correct syntax!"
                    autoFocus={true}
                  />
                )}
                <button 
                  className="submit-button"
                  onClick={(e) => onSubmit(e.target, convertAnswer(inputValue))}
                >Submit</button>
              </div>
            )}
          </div>
        ) : (
          <div className="answer-options">
            {question.options.map((option, index) => {
              return (
                <button
                  key={index}
                  className={`answer-option ${getAnswerClass(option)}`}
                  onClick={(e) => onSubmit(e.target, option)}
                  disabled={userAnswer !== undefined}
                >{formatAnswerCode(option)}</button>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default QuestionScreen;
