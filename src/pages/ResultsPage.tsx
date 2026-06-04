import { useEffect, useMemo, useState } from 'react';
import ResultsTimeRangeSlider from '../components/ResultsTimeRangeSlider';
import { reportsService, type ClassResultsResponse } from '../services/reports';
import {
  buildResultsColumns,
  buildResultsCsv,
  buildResultsExportFilename,
  collectAssignmentDueDatePips,
  computeCellGrade,
  downloadResultsCsv,
  formatGrade,
  isFullActivityRange,
  buildTimeRangeSliderPips,
  clampTimeRange,
  getDefaultResultsTimeRange,
  resolveResultsTimeBounds,
  gradeColor,
  type AssignmentGroupMode,
  type GradeMetric,
  type ResultsTimeRange,
} from '../utils/resultsGrid';
import './ResultsPage.css';
import { faFileCsv } from '@fortawesome/free-solid-svg-icons/faFileCsv';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const ALL_SECTIONS_VALUE = '__all_sections__';

const GROUP_OPTIONS: { value: AssignmentGroupMode; label: string }[] = [
  { value: 'topic', label: 'Single topic' },
  { value: 'due-time', label: 'Due at the same time' },
  { value: 'due-day', label: 'Due on the same day' },
];

const GRADE_OPTIONS: { value: GradeMetric; label: string }[] = [
  { value: 'subtopics-completed', label: 'Subtopics completed (%)' },
];

type HoveredGridCell = { row: number; col: number };

function gridHighlightClass(
  row: number,
  col: number,
  hovered: HoveredGridCell | null,
): string {
  if (!hovered) return '';
  const classes: string[] = [];
  if (hovered.row >= 0 && hovered.row === row) {
    classes.push('results-grid__highlight-row');
  }
  if (hovered.col === col) {
    classes.push('results-grid__highlight-col');
  }
  if (hovered.row === row && hovered.col === col) {
    classes.push('results-grid__highlight-active');
  }
  return classes.join(' ');
}

