import React, { useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { Markdown } from "../components/Markdown";
import '../components/QuestionScreen.css';
import { SKIPPED } from '../App';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faForwardFast } from '@fortawesome/free-solid-svg-icons';

function defaultParseQuizAnswer(raw: string): string | undefined {
  const trimmed = raw.trim();
  return trimmed === '' ? undefined : trimmed;
};

export const useQuizDisplayMode = (
  isQuiz: boolean,
  isShowingStats: boolean | undefined,
  optionCount: number,
): boolean => isQuiz || !!isShowingStats || optionCount <= 1;

export const getCorrectClass = (answer: any | typeof SKIPPED | undefined, isCorrect: boolean) => {
  const cn = answer instanceof Error ? 'exception ' : '';
  if (answer === undefined) { return cn; }
  if (answer === SKIPPED) { return cn + 'skipped'; }
  return cn + (isCorrect ? 'correct' : 'incorrect');
};

export const QuestionCodeBlock: React.FC<{code: string, language?: string}> = (
  {code, language = 'python'}
) => {
  return (
    <div className="code-block">
      <code className={`language-${language}`}>{code}</code>
    </div>
  );
};

export const QuestionInput: React.FC<{input: string[] | string | undefined}> = (
  {input}
) => {
  if (input === undefined) {
    return null;
  }
  return (
    <div className="question-input">
      The user typed:
      <code>{Array.isArray(input) ? input.join('\n') : input}</code>
    </div>
  );
};

export const QuestionPrompt: React.FC<{
  prompt: string|React.ReactNode,
  helpMessage?: string,
  onSkip?: (() => void),
}> = (
  {prompt, helpMessage = undefined, onSkip = undefined}
) => {
  return (
    <>
      <QuestionSkipButton onClick={onSkip} />
      <div className="question-prompt-row">
        <div className="question-prompt">
          {typeof prompt === 'string' ? (
            <Markdown content={prompt} className="question-prompt-markdown" />
          ) : (
            prompt
          )}
        </div>
        <QuestionHelp helpMessage={helpMessage} />
      </div>
    </>
  );
};

export const QuestionSkipButton: React.FC<{onClick: (() => void) | undefined}> = (
  {onClick}
) => {
  if (onClick === undefined) {
    return null;
  }
  return (
    <button className="skip-button" onClick={onClick}>
      Skip
    </button>
  );
};

export const QuestionHelp: React.FC<{helpMessage: string | undefined}> = (
  {helpMessage}
) => {
  if (helpMessage === undefined) {
    return null;
  }
  return (
    <span className="question-help" tabIndex={0}>
      <span className="question-help-icon" aria-hidden="true">
        ?
      </span>
      <span className="question-help-tooltip" role="tooltip">
        <Markdown content={helpMessage} className="question-help-markdown" />
      </span>
    </span>
  );
};

export const QuestionAnswerOptions: React.FC<{
  options: any[] | undefined,
  onSelect: (element: EventTarget | null, option: any) => void,
  getAnswerClass: (answer: any) => string,
  formatAnswer: (answer: any) => React.ReactNode,
  disabled: boolean,
}> = (
  {options, onSelect, getAnswerClass, formatAnswer, disabled = false}
) => {
  if (options === undefined) {
    return null;
  }
  return (
    <div key="answer-options" className="answer-options">
      {options.map((option, index) => (
        <button
          key={index}
          className={`answer-option ${getAnswerClass(option)}`} 
          onClick={(e) => onSelect(e.target, option)}
          disabled={disabled}
        >
          {formatAnswer(option)}
        </button>
      ))}
    </div>
  );
};

export const QuestionQuizInputSingleLine: React.FC<{
  onSubmit: (element: EventTarget | null, answer: any) => void,
  parseAnswer?: (inputValue: string) => any,
  placeholder?: string,
}> = ({onSubmit, parseAnswer = defaultParseQuizAnswer, placeholder = ''}) => {
  const [inputValue, setInputValue] = useState('');
  return (
    <>
      <input
        id="answer-input"
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onSubmit(e.target, parseAnswer(inputValue));
          }
        }}
        className="quiz-input"
        placeholder={placeholder}
        autoFocus
      />
      <QuestionSubmitButton onClick={(e) => onSubmit(e.target, parseAnswer(inputValue))} />
    </>
  );
};

export const QuestionQuizInputMultiLine: React.FC<{
  onSubmit: (element: EventTarget | null, answer: any) => void,
  parseAnswer?: (inputValue: string) => any,
  placeholder?: string,
}> = ({onSubmit, parseAnswer = defaultParseQuizAnswer, placeholder = ''}) => {
  const [inputValue, setInputValue] = useState('');
  return (
    <>
      <TextareaAutosize
        id="answer-input"
        value={inputValue}
        minRows={2}
        maxRows={5}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            onSubmit(e.target, parseAnswer(inputValue));
          }
        }}
        className="quiz-input"
        placeholder={placeholder}
        autoFocus
      />
      <QuestionSubmitButton onClick={(e) => onSubmit(e.target, parseAnswer(inputValue))} />
    </>
  );
};

export const QuestionQuizInputAnswerDisplay: React.FC<{
  userAnswer: any | typeof SKIPPED,
  correctAnswer: any,
  isCorrect: boolean,
  formatAnswer: (answer: any) => React.ReactNode,
  children?: React.ReactNode,
  isShowingStats?: boolean,
}> = (
  {userAnswer, correctAnswer, isCorrect, formatAnswer, children = undefined, isShowingStats = false}
) => {
  if (userAnswer === SKIPPED) {
    return (
      <>
        <div key="correct-answer" className={'quiz-input ' + getCorrectClass(correctAnswer, true)}>
          {formatAnswer(correctAnswer)}
        </div>
        {!isShowingStats && (
          <button key="feedback-button" className='feedback submit-button skipped' disabled>
            <FontAwesomeIcon icon={faForwardFast} />
          </button>
        )}
      </>
    );
  }
  const correctClass = getCorrectClass(userAnswer, isCorrect);
  return (
    <>
      <div key="user-answer" className={'quiz-input ' + correctClass}>
        {formatAnswer(userAnswer!)}
      </div>
      {!isShowingStats && (
        <button key="feedback-button" className={'feedback submit-button ' + correctClass} disabled>
          {isCorrect ? '✓' : '✗'}
        </button>
      )}
      {children}
      {!isCorrect && (
        <div key="correct-answer" className={'quiz-input ' + getCorrectClass(correctAnswer, true)}>
          {formatAnswer(correctAnswer)}
        </div>
      )}
    </>
  )
};

export const QuestionSubmitButton: React.FC<{onClick: (e: React.MouseEvent<HTMLButtonElement>) => void}> = (
  {onClick}
) => {
  return (
    <button
      className="submit-button"
      onClick={onClick}
    >
      Submit
    </button>
  );
};
