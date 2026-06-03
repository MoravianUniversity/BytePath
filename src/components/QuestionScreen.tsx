import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTable } from '@fortawesome/free-solid-svg-icons';
import confetti from 'canvas-confetti';
import { SKIPPED } from '../App';
import type { Question, UserAnswer } from '../questions/types';
import { QUESTION_TYPES, checkAnswer } from '../questions/registry';
import { getCorrectClass } from '../questions/QuestionComponents.tsx';
import '../code.css';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';

interface QuestionScreenProps {
  question: Question;
  userAnswer?: UserAnswer | typeof SKIPPED;
  onAnswerSelect: (answer: UserAnswer | undefined, question: Question) => void;
  isQuiz: boolean;
  /** Initial open state when this question is first shown (active question only). */
  workspaceDefaultOpen: boolean;
  canSkip: boolean;
  helpMessage?: string;
}

const QuestionScreen: React.FC<QuestionScreenProps> = ({
  question,
  userAnswer,
  onAnswerSelect,
  isQuiz,
  workspaceDefaultOpen,
  canSkip,
  helpMessage,
}) => {
  const [workspaceOpen, setWorkspaceOpen] = useState(workspaceDefaultOpen);

  const def = QUESTION_TYPES[question.kind];
  const isCompleted = userAnswer !== undefined;
  const skipped = userAnswer === SKIPPED;
  const isCorrect = isCompleted && !skipped && checkAnswer(question, userAnswer) === true;

  useEffect(() => {
    Prism.highlightAll();
  }, [question, userAnswer, isQuiz]);

  const correctClass = getCorrectClass(userAnswer, isCorrect);

  const handleAnswer = (
    element: EventTarget | null,
    answer: UserAnswer | undefined,
  ) => {
    if (answer === undefined && !canSkip) { return; }
    const correct = answer !== undefined && checkAnswer(question, answer) === true;
    if (element instanceof HTMLElement && correct) {
      const rect = element.getBoundingClientRect();
      const originX = (rect.x + 0.5 * rect.width) / window.innerWidth;
      const originY = (rect.y + rect.height) / window.innerHeight;
      confetti({
        particleCount: 100,
        spread: 70,
        decay: 0.8,
        gravity: 1.5,
        origin: { x: originX, y: originY },
      });
    }
    onAnswerSelect(answer, question);
  };

  return (
    <div
      className={`question-screen ${workspaceOpen ? 'has-workspace' : ''} ${isCompleted ? 'completed' : ''} ${question.kind} ${correctClass}`}
    >
      <div className="question-content">
        <def.View
          question={question as never}
          userAnswer={userAnswer as never}
          isQuiz={isQuiz}
          readOnly={false}
          isCorrect={isCorrect}
          onSkip={canSkip && !isCompleted ? () => handleAnswer(null, undefined) : undefined}
          onAnswer={handleAnswer}
          helpMessage={helpMessage}
        />
        <button
          type="button"
          className={`workspace-toggle ${workspaceOpen ? 'workspace-toggle--open' : ''}`}
          onClick={() => setWorkspaceOpen((open) => !open)}
          aria-expanded={workspaceOpen}
          aria-controls="question-workspace-panel"
          aria-label={workspaceOpen ? 'Hide workspace' : 'Open workspace'}
          title={workspaceOpen ? 'Hide workspace' : 'Open workspace'}
        >
          <FontAwesomeIcon className="workspace-toggle-icon" icon={faTable} aria-hidden />
        </button>
      </div>
      <Workspace
        question={question}
        panelId="question-workspace-panel"
        collapsed={!workspaceOpen}
      />
    </div>
  );
};

export default QuestionScreen;

type WorkspaceTab = 'notes' | 'trace';

function emptyGrid(rows: number, cols: number): string[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(''));
}

function questionFingerprint(question: Question): string {
  switch (question.kind) {
    case 'eval-last-line':
    case 'code-output':
      return `${question.kind}:${question.code}`;
    case 'code-write':
      return `${question.kind}:${question.prompt}:${question.variables.join(',')}`;
    case 'func-write':
      return `${question.kind}:${question.prompt}:${question.name}`;
    case 'conceptual':
      return `${question.kind}:${question.prompt}`;
  }
}

function rowIsEmpty(cells: string[][], rowIndex: number): boolean {
  return cells[rowIndex].every((cell) => cell.trim() === '');
}

function colIsEmpty(cells: string[][], colIndex: number): boolean {
  return cells.every((r) => r[colIndex].trim() === '');
}

function updateTraceGrid(
  cells: string[][],
  row: number,
  col: number,
  value: string,
  minRows: number,
  minCols: number,
): string[][] {
  const next = cells.map((r) => [...r]);
  next[row][col] = value;

  if (row === next.length - 1 && value.trim() !== '') {
    next.push(Array(next[0].length).fill(''));
  }
  if (col === next[0].length - 1 && value.trim() !== '') {
    for (let i = 0; i < next.length; i++) {
      next[i].push('');
    }
  }

  if (next.length > minRows && row === next.length - 2 && rowIsEmpty(next, next.length - 2)) {
    next.pop();
  }
  if (next[0].length > minCols && col === next[0].length - 2 && colIsEmpty(next, next[0].length - 2)) {
    for (let i = 0; i < next.length; i++) {
      next[i].pop();
    }
  }

  return next;
}

const TRACE_INITIAL_ROWS = 2;
const TRACE_INITIAL_COLS = 2;
const TRACE_COL_MAX_PX = 120;
/** Extra px beyond measured text; avoids subpixel clipping in inputs. */
const TRACE_COL_WIDTH_FUDGE_PX = 4;

