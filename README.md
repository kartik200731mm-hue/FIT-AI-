# Fit AI — AI-Powered Diet & Fitness Coach

Fit AI is a full-stack, AI-assisted diet and fitness companion designed to help students, working professionals, fitness beginners, and gym enthusiasts make measurable, sustainable progress toward personal fitness goals.

---

## 🌟 Key Features

1. **Secure Authentication & Data Isolation**
   - Real registration, login, logout, and token expiration handling.
   - Passwords hashed using `bcryptjs` with salt rounds.
   - JWT authentication tokens with user data isolation (users can only access their own records).

2. **Personalized Profile & Goal Calibration**
   - Multi-step onboarding collecting age, gender, height, weight, target goal weight, activity multiplier, diet style, and physical constraints/injuries.
   - Science-backed BMR (Mifflin-St Jeor) and TDEE calculation with goal-based macronutrient targets (protein, carbs, healthy fats, hydration).

3. **Workout Programs & Tracking**
   - Interactive weekly split routines (Push/Pull/Legs, Full Body, Conditioning).
   - Exercise cards with target muscle groups, sets, rep ranges, rest timers, form tips, and completion checkboxes.
   - Rest timer modal with countdown sound chime and quick presets (30s, 45s, 60s, 90s, 120s).
   - AI Workout Generator that respects user injury notes (e.g. knee/back limitations).

4. **Meal & Calorie Tracking**
   - Calorie budget meters with remaining daily allowance.
   - Meal slots (Breakfast, Lunch, Dinner, Snacks & Supplements).
   - 1-click logging from a library of common wholesome foods + custom food logging.
   - Clear "~Estimated" tags on all nutritional data.
   - AI Daily Meal Plan Generator with diet lifestyle support (Vegan, Keto, Halal, Vegetarian, Low-Carb, Omnivore).

5. **Progress & Contextual BMI**
   - Interactive SVG weight trend chart with data point tooltips.
   - Non-diagnostic BMI analyzer card with standard ranges, context, and clear athletic caveats.
   - Activity log and consecutive consistency streak counter.

6. **AI Coach Studio**
   - Conversational wellness coach with prompt suggestions.
   - Dual-mode architecture: connects to Google Gemini 1.5 Flash when `GEMINI_API_KEY` is provided, or seamlessly switches to an expert deterministic engine in demo mode.
   - Strict health and safety boundaries with non-prescriptive medical notices.

7. **Reminders & Achievements**
   - User-controlled habit schedules (Workout times, Hydration checks, Meal logs, Weigh-ins) with toggle controls.
   - Unlockable milestone badges with progress tracking.

8. **Settings & Privacy**
   - Profile recalibration.
   - Password updating with current password verification.
   - Obsidian Dark / Crisp Light theme toggle.
   - GDPR full data portability (one-click JSON export).
   - Complete account and record deletion with confirmation.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation
From the root repository directory, run:
```bash
npm run install:all
```
*(Or install dependencies in `backend/` and `frontend/` individually)*

### Configuration
Copy `.env.example` to `.env` in the root folder if you wish to configure optional keys:
```bash
# Server Port & Mode
PORT=5000
NODE_ENV=development

# Database (optional - defaults to persistent local storage if MongoDB is offline)
MONGODB_URI=mongodb://127.0.0.1:27017/fit_ai

# Security Secret
JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars_long
JWT_EXPIRES_IN=7d

# Google Gemini API Key (optional - falling back to Deterministic Expert Coach if empty)
GEMINI_API_KEY=
```

### Running the App
To run both backend and frontend development servers concurrently:
```bash
npm run dev
```

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **API Health Check**: `http://localhost:5000/api/health`

---

## 🔒 Security & Privacy Architecture

- **No Secrets on Client**: API keys and database connections live strictly on the Express backend.
- **Password Protection**: Plaintext passwords are never saved.
- **Rate Limiting**: Authentication endpoints (max 30 / 15m) and AI coach generation (max 20 / 1m) are protected by `express-rate-limit`.
- **Zero Camera/CV Tracking**: In strict compliance with guidelines, no webcam, camera permissions, OpenCV, or posture capture APIs are present in the codebase.
- **Non-Diagnostic Health Framing**: All BMI metrics and AI suggestions are framed as general educational wellness guidance with clear notices to consult healthcare professionals for medical conditions or injuries.
