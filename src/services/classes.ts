import { API_BASE } from './api';
import type { Student } from './students';

export type Class = {
  id: number;
  class_name: string;
  instructor_id: number;
  created_at: string;
};

export const classesService = {
  async list(): Promise<Class[]> {
    const res = await fetch(`${API_BASE}/classes`, { credentials: 'include' });
    if (!res.ok) throw new Error(`Failed to fetch classes (${res.status})`);
    return res.json();
  },

  async create(className: string): Promise<Class> {
    const res = await fetch(`${API_BASE}/classes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ class_name: className }),
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || `Failed to create class (${res.status})`);
    }
    return res.json();
  },

  async rename(id: number, className: string): Promise<Class> {
    const res = await fetch(`${API_BASE}/classes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ class_name: className }),
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || `Failed to rename class (${res.status})`);
    }
    return res.json();
  },

  async delete(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/classes/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`Failed to delete class (${res.status})`);
  },

  async listStudents(id: number): Promise<Student[]> {
    const res = await fetch(`${API_BASE}/classes/${id}/students`, { credentials: 'include' });
    if (!res.ok) throw new Error(`Failed to fetch class students (${res.status})`);
    return res.json();
  },

  async assignStudent(classId: number, studentId: number): Promise<Student> {
    const res = await fetch(`${API_BASE}/classes/${classId}/students/${studentId}`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || `Failed to assign student (${res.status})`);
    }
    return res.json();
  },

  async removeStudent(classId: number, studentId: number): Promise<void> {
    const res = await fetch(`${API_BASE}/classes/${classId}/students/${studentId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`Failed to remove student (${res.status})`);
  },

  async getMyClasses(): Promise<Class[]> {
    const res = await fetch(`${API_BASE}/classes/my`, { credentials: 'include' });
    if (!res.ok) return [];
    return res.json();
  },
};
