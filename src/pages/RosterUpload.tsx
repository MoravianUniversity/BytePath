import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../services/api";

type Student = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
};

type Paginated<T> = {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

async function fetchStudents(page = 1, pageSize = 20, search = ""): Promise<Paginated<Student>> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (search.trim()) params.set("search", search.trim());
  const res = await fetch(`${API_BASE}/students?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch students (${res.status})`);
  return res.json();
}

async function uploadStudentsCsv(file: File) {
  const fd = new FormData();
  fd.set("file", file);
  const res = await fetch(`${API_BASE}/students/upload`, { method: "POST", body: fd });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  return res.json() as Promise<{ summary: any; errors: Array<{ line: number; reason: string }> }>;
}

async function createStudentManually(data: { email: string; first_name: string; last_name: string; notes?: string; class_id?: number | null }) {
  const res = await fetch(`${API_BASE}/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to add student (${res.status})`);
  }
  return res.json() as Promise<Student>;
}

export default function StudentsPage({ classId, className }: { classId: number | null; className: string | null }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<{ line: number; reason: string }[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const [showManualForm, setShowManualForm] = useState(false);
  const [manualForm, setManualForm] = useState({ first_name: "", last_name: "", email: "", notes: "" });
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSuccess, setManualSuccess] = useState<string | null>(null);
  const [manualSaving, setManualSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchStudents(page, pageSize, search);
      setStudents(data.items);
      setTotalPages(data.total_pages);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, pageSize]);

  const doSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    await load();
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setSummary(null);
    setErrors([]);
    try {
      const res = await uploadStudentsCsv(file);
      setSummary(res.summary);
      setErrors(res.errors);
      await load();
    } catch (e) {
      alert(String(e));
    } finally {
      setUploading(false);
    }
  };

  const pageSizes = useMemo(() => [10, 20, 50, 100], []);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);
    setManualSuccess(null);
    setManualSaving(true);
    try {
      const student = await createStudentManually({
        email: manualForm.email,
        first_name: manualForm.first_name,
        last_name: manualForm.last_name,
        notes: manualForm.notes || undefined,
        class_id: classId,
      });
      setManualSuccess(`${student.first_name} ${student.last_name} added successfully.`);
      setManualForm({ first_name: "", last_name: "", email: "", notes: "" });
      await load();
    } catch (err) {
      setManualError(String(err instanceof Error ? err.message : err));
    } finally {
      setManualSaving(false);
    }
  };

  const panelStyle = {
    background: "var(--overlay-on-gradient-08)",
    padding: "0.75rem 1rem",
    borderRadius: 10,
    border: "1px solid var(--overlay-on-gradient-15)",
  };
  const inputStyle = {
    padding: "0.5rem 0.75rem",
    borderRadius: 8,
    border: "1px solid var(--border-on-gradient)",
    background: "var(--overlay-dark-25)",
    color: "var(--text-on-gradient)",
  };

  return (
    <div style={{ padding: "1rem 1.5rem", maxWidth: 1000, margin: "0 auto", color: "var(--text-on-gradient)" }}>
      <h2 style={{ margin: 0, marginBottom: ".5rem" }}>{className || 'Students'}</h2>
      <p style={{ opacity: .9, marginTop: 0 }}>
        Upload a CSV and browse the roster with pagination. 
        <span style={{ fontSize: "0.9em", display: "block", marginTop: "0.25rem", opacity: 0.8 }}>
          Sample CSV files are located in: <code style={{ background: "var(--overlay-dark-30)", padding: "0.1rem 0.3rem", borderRadius: 4 }}>sample-data/students/</code>
        </span>
      </p>

      <div style={{
        display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap",
        ...panelStyle,
      }}>
        <form onSubmit={doSearch} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name or email…"
            style={inputStyle}
          />
          <button type="submit" className="toggle-button">Search</button>
        </form>

        <div style={{ flex: 1 }} />

        <label style={{ display: "inline-block" }}>
          <span style={{ marginRight: 8, opacity: .9 }}>Upload CSV</span>
          <input 
            type="file" 
            accept=".csv,text/csv,text/plain" 
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                // Validate file extension
                const fileName = file.name.toLowerCase();
                if (!fileName.endsWith('.csv')) {
                  alert('Please select a CSV file (.csv extension)');
                  e.target.value = ''; // Reset input
                  return;
                }
                handleFile(file);
              }
            }} 
            disabled={uploading}
            style={{ cursor: uploading ? "not-allowed" : "pointer" }}
          />
        </label>

        <a href={`${API_BASE}/students/template`} style={{ color: "var(--text-on-gradient)", textDecoration: "underline" }}>
          Download template
        </a>
      </div>

      <div style={{ marginTop: 12 }}>
        <button
          className="toggle-button"
          onClick={() => { setShowManualForm(v => !v); setManualError(null); setManualSuccess(null); }}
        >
          {showManualForm ? "Hide manual entry" : "+ Add student manually"}
        </button>

        {showManualForm && (
          <form onSubmit={handleManualSubmit} style={{
            marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem 1rem",
            ...panelStyle,
            padding: "1rem",
          }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: "0.85em", opacity: 0.8 }}>First name *</span>
              <input
                value={manualForm.first_name}
                onChange={e => setManualForm(f => ({ ...f, first_name: e.target.value }))}
                placeholder="Jane"
                required
                style={{ ...inputStyle, padding: "0.45rem 0.75rem" }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: "0.85em", opacity: 0.8 }}>Last name *</span>
              <input
                value={manualForm.last_name}
                onChange={e => setManualForm(f => ({ ...f, last_name: e.target.value }))}
                placeholder="Doe"
                required
                style={{ ...inputStyle, padding: "0.45rem 0.75rem" }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: "0.85em", opacity: 0.8 }}>Email *</span>
              <input
                type="email"
                value={manualForm.email}
                onChange={e => setManualForm(f => ({ ...f, email: e.target.value }))}
                placeholder="jane.doe@school.edu"
                required
                style={{ ...inputStyle, padding: "0.45rem 0.75rem" }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: "0.85em", opacity: 0.8 }}>Notes</span>
              <input
                value={manualForm.notes}
                onChange={e => setManualForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Optional"
                style={{ ...inputStyle, padding: "0.45rem 0.75rem" }}
              />
            </label>
            <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
              <button type="submit" className="toggle-button" disabled={manualSaving}>
                {manualSaving ? "Saving…" : "Add student"}
              </button>
              {manualError && <span style={{ color: "var(--color-error-bright)", fontSize: "0.9em" }}>{manualError}</span>}
              {manualSuccess && <span style={{ color: "var(--color-success-bright)", fontSize: "0.9em" }}>{manualSuccess}</span>}
            </div>
          </form>
        )}
      </div>

      {summary && (
        <div style={{ marginTop: 12, fontSize: 14, ...panelStyle }}>
          <strong>Upload summary:</strong>{" "}
          inserted {summary.inserted}, updated {summary.updated}, skipped {summary.skipped} (processed {summary.total_processed})
        </div>
      )}
      {errors.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 14, background: "var(--overlay-error-15)", padding: "0.75rem 1rem", borderRadius: 10, border: "1px solid var(--overlay-on-gradient-15)" }}>
          <strong>Errors:</strong>
          <ul style={{ margin: "6px 0 0 1rem" }}>
            {errors.map((er, i) => <li key={i}>Line {er.line}: {er.reason}</li>)}
          </ul>
        </div>
      )}

      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ opacity: .9 }}>Rows per page</span>
        <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} style={{ padding: "0.3rem 0.6rem", borderRadius: 8 }}>
          {pageSizes.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={loading || page <= 1}>Prev</button>
        <span>Page {totalPages ? page : 1} / {totalPages || 1}</span>
        <button onClick={() => setPage(p => (totalPages ? Math.min(totalPages, p + 1) : p + 1))} disabled={loading || (totalPages > 0 && page >= totalPages)}>Next</button>
        <span style={{ opacity: .8 }}>Total: {total}</span>
      </div>

      <div style={{ marginTop: 12, overflowX: "auto", borderRadius: 10, border: "1px solid var(--overlay-on-gradient-15)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "var(--overlay-on-gradient-10)" }}>
            <tr>
              <th style={{ textAlign: "left", padding: "0.6rem" }}>Email</th>
              <th style={{ textAlign: "left", padding: "0.6rem" }}>First name</th>
              <th style={{ textAlign: "left", padding: "0.6rem" }}>Last name</th>
              <th style={{ textAlign: "left", padding: "0.6rem" }}>Added</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: "0.8rem" }}>Loading…</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: "0.8rem" }}>No students</td></tr>
            ) : (
              students.map(s => (
                <tr key={s.id} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "0.6rem" }}>{s.email}</td>
                  <td style={{ padding: "0.6rem" }}>{s.first_name}</td>
                  <td style={{ padding: "0.6rem" }}>{s.last_name}</td>
                  <td style={{ padding: "0.6rem" }}>{new Date(s.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
