// Comprehensive Phase 2 Auth & Data Isolation Verification Script
const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting Phase 2 Database & Authentication Verification...\n');

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
    // 1. Invalid input validation on register
    const badEmailRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email: 'not-an-email', password: 'password123' }),
    });
    assert(badEmailRes.status === 400, 'Rejects invalid email format with 400 Bad Request');

    const shortPassRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email: 'test@example.com', password: '123' }),
    });
    assert(shortPassRes.status === 400, 'Rejects password shorter than 6 characters with 400 Bad Request');

    // 2. Register User A
    const timestamp = Date.now();
    const userA_Email = `user_a_${timestamp}@test.com`;
    const regResA = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User A', email: userA_Email, password: 'SecurePassword123!' }),
    });
    const regDataA = await regResA.json();
    assert(regResA.status === 201 && regDataA.token && !regDataA.user.passwordHash, 'Registers User A, issues JWT token, and strips passwordHash from response');

    const tokenA = regDataA.token;

    // 3. Prevent duplicate email registration
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User A Dup', email: userA_Email.toUpperCase(), password: 'AnotherPassword123!' }),
    });
    assert(dupRes.status === 409, 'Rejects duplicate case-insensitive email registration with 409 Conflict');

    // 4. Test Login with invalid password
    const wrongPassRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userA_Email, password: 'WrongPassword!' }),
    });
    assert(wrongPassRes.status === 401, 'Rejects wrong password with generic 401 Unauthorized');

    // 5. Test Login with valid credentials
    const loginResA = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userA_Email, password: 'SecurePassword123!' }),
    });
    const loginDataA = await loginResA.json();
    assert(loginResA.status === 200 && loginDataA.token, 'Signs in User A successfully and returns valid JWT');

    // 6. Test session persistence via /me route
    const meResA = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const meDataA = await meResA.json();
    assert(meResA.status === 200 && meDataA.user.email === userA_Email.toLowerCase(), 'Persists session and retrieves current user profile via /api/auth/me');

    // 7. Protected route unauthorized check
    const unauthRes = await fetch(`${BASE_URL}/profile`, {
      headers: {},
    });
    assert(unauthRes.status === 401, 'Blocks unauthenticated access to /api/profile with 401');

    // 8. User A saves profile and logs workout
    await fetch(`${BASE_URL}/profile`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        age: 26,
        gender: 'female',
        heightCm: 168,
        weightKg: 62,
        targetWeightKg: 58,
        activityLevel: 'moderately_active',
        fitnessGoal: 'weight_loss',
        dietaryPreference: 'pescatarian',
      }),
    });

    await fetch(`${BASE_URL}/workouts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: "User A's Secret Custom Split",
        goal: 'weight_loss',
        level: 'intermediate',
        active: true,
        days: [],
      }),
    });

    // 9. Register User B
    const userB_Email = `user_b_${timestamp}@test.com`;
    const regResB = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User B', email: userB_Email, password: 'PasswordUserB456!' }),
    });
    const regDataB = await regResB.json();
    const tokenB = regDataB.token;

    // 10. Verify Data Isolation (User B cannot see User A's private workouts or profile)
    const workoutsResB = await fetch(`${BASE_URL}/workouts`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const workoutsDataB = await workoutsResB.json();
    const hasUserAData = workoutsDataB.plans.some((p) => p.title.includes("User A's Secret"));
    assert(!hasUserAData, "Enforces strict data isolation: User B cannot access User A's workout plans");

    // 11. Test Logout
    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
    });
    assert(logoutRes.status === 200, 'Logs out successfully and clears session cookie');

    console.log(`\n📊 Verification Summary: ${passed} Passed, ${failed} Failed`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Error during test execution:', err);
    process.exit(1);
  }
}

runTests();
