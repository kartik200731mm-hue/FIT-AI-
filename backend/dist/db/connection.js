"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("../config/env");
async function connectDB() {
    try {
        if (!env_1.ENV.MONGODB_URI) {
            console.log('ℹ️ No MONGODB_URI provided. Running in persistent embedded storage mode.');
            return false;
        }
        await mongoose_1.default.connect(env_1.ENV.MONGODB_URI, {
            serverSelectionTimeoutMS: 2500,
        });
        console.log('✅ Connected to MongoDB database successfully.');
        return true;
    }
    catch (error) {
        console.log('ℹ️ MongoDB connection not established or local service offline. Fit AI is running with persistent JSON-backed local database.');
        return false;
    }
}
