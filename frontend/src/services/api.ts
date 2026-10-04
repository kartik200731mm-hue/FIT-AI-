import {
  IUser,
  IUserProfile,
  IBmiResult,
  IWorkoutPlan,
  IMealLog,
  IMealSummary,
  IWeightEntry,
  IActivityLog,
  IReminder,
  IAchievement,
} from '../types';

const API_BASE = '/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('fit_ai_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('fit_ai_token', token);
    } else {
      localStorage.removeItem('fit_ai_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `HTTP error ${response.status}`);
    }

    return data as T;
  }

  // --- Auth ---
  async register(body: { name: string; email: string; password: string }) {
    const res = await this.request<{ user: IUser; token: string; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    this.setToken(res.token);
    return res;
  }

  async login(body: { email: string; password: string }) {
    const res = await this.request<{ user: IUser; token: string; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    this.setToken(res.token);
    return res;
  }

  async getCurrentUser() {
    return this.request<{ user: IUser; hasProfile: boolean; profile: IUserProfile | null }>('/auth/me');
  }

  async logout() {
    await this.request<{ message: string }>('/auth/logout', { method: 'POST' }).catch(() => {});
    this.setToken(null);
  }

  // --- Profile ---
  async getProfile() {
    return this.request<{ profile: IUserProfile; bmiInfo: IBmiResult }>('/profile');
  }

  async saveProfile(data: Partial<IUserProfile>) {
    return this.request<{ message: string; profile: IUserProfile; bmiInfo: IBmiResult; targets: any }>('/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Workouts ---
  async getActiveWorkoutPlan() {
    return this.request<{ plan: IWorkoutPlan | null }>('/workouts/active');
  }

  async getAllWorkoutPlans() {
    return this.request<{ plans: IWorkoutPlan[] }>('/workouts');
  }

  async saveWorkoutPlan(plan: Partial<IWorkoutPlan>) {
    return this.request<{ message: string; plan: IWorkoutPlan }>('/workouts', {
      method: 'POST',
      body: JSON.stringify(plan),
    });
  }

  async toggleExercise(planId: string, dayId: string, exerciseId: string, completed: boolean) {
    return this.request<{ message: string; plan: IWorkoutPlan }>(`/workouts/${planId}/toggle-exercise`, {
      method: 'PATCH',
      body: JSON.stringify({ dayId, exerciseId, completed }),
    });
  }

  async deleteWorkoutPlan(id: string) {
    return this.request<{ message: string }>(`/workouts/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Meals ---
  async getMealSummary(date: string) {
    return this.request<{ date: string; logs: IMealLog[]; summary: IMealSummary }>(`/meals?date=${date}`);
  }

  async getCommonFoods() {
    return this.request<{ foods: any[] }>('/meals/common-foods');
  }

  async logMeal(body: { date: string; mealType: string; items: any[]; notes?: string }) {
    return this.request<{ message: string; log: IMealLog }>('/meals', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async deleteMealItem(mealId: string, itemId: string) {
    return this.request<{ message: string }>(`/meals/${mealId}/item/${itemId}`, {
      method: 'DELETE',
    });
  }

  // --- Progress ---
  async getProgressSummary() {
    return this.request<{
      profile: IUserProfile | null;
      latestWeight: number;
      initialWeight: number;
      targetWeight: number | null;
      totalWeightDelta: number;
      weightEntries: IWeightEntry[];
      activityLogs: IActivityLog[];
      streak: number;
      bmiInfo: IBmiResult | null;
    }>('/progress/summary');
  }

  async logWeight(weightKg: number, date?: string, notes?: string) {
    return this.request<{ message: string; entry: IWeightEntry }>('/progress/weight', {
      method: 'POST',
      body: JSON.stringify({ weightKg, date, notes }),
    });
  }

  async logActivity(data: { date: string; steps: number; activeMinutes: number; waterMl: number; workoutCompleted: boolean }) {
    return this.request<{ message: string; log: IActivityLog }>('/progress/activity', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- AI Coach ---
  async getAiStatus() {
    return this.request<{ status: string; mode: string; engineLabel: string; notice: string }>('/ai-coach/status');
  }

  async generateWorkoutPlan(params: { daysPerWeek: number; difficulty: string }) {
    return this.request<{ plan: IWorkoutPlan; source: string; medicalNotice: string }>('/ai-coach/generate-workout', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async generateMealPlan() {
    return this.request<{ recommendations: any; source: string; medicalNotice: string }>('/ai-coach/generate-meals', {
      method: 'POST',
    });
  }

  async askCoach(query: string) {
    return this.request<{ response: string; actionableTips: string[]; source: string; medicalNotice: string }>('/ai-coach/chat', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  }

  // --- Reminders ---
  async getReminders() {
    return this.request<{ reminders: IReminder[] }>('/reminders');
  }

  async saveReminder(reminder: Partial<IReminder>) {
    return this.request<{ message: string; reminder: IReminder }>('/reminders', {
      method: 'POST',
      body: JSON.stringify(reminder),
    });
  }

  async toggleReminder(id: string) {
    return this.request<{ message: string; reminder: IReminder }>(`/reminders/${id}/toggle`, {
      method: 'PATCH',
    });
  }

  async deleteReminder(id: string) {
    return this.request<{ message: string }>(`/reminders/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Achievements ---
  async getAchievements() {
    return this.request<{
      achievements: IAchievement[];
      unlockedCount: number;
      totalCount: number;
      percentage: number;
    }>('/achievements');
  }

  // --- User Account & Settings ---
  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ message: string }>('/user/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async exportUserData() {
    const token = this.getToken();
    const res = await fetch(`${API_BASE}/user/export-data`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to export user data');
    return res.json();
  }

  async deleteAccount() {
    const res = await this.request<{ message: string }>('/user/delete-account', {
      method: 'DELETE',
    });
    this.setToken(null);
    return res;
  }
}

export const api = new ApiClient();
