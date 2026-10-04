import { Router, Response } from 'express';
import { z } from 'zod';
import { dbStore } from '../db/storage';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { IReminder } from '../types';

const router = Router();

const reminderSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['workout', 'meal', 'hydration', 'weigh_in']),
  title: z.string().min(2).max(100),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format (24hr)'),
  daysOfWeek: z.array(z.number().min(0).max(6)).default([0, 1, 2, 3, 4, 5, 6]),
  enabled: z.boolean().default(true),
});

// GET /api/reminders
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) return;
  const reminders = dbStore.getReminders(req.user.id);
  res.json({ reminders });
});

// POST /api/reminders (create or update)
router.post('/', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) return;
  const parseResult = reminderSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.errors[0].message });
    return;
  }

  const data = parseResult.data;
  const reminder: IReminder = {
    id: data.id || `rem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: req.user.id,
    type: data.type,
    title: data.title,
    time: data.time,
    daysOfWeek: data.daysOfWeek,
    enabled: data.enabled,
  };

  const saved = dbStore.saveReminder(reminder);
  res.json({ message: 'Reminder saved', reminder: saved });
});

// PATCH /api/reminders/:id/toggle
router.patch('/:id/toggle', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) return;
  const { id } = req.params;
  const reminders = dbStore.getReminders(req.user.id);
  const item = reminders.find((r) => r.id === id);

  if (!item) {
    res.status(404).json({ error: 'Reminder not found' });
    return;
  }

  item.enabled = !item.enabled;
  dbStore.saveReminder(item);
  res.json({ message: 'Reminder status toggled', reminder: item });
});

// DELETE /api/reminders/:id
router.delete('/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) return;
  dbStore.deleteReminder(req.params.id, req.user.id);
  res.json({ message: 'Reminder deleted' });
});

export default router;
