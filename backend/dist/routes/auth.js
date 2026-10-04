"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const storage_1 = require("../db/storage");
const env_1 = require("../config/env");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(50),
    email: zod_1.z.string().email('Please enter a valid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters').max(100),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Please enter a valid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
function createToken(user) {
    return jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, env_1.ENV.JWT_SECRET, { expiresIn: '7d' });
}
// POST /api/auth/register
router.post('/register', auth_1.authLimiter, async (req, res) => {
    try {
        const parseResult = registerSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({ error: parseResult.error.errors[0].message });
            return;
        }
        const { name, email, password } = parseResult.data;
        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = storage_1.dbStore.getUserByEmail(normalizedEmail);
        if (existingUser) {
            res.status(409).json({ error: 'An account with this email already exists.' });
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        const newUser = {
            id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            name: name.trim(),
            email: normalizedEmail,
            passwordHash,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
        };
        storage_1.dbStore.saveUser(newUser);
        // Initialize achievements & reminders
        storage_1.dbStore.getAchievements(newUser.id);
        storage_1.dbStore.getReminders(newUser.id);
        const token = createToken(newUser);
        res.cookie('token', token, {
            httpOnly: true,
            secure: env_1.ENV.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        const { passwordHash: _, ...safeUser } = newUser;
        res.status(201).json({
            message: 'Account created successfully',
            user: safeUser,
            token,
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration. Please try again.' });
    }
});
// POST /api/auth/login
router.post('/login', auth_1.authLimiter, async (req, res) => {
    try {
        const parseResult = loginSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({ error: parseResult.error.errors[0].message });
            return;
        }
        const { email, password } = parseResult.data;
        const normalizedEmail = email.toLowerCase().trim();
        const user = storage_1.dbStore.getUserByEmail(normalizedEmail);
        if (!user) {
            res.status(401).json({ error: 'Invalid email or password.' });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            res.status(401).json({ error: 'Invalid email or password.' });
            return;
        }
        user.lastLoginAt = new Date().toISOString();
        storage_1.dbStore.saveUser(user);
        const token = createToken(user);
        res.cookie('token', token, {
            httpOnly: true,
            secure: env_1.ENV.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        const { passwordHash: _, ...safeUser } = user;
        res.json({
            message: 'Signed in successfully',
            user: safeUser,
            token,
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login. Please try again.' });
    }
});
// GET /api/auth/me
router.get('/me', auth_1.requireAuth, (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
    }
    const { passwordHash: _, ...safeUser } = req.user;
    const profile = storage_1.dbStore.getProfileByUserId(req.user.id);
    res.json({
        user: safeUser,
        hasProfile: !!profile,
        profile: profile || null,
    });
});
// POST /api/auth/logout
router.post('/logout', (_req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Signed out successfully' });
});
exports.default = router;