function measureTraceTextWidth(measureEl: HTMLElement, text: string): number {
  measureEl.textContent = text.length > 0 ? text : '\u00a0';
  return measureEl.scrollWidth;
}

function measureTraceColumnWidthsPx(
  cells: string[][],
  measureEl: HTMLElement,
): number[] {
  const colCount = cells[0]?.length ?? 0;
  if (colCount === 0) { return []; }
  const minWidth = measureTraceTextWidth(measureEl, '00');
  return Array.from({ length: colCount }, (_, colIndex) => {
    let max = minWidth;
    for (const row of cells) {
      max = Math.max(max, measureTraceTextWidth(measureEl, row[colIndex]));
    }
    return Math.min(TRACE_COL_MAX_PX, max + TRACE_COL_WIDTH_FUDGE_PX);
  });
}

const Workspace: React.FC<{ question: Question; panelId: string; collapsed: boolean }> = ({
  question,
  panelId,
  collapsed,
}) => {
  const [tab, setTab] = useState<WorkspaceTab>('notes');
  const [notes, setNotes] = useState('');
  const [traceCells, setTraceCells] = useState(() =>
    emptyGrid(TRACE_INITIAL_ROWS, TRACE_INITIAL_COLS),
  );
  const [traceColWidthsPx, setTraceColWidthsPx] = useState<number[]>([]);
  const traceMeasureRef = useRef<HTMLSpanElement>(null);
  const traceCellRefs = useRef<(HTMLInputElement | null)[][]>([]);

  useEffect(() => {
    setTab('notes');
    setNotes('');
    setTraceCells(emptyGrid(TRACE_INITIAL_ROWS, TRACE_INITIAL_COLS));
  }, [questionFingerprint(question)]);

  useLayoutEffect(() => {
    const measureEl = traceMeasureRef.current;
    if (!measureEl || collapsed || tab !== 'trace') { return; }
    setTraceColWidthsPx(measureTraceColumnWidthsPx(traceCells, measureEl));
  }, [traceCells, tab, collapsed]);

  const updateTraceCell = (row: number, col: number, value: string) => {
    setTraceCells((prev) =>
      updateTraceGrid(prev, row, col, value, TRACE_INITIAL_ROWS, TRACE_INITIAL_COLS),
    );
  };

  const focusTraceCell = useCallback((row: number, col: number, cursor: 'start' | 'end') => {
    const input = traceCellRefs.current[row]?.[col];
    if (!input) { return; }
    input.focus();
    const pos = cursor === 'start' ? 0 : input.value.length;
    input.setSelectionRange(pos, pos);
  }, []);

  const handleTraceCellKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
      const rows = traceCells.length;
      const cols = traceCells[0]?.length ?? 0;
      const input = e.currentTarget;
      const { selectionStart, selectionEnd, value } = input;
      if (selectionStart === null || selectionEnd === null) { return; }

      switch (e.key) {
        case 'ArrowUp':
          if (row === 0) { return; }
          e.preventDefault();
          focusTraceCell(row - 1, col, 'end');
          return;
        case 'ArrowDown':
          if (row >= rows - 1) { return; }
          e.preventDefault();
          focusTraceCell(row + 1, col, 'end');
          return;
        case 'ArrowLeft':
          if (selectionStart !== 0 || selectionEnd !== 0) { return; }
          if (col === 0) { return; }
          e.preventDefault();
          focusTraceCell(row, col - 1, 'end');
          return;
        case 'ArrowRight':
          if (selectionStart !== value.length || selectionEnd !== value.length) { return; }
          if (col >= cols - 1) { return; }
          e.preventDefault();
          focusTraceCell(row, col + 1, 'start');
          return;
        default:
          return;
      }
    },
    [traceCells, focusTraceCell],
  );

  const setTraceCellRef = (row: number, col: number, el: HTMLInputElement | null) => {
    if (!traceCellRefs.current[row]) {
      traceCellRefs.current[row] = [];
    }
    traceCellRefs.current[row][col] = el;
  };

  return (
    <aside
      id={panelId}
      className={`question-workspace${collapsed ? ' is-collapsed' : ''}`}
      aria-label="Workspace"
      aria-hidden={collapsed}
    >
      <div className="workspace-tabs" role="tablist" aria-label="Workspace mode">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'notes'}
          className={`workspace-tab ${tab === 'notes' ? 'active' : ''}`}
          onClick={() => setTab('notes')}
        >
          Notes
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'trace'}
          className={`workspace-tab ${tab === 'trace' ? 'active' : ''}`}
          onClick={() => setTab('trace')}
        >
          Variable Trace
        </button>
      </div>

      {tab === 'notes' ? (
        <textarea
          className="workspace-notes"
          role="tabpanel"
          aria-label="Notes"
          placeholder="Scratch work, pseudocode, reminders…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      ) : (
        <div className="workspace-trace" role="tabpanel" aria-label="Variable trace">
          <span ref={traceMeasureRef} className="workspace-trace-measure" aria-hidden />
          <table className="workspace-trace-table">
            <tbody>
              {traceCells.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, colIndex) => (
                    <td
                      key={colIndex}
                      style={
                        traceColWidthsPx[colIndex] !== undefined
                          ? { width: traceColWidthsPx[colIndex], minWidth: traceColWidthsPx[colIndex] }
                          : undefined
                      }
                    >
                      <input
                        ref={(el) => setTraceCellRef(rowIndex, colIndex, el)}
                        type="text"
                        className="workspace-trace-cell"
                        value={cell}
                        aria-label={`Row ${rowIndex + 1}, column ${colIndex + 1}`}
                        onChange={(e) =>
                          updateTraceCell(rowIndex, colIndex, e.target.value)
                        }
                        onKeyDown={(e) => handleTraceCellKeyDown(e, rowIndex, colIndex)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </aside>
  );
};
