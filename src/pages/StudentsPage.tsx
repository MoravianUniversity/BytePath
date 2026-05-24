import { useEffect, useMemo, useState } from "react";
import { studentsService, type Student, type UploadHistory } from "../services/students";
import Button from "../components/ui/Button";
import "./StudentsPage.css";

type EditingState = {
  id: number;
  field: 'first_name' | 'last_name' | 'email' | 'notes';
  value: string;
};

export default function StudentsPage({ classId, className }: { classId: number | null; className: string | null }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Array<{ line: number; email?: string; reason: string }>>([]);
  const [uploadSummary, setUploadSummary] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [selectedUpload, setSelectedUpload] = useState<UploadHistory | null>(null);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualForm, setManualForm] = useState({ first_name: "", last_name: "", email: "", notes: "" });
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSaving, setManualSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await studentsService.list(page, pageSize, search, false, classId ?? undefined);
      setStudents(data.items);
      setTotalPages(data.total_pages);
      setTotal(data.total);
    } catch (e) {
      alert(`Failed to load students: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, classId]);

  const doSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    await load();
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
      await load();
      if (showHistory) loadHistory();
    } catch (e) {
      alert(String(e));
    } finally {
      setUploading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await studentsService.getUploadHistory(historyPage, 10);
      setUploadHistory(data.uploads);
    } catch (e) {
      alert(`Failed to load history: ${e}`);
    }
  };

  useEffect(() => {
    if (showHistory) loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHistory, historyPage]);

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
      await load();
    } catch (e) {
      alert(`Failed to delete: ${e}`);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedStudents.size === 0) return;
    if (!confirm(`Remove ${selectedStudents.size} student(s)?`)) return;
    try {
      await studentsService.bulkDelete(Array.from(selectedStudents));
      setSelectedStudents(new Set());
      await load();
    } catch (e) {
      alert(`Failed to delete: ${e}`);
    }
  };

  const pageSizes = useMemo(() => [10, 20, 50, 100], []);

  const downloadTemplate = async () => {
    try {
      await studentsService.downloadTemplate();
    } catch (error) {
      alert(`Failed to download template: ${error}`);
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
      await load();
    } catch (err) {
      setManualError(err instanceof Error ? err.message : String(err));
    } finally {
      setManualSaving(false);
    }
  };

  if (selectedUpload) {
    return (
      <div className="students-page">
        <Button onClick={() => setSelectedUpload(null)} className="back-button" variant="ghost">
          ← Back to History
        </Button>
        <div className="upload-details">
          <h2>Upload Details: {selectedUpload.filename}</h2>
          <div className="upload-meta">
            <p><strong>Uploaded:</strong> {new Date(selectedUpload.uploaded_at).toLocaleString()}</p>
            <p><strong>Action:</strong> {selectedUpload.action}</p>
            <p><strong>Summary:</strong></p>
            <ul>
              {selectedUpload.summary.added > 0 && <li>+{selectedUpload.summary.added} added</li>}
              {selectedUpload.summary.updated > 0 && <li>{selectedUpload.summary.updated} updated</li>}
              {selectedUpload.summary.removed > 0 && <li>-{selectedUpload.summary.removed} removed</li>}
              {selectedUpload.summary.restored > 0 && <li>{selectedUpload.summary.restored} restored</li>}
              {selectedUpload.summary.skipped > 0 && <li>{selectedUpload.summary.skipped} skipped</li>}
              {selectedUpload.summary.not_found > 0 && <li>{selectedUpload.summary.not_found} not found</li>}
            </ul>
          </div>
          <div className="change-log">
            <h3>Change Log</h3>
            <div className="change-list">
              {selectedUpload.changes.map((change, i) => (
                <div key={i} className={`change-item change-${change.type}`}>
                  <span className="change-action">{change.action}</span>
                  <span className="change-email">{change.email}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showHistory) {
    return (
      <div className="students-page">
        <div className="students-header">
          <Button onClick={() => setShowHistory(false)} className="back-button" variant="ghost">
            ← Back to Students
          </Button>
          <h2>Upload History</h2>
        </div>
        <div className="history-list">
          {uploadHistory.map((upload) => (
            <div
              key={upload.id}
              className="history-item"
              onClick={() => setSelectedUpload(upload)}
            >
              <div className="history-item-header">
                <span className="history-filename">{upload.filename}</span>
                <span className={`history-action history-action-${upload.action}`}>
                  {upload.action}
                </span>
              </div>
              <div className="history-item-meta">
                <span>{new Date(upload.uploaded_at).toLocaleString()}</span>
                <span className="history-summary">
                  {upload.summary.added > 0 && `+${upload.summary.added} `}
                  {upload.summary.removed > 0 && `-${upload.summary.removed} `}
                  {upload.summary.restored > 0 && `↻${upload.summary.restored} `}
                  {upload.summary.skipped > 0 && `⊘${upload.summary.skipped}`}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="pagination">
          <button onClick={() => setHistoryPage(p => Math.max(1, p - 1))} disabled={historyPage <= 1}>
            Prev
          </button>
          <span>Page {historyPage}</span>
          <button onClick={() => setHistoryPage(p => p + 1)} disabled={uploadHistory.length < 10}>
            Next
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="students-page">
      <div className="students-header">
        <h2>{className ? `${className} — Student Bank` : 'Student Bank'}</h2>
        <button onClick={() => setShowHistory(true)} className="history-button">
          📋 Upload History
        </button>
      </div>

      <p className="students-description">
        Manage your student roster. Add students via CSV upload, edit inline, or remove students.
      </p>

      <div className="students-controls">
        <form onSubmit={doSearch} className="search-form">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="search-input"
          />
          <button type="submit" className="search-button">Search</button>
        </form>

        <div className="upload-buttons">
          <label className="upload-button upload-button-add">
            <span>📥 Add Students</span>
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
          <button
            onClick={downloadTemplate}
            className="upload-button upload-button-add"
            type="button"
          >
            📄 Template
          </button>
        </div>
      </div>

      {uploading && (
        <div className="upload-status">
          Adding students...
        </div>
      )}

      {uploadSummary && (
        <div className="upload-summary">
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

      {selectedStudents.size > 0 && (
        <div className="bulk-actions">
          <span>{selectedStudents.size} selected</span>
          <button onClick={handleBulkDelete} className="bulk-delete-button">
            Remove Selected
          </button>
        </div>
      )}

      <div className="pagination-controls">
        <span>Rows per page</span>
        <select
          value={pageSize}
          onChange={e => setPageSize(Number(e.target.value))}
          className="page-size-select"
        >
          {pageSizes.map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <div className="pagination-buttons">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={loading || page <= 1}
          >
            Prev
          </button>
          <span>Page {totalPages ? page : 1} / {totalPages || 1}</span>
          <button
            onClick={() => setPage(p => (totalPages ? Math.min(totalPages, p + 1) : p + 1))}
            disabled={loading || (totalPages > 0 && page >= totalPages)}
          >
            Next
          </button>
          <span className="total-count">Total: {total}</span>
        </div>
      </div>

      <div className="students-table-container">
        <table className="students-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedStudents.size === students.length && students.length > 0}
                  onChange={e => {
                    if (e.target.checked) {
                      setSelectedStudents(new Set(students.map(s => s.id)));
                    } else {
                      setSelectedStudents(new Set());
                    }
                  }}
                />
              </th>
              <th>Email</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Notes</th>
              <th>Added</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {showManualForm ? (
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                <td />
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
                <td colSpan={2} style={{ whiteSpace: "nowrap" }}>
                  <button
                    onClick={handleManualSubmit}
                    className="search-button"
                    disabled={manualSaving || !manualForm.email || !manualForm.first_name || !manualForm.last_name}
                    style={{ marginRight: 6 }}
                  >
                    {manualSaving ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => { setShowManualForm(false); setManualForm({ first_name: "", last_name: "", email: "", notes: "" }); setManualError(null); }}
                    className="delete-button"
                    title="Cancel"
                  >
                    ✕
                  </button>
                  {manualError && <span style={{ color: "#ff8080", fontSize: "0.85em", marginLeft: 8 }}>{manualError}</span>}
                </td>
              </tr>
            ) : (
              <tr
                style={{ cursor: "pointer", opacity: 0.5 }}
                onClick={() => { setShowManualForm(true); setManualError(null); }}
                title="Add a student"
              >
                <td />
                <td colSpan={6} style={{ padding: "0.5rem 0.6rem", fontSize: "1.2em", letterSpacing: 1 }}>+</td>
              </tr>
            )}
            {loading ? (
              <tr>
                <td colSpan={7} className="loading-cell">Loading…</td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-cell">No students</td>
              </tr>
            ) : (
              students.map(s => (
                <tr key={s.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedStudents.has(s.id)}
                      onChange={e => {
                        const newSet = new Set(selectedStudents);
                        if (e.target.checked) {
                          newSet.add(s.id);
                        } else {
                          newSet.delete(s.id);
                        }
                        setSelectedStudents(newSet);
                      }}
                    />
                  </td>
                  <td>
                    {editing?.id === s.id && editing.field === 'email' ? (
                      <input
                        type="email"
                        value={editing.value}
                        onChange={e => setEditing({ ...editing, value: e.target.value })}
                        onBlur={() => handleInlineEdit(s, 'email', editing.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleInlineEdit(s, 'email', editing.value);
                          if (e.key === 'Escape') setEditing(null);
                        }}
                        autoFocus
                        className="inline-edit-input"
                      />
                    ) : (
                      <span
                        onClick={() => setEditing({ id: s.id, field: 'email', value: s.email })}
                        className="editable-cell"
                      >
                        {s.email}
                      </span>
                    )}
                  </td>
                  <td>
                    {editing?.id === s.id && editing.field === 'first_name' ? (
                      <input
                        type="text"
                        value={editing.value}
                        onChange={e => setEditing({ ...editing, value: e.target.value })}
                        onBlur={() => handleInlineEdit(s, 'first_name', editing.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleInlineEdit(s, 'first_name', editing.value);
                          if (e.key === 'Escape') setEditing(null);
                        }}
                        autoFocus
                        className="inline-edit-input"
                      />
                    ) : (
                      <span
                        onClick={() => setEditing({ id: s.id, field: 'first_name', value: s.first_name })}
                        className="editable-cell"
                      >
                        {s.first_name}
                      </span>
                    )}
                  </td>
                  <td>
                    {editing?.id === s.id && editing.field === 'last_name' ? (
                      <input
                        type="text"
                        value={editing.value}
                        onChange={e => setEditing({ ...editing, value: e.target.value })}
                        onBlur={() => handleInlineEdit(s, 'last_name', editing.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleInlineEdit(s, 'last_name', editing.value);
                          if (e.key === 'Escape') setEditing(null);
                        }}
                        autoFocus
                        className="inline-edit-input"
                      />
                    ) : (
                      <span
                        onClick={() => setEditing({ id: s.id, field: 'last_name', value: s.last_name })}
                        className="editable-cell"
                      >
                        {s.last_name}
                      </span>
                    )}
                  </td>
                  <td>
                    {editing?.id === s.id && editing.field === 'notes' ? (
                      <input
                        type="text"
                        value={editing.value || ''}
                        onChange={e => setEditing({ ...editing, value: e.target.value })}
                        onBlur={() => handleInlineEdit(s, 'notes', editing.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleInlineEdit(s, 'notes', editing.value);
                          if (e.key === 'Escape') setEditing(null);
                        }}
                        placeholder="Add notes..."
                        autoFocus
                        className="inline-edit-input"
                      />
                    ) : (
                      <span
                        onClick={() => setEditing({ id: s.id, field: 'notes', value: s.notes || '' })}
                        className="editable-cell editable-cell-notes"
                        title={s.notes || 'Click to add notes'}
                      >
                        {s.notes || '—'}
                      </span>
                    )}
                  </td>
                  <td>{new Date(s.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="delete-button"
                      title="Remove student"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
