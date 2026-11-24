const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = require('../src/app');

let server;
let baseUrl;
let customerId = '';
let adminId = '';
let vendorId = '';
let testProductId = '';
let testOrderId = '';

test.before(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await mongoose.connection.close();
  await new Promise((resolve) => server.close(resolve));
});

test('1. System Health Check Endpoint', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.message, 'ShopSphere API is operating normally');
});

test('2. User Authentication & Login (Customer, Admin, Vendor)', async () => {
  // Login customer
  const custRes = await fetch(`${baseUrl}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'customer@shopsphere.com',
      password: 'customerpassword123',
    }),
  });
  assert.equal(custRes.status, 200);
  const custData = await custRes.json();
  assert.equal(custData.success, true);
  assert.ok(custData.data._id || custData.data.id);
  customerId = custData.data._id || custData.data.id;

  // Login admin
  const adminRes = await fetch(`${baseUrl}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@shopsphere.com',
      password: 'adminpassword123',
    }),
  });
  assert.equal(adminRes.status, 200);
  const adminData = await adminRes.json();
  assert.equal(adminData.success, true);
  adminId = adminData.data._id || adminData.data.id;

  // Login vendor
  const vendorRes = await fetch(`${baseUrl}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'vendor.tech@shopsphere.com',
      password: 'vendorpassword123',
    }),
  });
  assert.equal(vendorRes.status, 200);
  const vendorData = await vendorRes.json();
  assert.equal(vendorData.success, true);
  vendorId = vendorData.data._id || vendorData.data.id;
});

test('3. Role-Based Access Control (RBAC) Enforcement', async () => {
  // Customer attempts to access Admin endpoint /api/users -> 403 Forbidden
  const forbiddenRes = await fetch(`${baseUrl}/api/users`, {
    headers: {
      'x-user-id': customerId,
      role: 'customer',
    },
  });
  assert.equal(forbiddenRes.status, 403);
  const forbiddenData = await forbiddenRes.json();
  assert.equal(forbiddenData.success, false);
  assert.match(forbiddenData.error, /Forbidden/);

  // Admin accesses Admin endpoint /api/users -> 200 OK
  const allowedRes = await fetch(`${baseUrl}/api/users`, {
    headers: {
      'x-user-id': adminId,
      role: 'admin',
    },
  });
  assert.equal(allowedRes.status, 200);
  const allowedData = await allowedRes.json();
  assert.equal(allowedData.success, true);
  assert.ok(Array.isArray(allowedData.data));
});

test('4. Product Catalog & Search API', async () => {
  const res = await fetch(`${baseUrl}/api/products`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.data.length > 0);
  testProductId = data.data[0]._id;

  // Single product fetch
  const singleRes = await fetch(`${baseUrl}/api/products/${testProductId}`);
  assert.equal(singleRes.status, 200);
  const singleData = await singleRes.json();
  assert.equal(singleData.success, true);
  assert.equal(singleData.data._id, testProductId);
});

test('5. Order Placement (Capstone Specification Compliance)', async () => {
  const orderPayload = {
    items: [
      {
        productId: testProductId,
        quantity: 1,
      },
    ],
    shippingAddress: 'Sector 14, Gurugram, India',
    paymentMethod: 'COD',
  };

  const res = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': customerId,
      role: 'customer',
    },
    body: JSON.stringify(orderPayload),
  });

  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.message, 'Order placed successfully');
  assert.ok(data.data.orderId);
  assert.equal(data.data.status, 'Pending');
  testOrderId = data.data._id;
});

test('6. Customer Personal Orders (/api/orders/my-orders)', async () => {
  const res = await fetch(`${baseUrl}/api/orders/my-orders`, {
    headers: {
      'x-user-id': customerId,
      role: 'customer',
    },
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.data.some((o) => o._id === testOrderId));
});

test('7. Order Status Transition (Vendor / Admin update)', async () => {
  const res = await fetch(`${baseUrl}/api/orders/${testOrderId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': adminId,
      role: 'admin',
    },
    body: JSON.stringify({ status: 'Processing' }),
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.data.orderStatus, 'Processing');
});
