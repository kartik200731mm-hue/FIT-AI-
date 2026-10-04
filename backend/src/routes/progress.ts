import { Router, Response } from 'express';
import { z } from 'zod';
import { dbStore } from '../db/storage';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { calculateBMI } from '../utils/nutrition';
import { IWeightEntry, IActivityLog } from '../types';

const router = Router();

const weightSchema = z.object({
  weightKg: z.number().min(30, 'Weight must be at least 30 kg').max(300, 'Weight must be <= 300 kg'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  notes: z.string().optional(),
});

const activitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  steps: z.number().min(0).max(100000).default(0),
  activeMinutes: z.number().min(0).max(1440).default(0),
  waterMl: z.number().min(0).max(10000).default(0),
  workoutCompleted: z.boolean().default(false),
  notes: z.string().optional(),
});

// GET /api/progress/summary
router.get('/summary', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) return;
  const profile = dbStore.getProfileByUserId(req.user.id);
  const weightEntries = dbStore.getWeightEntries(req.user.id);
  const activityLogs = dbStore.getActivityLogsRange(req.user.id, 30);
  const mealLogs = dbStore.getMealLogsByUserId(req.user.id);

  // Calculate current streak (days with either workout, activity, or meal logged)
  const activeDates = new Set<string>();
  activityLogs.forEach((a) => {
    if (a.steps > 0 || a.activeMinutes > 0 || a.workoutCompleted) activeDates.add(a.date);
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
    } else if (i > 0) {
      // Allow today to not be logged yet without breaking yesterday's streak
      break;
    }
  }

  if (streak >= 3) {
    dbStore.unlockAchievement(req.user.id, 'STREAK_3_DAYS');
  }

  const latestWeight = weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].weightKg : profile?.weightKg || 70;
  const initialWeight = weightEntries.length > 0 ? weightEntries[0].weightKg : profile?.weightKg || 70;
  const totalWeightDelta = Math.round((latestWeight - initialWeight) * 10) / 10;

  const bmiInfo = profile ? calculateBMI(latestWeight, profile.heightCm, profile.age) : null;

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
router.post('/weight', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) return;
  const parseResult = weightSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.errors[0].message });
    return;
  }

  const { weightKg, date, notes } = parseResult.data;
  const entryDate = date || new Date().toISOString().split('T')[0];
  const profile = dbStore.getProfileByUserId(req.user.id);

  const bmi = profile ? calculateBMI(weightKg, profile.heightCm, profile.age).bmi : 0;

  const entry: IWeightEntry = {
    id: `w_${Date.now()}`,
    userId: req.user.id,
    date: entryDate,
    weightKg,
    bmi,
    notes: notes || '',
    createdAt: new Date().toISOString(),
  };

  dbStore.saveWeightEntry(entry);

  // Also update current profile weight if date is today or recent
  if (profile) {
    profile.weightKg = weightKg;
    profile.bmi = bmi;
    profile.updatedAt = new Date().toISOString();
    dbStore.saveProfile(profile);
  }

  res.status(201).json({ message: 'Weight logged successfully', entry });
});

// POST /api/progress/activity
router.post('/activity', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) return;
  const parseResult = activitySchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.errors[0].message });
    return;
  }

  const { date, steps, activeMinutes, waterMl, workoutCompleted, notes } = parseResult.data;

  const log: IActivityLog = {
    id: `act_${Date.now()}`,
    userId: req.user.id,
    date,
    steps,
    activeMinutes,
    waterMl,
    workoutCompleted,
    notes: notes || '',
  };

  dbStore.saveActivityLog(log);

  if (waterMl >= 2000) {
    dbStore.unlockAchievement(req.user.id, 'HYDRATION_HERO');
  }

  res.json({ message: 'Activity logged successfully', log });
});

export default router;
