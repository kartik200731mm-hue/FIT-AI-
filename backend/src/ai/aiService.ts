import { ENV } from '../config/env';
import { IUserProfile, IWorkoutPlan } from '../types';
import { DeterministicCoach } from './deterministicCoach';

function cleanAndParseJson(raw: string): any {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return JSON.parse(cleaned);
}

const CANDIDATE_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-flash-latest',
];

async function callGeminiCascade(prompt: string): Promise<string> {
  const key = ENV.GEMINI_API_KEY;
  if (!key) throw new Error('No API Key');

  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );

      if (response.ok) {
        const resJson = await response.json();
        const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) return rawText;
      } else {
        lastError = new Error(`Model ${model} returned HTTP ${response.status}`);
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('All candidate Gemini models failed');
}

export class AIService {
  static isLiveAiAvailable(): boolean {
    return !!(ENV.GEMINI_API_KEY && ENV.GEMINI_API_KEY.trim().length > 5);
  }

  static async generateWorkoutPlan(
    profile: IUserProfile,
    daysPerWeek = 4,
    difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
  ): Promise<{ plan: IWorkoutPlan; source: 'gemini' | 'deterministic_expert'; medicalNotice: string }> {
    const medicalNotice =
      'General wellness guidance only. Warm up before exercising. Consult a medical professional if you have preexisting conditions or injuries.';

    if (!this.isLiveAiAvailable()) {
      const plan = DeterministicCoach.generateWorkoutPlan(profile, daysPerWeek, difficulty);
      return { plan, source: 'deterministic_expert', medicalNotice };
    }

    try {
      const isMinorOrUnknown = !profile.age || profile.age < 18;
      const ageSafeguard = isMinorOrUnknown
        ? 'STRICT YOUTH SAFEGUARD: The user is a minor or youth. You MUST NOT prescribe calorie burning fatigue, cutting protocols, or body-composition pressure. Focus on enjoyable functional athletics, posture, bodyweight mastery, agility, and healthy recovery.'
        : '';

      const prompt = `You are a certified fitness coach. Generate a structured ${daysPerWeek}-day weekly workout plan for:
- Goal: ${isMinorOrUnknown ? 'general_health / youth development' : profile.fitnessGoal}
- Difficulty: ${difficulty}
- Physical limitations/injuries: ${profile.limitations || 'None'}
- Age: ${profile.age || 'Unknown'}, Weight: ${profile.weightKg}kg
${ageSafeguard}

Respond with ONLY a raw valid JSON object matching this schema:
{
  "title": "Short title",
  "difficulty": "${difficulty}",
  "daysPerWeek": ${daysPerWeek},
  "days": [
    {
      "dayId": "day-1",
      "dayName": "Day 1: Focus Name",
      "focus": "Target muscles",
      "exercises": [
        {
          "id": "ex-1",
          "name": "Exercise Name",
          "category": "strength",
          "targetMuscle": "Muscle group",
          "sets": 3,
          "reps": "8-12",
          "restSec": 60,
          "instructions": "Safe technique tip"
        }
      ]
    }
  ],
  "notes": "Safe recovery guidance"
}`;

      const rawText = await callGeminiCascade(prompt);
      const parsed = cleanAndParseJson(rawText);
      const plan: IWorkoutPlan = {
        id: `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: profile.userId,
        title: parsed.title || `${difficulty} Custom Workout Plan`,
        goal: (isMinorOrUnknown ? 'General Vitality & Movement' : profile.fitnessGoal.replace('_', ' ')).toUpperCase(),
        difficulty: difficulty,
        daysPerWeek: Array.isArray(parsed.days) ? parsed.days.length : daysPerWeek,
        days: parsed.days || [],
        notes: parsed.notes || 'Listen to your body and prioritize proper exercise form.',
        isAiGenerated: true,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return { plan, source: 'gemini', medicalNotice };
    } catch (err) {
      console.warn('Live Gemini request failed or timed out. Falling back to expert deterministic engine:', err);
      const plan = DeterministicCoach.generateWorkoutPlan(profile, daysPerWeek, difficulty);
      return { plan, source: 'deterministic_expert', medicalNotice };
    }
  }

  static async generateMealRecommendations(profile: IUserProfile): Promise<{
    recommendations: any;
    source: 'gemini' | 'deterministic_expert';
    medicalNotice: string;
  }> {
    const medicalNotice =
      'Nutritional estimates are guidelines and not medical or clinical prescriptions. Always eat according to your personal health needs and tolerances.';

    if (!this.isLiveAiAvailable()) {
      const recs = DeterministicCoach.generateDailyMealRecommendations(profile);
      return { recommendations: recs, source: 'deterministic_expert', medicalNotice };
    }

    try {
      const isMinorOrUnknown = !profile.age || profile.age < 18;
      const ageSafeguard = isMinorOrUnknown
        ? 'STRICT YOUTH SAFEGUARD: The user is a minor (under 18) or youth. You MUST NOT prescribe calorie deficits, low-carb cutting, fasting, or restrictive dieting. Prescribe wholesome, balanced, energizing meals supporting healthy growth and daily energy.'
        : '';

      const prompt = `You are a sports nutritionist. Generate a 1-day meal recommendation for:
- Dietary preference: ${profile.dietaryPreference}
- Target Daily Calories: ${profile.dailyCalorieTarget || 2000} kcal
- Goal: ${isMinorOrUnknown ? 'general_health / balanced youth nourishment' : profile.fitnessGoal}
${ageSafeguard}

Respond ONLY with a JSON object:
{
  "breakfast": [{"id": "b1", "name": "Meal name", "calories": 350, "protein": 25, "carbs": 40, "fat": 8, "portion": "Serving size", "isEstimated": true}],
  "lunch": [{"id": "l1", "name": "Meal name", "calories": 500, "protein": 40, "carbs": 50, "fat": 12, "portion": "Serving size", "isEstimated": true}],
  "dinner": [{"id": "d1", "name": "Meal name", "calories": 550, "protein": 45, "carbs": 50, "fat": 15, "portion": "Serving size", "isEstimated": true}],
  "snack": [{"id": "s1", "name": "Meal name", "calories": 200, "protein": 15, "carbs": 20, "fat": 5, "portion": "Serving size", "isEstimated": true}],
  "summary": {"totalCalories": 1600, "proteinGrams": 125, "carbsGrams": 160, "fatGrams": 40},
  "guidanceNotes": "Practical mindful eating tips"
}`;

      const rawText = await callGeminiCascade(prompt);
      const parsed = cleanAndParseJson(rawText);

      return { recommendations: parsed, source: 'gemini', medicalNotice };
    } catch (err) {
      console.warn('Gemini meal generation fallback to expert engine:', err);
      const recs = DeterministicCoach.generateDailyMealRecommendations(profile);
      return { recommendations: recs, source: 'deterministic_expert', medicalNotice };
    }
  }

  static async chatCoach(
    query: string,
    profile?: IUserProfile
  ): Promise<{ response: string; actionableTips: string[]; source: 'gemini' | 'deterministic_expert'; medicalNotice: string }> {
    const medicalNotice =
      'Fit AI provides general wellness and fitness educational information. It is not a substitute for professional medical advice, diagnosis, or treatment.';

    if (!this.isLiveAiAvailable()) {
      const fallback = DeterministicCoach.provideCoachAdvice(query, profile);
      return { ...fallback, source: 'deterministic_expert' };
    }

    try {
      const isMinorOrUnknown = !profile?.age || profile.age < 18;
      const youthInstruction = isMinorOrUnknown
        ? 'STRICT YOUTH SAFEGUARD: The user is a minor (under 18) or youth. You MUST NOT prescribe or advise calorie deficits, weight loss, fat cutting, fasting, or body-shaming comparisons. Emphasize joyful movement, balanced nutrient-dense meals, hydration, and restorative sleep.'
        : '';

      const userContext = profile
        ? `User context: Goal=${profile.fitnessGoal}, Calories=${profile.dailyCalorieTarget}, Diet=${profile.dietaryPreference}, Constraints=${profile.limitations || 'None'}, Age=${profile.age || 'Unknown'}`
        : 'User context: Fitness enthusiast';

      const prompt = `You are Fit AI, a friendly, encouraging, science-backed fitness and nutrition coach.
${userContext}
${youthInstruction}
User question: "${query}"

Guidelines:
- Give a supportive, non-shaming, practical answer (max 3 short paragraphs).
- Provide 2-3 specific bullet point actionable tips.
- Do not make medical diagnoses or prescribe treatment for injuries.
- Respond with a JSON object:
{
  "response": "Your main coaching response paragraph(s)",
  "actionableTips": ["Tip 1", "Tip 2", "Tip 3"]
}`;

      const rawText = await callGeminiCascade(prompt);
      const parsed = cleanAndParseJson(rawText);

      return {
        response: parsed.response || 'Stay consistent and focus on sustainable healthy habits!',
        actionableTips: parsed.actionableTips || ['Drink water', 'Prioritize recovery'],
        source: 'gemini',
        medicalNotice,
      };
    } catch (err) {
      console.warn('Gemini chat fallback to expert engine:', err);
      const fallback = DeterministicCoach.provideCoachAdvice(query, profile);
      return { ...fallback, source: 'deterministic_expert' };
    }
  }

  static async recommendHealthySwap(
    foodName: string,
    profile?: IUserProfile
  ): Promise<{ original: string; swap: string; benefit: string; estimatedMacros: string; source: 'gemini' | 'deterministic_expert' }> {
    if (!this.isLiveAiAvailable()) {
      return {
        original: foodName,
        swap: `High-Protein ${foodName} Alternative (e.g. Greek yogurt / Grilled protein / Lentils)`,
        benefit: 'Boosts protein synthesis and lowers saturated fat or refined sugar while preserving flavor.',
        estimatedMacros: '~220 kcal, 26g protein, 8g carbs, 4g fat',
        source: 'deterministic_expert',
      };
    }

    try {
      const prompt = `You are a sports dietitian. Suggest a healthier, high-protein or nutrient-dense alternative/swap for "${foodName}".
Dietary Preference: ${profile?.dietaryPreference || 'no restriction'}.
Goal: ${profile?.fitnessGoal || 'fitness'}.

Respond ONLY with raw JSON:
{
  "original": "${foodName}",
  "swap": "Alternative name and serving",
  "benefit": "Why this is healthier and aligns with goals (1-2 sentences)",
  "estimatedMacros": "e.g. 240 kcal, 28g protein, 14g carbs, 5g fat"
}`;

      const rawText = await callGeminiCascade(prompt);
      const parsed = cleanAndParseJson(rawText);
      return {
        original: foodName,
        swap: parsed.swap || `Nutrient-Dense ${foodName} Alternative`,
        benefit: parsed.benefit || 'Optimizes protein-to-calorie ratio and energy retention.',
        estimatedMacros: parsed.estimatedMacros || '~250 kcal, 25g protein',
        source: 'gemini',
      };
    } catch (err) {
      return {
        original: foodName,
        swap: `High-Protein ${foodName} Alternative`,
        benefit: 'Provides balanced satiety and supports lean body composition.',
        estimatedMacros: '~230 kcal, 24g protein',
        source: 'deterministic_expert',
      };
    }
  }
}
