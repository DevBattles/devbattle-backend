import app from '../src/app.js';
import { checkDbConnection } from '../src/db/index.js';
import logger from '../src/logger/logger.js';

const PORT = 5001;
let server;

// Helper to make HTTP requests using fetch
const makeRequest = async (path, method = 'GET', body = null, headers = {}) => {
  const url = `http://localhost:${PORT}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();
  return { status: response.status, data };
};

const runTests = async () => {
  try {
    console.log('⏳ Starting API verification tests...');

    // 1. Start test server
    await checkDbConnection();
    server = app.listen(PORT, () => {
      console.log(`🚀 Test server listening on port ${PORT}`);
    });

    // 2. GET /health
    console.log('\n--- Test 1: GET /health ---');
    const health = await makeRequest('/health');
    console.log('Status:', health.status);
    console.log('Response:', JSON.stringify(health.data, null, 2));

    const testUser = {
      username: `student_${Date.now()}`,
      email: `student_${Date.now()}@example.com`,
      password: 'Password@123',
      role: 'student',
    };

    // 3. POST /api/auth/signup (Success)
    console.log('\n--- Test 2: POST /api/auth/signup (Success) ---');
    const signup = await makeRequest('/api/auth/signup', 'POST', testUser);
    console.log('Status:', signup.status);
    console.log('Response:', JSON.stringify(signup.data, null, 2));
    const token = signup.data.data.token;

    // 4. POST /api/auth/signup (Duplicate Username/Email check)
    console.log('\n--- Test 3: POST /api/auth/signup (Duplicate) ---');
    const duplicate = await makeRequest('/api/auth/signup', 'POST', testUser);
    console.log('Status:', duplicate.status);
    console.log('Response:', JSON.stringify(duplicate.data, null, 2));

    // 5. POST /api/auth/signup (Validation Error - Role invalid)
    console.log('\n--- Test 4: POST /api/auth/signup (Validation Error) ---');
    const invalidRole = await makeRequest('/api/auth/signup', 'POST', {
      ...testUser,
      username: `student_invalid_${Date.now()}`,
      email: `student_invalid_${Date.now()}@example.com`,
      role: 'admin', // invalid role
    });
    console.log('Status:', invalidRole.status);
    console.log('Response:', JSON.stringify(invalidRole.data, null, 2));

    // 6. POST /api/auth/login (Success)
    console.log('\n--- Test 5: POST /api/auth/login (Success) ---');
    const login = await makeRequest('/api/auth/login', 'POST', {
      email: testUser.email,
      password: testUser.password,
    });
    console.log('Status:', login.status);
    console.log('Response:', JSON.stringify(login.data, null, 2));

    // 7. POST /api/auth/login (Failure - Bad Password)
    console.log('\n--- Test 6: POST /api/auth/login (Failure) ---');
    const badLogin = await makeRequest('/api/auth/login', 'POST', {
      email: testUser.email,
      password: 'WrongPassword123',
    });
    console.log('Status:', badLogin.status);
    console.log('Response:', JSON.stringify(badLogin.data, null, 2));

    // 8. POST /api/auth/logout
    console.log('\n--- Test 7: POST /api/auth/logout ---');
    const logout = await makeRequest('/api/auth/logout', 'POST');
    console.log('Status:', logout.status);
    console.log('Response:', JSON.stringify(logout.data, null, 2));

    console.log('\n✅ All tests executed. Closing test server.');
    server.close(() => {
      console.log('Test server shut down.');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Test execution failed:', error);
    if (server) {
      server.close();
    }
    process.exit(1);
  }
};

runTests();
