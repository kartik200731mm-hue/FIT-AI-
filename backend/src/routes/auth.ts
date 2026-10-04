import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { dbStore } from '../db/storage';
import { ENV } from '../config/env';
import { requireAuth, AuthenticatedRequest, authLimiter } from '../middleware/auth';
import { IUser } from '../types';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

function createToken(user: IUser): string {
  return jwt.sign(
    { id: user.id, email: user.email },
    ENV.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res: Response): Promise<void> => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    const { name, email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = dbStore.getUserByEmail(normalizedEmail);
    if (existingUser) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser: IUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    dbStore.saveUser(newUser);

    // Initialize achievements & reminders
    dbStore.getAchievements(newUser.id);
    dbStore.getReminders(newUser.id);

    const token = createToken(newUser);

    res.cookie('token', token, {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { passwordHash: _, ...safeUser } = newUser;
    res.status(201).json({
      message: 'Account created successfully',
      user: safeUser,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res: Response): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    const { email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = dbStore.getUserByEmail(normalizedEmail);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    user.lastLoginAt = new Date().toISOString();
    dbStore.saveUser(user);

    const token = createToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { passwordHash: _, ...safeUser } = user;
    res.json({
      message: 'Signed in successfully',
      user: safeUser,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { passwordHash: _, ...safeUser } = req.user;
  const profile = dbStore.getProfileByUserId(req.user.id);
  res.json({
    user: safeUser,
    hasProfile: !!profile,
    profile: profile || null,
  });
});

// POST /api/auth/logout
router.post('/logout', (_req, res: Response): void => {
  res.clearCookie('token');
  res.json({ message: 'Signed out successfully' });
});

export default router;
