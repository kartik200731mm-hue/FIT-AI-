"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const storage_1 = require("../db/storage");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const reminderSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    type: zod_1.z.enum(['workout', 'meal', 'hydration', 'weigh_in']),
    title: zod_1.z.string().min(2).max(100),
    time: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format (24hr)'),
    daysOfWeek: zod_1.z.array(zod_1.z.number().min(0).max(6)).default([0, 1, 2, 3, 4, 5, 6]),
    enabled: zod_1.z.boolean().default(true),
});
// GET /api/reminders
router.get('/', auth_1.requireAuth, (req, res) => {
    if (!req.user)
        return;
    const reminders = storage_1.dbStore.getReminders(req.user.id);
    res.json({ reminders });
});
// POST /api/reminders (create or update)
router.post('/', auth_1.requireAuth, (req, res) => {
    if (!req.user)
        return;
    const parseResult = reminderSchema.safeParse(req.body);
    if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.errors[0].message });
        return;
    }
    const data = parseResult.data;
    const reminder = {
        id: data.id || `rem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: req.user.id,
        type: data.type,
        title: data.title,
        time: data.time,
        daysOfWeek: data.daysOfWeek,
        enabled: data.enabled,
    };
    const saved = storage_1.dbStore.saveReminder(reminder);
    res.json({ message: 'Reminder saved', reminder: saved });
});
// PATCH /api/reminders/:id/toggle
router.patch('/:id/toggle', auth_1.requireAuth, (req, res) => {
    if (!req.user)
        return;
    const { id } = req.params;
    const reminders = storage_1.dbStore.getReminders(req.user.id);
    const item = reminders.find((r) => r.id === id);
    if (!item) {
        res.status(404).json({ error: 'Reminder not found' });
        return;
    }
    item.enabled = !item.enabled;
    storage_1.dbStore.saveReminder(item);
    res.json({ message: 'Reminder status toggled', reminder: item });
});
// DELETE /api/reminders/:id
router.delete('/:id', auth_1.requireAuth, (req, res) => {
    if (!req.user)
        return;
    storage_1.dbStore.deleteReminder(req.params.id, req.user.id);
    res.json({ message: 'Reminder deleted' });
});
exports.default = router;
