import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env';
import { connectDB } from './db/connection';

import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import workoutRoutes from './routes/workouts';
import mealRoutes from './routes/meals';
import progressRoutes from './routes/progress';
import aiCoachRoutes from './routes/aiCoach';
import reminderRoutes from './routes/reminders';
import achievementRoutes from './routes/achievements';
import userRoutes from './routes/user';

const app = express();

// Security and utility middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible API usage in development
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow local frontend development origins
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check and root endpoint
app.get(['/', '/api'], (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    app: 'Fit AI Backend API',
    frontendApp: 'http://localhost:5173',
    version: '1.0.0',
    documentation: 'Open http://localhost:5173 in your browser to use the Fit AI web application.',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      profile: '/api/profile',
      workouts: '/api/workouts',
      meals: '/api/meals',
      progress: '/api/progress',
      aiCoach: '/api/ai-coach',
      reminders: '/api/reminders',
      achievements: '/api/achievements',
    },
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    app: 'Fit AI Backend API',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/ai-coach', aiCoachRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/user', userRoutes);

// 404 Handler
app.use('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal server error occurred';
  res.status(status).json({
    error: ENV.NODE_ENV === 'production' ? 'An unexpected server error occurred.' : message,
  });
});

async function startServer() {
  app.listen(ENV.PORT, () => {
    console.log(`🚀 Fit AI Backend running at http://localhost:${ENV.PORT}`);
    console.log(`🌿 Health check: http://localhost:${ENV.PORT}/api/health`);
    connectDB().catch(() => {});
  });
}

startServer();
