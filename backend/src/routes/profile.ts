import { Router, Response } from 'express';
import { z } from 'zod';
import { dbStore } from '../db/storage';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { calculateBMI, calculateCaloricAndMacroTargets } from '../utils/nutrition';
import { IUserProfile, IWeightEntry } from '../types';

const router = Router();

const profileSchema = z.object({
  age: z.number().int().min(14, 'Age must be at least 14').max(100, 'Age must be 100 or less').optional().default(25),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional().default('prefer_not_to_say'),
  heightCm: z.number().min(100, 'Height must be at least 100 cm').max(250, 'Height must be 250 cm or less'),
  weightKg: z.number().min(30, 'Weight must be at least 30 kg').max(300, 'Weight must be 300 kg or less'),
  targetWeightKg: z.number().min(30, 'Target weight must be at least 30 kg').max(300, 'Target weight must be 300 kg or less').optional(),
  activityLevel: z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active']),
  fitnessGoal: z.enum(['weight_loss', 'muscle_gain', 'maintenance', 'endurance', 'general_health']),
  dietaryPreference: z.enum(['no_restriction', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo', 'halal', 'kosher', 'low_carb']),
  limitations: z.string().max(500, 'Limitations note must be 500 characters or less').optional().default(''),
});

// GET /api/profile
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) return;
  const profile = dbStore.getProfileByUserId(req.user.id);
  if (!profile) {
    res.status(404).json({ error: 'Profile not found. Please complete profile onboarding.' });
    return;
  }
  const bmiInfo = calculateBMI(profile.weightKg, profile.heightCm, profile.age);
  res.json({ profile, bmiInfo });
});

// POST /api/profile (create or update)
router.post('/', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) return;
  const parseResult = profileSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.errors[0].message });
    return;
  }

  const data = parseResult.data;
  const age = data.age ?? 25;
  const gender = data.gender ?? 'prefer_not_to_say';
  const targetWeightKg = data.targetWeightKg ?? data.weightKg;

  const bmiCalc = calculateBMI(data.weightKg, data.heightCm, age);
  const targets = calculateCaloricAndMacroTargets({
    weightKg: data.weightKg,
    heightCm: data.heightCm,
    age,
    gender,
    activityLevel: data.activityLevel,
    fitnessGoal: data.fitnessGoal,
  });

  const updatedProfile: IUserProfile = {
    userId: req.user.id,
    age,
    gender,
    heightCm: data.heightCm,
    weightKg: data.weightKg,
    targetWeightKg,
    activityLevel: data.activityLevel,
    fitnessGoal: data.fitnessGoal,
    dietaryPreference: data.dietaryPreference,
    limitations: data.limitations || '',
    dailyCalorieTarget: targets.targetCalories,
    dailyProteinTarget: targets.proteinGrams,
    dailyCarbsTarget: targets.carbsGrams,
    dailyFatTarget: targets.fatGrams,
    waterTargetMl: targets.waterMl,
    bmi: bmiCalc.bmi,
    bmiCategory: bmiCalc.category,
    updatedAt: new Date().toISOString(),
  };

  dbStore.saveProfile(updatedProfile);

  // Auto record initial weight in progress history if no entries exist
  const existingWeightEntries = dbStore.getWeightEntries(req.user.id);
  const today = new Date().toISOString().split('T')[0];
  if (existingWeightEntries.length === 0 || !existingWeightEntries.some((w) => w.date === today)) {
    const newEntry: IWeightEntry = {
      id: `w_${Date.now()}`,
      userId: req.user.id,
      date: today,
      weightKg: data.weightKg,
      bmi: bmiCalc.bmi,
      notes: 'Initial calibrated entry',
      createdAt: new Date().toISOString(),
    };
    dbStore.saveWeightEntry(newEntry);
  }

  // Unlock PROFILE_COMPLETE milestone
  dbStore.unlockAchievement(req.user.id, 'PROFILE_COMPLETE');

  res.json({
    message: 'Profile saved successfully',
    profile: updatedProfile,
    bmiInfo: bmiCalc,
    targets,
  });
});

export default router;
