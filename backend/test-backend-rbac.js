async function runTests() {
  const baseURL = 'http://localhost:5000/api';

  console.log('--- 1. Testing Login for all 3 roles ---');

  // Login ADMIN
  const adminRes = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@inventory.com', password: 'admin123' }),
  });
  const adminData = await adminRes.json();
  console.log('Admin login status:', adminRes.status, 'Role:', adminData.user?.role);
  const adminToken = adminData.token;

  // Login WAREHOUSE_MANAGER
  const managerRes = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'manager@inventory.com', password: 'manager123' }),
  });
  const managerData = await managerRes.json();
  console.log('Manager login status:', managerRes.status, 'Role:', managerData.user?.role);
  const managerToken = managerData.token;

  // Login STAFF
  const staffRes = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'staff@inventory.com', password: 'staff123' }),
  });
  const staffData = await staffRes.json();
  console.log('Staff login status:', staffRes.status, 'Role:', staffData.user?.role);
  const staffToken = staffData.token;

  console.log('\n--- 2. Testing Unauthenticated Access (Expecting 401) ---');
  const unauthRes = await fetch(`${baseURL}/inventory`);
  console.log('No token GET /inventory -> Status:', unauthRes.status, '(Expected 401)');

  console.log('\n--- 3. Testing STAFF RBAC (Allowed vs Blocked) ---');
  // Staff allowed: GET /products
  const staffProdRes = await fetch(`${baseURL}/products`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  console.log('Staff GET /products -> Status:', staffProdRes.status, '(Expected 200)');

  // Staff allowed: GET /inventory
  const staffInvRes = await fetch(`${baseURL}/inventory`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  console.log('Staff GET /inventory -> Status:', staffInvRes.status, '(Expected 200)');

  // Staff BLOCKED: POST /inventory/transfer (Expected 403)
  const staffTransferRes = await fetch(`${baseURL}/inventory/transfer`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const staffTransferData = await staffTransferRes.json();
  console.log('Staff POST /inventory/transfer -> Status:', staffTransferRes.status, 'Msg:', staffTransferData.message, '(Expected 403)');

  // Staff BLOCKED: POST /inventory/adjustment (Expected 403)
  const staffAdjRes = await fetch(`${baseURL}/inventory/adjustment`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const staffAdjData = await staffAdjRes.json();
  console.log('Staff POST /inventory/adjustment -> Status:', staffAdjRes.status, 'Msg:', staffAdjData.message, '(Expected 403)');

  // Staff BLOCKED: GET /suppliers (Expected 403)
  const staffSuppRes = await fetch(`${baseURL}/suppliers`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  const staffSuppData = await staffSuppRes.json();
  console.log('Staff GET /suppliers -> Status:', staffSuppRes.status, 'Msg:', staffSuppData.message, '(Expected 403)');

  // Staff BLOCKED: GET /purchase-orders (Expected 403)
  const staffPoRes = await fetch(`${baseURL}/purchase-orders`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  const staffPoData = await staffPoRes.json();
  console.log('Staff GET /purchase-orders -> Status:', staffPoRes.status, 'Msg:', staffPoData.message, '(Expected 403)');

  // Staff BLOCKED: GET /sales-orders (Expected 403)
  const staffSoRes = await fetch(`${baseURL}/sales-orders`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  const staffSoData = await staffSoRes.json();
  console.log('Staff GET /sales-orders -> Status:', staffSoRes.status, 'Msg:', staffSoData.message, '(Expected 403)');

  // Staff BLOCKED: GET /stock-movements (Expected 403)
  const staffSmRes = await fetch(`${baseURL}/stock-movements`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  const staffSmData = await staffSmRes.json();
  console.log('Staff GET /stock-movements -> Status:', staffSmRes.status, 'Msg:', staffSmData.message, '(Expected 403)');

  // Staff BLOCKED: GET /auth/users (Expected 403)
  const staffUsersRes = await fetch(`${baseURL}/auth/users`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  const staffUsersData = await staffUsersRes.json();
  console.log('Staff GET /auth/users -> Status:', staffUsersRes.status, 'Msg:', staffUsersData.message, '(Expected 403)');

  console.log('\n--- 4. Testing WAREHOUSE_MANAGER RBAC (Allowed vs Blocked) ---');
  // Manager allowed: GET /suppliers
  const mgrSuppRes = await fetch(`${baseURL}/suppliers`, {
    headers: { Authorization: `Bearer ${managerToken}` },
  });
  console.log('Manager GET /suppliers -> Status:', mgrSuppRes.status, '(Expected 200)');

  // Manager allowed: GET /purchase-orders
  const mgrPoRes = await fetch(`${baseURL}/purchase-orders`, {
    headers: { Authorization: `Bearer ${managerToken}` },
  });
  console.log('Manager GET /purchase-orders -> Status:', mgrPoRes.status, '(Expected 200)');

  // Manager allowed: GET /sales-orders
  const mgrSoRes = await fetch(`${baseURL}/sales-orders`, {
    headers: { Authorization: `Bearer ${managerToken}` },
  });
  console.log('Manager GET /sales-orders -> Status:', mgrSoRes.status, '(Expected 200)');

  // Manager allowed: GET /stock-movements
  const mgrSmRes = await fetch(`${baseURL}/stock-movements`, {
    headers: { Authorization: `Bearer ${managerToken}` },
  });
  console.log('Manager GET /stock-movements -> Status:', mgrSmRes.status, '(Expected 200)');

  // Manager BLOCKED: GET /auth/users (Admin only, Expected 403)
  const mgrUsersRes = await fetch(`${baseURL}/auth/users`, {
    headers: { Authorization: `Bearer ${managerToken}` },
  });
  const mgrUsersData = await mgrUsersRes.json();
  console.log('Manager GET /auth/users -> Status:', mgrUsersRes.status, 'Msg:', mgrUsersData.message, '(Expected 403)');

  console.log('\n--- 5. Testing ADMIN RBAC (Full Access) ---');
  // Admin allowed: GET /auth/users
  const adminUsersRes = await fetch(`${baseURL}/auth/users`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminUsersData = await adminUsersRes.json();
  console.log('Admin GET /auth/users -> Status:', adminUsersRes.status, 'Count:', adminUsersData.users?.length, '(Expected 200)');

  // Admin allowed: GET /purchase-orders
  const adminPoRes = await fetch(`${baseURL}/purchase-orders`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('Admin GET /purchase-orders -> Status:', adminPoRes.status, '(Expected 200)');

  console.log('\n✅ All backend RBAC tests completed successfully!');
}

runTests().catch(console.error);
