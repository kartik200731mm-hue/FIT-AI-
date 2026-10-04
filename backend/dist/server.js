"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const env_1 = require("./config/env");
const connection_1 = require("./db/connection");
const auth_1 = __importDefault(require("./routes/auth"));
const profile_1 = __importDefault(require("./routes/profile"));
const workouts_1 = __importDefault(require("./routes/workouts"));
const meals_1 = __importDefault(require("./routes/meals"));
const progress_1 = __importDefault(require("./routes/progress"));
const aiCoach_1 = __importDefault(require("./routes/aiCoach"));
const reminders_1 = __importDefault(require("./routes/reminders"));
const achievements_1 = __importDefault(require("./routes/achievements"));
const user_1 = __importDefault(require("./routes/user"));
const app = (0, express_1.default)();
// Security and utility middlewares
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // Allows flexible API usage in development
    crossOriginEmbedderPolicy: false,
}));
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow local frontend development origins
        if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
            callback(null, true);
        }
        else {
            callback(null, true);
        }
    },
    credentials: true,
}));
app.use(express_1.default.json({ limit: '2mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// Health check endpoint
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'healthy',
        app: 'Fit AI Backend API',
        timestamp: new Date().toISOString(),
    });
});
// API Routes
app.use('/api/auth', auth_1.default);
app.use('/api/profile', profile_1.default);
app.use('/api/workouts', workouts_1.default);
app.use('/api/meals', meals_1.default);
app.use('/api/progress', progress_1.default);
app.use('/api/ai-coach', aiCoach_1.default);
app.use('/api/reminders', reminders_1.default);
app.use('/api/achievements', achievements_1.default);
app.use('/api/user', user_1.default);
// 404 Handler
app.use('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});
// Global Error Handler
app.use((err, _req, res, _next) => {
    console.error('Unhandled server error:', err);
    const status = err.status || 500;
    const message = err.message || 'Internal server error occurred';
    res.status(status).json({
        error: env_1.ENV.NODE_ENV === 'production' ? 'An unexpected server error occurred.' : message,
    });
});
async function startServer() {
    await (0, connection_1.connectDB)();
    app.listen(env_1.ENV.PORT, () => {
        console.log(`🚀 Fit AI Backend running at http://localhost:${env_1.ENV.PORT}`);
        console.log(`🌿 Health check: http://localhost:${env_1.ENV.PORT}/api/health`);
    });
}
startServer();
