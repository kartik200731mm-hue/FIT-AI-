// Master End-to-End Verification Test Runner for Fit AI
const { execSync } = require('child_process');

console.log('===========================================================');
console.log('🚀 FIT AI MASTER VERIFICATION & REGRESSION TEST RUNNER');
console.log('===========================================================\n');

const testScripts = [
  { name: 'Phase 2: Database & Authentication', file: 'test_auth_phase2.js' },
  { name: 'Phase 3: Profile & Goals Calibration', file: 'test_profile_phase3.js' },
  { name: 'Phase 4: Core Fitness Features (Workouts, Meals, Progress)', file: 'test_fitness_phase4.js' },
  { name: 'Phase 5: AI Coach & Gemini Integration', file: 'test_ai_phase5.js' },
  { name: 'Phase 6: Reminders, Achievements & Age Safeguards', file: 'test_phase6_safeguards.js' },
];

let totalPassedSuites = 0;

for (const suite of testScripts) {
  console.log(`\n▶️ Executing [${suite.name}]...`);
  try {
    const output = execSync(`node ${suite.file}`, { encoding: 'utf-8', cwd: __dirname });
    console.log(output.trim());
    totalPassedSuites++;
  } catch (err) {
    console.error(`❌ Suite [${suite.name}] failed:`, err.stdout || err.message);
    process.exit(1);
  }
}

console.log('\n===========================================================');
console.log(`🎉 ALL ${totalPassedSuites} / ${testScripts.length} TEST SUITES PASSED FLAWLESSLY!`);
console.log('===========================================================');
