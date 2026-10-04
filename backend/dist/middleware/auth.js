"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiLimiter = exports.authLimiter = void 0;
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_rate_limit_1 = require("express-rate-limit");
const env_1 = require("../config/env");
const storage_1 = require("../db/storage");
exports.authLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // Limit each IP to 30 auth requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts from this IP, please try again after 15 minutes.' },
});
exports.aiLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 AI prompts per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'AI request limit reached. Please wait a moment before sending more coaching queries.' },
});
function requireAuth(req, res, next) {
    try {
        let token;
        // Check Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
        else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }
        if (!token) {
            res.status(401).json({ error: 'Authentication required. Please sign in.' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, env_1.ENV.JWT_SECRET);
        const user = storage_1.dbStore.getUserById(decoded.id);
        if (!user) {
            res.status(401).json({ error: 'User session invalid or user no longer exists.' });
            return;
        }
        req.user = user;
        next();
    }
    catch (err) {
        if (err.name === 'TokenExpiredError') {
            res.status(401).json({ error: 'Session expired. Please sign in again.' });
            return;
        }
        res.status(401).json({ error: 'Invalid authentication token.' });
    }
}
