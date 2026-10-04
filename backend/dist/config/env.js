"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
exports.ENV = {
    PORT: parseInt(process.env.PORT || '5000', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fit_ai',
    JWT_SECRET: process.env.JWT_SECRET || 'fit_ai_super_secure_jwt_secret_change_in_production_2026_fitness',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
};
