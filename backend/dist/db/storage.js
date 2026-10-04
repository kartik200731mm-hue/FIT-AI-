"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbStore = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DATA_DIR = path_1.default.resolve(__dirname, '../../data');
const DB_FILE = path_1.default.join(DATA_DIR, 'fit_ai_database.json');
const INITIAL_DATA = {
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
    data = INITIAL_DATA;
    isLoaded = false;
    writeLock = false;
    constructor() {
        this.ensureInitialized();
    }
    ensureInitialized() {
        if (this.isLoaded)
            return;
        try {
            if (!fs_1.default.existsSync(DATA_DIR)) {
                fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
            }
            if (fs_1.default.existsSync(DB_FILE)) {
                const raw = fs_1.default.readFileSync(DB_FILE, 'utf-8');
                this.data = { ...INITIAL_DATA, ...JSON.parse(raw) };
            }
            else {
                this.data = INITIAL_DATA;
                this.persist();
            }
            this.isLoaded = true;
        }
        catch (err) {
            console.error('Failed to initialize local data store:', err);
            this.data = INITIAL_DATA;
            this.isLoaded = true;
        }
    }
    persist() {
        if (this.writeLock)
            return;
        this.writeLock = true;
        try {
            if (!fs_1.default.existsSync(DATA_DIR)) {
                fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
            }
            const tempFile = `${DB_FILE}.tmp`;
            fs_1.default.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
            fs_1.default.renameSync(tempFile, DB_FILE);
        }
        catch (err) {
            console.error('Failed to persist database to file:', err);
        }
        finally {
            this.writeLock = false;
        }
    }
    // --- Users ---
    getUserById(id) {
        return this.data.users.find((u) => u.id === id);
    }
    getUserByEmail(email) {
        return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    }
    saveUser(user) {
        const idx = this.data.users.findIndex((u) => u.id === user.id);
        if (idx >= 0) {
            this.data.users[idx] = user;
        }
        else {
            this.data.users.push(user);
        }
        this.persist();
        return user;
    }
    deleteUser(id) {
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
    getProfileByUserId(userId) {
        return this.data.profiles.find((p) => p.userId === userId);
    }
    saveProfile(profile) {
        const idx = this.data.profiles.findIndex((p) => p.userId === profile.userId);
        if (idx >= 0) {
            this.data.profiles[idx] = profile;
        }
        else {
            this.data.profiles.push(profile);
        }
        this.persist();
        return profile;
    }
    // --- Workout Plans ---
    getWorkoutPlansByUserId(userId) {
        return this.data.workoutPlans.filter((w) => w.userId === userId);
    }
    getActiveWorkoutPlan(userId) {
        return this.data.workoutPlans.find((w) => w.userId === userId && w.active);
    }
    saveWorkoutPlan(plan) {
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
        }
        else {
            this.data.workoutPlans.push(plan);
        }
        this.persist();
        return plan;
    }
    deleteWorkoutPlan(id, userId) {
        const prevLen = this.data.workoutPlans.length;
        this.data.workoutPlans = this.data.workoutPlans.filter((w) => !(w.id === id && w.userId === userId));
        if (this.data.workoutPlans.length !== prevLen) {
            this.persist();
            return true;
        }
        return false;
    }
    // --- Meal Logs ---
    getMealLogsByUserId(userId, date) {
        return this.data.mealLogs.filter((m) => m.userId === userId && (!date || m.date === date));
    }
    saveMealLog(meal) {
        const idx = this.data.mealLogs.findIndex((m) => m.id === meal.id);
        if (idx >= 0) {
            this.data.mealLogs[idx] = meal;
        }
        else {
            this.data.mealLogs.push(meal);
        }
        this.persist();
        return meal;
    }
    deleteMealLog(id, userId) {
        const prevLen = this.data.mealLogs.length;
        this.data.mealLogs = this.data.mealLogs.filter((m) => !(m.id === id && m.userId === userId));
        if (this.data.mealLogs.length !== prevLen) {
            this.persist();
            return true;
        }
        return false;
    }
    // --- Weight Entries ---
    getWeightEntries(userId) {
        return this.data.weightEntries
            .filter((w) => w.userId === userId)
            .sort((a, b) => (a.date > b.date ? 1 : -1));
    }
    saveWeightEntry(entry) {
        const idx = this.data.weightEntries.findIndex((w) => w.userId === entry.userId && w.date === entry.date);
        if (idx >= 0) {
            this.data.weightEntries[idx] = entry;
        }
        else {
            this.data.weightEntries.push(entry);
        }
        this.persist();
        return entry;
    }
    // --- Activity Logs ---
    getActivityLog(userId, date) {
        return this.data.activityLogs.find((a) => a.userId === userId && a.date === date);
    }
    getActivityLogsRange(userId, limit = 30) {
        return this.data.activityLogs
            .filter((a) => a.userId === userId)
            .sort((a, b) => (a.date > b.date ? 1 : -1))
            .slice(-limit);
    }
    saveActivityLog(log) {
        const idx = this.data.activityLogs.findIndex((a) => a.userId === log.userId && a.date === log.date);
        if (idx >= 0) {
            this.data.activityLogs[idx] = log;
        }
        else {
            this.data.activityLogs.push(log);
        }
        this.persist();
        return log;
    }
    // --- Reminders ---
    getReminders(userId) {
        const reminders = this.data.reminders.filter((r) => r.userId === userId);
        if (reminders.length === 0) {
            // Seed default reminders for new user
            const defaults = [
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
    saveReminder(reminder) {
        const idx = this.data.reminders.findIndex((r) => r.id === reminder.id && r.userId === reminder.userId);
        if (idx >= 0) {
            this.data.reminders[idx] = reminder;
        }
        else {
            this.data.reminders.push(reminder);
        }
        this.persist();
        return reminder;
    }
    deleteReminder(id, userId) {
        this.data.reminders = this.data.reminders.filter((r) => !(r.id === id && r.userId === userId));
        this.persist();
        return true;
    }
    // --- Achievements ---
    getAchievements(userId) {
        const existing = this.data.achievements.filter((a) => a.userId === userId);
        if (existing.length === 0) {
            const defaultAchievements = [
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
    unlockAchievement(userId, code) {
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
    exportUserData(userId) {
        const user = this.getUserById(userId);
        if (!user)
            return null;
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
exports.dbStore = new DataStore();
