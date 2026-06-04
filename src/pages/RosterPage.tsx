import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { studentsService, type Student } from "../services/students";
import { classesService, type Class, type CoInstructor } from "../services/classes";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faFilter, faFilterCircleXmark, faSortUp, faSortDown, faSort } from '@fortawesome/free-solid-svg-icons';
import SectionCombobox from "../components/SectionCombobox";
import "./RosterPage.css";

type EditingState = {
  id: number;
  field: 'first_name' | 'last_name' | 'email' | 'section' | 'notes';
  value: string;
};

export default function RosterPage({
  classId,
  className,
  onClassRenamed,
}: {
  classId: number | null;
  className?: string | null;
  onClassRenamed?: (cls: Class) => void;
}) {
  type SortField = "email" | "first_name" | "last_name" | "section" | "notes" | "created_at";
  const PAGE_SIZE = 10;

  const [students, setStudents] = useState<Student[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Array<{ line: number; email?: string; reason: string }>>([]);
  const [uploadSummary, setUploadSummary] = useState<any>(null);

  const [sortBy, setSortBy] = useState<SortField>("email");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const requestIdRef = useRef(0);
  const filtersRef = useRef<{
    classId: number | null;
    columnFilters: {
      email: string;
      first_name: string;
      last_name: string;
      notes: string;
    };
    sectionFilter: string | null;
    sortBy: SortField;
    sortOrder: "asc" | "desc";
  }>({
    classId,
    columnFilters: { email: "", first_name: "", last_name: "", notes: "" },
    sectionFilter: null,
    sortBy,
    sortOrder,
  });

  const [editing, setEditing] = useState<EditingState | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualForm, setManualForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    section: "",
    notes: "",
  });
  const [sectionSuggestions, setSectionSuggestions] = useState<string[]>([]);
  const [defaultImportSection, setDefaultImportSection] = useState("");
  const [sectionFilter, setSectionFilter] = useState<string | null>(null);
  const [sectionFilterDraft, setSectionFilterDraft] = useState("");
  const [showSectionFilterPicker, setShowSectionFilterPicker] = useState(false);
  const [columnFilters, setColumnFilters] = useState({
    email: "",
    first_name: "",
    last_name: "",
    notes: "",
  });
  const [columnFilterDrafts, setColumnFilterDrafts] = useState({
    email: "",
    first_name: "",
    last_name: "",
    notes: "",
  });
  const [activeTextFilterPicker, setActiveTextFilterPicker] = useState<"email" | "first_name" | "last_name" | "notes" | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSaving, setManualSaving] = useState(false);
  const [coInstructors, setCoInstructors] = useState<CoInstructor[]>([]);
  const [coInstructorEmail, setCoInstructorEmail] = useState("");
  const [coInstructorError, setCoInstructorError] = useState<string | null>(null);
  const [coInstructorSaving, setCoInstructorSaving] = useState(false);
  const [classNameDraft, setClassNameDraft] = useState(className ?? "");
  const [classRenameError, setClassRenameError] = useState<string | null>(null);
  const [classRenameSaving, setClassRenameSaving] = useState(false);

  // Keep the current filter context for "load more" without re-creating effects.
  useEffect(() => {
    filtersRef.current = { classId, columnFilters, sectionFilter, sortBy, sortOrder };
  }, [classId, columnFilters, sectionFilter, sortBy, sortOrder]);

  const reloadFirstPage = useCallback(async () => {
    requestIdRef.current += 1;
    const reqId = requestIdRef.current;

    setLoadingInitial(true);
    setLoadingMore(false);
    setPage(1);
    setEditing(null);

    try {
      const data = await studentsService.list(
        1,
        PAGE_SIZE,
        "",
        false,
        classId ?? undefined,
        columnFilters,
        sectionFilter,
        sortBy,
        sortOrder,
      );
      if (reqId !== requestIdRef.current) return;
      setStudents(data.items);
      setTotal(data.total);
      setHasMore(data.page < data.total_pages && data.items.length > 0);
    } catch (e) {
      alert(`Failed to load students: ${e}`);
    } finally {
      if (reqId === requestIdRef.current) setLoadingInitial(false);
    }
  }, [classId, "", columnFilters, sectionFilter, sortBy, sortOrder]);

  useEffect(() => {
    reloadFirstPage();
  }, [reloadFirstPage]);

  const refreshSectionSuggestions = useCallback(async () => {
    if (!classId) {
      setSectionSuggestions([]);
      return;
    }
    try {
      const sections = await studentsService.listSections(classId);
      setSectionSuggestions(sections);
    } catch {
      setSectionSuggestions([]);
    }
  }, [classId]);

  useEffect(() => {
    refreshSectionSuggestions();
  }, [refreshSectionSuggestions]);

  useEffect(() => {
    setSectionFilter(null);
    setSectionFilterDraft("");
    setShowSectionFilterPicker(false);
    setColumnFilters({ email: "", first_name: "", last_name: "", notes: "" });
    setColumnFilterDrafts({ email: "", first_name: "", last_name: "", notes: "" });
    setActiveTextFilterPicker(null);
  }, [classId]);

  useEffect(() => {
    setClassNameDraft(className ?? "");
    setClassRenameError(null);
  }, [className, classId]);

  useEffect(() => {
    setCoInstructorError(null);
    setCoInstructorEmail("");
    if (!classId) {
      setCoInstructors([]);
      return;
    }
    classesService
      .listCoInstructors(classId)
      .then(setCoInstructors)
      .catch(() => setCoInstructors([]));
  }, [classId]);

  const handleSaveClassName = async () => {
    if (!classId) return;
    const trimmed = classNameDraft.trim();
    if (!trimmed) {
      setClassRenameError("Class name cannot be empty");
      setClassNameDraft(className ?? "");
      return;
    }
    if (trimmed === (className ?? "").trim()) {
      setClassRenameError(null);
      setClassNameDraft(trimmed);
      return;
    }
    setClassRenameSaving(true);
    setClassRenameError(null);
    try {
      const updated = await classesService.rename(classId, trimmed);
      setClassNameDraft(updated.class_name);
      onClassRenamed?.(updated);
    } catch (err) {
      setClassRenameError(err instanceof Error ? err.message : "Failed to rename class");
      setClassNameDraft(className ?? "");
    } finally {
      setClassRenameSaving(false);
    }
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setUploadSummary(null);
    setErrors([]);
    try {
      const res = await studentsService.addFromCsv(file, classId, defaultImportSection);
      setUploadSummary(res.summary);
      setErrors(res.errors);
      await reloadFirstPage();
      await refreshSectionSuggestions();
    } catch (e) {
      alert(String(e));
    } finally {
      setUploading(false);
    }
  };

  const loadMore = useCallback(() => {
    if (loadingInitial || loadingMore) return;
    if (!hasMore) return;
    setPage(p => p + 1);
  }, [hasMore, loadingInitial, loadingMore]);

  // Fetch subsequent pages for infinite scroll.
  useEffect(() => {
    if (page === 1) return;
    const reqId = requestIdRef.current;
    const {
      classId: currentClassId,
      columnFilters: currentColumnFilters,
      sectionFilter: currentSectionFilter,
      sortBy: currentSortBy,
      sortOrder: currentSortOrder,
    } = filtersRef.current;

    setLoadingMore(true);
    (async () => {
      try {
        const data = await studentsService.list(
          page,
          PAGE_SIZE,
          "",
          false,
          currentClassId ?? undefined,
          currentColumnFilters,
          currentSectionFilter,
          currentSortBy,
          currentSortOrder,
        );
        if (reqId !== requestIdRef.current) return;
        setStudents(prev => [...prev, ...data.items]);
        setTotal(data.total);
        setHasMore(page < data.total_pages && data.items.length > 0);
      } catch (e) {
        alert(`Failed to load more students: ${e}`);
      } finally {
        if (reqId === requestIdRef.current) setLoadingMore(false);
      }
    })();
  }, [page]);

  // Trigger loading more as the user scrolls.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      entries => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        loadMore();
      },
      { root: null, rootMargin: "600px", threshold: 0.01 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(o => (o === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(field);
    setSortOrder("asc");
  };

  const sortIconFor = (field: SortField) => {
    if (sortBy !== field) return faSort;
    return sortOrder === "asc" ? faSortDown : faSortUp;
  };

  const hasTextFilter = (field: "email" | "first_name" | "last_name" | "notes") =>
    Boolean(columnFilters[field].trim());

  const clearSectionFilter = () => {
    setSectionFilter(null);
    setSectionFilterDraft("");
    setShowSectionFilterPicker(false);
  };

  const openTextFilter = (field: "email" | "first_name" | "last_name" | "notes") => {
    setShowSectionFilterPicker(false);
    setActiveTextFilterPicker(field);
    setColumnFilterDrafts((prev) => ({ ...prev, [field]: columnFilters[field] }));
  };

  const closeTextFilter = (field: "email" | "first_name" | "last_name" | "notes") => {
    setColumnFilterDrafts((prev) => ({ ...prev, [field]: columnFilters[field] }));
    setActiveTextFilterPicker((cur) => (cur === field ? null : cur));
  };

  // Client-side filtering fallback so filter UX remains correct even
  // if backend filter params are delayed/missed by the running API process.
  const visibleStudents = useMemo(() => {
    const emailNeedle = columnFilters.email.trim().toLowerCase();
    const firstNameNeedle = columnFilters.first_name.trim().toLowerCase();
    const lastNameNeedle = columnFilters.last_name.trim().toLowerCase();
    const notesNeedle = columnFilters.notes.trim().toLowerCase();
    const sectionNeedle = sectionFilter?.trim().toLowerCase() ?? null;

    return students.filter((s) => {
      if (emailNeedle && !s.email.toLowerCase().includes(emailNeedle)) return false;
      if (firstNameNeedle && !s.first_name.toLowerCase().includes(firstNameNeedle)) return false;
      if (lastNameNeedle && !s.last_name.toLowerCase().includes(lastNameNeedle)) return false;
      if (notesNeedle && !(s.notes ?? "").toLowerCase().includes(notesNeedle)) return false;
      if (sectionNeedle && !(s.section ?? "").toLowerCase().includes(sectionNeedle)) return false;
      return true;
    });
  }, [students, columnFilters, sectionFilter]);
  const isRefreshing = loadingInitial && students.length > 0;

  const handleInlineEdit = async (student: Student, field: EditingState['field'], newValue: string) => {
    const normalized =
      field === "section" ? newValue.trim() : field === "notes" ? newValue : newValue;
    const current =
      field === "section"
        ? student.section || ""
        : field === "notes"
          ? student.notes || ""
          : (student[field] as string) || "";

    if (normalized === current) {
      setEditing(null);
      return;
    }

    try {
      const payload =
        field === "section"
          ? { section: normalized }
          : field === "notes"
            ? { notes: normalized.trim() || null }
            : { [field]: normalized };
      const updated = await studentsService.update(student.id, payload);
      setStudents(prev => prev.map(s => (s.id === student.id ? updated : s)));
      setEditing(null);
      if (field === "section") await refreshSectionSuggestions();
    } catch (e) {
      alert(`Failed to update: ${e}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this student?')) return;
    try {
      await studentsService.delete(id);
      await reloadFirstPage();
    } catch (e) {
      alert(`Failed to delete: ${e}`);
    }
  };

  const handleManualSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    setManualError(null);
    setManualSaving(true);
    try {
      await studentsService.create({
        email: manualForm.email,
        first_name: manualForm.first_name,
        last_name: manualForm.last_name,
        notes: manualForm.notes || undefined,
        section: manualForm.section.trim() || undefined,
        class_id: classId,
      });
      setManualForm({ first_name: "", last_name: "", email: "", section: "", notes: "" });
      setShowManualForm(false);
      await reloadFirstPage();
      await refreshSectionSuggestions();
    } catch (err) {
      setManualError(err instanceof Error ? err.message : String(err));
    } finally {
      setManualSaving(false);
    }
  };

  const handleAddCoInstructor = async () => {
    if (!classId || !coInstructorEmail.trim()) return;
    setCoInstructorSaving(true);
    setCoInstructorError(null);
    try {
      const entry = await classesService.addCoInstructor(classId, coInstructorEmail.trim());
      setCoInstructors((prev) => [...prev, entry]);
      setCoInstructorEmail("");
    } catch (err) {
      setCoInstructorError(err instanceof Error ? err.message : "Failed to add co-instructor");
    } finally {
      setCoInstructorSaving(false);
    }
  };

  const handleRemoveCoInstructor = async (userId: number) => {
    if (!classId) return;
    setCoInstructorError(null);
    try {
      await classesService.removeCoInstructor(classId, userId);
      setCoInstructors((prev) => prev.filter((instructor) => instructor.user_id !== userId));
    } catch (err) {
      setCoInstructorError(err instanceof Error ? err.message : "Failed to remove co-instructor");
    }
  };

  return (
    <div className="students-page">
      {classId && (
        <section className="class-rename-panel app-page-panel">
          <div className="class-rename-panel__header">
            <h2>Class Name</h2>
          </div>
          {classRenameError && <div className="class-rename-error">{classRenameError}</div>}
          <div className="class-rename-form">
            <input
              type="text"
              value={classNameDraft}
              onChange={(e) => setClassNameDraft(e.target.value)}
              onBlur={() => void handleSaveClassName()}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSaveClassName();
                if (e.key === "Escape") {
                  setClassNameDraft(className ?? "");
                  setClassRenameError(null);
                }
              }}
              placeholder="Class name"
              className="class-rename-input"
              disabled={classRenameSaving}
              aria-label="Class name"
            />
            {classRenameSaving && <span className="class-rename-saving">Saving…</span>}
          </div>
        </section>
      )}

      {classId && (
        <section className="co-instructors-panel app-page-panel">
          <div className="co-instructors-panel__header">
            <h2>Co-Instructors</h2>
          </div>
          {coInstructorError && <div className="co-instructor-error">{coInstructorError}</div>}
          <div className="co-instructor-add">
            <input
              type="email"
              value={coInstructorEmail}
              onChange={(e) => setCoInstructorEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCoInstructor()}
              placeholder="professor@school.edu"
              className="co-instructor-input"
            />
            <button
              type="button"
              className="co-instructor-button"
              onClick={handleAddCoInstructor}
              disabled={coInstructorSaving || !coInstructorEmail.trim()}
            >
              {coInstructorSaving ? "Adding..." : "Add"}
            </button>
          </div>
          {coInstructors.length !== 0 && (
            <div className="co-instructor-list">
              {coInstructors.map((instructor) => (
                <div key={instructor.user_id} className="co-instructor-row">
                  <div>
                    <div className="co-instructor-name">{instructor.name}</div>
                    <div className="co-instructor-email">{instructor.email}</div>
                  </div>
                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => handleRemoveCoInstructor(instructor.user_id)}
                    title="Remove co-instructor"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <div className="students-controls app-page-panel">
        <div className="students-controls__header">
          <h2>Student Roster</h2>
          <div className="total-count">
            Total students: {total.toLocaleString()}
            {isRefreshing && <span className="students-refreshing-indicator">Loading data…</span>}
          </div>
        </div>
        <div className="student-upload-controls">
          <div>
            <label className="upload-button">
              <span><FontAwesomeIcon icon={faUpload} /> Upload CSV File</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                  e.target.value = '';
                }}
                disabled={uploading}
              />
            </label>
            {classId != null && (
              <span className="students-upload-section">
                <span className="students-upload-section__label">Default section:</span>
                <SectionCombobox
                  value={defaultImportSection}
                  onChange={setDefaultImportSection}
                  suggestions={sectionSuggestions}
                  placeholder="(none)"
                />
              </span>
            )}
          </div>
          <p>Columns: first_name, last_name, email, section (optional).</p>
        </div>
        
        {uploading && (
          <div className="upload-status">
            Adding students...
          </div>
        )}

        {uploadSummary && (
          <div className="upload-summary app-page-panel">
            <strong>Upload Summary:</strong>{" "}
            <>
              {uploadSummary.added > 0 && <span>+{uploadSummary.added} added</span>}
              {uploadSummary.restored > 0 && <span>, {uploadSummary.restored} restored</span>}
              {uploadSummary.skipped > 0 && <span>, {uploadSummary.skipped} skipped</span>}
            </>
            {" "}(processed {uploadSummary.total_processed})
          </div>
        )}

        {errors.length > 0 && (
          <div className="upload-errors">
            <strong>Errors:</strong>
            <ul>
              {errors.map((er, i) => (
                <li key={i}>
                  Line {er.line}{er.email && ` (${er.email})`}: {er.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <table className="students-table">
        <thead>
          <tr>
            <th>
              <div className="students-table-header-controls">
                <button type="button" className="students-table-sort-button" onClick={() => handleSort("email")}>
                  Email
                </button>
                <button
                  type="button"
                  className={`students-table-icon-button ${sortBy === "email" ? "students-table-icon-button--active" : ""}`.trim()}
                  onClick={() => handleSort("email")}
                  title="Sort email"
                >
                  <FontAwesomeIcon icon={sortIconFor("email")} />
                </button>
                <button
                  type="button"
                  className={`students-table-filter-button ${hasTextFilter("email") ? "students-table-filter-button--active" : ""}`.trim()}
                  title="Filter email"
                  onClick={() => openTextFilter("email")}
                >
                  <FontAwesomeIcon icon={faFilter} />
                </button>
                {activeTextFilterPicker === "email" && (
                  <div className="students-table-text-filter-popover">
                    <input
                      type="text"
                      className="inline-edit-input"
                      placeholder="Filter email"
                      autoFocus
                      value={columnFilterDrafts.email}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) => {
                        const next = e.target.value;
                        setColumnFilterDrafts((prev) => ({ ...prev, email: next }));
                      }}
                      onBlur={() => closeTextFilter("email")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setColumnFilters((prev) => ({ ...prev, email: columnFilterDrafts.email.trim() }));
                          setActiveTextFilterPicker(null);
                        }
                        if (e.key === "Escape") closeTextFilter("email");
                      }}
                    />
                  </div>
                )}
              </div>
            </th>
            <th>
              <div className="students-table-header-controls">
                <button
                  type="button"
                  className="students-table-sort-button"
                  onClick={() => handleSort("first_name")}
                >
                  First
                </button>
                <button
                  type="button"
                  className={`students-table-icon-button ${sortBy === "first_name" ? "students-table-icon-button--active" : ""}`.trim()}
                  onClick={() => handleSort("first_name")}
                  title="Sort first name"
                >
                  <FontAwesomeIcon icon={sortIconFor("first_name")} />
                </button>
                <button
                  type="button"
                  className={`students-table-filter-button ${hasTextFilter("first_name") ? "students-table-filter-button--active" : ""}`.trim()}
                  title="Filter first name"
                  onClick={() => openTextFilter("first_name")}
                >
                  <FontAwesomeIcon icon={faFilter} />
                </button>
                {activeTextFilterPicker === "first_name" && (
                  <div className="students-table-text-filter-popover">
                    <input
                      type="text"
                      className="inline-edit-input"
                      placeholder="Filter first name"
                      autoFocus
                      value={columnFilterDrafts.first_name}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) => {
                        const next = e.target.value;
                        setColumnFilterDrafts((prev) => ({ ...prev, first_name: next }));
                      }}
                      onBlur={() => closeTextFilter("first_name")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setColumnFilters((prev) => ({ ...prev, first_name: columnFilterDrafts.first_name.trim() }));
                          setActiveTextFilterPicker(null);
                        }
                        if (e.key === "Escape") closeTextFilter("first_name");
                      }}
                    />
                  </div>
                )}
              </div>
            </th>
            <th>
              <div className="students-table-header-controls">
                <button type="button" className="students-table-sort-button" onClick={() => handleSort("last_name")}>
                  Last
                </button>
                <button
                  type="button"
                  className={`students-table-icon-button ${sortBy === "last_name" ? "students-table-icon-button--active" : ""}`.trim()}
                  onClick={() => handleSort("last_name")}
                  title="Sort last name"
                >
                  <FontAwesomeIcon icon={sortIconFor("last_name")} />
                </button>
                <button
                  type="button"
                  className={`students-table-filter-button ${hasTextFilter("last_name") ? "students-table-filter-button--active" : ""}`.trim()}
                  title="Filter last name"
                  onClick={() => openTextFilter("last_name")}
                >
                  <FontAwesomeIcon icon={faFilter} />
                </button>
                {activeTextFilterPicker === "last_name" && (
                  <div className="students-table-text-filter-popover">
                    <input
                      type="text"
                      className="inline-edit-input"
                      placeholder="Filter last name"
                      autoFocus
                      value={columnFilterDrafts.last_name}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) => {
                        const next = e.target.value;
                        setColumnFilterDrafts((prev) => ({ ...prev, last_name: next }));
                      }}
                      onBlur={() => closeTextFilter("last_name")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setColumnFilters((prev) => ({ ...prev, last_name: columnFilterDrafts.last_name.trim() }));
                          setActiveTextFilterPicker(null);
                        }
                        if (e.key === "Escape") closeTextFilter("last_name");
                      }}
                    />
                  </div>
                )}
              </div>
            </th>
            <th>
              <div className="students-table-header-controls students-table-section-header">
                <button type="button" className="students-table-sort-button" onClick={() => handleSort("section")}>
                  Section
                </button>
                <button
                  type="button"
                  className={`students-table-icon-button ${sortBy === "section" ? "students-table-icon-button--active" : ""}`.trim()}
                  onClick={() => handleSort("section")}
                  title="Sort section"
                >
                  <FontAwesomeIcon icon={sortIconFor("section")} />
                </button>
                <button
                  type="button"
                  className="students-table-filter-button"
                  title={sectionFilter ? "Clear section filter" : "Filter by section"}
                  onClick={() => {
                    if (sectionFilter) {
                      clearSectionFilter();
                    } else {
                      setActiveTextFilterPicker(null);
                      setShowSectionFilterPicker((v) => !v);
                    }
                  }}
                >
                  <FontAwesomeIcon icon={sectionFilter ? faFilterCircleXmark : faFilter} />
                </button>
                {showSectionFilterPicker && !sectionFilter && (
                  <div className="students-table-section-filter-popover">
                    <SectionCombobox
                      value={sectionFilterDraft}
                      onChange={setSectionFilterDraft}
                      suggestions={sectionSuggestions}
                      placeholder="Select section"
                      autoFocus
                      onCommit={(value) => {
                        const picked = value.trim();
                        if (picked && sectionSuggestions.includes(picked)) {
                          setSectionFilter(picked);
                        }
                        setShowSectionFilterPicker(false);
                      }}
                      onCancel={() => {
                        setSectionFilterDraft("");
                        setShowSectionFilterPicker(false);
                      }}
                    />
                  </div>
                )}
              </div>
            </th>
            <th>
              <div className="students-table-header-controls">
                <button type="button" className="students-table-sort-button" onClick={() => handleSort("notes")}>
                  Notes
                </button>
                <button
                  type="button"
                  className={`students-table-icon-button ${sortBy === "notes" ? "students-table-icon-button--active" : ""}`.trim()}
                  onClick={() => handleSort("notes")}
                  title="Sort notes"
                >
                  <FontAwesomeIcon icon={sortIconFor("notes")} />
                </button>
                <button
                  type="button"
                  className={`students-table-filter-button ${hasTextFilter("notes") ? "students-table-filter-button--active" : ""}`.trim()}
                  title="Filter notes"
                  onClick={() => openTextFilter("notes")}
                >
                  <FontAwesomeIcon icon={faFilter} />
                </button>
                {activeTextFilterPicker === "notes" && (
                  <div className="students-table-text-filter-popover">
                    <input
                      type="text"
                      className="inline-edit-input"
                      placeholder="Filter notes"
                      autoFocus
                      value={columnFilterDrafts.notes}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) => {
                        const next = e.target.value;
                        setColumnFilterDrafts((prev) => ({ ...prev, notes: next }));
                      }}
                      onBlur={() => closeTextFilter("notes")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setColumnFilters((prev) => ({ ...prev, notes: columnFilterDrafts.notes.trim() }));
                          setActiveTextFilterPicker(null);
                        }
                        if (e.key === "Escape") closeTextFilter("notes");
                      }}
                    />
                  </div>
                )}
              </div>
            </th>
            <th>
              <div className="students-table-header-controls">
                <button type="button" className="students-table-sort-button" onClick={() => handleSort("created_at")}>
                  Added
                </button>
                <button
                  type="button"
                  className={`students-table-icon-button ${sortBy === "created_at" ? "students-table-icon-button--active" : ""}`.trim()}
                  onClick={() => handleSort("created_at")}
                  title="Sort date added"
                >
                  <FontAwesomeIcon icon={sortIconFor("created_at")} />
                </button>
              </div>
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {showManualForm ? (
            <>
              <tr>
                <td>
                  <input
                    type="email"
                    value={manualForm.email}
                    onChange={e => setManualForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="student@school.edu"
                    autoFocus
                    className="inline-edit-input"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={manualForm.first_name}
                    onChange={e => setManualForm(f => ({ ...f, first_name: e.target.value }))}
                    placeholder="First"
                    className="inline-edit-input"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={manualForm.last_name}
                    onChange={e => setManualForm(f => ({ ...f, last_name: e.target.value }))}
                    placeholder="Last"
                    className="inline-edit-input"
                  />
                </td>
                <td>
                  <SectionCombobox
                    value={manualForm.section}
                    onChange={v => setManualForm(f => ({ ...f, section: v }))}
                    suggestions={sectionSuggestions}
                    placeholder="Section (optional)"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={manualForm.notes}
                    onChange={e => setManualForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Notes (optional)"
                    className="inline-edit-input"
                  />
                </td>
                <td>
                  <button
                    onClick={handleManualSubmit}
                    className="students-primary-button"
                    disabled={manualSaving || !manualForm.email || !manualForm.first_name || !manualForm.last_name}
                  >
                    {manualSaving ? "Saving…" : "Save"}
                  </button>
                </td><td>
                  <button
                    onClick={() => {
                      setShowManualForm(false);
                      setManualForm({ first_name: "", last_name: "", email: "", section: "", notes: "" });
                      setManualError(null);
                    }}
                    className="delete-button"
                    title="Cancel"
                  >
                    ✕
                  </button>
                </td>
              </tr>
              {manualError && (
                <tr>
                  <td colSpan={7} className="manual-error">
                    {manualError}
                  </td>
                </tr>
              )}
            </>
          ) : (
            <tr
              style={{ cursor: "pointer", opacity: 0.5 }}
              onClick={() => {
                setShowManualForm(true);
                setManualError(null);
              }}
              title="Add a student"
            >
              <td colSpan={7} style={{ padding: "0", letterSpacing: 1, textAlign: "center", fontWeight: "bold", lineHeight: "2.0em" }}>
                <span style={{ fontSize: "1.75em", color: "var(--color-primary)", verticalAlign: "middle" }}>+</span><span style={{ fontSize: "1.0em", color: "var(--text-dashboard)", verticalAlign: "middle" }}> {" "}Add Student</span>
              </td>
            </tr>
          )}

          {loadingInitial && students.length === 0 ? (
            <tr>
              <td colSpan={7} className="loading-cell">
                Loading…
              </td>
            </tr>
          ) : visibleStudents.length === 0 ? (
            <tr>
              <td colSpan={7} className="empty-cell">
                No students
              </td>
            </tr>
          ) : (
            visibleStudents.map(s => (
              <tr key={s.id}>
                <td>
                  {editing?.id === s.id && editing.field === "email" ? (
                    <input
                      type="email"
                      value={editing.value}
                      onChange={e => setEditing({ ...editing, value: e.target.value })}
                      onBlur={() => handleInlineEdit(s, "email", editing.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") handleInlineEdit(s, "email", editing.value);
                        if (e.key === "Escape") setEditing(null);
                      }}
                      autoFocus
                      className="inline-edit-input"
                    />
                  ) : (
                    <span
                      onClick={() => setEditing({ id: s.id, field: "email", value: s.email })}
                      className="editable-cell"
                    >
                      {s.email}
                    </span>
                  )}
                </td>
                <td>
                  {editing?.id === s.id && editing.field === "first_name" ? (
                    <input
                      type="text"
                      value={editing.value}
                      onChange={e => setEditing({ ...editing, value: e.target.value })}
                      onBlur={() => handleInlineEdit(s, "first_name", editing.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") handleInlineEdit(s, "first_name", editing.value);
                        if (e.key === "Escape") setEditing(null);
                      }}
                      autoFocus
                      className="inline-edit-input"
                    />
                  ) : (
                    <span
                      onClick={() => setEditing({ id: s.id, field: "first_name", value: s.first_name })}
                      className="editable-cell"
                    >
                      {s.first_name}
                    </span>
                  )}
                </td>
                <td>
                  {editing?.id === s.id && editing.field === "last_name" ? (
                    <input
                      type="text"
                      value={editing.value}
                      onChange={e => setEditing({ ...editing, value: e.target.value })}
                      onBlur={() => handleInlineEdit(s, "last_name", editing.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") handleInlineEdit(s, "last_name", editing.value);
                        if (e.key === "Escape") setEditing(null);
                      }}
                      autoFocus
                      className="inline-edit-input"
                    />
                  ) : (
                    <span
                      onClick={() => setEditing({ id: s.id, field: "last_name", value: s.last_name })}
                      className="editable-cell"
                    >
                      {s.last_name}
                    </span>
                  )}
                </td>
                <td>
                  {editing?.id === s.id && editing.field === "section" ? (
                    <SectionCombobox
                      value={editing.value}
                      onChange={v => setEditing({ ...editing, value: v })}
                      suggestions={sectionSuggestions}
                      placeholder="Section"
                      autoFocus
                      onCommit={v => handleInlineEdit(s, "section", v)}
                      onCancel={() => setEditing(null)}
                    />
                  ) : (
                    <span
                      onClick={() =>
                        setEditing({ id: s.id, field: "section", value: s.section || "" })
                      }
                      className="editable-cell"
                      title={s.section || "Click to set section"}
                    >
                      {s.section || "—"}
                    </span>
                  )}
                </td>
                <td>
                  {editing?.id === s.id && editing.field === "notes" ? (
                    <input
                      type="text"
                      value={editing.value || ""}
                      onChange={e => setEditing({ ...editing, value: e.target.value })}
                      onBlur={() => handleInlineEdit(s, "notes", editing.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") handleInlineEdit(s, "notes", editing.value);
                        if (e.key === "Escape") setEditing(null);
                      }}
                      placeholder="Add notes..."
                      autoFocus
                      className="inline-edit-input"
                    />
                  ) : (
                    <span
                      onClick={() =>
                        setEditing({ id: s.id, field: "notes", value: s.notes || "" })
                      }
                      className="editable-cell editable-cell-notes"
                      title={s.notes || "Click to add notes"}
                    >
                      {s.notes || "—"}
                    </span>
                  )}
                </td>
                <td>{new Date(s.created_at).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => handleDelete(s.id)} className="delete-button" title="Remove student">
                    🗑️
                  </button>
                </td>
              </tr>
            ))
          )}

          {loadingMore && visibleStudents.length > 0 && (
            <tr>
              <td colSpan={7} className="loading-cell">
                Loading more…
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div ref={sentinelRef} className="students-infinite-sentinel" />
    </div>
  );
}
