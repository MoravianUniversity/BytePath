import { useCallback, useEffect, useRef, useState } from "react";
import { studentsService, type Student } from "../services/students";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload } from '@fortawesome/free-solid-svg-icons';
import "./StudentsPage.css";

type EditingState = {
  id: number;
  field: 'first_name' | 'last_name' | 'email' | 'notes';
  value: string;
};

export default function StudentsPage({ classId, className }: { classId: number | null; className: string | null }) {
  type SortField = "email" | "first_name" | "last_name" | "notes" | "created_at";
  const PAGE_SIZE = 10;

  const [students, setStudents] = useState<Student[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
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
    searchQuery: string;
    sortBy: SortField;
    sortOrder: "asc" | "desc";
  }>({ classId, searchQuery, sortBy, sortOrder });

  const [editing, setEditing] = useState<EditingState | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualForm, setManualForm] = useState({ first_name: "", last_name: "", email: "", notes: "" });
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSaving, setManualSaving] = useState(false);

  // Keep the current filter context for "load more" without re-creating effects.
  useEffect(() => {
    filtersRef.current = { classId, searchQuery, sortBy, sortOrder };
  }, [classId, searchQuery, sortBy, sortOrder]);

  const reloadFirstPage = useCallback(async () => {
    requestIdRef.current += 1;
    const reqId = requestIdRef.current;

    setLoadingInitial(true);
    setLoadingMore(false);
    setStudents([]);
    setHasMore(false);
    setTotal(0);
    setPage(1);
    setEditing(null);

    try {
      const data = await studentsService.list(
        1,
        PAGE_SIZE,
        searchQuery,
        false,
        classId ?? undefined,
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
  }, [classId, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    reloadFirstPage();
  }, [reloadFirstPage]);

  const doSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setUploadSummary(null);
    setErrors([]);
    try {
      const res = await studentsService.addFromCsv(file, classId);
      setUploadSummary(res.summary);
      setErrors(res.errors);
      await reloadFirstPage();
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
    const { classId: currentClassId, searchQuery: currentSearchQuery, sortBy: currentSortBy, sortOrder: currentSortOrder } = filtersRef.current;

    setLoadingMore(true);
    (async () => {
      try {
        const data = await studentsService.list(
          page,
          PAGE_SIZE,
          currentSearchQuery,
          false,
          currentClassId ?? undefined,
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

  const handleInlineEdit = async (student: Student, field: EditingState['field'], newValue: string) => {
    if (newValue === (student[field] || '')) {
      setEditing(null);
      return;
    }

    try {
      const updated = await studentsService.update(student.id, { [field]: newValue });
      setStudents(prev => prev.map(s => s.id === student.id ? updated : s));
      setEditing(null);
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
        class_id: classId,
      });
      setManualForm({ first_name: "", last_name: "", email: "", notes: "" });
      setShowManualForm(false);
      await reloadFirstPage();
    } catch (err) {
      setManualError(err instanceof Error ? err.message : String(err));
    } finally {
      setManualSaving(false);
    }
  };

  return (
    <div className="students-page">
      <div className="students-header">
        <div className="students-header__content">
          <h1>{className ? `${className} Students` : 'Students'}</h1>
          <p className="students-description app-page-lead">
            Add students via CSV upload (first name, last name, email), add or edit inline, or remove students
          </p>
        </div>
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

      <div className="students-controls app-page-panel">
        <form onSubmit={doSearch} className="search-form">
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search name or email…"
            className="search-input"
          />
          <button type="submit" className="search-button">Search</button>
        </form>
        <div className="total-count">
          Total students: {total.toLocaleString()}
        </div>
      </div>

      <table className="students-table">
        <thead>
          <tr>
            <th>
              <button type="button" className="students-table-sort-button" onClick={() => handleSort("email")}>
                Email{" "}
                {sortBy === "email" && (
                  <span className="students-table-sort-indicator">{sortOrder === "asc" ? "▲" : "▼"}</span>
                )}
              </button>
            </th>
            <th>
              <button
                type="button"
                className="students-table-sort-button"
                onClick={() => handleSort("first_name")}
              >
                First Name{" "}
                {sortBy === "first_name" && (
                  <span className="students-table-sort-indicator">{sortOrder === "asc" ? "▲" : "▼"}</span>
                )}
              </button>
            </th>
            <th>
              <button type="button" className="students-table-sort-button" onClick={() => handleSort("last_name")}>
                Last Name{" "}
                {sortBy === "last_name" && (
                  <span className="students-table-sort-indicator">{sortOrder === "asc" ? "▲" : "▼"}</span>
                )}
              </button>
            </th>
            <th>
              <button type="button" className="students-table-sort-button" onClick={() => handleSort("notes")}>
                Notes{" "}
                {sortBy === "notes" && (
                  <span className="students-table-sort-indicator">{sortOrder === "asc" ? "▲" : "▼"}</span>
                )}
              </button>
            </th>
            <th>
              <button type="button" className="students-table-sort-button" onClick={() => handleSort("created_at")}>
                Added{" "}
                {sortBy === "created_at" && (
                  <span className="students-table-sort-indicator">{sortOrder === "asc" ? "▲" : "▼"}</span>
                )}
              </button>
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {showManualForm ? (
            <tr>
              <td>
                <input
                  type="email"
                  value={manualForm.email}
                  onChange={e => setManualForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="email@school.edu"
                  autoFocus
                  className="inline-edit-input"
                />
              </td>
              <td>
                <input
                  type="text"
                  value={manualForm.first_name}
                  onChange={e => setManualForm(f => ({ ...f, first_name: e.target.value }))}
                  placeholder="First name"
                  className="inline-edit-input"
                />
              </td>
              <td>
                <input
                  type="text"
                  value={manualForm.last_name}
                  onChange={e => setManualForm(f => ({ ...f, last_name: e.target.value }))}
                  placeholder="Last name"
                  className="inline-edit-input"
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
                  className="search-button"
                  disabled={manualSaving || !manualForm.email || !manualForm.first_name || !manualForm.last_name}
                >
                  {manualSaving ? "Saving…" : "Save"}
                </button>
              </td><td>
                <button
                  onClick={() => {
                    setShowManualForm(false);
                    setManualForm({ first_name: "", last_name: "", email: "", notes: "" });
                    setManualError(null);
                  }}
                  className="delete-button"
                  title="Cancel"
                >
                  ✕
                </button>
                {/* {manualError && (
                  <span style={{ color: "var(--color-error-bright)", fontSize: "0.85em", marginLeft: 8 }}>
                    {manualError}
                  </span>
                )} */}
              </td>
            </tr>
          ) : (
            <tr
              style={{ cursor: "pointer", opacity: 0.5 }}
              onClick={() => {
                setShowManualForm(true);
                setManualError(null);
              }}
              title="Add a student"
            >
              <td colSpan={6} style={{ padding: "0", letterSpacing: 1, textAlign: "center", fontWeight: "bold", lineHeight: "2.0em" }}>
                <span style={{ fontSize: "1.75em", color: "var(--color-primary)", verticalAlign: "middle" }}>+</span><span style={{ fontSize: "1.0em", color: "var(--text-dashboard)", verticalAlign: "middle" }}> {" "}Add Student</span>
              </td>
            </tr>
          )}

          {loadingInitial ? (
            <tr>
              <td colSpan={6} className="loading-cell">
                Loading…
              </td>
            </tr>
          ) : students.length === 0 ? (
            <tr>
              <td colSpan={6} className="empty-cell">
                No students
              </td>
            </tr>
          ) : (
            students.map(s => (
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

          {loadingMore && students.length > 0 && (
            <tr>
              <td colSpan={6} className="loading-cell">
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