export default function ResultsPage({
  classId,
}: {
  classId: number | null;
}) {
  const [data, setData] = useState<ClassResultsResponse | null>(null);
  const [classBoundsSource, setClassBoundsSource] = useState<ClassResultsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [groupMode, setGroupMode] = useState<AssignmentGroupMode>('topic');
  const [gradeMetric, setGradeMetric] = useState<GradeMetric>('subtopics-completed');
  const [timeRange, setTimeRange] = useState<ResultsTimeRange | null>(null);
  const [hoveredCell, setHoveredCell] = useState<HoveredGridCell | null>(null);

  useEffect(() => {
    setSelectedSection(null);
    setTimeRange(null);
    setClassBoundsSource(null);
  }, [classId]);

  useEffect(() => {
    if (!classId) return;

    let cancelled = false;
    reportsService
      .getClassResults(classId, null)
      .then((response) => {
        if (!cancelled) {
          setClassBoundsSource(response);
        }
      })
      .catch((err) => {
        console.error('Failed to load class time bounds:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [classId]);

  useEffect(() => {
    if (!classId) {
      setData(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    reportsService
      .getClassResults(classId, selectedSection)
      .then((response) => {
        if (!cancelled) {
          setData(response);
        }
      })
      .catch((err) => {
        console.error('Failed to load class results:', err);
        if (!cancelled) {
          setError('Unable to load results right now.');
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [classId, selectedSection]);

  const sectionOptions = data?.sections ?? classBoundsSource?.sections ?? [];
  const showSectionSelector = sectionOptions.length > 1;

  const fullTimeBounds = useMemo(
    () => (
      classBoundsSource
        ? resolveResultsTimeBounds(
          classBoundsSource.activity_bounds,
          classBoundsSource.topic_settings,
          null,
        )
        : null
    ),
    [classBoundsSource],
  );

  const defaultTimeRange = useMemo(
    () => (fullTimeBounds ? getDefaultResultsTimeRange(fullTimeBounds) : null),
    [fullTimeBounds],
  );

  useEffect(() => {
    if (!fullTimeBounds) {
      return;
    }
    setTimeRange((current) => (
      current
        ? clampTimeRange(current, fullTimeBounds)
        : getDefaultResultsTimeRange(fullTimeBounds)
    ));
  }, [fullTimeBounds]);

  const effectiveTimeRange = timeRange ?? defaultTimeRange ?? fullTimeBounds;

  const columns = useMemo(() => {
    if (!data || !effectiveTimeRange || !fullTimeBounds) return [];
    return buildResultsColumns(
      data,
      groupMode,
      selectedSection,
      effectiveTimeRange,
      fullTimeBounds,
    );
  }, [data, groupMode, selectedSection, effectiveTimeRange, fullTimeBounds]);

  const isFilteringByDueDate = Boolean(
    effectiveTimeRange
    && fullTimeBounds
    && !isFullActivityRange(effectiveTimeRange, fullTimeBounds),
  );

  const dueDatePips = useMemo(() => {
    if (!classBoundsSource || !fullTimeBounds) return [];
    const assignmentPips = collectAssignmentDueDatePips(
      classBoundsSource,
      null,
      fullTimeBounds,
    );
    return buildTimeRangeSliderPips(assignmentPips, fullTimeBounds);
  }, [classBoundsSource, fullTimeBounds]);

  const canExport = columns.length > 0 && data != null && data.students.length > 0;

  const handleExportCsv = () => {
    if (!data || !classId || columns.length === 0) return;
    const csv = buildResultsCsv({
      data,
      columns,
      gradeMetric,
      includeSection: selectedSection == null,
    });
    downloadResultsCsv(
      csv,
      buildResultsExportFilename({ classId, section: selectedSection }),
    );
  };

  if (!classId) {
    return (
      <div className="results-page">
        <p className="results-page__empty">Select a class to view results.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="results-page">
        <p className="results-page__empty">Loading results…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-page">
        <p className="results-page__error">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="results-page">
        <p className="results-page__empty">No results available.</p>
      </div>
    );
  }

  return (
    <div className="results-page">
      <div className="dashboard-toolbar results-toolbar">
        <label className="results-toolbar__control">
          <span className="results-toolbar__label">Group assignments</span>
          <select
            className="dashboard-toolbar-select"
            value={groupMode}
            onChange={(event) => setGroupMode(event.target.value as AssignmentGroupMode)}
          >
            {GROUP_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="results-toolbar__control">
          <span className="results-toolbar__label">Grade by</span>
          <select
            className="dashboard-toolbar-select"
            value={gradeMetric}
            onChange={(event) => setGradeMetric(event.target.value as GradeMetric)}
          >
            {GRADE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {showSectionSelector && (
          <label className="results-toolbar__control">
            <span className="results-toolbar__label">Section</span>
            <select
              className="dashboard-toolbar-select"
              value={selectedSection ?? ALL_SECTIONS_VALUE}
              onChange={(event) => {
                const value = event.target.value;
                setSelectedSection(value === ALL_SECTIONS_VALUE ? null : value);
              }}
            >
              <option value={ALL_SECTIONS_VALUE}>All Sections</option>
              {sectionOptions.map((section) => (
                <option key={section === '' ? '__empty_section__' : section} value={section}>
                  {section === '' ? '(No Section)' : section}
                </option>
              ))}
            </select>
          </label>
        )}

        <button
          className="btn-secondary results-toolbar__export"
          type="button"
          onClick={handleExportCsv}
          disabled={!canExport}
        >
          <FontAwesomeIcon icon={faFileCsv} />{" "}
          Export CSV
        </button>
      </div>

      {fullTimeBounds && (
        <ResultsTimeRangeSlider
          bounds={fullTimeBounds}
          value={timeRange ?? fullTimeBounds}
          dueDatePips={dueDatePips}
          onChange={setTimeRange}
        />
      )}

      {columns.length === 0 ? (
        <p className="results-page__empty">
          {isFilteringByDueDate
            ? 'No assignments due in this time range.'
            : 'No assigned topics to display.'}
        </p>
      ) : data.students.length === 0 ? (
        <p className="results-page__empty">No students on the roster.</p>
      ) : (
        <div className="results-grid-scroll">
          <table
            className="results-grid"
            onMouseLeave={() => setHoveredCell(null)}
          >
            <thead>
              <tr>
                <th
                  className={`results-grid__student-header ${gridHighlightClass(-1, 0, hoveredCell)}`}
                  scope="col"
                  onMouseEnter={() => setHoveredCell({ row: -1, col: 0 })}
                >
                  Student
                </th>
                {columns.map((column, colIndex) => (
                  <th
                    key={column.id}
                    scope="col"
                    className={gridHighlightClass(-1, colIndex + 1, hoveredCell)}
                    onMouseEnter={() => setHoveredCell({ row: -1, col: colIndex + 1 })}
                  >
                    <div className="results-grid__column-header">
                      <span className="results-grid__column-label">{column.label}</span>
                      {column.subtitle && (
                        <span
                          className="results-grid__column-due"
                          title={column.subtitleTitle ?? undefined}
                        >
                          {column.subtitle}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.students.map((student, rowIndex) => (
                <tr key={student.student_email}>
                  <th
                    scope="row"
                    className={`results-grid__student-cell ${gridHighlightClass(rowIndex, 0, hoveredCell)}`}
                    onMouseEnter={() => setHoveredCell({ row: rowIndex, col: 0 })}
                  >
                    <span className="results-grid__student-name">{student.student_name}</span>
                    <span className="results-grid__student-email">{student.student_email}</span>
                  </th>
                  {columns.map((column, colIndex) => {
                    const col = colIndex + 1;
                    const highlight = gridHighlightClass(rowIndex, col, hoveredCell);
                    const grade = computeCellGrade(data, student, column, gradeMetric);
                    if (grade == null) {
                      return (
                        <td
                          key={column.id}
                          className={`results-grid__cell results-grid__cell--na ${highlight}`}
                          onMouseEnter={() => setHoveredCell({ row: rowIndex, col })}
                        >
                          —
                        </td>
                      );
                    }

                    return (
                      <td
                        key={column.id}
                        className={`results-grid__cell ${highlight}`}
                        style={{ backgroundColor: gradeColor(grade) }}
                        title={`${student.student_name}: ${formatGrade(grade)}`}
                        onMouseEnter={() => setHoveredCell({ row: rowIndex, col })}
                      >
                        {formatGrade(grade)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
