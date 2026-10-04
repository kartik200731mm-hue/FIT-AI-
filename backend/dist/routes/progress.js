"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const storage_1 = require("../db/storage");
const auth_1 = require("../middleware/auth");
const nutrition_1 = require("../utils/nutrition");
const router = (0, express_1.Router)();
const weightSchema = zod_1.z.object({
    weightKg: zod_1.z.number().min(30, 'Weight must be at least 30 kg').max(300, 'Weight must be <= 300 kg'),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
    notes: zod_1.z.string().optional(),
});
const activitySchema = zod_1.z.object({
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    steps: zod_1.z.number().min(0).max(100000).default(0),
    activeMinutes: zod_1.z.number().min(0).max(1440).default(0),
    waterMl: zod_1.z.number().min(0).max(10000).default(0),
    workoutCompleted: zod_1.z.boolean().default(false),
    notes: zod_1.z.string().optional(),
});
// GET /api/progress/summary
router.get('/summary', auth_1.requireAuth, (req, res) => {
    if (!req.user)
        return;
    const profile = storage_1.dbStore.getProfileByUserId(req.user.id);
    const weightEntries = storage_1.dbStore.getWeightEntries(req.user.id);
    const activityLogs = storage_1.dbStore.getActivityLogsRange(req.user.id, 30);
    const mealLogs = storage_1.dbStore.getMealLogsByUserId(req.user.id);
    // Calculate current streak (days with either workout, activity, or meal logged)
    const activeDates = new Set();
    activityLogs.forEach((a) => {
        if (a.steps > 0 || a.activeMinutes > 0 || a.workoutCompleted)
            activeDates.add(a.date);
    });
    mealLogs.forEach((m) => activeDates.add(m.date));
    weightEntries.forEach((w) => activeDates.add(w.date));
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 60; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        if (activeDates.has(dateStr)) {
            streak++;
        }
        else if (i > 0) {
            // Allow today to not be logged yet without breaking yesterday's streak
            break;
        }
    }
    if (streak >= 3) {
        storage_1.dbStore.unlockAchievement(req.user.id, 'STREAK_3_DAYS');
    }
    const latestWeight = weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].weightKg : profile?.weightKg || 70;
    const initialWeight = weightEntries.length > 0 ? weightEntries[0].weightKg : profile?.weightKg || 70;
    const totalWeightDelta = Math.round((latestWeight - initialWeight) * 10) / 10;
    const bmiInfo = profile ? (0, nutrition_1.calculateBMI)(latestWeight, profile.heightCm) : null;
    res.json({
        profile,
        latestWeight,
        initialWeight,
        targetWeight: profile?.targetWeightKg || null,
        totalWeightDelta,
        weightEntries,
        activityLogs,
        streak,
        bmiInfo,
    });
});
// POST /api/progress/weight
router.post('/weight', auth_1.requireAuth, (req, res) => {
    if (!req.user)
        return;
    const parseResult = weightSchema.safeParse(req.body);
    if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.errors[0].message });
        return;
    }
    const { weightKg, date, notes } = parseResult.data;
    const entryDate = date || new Date().toISOString().split('T')[0];
    const profile = storage_1.dbStore.getProfileByUserId(req.user.id);
    const bmi = profile ? (0, nutrition_1.calculateBMI)(weightKg, profile.heightCm).bmi : 0;
    const entry = {
        id: `w_${Date.now()}`,
        userId: req.user.id,
        date: entryDate,
        weightKg,
        bmi,
        notes: notes || '',
        createdAt: new Date().toISOString(),
    };
    storage_1.dbStore.saveWeightEntry(entry);
    // Also update current profile weight if date is today or recent
    if (profile) {
        profile.weightKg = weightKg;
        profile.bmi = bmi;
        profile.updatedAt = new Date().toISOString();
        storage_1.dbStore.saveProfile(profile);
    }
    res.status(201).json({ message: 'Weight logged successfully', entry });
});
// POST /api/progress/activity
router.post('/activity', auth_1.requireAuth, (req, res) => {
    if (!req.user)
        return;
    const parseResult = activitySchema.safeParse(req.body);
    if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.errors[0].message });
        return;
    }
    const { date, steps, activeMinutes, waterMl, workoutCompleted, notes } = parseResult.data;
    const log = {
        id: `act_${Date.now()}`,
        userId: req.user.id,
        date,
        steps,
        activeMinutes,
        waterMl,
        workoutCompleted,
        notes: notes || '',
    };
    storage_1.dbStore.saveActivityLog(log);
    if (waterMl >= 2000) {
        storage_1.dbStore.unlockAchievement(req.user.id, 'HYDRATION_HERO');
    }
    res.json({ message: 'Activity logged successfully', log });
});
exports.default = router;
