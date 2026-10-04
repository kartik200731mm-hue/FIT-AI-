"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const storage_1 = require("../db/storage");
const auth_1 = require("../middleware/auth");
const nutrition_1 = require("../utils/nutrition");
const router = (0, express_1.Router)();
const profileSchema = zod_1.z.object({
    age: zod_1.z.number().int().min(14, 'Age must be at least 14').max(100, 'Age must be 100 or less'),
    gender: zod_1.z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
    heightCm: zod_1.z.number().min(100, 'Height must be at least 100 cm').max(250, 'Height must be 250 cm or less'),
    weightKg: zod_1.z.number().min(30, 'Weight must be at least 30 kg').max(300, 'Weight must be 300 kg or less'),
    targetWeightKg: zod_1.z.number().min(30, 'Target weight must be at least 30 kg').max(300, 'Target weight must be 300 kg or less'),
    activityLevel: zod_1.z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active']),
    fitnessGoal: zod_1.z.enum(['weight_loss', 'muscle_gain', 'maintenance', 'endurance', 'general_health']),
    dietaryPreference: zod_1.z.enum(['no_restriction', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo', 'halal', 'kosher', 'low_carb']),
    limitations: zod_1.z.string().max(500).default(''),
});
// GET /api/profile
router.get('/', auth_1.requireAuth, (req, res) => {
    if (!req.user)
        return;
    const profile = storage_1.dbStore.getProfileByUserId(req.user.id);
    if (!profile) {
        res.status(404).json({ error: 'Profile not found. Please complete profile onboarding.' });
        return;
    }
    const bmiInfo = (0, nutrition_1.calculateBMI)(profile.weightKg, profile.heightCm);
    res.json({ profile, bmiInfo });
});
// POST /api/profile (create or update)
router.post('/', auth_1.requireAuth, (req, res) => {
    if (!req.user)
        return;
    const parseResult = profileSchema.safeParse(req.body);
    if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.errors[0].message });
        return;
    }
    const data = parseResult.data;
    const bmiCalc = (0, nutrition_1.calculateBMI)(data.weightKg, data.heightCm);
    const targets = (0, nutrition_1.calculateCaloricAndMacroTargets)({
        weightKg: data.weightKg,
        heightCm: data.heightCm,
        age: data.age,
        gender: data.gender,
        activityLevel: data.activityLevel,
        fitnessGoal: data.fitnessGoal,
    });
    const updatedProfile = {
        userId: req.user.id,
        age: data.age,
        gender: data.gender,
        heightCm: data.heightCm,
        weightKg: data.weightKg,
        targetWeightKg: data.targetWeightKg,
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
    storage_1.dbStore.saveProfile(updatedProfile);
    // Auto record initial weight in progress history if no entries exist
    const existingWeightEntries = storage_1.dbStore.getWeightEntries(req.user.id);
    const today = new Date().toISOString().split('T')[0];
    if (existingWeightEntries.length === 0 || !existingWeightEntries.some((w) => w.date === today)) {
        const newEntry = {
            id: `w_${Date.now()}`,
            userId: req.user.id,
            date: today,
            weightKg: data.weightKg,
            bmi: bmiCalc.bmi,
            notes: 'Initial calibrated entry',
            createdAt: new Date().toISOString(),
        };
        storage_1.dbStore.saveWeightEntry(newEntry);
    }
    // Unlock PROFILE_COMPLETE milestone
    storage_1.dbStore.unlockAchievement(req.user.id, 'PROFILE_COMPLETE');
    res.json({
        message: 'Profile saved successfully',
        profile: updatedProfile,
        bmiInfo: bmiCalc,
        targets,
    });
});
exports.default = router;
