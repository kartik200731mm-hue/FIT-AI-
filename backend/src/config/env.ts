import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

export function reloadEnv() {
  const possibleEnvPaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../../../.env'),
  ];

  for (const envPath of possibleEnvPaths) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, override: true });
    }
  }
}

reloadEnv();

export const ENV = {
  get PORT() {
    reloadEnv();
    return parseInt(process.env.PORT || '5000', 10);
  },
  get NODE_ENV() {
    return process.env.NODE_ENV || 'development';
  },
  get MONGODB_URI() {
    return process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fit_ai';
  },
  get JWT_SECRET() {
    return process.env.JWT_SECRET || 'fit_ai_super_secure_jwt_secret_change_in_production_2026_fitness';
  },
  get JWT_EXPIRES_IN() {
    return process.env.JWT_EXPIRES_IN || '7d';
  },
  get GEMINI_API_KEY() {
    reloadEnv();
    return process.env.GEMINI_API_KEY || '';
  },
  get CLIENT_ORIGIN() {
    return process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  },
};
