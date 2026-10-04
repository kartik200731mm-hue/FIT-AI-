"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeterministicCoach = void 0;
class DeterministicCoach {
    static generateWorkoutPlan(profile, daysPerWeek = 4, difficulty = 'beginner') {
        const goal = profile.fitnessGoal;
        const limitations = (profile.limitations || '').toLowerCase();
        const hasKneeIssues = limitations.includes('knee') || limitations.includes('joint');
        const hasBackIssues = limitations.includes('back') || limitations.includes('spine');
        const hasShoulderIssues = limitations.includes('shoulder');
        let title = 'Balanced Full-Body & Conditioning Routine';
        let days = [];
        if (daysPerWeek <= 3) {
            title = `${difficulty.toUpperCase()} 3-Day Full Body Circuit`;
            days = [
                {
                    dayId: 'day-1',
                    dayName: 'Day 1: Full Body Foundation A',
                    focus: 'Chest, Quads, Back & Core',
                    completed: false,
                    exercises: [
                        {
                            id: 'ex-101',
                            name: hasKneeIssues ? 'Glute Bridges / Hip Thrusts' : 'Goblet Squats',
                            category: 'strength',
                            targetMuscle: hasKneeIssues ? 'Glutes & Hamstrings' : 'Quadriceps & Core',
                            sets: 3,
                            reps: '10-12',
                            restSec: 60,
                            instructions: hasKneeIssues
                                ? 'Lie on back, drive through heels to lift hips, squeeze glutes at the top. Safe for knees.'
                                : 'Hold a light dumbbell or kettlebell against chest. Keep chest tall and squat to parallel.',
                        },
                        {
                            id: 'ex-102',
                            name: hasShoulderIssues ? 'Incline Push-Ups / Neutral Grip Press' : 'Dumbbell Bench Press',
                            category: 'strength',
                            targetMuscle: 'Chest & Triceps',
                            sets: 3,
                            reps: '8-12',
                            restSec: 60,
                            instructions: 'Control the descent for 2 seconds, press up smoothly without locking elbows harshly.',
                        },
                        {
                            id: 'ex-103',
                            name: hasBackIssues ? 'Chest-Supported Row' : 'Single-Arm Dumbbell Row',
                            category: 'strength',
                            targetMuscle: 'Upper Back & Lats',
                            sets: 3,
                            reps: '10-12 / side',
                            restSec: 60,
                            instructions: 'Support torso to protect lower spine. Pull dumbbell towards hip, squeezing shoulder blades.',
                        },
                        {
                            id: 'ex-104',
                            name: 'Dead Bug / Modified Plank',
                            category: 'core',
                            targetMuscle: 'Deep Core & Transverse Abdominis',
                            sets: 3,
                            reps: '10 per side / 30s',
                            restSec: 45,
                            instructions: 'Press lower back into floor, extend opposite arm and leg while maintaining spinal alignment.',
                        },
                    ],
                },
                {
                    dayId: 'day-2',
                    dayName: 'Day 2: Full Body Foundation B',
                    focus: 'Hamstrings, Shoulders, Lats & Stability',
                    completed: false,
                    exercises: [
                        {
                            id: 'ex-105',
                            name: 'Romanian Deadlift (Dumbbells)',
                            category: 'strength',
                            targetMuscle: 'Hamstrings & Glutes',
                            sets: 3,
                            reps: '10-12',
                            restSec: 60,
                            instructions: 'Hinge at the hips, keeping a neutral spine and soft knees. Feel stretch in hamstrings.',
                        },
                        {
                            id: 'ex-106',
                            name: hasShoulderIssues ? 'Lateral Raises (Light Resistance)' : 'Dumbbell Overhead Press',
                            category: 'strength',
                            targetMuscle: 'Deltoids & Shoulders',
                            sets: 3,
                            reps: '10-12',
                            restSec: 60,
                            instructions: 'Maintain engaged core, press upward with controlled tempo.',
                        },
                        {
                            id: 'ex-107',
                            name: 'Lat Pulldown or Band Assisted Pull-ups',
                            category: 'strength',
                            targetMuscle: 'Latissimus Dorsi',
                            sets: 3,
                            reps: '8-10',
                            restSec: 60,
                            instructions: 'Drive elbows down to ribs, engage lats at full contraction.',
                        },
                        {
                            id: 'ex-108',
                            name: 'Farmer Walk / Loaded Carry',
                            category: 'core',
                            targetMuscle: 'Grip, Core & Traps',
                            sets: 3,
                            reps: '40 paces',
                            restSec: 60,
                            instructions: 'Hold weights at sides, walk tall with shoulders retracted and braced core.',
                        },
                    ],
                },
                {
                    dayId: 'day-3',
                    dayName: 'Day 3: Conditioning & Dynamic Core',
                    focus: 'Metabolic Conditioning & Mobility',
                    completed: false,
                    exercises: [
                        {
                            id: 'ex-109',
                            name: hasKneeIssues ? 'Incline Walking or Low-Impact Rowing' : 'Kettlebell Swings / Jump Rope',
                            category: 'hiit',
                            targetMuscle: 'Cardiovascular System',
                            sets: 4,
                            reps: '45 sec work / 45 sec rest',
                            restSec: 45,
                            instructions: 'Maintain rhythmic breathing, avoid joint jarring.',
                        },
                        {
                            id: 'ex-110',
                            name: 'Side Plank Rotations',
                            category: 'core',
                            targetMuscle: 'Obliques & Shoulder Stability',
                            sets: 3,
                            reps: '8 per side',
                            restSec: 45,
                            instructions: 'Elevate on forearm, keep hips stacked and rotate torso with control.',
                        },
                        {
                            id: 'ex-111',
                            name: 'Bird-Dog Contractions',
                            category: 'flexibility',
                            targetMuscle: 'Erector Spinae & Glutes',
                            sets: 3,
                            reps: '10 per side',
                            restSec: 30,
                            instructions: 'Reach arm forward and opposite leg backward on all fours with zero spinal twist.',
                        },
                    ],
                },
            ];
        }
        else {
            title = `${difficulty.toUpperCase()} 4-Day Push / Pull / Legs Split`;
            days = [
                {
                    dayId: 'day-1',
                    dayName: 'Day 1: Upper Body Push',
                    focus: 'Chest, Front Shoulders & Triceps',
                    completed: false,
                    exercises: [
                        {
                            id: 'ex-201',
                            name: 'Incline Dumbbell Press',
                            category: 'strength',
                            targetMuscle: 'Upper Chest & Front Delts',
                            sets: 4,
                            reps: '8-12',
                            restSec: 75,
                            instructions: 'Set bench to 30 degrees. Lower weights under control for maximum stretch.',
                        },
                        {
                            id: 'ex-202',
                            name: hasShoulderIssues ? 'Neutral Grip Floor Press' : 'Dumbbell Shoulder Press',
                            category: 'strength',
                            targetMuscle: 'Shoulders & Triceps',
                            sets: 3,
                            reps: '10-12',
                            restSec: 60,
                            instructions: 'Keep core tight, press without arching lower back.',
                        },
                        {
                            id: 'ex-203',
                            name: 'Cable / Band Chest Flyes',
                            category: 'strength',
                            targetMuscle: 'Pectorals',
                            sets: 3,
                            reps: '12-15',
                            restSec: 60,
                            instructions: 'Focus on full horizontal adduction and peak contraction.',
                        },
                        {
                            id: 'ex-204',
                            name: 'Tricep Rope Pushdowns',
                            category: 'strength',
                            targetMuscle: 'Triceps',
                            sets: 3,
                            reps: '12-15',
                            restSec: 45,
                            instructions: 'Keep elbows tucked tightly at sides and flare rope at the bottom.',
                        },
                    ],
                },
                {
                    dayId: 'day-2',
                    dayName: 'Day 2: Upper Body Pull',
                    focus: 'Lats, Upper Back, Rear Delts & Biceps',
                    completed: false,
                    exercises: [
                        {
                            id: 'ex-205',
                            name: 'Seated Cable Row / Dumbbell Rows',
                            category: 'strength',
                            targetMuscle: 'Mid Back & Rhomboids',
                            sets: 4,
                            reps: '10-12',
                            restSec: 60,
                            instructions: 'Pull handle into lower abdomen, pause for 1s squeeze.',
                        },
                        {
                            id: 'ex-206',
                            name: 'Lat Pulldown / Neutral Grip Pulldowns',
                            category: 'strength',
                            targetMuscle: 'Lats',
                            sets: 3,
                            reps: '10-12',
                            restSec: 60,
                            instructions: 'Keep chest high, pull elbows toward back pockets.',
                        },
                        {
                            id: 'ex-207',
                            name: 'Face Pulls with External Rotation',
                            category: 'strength',
                            targetMuscle: 'Rear Delts & Rotator Cuff',
                            sets: 3,
                            reps: '15',
                            restSec: 45,
                            instructions: 'Crucial for shoulder posture health. Pull rope to forehead level and rotate knuckles back.',
                        },
                        {
                            id: 'ex-208',
                            name: 'Incline Dumbbell Bicep Curls',
                            category: 'strength',
                            targetMuscle: 'Biceps Brachii',
                            sets: 3,
                            reps: '10-12',
                            restSec: 45,
                            instructions: 'Full stretch at bottom, curl without swinging shoulders.',
                        },
                    ],
                },
                {
                    dayId: 'day-3',
                    dayName: 'Day 3: Lower Body & Core',
                    focus: 'Quads, Glutes, Hamstrings & Abs',
                    completed: false,
                    exercises: [
                        {
                            id: 'ex-209',
                            name: hasKneeIssues ? 'Step-Ups (Low Platform) / Hip Thrusts' : 'Bulgarian Split Squats / Goblet Squats',
                            category: 'strength',
                            targetMuscle: 'Quadriceps & Glutes',
                            sets: 3,
                            reps: '10 / leg',
                            restSec: 75,
                            instructions: 'Balance carefully, focus force through lead heel.',
                        },
                        {
                            id: 'ex-210',
                            name: 'Dumbbell Romanian Deadlifts',
                            category: 'strength',
                            targetMuscle: 'Hamstrings & Posterior Chain',
                            sets: 3,
                            reps: '10-12',
                            restSec: 60,
                            instructions: 'Hinge hips backward, keep dumbbells skimming shins.',
                        },
                        {
                            id: 'ex-211',
                            name: 'Standing Calf Raises',
                            category: 'strength',
                            targetMuscle: 'Calves',
                            sets: 3,
                            reps: '15-20',
                            restSec: 45,
                            instructions: 'Pause at bottom for 2s stretch, rise onto balls of feet.',
                        },
                        {
                            id: 'ex-212',
                            name: 'Hanging / Lying Leg Raises',
                            category: 'core',
                            targetMuscle: 'Lower Abs & Hip Flexors',
                            sets: 3,
                            reps: '12-15',
                            restSec: 45,
                            instructions: 'Curl pelvis upward without excessive momentum.',
                        },
                    ],
                },
                {
                    dayId: 'day-4',
                    dayName: 'Day 4: Athletic Conditioning & Active Recovery',
                    focus: 'Cardio Engine, Core & Mobility',
                    completed: false,
                    exercises: [
                        {
                            id: 'ex-213',
                            name: 'Zone 2 Steady-State Cardio (Bike / Brisk Walk)',
                            category: 'cardio',
                            targetMuscle: 'Cardiovascular System & Recovery',
                            sets: 1,
                            reps: '25-35 mins',
                            restSec: 0,
                            instructions: 'Maintain a pace where you can converse comfortably (60-70% max heart rate).',
                        },
                        {
                            id: 'ex-214',
                            name: 'Plank Hold with Shoulder Taps',
                            category: 'core',
                            targetMuscle: 'Anti-Rotational Core',
                            sets: 3,
                            reps: '12 taps / side',
                            restSec: 45,
                            instructions: 'Widen foot stance, touch opposite shoulder without rocking hips.',
                        },
                        {
                            id: 'ex-215',
                            name: "World's Greatest Stretch & Hip Openers",
                            category: 'flexibility',
                            targetMuscle: 'Thoracic Spine, Hip Flexors & Hamstrings',
                            sets: 2,
                            reps: '5 per side',
                            restSec: 30,
                            instructions: 'Lunge forward, place elbow inside ankle, rotate chest to the ceiling.',
                        },
                    ],
                },
            ];
        }
        return {
            id: `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            userId: profile.userId,
            title,
            goal: goal.replace('_', ' ').toUpperCase(),
            difficulty,
            daysPerWeek: days.length,
            days,
            notes: limitations
                ? `Customized to protect physical constraints: "${limitations}". Warm up thoroughly before starting.`
                : 'Tailored for balanced muscular development and progressive overload. Aim for 7-8 hours of restful sleep for recovery.',
            isAiGenerated: true,
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }
    static generateDailyMealRecommendations(profile) {
        const diet = profile.dietaryPreference;
        const targetCalories = profile.dailyCalorieTarget || 2000;
        let breakfast = [];
        let lunch = [];
        let dinner = [];
        let snack = [];
        if (diet === 'vegan' || diet === 'vegetarian') {
            breakfast = [
                {
                    id: 'mi-1',
                    name: 'Protein Oatmeal with Chia & Berries',
                    calories: 380,
                    protein: 22,
                    carbs: 54,
                    fat: 8,
                    portion: '1 bowl (60g oats + scoop plant protein)',
                    isEstimated: true,
                },
                {
                    id: 'mi-2',
                    name: 'Green Tea or Black Coffee with Almond Milk',
                    calories: 25,
                    protein: 1,
                    carbs: 2,
                    fat: 1,
                    portion: '1 cup (250ml)',
                    isEstimated: true,
                },
            ];
            lunch = [
                {
                    id: 'mi-3',
                    name: 'Mediterranean Chickpea & Quinoa Nourish Bowl',
                    calories: 520,
                    protein: 24,
                    carbs: 72,
                    fat: 16,
                    portion: '1 large bowl (150g cooked quinoa + 100g chickpeas + tahini)',
                    isEstimated: true,
                },
                {
                    id: 'mi-4',
                    name: 'Crisp Garden Salad with Olive Oil & Lemon',
                    calories: 110,
                    protein: 2,
                    carbs: 6,
                    fat: 9,
                    portion: '1 side bowl',
                    isEstimated: true,
                },
            ];
            dinner = [
                {
                    id: 'mi-5',
                    name: 'Tofu & Vegetable Stir-Fry with Brown Rice',
                    calories: 540,
                    protein: 30,
                    carbs: 65,
                    fat: 16,
                    portion: '1 plate (200g firm tofu + veggies + 1 cup rice)',
                    isEstimated: true,
                },
            ];
            snack = [
                {
                    id: 'mi-6',
                    name: 'Roasted Almonds & Apple Slices with Peanut Butter',
                    calories: 260,
                    protein: 8,
                    carbs: 24,
                    fat: 16,
                    portion: '1 medium apple + 1 tbsp peanut butter',
                    isEstimated: true,
                },
            ];
        }
        else if (diet === 'keto' || diet === 'low_carb') {
            breakfast = [
                {
                    id: 'mi-7',
                    name: '3-Egg Scramble with Avocado & Spinach',
                    calories: 420,
                    protein: 24,
                    carbs: 6,
                    fat: 34,
                    portion: '3 whole eggs + 1/2 avocado + sautéed spinach',
                    isEstimated: true,
                },
            ];
            lunch = [
                {
                    id: 'mi-8',
                    name: 'Grilled Herb Chicken Breast & Caesar Salad (No Croutons)',
                    calories: 530,
                    protein: 48,
                    carbs: 5,
                    fat: 36,
                    portion: '200g chicken breast + romaine + parmesan dressing',
                    isEstimated: true,
                },
            ];
            dinner = [
                {
                    id: 'mi-9',
                    name: 'Pan-Seared Salmon Fillet with Asparagus & Garlic Butter',
                    calories: 580,
                    protein: 42,
                    carbs: 8,
                    fat: 42,
                    portion: '200g Atlantic salmon + 150g asparagus',
                    isEstimated: true,
                },
            ];
            snack = [
                {
                    id: 'mi-10',
                    name: 'Macadamia Nuts & String Cheese',
                    calories: 240,
                    protein: 8,
                    carbs: 4,
                    fat: 22,
                    portion: '30g nuts + 1 mozzarella stick',
                    isEstimated: true,
                },
            ];
        }
        else {
            // Balanced Omnivore / Standard
            breakfast = [
                {
                    id: 'mi-11',
                    name: 'Greek Yogurt Parfait with Mixed Berries & Honey',
                    calories: 360,
                    protein: 26,
                    carbs: 44,
                    fat: 6,
                    portion: '200g 0% Greek Yogurt + 80g berries + 1 tbsp honey',
                    isEstimated: true,
                },
                {
                    id: 'mi-12',
                    name: 'Whole Grain Toast with 2 Poached Eggs',
                    calories: 250,
                    protein: 15,
                    carbs: 18,
                    fat: 12,
                    portion: '1 slice seeded bread + 2 eggs',
                    isEstimated: true,
                },
            ];
            lunch = [
                {
                    id: 'mi-13',
                    name: 'Grilled Chicken, Sweet Potato & Steamed Broccoli',
                    calories: 520,
                    protein: 44,
                    carbs: 55,
                    fat: 12,
                    portion: '180g chicken + 150g sweet potato + 100g broccoli',
                    isEstimated: true,
                },
            ];
            dinner = [
                {
                    id: 'mi-14',
                    name: 'Baked White Fish (Cod/Tilapia) with Brown Rice & Zucchini',
                    calories: 480,
                    protein: 38,
                    carbs: 52,
                    fat: 10,
                    portion: '200g fish + 1 cup cooked rice + grilled zucchini',
                    isEstimated: true,
                },
            ];
            snack = [
                {
                    id: 'mi-15',
                    name: 'Whey / Plant Protein Shake with a Banana',
                    calories: 230,
                    protein: 25,
                    carbs: 28,
                    fat: 2,
                    portion: '1 scoop protein in water + 1 banana',
                    isEstimated: true,
                },
            ];
        }
        const allItems = [...breakfast, ...lunch, ...dinner, ...snack];
        const totalCalories = allItems.reduce((acc, i) => acc + i.calories, 0);
        const proteinGrams = allItems.reduce((acc, i) => acc + i.protein, 0);
        const carbsGrams = allItems.reduce((acc, i) => acc + i.carbs, 0);
        const fatGrams = allItems.reduce((acc, i) => acc + i.fat, 0);
        return {
            breakfast,
            lunch,
            dinner,
            snack,
            summary: { totalCalories, proteinGrams, carbsGrams, fatGrams },
            guidanceNotes: `Estimated nutritional figures are calibrated for your daily target of ~${targetCalories} kcal. Feel free to substitute equivalent whole foods and remember to stay hydrated with ~${profile.waterTargetMl || 2500}ml of water throughout the day.`,
        };
    }
    static provideCoachAdvice(query, profile) {
        const q = query.toLowerCase();
        let response = '';
        const tips = [];
        const medicalNotice = 'Note: This guidance is intended for general wellness and educational fitness purposes only. It is not medical advice or diagnostic care. For injuries, pain, medical conditions, or pregnancy, always consult with a licensed healthcare physician.';
        if (q.includes('sore') || q.includes('pain') || q.includes('injury') || q.includes('hurt')) {
            response = 'Post-exercise muscle soreness (DOMS) is common after new training stimulus, but sharp, joint, or shooting pain is a signal to stop and rest. Never push through sharp pain.';
            tips.push('Prioritize 8 hours of sleep and adequate hydration to accelerate tissue recovery.');
            tips.push('Engage in light movement like a gentle 20-minute walk to enhance blood circulation without taxing fatigued muscle.');
            tips.push('If pain persists beyond 72 hours, consult a licensed physical therapist.');
        }
        else if (q.includes('lose weight') || q.includes('fat loss') || q.includes('deficit') || q.includes('cut')) {
            response = 'Sustainable fat loss happens through a modest, consistent calorie deficit combined with high-protein intake and regular resistance training to preserve lean muscle.';
            tips.push('Target a gentle 300–500 kcal deficit rather than crash dieting to keep metabolic rate and energy levels steady.');
            tips.push('Aim for 1.6–2.0 grams of protein per kilogram of body weight to stay satiated.');
            tips.push('Aim for 7,000–10,000 daily steps for steady, low-fatigue energy expenditure.');
        }
        else if (q.includes('muscle') || q.includes('bulk') || q.includes('hypertrophy') || q.includes('gain')) {
            response = 'Muscle hypertrophy requires progressive mechanical tension, adequate dietary protein, and a slight caloric surplus of 200–300 kcal above maintenance.';
            tips.push('Track your weights and strive to add an extra repetition or 1-2 kg each week on main compound lifts.');
            tips.push('Distribute protein across 3–4 meals spaced 3–5 hours apart.');
            tips.push('Allow 48 hours of recovery between training the same muscle group.');
        }
        else if (q.includes('plateau') || q.includes('stuck')) {
            response = 'Plateaus are a natural part of any fitness trajectory. When progress stalls, small tweaks to tracking accuracy, step counts, or deloading fatigue usually get things moving again.';
            tips.push('Audit your food logs for hidden oils, dressings, and portion creep for 3-4 days.');
            tips.push('Consider a 1-week diet break at maintenance calories to reduce diet fatigue.');
            tips.push('Switch up exercise rep ranges (e.g. from 8 reps to 12 reps) to provide a fresh stimulus.');
        }
        else {
            response = `Great question! Staying consistent with wholesome nutrition, progressive movement, and balanced recovery is the highest-leverage formula for sustainable fitness.`;
            tips.push(`Focus on hitting your daily targets: ~${profile?.dailyCalorieTarget || 2000} kcal and ${profile?.dailyProteinTarget || 120}g protein.`);
            tips.push('Drink water steadily throughout your day, aiming for at least 2.5 liters.');
            tips.push('Celebrate small daily consistency milestones rather than waiting for distant outcomes.');
        }
        return { response, actionableTips: tips, medicalNotice };
    }
}
exports.DeterministicCoach = DeterministicCoach;
