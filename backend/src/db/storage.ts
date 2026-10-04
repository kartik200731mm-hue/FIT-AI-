import fs from 'fs';
import path from 'path';
import {
  IUser,
  IUserProfile,
  IWorkoutPlan,
  IMealLog,
  IWeightEntry,
  IActivityLog,
  IReminder,
  IAchievement,
} from '../types';

interface IDatabaseSchema {
  users: IUser[];
  profiles: IUserProfile[];
  workoutPlans: IWorkoutPlan[];
  mealLogs: IMealLog[];
  weightEntries: IWeightEntry[];
  activityLogs: IActivityLog[];
  reminders: IReminder[];
  achievements: IAchievement[];
}

import os from 'os';

function resolveStorageLocation(): { dir: string; file: string } {
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production';
  
  if (process.env.DATA_DIR) {
    return {
      dir: process.env.DATA_DIR,
      file: path.join(process.env.DATA_DIR, 'fit_ai_database.json'),
    };
  }

  if (!isServerless) {
    try {
      const localDir = path.resolve(__dirname, '../../data');
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
      return { dir: localDir, file: path.join(localDir, 'fit_ai_database.json') };
    } catch {
      // Fallback to temp
    }
  }

  const tmpDir = path.join(os.tmpdir(), 'fit-ai-data');
  try {
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
  } catch {
    return { dir: os.tmpdir(), file: path.join(os.tmpdir(), 'fit_ai_database.json') };
  }
  return { dir: tmpDir, file: path.join(tmpDir, 'fit_ai_database.json') };
}

const storageLoc = resolveStorageLocation();
const DATA_DIR = storageLoc.dir;
const DB_FILE = storageLoc.file;

const INITIAL_DATA: IDatabaseSchema = {
  users: [],
  profiles: [],
  workoutPlans: [],
  mealLogs: [],
  weightEntries: [],
  activityLogs: [],
  reminders: [],
  achievements: [],
};

