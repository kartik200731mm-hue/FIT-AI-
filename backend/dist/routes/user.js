"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const storage_1 = require("../db/storage");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: zod_1.z.string().min(6, 'New password must be at least 6 characters'),
});
// POST /api/user/change-password
router.post('/change-password', auth_1.requireAuth, async (req, res) => {
    if (!req.user)
        return;
    const parseResult = changePasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.errors[0].message });
        return;
    }
    const { currentPassword, newPassword } = parseResult.data;
    const user = storage_1.dbStore.getUserById(req.user.id);
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    const isMatch = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
        res.status(400).json({ error: 'Current password is incorrect' });
        return;
    }
    const salt = await bcryptjs_1.default.genSalt(10);
    user.passwordHash = await bcryptjs_1.default.hash(newPassword, salt);
    storage_1.dbStore.saveUser(user);
    res.json({ message: 'Password updated successfully' });
});
// GET /api/user/export-data (GDPR / privacy portability)
router.get('/export-data', auth_1.requireAuth, (req, res) => {
    if (!req.user)
        return;
    const data = storage_1.dbStore.exportUserData(req.user.id);
    if (!data) {
        res.status(404).json({ error: 'Data not found' });
        return;
    }
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="fit_ai_export_${req.user.id}.json"`);
    res.json(data);
});
// DELETE /api/user/delete-account
router.delete('/delete-account', auth_1.requireAuth, (req, res) => {
    if (!req.user)
        return;
    storage_1.dbStore.deleteUser(req.user.id);
    res.clearCookie('token');
    res.json({ message: 'Your account and all associated data have been permanently deleted.' });
});
exports.default = router;
