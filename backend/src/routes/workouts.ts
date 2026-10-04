import { Router, Response } from 'express';
import { z } from 'zod';
import { dbStore } from '../db/storage';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { IWorkoutPlan } from '../types';

const router = Router();

const exerciseSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Exercise name is required'),
  category: z.enum(['strength', 'cardio', 'flexibility', 'hiit', 'core']),
  targetMuscle: z.string().default('Full Body'),
  sets: z.number().min(1).max(20),
  reps: z.string().min(1),
  restSec: z.number().min(0).max(600),
  instructions: z.string().default(''),
  completed: z.boolean().optional(),
});

const daySchema = z.object({
  dayId: z.string().optional(),
  dayName: z.string().min(1, 'Day name is required'),
  focus: z.string().default('General Fitness'),
  exercises: z.array(exerciseSchema),
  completed: z.boolean().optional(),
});

const workoutPlanSchema = z.object({
  title: z.string().min(2, 'Plan title must be at least 2 characters'),
  goal: z.string().default('General Fitness'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  daysPerWeek: z.number().min(1).max(7),
  days: z.array(daySchema),
  notes: z.string().optional(),
  active: z.boolean().default(true),
});

// GET /api/workouts/active
router.get('/active', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) return;
  const activePlan = dbStore.getActiveWorkoutPlan(req.user.id);
  res.json({ plan: activePlan || null });
});

// GET /api/workouts
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) return;
  const plans = dbStore.getWorkoutPlansByUserId(req.user.id);
  res.json({ plans });
});

// POST /api/workouts (create or save)
router.post('/', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) return;
  const parseResult = workoutPlanSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.errors[0].message });
    return;
  }

  const data = parseResult.data;
  const newPlan: IWorkoutPlan = {
    id: (req.body.id as string) || `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: req.user.id,
    title: data.title,
    goal: data.goal,
    difficulty: data.difficulty,
    daysPerWeek: data.daysPerWeek,
    days: data.days.map((d, dIdx) => ({
      dayId: d.dayId || `day-${dIdx + 1}`,
      dayName: d.dayName,
      focus: d.focus,
      completed: d.completed ?? false,
      exercises: d.exercises.map((e, eIdx) => ({
        id: e.id || `ex-${Date.now()}-${dIdx}-${eIdx}`,
        name: e.name,
        category: e.category,
        targetMuscle: e.targetMuscle,
        sets: e.sets,
        reps: e.reps,
        restSec: e.restSec,
        instructions: e.instructions || '',
        completed: e.completed ?? false,
      })),
    })),
    notes: data.notes || '',
    isAiGenerated: req.body.isAiGenerated ?? false,
    active: data.active,
    createdAt: req.body.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const saved = dbStore.saveWorkoutPlan(newPlan);
  res.json({ message: 'Workout plan saved successfully', plan: saved });
});

// PATCH /api/workouts/:id/toggle-exercise
router.patch('/:id/toggle-exercise', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) return;
  const { id } = req.params;
  const { dayId, exerciseId, completed } = req.body;

  const plan = dbStore.getWorkoutPlansByUserId(req.user.id).find((p) => p.id === id);
  if (!plan) {
    res.status(404).json({ error: 'Workout plan not found' });
    return;
  }

  const day = plan.days.find((d) => d.dayId === dayId);
  if (!day) {
    res.status(404).json({ error: 'Workout day not found' });
    return;
  }

  const exercise = day.exercises.find((e) => e.id === exerciseId);
  if (!exercise) {
    res.status(404).json({ error: 'Exercise not found' });
    return;
  }

  exercise.completed = completed;
  day.completed = day.exercises.every((e) => e.completed);
  plan.updatedAt = new Date().toISOString();

  dbStore.saveWorkoutPlan(plan);

  if (completed) {
    dbStore.unlockAchievement(req.user.id, 'FIRST_WORKOUT');
  }

  res.json({ message: 'Exercise status updated', plan });
});

// DELETE /api/workouts/:id
router.delete('/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) return;
  const deleted = dbStore.deleteWorkoutPlan(req.params.id, req.user.id);
  if (!deleted) {
    res.status(404).json({ error: 'Workout plan not found or already removed' });
    return;
  }
  res.json({ message: 'Workout plan deleted successfully' });
});

export default router;
