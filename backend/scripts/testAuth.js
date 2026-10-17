import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

async function request(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}

async function runAuthTests() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env before running auth tests.');
  }

  console.log('====================================================');
  console.log('   T-Kart Phase 5: Authentication & Authorization Tests');
  console.log('====================================================\n');

  const testEmail = `test_customer_${Date.now()}@tkart.com`;
  const testPassword = 'SecurePassword123!';
  let customerToken = '';
  let adminToken = '';

  // Test 1: Customer Registration & Privilege Escalation Prevention
  console.log('[Test 1] Registering new customer (attempting privilege escalation with role="admin")...');
  const regRes = await request('/auth/register', {
    method: 'POST',
    body: {
      name: 'John Customer',
      email: testEmail,
      password: testPassword,
      phone: '9876543210',
      role: 'admin', // Attack simulation: user tries to register as admin
    },
  });

  console.log(`  HTTP Status: ${regRes.status} (Expected: 201)`);
  console.log(`  Assigned Role: "${regRes.data?.data?.user?.role}" (Expected: "customer" - Escalation Blocked)`);
  console.log(`  Token Returned: ${!!regRes.data?.data?.token ? 'YES' : 'NO'}`);
  console.log(`  Password Exposed: ${regRes.data?.data?.user?.password ? 'YES (SECURITY BUG!)' : 'NO (CORRECT)'}`);

  if (regRes.status !== 201 || regRes.data?.data?.user?.role !== 'customer') {
    throw new Error('Test 1 Failed: Registration or role sanitization failure');
  }
  customerToken = regRes.data.data.token;
  console.log('  ✅ Test 1 PASSED\n');

  // Test 2: Duplicate Email Registration
  console.log('[Test 2] Attempting duplicate email registration...');
  const dupRes = await request('/auth/register', {
    method: 'POST',
    body: {
      name: 'Imposter User',
      email: testEmail,
      password: 'AnotherPassword123!',
    },
  });
  console.log(`  HTTP Status: ${dupRes.status} (Expected: 409)`);
  console.log(`  Message: "${dupRes.data?.message}"`);
  if (dupRes.status !== 409) {
    throw new Error('Test 2 Failed: Duplicate email did not return 409 Conflict');
  }
  console.log('  ✅ Test 2 PASSED\n');

  // Test 3: Input Validation (Short password & invalid email)
  console.log('[Test 3] Testing validation rules on invalid registration payload...');
  const valRes = await request('/auth/register', {
    method: 'POST',
    body: {
      name: 'A',
      email: 'not-an-email',
      password: '123',
    },
  });
  console.log(`  HTTP Status: ${valRes.status} (Expected: 400)`);
  console.log(`  Validation errors count: ${valRes.data?.errors?.length || 0}`);
  if (valRes.status !== 400 || !valRes.data?.errors?.length) {
    throw new Error('Test 3 Failed: Invalid payload did not trigger validation errors');
  }
  console.log('  ✅ Test 3 PASSED\n');

  // Test 4: Customer Login
  console.log('[Test 4] Logging in with valid customer credentials...');
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: {
      email: testEmail,
      password: testPassword,
    },
  });
  console.log(`  HTTP Status: ${loginRes.status} (Expected: 200)`);
  console.log(`  Token Received: ${!!loginRes.data?.data?.token ? 'YES' : 'NO'}`);
  if (loginRes.status !== 200 || !loginRes.data?.data?.token) {
    throw new Error('Test 4 Failed: Valid customer login failed');
  }
  console.log('  ✅ Test 4 PASSED\n');

  // Test 5: Customer Login with Wrong Password
  console.log('[Test 5] Attempting login with incorrect password...');
  const wrongPassRes = await request('/auth/login', {
    method: 'POST',
    body: {
      email: testEmail,
      password: 'WrongPassword999!',
    },
  });
  console.log(`  HTTP Status: ${wrongPassRes.status} (Expected: 401)`);
  console.log(`  Message: "${wrongPassRes.data?.message}"`);
  if (wrongPassRes.status !== 401) {
    throw new Error('Test 5 Failed: Incorrect password did not return 401');
  }
  console.log('  ✅ Test 5 PASSED\n');

  // Test 6: Accessing Protected /api/auth/me with Customer Token
  console.log('[Test 6] Accessing /api/auth/me with valid Bearer token...');
  const meRes = await request('/auth/me', {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  console.log(`  HTTP Status: ${meRes.status} (Expected: 200)`);
  console.log(`  User Name: ${meRes.data?.data?.user?.name}`);
  console.log(`  User Email: ${meRes.data?.data?.user?.email}`);
  if (meRes.status !== 200 || meRes.data?.data?.user?.email !== testEmail) {
    throw new Error('Test 6 Failed: /api/auth/me failed with valid token');
  }
  console.log('  ✅ Test 6 PASSED\n');

  // Test 7: Accessing Protected /api/auth/me without Token
  console.log('[Test 7] Accessing /api/auth/me without Authorization header...');
  const noTokenRes = await request('/auth/me');
  console.log(`  HTTP Status: ${noTokenRes.status} (Expected: 401)`);
  if (noTokenRes.status !== 401) {
    throw new Error('Test 7 Failed: Unauthenticated request did not return 401');
  }
  console.log('  ✅ Test 7 PASSED\n');

  // Test 8: Accessing Protected /api/auth/me with Tampered Token
  console.log('[Test 8] Accessing /api/auth/me with tampered token...');
  const tamperedRes = await request('/auth/me', {
    headers: { Authorization: 'Bearer this_is_a_forged_tampered_token_xyz' },
  });
  console.log(`  HTTP Status: ${tamperedRes.status} (Expected: 401)`);
  if (tamperedRes.status !== 401) {
    throw new Error('Test 8 Failed: Tampered token did not return 401');
  }
  console.log('  ✅ Test 8 PASSED\n');

  // Test 9: Admin Login using Seeded Admin Credentials
  console.log('[Test 9] Logging in as Admin using seeded administrator credentials...');
  const adminLoginRes = await request('/auth/login', {
    method: 'POST',
    body: {
      email: adminEmail,
      password: adminPassword,
    },
  });
  console.log(`  HTTP Status: ${adminLoginRes.status} (Expected: 200)`);
  console.log(`  Admin Role: "${adminLoginRes.data?.data?.user?.role}" (Expected: "admin")`);
  if (adminLoginRes.status !== 200 || adminLoginRes.data?.data?.user?.role !== 'admin') {
    throw new Error('Test 9 Failed: Admin login failed or role is not admin');
  }
  adminToken = adminLoginRes.data.data.token;
  console.log('  ✅ Test 9 PASSED\n');

  // Test 10: RBAC - Customer attempting to access Admin-Only Endpoint
  console.log('[Test 10] Security RBAC: Customer attempting to access admin-only endpoint (/api/auth/admin-check)...');
  const rbacDenyRes = await request('/auth/admin-check', {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  console.log(`  HTTP Status: ${rbacDenyRes.status} (Expected: 403 Forbidden)`);
  console.log(`  Message: "${rbacDenyRes.data?.message}"`);
  if (rbacDenyRes.status !== 403) {
    throw new Error('Test 10 Failed: Customer was not denied access to admin-only endpoint');
  }
  console.log('  ✅ Test 10 PASSED (RBAC enforced)\n');

  // Test 11: RBAC - Admin accessing Admin-Only Endpoint
  console.log('[Test 11] Security RBAC: Admin accessing admin-only endpoint (/api/auth/admin-check)...');
  const rbacAllowRes = await request('/auth/admin-check', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`  HTTP Status: ${rbacAllowRes.status} (Expected: 200 OK)`);
  console.log(`  Message: "${rbacAllowRes.data?.message}"`);
  if (rbacAllowRes.status !== 200) {
    throw new Error('Test 11 Failed: Admin was not granted access to admin-only endpoint');
  }
  console.log('  ✅ Test 11 PASSED\n');

  console.log('====================================================');
  console.log('  🎉 All 11 Authentication & Authorization Tests Passed!');
  console.log('====================================================\n');
}

runAuthTests().catch((err) => {
  console.error('❌ Auth Verification Failed:', err.message);
  process.exit(1);
});
