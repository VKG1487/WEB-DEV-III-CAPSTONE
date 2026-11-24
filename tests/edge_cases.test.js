const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = require('../src/app');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const Order = require('../src/models/Order');

let server;
let baseUrl;
let customerId;
let adminId;
let testProduct;

test.before(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });

  // Login customer & admin
  const custRes = await (await fetch(`${baseUrl}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer@shopsphere.com', password: 'customerpassword123' })
  })).json();
  customerId = custRes.data._id || custRes.data.id;

  const adminRes = await (await fetch(`${baseUrl}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@shopsphere.com', password: 'adminpassword123' })
  })).json();
  adminId = adminRes.data._id || adminRes.data.id;

  const prodRes = await (await fetch(`${baseUrl}/api/products?limit=1`)).json();
  testProduct = prodRes.data[0];
});

test.after(async () => {
  await mongoose.connection.close();
  await new Promise((resolve) => server.close(resolve));
});

test('Edge Case 1: Order with quantity exceeding stock should fail with 400', async () => {
  const res = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': customerId,
      'role': 'customer'
    },
    body: JSON.stringify({
      items: [{ productId: testProduct._id, quantity: 99999 }],
      shippingAddress: 'Gurugram, India'
    })
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.error, /Insufficient stock/i);
});

test('Edge Case 2: Order with empty items array should fail with 400', async () => {
  const res = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': customerId,
      'role': 'customer'
    },
    body: JSON.stringify({
      items: [],
      shippingAddress: 'Gurugram, India'
    })
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
});

test('Edge Case 3: Admin self-deletion protection', async () => {
  const res = await fetch(`${baseUrl}/api/users/${adminId}`, {
    method: 'DELETE',
    headers: {
      'x-user-id': adminId,
      'role': 'admin'
    }
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.error, /cannot delete your own/i);
});

test('Edge Case 4: Category deletion blocked when products are assigned', async () => {
  const res = await fetch(`${baseUrl}/api/categories/${testProduct.category._id || testProduct.category}`, {
    method: 'DELETE',
    headers: {
      'x-user-id': adminId,
      'role': 'admin'
    }
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.error, /Cannot delete category/i);
});

test('Edge Case 5: VKG can log in as Owner and receive owner role', async () => {
  const res = await fetch(`${baseUrl}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'vkg@shopsphere.com', password: 'vkgpassword123' })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.data.role, 'owner');
  assert.equal(data.data.name, 'vkg');
});

test('Edge Case 6: Admin attempting to update user role fails with 403 Forbidden', async () => {
  const res = await fetch(`${baseUrl}/api/users/${customerId}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': adminId,
      'role': 'admin'
    },
    body: JSON.stringify({ role: 'vendor' })
  });

  assert.equal(res.status, 403);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.error, /Forbidden/i);
});

test('Edge Case 7: Only Owner (vkg) can toggle user role from Owner Panel', async () => {
  // 1. Get Owner user
  const ownerRes = await (await fetch(`${baseUrl}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'vkg@shopsphere.com', password: 'vkgpassword123' })
  })).json();
  const ownerId = ownerRes.data._id || ownerRes.data.id;

  // 2. Owner toggles customer to vendor
  const updateRes = await fetch(`${baseUrl}/api/users/${customerId}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': ownerId,
      'role': 'owner'
    },
    body: JSON.stringify({ role: 'vendor' })
  });

  assert.equal(updateRes.status, 200);
  const updateData = await updateRes.json();
  assert.equal(updateData.success, true);
  assert.equal(updateData.data.role, 'vendor');

  // Revert back to customer
  await fetch(`${baseUrl}/api/users/${customerId}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': ownerId,
      'role': 'owner'
    },
    body: JSON.stringify({ role: 'customer' })
  });
});

test('Edge Case 8: Enforce single-owner rule (attempting second owner fails with 400)', async () => {
  const ownerRes = await (await fetch(`${baseUrl}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'vkg@shopsphere.com', password: 'vkgpassword123' })
  })).json();
  const ownerId = ownerRes.data._id || ownerRes.data.id;

  // Try to make customer an owner
  const res = await fetch(`${baseUrl}/api/users/${customerId}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': ownerId,
      'role': 'owner'
    },
    body: JSON.stringify({ role: 'owner' })
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.error, /Only one owner account is permitted/i);
});

test('Edge Case 9: System Owner account cannot be deleted', async () => {
  const ownerRes = await (await fetch(`${baseUrl}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'vkg@shopsphere.com', password: 'vkgpassword123' })
  })).json();
  const ownerId = ownerRes.data._id || ownerRes.data.id;

  const res = await fetch(`${baseUrl}/api/users/${ownerId}`, {
    method: 'DELETE',
    headers: {
      'x-user-id': ownerId,
      'role': 'owner'
    }
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.error, /owner account cannot be deleted/i);
});

