"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const storage_1 = require("../db/storage");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const mealItemSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Food name is required'),
    calories: zod_1.z.number().min(0, 'Calories must be >= 0'),
    protein: zod_1.z.number().min(0, 'Protein must be >= 0'),
    carbs: zod_1.z.number().min(0, 'Carbs must be >= 0'),
    fat: zod_1.z.number().min(0, 'Fat must be >= 0'),
    portion: zod_1.z.string().default('1 serving'),
    isEstimated: zod_1.z.boolean().default(true),
});
const mealLogSchema = zod_1.z.object({
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    mealType: zod_1.z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
    items: zod_1.z.array(mealItemSchema).min(1, 'Please add at least one item'),
    notes: zod_1.z.string().optional(),
});
// Common food catalog for fast user logging
const COMMON_FOODS = [
    { name: 'Oatmeal with Almond Milk & Berries', calories: 280, protein: 9, carbs: 48, fat: 5, portion: '1 bowl' },
    { name: 'Scrambled Eggs (2 eggs + olive oil)', calories: 190, protein: 13, carbs: 1, fat: 14, portion: '2 whole eggs' },
    { name: 'Grilled Chicken Breast', calories: 220, protein: 42, carbs: 0, fat: 4, portion: '150g cooked' },
    { name: 'Steamed Brown Rice', calories: 215, protein: 5, carbs: 45, fat: 2, portion: '1 cup cooked' },
    { name: 'Atlantic Salmon Fillet', calories: 340, protein: 34, carbs: 0, fat: 22, portion: '170g cooked' },
    { name: 'Greek Yogurt (0% Fat)', calories: 130, protein: 22, carbs: 7, fat: 0, portion: '1 cup (200g)' },
    { name: 'Whey / Plant Protein Shake', calories: 140, protein: 25, carbs: 3, fat: 2, portion: '1 scoop (30g)' },
    { name: 'Mixed Roasted Almonds & Walnuts', calories: 170, protein: 6, carbs: 6, fat: 15, portion: '1 handful (28g)' },
    { name: 'Banana', calories: 105, protein: 1, carbs: 27, fat: 0.3, portion: '1 medium' },
    { name: 'Avocado Toast on Whole Wheat', calories: 290, protein: 7, carbs: 26, fat: 18, portion: '1 slice with 1/2 avocado' },
    { name: 'Tofu & Broccoli Stir-Fry', calories: 310, protein: 20, carbs: 18, fat: 16, portion: '1 medium plate' },
    { name: 'Quinoa & Black Bean Bowl', calories: 380, protein: 15, carbs: 62, fat: 7, portion: '1 bowl' },
    { name: 'Whole Wheat Pasta with Marinara', calories: 360, protein: 13, carbs: 68, fat: 3, portion: '1.5 cups cooked' },
    { name: 'Peanut Butter on Rice Cakes', calories: 210, protein: 8, carbs: 18, fat: 12, portion: '2 cakes with 1.5 tbsp PB' },
];
// GET /api/meals/common-foods
router.get('/common-foods', (_req, res) => {
    res.json({ foods: COMMON_FOODS });
});
// GET /api/meals?date=YYYY-MM-DD
router.get('/', auth_1.requireAuth, (req, res) => {
    if (!req.user)
        return;
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const logs = storage_1.dbStore.getMealLogsByUserId(req.user.id, date);
    const profile = storage_1.dbStore.getProfileByUserId(req.user.id);
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    logs.forEach((log) => {
        log.items.forEach((item) => {
            totalCalories += item.calories;
            totalProtein += item.protein;
            totalCarbs += item.carbs;
            totalFat += item.fat;
        });
    });
    const targets = {
        calories: profile?.dailyCalorieTarget || 2000,
        protein: profile?.dailyProteinTarget || 120,
        carbs: profile?.dailyCarbsTarget || 220,
        fat: profile?.dailyFatTarget || 60,
    };
    res.json({
        date,
        logs,
        summary: {
            consumed: {
                calories: Math.round(totalCalories),
                protein: Math.round(totalProtein),
                carbs: Math.round(totalCarbs),
                fat: Math.round(totalFat),
            },
            targets,
            remainingCalories: Math.max(0, targets.calories - Math.round(totalCalories)),
        },
    });
});
// POST /api/meals
router.post('/', auth_1.requireAuth, (req, res) => {
    if (!req.user)
        return;
    const parseResult = mealLogSchema.safeParse(req.body);
    if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.errors[0].message });
        return;
    }
    const { date, mealType, items, notes } = parseResult.data;
    // Check if a log for this date and mealType already exists to append, or create a new one
    const existingLogs = storage_1.dbStore.getMealLogsByUserId(req.user.id, date);
    let mealLog = existingLogs.find((m) => m.mealType === mealType);
    const formattedItems = items.map((i) => ({
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: i.name,
        calories: Math.round(i.calories),
        protein: Math.round(i.protein),
        carbs: Math.round(i.carbs),
        fat: Math.round(i.fat),
        portion: i.portion,
        isEstimated: i.isEstimated ?? true,
    }));
    if (mealLog) {
        mealLog.items.push(...formattedItems);
        if (notes)
            mealLog.notes = notes;
        storage_1.dbStore.saveMealLog(mealLog);
    }
    else {
        mealLog = {
            id: `meal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            userId: req.user.id,
            date,
            mealType,
            items: formattedItems,
            notes: notes || '',
            loggedAt: new Date().toISOString(),
        };
        storage_1.dbStore.saveMealLog(mealLog);
    }
    // Check achievement
    storage_1.dbStore.unlockAchievement(req.user.id, 'FIRST_MEAL_LOG');
    res.status(201).json({ message: 'Meal logged successfully', log: mealLog });
});
// DELETE /api/meals/:mealId/item/:itemId
router.delete('/:mealId/item/:itemId', auth_1.requireAuth, (req, res) => {
    if (!req.user)
        return;
    const { mealId, itemId } = req.params;
    const logs = storage_1.dbStore.getMealLogsByUserId(req.user.id);
    const log = logs.find((m) => m.id === mealId);
    if (!log) {
        res.status(404).json({ error: 'Meal log not found' });
        return;
    }
    log.items = log.items.filter((i) => i.id !== itemId);
    if (log.items.length === 0) {
        storage_1.dbStore.deleteMealLog(mealId, req.user.id);
    }
    else {
        storage_1.dbStore.saveMealLog(log);
    }
    res.json({ message: 'Item removed from meal log' });
});
// DELETE /api/meals/:id
router.delete('/:id', auth_1.requireAuth, (req, res) => {
    if (!req.user)
        return;
    const deleted = storage_1.dbStore.deleteMealLog(req.params.id, req.user.id);
    if (!deleted) {
        res.status(404).json({ error: 'Meal log not found' });
        return;
    }
    res.json({ message: 'Meal log deleted' });
});
exports.default = router;
