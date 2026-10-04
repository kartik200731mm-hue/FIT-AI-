import { Router, Response } from 'express';
import { z } from 'zod';
import { dbStore } from '../db/storage';
import { requireAuth, AuthenticatedRequest, aiLimiter } from '../middleware/auth';
import { AIService } from '../ai/aiService';

const router = Router();

// GET /api/ai-coach/status
router.get('/status', requireAuth, (_req, res: Response): void => {
  const isLive = AIService.isLiveAiAvailable();
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
const generateWorkoutSchema = z.object({
  daysPerWeek: z.number().min(2).max(6).default(4),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  customFocus: z.string().optional(),
});

router.post('/generate-workout', requireAuth, aiLimiter, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) return;
  const profile = dbStore.getProfileByUserId(req.user.id);

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
    const result = await AIService.generateWorkoutPlan(profile, daysPerWeek, difficulty);
    res.json(result);
  } catch (error: any) {
    console.error('AI Workout plan generation error:', error);
    res.status(500).json({ error: 'Failed to generate workout plan. Please try again.' });
  }
});

// POST /api/ai-coach/generate-meals
router.post('/generate-meals', requireAuth, aiLimiter, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) return;
  const profile = dbStore.getProfileByUserId(req.user.id);

  if (!profile) {
    res.status(400).json({ error: 'Please complete your fitness profile before requesting meal recommendations.' });
    return;
  }

  try {
    const result = await AIService.generateMealRecommendations(profile);
    res.json(result);
  } catch (error: any) {
    console.error('AI Meal generation error:', error);
    res.status(500).json({ error: 'Failed to generate meal recommendations. Please try again.' });
  }
});

// POST /api/ai-coach/chat
const chatSchema = z.object({
  query: z.string().min(2, 'Query must be at least 2 characters').max(500),
});

router.post('/chat', requireAuth, aiLimiter, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) return;
  const parseResult = chatSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.errors[0].message });
    return;
  }

  const { query } = parseResult.data;
  const profile = dbStore.getProfileByUserId(req.user.id);

  try {
    const result = await AIService.chatCoach(query, profile);
    res.json(result);
  } catch (error: any) {
    console.error('AI Coach Chat error:', error);
    res.status(500).json({ error: 'Failed to process coach query. Please try again.' });
  }
});

export default router;
