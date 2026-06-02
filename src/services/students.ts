import { API_BASE } from './api';

export type Student = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  notes: string | null;
  section: string;
  class_id: number | null;
  last_updated_via: string | null;
  last_upload_id: number | null;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

export type UploadSummary = {
  added?: number;
  restored?: number;
  skipped?: number;
  removed?: number;
  not_found?: number;
  total_processed: number;
};

export type UploadHistory = {
  id: number;
  filename: string;
  uploaded_at: string;
  uploaded_by: number | null;
  action: 'add' | 'drop' | 'sync';
  summary: {
    added: number;
    updated: number;
    removed: number;
    skipped: number;
    restored: number;
    not_found: number;
    total: number;
  };
  changes: Array<{
    type: string;
    email: string;
    first_name: string;
    last_name: string;
    action: string;
  }>;
};

export type UploadResponse = {
  upload_id: number;
  action: string;
  summary: UploadSummary;
  errors: Array<{ line: number; email?: string; reason: string }>;
  upload_history: UploadHistory;
};

export const studentsService = {
  async list(
    page = 1,
    pageSize = 20,
    search = '',
    includeDeleted = false,
    classId?: number,
    columnFilters?: {
      email?: string;
      first_name?: string;
      last_name?: string;
      notes?: string;
    },
    section?: string | null,
    sortBy = 'email',
    sortOrder: 'asc' | 'desc' = 'asc',
  ): Promise<Paginated<Student>> {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
      sort_by: sortBy,
      sort_order: sortOrder,
    });
    if (search.trim()) params.set('search', search.trim());
    if (includeDeleted) params.set('include_deleted', 'true');
    if (classId) params.set('class_id', String(classId));
    if (columnFilters?.email?.trim()) params.set('email_filter', columnFilters.email.trim());
    if (columnFilters?.first_name?.trim()) params.set('first_name_filter', columnFilters.first_name.trim());
    if (columnFilters?.last_name?.trim()) params.set('last_name_filter', columnFilters.last_name.trim());
    if (columnFilters?.notes?.trim()) params.set('notes_filter', columnFilters.notes.trim());
    if (section != null) params.set('section', section.trim());

    const res = await fetch(`${API_BASE}/students?${params.toString()}`);
    if (!res.ok) throw new Error(`Failed to fetch students (${res.status})`);
    return res.json();
  },

  async get(id: number): Promise<Student> {
    const res = await fetch(`${API_BASE}/students/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch student (${res.status})`);
    return res.json();
  },

  async create(data: {
    email: string;
    first_name: string;
    last_name: string;
    notes?: string;
    section?: string;
    class_id?: number | null;
  }): Promise<Student> {
    const res = await fetch(`${API_BASE}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || `Failed to create student (${res.status})`);
    }
    return res.json();
  },

  async update(
    id: number,
    data: Partial<{
      email: string;
      first_name: string;
      last_name: string;
      notes: string | null;
      section: string;
      class_id: number | null;
    }>,
  ): Promise<Student> {
    const res = await fetch(`${API_BASE}/students/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || `Failed to update student (${res.status})`);
    }
    return res.json();
  },

  async delete(id: number, hard = false): Promise<void> {
    const params = hard ? '?hard=true' : '';
    const res = await fetch(`${API_BASE}/students/${id}${params}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`Failed to delete student (${res.status})`);
  },

  async restore(id: number): Promise<Student> {
    const res = await fetch(`${API_BASE}/students/${id}/restore`, {
      method: 'PATCH',
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`Failed to restore student (${res.status})`);
    return res.json();
  },

  async bulkDelete(studentIds: number[], hard = false): Promise<{ deleted: number }> {
    const res = await fetch(`${API_BASE}/students/bulk`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_ids: studentIds, hard }),
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`Failed to bulk delete (${res.status})`);
    return res.json();
  },

  async listSections(classId?: number | null, includeEmpty = false): Promise<string[]> {
    const params = new URLSearchParams();
    if (classId != null) params.set('class_id', String(classId));
    if (includeEmpty) params.set('include_empty', 'true');
    const qs = params.toString();
    const res = await fetch(`${API_BASE}/students/sections${qs ? `?${qs}` : ''}`);
    if (!res.ok) throw new Error(`Failed to fetch sections (${res.status})`);
    const data = await res.json();
    return data.sections ?? [];
  },

  async addFromCsv(
    file: File,
    classId?: number | null,
    defaultSection = '',
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.set('file', file);
    if (classId) formData.set('class_id', String(classId));
    const trimmedSection = defaultSection.trim();
    if (trimmedSection) formData.set('default_section', trimmedSection);
    const res = await fetch(`${API_BASE}/students/add`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || `Upload failed (${res.status})`);
    }
    return res.json();
  },

  async dropFromCsv(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.set('file', file);
    const res = await fetch(`${API_BASE}/students/drop`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || `Drop failed (${res.status})`);
    }
    return res.json();
  },

  async getUploadHistory(page = 1, perPage = 20): Promise<{
    uploads: UploadHistory[];
    pagination: {
      page: number;
      per_page: number;
      total: number;
      total_pages: number;
    };
  }> {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    });
    const res = await fetch(`${API_BASE}/students/upload-history?${params.toString()}`);
    if (!res.ok) throw new Error(`Failed to fetch upload history (${res.status})`);
    return res.json();
  },

  async getUploadDetails(id: number): Promise<UploadHistory> {
    const res = await fetch(`${API_BASE}/students/upload-history/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch upload details (${res.status})`);
    return res.json();
  },
};
