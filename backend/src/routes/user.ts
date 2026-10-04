import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { dbStore } from '../db/storage';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

// POST /api/user/change-password
router.post('/change-password', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) return;
  const parseResult = changePasswordSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.errors[0].message });
    return;
  }

  const { currentPassword, newPassword } = parseResult.data;
  const user = dbStore.getUserById(req.user.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    res.status(400).json({ error: 'Current password is incorrect' });
    return;
  }

  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(newPassword, salt);
  dbStore.saveUser(user);

  res.json({ message: 'Password updated successfully' });
});

// GET /api/user/export-data (GDPR / privacy portability)
router.get('/export-data', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) return;
  const data = dbStore.exportUserData(req.user.id);
  if (!data) {
    res.status(404).json({ error: 'Data not found' });
    return;
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="fit_ai_export_${req.user.id}.json"`);
  res.json(data);
});

// DELETE /api/user/delete-account
router.delete('/delete-account', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) return;
  dbStore.deleteUser(req.user.id);
  res.clearCookie('token');
  res.json({ message: 'Your account and all associated data have been permanently deleted.' });
});

export default router;
