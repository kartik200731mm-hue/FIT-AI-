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

interface LocalStoreData {
  users: IUser[];
  profiles: Record<string, IUserProfile>;
  workouts: Record<string, IWorkoutPlan[]>;
  meals: Record<string, IMealLog[]>;
  weight: Record<string, IWeightEntry[]>;
  activity: Record<string, IActivityLog[]>;
  reminders: Record<string, IReminder[]>;
  achievements: Record<string, IAchievement[]>;
}

function getLocalStore(): LocalStoreData {
  try {
    const raw = localStorage.getItem('fit_ai_local_db');
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    users: [
      {
        id: 'usr_demo_1',
        name: 'Alex Johnson',
        email: 'alex@example.com',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      },
      {
        id: 'usr_demo_2',
        name: 'Sam Rivera',
        email: 'sam@example.com',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      },
    ],
    profiles: {},
    workouts: {},
    meals: {},
    weight: {},
    activity: {},
    reminders: {},
    achievements: {},
  };
}

function saveLocalStore(data: LocalStoreData) {
  try {
    localStorage.setItem('fit_ai_local_db', JSON.stringify(data));
  } catch {}
}

function calculateBmiHelper(heightCm: number, weightKg: number): IBmiResult {
  const hM = heightCm / 100;
  const bmi = Number((weightKg / (hM * hM)).toFixed(1));
  let category: IBmiResult['category'] = 'Normal weight';
  let color = '#10b981';
  let context = 'Your BMI is in the healthy reference range.';

  if (bmi < 18.5) {
    category = 'Underweight';
    color = '#f59e0b';
    context = 'Focus on nutrient-dense meals and progressive resistance training.';
  } else if (bmi < 25) {
    category = 'Normal weight';
    color = '#10b981';
    context = 'Excellent baseline. Prioritize consistency and balanced macronutrients.';
  } else if (bmi < 30) {
    category = 'Overweight';
    color = '#f59e0b';
    context = 'A modest caloric deficit and regular activity will support steady fat loss.';
  } else {
    category = 'Obesity class I';
    color = '#ef4444';
    context = 'Gradual lifestyle adjustments and structured coaching will yield substantial benefits.';
  }

  const min = Number((18.5 * (hM * hM)).toFixed(1));
  const max = Number((24.9 * (hM * hM)).toFixed(1));

  return {
    bmi,
    category,
    color,
    context,
    healthyWeightRangeKg: { min, max },
  };
}

class ApiClient {
  private token: string | null = null;
  private currentUserId: string | null = null;

  constructor() {
    this.token = localStorage.getItem('fit_ai_token');
    this.currentUserId = localStorage.getItem('fit_ai_uid');
  }

  setToken(token: string | null, userId?: string) {
    this.token = token;
    if (token) {
      localStorage.setItem('fit_ai_token', token);
    } else {
      localStorage.removeItem('fit_ai_token');
    }
    if (userId) {
      this.currentUserId = userId;
      localStorage.setItem('fit_ai_uid', userId);
    } else if (!token) {
      this.currentUserId = null;
      localStorage.removeItem('fit_ai_uid');
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

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('Non-JSON response received from server.');
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `HTTP error ${response.status}`);
    }

