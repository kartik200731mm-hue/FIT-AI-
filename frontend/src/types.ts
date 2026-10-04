export interface IUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface IUserProfile {
  userId: string;
  age: number;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
  fitnessGoal: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'endurance' | 'general_health';
  dietaryPreference: 'no_restriction' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo' | 'halal' | 'kosher' | 'low_carb';
  limitations: string;
  dailyCalorieTarget: number;
  dailyProteinTarget: number;
  dailyCarbsTarget: number;
  dailyFatTarget: number;
  waterTargetMl: number;
  bmi: number;
  bmiCategory: string;
  updatedAt: string;
}

export interface IBmiResult {
  bmi: number;
  category: 'Underweight' | 'Normal weight' | 'Overweight' | 'Obesity class I' | 'Obesity class II+' | 'Youth Growth Reference';
  color: string;
  context: string;
  healthyWeightRangeKg: { min: number; max: number };
}

export interface IExercise {
  id: string;
  name: string;
  category: 'strength' | 'cardio' | 'flexibility' | 'hiit' | 'core';
  targetMuscle: string;
  sets: number;
  reps: string;
  restSec: number;
  instructions: string;
  completed?: boolean;
}

export interface IWorkoutDay {
  dayId: string;
  dayName: string;
  focus: string;
  exercises: IExercise[];
  completed?: boolean;
}

export interface IWorkoutPlan {
  id: string;
  userId: string;
  title: string;
  goal: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  daysPerWeek: number;
  days: IWorkoutDay[];
  notes?: string;
  isAiGenerated: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IMealItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
  isEstimated: boolean;
}

export interface IMealLog {
  id: string;
  userId: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  items: IMealItem[];
  notes?: string;
  loggedAt: string;
}

export interface IMealSummary {
  consumed: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  targets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  remainingCalories: number;
}

export interface IWeightEntry {
  id: string;
  userId: string;
  date: string;
  weightKg: number;
  bmi: number;
  notes?: string;
  createdAt: string;
}

export interface IActivityLog {
  id: string;
  userId: string;
  date: string;
  steps: number;
  activeMinutes: number;
  waterMl: number;
  workoutCompleted: boolean;
  notes?: string;
}

export interface IReminder {
  id: string;
  userId: string;
  type: 'workout' | 'meal' | 'hydration' | 'weigh_in';
  title: string;
  time: string;
  daysOfWeek: number[];
  enabled: boolean;
}

export interface IAchievement {
  id: string;
  userId: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
  progress: number;
  maxProgress: number;
  category: 'workout' | 'nutrition' | 'streak' | 'profile';
}
