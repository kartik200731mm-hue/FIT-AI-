import { Router, Response } from 'express';
import { z } from 'zod';
import { dbStore } from '../db/storage';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { IMealLog, IMealItem } from '../types';

const router = Router();

const mealItemSchema = z.object({
  name: z.string().min(1, 'Food name is required'),
  calories: z.number().min(0, 'Calories must be >= 0'),
  protein: z.number().min(0, 'Protein must be >= 0'),
  carbs: z.number().min(0, 'Carbs must be >= 0'),
  fat: z.number().min(0, 'Fat must be >= 0'),
  portion: z.string().default('1 serving'),
  isEstimated: z.boolean().default(true),
});

const mealLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  items: z.array(mealItemSchema).min(1, 'Please add at least one item'),
  notes: z.string().optional(),
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
router.get('/common-foods', (_req, res: Response): void => {
  res.json({ foods: COMMON_FOODS });
});

// GET /api/meals?date=YYYY-MM-DD
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) return;
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const logs = dbStore.getMealLogsByUserId(req.user.id, date);
  const profile = dbStore.getProfileByUserId(req.user.id);

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
router.post('/', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) return;
  const parseResult = mealLogSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.errors[0].message });
    return;
  }

  const { date, mealType, items, notes } = parseResult.data;

  // Check if a log for this date and mealType already exists to append, or create a new one
  const existingLogs = dbStore.getMealLogsByUserId(req.user.id, date);
  let mealLog = existingLogs.find((m) => m.mealType === mealType);

  const formattedItems: IMealItem[] = items.map((i) => ({
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
    if (notes) mealLog.notes = notes;
    dbStore.saveMealLog(mealLog);
  } else {
    mealLog = {
      id: `meal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: req.user.id,
      date,
      mealType,
      items: formattedItems,
      notes: notes || '',
      loggedAt: new Date().toISOString(),
    };
    dbStore.saveMealLog(mealLog);
  }

  // Check achievement
  dbStore.unlockAchievement(req.user.id, 'FIRST_MEAL_LOG');

  res.status(201).json({ message: 'Meal logged successfully', log: mealLog });
});

// DELETE /api/meals/:mealId/item/:itemId
router.delete('/:mealId/item/:itemId', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) return;
  const { mealId, itemId } = req.params;

  const logs = dbStore.getMealLogsByUserId(req.user.id);
  const log = logs.find((m) => m.id === mealId);

  if (!log) {
    res.status(404).json({ error: 'Meal log not found' });
    return;
  }

  log.items = log.items.filter((i) => i.id !== itemId);
  if (log.items.length === 0) {
    dbStore.deleteMealLog(mealId, req.user.id);
  } else {
    dbStore.saveMealLog(log);
  }

  res.json({ message: 'Item removed from meal log' });
});

// DELETE /api/meals/:id
router.delete('/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) return;
  const deleted = dbStore.deleteMealLog(req.params.id, req.user.id);
  if (!deleted) {
    res.status(404).json({ error: 'Meal log not found' });
    return;
  }
  res.json({ message: 'Meal log deleted' });
});

export default router;
