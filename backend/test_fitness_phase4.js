// Comprehensive Phase 4 Core Fitness Features Verification Script
const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting Phase 4 Core Fitness Features Verification...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Setup two distinct test accounts
    const timestamp = Date.now();
    const userA_Email = `fitness_user_a_${timestamp}@test.com`;
    const regResA = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Fitness User A', email: userA_Email, password: 'Password123!' }),
    });
    const { token: tokenA, user: userA } = await regResA.json();

    const userB_Email = `fitness_user_b_${timestamp}@test.com`;
    const regResB = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Fitness User B', email: userB_Email, password: 'Password123!' }),
    });
    const { token: tokenB, user: userB } = await regResB.json();

    // Set profile for User A
    await fetch(`${BASE_URL}/profile`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        heightCm: 175,
        weightKg: 75,
        targetWeightKg: 70,
        activityLevel: 'moderately_active',
        fitnessGoal: 'weight_loss',
        dietaryPreference: 'no_restriction',
      }),
    });

    // 2. Test Workout Plans CRUD
    const createWorkoutRes = await fetch(`${BASE_URL}/workouts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Full Body Foundations Split',
        goal: 'weight_loss',
        difficulty: 'intermediate',
        daysPerWeek: 3,
        days: [
          {
            dayName: 'Day 1 - Push & Core',
            focus: 'Chest, Shoulders, Core',
            exercises: [
              {
                id: 'ex_bench_1',
                name: 'Dumbbell Flat Bench Press',
                category: 'strength',
                targetMuscle: 'Chest',
                sets: 3,
                reps: '10-12',
                restSec: 90,
                instructions: 'Controlled lowering, drive up through chest',
              },
            ],
          },
        ],
      }),
    });
    const workoutData = await createWorkoutRes.json();
    assert(createWorkoutRes.status === 200 && workoutData.plan.id, 'Creates and saves custom workout plan for User A');

    const planId = workoutData.plan.id;
    const exerciseId = workoutData.plan.days[0].exercises[0].id;

    // Toggle exercise completion
    const toggleRes = await fetch(`${BASE_URL}/workouts/${planId}/toggle-exercise`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ dayId: 'day-1', exerciseId, completed: true }),
    });
    const toggleData = await toggleRes.json();
    assert(toggleRes.status === 200 && toggleData.plan.days[0].exercises[0].completed === true, 'Marks exercise as complete and updates day progress');

    // 3. Test Meals Logging & Nutrition Summary
    const today = new Date().toISOString().split('T')[0];
    const logMealRes = await fetch(`${BASE_URL}/meals`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: today,
        mealType: 'breakfast',
        items: [
          {
            name: 'Steel Cut Oatmeal with Blueberries',
            calories: 320,
            protein: 10,
            carbs: 55,
            fat: 6,
            portion: '1 bowl',
            isEstimated: true,
          },
        ],
      }),
    });
    const mealData = await logMealRes.json();
    assert(logMealRes.status === 201 && mealData.log.items.length === 1, 'Logs meal with estimated macros and portion');

    const mealItemId = mealData.log.items[0].id;
    const mealLogId = mealData.log.id;

    // Get Nutrition Summary
    const summaryRes = await fetch(`${BASE_URL}/meals?date=${today}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const summaryData = await summaryRes.json();
    assert(
      summaryRes.status === 200 &&
      summaryData.summary.consumed.calories === 320 &&
      summaryData.summary.consumed.protein === 10 &&
      summaryData.summary.targets.calories > 0,
      'Calculates accurate daily nutrition summary against calibrated profile targets'
    );

    // Delete meal item
    const delItemRes = await fetch(`${BASE_URL}/meals/${mealLogId}/item/${mealItemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(delItemRes.status === 200, 'Deletes individual meal item successfully');

    // 4. Test Activity & Water Tracking
    const logActivityRes = await fetch(`${BASE_URL}/progress/activity`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: today,
        steps: 8500,
        activeMinutes: 45,
        waterMl: 2250,
        workoutCompleted: true,
      }),
    });
    assert(logActivityRes.status === 200, 'Logs daily activity metrics (steps, active minutes, water intake)');

    // 5. Test Weigh-in Record & Progress Summary
    const logWeightRes = await fetch(`${BASE_URL}/progress/weight`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weightKg: 74.5,
        date: today,
        notes: 'Morning weigh-in',
      }),
    });
    assert(logWeightRes.status === 201, 'Logs weigh-in record and updates current weight');

    const progressSummaryRes = await fetch(`${BASE_URL}/progress/summary`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const progData = await progressSummaryRes.json();
    assert(
      progressSummaryRes.status === 200 &&
      progData.latestWeight === 74.5 &&
      progData.streak >= 1 &&
      progData.bmiInfo.bmi > 0,
      'Provides comprehensive progress summary with non-diagnostic BMI and streaks'
    );

    // 6. Test Data Isolation (User B cannot access or modify User A resources)
    const bWorkoutsRes = await fetch(`${BASE_URL}/workouts`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const bWorkoutsData = await bWorkoutsRes.json();
    assert(bWorkoutsData.plans.length === 0, 'Data Isolation: User B cannot see User A workout plans');

    const bMealsRes = await fetch(`${BASE_URL}/meals?date=${today}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const bMealsData = await bMealsRes.json();
    assert(bMealsData.logs.length === 0 && bMealsData.summary.consumed.calories === 0, 'Data Isolation: User B cannot see User A meals or calorie totals');

    const bDelWorkoutRes = await fetch(`${BASE_URL}/workouts/${planId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(bDelWorkoutRes.status === 404, 'Data Isolation: User B cannot delete User A workout plans');

    console.log(`\n📊 Verification Summary: ${passed} Passed, ${failed} Failed`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Error during test execution:', err);
    process.exit(1);
  }
}

runTests();
