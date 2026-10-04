import { Router, Response } from 'express';
import { dbStore } from '../db/storage';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/achievements
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) return;
  const achievements = dbStore.getAchievements(req.user.id);
  const unlockedCount = achievements.filter((a) => !!a.unlockedAt).length;
  res.json({
    achievements,
    unlockedCount,
    totalCount: achievements.length,
    percentage: Math.round((unlockedCount / achievements.length) * 100),
  });
});

// POST /api/achievements/unlock (manual or trigger verification)
router.post('/unlock', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) return;
  const { code } = req.body;
  if (!code) {
    res.status(400).json({ error: 'Achievement code is required' });
    return;
  }

  const result = dbStore.unlockAchievement(req.user.id, code);
  res.json({ achievement: result });
});

export default router;
