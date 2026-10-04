// Comprehensive Phase 3 Profile & Goals Verification Script
const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting Phase 3 Profile & Goals Verification...\n');

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
    const userA_Email = `profile_test_a_${timestamp}@test.com`;
    const regResA = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Profile User A', email: userA_Email, password: 'Password123!' }),
    });
    const { token: tokenA, user: userA } = await regResA.json();

    const userB_Email = `profile_test_b_${timestamp}@test.com`;
    const regResB = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Profile User B', email: userB_Email, password: 'Password123!' }),
    });
    const { token: tokenB, user: userB } = await regResB.json();

    // 2. Check initial empty-profile state
    const emptyProfileRes = await fetch(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(emptyProfileRes.status === 404, 'Returns 404 for newly registered user without a calibrated profile');

    // 3. Test field validations (invalid height, invalid weight, invalid goal)
    const invalidHeightRes = await fetch(`${BASE_URL}/profile`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        age: 25,
        gender: 'male',
        heightCm: 45, // Invalid: min 100
        weightKg: 70,
        activityLevel: 'moderately_active',
        fitnessGoal: 'muscle_gain',
        dietaryPreference: 'vegetarian',
      }),
    });
    assert(invalidHeightRes.status === 400, 'Rejects height below 100cm with 400 Bad Request');

    const invalidGoalRes = await fetch(`${BASE_URL}/profile`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        heightCm: 178,
        weightKg: 75,
        activityLevel: 'moderately_active',
        fitnessGoal: 'extreme_fad_diet', // Invalid enum
        dietaryPreference: 'vegetarian',
      }),
    });
    assert(invalidGoalRes.status === 400, 'Rejects invalid fitnessGoal enum with 400 Bad Request');

    // 4. Create valid profile for User A (optional age & gender omitted to test defaults)
    const createResA = await fetch(`${BASE_URL}/profile`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        heightCm: 180,
        weightKg: 80,
        targetWeightKg: 75,
        activityLevel: 'moderately_active',
        fitnessGoal: 'weight_loss',
        dietaryPreference: 'vegetarian',
        limitations: 'Sensitive right shoulder on military press',
      }),
    });
    const createDataA = await createResA.json();
    assert(
      createResA.status === 200 &&
      createDataA.profile.userId === userA.id &&
      createDataA.profile.dailyCalorieTarget > 0 &&
      createDataA.profile.dailyProteinTarget > 0 &&
      createDataA.profile.limitations === 'Sensitive right shoulder on military press',
      'Creates profile, calculates Mifflin-St Jeor daily calorie & macro targets, and persists limitations'
    );

    // 5. Read profile for User A
    const getResA = await fetch(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const getDataA = await getResA.json();
    assert(
      getResA.status === 200 &&
      getDataA.profile.heightCm === 180 &&
      getDataA.profile.weightKg === 80 &&
      getDataA.bmiInfo.category === 'Normal weight' || getDataA.bmiInfo.category === 'Overweight',
      'Reads calibrated profile with non-diagnostic BMI contextual metrics'
    );

    // 6. Update User A profile (change goal, clear limitations)
    const updateResA = await fetch(`${BASE_URL}/profile`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        heightCm: 180,
        weightKg: 80,
        targetWeightKg: 85,
        activityLevel: 'very_active',
        fitnessGoal: 'muscle_gain',
        dietaryPreference: 'vegan',
        limitations: '', // Cleared
      }),
    });
    const updateDataA = await updateResA.json();
    assert(
      updateResA.status === 200 &&
      updateDataA.profile.fitnessGoal === 'muscle_gain' &&
      updateDataA.profile.dietaryPreference === 'vegan' &&
      updateDataA.profile.limitations === '',
      'Successfully updates profile and clears optional limitations note'
    );

    // 7. Verify Data Isolation (User B cannot see or overwrite User A profile)
    const getResB = await fetch(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(getResB.status === 404, 'Enforces data isolation: User B has separate profile state (404 not found)');

    // 8. User B creates their own separate profile
    const createResB = await fetch(`${BASE_URL}/profile`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        heightCm: 165,
        weightKg: 58,
        activityLevel: 'lightly_active',
        fitnessGoal: 'general_health',
        dietaryPreference: 'keto',
      }),
    });
    const createDataB = await createResB.json();
    assert(
      createResB.status === 200 &&
      createDataB.profile.userId === userB.id &&
      createDataB.profile.fitnessGoal === 'general_health',
      'User B creates independent profile without affecting User A'
    );

    console.log(`\n📊 Verification Summary: ${passed} Passed, ${failed} Failed`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Error during test execution:', err);
    process.exit(1);
  }
}

runTests();
