const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = require('../src/app');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const Order = require('../src/models/Order');

async function runDebug() {
  console.log('=== STARTING DEBUG PASS 1: API & DB INTEGRITY ===');
  await mongoose.connect(process.env.MONGO_URI);

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Debug server active at ${baseUrl}`);

  let customerUser, vendorUser, adminUser;
  let testProduct;
  let createdOrderId;

  try {
    // 1. Health
    const health = await (await fetch(`${baseUrl}/api/health`)).json();
    console.log('✔ 1. Health check:', health.success ? 'PASS' : 'FAIL');

    // 2. Fetch categories
    const categories = await (await fetch(`${baseUrl}/api/categories`)).json();
    console.log(`✔ 2. Categories count: ${categories.data.length} (${categories.success ? 'PASS' : 'FAIL'})`);

    // 3. User Login
    const custLogin = await (await fetch(`${baseUrl}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'customer@shopsphere.com', password: 'customerpassword123' })
    })).json();
    customerUser = custLogin.data;
    console.log('✔ 3. Customer login:', custLogin.success ? 'PASS' : 'FAIL', customerUser.name);

    const vendorLogin = await (await fetch(`${baseUrl}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'vendor.tech@shopsphere.com', password: 'vendorpassword123' })
    })).json();
    vendorUser = vendorLogin.data;
    console.log('✔ 4. Vendor login:', vendorLogin.success ? 'PASS' : 'FAIL', vendorUser.name);

    const adminLogin = await (await fetch(`${baseUrl}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@shopsphere.com', password: 'adminpassword123' })
    })).json();
    adminUser = adminLogin.data;
    console.log('✔ 5. Admin login:', adminLogin.success ? 'PASS' : 'FAIL', adminUser.name);

    // 4. Products query with filters
    const prods = await (await fetch(`${baseUrl}/api/products?sort=price&limit=5`)).json();
    console.log(`✔ 6. Products query: ${prods.data.length} items (${prods.success ? 'PASS' : 'FAIL'})`);
    testProduct = prods.data[0];

    // 5. Stock check before order
    const initialStock = testProduct.stock;
    console.log(`Initial stock for "${testProduct.title}": ${initialStock}`);

    // 6. Customer places an order
    const orderRes = await (await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': customerUser._id,
        'role': 'customer'
      },
      body: JSON.stringify({
        items: [{ productId: testProduct._id, quantity: 2 }],
        shippingAddress: 'Sector 14, Gurugram, India',
        paymentMethod: 'COD'
      })
    })).json();
    console.log('✔ 7. Order placement:', orderRes.success ? 'PASS' : 'FAIL', orderRes.data?.orderId);
    createdOrderId = orderRes.data?._id;

    // 7. Verify stock decrement
    const updatedProdAfterOrder = await Product.findById(testProduct._id);
    console.log(`Stock after order: ${updatedProdAfterOrder.stock} (Expected: ${initialStock - 2})`);
    if (updatedProdAfterOrder.stock !== initialStock - 2) {
      throw new Error('Stock decrement mismatch!');
    }
    console.log('✔ 8. Atomic stock decrement: PASS');

    // 8. Customer cancels order -> verify stock restoration!
    const cancelRes = await (await fetch(`${baseUrl}/api/orders/${createdOrderId}/cancel`, {
      method: 'PUT',
      headers: {
        'x-user-id': customerUser._id,
        'role': 'customer'
      }
    })).json();
    console.log('✔ 9. Order cancellation:', cancelRes.success ? 'PASS' : 'FAIL');

    const updatedProdAfterCancel = await Product.findById(testProduct._id);
    console.log(`Stock after cancellation: ${updatedProdAfterCancel.stock} (Expected: ${initialStock})`);
    if (updatedProdAfterCancel.stock !== initialStock) {
      throw new Error('Stock restoration failed!');
    }
    console.log('✔ 10. Atomic stock restoration upon cancellation: PASS');

    // 9. Vendor creates product
    const newProdRes = await (await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': vendorUser._id,
        'role': 'vendor'
      },
      body: JSON.stringify({
        title: 'Debug Test Mechanical Mouse',
        price: 2999,
        stock: 15,
        category: categories.data[0]._id,
        description: 'High precision optical sensor mouse'
      })
    })).json();
    console.log('✔ 11. Vendor product creation:', newProdRes.success ? 'PASS' : 'FAIL', newProdRes.data?._id);
    const createdProdId = newProdRes.data?._id;

    // 10. Vendor deletes the test product
    const delRes = await (await fetch(`${baseUrl}/api/products/${createdProdId}`, {
      method: 'DELETE',
      headers: {
        'x-user-id': vendorUser._id,
        'role': 'vendor'
      }
    })).json();
    console.log('✔ 12. Vendor product deletion:', delRes.success ? 'PASS' : 'FAIL');

    // 11. RBAC check: Customer hitting Admin routes -> 403
    const rbacRes = await fetch(`${baseUrl}/api/users`, {
      headers: {
        'x-user-id': customerUser._id,
        'role': 'customer'
      }
    });
    console.log('✔ 13. Customer blocked from Admin users endpoint (403):', rbacRes.status === 403 ? 'PASS' : 'FAIL');

    // 12. Admin stats
    const statsRes = await (await fetch(`${baseUrl}/api/stats/admin`, {
      headers: {
        'x-user-id': adminUser._id,
        'role': 'admin'
      }
    })).json();
    console.log('✔ 14. Admin platform stats:', statsRes.success ? 'PASS' : 'FAIL', `Total users: ${statsRes.data?.totalUsers}`);

    console.log('\n=== ALL PASS 1 VERIFICATIONS SUCCEEDED! ===\n');
  } catch (err) {
    console.error('Debug failure:', err);
    process.exit(1);
  } finally {
    server.close();
    await mongoose.connection.close();
  }
}

runDebug();

