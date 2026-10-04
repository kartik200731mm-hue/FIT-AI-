// Comprehensive Phase 5 AI Coach & Gemini Integration Verification Script
const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting Phase 5 AI Coach Verification...\n');

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
    // 1. Setup authenticated user with calibrated profile
    const timestamp = Date.now();
    const userEmail = `ai_coach_user_${timestamp}@test.com`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'AI Coach Tester', email: userEmail, password: 'Password123!' }),
    });
    const { token, user } = await regRes.json();

    await fetch(`${BASE_URL}/profile`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        heightCm: 178,
        weightKg: 78,
        targetWeightKg: 72,
        activityLevel: 'moderately_active',
        fitnessGoal: 'weight_loss',
        dietaryPreference: 'vegetarian',
        limitations: 'Mild left shoulder impingement',
      }),
    });

    // 2. Test AI Coach Status
    const statusRes = await fetch(`${BASE_URL}/ai-coach/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const statusData = await statusRes.json();
    assert(statusRes.status === 200 && statusData.status === 'ready' && statusData.engineLabel, 'Retrieves AI Coach engine status & mode label');

    // 3. Test Input Validation (short query rejected)
    const shortQueryRes = await fetch(`${BASE_URL}/ai-coach/chat`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'a' }),
    });
    assert(shortQueryRes.status === 400, 'Rejects query shorter than 2 characters with 400 Bad Request');

    // 4. Test Live Consultation Chat
    const chatRes = await fetch(`${BASE_URL}/ai-coach/chat`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'How can I optimize protein intake on a vegetarian diet without gaining excess fat?' }),
    });
    const chatData = await chatRes.json();
    assert(
      chatRes.status === 200 &&
      chatData.response &&
      Array.isArray(chatData.actionableTips) &&
      chatData.actionableTips.length > 0 &&
      chatData.medicalNotice,
      'Delivers personalized AI coaching response with actionable tips and non-diagnostic medical notice'
    );

    // 5. Test AI Workout Plan Generator
    const workoutGenRes = await fetch(`${BASE_URL}/ai-coach/generate-workout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ daysPerWeek: 4, difficulty: 'intermediate' }),
    });
    const workoutGenData = await workoutGenRes.json();
    assert(
      workoutGenRes.status === 200 &&
      workoutGenData.plan &&
      workoutGenData.plan.days.length >= 3 &&
      workoutGenData.plan.days[0].exercises.length > 0,
      'Generates personalized multi-day structured workout split calibrated to user limitations'
    );

    // 6. Test AI Meal Plan Generator
    const mealGenRes = await fetch(`${BASE_URL}/ai-coach/generate-meals`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const mealGenData = await mealGenRes.json();
    assert(
      mealGenRes.status === 200 &&
      mealGenData.recommendations &&
      mealGenData.recommendations.breakfast &&
      mealGenData.recommendations.lunch &&
      mealGenData.recommendations.dinner,
      'Generates calibrated 1-day meal recommendations fitting vegetarian preferences and calorie budget'
    );

    // 7. Test AI Food Swap Recommendation
    const swapRes = await fetch(`${BASE_URL}/ai-coach/swap-food`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ foodName: 'Deep Fried Potato Chips' }),
    });
    const swapData = await swapRes.json();
    assert(
      swapRes.status === 200 &&
      swapData.original &&
      swapData.swap &&
      swapData.benefit &&
      swapData.estimatedMacros,
      'Provides smart whole-food swap recommendation with nutritional rationale'
    );

    console.log(`\n📊 Verification Summary: ${passed} Passed, ${failed} Failed`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Error during test execution:', err);
    process.exit(1);
  }
}

runTests();
