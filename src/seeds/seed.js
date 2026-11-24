const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');

const seedData = async (shouldExit = true) => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shopsphere_db');
      console.log('[Seeder] Connected to MongoDB database...');
    }

    // Clear existing collections
    await User.deleteMany();
    await Category.deleteMany();
    await Product.deleteMany();
    await Order.deleteMany();
    await Review.deleteMany();
    console.log('[Seeder] Cleared existing database records.');

    // 1. Create Users
    const users = await User.create([
      {
        name: 'vkg',
        email: 'vkg@shopsphere.com',
        password: 'vkgpassword123',
        role: 'owner',
        phone: '+91 9999900001',
        address: {
          street: 'HQ Executive Boulevard, Cyber City',
          city: 'Gurugram',
          state: 'Haryana',
          postalCode: '122002',
          country: 'India',
        },
      },
      {
        name: 'System Admin',
        email: 'admin@shopsphere.com',
        password: 'adminpassword123',
        role: 'admin',
        phone: '+91 9876543210',
        address: {
          street: 'Admin Towers, Tech Park',
          city: 'New Delhi',
          state: 'Delhi',
          postalCode: '110001',
          country: 'India',
        },
      },
      {
        name: 'Apex Tech Retailers',
        email: 'vendor.tech@shopsphere.com',
        password: 'vendorpassword123',
        role: 'vendor',
        phone: '+91 9811223344',
        address: {
          street: 'Cyber City Phase 2',
          city: 'Gurugram',
          state: 'Haryana',
          postalCode: '122002',
          country: 'India',
        },
        vendorDetails: {
          storeName: 'Apex Electronics Hub',
          businessLicense: 'GSTIN07AABCT2345Z1Z8',
          isApproved: true,
        },
      },
      {
        name: 'Urban Vogue Apparel',
        email: 'vendor.vogue@shopsphere.com',
        password: 'vendorpassword123',
        role: 'vendor',
        phone: '+91 9833445566',
        address: {
          street: 'Fashion Street, Bandra West',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400050',
          country: 'India',
        },
        vendorDetails: {
          storeName: 'Urban Vogue Studio',
          businessLicense: 'GSTIN27AABCV6789Z2Z4',
          isApproved: true,
        },
      },
      {
        name: 'Vibhash Kumar',
        email: 'customer@shopsphere.com',
        password: 'customerpassword123',
        role: 'customer',
        phone: '+91 9899887766',
        address: {
          street: 'Sector 14, Urban Estate',
          city: 'Gurugram',
          state: 'Haryana',
          postalCode: '122001',
          country: 'India',
        },
      },
      {
        name: 'Priya Sharma',
        email: 'priya@example.com',
        password: 'customerpassword123',
        role: 'customer',
        phone: '+91 9711223355',
        address: {
          street: 'Indira Nagar, 100ft Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560038',
          country: 'India',
        },
      },
    ]);

    const admin = users[0];
    const techVendor = users[1];
    const vogueVendor = users[2];
    const customer = users[3];
    const customer2 = users[4];

    console.log(`[Seeder] Seeded ${users.length} user accounts (Admin, 2 Vendors, 2 Customers).`);

    // 2. Create Categories
    const categories = await Category.create([
      {
        name: 'Electronics & Gadgets',
        description: 'Next-gen audio, smart home devices, smartphones and accessories',
        icon: 'cpu',
      },
      {
        name: 'Fashion & Apparel',
        description: 'Contemporary streetwear, formal fashion, and curated accessories',
        icon: 'shirt',
      },
      {
        name: 'Fitness & Sports',
        description: 'Premium gym gear, endurance accessories, and health monitors',
        icon: 'activity',
      },
      {
        name: 'Home & Workspace',
        description: 'Ergonomic chairs, smart lighting, and minimal desktop setups',
        icon: 'home',
      },
    ]);

    console.log(`[Seeder] Seeded ${categories.length} product categories.`);

    // 3. Create Products
    const products = await Product.create([
      {
        title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
        description: 'Industry-leading noise cancellation optimized with two processors and 8 microphones. Magnificent sound engineered to perfection with 30-hour battery life.',
        price: 26990,
        comparePrice: 29990,
        category: categories[0]._id,
        vendor: techVendor._id,
        stock: 35,
        sku: 'SNY-WH1000-XM5',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
        rating: 4.8,
        numReviews: 24,
        isFeatured: true,
      },
      {
        title: 'Apple MacBook Air M3 (16GB RAM, 512GB SSD)',
        description: 'Strikingly thin design with blazing-fast Apple M3 chip. Liquid Retina display, MagSafe charging, and up to 18 hours of battery life.',
        price: 114900,
        comparePrice: 124900,
        category: categories[0]._id,
        vendor: techVendor._id,
        stock: 14,
        sku: 'APL-MBA-M3-16',
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
        rating: 4.9,
        numReviews: 48,
        isFeatured: true,
      },
      {
        title: 'Keychron K2 Pro Wireless Mechanical Keyboard',
        description: 'Customizable QMK/VIA wireless mechanical keyboard with hot-swappable tactile Gateron Brown switches and double-shot PBT keycaps.',
        price: 8499,
        comparePrice: 9999,
        category: categories[0]._id,
        vendor: techVendor._id,
        stock: 22,
        sku: 'KEY-K2PRO-BRN',
        imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
        rating: 4.7,
        numReviews: 19,
        isFeatured: false,
      },
      {
        title: 'Urban Oversized Heavyweight Cotton Hoodie',
        description: '450 GSM French Terry cotton hoodie with dropped shoulders, double-stitched kangaroo pocket, and breathable pre-shrunk fabric.',
        price: 2499,
        comparePrice: 3499,
        category: categories[1]._id,
        vendor: vogueVendor._id,
        stock: 45,
        sku: 'VOG-HOOD-OVR-BLK',
        imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
        rating: 4.6,
        numReviews: 32,
        isFeatured: true,
      },
      {
        title: 'Tailored Italian Linen Casual Blazer',
        description: 'Unstructured breathable linen blazer with notch lapels, horn buttons, and patch pockets. Ideal for smart-casual summer layering.',
        price: 5999,
        comparePrice: 7999,
        category: categories[1]._id,
        vendor: vogueVendor._id,
        stock: 18,
        sku: 'VOG-BLAZ-LIN-BEI',
        imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80',
        rating: 4.5,
        numReviews: 12,
        isFeatured: false,
      },
      {
        title: 'Garmin Forerunner 265 GPS Running Smartwatch',
        description: 'Brilliant AMOLED touchscreen display with advanced training metrics, HRV status, recovery insights, and multi-band GNSS tracking.',
        price: 43990,
        comparePrice: 47990,
        category: categories[2]._id,
        vendor: techVendor._id,
        stock: 10,
        sku: 'GRM-FR265-BLK',
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
        rating: 4.9,
        numReviews: 15,
        isFeatured: true,
      },
      {
        title: 'HydroFlow Insulated Stainless Steel Flask (1000ml)',
        description: 'Double-wall vacuum insulation keeps liquids cold for 24 hours or piping hot for 12 hours. BPA-free powder-coated condensation-proof finish.',
        price: 1299,
        comparePrice: 1799,
        category: categories[2]._id,
        vendor: vogueVendor._id,
        stock: 60,
        sku: 'HYD-FLK-1000-MAT',
        imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80',
        rating: 4.6,
        numReviews: 28,
        isFeatured: false,
      },
      {
        title: 'ErgoMotion Mesh High-Back Executive Chair',
        description: 'Dynamic lumbar support, 4D adjustable armrests, synchronized tilt lock mechanism, and breathable German mesh upholstery.',
        price: 14999,
        comparePrice: 18999,
        category: categories[3]._id,
        vendor: techVendor._id,
        stock: 8,
        sku: 'ERG-CHAIR-MESH',
        imageUrl: 'https://images.unsplash.com/photo-1580481077195-c3f9a7442144?w=800&auto=format&fit=crop&q=80',
        rating: 4.7,
        numReviews: 14,
        isFeatured: true,
      },
    ]);

    console.log(`[Seeder] Seeded ${products.length} products with stock and pricing.`);

    // 4. Create Sample Orders
    const sampleOrder1 = await Order.create({
      customer: customer._id,
      orderCode: 'ORD-1001',
      items: [
        {
          product: products[0]._id,
          title: products[0].title,
          quantity: 1,
          price: products[0].price,
          vendor: techVendor._id,
          imageUrl: products[0].imageUrl,
        },
        {
          product: products[3]._id,
          title: products[3].title,
          quantity: 2,
          price: products[3].price,
          vendor: vogueVendor._id,
          imageUrl: products[3].imageUrl,
        },
      ],
      shippingAddress: {
        fullName: 'Vibhash Kumar',
        address: 'Sector 14, Urban Estate',
        city: 'Gurugram',
        state: 'Haryana',
        postalCode: '122001',
        country: 'India',
        phone: '+91 9899887766',
      },
      paymentMethod: 'UPI',
      paymentStatus: 'Completed',
      itemsPrice: 31988,
      taxPrice: 5757.84,
      shippingPrice: 0,
      totalPrice: 37745.84,
      orderStatus: 'Delivered',
      deliveredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    });

    const sampleOrder2 = await Order.create({
      customer: customer._id,
      orderCode: 'ORD-1002',
      items: [
        {
          product: products[2]._id,
          title: products[2].title,
          quantity: 1,
          price: products[2].price,
          vendor: techVendor._id,
          imageUrl: products[2].imageUrl,
        },
      ],
      shippingAddress: {
        fullName: 'Vibhash Kumar',
        address: 'Sector 14, Urban Estate',
        city: 'Gurugram',
        state: 'Haryana',
        postalCode: '122001',
        country: 'India',
        phone: '+91 9899887766',
      },
      paymentMethod: 'Card',
      paymentStatus: 'Completed',
      itemsPrice: 8499,
      taxPrice: 1529.82,
      shippingPrice: 0,
      totalPrice: 10028.82,
      orderStatus: 'Processing',
    });

    const sampleOrder3 = await Order.create({
      customer: customer2._id,
      orderCode: 'ORD-1003',
      items: [
        {
          product: products[6]._id,
          title: products[6].title,
          quantity: 2,
          price: products[6].price,
          vendor: vogueVendor._id,
          imageUrl: products[6].imageUrl,
        },
      ],
      shippingAddress: {
        fullName: 'Priya Sharma',
        address: 'Indira Nagar, 100ft Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560038',
        country: 'India',
        phone: '+91 9711223355',
      },
      paymentMethod: 'COD',
      paymentStatus: 'Pending',
      itemsPrice: 2598,
      taxPrice: 467.64,
      shippingPrice: 0,
      totalPrice: 3065.64,
      orderStatus: 'Pending',
    });

    console.log('[Seeder] Seeded sample orders across various statuses.');

    // 5. Create Reviews
    await Review.create([
      {
        user: customer._id,
        product: products[0]._id,
        rating: 5,
        comment: 'Top-tier active noise cancellation. Battery backup is unbelievable for work and travel!',
      },
      {
        user: customer2._id,
        product: products[3]._id,
        rating: 5,
        comment: 'Great heavyweight cotton hoodie. The fit and stitching feel like luxury streetwear.',
      },
    ]);
    console.log('[Seeder] Seeded verified product reviews.');

    console.log('=======================================================');
    console.log(' SEEDING COMPLETED SUCCESSFULLY!');
    console.log(' Pre-configured Demo Accounts:');
    console.log(' 1. Owner:    vkg@shopsphere.com       / vkgpassword123 (vkg)');
    console.log(' 2. Admin:    admin@shopsphere.com     / adminpassword123');
    console.log(' 3. Vendor 1: vendor.tech@shopsphere.com / vendorpassword123');
    console.log(' 4. Vendor 2: vendor.vogue@shopsphere.com/ vendorpassword123');
    console.log(' 5. Customer: customer@shopsphere.com  / customerpassword123');
    console.log('=======================================================');

    if (shouldExit) {
      process.exit(0);
    }
    return { users, categories, products };
  } catch (error) {
    console.error(`[Seeder Error]: ${error.message}`);
    if (shouldExit) {
      process.exit(1);
    }
    throw error;
  }
};

const destroyData = async (shouldExit = true) => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shopsphere_db');
    }
    await User.deleteMany();
    await Category.deleteMany();
    await Product.deleteMany();
    await Order.deleteMany();
    await Review.deleteMany();
    console.log('[Seeder] All database records deleted successfully.');
    if (shouldExit) {
      process.exit(0);
    }
  } catch (error) {
    console.error(`[Seeder Error]: ${error.message}`);
    if (shouldExit) {
      process.exit(1);
    }
    throw error;
  }
};

if (require.main === module) {
  if (process.argv[2] === '-d') {
    destroyData(true);
  } else {
    seedData(true);
  }
}

module.exports = seedData;
module.exports.destroyData = destroyData;

