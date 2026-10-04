"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const storage_1 = require("../db/storage");
const auth_1 = require("../middleware/auth");
const aiService_1 = require("../ai/aiService");
const router = (0, express_1.Router)();
// GET /api/ai-coach/status
router.get('/status', auth_1.requireAuth, (_req, res) => {
    const isLive = aiService_1.AIService.isLiveAiAvailable();
    res.json({
        status: 'ready',
        mode: isLive ? 'live_gemini' : 'expert_deterministic',
        engineLabel: isLive ? 'Google Gemini 1.5 Flash (Live)' : 'Fit AI Expert Deterministic Engine (Active Demo Mode)',
        notice: isLive
            ? 'Connected to real-time generative AI engine.'
            : 'Running in high-precision Deterministic Demo Mode (offline-ready, instant results, zero API cost).',
    });
});
// POST /api/ai-coach/generate-workout
const generateWorkoutSchema = zod_1.z.object({
    daysPerWeek: zod_1.z.number().min(2).max(6).default(4),
    difficulty: zod_1.z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
    customFocus: zod_1.z.string().optional(),
});
router.post('/generate-workout', auth_1.requireAuth, auth_1.aiLimiter, async (req, res) => {
    if (!req.user)
        return;
    const profile = storage_1.dbStore.getProfileByUserId(req.user.id);
    if (!profile) {
        res.status(400).json({ error: 'Please complete your fitness profile before generating a personalized plan.' });
        return;
    }
    const parseResult = generateWorkoutSchema.safeParse(req.body);
    if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.errors[0].message });
        return;
    }
    const { daysPerWeek, difficulty } = parseResult.data;
    try {
        const result = await aiService_1.AIService.generateWorkoutPlan(profile, daysPerWeek, difficulty);
        res.json(result);
    }
    catch (error) {
        console.error('AI Workout plan generation error:', error);
        res.status(500).json({ error: 'Failed to generate workout plan. Please try again.' });
    }
});
// POST /api/ai-coach/generate-meals
router.post('/generate-meals', auth_1.requireAuth, auth_1.aiLimiter, async (req, res) => {
    if (!req.user)
        return;
    const profile = storage_1.dbStore.getProfileByUserId(req.user.id);
    if (!profile) {
        res.status(400).json({ error: 'Please complete your fitness profile before requesting meal recommendations.' });
        return;
    }
    try {
        const result = await aiService_1.AIService.generateMealRecommendations(profile);
        res.json(result);
    }
    catch (error) {
        console.error('AI Meal generation error:', error);
        res.status(500).json({ error: 'Failed to generate meal recommendations. Please try again.' });
    }
});
// POST /api/ai-coach/chat
const chatSchema = zod_1.z.object({
    query: zod_1.z.string().min(2, 'Query must be at least 2 characters').max(500),
});
router.post('/chat', auth_1.requireAuth, auth_1.aiLimiter, async (req, res) => {
    if (!req.user)
        return;
    const parseResult = chatSchema.safeParse(req.body);
    if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.errors[0].message });
        return;
    }
    const { query } = parseResult.data;
    const profile = storage_1.dbStore.getProfileByUserId(req.user.id);
    try {
        const result = await aiService_1.AIService.chatCoach(query, profile);
        res.json(result);
    }
    catch (error) {
        console.error('AI Coach Chat error:', error);
        res.status(500).json({ error: 'Failed to process coach query. Please try again.' });
    }
});
exports.default = router;