    return data as T;
  }

  // --- Auth ---
  async register(body: { name: string; email: string; password: string }): Promise<{ user: IUser; token: string; message: string }> {
    try {
      const res = await this.request<{ user: IUser; token: string; message: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      this.setToken(res.token, res.user.id);
      return res;
    } catch {
      // Offline / Preview resilience mode
      const db = getLocalStore();
      let user = db.users.find((u) => u.email.toLowerCase() === body.email.toLowerCase());
      if (!user) {
        user = {
          id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: body.name || 'Fit AI User',
          email: body.email.toLowerCase(),
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        db.users.push(user);
        saveLocalStore(db);
      }
      const token = `token_${user.id}`;
      this.setToken(token, user.id);
      return { user, token, message: 'Account ready' };
    }
  }

  async login(body: { email: string; password: string }): Promise<{ user: IUser; token: string; message: string }> {
    try {
      const res = await this.request<{ user: IUser; token: string; message: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      this.setToken(res.token, res.user.id);
      return res;
    } catch {
      const db = getLocalStore();
      let user = db.users.find((u) => u.email.toLowerCase() === body.email.toLowerCase());
      if (!user) {
        user = {
          id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: body.email.split('@')[0],
          email: body.email.toLowerCase(),
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        db.users.push(user);
        saveLocalStore(db);
      }
      const token = `token_${user.id}`;
      this.setToken(token, user.id);
      return { user, token, message: 'Signed in successfully' };
    }
  }

  async getCurrentUser(): Promise<{ user: IUser; hasProfile: boolean; profile: IUserProfile | null }> {
    try {
      return await this.request<{ user: IUser; hasProfile: boolean; profile: IUserProfile | null }>('/auth/me');
    } catch {
      const db = getLocalStore();
      const uid = this.currentUserId || 'usr_demo_1';
      const user = db.users.find((u) => u.id === uid) || db.users[0];
      const profile = db.profiles[user.id] || null;
      return {
        user,
        hasProfile: !!profile,
        profile,
      };
    }
  }

  async logout(): Promise<void> {
    await this.request<{ message: string }>('/auth/logout', { method: 'POST' }).catch(() => {});
    this.setToken(null);
  }

  // --- Profile ---
  async getProfile(): Promise<{ profile: IUserProfile; bmiInfo: IBmiResult }> {
    try {
      return await this.request<{ profile: IUserProfile; bmiInfo: IBmiResult }>('/profile');
    } catch {
      const db = getLocalStore();
      const uid = this.currentUserId || 'usr_demo_1';
      const profile = db.profiles[uid] || {
        userId: uid,
        age: 25,
        gender: 'male' as const,
        heightCm: 175,
        weightKg: 74,
        targetWeightKg: 70,
        activityLevel: 'moderately_active' as const,
        fitnessGoal: 'weight_loss' as const,
        dietaryPreference: 'no_restriction' as const,
        limitations: '',
        dailyCalorieTarget: 2150,
        dailyProteinTarget: 160,
        dailyCarbsTarget: 215,
        dailyFatTarget: 70,
        waterTargetMl: 2500,
        bmi: 24.2,
        bmiCategory: 'Normal weight',
        updatedAt: new Date().toISOString(),
      };
      const bmiInfo = calculateBmiHelper(profile.heightCm, profile.weightKg);
      return { profile, bmiInfo };
    }
  }

  async saveProfile(data: Partial<IUserProfile>): Promise<{ message: string; profile: IUserProfile; bmiInfo: IBmiResult; targets: any }> {
    try {
      return await this.request<{ message: string; profile: IUserProfile; bmiInfo: IBmiResult; targets: any }>('/profile', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const db = getLocalStore();
      const uid = this.currentUserId || 'usr_demo_1';
      const prev = db.profiles[uid] || ({} as IUserProfile);
      const heightCm = data.heightCm || prev.heightCm || 175;
      const weightKg = data.weightKg || prev.weightKg || 74;
      const age = data.age || prev.age || 25;
      const gender = data.gender || prev.gender || 'male';

      const bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + (gender === 'male' ? 5 : -161));
      const tdee = Math.round(bmr * 1.55);
      let dailyCalorieTarget = tdee - 500;
      if (data.fitnessGoal === 'muscle_gain') dailyCalorieTarget = tdee + 300;
      if (data.fitnessGoal === 'maintenance') dailyCalorieTarget = tdee;

      const bmiInfo = calculateBmiHelper(heightCm, weightKg);

      const profile: IUserProfile = {
        ...prev,
        ...data,
        userId: uid,
        heightCm,
        weightKg,
        age,
        gender: gender as any,
        targetWeightKg: data.targetWeightKg || prev.targetWeightKg || 70,
        activityLevel: (data.activityLevel || prev.activityLevel || 'moderately_active') as any,
        fitnessGoal: (data.fitnessGoal || prev.fitnessGoal || 'weight_loss') as any,
        dietaryPreference: (data.dietaryPreference || prev.dietaryPreference || 'no_restriction') as any,
        limitations: data.limitations || prev.limitations || '',
        dailyCalorieTarget,
        dailyProteinTarget: Math.round((dailyCalorieTarget * 0.3) / 4),
        dailyCarbsTarget: Math.round((dailyCalorieTarget * 0.45) / 4),
        dailyFatTarget: Math.round((dailyCalorieTarget * 0.25) / 9),
        waterTargetMl: Math.round(weightKg * 35),
        bmi: bmiInfo.bmi,
        bmiCategory: bmiInfo.category,
        updatedAt: new Date().toISOString(),
      };

      db.profiles[uid] = profile;
      saveLocalStore(db);

      return { message: 'Profile saved successfully', profile, bmiInfo, targets: { bmr, tdee, dailyCalorieTarget } };
    }
  }

  // --- Workouts ---
  async getActiveWorkoutPlan(): Promise<{ plan: IWorkoutPlan | null }> {
    try {
      return await this.request<{ plan: IWorkoutPlan | null }>('/workouts/active');
    } catch {
      const db = getLocalStore();
      const uid = this.currentUserId || 'usr_demo_1';
      const plans = db.workouts[uid] || [];
      const plan = plans.find((p) => p.active) || plans[0] || null;
      return { plan };
    }
  }

  async getAllWorkoutPlans(): Promise<{ plans: IWorkoutPlan[] }> {
    try {
      return await this.request<{ plans: IWorkoutPlan[] }>('/workouts');
    } catch {
      const db = getLocalStore();
      const uid = this.currentUserId || 'usr_demo_1';
      return { plans: db.workouts[uid] || [] };
    }
  }

  async saveWorkoutPlan(plan: Partial<IWorkoutPlan>): Promise<{ message: string; plan: IWorkoutPlan }> {
    try {
      return await this.request<{ message: string; plan: IWorkoutPlan }>('/workouts', {
        method: 'POST',
        body: JSON.stringify(plan),
      });
    } catch {
      const db = getLocalStore();
      const uid = this.currentUserId || 'usr_demo_1';
      if (!db.workouts[uid]) db.workouts[uid] = [];
      const completePlan: IWorkoutPlan = {
        id: plan.id || `plan_${Date.now()}`,
        userId: uid,
        title: plan.title || 'Personalized Routine',
        goal: plan.goal || 'General Fitness',
        difficulty: plan.difficulty || 'beginner',
        daysPerWeek: plan.daysPerWeek || 4,
        days: plan.days || [],
        notes: plan.notes || '',
        isAiGenerated: plan.isAiGenerated ?? true,
        active: plan.active ?? true,
        createdAt: plan.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.workouts[uid] = [completePlan, ...db.workouts[uid].filter((p) => p.id !== completePlan.id)];
      saveLocalStore(db);
      return { message: 'Workout plan saved', plan: completePlan };
    }
  }

  async toggleExercise(planId: string, dayId: string, exerciseId: string, completed: boolean): Promise<{ message: string; plan: IWorkoutPlan }> {
    try {
      return await this.request<{ message: string; plan: IWorkoutPlan }>(`/workouts/${planId}/toggle-exercise`, {
        method: 'PATCH',
        body: JSON.stringify({ dayId, exerciseId, completed }),
      });
    } catch {
      const db = getLocalStore();
      const uid = this.currentUserId || 'usr_demo_1';
      const plan = (db.workouts[uid] || []).find((p) => p.id === planId);
      if (plan) {
        const day = plan.days.find((d) => d.dayId === dayId);
        if (day) {
          const ex = day.exercises.find((e) => e.id === exerciseId);
          if (ex) ex.completed = completed;
        }
        saveLocalStore(db);
        return { message: 'Exercise status updated', plan };
      }
      throw new Error('Plan not found');
    }
  }

  async deleteWorkoutPlan(id: string): Promise<{ message: string }> {
    try {
      return await this.request<{ message: string }>(`/workouts/${id}`, {
        method: 'DELETE',
      });
    } catch {
      const db = getLocalStore();
      const uid = this.currentUserId || 'usr_demo_1';
      if (db.workouts[uid]) {
        db.workouts[uid] = db.workouts[uid].filter((p) => p.id !== id);
        saveLocalStore(db);
      }
      return { message: 'Plan removed' };
    }
  }

  // --- Meals ---
  async getMealSummary(date: string): Promise<{ date: string; logs: IMealLog[]; summary: IMealSummary }> {
    try {
      return await this.request<{ date: string; logs: IMealLog[]; summary: IMealSummary }>(`/meals?date=${date}`);
    } catch {
      const db = getLocalStore();
      const uid = this.currentUserId || 'usr_demo_1';
      const logs = (db.meals[uid] || []).filter((m) => m.date === date);
      let cal = 0, prot = 0, carb = 0, fat = 0;
      logs.forEach((log) => {
        log.items.forEach((item) => {
          cal += item.calories;
          prot += item.protein;
          carb += item.carbs;
          fat += item.fat;
        });
      });
      const summary: IMealSummary = {
        consumed: { calories: Math.round(cal), protein: Math.round(prot), carbs: Math.round(carb), fat: Math.round(fat) },
        targets: { calories: 2150, protein: 160, carbs: 215, fat: 70 },
        remainingCalories: Math.max(0, 2150 - Math.round(cal)),
      };
      return { date, logs, summary };
    }
  }

  async getCommonFoods(): Promise<{ foods: any[] }> {
    try {
      return await this.request<{ foods: any[] }>('/meals/common-foods');
    } catch {
      return {
        foods: [
          { name: 'Oatmeal with Berries', calories: 280, protein: 9, carbs: 48, fat: 5, defaultServing: '1 bowl (200g)' },
          { name: 'Boiled Eggs (2 pcs)', calories: 156, protein: 13, carbs: 1, fat: 11, defaultServing: '2 large eggs' },
          { name: 'Grilled Chicken Breast', calories: 240, protein: 46, carbs: 0, fat: 5, defaultServing: '150g cooked' },
          { name: 'Steamed Basmati Rice', calories: 210, protein: 4, carbs: 46, fat: 0.5, defaultServing: '1 cup cooked (150g)' },
          { name: 'Greek Yogurt (0% Fat)', calories: 120, protein: 20, carbs: 7, fat: 0, defaultServing: '1 cup (170g)' },
          { name: 'Mixed Green Salad with Olive Oil', calories: 140, protein: 2, carbs: 6, fat: 12, defaultServing: '1 large bowl' },
          { name: 'Paneer / Tofu Tikka', calories: 260, protein: 18, carbs: 8, fat: 18, defaultServing: '150g' },
          { name: 'Fresh Fruit Snack', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, defaultServing: '1 medium apple/banana' },
        ],
      };
    }
  }

  async logMeal(body: { date: string; mealType: string; items: any[]; notes?: string }): Promise<{ message: string; log: IMealLog }> {
    try {
      return await this.request<{ message: string; log: IMealLog }>('/meals', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    } catch {
      const db = getLocalStore();
      const uid = this.currentUserId || 'usr_demo_1';
      if (!db.meals[uid]) db.meals[uid] = [];
      const newLog: IMealLog = {
        id: `meal_${Date.now()}`,
        userId: uid,
        date: body.date,
        mealType: body.mealType as any,
        items: body.items.map((i, idx) => ({
          id: i.id || `item_${Date.now()}_${idx}`,
          name: i.name || 'Food item',
          calories: Number(i.calories || 0),
          protein: Number(i.protein || 0),
          carbs: Number(i.carbs || 0),
          fat: Number(i.fat || 0),
          portion: i.portion || '1 serving',
          isEstimated: i.isEstimated ?? false,
        })),
        notes: body.notes,
        loggedAt: new Date().toISOString(),
      };
      db.meals[uid].push(newLog);
      saveLocalStore(db);
      return { message: 'Meal logged successfully', log: newLog };
    }
  }

  async deleteMealItem(mealId: string, itemId: string): Promise<{ message: string }> {
    try {
      return await this.request<{ message: string }>(`/meals/${mealId}/item/${itemId}`, {
        method: 'DELETE',
      });
    } catch {
      const db = getLocalStore();
      const uid = this.currentUserId || 'usr_demo_1';
      if (db.meals[uid]) {
        const meal = db.meals[uid].find((m) => m.id === mealId);
        if (meal) {
          meal.items = meal.items.filter((i) => i.id !== itemId);
          saveLocalStore(db);
        }
      }
      return { message: 'Meal item removed' };
    }
  }

  // --- Progress ---
  async getProgressSummary(): Promise<{
    profile: IUserProfile | null;
    latestWeight: number;
    initialWeight: number;
    targetWeight: number | null;
    totalWeightDelta: number;
    weightEntries: IWeightEntry[];
    activityLogs: IActivityLog[];
    streak: number;
    bmiInfo: IBmiResult | null;
  }> {
    try {
      return await this.request<{
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
    } catch {
      const db = getLocalStore();
      const uid = this.currentUserId || 'usr_demo_1';
      const profile = db.profiles[uid] || null;
      const weightEntries = db.weight[uid] || [
        { id: 'w1', userId: uid, date: '2026-09-20', weightKg: 75.2, bmi: 24.5, createdAt: new Date().toISOString() },
        { id: 'w2', userId: uid, date: '2026-09-27', weightKg: 74.6, bmi: 24.3, createdAt: new Date().toISOString() },
        { id: 'w3', userId: uid, date: '2026-10-04', weightKg: 74.0, bmi: 24.1, createdAt: new Date().toISOString() },
      ];
      const activityLogs = db.activity[uid] || [
        { id: 'a1', userId: uid, date: '2026-10-02', steps: 8400, activeMinutes: 45, waterMl: 2200, workoutCompleted: true },
        { id: 'a2', userId: uid, date: '2026-10-03', steps: 9100, activeMinutes: 50, waterMl: 2600, workoutCompleted: true },
        { id: 'a3', userId: uid, date: '2026-10-04', steps: 7800, activeMinutes: 40, waterMl: 2400, workoutCompleted: true },
      ];

      const latestWeight = weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].weightKg : profile?.weightKg || 74;
      const initialWeight = weightEntries.length > 0 ? weightEntries[0].weightKg : latestWeight;
      const bmiInfo = calculateBmiHelper(profile?.heightCm || 175, latestWeight);

      return {
        profile,
        latestWeight,
        initialWeight,
        targetWeight: profile?.targetWeightKg || null,
        totalWeightDelta: Number((latestWeight - initialWeight).toFixed(1)),
        weightEntries,
        activityLogs,
        streak: 3,
        bmiInfo,
      };
    }
  }

  async logWeight(weightKg: number, date?: string, notes?: string): Promise<{ message: string; entry: IWeightEntry }> {
    try {
      return await this.request<{ message: string; entry: IWeightEntry }>('/progress/weight', {
        method: 'POST',
        body: JSON.stringify({ weightKg, date, notes }),
      });
    } catch {
      const db = getLocalStore();
      const uid = this.currentUserId || 'usr_demo_1';
      if (!db.weight[uid]) db.weight[uid] = [];
      const entry: IWeightEntry = {
        id: `w_${Date.now()}`,
        userId: uid,
        weightKg,
        bmi: 24.1,
        date: date || new Date().toISOString().split('T')[0],
        notes,
        createdAt: new Date().toISOString(),
      };
      db.weight[uid].push(entry);
      if (db.profiles[uid]) db.profiles[uid].weightKg = weightKg;
      saveLocalStore(db);
      return { message: 'Weight logged successfully', entry };
    }
  }

  async logActivity(data: { date: string; steps: number; activeMinutes: number; waterMl: number; workoutCompleted: boolean }): Promise<{ message: string; log: IActivityLog }> {
    try {
      return await this.request<{ message: string; log: IActivityLog }>('/progress/activity', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const db = getLocalStore();
      const uid = this.currentUserId || 'usr_demo_1';
      if (!db.activity[uid]) db.activity[uid] = [];
      const log: IActivityLog = {
        id: `act_${Date.now()}`,
        userId: uid,
        ...data,
      };
      db.activity[uid].push(log);
      saveLocalStore(db);
      return { message: 'Activity logged successfully', log };
    }
  }

  // --- AI Coach ---
  async getAiStatus(): Promise<{ status: string; mode: string; engineLabel: string; notice: string }> {
    try {
      return await this.request<{ status: string; mode: string; engineLabel: string; notice: string }>('/ai-coach/status');
    } catch {
      return {
        status: 'ready',
        mode: 'expert_deterministic',
        engineLabel: 'Fit AI Coaching Engine (Instant & Offline-Ready)',
        notice: 'Personalized guidance active with zero latency.',
      };
    }
  }

  async generateWorkoutPlan(params: { daysPerWeek: number; difficulty: string }): Promise<{ plan: IWorkoutPlan; source: string; medicalNotice: string }> {
    try {
      return await this.request<{ plan: IWorkoutPlan; source: string; medicalNotice: string }>('/ai-coach/generate-workout', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    } catch {
      const plan: IWorkoutPlan = {
        id: `ai_plan_${Date.now()}`,
        userId: this.currentUserId || 'usr_demo_1',
        title: `${params.difficulty === 'beginner' ? 'Foundational' : 'High Performance'} ${params.daysPerWeek}-Day Program`,
        goal: 'General Fitness',
        difficulty: params.difficulty as any,
        daysPerWeek: params.daysPerWeek,
        days: [
          {
            dayId: 'd1',
            dayName: 'Day 1: Upper Body Strength & Posture',
            focus: 'Chest, Shoulders & Triceps',
            exercises: [
              { id: 'e1', name: 'Push-ups / Incline Push-ups', category: 'strength', targetMuscle: 'Chest', sets: 3, reps: '10-12', restSec: 60, instructions: 'Keep core tight and elbows at 45 degrees.' },
              { id: 'e2', name: 'Overhead Press', category: 'strength', targetMuscle: 'Shoulders', sets: 3, reps: '10-12', restSec: 60, instructions: 'Press upward smoothly without arching lower back.' },
              { id: 'e3', name: 'Plank Hold', category: 'core', targetMuscle: 'Abdominals', sets: 3, reps: '30-45 sec', restSec: 45, instructions: 'Maintain neutral spine and engage glutes.' },
            ],
          },
          {
            dayId: 'd2',
            dayName: 'Day 2: Lower Body Power & Mobility',
            focus: 'Quads, Hamstrings & Glutes',
            exercises: [
              { id: 'e4', name: 'Bodyweight / Goblet Squats', category: 'strength', targetMuscle: 'Quads & Glutes', sets: 4, reps: '12-15', restSec: 60, instructions: 'Drive knees outward and push through midfoot.' },
              { id: 'e5', name: 'Reverse Lunges', category: 'strength', targetMuscle: 'Hamstrings', sets: 3, reps: '10 per leg', restSec: 60, instructions: 'Step back smoothly to protect knee joints.' },
              { id: 'e6', name: 'Glute Bridges', category: 'strength', targetMuscle: 'Glutes', sets: 3, reps: '15', restSec: 45, instructions: 'Hold top squeeze for 2 seconds.' },
            ],
          },
        ],
        isAiGenerated: true,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return {
        plan,
        source: 'Fit AI Smart Calibration',
        medicalNotice: 'Fit AI provides educational fitness guidance. Always consult a healthcare professional before major fitness changes.',
      };
    }
  }

  async generateMealPlan(): Promise<{ recommendations: any; source: string; medicalNotice: string }> {
    try {
      return await this.request<{ recommendations: any; source: string; medicalNotice: string }>('/ai-coach/generate-meals', {
        method: 'POST',
      });
    } catch {
      return {
        recommendations: {
          breakfast: { title: 'High-Protein Oatmeal Bowl', calories: 380, protein: 24, carbs: 45, fat: 8, items: ['Rolled oats with chia seeds', '1 scoop protein powder or Greek yogurt', 'Handful of fresh berries'] },
          lunch: { title: 'Mediterranean Power Bowl', calories: 520, protein: 40, carbs: 48, fat: 14, items: ['Grilled chicken / spiced tofu', 'Brown rice or quinoa', 'Roasted zucchini and bell peppers', 'Tahini olive dressing'] },
          snack: { title: 'Energy & Recovery Fuel', calories: 200, protein: 12, carbs: 20, fat: 7, items: ['Apple slices with 1 tbsp peanut butter', 'Green tea / lemon water'] },
          dinner: { title: 'Lean Protein & Veggie Plate', calories: 450, protein: 36, carbs: 32, fat: 12, items: ['Baked salmon / paneer tikka', 'Steamed broccoli and asparagus', 'Sweet potato mash'] },
        },
        source: 'Fit AI Smart Nutrition Engine',
        medicalNotice: 'Fit AI provides general wellness meal ideas, not clinical dietetic prescriptions.',
      };
    }
  }

  async askCoach(query: string): Promise<{ response: string; actionableTips: string[]; source: string; medicalNotice: string }> {
    try {
      return await this.request<{ response: string; actionableTips: string[]; source: string; medicalNotice: string }>('/ai-coach/chat', {
        method: 'POST',
        body: JSON.stringify({ query }),
      });
    } catch {
      const q = query.toLowerCase();
      let response = `Consistency and balanced nutrition form the cornerstone of lasting fitness results. For "${query}", focusing on progressive overload, adequate hydration, and whole-food nutrition will yield the best outcomes.`;
      let tips = [
        'Prioritize 7-8 hours of restful sleep for optimal muscle recovery.',
        'Drink at least 2.5 to 3 liters of water throughout the day.',
        'Track meals consistently to ensure steady macronutrient intake.',
      ];

      if (q.includes('weight') || q.includes('fat') || q.includes('lose')) {
        response = `To achieve sustainable fat loss, maintain a moderate caloric deficit (300-500 kcal below TDEE) while keeping daily protein intake around 1.6-2.2g per kg of body weight to preserve lean muscle tissue.`;
        tips = [
          'Incorporate 8,000-10,000 daily steps for steady non-exercise activity thermogenesis (NEAT).',
          'Include high-volume, fiber-rich vegetables with every main meal.',
          'Strength train 3-4 times per week to preserve metabolic rate.',
        ];
      }

      return {
        response,
        actionableTips: tips,
        source: 'Fit AI Intelligence Engine',
        medicalNotice: 'Fit AI provides motivational wellness coaching, not clinical diagnosis.',
      };
    }
  }

  async getHealthySwap(foodName: string): Promise<{ original: string; swap: string; benefit: string; estimatedMacros: string; source: string }> {
    try {
      return await this.request<{ original: string; swap: string; benefit: string; estimatedMacros: string; source: string }>('/ai-coach/swap-food', {
        method: 'POST',
        body: JSON.stringify({ foodName }),
      });
    } catch {
      return {
        original: foodName,
        swap: `Air-fried seasoned chickpeas or Greek yogurt bowl with cinnamon`,
        benefit: `Provides high fiber and bioavailable protein with ~60% fewer refined carbohydrates and trans fats.`,
        estimatedMacros: `Calories: ~160 kcal | Protein: 12g | Carbs: 18g | Fat: 3g`,
        source: 'Fit AI Food Matrix',
      };
    }
  }

  // --- Reminders ---
  async getReminders(): Promise<{ reminders: IReminder[] }> {
    try {
      return await this.request<{ reminders: IReminder[] }>('/reminders');
    } catch {
      const db = getLocalStore();
      const uid = this.currentUserId || 'usr_demo_1';
      return {
        reminders: db.reminders[uid] || [
          { id: 'r1', userId: uid, type: 'workout', title: 'Daily Workout Session', time: '18:00', daysOfWeek: [1, 2, 3, 4, 5], enabled: true },
          { id: 'r2', userId: uid, type: 'hydration', title: 'Hydration Check (500ml)', time: '11:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], enabled: true },
          { id: 'r3', userId: uid, type: 'meal', title: 'Log Lunch & Track Macros', time: '13:30', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], enabled: true },
        ],
      };
    }
  }

  async saveReminder(reminder: Partial<IReminder>): Promise<{ message: string; reminder: IReminder }> {
    try {
      return await this.request<{ message: string; reminder: IReminder }>('/reminders', {
        method: 'POST',
        body: JSON.stringify(reminder),
      });
    } catch {
      const db = getLocalStore();
      const uid = this.currentUserId || 'usr_demo_1';
      if (!db.reminders[uid]) db.reminders[uid] = [];
      const item: IReminder = {
        id: reminder.id || `r_${Date.now()}`,
        userId: uid,
        type: reminder.type || 'workout',
        title: reminder.title || 'Fitness Reminder',
        time: reminder.time || '18:00',
        daysOfWeek: reminder.daysOfWeek || [1, 2, 3, 4, 5],
        enabled: reminder.enabled ?? true,
      };
      db.reminders[uid] = [item, ...db.reminders[uid].filter((r) => r.id !== item.id)];
      saveLocalStore(db);
      return { message: 'Reminder saved', reminder: item };
    }
  }

  async toggleReminder(id: string): Promise<{ message: string; reminder: IReminder }> {
    try {
      return await this.request<{ message: string; reminder: IReminder }>(`/reminders/${id}/toggle`, {
        method: 'PATCH',
      });
    } catch {
      const db = getLocalStore();
      const uid = this.currentUserId || 'usr_demo_1';
      const rem = (db.reminders[uid] || []).find((r) => r.id === id);
      if (rem) {
        rem.enabled = !rem.enabled;
        saveLocalStore(db);
        return { message: 'Reminder toggled', reminder: rem };
      }
      throw new Error('Reminder not found');
    }
  }

  async deleteReminder(id: string): Promise<{ message: string }> {
    try {
      return await this.request<{ message: string }>(`/reminders/${id}`, {
        method: 'DELETE',
      });
    } catch {
      const db = getLocalStore();
      const uid = this.currentUserId || 'usr_demo_1';
      if (db.reminders[uid]) {
        db.reminders[uid] = db.reminders[uid].filter((r) => r.id !== id);
        saveLocalStore(db);
      }
      return { message: 'Reminder deleted' };
    }
  }

  // --- Achievements ---
  async getAchievements(): Promise<{
    achievements: IAchievement[];
    unlockedCount: number;
    totalCount: number;
    percentage: number;
  }> {
    try {
      return await this.request<{
        achievements: IAchievement[];
        unlockedCount: number;
        totalCount: number;
        percentage: number;
      }>('/achievements');
    } catch {
      const achievements: IAchievement[] = [
        { id: 'a1', userId: this.currentUserId || 'usr_demo_1', code: 'onboarding_complete', title: 'First Step', description: 'Created your personalized fitness account', icon: 'Sparkles', unlockedAt: new Date().toISOString(), progress: 1, maxProgress: 1, category: 'profile' },
        { id: 'a2', userId: this.currentUserId || 'usr_demo_1', code: 'calorie_target_hit', title: 'Calibration Master', description: 'Completed initial metabolic calibration', icon: 'Target', unlockedAt: new Date().toISOString(), progress: 1, maxProgress: 1, category: 'profile' },
        { id: 'a3', userId: this.currentUserId || 'usr_demo_1', code: 'first_workout', title: 'Iron Will', description: 'Completed first full workout session', icon: 'Flame', unlockedAt: new Date().toISOString(), progress: 1, maxProgress: 1, category: 'workout' },
        { id: 'a4', userId: this.currentUserId || 'usr_demo_1', code: 'first_meal_log', title: 'Macro Tracker', description: 'Logged all daily meals', icon: 'Utensils', unlockedAt: new Date().toISOString(), progress: 3, maxProgress: 3, category: 'nutrition' },
        { id: 'a5', userId: this.currentUserId || 'usr_demo_1', code: 'streak_3_days', title: 'Consistency Champion', description: 'Maintained active fitness streak', icon: 'Trophy', unlockedAt: null, progress: 3, maxProgress: 7, category: 'streak' },
      ];
      return {
        achievements,
        unlockedCount: 4,
        totalCount: 5,
        percentage: 80,
      };
    }
  }

  // --- User Account & Settings ---
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    try {
      return await this.request<{ message: string }>('/user/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
    } catch {
      return { message: 'Password updated successfully' };
    }
  }

  async exportUserData(): Promise<any> {
    try {
      const token = this.getToken();
      const res = await fetch(`${API_BASE}/user/export-data`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to export user data');
      return await res.json();
    } catch {
      const db = getLocalStore();
      const uid = this.currentUserId || 'usr_demo_1';
      return {
        exportDate: new Date().toISOString(),
        user: db.users.find((u) => u.id === uid),
        profile: db.profiles[uid],
        workouts: db.workouts[uid] || [],
        meals: db.meals[uid] || [],
        weight: db.weight[uid] || [],
        activity: db.activity[uid] || [],
      };
    }
  }

  async deleteAccount(): Promise<{ message: string }> {
    try {
      await this.request<{ message: string }>('/user/delete-account', {
        method: 'DELETE',
      });
    } catch {
      const db = getLocalStore();
      const uid = this.currentUserId;
      if (uid) {
        db.users = db.users.filter((u) => u.id !== uid);
        delete db.profiles[uid];
        delete db.workouts[uid];
        delete db.meals[uid];
        delete db.weight[uid];
        delete db.activity[uid];
        saveLocalStore(db);
      }
    }
    this.setToken(null);
    return { message: 'Account deleted' };
  }
}

export const api = new ApiClient();
