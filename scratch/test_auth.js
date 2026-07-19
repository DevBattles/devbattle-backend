import dotenv from 'dotenv';
import { authService } from '../src/services/authService.js';
import { userRepository } from '../src/repositories/userRepository.js';
import { db } from '../src/db/index.js';
import { users } from '../src/schema/index.js';
import { eq } from 'drizzle-orm';

dotenv.config();

async function runTests() {
  console.log('🧪 Starting Auth Flow Verification Test...');

  const testEmail = `test_user_${Date.now()}@example.com`;
  const testUsername = `testuser_${Date.now()}`;
  const testPassword = 'Password@123';
  const role = 'student';

  try {
    // 1. Signup Flow
    console.log('1. Testing Signup...');
    const signupResult = await authService.signup({
      username: testUsername,
      email: testEmail,
      password: testPassword,
      role,
    });
    console.log('✅ Signup returned successfully.');
    console.log(`Sent OTP to ${testEmail}`);

    // Retrieve generated OTP from DB
    const dbUser = await userRepository.findByEmail(testEmail);
    if (!dbUser || !dbUser.otpCode) {
      throw new Error('❌ Failed: OTP code was not generated or saved in database.');
    }
    console.log(`🔑 Retrieved OTP from Database: ${dbUser.otpCode}`);

    // 2. Login (should fail before email verified)
    console.log('2. Testing Login before Email Verification (should fail)...');
    try {
      await authService.login({ email: testEmail, password: testPassword });
      throw new Error('❌ Failed: Allowed login for unverified user.');
    } catch (err) {
      if (err.message.includes('not verified')) {
        console.log('✅ Correctly blocked login for unverified email.');
      } else {
        throw err;
      }
    }

    // 3. OTP Verification (Verify OTP code)
    console.log('3. Testing OTP Verification...');
    const verifyResult = await authService.verifyOtp({
      email: testEmail,
      otp: dbUser.otpCode,
    });
    console.log('✅ OTP verified successfully. Returned JWT:', !!verifyResult.token);

    // Check DB status
    const verifiedUser = await userRepository.findByEmail(testEmail);
    if (!verifiedUser.isEmailVerified || verifiedUser.otpCode !== null) {
      throw new Error('❌ Failed: DB state incorrect after verification.');
    }
    console.log('✅ User isEmailVerified flag is now true, OTP cleared in DB.');

    // 4. Login (should succeed now)
    console.log('4. Testing Login after verification (should succeed)...');
    const loginResult = await authService.login({
      email: testEmail,
      password: testPassword,
    });
    console.log('✅ Login succeeded! Token issued:', !!loginResult.token);

    // Clean up test user
    console.log('🗑️ Cleaning up test user...');
    await db.delete(users).where(eq(users.email, testEmail));
    console.log('✅ Cleanup finished.');
    console.log('\n🎉 ALL AUTHENTICATION FLOW TESTS PASSED SUCCESSFULLY! 🎉');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    // Cleanup if possible
    try {
      await db.delete(users).where(eq(users.email, testEmail));
    } catch (e) {}
  }
}

runTests();