class DataStore {
  private data: IDatabaseSchema = INITIAL_DATA;
  private isLoaded = false;
  private writeLock = false;

  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    if (this.isLoaded) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        try {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        } catch {}
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = { ...INITIAL_DATA, ...JSON.parse(raw) };
      } else {
        this.data = INITIAL_DATA;
        this.persist();
      }
      this.isLoaded = true;
    } catch (err) {
      console.error('Failed to initialize local data store, continuing in-memory:', err);
      this.data = INITIAL_DATA;
      this.isLoaded = true;
    }
  }

  private persist() {
    if (this.writeLock) return;
    this.writeLock = true;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        try {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        } catch {}
      }
      const tempFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      // In-memory state remains intact even if disk write is temporarily unavailable
    } finally {
      this.writeLock = false;
    }
  }

  // --- Users ---
  getUserById(id: string): IUser | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string): IUser | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  saveUser(user: IUser): IUser {
    const idx = this.data.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      this.data.users[idx] = user;
    } else {
      this.data.users.push(user);
    }
    this.persist();
    return user;
  }

  deleteUser(id: string): boolean {
    this.data.users = this.data.users.filter((u) => u.id !== id);
    this.data.profiles = this.data.profiles.filter((p) => p.userId !== id);
    this.data.workoutPlans = this.data.workoutPlans.filter((w) => w.userId !== id);
    this.data.mealLogs = this.data.mealLogs.filter((m) => m.userId !== id);
    this.data.weightEntries = this.data.weightEntries.filter((w) => w.userId !== id);
    this.data.activityLogs = this.data.activityLogs.filter((a) => a.userId !== id);
    this.data.reminders = this.data.reminders.filter((r) => r.userId !== id);
    this.data.achievements = this.data.achievements.filter((a) => a.userId !== id);
    this.persist();
    return true;
  }

  // --- Profiles ---
  getProfileByUserId(userId: string): IUserProfile | undefined {
    return this.data.profiles.find((p) => p.userId === userId);
  }

  saveProfile(profile: IUserProfile): IUserProfile {
    const idx = this.data.profiles.findIndex((p) => p.userId === profile.userId);
    if (idx >= 0) {
      this.data.profiles[idx] = profile;
    } else {
      this.data.profiles.push(profile);
    }
    this.persist();
    return profile;
  }

  // --- Workout Plans ---
  getWorkoutPlansByUserId(userId: string): IWorkoutPlan[] {
    return this.data.workoutPlans.filter((w) => w.userId === userId);
  }

  getActiveWorkoutPlan(userId: string): IWorkoutPlan | undefined {
    return this.data.workoutPlans.find((w) => w.userId === userId && w.active);
  }

  saveWorkoutPlan(plan: IWorkoutPlan): IWorkoutPlan {
    if (plan.active) {
      // deactivate other plans
      this.data.workoutPlans.forEach((w) => {
        if (w.userId === plan.userId && w.id !== plan.id) {
          w.active = false;
        }
      });
    }
    const idx = this.data.workoutPlans.findIndex((w) => w.id === plan.id);
    if (idx >= 0) {
      this.data.workoutPlans[idx] = plan;
    } else {
      this.data.workoutPlans.push(plan);
    }
    this.persist();
    return plan;
  }

  deleteWorkoutPlan(id: string, userId: string): boolean {
    const prevLen = this.data.workoutPlans.length;
    this.data.workoutPlans = this.data.workoutPlans.filter((w) => !(w.id === id && w.userId === userId));
    if (this.data.workoutPlans.length !== prevLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // --- Meal Logs ---
  getMealLogsByUserId(userId: string, date?: string): IMealLog[] {
    return this.data.mealLogs.filter((m) => m.userId === userId && (!date || m.date === date));
  }

  saveMealLog(meal: IMealLog): IMealLog {
    const idx = this.data.mealLogs.findIndex((m) => m.id === meal.id);
    if (idx >= 0) {
      this.data.mealLogs[idx] = meal;
    } else {
      this.data.mealLogs.push(meal);
    }
    this.persist();
    return meal;
  }

  deleteMealLog(id: string, userId: string): boolean {
    const prevLen = this.data.mealLogs.length;
    this.data.mealLogs = this.data.mealLogs.filter((m) => !(m.id === id && m.userId === userId));
    if (this.data.mealLogs.length !== prevLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // --- Weight Entries ---
  getWeightEntries(userId: string): IWeightEntry[] {
    return this.data.weightEntries
      .filter((w) => w.userId === userId)
      .sort((a, b) => (a.date > b.date ? 1 : -1));
  }

  saveWeightEntry(entry: IWeightEntry): IWeightEntry {
    const idx = this.data.weightEntries.findIndex((w) => w.userId === entry.userId && w.date === entry.date);
    if (idx >= 0) {
      this.data.weightEntries[idx] = entry;
    } else {
      this.data.weightEntries.push(entry);
    }
    this.persist();
    return entry;
  }

  // --- Activity Logs ---
  getActivityLog(userId: string, date: string): IActivityLog | undefined {
    return this.data.activityLogs.find((a) => a.userId === userId && a.date === date);
  }

  getActivityLogsRange(userId: string, limit = 30): IActivityLog[] {
    return this.data.activityLogs
      .filter((a) => a.userId === userId)
      .sort((a, b) => (a.date > b.date ? 1 : -1))
      .slice(-limit);
  }

  saveActivityLog(log: IActivityLog): IActivityLog {
    const idx = this.data.activityLogs.findIndex((a) => a.userId === log.userId && a.date === log.date);
    if (idx >= 0) {
      this.data.activityLogs[idx] = log;
    } else {
      this.data.activityLogs.push(log);
    }
    this.persist();
    return log;
  }

  // --- Reminders ---
  getReminders(userId: string): IReminder[] {
    const reminders = this.data.reminders.filter((r) => r.userId === userId);
    if (reminders.length === 0) {
      // Seed default reminders for new user
      const defaults: IReminder[] = [
        {
          id: `rem_${Date.now()}_1`,
          userId,
          type: 'workout',
          title: 'Daily Workout Session',
          time: '18:00',
          daysOfWeek: [1, 2, 3, 4, 5],
          enabled: true,
        },
        {
          id: `rem_${Date.now()}_2`,
          userId,
          type: 'hydration',
          title: 'Hydration Check - Drink Water',
          time: '11:00',
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          enabled: true,
        },
        {
          id: `rem_${Date.now()}_3`,
          userId,
          type: 'meal',
          title: 'Log Today’s Meals & Nutrition',
          time: '20:30',
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          enabled: true,
        },
      ];
      this.data.reminders.push(...defaults);
      this.persist();
      return defaults;
    }
    return reminders;
  }

  saveReminder(reminder: IReminder): IReminder {
    const idx = this.data.reminders.findIndex((r) => r.id === reminder.id && r.userId === reminder.userId);
    if (idx >= 0) {
      this.data.reminders[idx] = reminder;
    } else {
      this.data.reminders.push(reminder);
    }
    this.persist();
    return reminder;
  }

  deleteReminder(id: string, userId: string): boolean {
    this.data.reminders = this.data.reminders.filter((r) => !(r.id === id && r.userId === userId));
    this.persist();
    return true;
  }

  // --- Achievements ---
  getAchievements(userId: string): IAchievement[] {
    const existing = this.data.achievements.filter((a) => a.userId === userId);
    if (existing.length === 0) {
      const defaultAchievements: IAchievement[] = [
        {
          id: `ach_${Date.now()}_1`,
          userId,
          code: 'FIRST_LOGIN',
          title: 'First Step Forward',
          description: 'Created your Fit AI account and started your health journey.',
          icon: 'Sparkles',
          unlockedAt: new Date().toISOString(),
          progress: 1,
          maxProgress: 1,
          category: 'profile',
        },
        {
          id: `ach_${Date.now()}_2`,
          userId,
          code: 'PROFILE_COMPLETE',
          title: 'Goals Defined',
          description: 'Completed your personal fitness profile and calibrated goals.',
          icon: 'Target',
          unlockedAt: null,
          progress: 0,
          maxProgress: 1,
          category: 'profile',
        },
        {
          id: `ach_${Date.now()}_3`,
          userId,
          code: 'FIRST_WORKOUT',
          title: 'Iron Will',
          description: 'Completed your first recorded workout routine.',
          icon: 'Dumbbell',
          unlockedAt: null,
          progress: 0,
          maxProgress: 1,
          category: 'workout',
        },
        {
          id: `ach_${Date.now()}_4`,
          userId,
          code: 'FIRST_MEAL_LOG',
          title: 'Mindful Eater',
          description: 'Logged your first nutritious meal.',
          icon: 'Utensils',
          unlockedAt: null,
          progress: 0,
          maxProgress: 1,
          category: 'nutrition',
        },
        {
          id: `ach_${Date.now()}_5`,
          userId,
          code: 'STREAK_3_DAYS',
          title: 'Consistency Champion',
          description: 'Logged activities or meals for 3 consecutive days.',
          icon: 'Flame',
          unlockedAt: null,
          progress: 0,
          maxProgress: 3,
          category: 'streak',
        },
        {
          id: `ach_${Date.now()}_6`,
          userId,
          code: 'HYDRATION_HERO',
          title: 'Hydration Hero',
          description: 'Reached your daily water intake goal of 2000ml+.',
          icon: 'Droplets',
          unlockedAt: null,
          progress: 0,
          maxProgress: 1,
          category: 'nutrition',
        },
      ];
      this.data.achievements.push(...defaultAchievements);
      this.persist();
      return defaultAchievements;
    }
    return existing;
  }

  unlockAchievement(userId: string, code: string): IAchievement | null {
    const userAchievements = this.getAchievements(userId);
    const item = userAchievements.find((a) => a.code === code);
    if (item && !item.unlockedAt) {
      item.unlockedAt = new Date().toISOString();
      item.progress = item.maxProgress;
      this.persist();
      return item;
    }
    return item || null;
  }

  // --- Full Export for User GDPR / Data Privacy ---
  exportUserData(userId: string) {
    const user = this.getUserById(userId);
    if (!user) return null;
    const { passwordHash, ...safeUser } = user;
    return {
      user: safeUser,
      profile: this.getProfileByUserId(userId) || null,
      workoutPlans: this.getWorkoutPlansByUserId(userId),
      mealLogs: this.getMealLogsByUserId(userId),
      weightEntries: this.getWeightEntries(userId),
      activityLogs: this.data.activityLogs.filter((a) => a.userId === userId),
      reminders: this.getReminders(userId),
      achievements: this.getAchievements(userId),
      exportedAt: new Date().toISOString(),
    };
  }
}

export const dbStore = new DataStore();
