import api from './api';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'student' | 'instructor';
}

export const authService = {
  async login(email: string): Promise<User> {
    const response = await api.post('auth/login', { email });
    return response.data.user;
  },

  async getProfile(): Promise<User> {
    const response = await api.get('auth/profile');
    return response.data;
  },

  saveUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
  },

  clearStoredUser(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  },

  async logout(): Promise<void> {
    try {
      await api.post('auth/logout');
    } catch (error) {
      console.error('Failed to clear server session:', error);
    }
    this.clearStoredUser();
  },
};
