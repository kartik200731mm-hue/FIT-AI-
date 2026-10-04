"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const storage_1 = require("../db/storage");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/achievements
router.get('/', auth_1.requireAuth, (req, res) => {
    if (!req.user)
        return;
    const achievements = storage_1.dbStore.getAchievements(req.user.id);
    const unlockedCount = achievements.filter((a) => !!a.unlockedAt).length;
    res.json({
        achievements,
        unlockedCount,
        totalCount: achievements.length,
        percentage: Math.round((unlockedCount / achievements.length) * 100),
    });
});
// POST /api/achievements/unlock (manual or trigger verification)
router.post('/unlock', auth_1.requireAuth, (req, res) => {
    if (!req.user)
        return;
    const { code } = req.body;
    if (!code) {
        res.status(400).json({ error: 'Achievement code is required' });
        return;
    }
    const result = storage_1.dbStore.unlockAchievement(req.user.id, code);
    res.json({ achievement: result });
});
exports.default = router;
