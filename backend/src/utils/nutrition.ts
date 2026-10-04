export interface IBmiResult {
  bmi: number;
  category: 'Underweight' | 'Normal weight' | 'Overweight' | 'Obesity class I' | 'Obesity class II+' | 'Youth Growth Reference';
  color: string;
  context: string;
  healthyWeightRangeKg: { min: number; max: number };
}

export function calculateBMI(weightKg: number, heightCm: number, age?: number): IBmiResult {
  const heightM = heightCm / 100;
  const rawBmi = weightKg / (heightM * heightM);
  const bmi = Math.round(rawBmi * 10) / 10;

  const minHealthyWeight = Math.round(18.5 * heightM * heightM * 10) / 10;
  const maxHealthyWeight = Math.round(24.9 * heightM * heightM * 10) / 10;

  // AGE-AWARE SAFEGUARD: Adult BMI scales are not diagnostic or clinically valid for individuals under 18
  if (age !== undefined && age < 18) {
    return {
      bmi,
      category: 'Youth Growth Reference',
      color: '#10b981',
      context: 'Adult BMI categorization scales do not apply to youth under 18. Healthy development, hydration, balanced meals, and regular enjoyable movement take precedence over weight indices.',
      healthyWeightRangeKg: { min: minHealthyWeight, max: maxHealthyWeight },
    };
  }

  let category: IBmiResult['category'] = 'Normal weight';
  let color = '#10b981'; // vibrant emerald
  let context = 'Your weight sits within the standard population range for your height.';

  if (bmi < 18.5) {
    category = 'Underweight';
    color = '#38bdf8'; // energetic sky
    context = 'Below standard range. Focus on nutrient-dense meals and progressive strength training.';
  } else if (bmi >= 18.5 && bmi < 25) {
    category = 'Normal weight';
    color = '#10b981'; // emerald
    context = 'Standard reference range. Maintain balanced activity and wholesome nutrition.';
  } else if (bmi >= 25 && bmi < 30) {
    category = 'Overweight';
    color = '#f59e0b'; // amber
    context = 'Slightly elevated relative to height. A gentle calorie deficit and consistent daily steps will bring progress.';
  } else if (bmi >= 30 && bmi < 35) {
    category = 'Obesity class I';
    color = '#f97316'; // orange
    context = 'Elevated index. Sustainable habit shifts in portion control and daily movement offer major energy gains.';
  } else {
    category = 'Obesity class II+';
    color = '#ef4444'; // coral red
    context = 'Significantly elevated index. Consider consulting a healthcare provider or registered dietitian for customized support.';
  }

  return {
    bmi,
    category,
    color,
    context,
    healthyWeightRangeKg: { min: minHealthyWeight, max: maxHealthyWeight },
  };
}

export interface ICaloricNeeds {
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  waterMl: number;
  isMinorSafeAdjusted?: boolean;
}

export function calculateCaloricAndMacroTargets(params: {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
  fitnessGoal: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'endurance' | 'general_health';
}): ICaloricNeeds {
  const { weightKg, heightCm, age, gender, activityLevel, fitnessGoal } = params;
  const isMinor = age < 18;

  // Mifflin-St Jeor Equation
  let bmr: number;
  if (gender === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else if (gender === 'female') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  } else {
    // Average baseline
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 78;
  }

  // Activity Multipliers
  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2, // Little or no exercise
    lightly_active: 1.375, // Light exercise 1-3 days/week
    moderately_active: 1.55, // Moderate exercise 3-5 days/week
    very_active: 1.725, // Hard exercise 6-7 days/week
    extra_active: 1.9, // Very hard exercise / physical job
  };

  const multiplier = activityMultipliers[activityLevel] || 1.375;
  const tdee = Math.round(bmr * multiplier);

  // Goal-based Caloric Adjustment
  let targetCalories = tdee;
  let proteinRatio = 0.25;
  let carbsRatio = 0.50;
  let fatRatio = 0.25;
  let isMinorSafeAdjusted = false;

  // AGE-AWARE SAFEGUARD: Users under 18 must NEVER be assigned a calorie deficit or weight-loss diet
  if (isMinor && fitnessGoal === 'weight_loss') {
    targetCalories = tdee; // Enforce maintenance/growth baseline
    proteinRatio = 0.25;
    carbsRatio = 0.50;
    fatRatio = 0.25;
    isMinorSafeAdjusted = true;
  } else {
    switch (fitnessGoal) {
      case 'weight_loss':
        targetCalories = Math.max(1300, Math.round(tdee * 0.82)); // 18% gentle deficit for adults only
        proteinRatio = 0.32;
        carbsRatio = 0.40;
        fatRatio = 0.28;
        break;
      case 'muscle_gain':
        targetCalories = Math.round(tdee * 1.12); // 12% slight surplus
        proteinRatio = 0.30;
        carbsRatio = 0.48;
        fatRatio = 0.22;
        break;
      case 'endurance':
        targetCalories = Math.round(tdee * 1.05);
        proteinRatio = 0.22;
        carbsRatio = 0.58;
        fatRatio = 0.20;
        break;
      case 'maintenance':
      case 'general_health':
      default:
        targetCalories = tdee;
        proteinRatio = 0.25;
        carbsRatio = 0.50;
        fatRatio = 0.25;
        break;
    }
  }

  // Protein = 4 kcal/g, Carbs = 4 kcal/g, Fat = 9 kcal/g
  const proteinGrams = Math.round((targetCalories * proteinRatio) / 4);
  const carbsGrams = Math.round((targetCalories * carbsRatio) / 4);
  const fatGrams = Math.round((targetCalories * fatRatio) / 9);

  // Hydration baseline: 35ml per kg of body weight
  const waterMl = Math.max(2000, Math.round(weightKg * 35));

  return {
    bmr: Math.round(bmr),
    tdee,
    targetCalories,
    proteinGrams,
    carbsGrams,
    fatGrams,
    waterMl,
    isMinorSafeAdjusted,
  };
}
