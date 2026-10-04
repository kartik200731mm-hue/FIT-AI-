"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const storage_1 = require("../db/storage");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const exerciseSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    name: zod_1.z.string().min(1, 'Exercise name is required'),
    category: zod_1.z.enum(['strength', 'cardio', 'flexibility', 'hiit', 'core']),
    targetMuscle: zod_1.z.string().default('Full Body'),
    sets: zod_1.z.number().min(1).max(20),
    reps: zod_1.z.string().min(1),
    restSec: zod_1.z.number().min(0).max(600),
    instructions: zod_1.z.string().default(''),
    completed: zod_1.z.boolean().optional(),
});
const daySchema = zod_1.z.object({
    dayId: zod_1.z.string().optional(),
    dayName: zod_1.z.string().min(1, 'Day name is required'),
    focus: zod_1.z.string().default('General Fitness'),
    exercises: zod_1.z.array(exerciseSchema),
    completed: zod_1.z.boolean().optional(),
});
const workoutPlanSchema = zod_1.z.object({
    title: zod_1.z.string().min(2, 'Plan title must be at least 2 characters'),
    goal: zod_1.z.string().default('General Fitness'),
    difficulty: zod_1.z.enum(['beginner', 'intermediate', 'advanced']),
    daysPerWeek: zod_1.z.number().min(1).max(7),
    days: zod_1.z.array(daySchema),
    notes: zod_1.z.string().optional(),
    active: zod_1.z.boolean().default(true),
});
// GET /api/workouts/active
router.get('/active', auth_1.requireAuth, (req, res) => {
    if (!req.user)
        return;
    const activePlan = storage_1.dbStore.getActiveWorkoutPlan(req.user.id);
    res.json({ plan: activePlan || null });
});
// GET /api/workouts
router.get('/', auth_1.requireAuth, (req, res) => {
    if (!req.user)
        return;
    const plans = storage_1.dbStore.getWorkoutPlansByUserId(req.user.id);
    res.json({ plans });
});
// POST /api/workouts (create or save)
router.post('/', auth_1.requireAuth, (req, res) => {
    if (!req.user)
        return;
    const parseResult = workoutPlanSchema.safeParse(req.body);
    if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.errors[0].message });
        return;
    }
    const data = parseResult.data;
    const newPlan = {
        id: req.body.id || `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
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
    const saved = storage_1.dbStore.saveWorkoutPlan(newPlan);
    res.json({ message: 'Workout plan saved successfully', plan: saved });
});
// PATCH /api/workouts/:id/toggle-exercise
router.patch('/:id/toggle-exercise', auth_1.requireAuth, (req, res) => {
    if (!req.user)
        return;
    const { id } = req.params;
    const { dayId, exerciseId, completed } = req.body;
    const plan = storage_1.dbStore.getWorkoutPlansByUserId(req.user.id).find((p) => p.id === id);
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
    storage_1.dbStore.saveWorkoutPlan(plan);
    if (completed) {
        storage_1.dbStore.unlockAchievement(req.user.id, 'FIRST_WORKOUT');
    }
    res.json({ message: 'Exercise status updated', plan });
});
// DELETE /api/workouts/:id
router.delete('/:id', auth_1.requireAuth, (req, res) => {
    if (!req.user)
        return;
    const deleted = storage_1.dbStore.deleteWorkoutPlan(req.params.id, req.user.id);
    if (!deleted) {
        res.status(404).json({ error: 'Workout plan not found or already removed' });
        return;
    }
    res.json({ message: 'Workout plan deleted successfully' });
});
exports.default = router;
