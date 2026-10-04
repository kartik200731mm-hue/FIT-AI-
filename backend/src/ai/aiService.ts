import { ENV } from '../config/env';
import { IUserProfile, IWorkoutPlan } from '../types';
import { DeterministicCoach } from './deterministicCoach';

export interface IAICoachResponse {
  source: 'gemini' | 'deterministic_expert';
  message: string;
  data?: any;
  medicalNotice: string;
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
      const prompt = `You are a certified fitness coach. Generate a structured ${daysPerWeek}-day weekly workout plan for:
- Goal: ${profile.fitnessGoal}
- Difficulty: ${difficulty}
- Physical limitations/injuries: ${profile.limitations || 'None'}
- Age: ${profile.age}, Weight: ${profile.weightKg}kg

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

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${ENV.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API returned status ${response.status}`);
      }

      const resJson = await response.json();
      const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty response from Gemini');

      const parsed = JSON.parse(rawText);
      const plan: IWorkoutPlan = {
        id: `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: profile.userId,
        title: parsed.title || `${difficulty} Custom Workout Plan`,
        goal: profile.fitnessGoal.replace('_', ' ').toUpperCase(),
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
      const prompt = `You are a sports nutritionist. Generate a 1-day meal recommendation for:
- Dietary preference: ${profile.dietaryPreference}
- Target Daily Calories: ${profile.dailyCalorieTarget || 2000} kcal
- Goal: ${profile.fitnessGoal}

Respond ONLY with a JSON object:
{
  "breakfast": [{"id": "b1", "name": "Meal name", "calories": 350, "protein": 25, "carbs": 40, "fat": 8, "portion": "Serving size", "isEstimated": true}],
  "lunch": [{"id": "l1", "name": "Meal name", "calories": 500, "protein": 40, "carbs": 50, "fat": 12, "portion": "Serving size", "isEstimated": true}],
  "dinner": [{"id": "d1", "name": "Meal name", "calories": 550, "protein": 45, "carbs": 50, "fat": 15, "portion": "Serving size", "isEstimated": true}],
  "snack": [{"id": "s1", "name": "Meal name", "calories": 200, "protein": 15, "carbs": 20, "fat": 5, "portion": "Serving size", "isEstimated": true}],
  "summary": {"totalCalories": 1600, "proteinGrams": 125, "carbsGrams": 160, "fatGrams": 40},
  "guidanceNotes": "Practical mindful eating tips"
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${ENV.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API returned status ${response.status}`);
      }

      const resJson = await response.json();
      const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = JSON.parse(rawText);

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
      const userContext = profile
        ? `User context: Goal=${profile.fitnessGoal}, Calories=${profile.dailyCalorieTarget}, Diet=${profile.dietaryPreference}, Constraints=${profile.limitations || 'None'}`
        : 'User context: Fitness enthusiast';

      const prompt = `You are Fit AI, a friendly, encouraging, science-backed fitness and nutrition coach.
${userContext}
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

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${ENV.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );

      if (!response.ok) throw new Error(`Gemini API error ${response.status}`);

      const resJson = await response.json();
      const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = JSON.parse(rawText);

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
}
