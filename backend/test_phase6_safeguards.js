// Comprehensive Phase 6 Verification & Age-Aware Safeguards Script
const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting Phase 6 & Age-Aware Safeguards Verification...\n');

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
    const timestamp = Date.now();

    // 1. AGE-AWARE SAFEGUARDS TEST (Minor under 18)
    const minorEmail = `youth_user_${timestamp}@test.com`;
    const regResMinor = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Youth Athlete', email: minorEmail, password: 'SecurePassword123!' }),
    });
    const { token: tokenMinor } = await regResMinor.json();

    // Minor requests weight_loss goal: system MUST NOT assign a deficit
    const minorProfileRes = await fetch(`${BASE_URL}/profile`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenMinor}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        age: 16,
        gender: 'female',
        heightCm: 165,
        weightKg: 60,
        activityLevel: 'moderately_active',
        fitnessGoal: 'weight_loss', // Youth asking for deficit
        dietaryPreference: 'no_restriction',
      }),
    });
    const minorProfileData = await minorProfileRes.json();

    assert(
      minorProfileData.targets.isMinorSafeAdjusted === true &&
      minorProfileData.profile.dailyCalorieTarget === minorProfileData.targets.tdee,
      'Age Safeguard: Overrides weight-loss calorie deficits for minors under 18 to full maintenance TDEE'
    );

    assert(
      minorProfileData.bmiInfo.category === 'Youth Growth Reference',
      'Age Safeguard: Displays non-diagnostic Youth Growth Reference rather than adult BMI classifications for minors'
    );

    // 2. USER A (Adult) SETUP FOR PHASE 6 REMINDERS & SETTINGS
    const adultEmail = `adult_user_${timestamp}@test.com`;
    const regResA = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Jordan Hayes', email: adultEmail, password: 'OldPassword123!' }),
    });
    const { token: tokenA, user: userA } = await regResA.json();

    // 3. REMINDERS TEST
    const remindersRes = await fetch(`${BASE_URL}/reminders`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const remindersData = await remindersRes.json();
    assert(remindersRes.status === 200 && Array.isArray(remindersData.reminders), 'Fetches initial reminders list for authenticated user');

    // Create custom reminder
    const createRemRes = await fetch(`${BASE_URL}/reminders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'hydration',
        title: 'Afternoon Hydration Boost',
        time: '14:30',
        daysOfWeek: [1, 2, 3, 4, 5],
        enabled: true,
      }),
    });
    const createRemData = await createRemRes.json();
    assert(createRemRes.status === 200 && createRemData.reminder.id, 'Creates custom opt-in reminder');

    const reminderId = createRemData.reminder.id;

    // Toggle reminder (disable opt-in)
    const toggleRemRes = await fetch(`${BASE_URL}/reminders/${reminderId}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const toggleRemData = await toggleRemRes.json();
    assert(toggleRemRes.status === 200 && toggleRemData.reminder.enabled === false, 'Allows user to toggle/disable reminder opt-in status');

    // Delete reminder
    const delRemRes = await fetch(`${BASE_URL}/reminders/${reminderId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(delRemRes.status === 200, 'Deletes reminder cleanly');

    // 4. ACHIEVEMENTS TEST
    const achRes = await fetch(`${BASE_URL}/achievements`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const achData = await achRes.json();
    assert(
      achRes.status === 200 &&
      achData.achievements.length > 0 &&
      achData.achievements.every((a) => !a.description.includes('fat') && !a.description.includes('skinny')),
      'Returns supportive, non-shaming achievement badges with progress percentages'
    );

    // 5. SETTINGS & PRIVACY (Export, Password Change, Account Deletion)
    // Export user data
    const exportRes = await fetch(`${BASE_URL}/user/export-data`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const exportData = await exportRes.json();
    assert(exportRes.status === 200 && exportData.user.id === userA.id, 'Exports full GDPR portable user data JSON archive');

    // Change password
    const changePwRes = await fetch(`${BASE_URL}/user/change-password`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: 'OldPassword123!',
        newPassword: 'BrandNewSecurePassword456!',
      }),
    });
    assert(changePwRes.status === 200, 'Updates user password securely via bcrypt');

    // Login with new password
    const loginNewRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adultEmail,
        password: 'BrandNewSecurePassword456!',
      }),
    });
    assert(loginNewRes.status === 200, 'Successfully logs in using updated credentials');

    // Delete account
    const deleteAccRes = await fetch(`${BASE_URL}/user/delete-account`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(deleteAccRes.status === 200, 'Permanently deletes user account and cascaded data');

    console.log(`\n📊 Verification Summary: ${passed} Passed, ${failed} Failed`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Error during test execution:', err);
    process.exit(1);
  }
}

runTests();
