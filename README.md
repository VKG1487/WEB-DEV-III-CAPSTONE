# ShopSphere — Enterprise Multi-Vendor E-Commerce & Inventory Management Platform

> **Web Development 3 – Capstone Project**  
> **Student:** Vibhash Kumar Giri (Roll No: 2501010069)  
> **Repository:** Full-Stack Node.js, Express, MongoDB, MVC Architecture, and Role-Based Access Control

---

## Table of Contents
1. [Section A: Problem Statement](#section-a-problem-statement)
   - [Problem Definition](#1-problem-definition)
   - [Target Users & Real-World Use Case](#2-target-users--real-world-use-case)
   - [Why the Proposed Application is Needed](#3-why-the-proposed-application-is-needed)
2. [Section B: Solution & Technology Stack](#section-b-solution--technology-stack)
   - [Proposed Solution Overview](#1-proposed-solution-overview)
   - [Key Features & Capabilities](#2-key-features--capabilities)
   - [Technology Stack Matrix](#3-technology-stack-matrix)
   - [Architectural Implementation (MVC Pattern)](#4-architectural-implementation-mvc-pattern)
   - [Web Development 3 Curriculum Mapping](#5-web-development-3-curriculum-mapping)
3. [Section C: How to Run the Application](#section-c-how-to-run-the-application)
   - [Prerequisites & System Requirements](#1-prerequisites--system-requirements)
   - [Repository Cloning](#2-repository-cloning)
   - [Dependency Installation](#3-dependency-installation)
   - [Environment Variable Configuration](#4-environment-variable-configuration)
   - [Database Setup & Seeding](#5-database-setup--seeding)
   - [Starting the Application](#6-starting-the-application)
   - [Application Access & URLs](#7-application-access--urls)
   - [Automated Testing Suite](#8-automated-testing-suite)
4. [Section D: Actors / User Roles](#section-d-actors--user-roles)
   - [Identified Actors](#1-identified-actors)
   - [Actor Responsibilities & Permissions Matrix](#2-actor-responsibilities--permissions-matrix)
5. [Section E: Actor-Wise API Documentation](#section-e-actor-wise-api-documentation)
   - [Actor 1: User / Customer](#1-actor-user--customer)
   - [Actor 2: Seller / Vendor](#2-actor-seller--vendor)
   - [Actor 3: Platform Administrator](#3-actor-platform-administrator)
6. [Demo Credentials](#demo-credentials)

---

## Section A: Problem Statement

### 1. Problem Definition
Traditional retail businesses, boutique merchants, and independent creators frequently face significant barriers when attempting to sell their merchandise online. While large proprietary platforms exist, they impose exorbitant take-rates, lack real-time transparent inventory synchronization, provide limited customization, and feature opaque operational workflows. 

Simultaneously, consumers frequently struggle with fragmented shopping experiences across disparate websites, lack centralized tracking for multi-vendor shipments, and encounter unreliable stock updates resulting in cancelled orders. There is a pressing need for an open, robust, performant full-stack e-commerce platform that enforces strict Role-Based Access Control (RBAC), provides seamless inventory and order reconciliation across independent merchants, and offers an intuitive, low-latency user interface.

### 2. Target Users & Real-World Use Case
* **Buyers / Customers:** Individuals seeking a unified, responsive marketplace to discover products, read verified community reviews, manage real-time shopping carts, securely check out with transparent pricing breakdowns (GST, shipping), and track orders through live status transitions.
* **Vendors / Merchants:** Independent business owners who require self-service catalog management, real-time stock alerts, order fulfillment pipelines, and financial analytics without technical overhead.
* **Platform Administrators:** Marketplace operators responsible for ecosystem integrity, user and merchant verification, category curation, audit trails, and financial governance across the entire platform.

### 3. Why the Proposed Application is Needed
* **Decentralized Commerce with Centralized Governance:** Enables multiple autonomous vendors to operate under a governed, secure umbrella with strict role boundaries.
* **Data Integrity & Concurrency Control:** Implements atomic inventory decrements and restores stock automatically upon order cancellations, preventing stockouts and over-selling.
* **Role-Based Access Control:** Employs role-based access control (`role` & `x-user-id` headers), salted bcrypt password hashing, and granular route authorization middleware.
* **Auditable Financials:** Computes subtotal, dynamic Goods and Services Tax (18% GST), and tiered shipping fees systematically.

---

## Section B: Solution & Technology Stack

### 1. Proposed Solution Overview
**ShopSphere** is a production-oriented, full-stack multi-vendor e-commerce web platform architected using the Model-View-Controller (MVC) pattern. It decouples administrative, merchant, and consumer concerns through a modular Express REST API backend and a single-page reactive client.

The solution integrates:
1. **Role-Based Authentication & Authorization Middleware:** Restricts endpoint access strictly based on verified user roles (`customer`, `vendor`, `admin`) and user credentials.
2. **Atomic Inventory Reconciliation:** Verifies catalog stock before accepting orders, decrementing quantities atomically upon order placement and restoring inventory upon cancellation.
3. **Interactive Actor-Wise API Explorer:** A built-in web terminal allowing evaluators and developers to test every REST endpoint live within the application interface.
4. **Automated Seeder Engine:** Pre-populates realistic multi-vendor catalogs, categorized products, verified reviews, and varied order states with one command (`npm run seed`).

### 2. Key Features & Capabilities
* **Dynamic Product Discovery:** Multi-field regex and text search, category filtering, price sliders, rating filters, stock toggles, and sorting (Newest, Price Asc/Desc, Top Rated).
* **Cart & Checkout Lifecycle:** Client-side persisted shopping bag with instant subtotal, GST (18%), and dynamic free-shipping thresholds (orders > ₹999). Supports COD, UPI, and Card.
* **Vendor Command Center:** Dedicated analytics dashboard displaying catalog size, low-stock warnings (stock ≤ 5), order volumes, and gross merchant revenue, alongside CRUD operations for products.
* **Admin Governance Hub:** System-wide metrics (Gross Platform Revenue, User Demographics, Order Status breakdown), role management (promoting customers to vendors), and category taxonomy controls.
* **Verified Customer Reviews:** Aggregates star ratings (1–5) and feedback, recalculating average product scores using MongoDB aggregation pipelines.

### 3. Technology Stack Matrix

| Layer | Technology | Version | Purpose in Application |
|---|---|---|---|
| **Runtime** | Node.js | v26.x / v20+ LTS | High-throughput asynchronous JavaScript runtime environment |
| **Backend Framework** | Express.js | ^4.21.2 | RESTful routing, middleware pipelines, static asset delivery |
| **Database** | MongoDB | ^7.0+ | Document-oriented NoSQL database for flexible e-commerce schemas |
| **ODM** | Mongoose | ^8.9.5 | Schema definitions, strict data validations, indexes, and hooks |
| **Authentication & RBAC** | Custom Express Middleware & Headers | Built-in | Role-based authorization via `role` & `x-user-id` headers |
| **Security** | `bcryptjs` | ^2.4.3 | Cryptographic password hashing using one-way salt rounds |
| **Cross-Origin** | `cors` | ^2.8.5 | Cross-Origin Resource Sharing policy enforcement |
| **Logging** | `morgan` | ^1.10.0 | HTTP request logger middleware for debugging and auditing |
| **Environment** | `dotenv` | ^16.4.7 | Zero-dependency environment variable isolation |
| **Frontend UI** | Semantic HTML5, Classic CSS, FontAwesome | Modern CDN | Clean, solid academic/corporate styling (no gradients/AI aesthetics) |
| **Testing** | Node.js Test Runner (`node:test`, `node:assert`) | Built-in | Automated unit and integration testing of endpoints and RBAC |

### 4. Architectural Implementation
```
                           ┌───────────────────────────┐
                           │   Client Application UI   │
                           │     (View Layer / SPA)    │
                           └─────────────┬─────────────┘
                                         │ HTTP / REST / WebSockets
                                         ▼
                           ┌───────────────────────────┐
                           │     Express Router        │
                           │      (/api/* routes)      │
                           └─────────────┬─────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
     ┌────────────────────────┐                     ┌────────────────────────┐
     │  protect Middleware    │                     │  authorize Middleware  │
     │(Verifies User / Role)  │                     │ (customer/vendor/admin)│
     └───────────┬────────────┘                     └───────────┬────────────┘
                 └───────────────────────┬───────────────────────┘
                                         ▼
                           ┌───────────────────────────┐
                           │    Controllers & Logic    │
                           │  (Auth, Products, Orders) │
                           └─────────────┬─────────────┘
                                         │ Mongoose Queries
                                         ▼
                           ┌───────────────────────────┐
                           │   MongoDB Database        │
                           │  (Collections & Indexes)  │
                           └───────────────────────────┘
```

### 5. Web Development 3 Curriculum Mapping
The application is intentionally designed to incorporate **only the concepts, technologies, and features covered in Web Development 3**, strictly following the Model-View-Controller (MVC) architecture without unnecessary external bloat:

| Curriculum Unit | Topics Covered in Syllabus | How Implemented in This Project | Source File Location |
|---|---|---|---|
| **Unit 1: Node.js Core** | Node.js Runtime & NPM, CommonJS Modules, Core Modules (`http`, `path`, `events`), Process & CLI arguments | HTTP Server instantiation with `http.createServer()`, `path.join()`, process arguments in seeder (`process.argv`), CommonJS `require`/`module.exports` | `src/server.js`, `src/seeds/seed.js` |
| **Unit 2: Express & MVC** | Express.js, Request & Response, MVC Architecture, REST CRUD, Middleware Chaining, Error Handling | Strict MVC folder structure (`models/`, `controllers/`, `routes/`, `views`), Express `Router()`, custom `requestLogger` middleware chaining, centralized Mongoose error handler | `src/app.js`, `src/controllers/*`, `src/routes/*`, `src/middleware/logger.js`, `src/middleware/error.js` |
| **Unit 3: MongoDB & Mongoose** | Databases, MongoDB Atlas/Local, Mongoose ODM, Schemas, Built-in/Custom Validators, Relationships (`ref`/`populate`), Queries, Aggregation, Text Indexing | MongoDB connection with Mongoose, schemas with validators (`enum`, `min`, `max`, `match`), cross-collection references (`ObjectId`, `ref`), compound text search indexes, aggregation pipeline for revenue & ratings | `src/config/db.js`, `src/models/*`, `src/controllers/statsController.js` |
| **Unit 4: Security & Real-Time** | Environment variables (`dotenv`), Password Hashing (`bcrypt`), Protected Routes, RBAC, EventEmitter, WebSockets & Socket.IO | `.env` configuration, bcrypt salt rounds on pre-save, `protect` & `authorize` RBAC middleware (`role` & `x-user-id`), custom Node.js `EventEmitter` for business events, Socket.IO real-time order alerts | `src/middleware/auth.js`, `src/utils/eventEmitter.js`, `src/server.js`, `public/js/app.js` |

---

## Section C: How to Run the Application

The instructions below allow any developer to clone, configure, seed, and run the project locally without assistance.

### 1. Prerequisites & System Requirements
Ensure the following tools are installed on your machine:
* **Node.js**: `v18.0.0` or higher (`node -v`)
* **npm**: `v9.0.0` or higher (`npm -v`)
* **MongoDB**: A running local MongoDB instance (`mongodb://127.0.0.1:27017`) or a free MongoDB Atlas connection string URI.
* **Git**: (`git --version`)

### 2. Repository Cloning
Clone the repository to your local workspace:
```bash
git clone https://github.com/VKG1487/WEB-DEV-III-CAPSTONE.git
cd WEB-DEV-III-CAPSTONE
```

### 3. Dependency Installation
Install all production and development dependencies:
```bash
npm install
```

### 4. Environment Variable Configuration
Create a `.env` file in the root directory (a pre-configured template `.env.example` is provided):
```bash
cp .env.example .env
```

Ensure `.env` contains:
```ini
# Server Port Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection String (Local or Atlas)
MONGO_URI=mongodb://127.0.0.1:27017/shopsphere_db
```

### 5. Database Setup & Seeding
Populate the database with pre-configured actors (Admin, Vendors, Customers), categorized products, inventory records, sample orders, and verified reviews:
```bash
npm run seed
```
*(Optional: Run `npm run seed:destroy` to wipe all data if you wish to start completely fresh).*

### 6. Starting the Application
You can run the server in either development mode (with automatic hot-reloading via nodemon) or standard production mode:

* **Development Mode (Recommended):**
  ```bash
  npm run dev
  ```
* **Production Mode:**
  ```bash
  npm start
  ```

### 7. Application Access & URLs
Once the server is running, access the application via your browser:
* **Web Application UI:** [http://localhost:5000](http://localhost:5000)
* **REST API Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
* **Interactive API Explorer:** [http://localhost:5000](http://localhost:5000) -> Click **"API Explorer"** in the top navigation bar.

### 8. Automated Testing & Verification Suite
Execute the built-in automated test suite (Integration + Edge Cases):
```bash
npm test
```
*Expected test outcome: 11 passing tests verifying system health, multi-role auth, 403 forbidden access restrictions, product queries, order placement, order history retrieval, status updates, stock exhaustion blocks (400), empty items validation (400), admin self-deletion prevention (400), and category deletion safety (400).*

Run the multi-pass end-to-end debug verification script:
```bash
npm run test:verify
```
*Expected outcome: Verifies atomic inventory decrements upon order creation, atomic stock restorations upon cancellation, vendor CRUD workflows, and admin metrics with live database integrity assertions.*

---

## Section D: Actors / User Roles

ShopSphere features **three distinct user actors**, each with isolated authorization boundaries and operational scopes:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Actor Permission Matrix                         │
├─────────────────────────┬───────────────┬──────────────┬───────────────┤
│ Capability / Resource   │ Customer/User │ Seller/Vendor│ Administrator │
├─────────────────────────┼───────────────┼──────────────┼───────────────┤
│ Browse & Search Catalog │       ✅      │      ✅      │       ✅      │
│ Place Orders            │       ✅      │      ❌      │       ✅      │
│ View Personal Orders    │       ✅      │      ❌      │       ✅      │
│ Submit Product Reviews  │       ✅      │      ❌      │       ✅      │
│ Cancel Pending Order    │       ✅      │      ❌      │       ✅      │
│ Create Products         │       ❌      │      ✅      │       ✅      │
│ Update Own Products     │       ❌      │      ✅      │       ✅      │
│ Delete Own Products     │       ❌      │      ✅      │       ✅      │
│ View Vendor Orders      │       ❌      │      ✅      │       ✅      │
│ Update Order Shipment   │       ❌      │      ✅      │       ✅      │
│ View Vendor Earnings    │       ❌      │      ✅      │       ❌      │
│ Manage User Roles       │       ❌      │      ❌      │       ✅      │
│ Deactivate Accounts     │       ❌      │      ❌      │       ✅      │
│ Manage Categories       │       ❌      │      ❌      │       ✅      │
│ Audit Master Orders     │       ❌      │      ❌      │       ✅      │
│ View Platform Financials│       ❌      │      ❌      │       ✅      │
└─────────────────────────┴───────────────┴──────────────┴───────────────┘
```

### 1. Identified Actors
1. **User / Customer (`customer`):** The standard consumer actor who signs up, browses products, maintains a persistent cart, submits orders with delivery addresses, tracks shipments, cancels pending orders, and reviews purchased goods.
2. **Seller / Vendor (`vendor`):** The merchant actor who manages an independent storefront. Vendors list products, configure inventory stock levels, monitor sales analytics, and update order statuses (`Processing`, `Shipped`, `Delivered`) for items in their catalog.
3. **Administrator (`admin`):** The governance actor with unrestricted supervisory access across the system. The Admin can create/edit categories, modify user roles, audit any order, and review high-level platform revenue statistics.

---

## Section E: Actor-Wise API Documentation

### 1. Actor: User / Customer

#### Endpoints Summary
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/users/register` | Register a new customer account | No (Public) |
| `POST` | `/api/users/login` | Login user account | No (Public) |
| `GET` | `/api/users/profile` | View logged-in customer profile | Yes (Headers: `x-user-id`, `role`) |
| `PUT` | `/api/users/profile` | Update personal profile & address | Yes (Headers: `x-user-id`, `role`) |
| `GET` | `/api/products` | Browse and filter product catalog | No (Public) |
| `GET` | `/api/products/:id` | View product details and reviews | No (Public) |
| `POST` | `/api/orders` | Place an order | Yes (Headers: `x-user-id`, `role: customer`) |
| `GET` | `/api/orders/my-orders` | View personal order history | Yes (Headers: `x-user-id`, `role: customer`) |
| `PUT` | `/api/orders/:id/cancel`| Cancel a pending personal order | Yes (Headers: `x-user-id`, `role: customer`) |
| `POST` | `/api/products/:id/reviews` | Submit product star rating & review | Yes (Headers: `x-user-id`, `role: customer`) |

---

#### Detailed Endpoint Specifications

##### 1.1 Register New User
* **Endpoint:** `POST /api/users/register`
* **Purpose:** Registers a new user account with encrypted password storage.
* **Headers:** `Content-Type: application/json`
* **Request Body:**
```json
{
  "name": "Vibhash Kumar",
  "email": "customer@shopsphere.com",
  "password": "customerpassword123",
  "role": "customer",
  "phone": "+91 9899887766"
}
```
* **Expected Response (`201 Created`):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "6742fe5a4b51a89012345678",
    "name": "Vibhash Kumar",
    "email": "customer@shopsphere.com",
    "role": "customer",
    "phone": "+91 9899887766"
  }
}
```

##### 1.2 User Login
* **Endpoint:** `POST /api/users/login`
* **Purpose:** Authenticates user credentials with bcrypt password verification.
* **Headers:** `Content-Type: application/json`
* **Request Body:**
```json
{
  "email": "customer@shopsphere.com",
  "password": "customerpassword123"
}
```
* **Expected Response (`200 OK`):**
```json
{
  "success": true,
  "message": "User logged in successfully",
  "data": {
    "id": "6742fe5a4b51a89012345678",
    "name": "Vibhash Kumar",
    "email": "customer@shopsphere.com",
    "role": "customer"
  }
}
```

##### 1.3 Place an Order
* **Endpoint:** `POST /api/orders`
* **Purpose:** Creates an order, decrements stock atomically, and records shipping parameters.
* **Headers:** `x-user-id: <customer_id>`, `role: customer`, `Content-Type: application/json`
* **Request Body:**
```json
{
  "items": [
    {
      "productId": "6742fe5a4b51a89012345690",
      "quantity": 2
    }
  ],
  "shippingAddress": "Delhi, India",
  "paymentMethod": "COD"
}
```
* **Expected Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "orderId": "ORD-1001",
    "_id": "6742fe5a4b51a89012345700",
    "status": "Pending",
    "itemsCount": 1,
    "totalPrice": 4998,
    "paymentMethod": "COD",
    "shippingAddress": {
      "fullName": "Vibhash Kumar",
      "address": "Delhi, India",
      "city": "Delhi",
      "postalCode": "110001",
      "country": "India"
    },
    "createdAt": "2026-11-24T12:00:00.000Z"
  }
}
```

##### 1.4 View Personal Orders
* **Endpoint:** `GET /api/orders/my-orders`
* **Purpose:** Retrieves all orders placed by the authenticated customer.
* **Headers:** `x-user-id: <customer_id>`, `role: customer`
* **Expected Response (`200 OK`):**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "6742fe5a4b51a89012345700",
      "orderCode": "ORD-1001",
      "orderStatus": "Pending",
      "totalPrice": 4998,
      "items": [
        {
          "title": "Urban Oversized Heavyweight Cotton Hoodie",
          "quantity": 2,
          "price": 2499
        }
      ]
    }
  ]
}
```

---

### 2. Actor: Seller / Vendor

#### Endpoints Summary
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/products/vendor/my-products` | List all catalog products owned by vendor | Yes (Headers: `x-user-id`, `role: vendor`) |
| `POST` | `/api/products` | Create a new catalog product | Yes (Headers: `x-user-id`, `role: vendor/admin`) |
| `PUT` | `/api/products/:id` | Update vendor's existing product | Yes (Headers: `x-user-id`, Product Owner) |
| `DELETE` | `/api/products/:id` | Delete vendor's product from catalog | Yes (Headers: `x-user-id`, Product Owner) |
| `GET` | `/api/orders/vendor/my-orders` | View orders containing vendor's items | Yes (Headers: `x-user-id`, `role: vendor`) |
| `PUT` | `/api/orders/:id/status` | Advance shipment status (`Processing`, `Shipped`) | Yes (Headers: `x-user-id`, `role: vendor/admin`) |
| `GET` | `/api/stats/vendor` | Get vendor revenue, orders & stock alerts | Yes (Headers: `x-user-id`, `role: vendor`) |

---

#### Detailed Endpoint Specifications

##### 2.1 Create New Product
* **Endpoint:** `POST /api/products`
* **Purpose:** Allows a vendor to publish a new product with stock, category, and price.
* **Headers:** `x-user-id: <vendor_id>`, `role: vendor`, `Content-Type: application/json`
* **Request Body:**
```json
{
  "title": "Wireless Mechanical Gaming Keyboard",
  "description": "Hot-swappable tactile mechanical switches with per-key RGB backlighting and Bluetooth 5.2 connectivity.",
  "price": 6499,
  "comparePrice": 7999,
  "stock": 30,
  "category": "6742fe5a4b51a89012345680",
  "imageUrl": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800"
}
```
* **Expected Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "_id": "6742fe5a4b51a89012345800",
    "title": "Wireless Mechanical Gaming Keyboard",
    "price": 6499,
    "stock": 30,
    "vendor": "6742fe5a4b51a89012345672",
    "sku": "SKU-H4K8J1P",
    "rating": 0,
    "numReviews": 0,
    "isActive": true
  }
}
```

##### 2.2 Update Order Shipment Status
* **Endpoint:** `PUT /api/orders/:id/status`
* **Purpose:** Transitions order state through fulfillment lifecycle.
* **Headers:** `x-user-id: <vendor_id>`, `role: vendor`, `Content-Type: application/json`
* **Request Body:**
```json
{
  "status": "Shipped"
}
```
* **Expected Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Order status updated to Shipped",
  "data": {
    "_id": "6742fe5a4b51a89012345700",
    "orderCode": "ORD-1001",
    "orderStatus": "Shipped"
  }
}
```

##### 2.3 Vendor Analytics
* **Endpoint:** `GET /api/stats/vendor`
* **Purpose:** Returns total products listed, low-stock warnings, units sold, and cumulative earnings.
* **Headers:** `x-user-id: <vendor_id>`, `role: vendor`
* **Expected Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "totalProducts": 6,
    "lowStockProducts": 1,
    "totalOrders": 14,
    "itemsSold": 28,
    "totalEarnings": 142580
  }
}
```

---

### 3. Actor: Platform Administrator

#### Endpoints Summary
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/stats/admin` | System-wide platform revenue & KPIs | Yes (Headers: `x-user-id`, `role: admin`) |
| `GET` | `/api/users` | List all registered users and roles | Yes (Headers: `x-user-id`, `role: admin`) |
| `GET` | `/api/users/:id` | View specific user profile | Yes (Headers: `x-user-id`, `role: admin`) |
| `PUT` | `/api/users/:id` | Modify role (e.g., promote to vendor) or activate | Yes (Headers: `x-user-id`, `role: admin`) |
| `DELETE` | `/api/users/:id` | Remove a user account | Yes (Headers: `x-user-id`, `role: admin`) |
| `GET` | `/api/orders` | Master orders ledger across all merchants | Yes (Headers: `x-user-id`, `role: admin`) |
| `POST` | `/api/categories` | Create new product category taxonomy | Yes (Headers: `x-user-id`, `role: admin`) |
| `PUT` | `/api/categories/:id` | Update category details | Yes (Headers: `x-user-id`, `role: admin`) |
| `DELETE` | `/api/categories/:id` | Delete category (blocked if products exist) | Yes (Headers: `x-user-id`, `role: admin`) |

---

#### Detailed Endpoint Specifications

##### 3.1 Get System-Wide Analytics
* **Endpoint:** `GET /api/stats/admin`
* **Purpose:** Returns comprehensive platform performance metrics.
* **Headers:** `x-user-id: <admin_id>`, `role: admin`
* **Expected Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "totalUsers": 5,
    "totalVendors": 2,
    "totalCustomers": 2,
    "totalProducts": 8,
    "totalOrders": 3,
    "totalRevenue": 50840.3,
    "ordersByStatus": {
      "Pending": 1,
      "Processing": 1,
      "Delivered": 1
    },
    "recentOrders": [
      {
        "_id": "6742fe5a4b51a89012345700",
        "orderCode": "ORD-1001",
        "totalPrice": 37745.84,
        "orderStatus": "Delivered"
      }
    ]
  }
}
```

##### 3.2 Update User Role / Activation
* **Endpoint:** `PUT /api/users/:id`
* **Purpose:** Promotes or demotes user privileges or activates/deactivates an account.
* **Headers:** `x-user-id: <admin_id>`, `role: admin`, `Content-Type: application/json`
* **Request Body:**
```json
{
  "role": "vendor",
  "isActive": true
}
```
* **Expected Response (`200 OK`):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "_id": "6742fe5a4b51a89012345678",
    "name": "Vibhash Kumar",
    "email": "customer@shopsphere.com",
    "role": "vendor",
    "isActive": true
  }
}
```

##### 3.3 Create New Category
* **Endpoint:** `POST /api/categories`
* **Purpose:** Adds a new top-level category with auto-generated slug.
* **Headers:** `x-user-id: <admin_id>`, `role: admin`, `Content-Type: application/json`
* **Request Body:**
```json
{
  "name": "Smart Home & Automation",
  "description": "Smart bulbs, voice assistants, automated switches, and security cameras",
  "icon": "wifi"
}
```
* **Expected Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "_id": "6742fe5a4b51a89012345850",
    "name": "Smart Home & Automation",
    "slug": "smart-home-automation",
    "description": "Smart bulbs, voice assistants, automated switches, and security cameras",
    "icon": "wifi",
    "isActive": true
  }
}
```

---

## Demo Credentials

The platform includes seed accounts ready for live evaluation:

| Role | Email | Password | Display Name | Permissions |
|---|---|---|---|---|
| **Platform Administrator** | `admin@shopsphere.com` | `adminpassword123` | System Admin | Full system governance, user roles, master orders, categories |
| **Seller / Vendor 1** | `vendor.tech@shopsphere.com` | `vendorpassword123` | Apex Tech Retailers | Electronics inventory, stock updates, fulfillment, earnings |
| **Seller / Vendor 2** | `vendor.vogue@shopsphere.com` | `vendorpassword123` | Urban Vogue Apparel | Apparel & fashion catalog, shipment processing |
| **User / Customer 1** | `customer@shopsphere.com` | `customerpassword123` | Vibhash Kumar | Browse marketplace, place orders, write reviews, order tracking |
| **User / Customer 2** | `priya@example.com` | `customerpassword123` | Priya Sharma | Standard consumer checkout, cancellation of orders |

> **Pro-Tip for Evaluators:** You can click the **Quick Demo Switcher** buttons at the top of the web UI to instantly switch personas (Admin, Tech Vendor, Vogue Vendor, Customer, or Guest) without manually typing credentials!

---

## Project Structure

```
WEB-DEV-III-CAPSTONE/
├── public/                       # Frontend Web UI (SPA)
│   ├── css/
│   │   └── style.css             # Classic corporate/academic CSS styling, badges, toast notifications
│   ├── js/
│   │   ├── api.js                # Fetch client, header interceptor, API bindings
│   │   └── app.js                # Application state, cart, modals, API Explorer
│   └── index.html                # Responsive semantic HTML5 single-page application
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB connection handling with Mongoose
│   ├── controllers/
│   │   ├── authController.js     # User registration, login, profile updates
│   │   ├── categoryController.js # Category CRUD and product count aggregations
│   │   ├── orderController.js    # Order checkout, atomic stock updates, tracking
│   │   ├── productController.js  # Search, filter, pagination, vendor CRUD
│   │   ├── statsController.js    # Admin & vendor analytical aggregation pipelines
│   │   └── userController.js     # Admin user governance and RBAC controls
│   ├── middleware/
│   │   ├── auth.js               # User & role verification & RBAC authorization
│   │   ├── error.js              # Centralized Mongoose and HTTP error handler
│   │   └── logger.js             # Custom request logger middleware chaining
│   ├── models/
│   │   ├── Category.js           # Category schema with slugification hook
│   │   ├── Order.js              # Order schema with items, pricing & status
│   │   ├── Product.js            # Product schema with compound search indexes
│   │   ├── Review.js             # Review schema with avg rating aggregation
│   │   └── User.js               # User schema with bcrypt pre-save password hashing
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth routes
│   │   ├── categoryRoutes.js     # /api/categories routes
│   │   ├── orderRoutes.js        # /api/orders routes
│   │   ├── productRoutes.js      # /api/products routes
│   │   ├── statsRoutes.js        # /api/stats routes
│   │   └── userRoutes.js         # /api/users routes (includes /register, /login aliases)
│   ├── seeds/
│   │   └── seed.js               # Comprehensive realistic database population script
│   ├── utils/
│   │   ├── asyncHandler.js       # Asynchronous route wrapper
│   │   ├── errorResponse.js      # Custom HTTP error class
│   │   └── eventEmitter.js       # Custom Node.js business event emitter
│   ├── app.js                    # Express app configuration & middleware mounts
│   └── server.js                 # Server entry point with Socket.IO integration
├── tests/
│   ├── api.test.js               # End-to-end integration and RBAC test suite (7 tests)
│   ├── edge_cases.test.js        # Inventory exhaustion, empty orders, admin safety (4 tests)
│   └── debug_verify.js           # Multi-pass end-to-end stock and lifecycle verification
├── .env.example                  # Environment variable configuration template
├── .gitignore                    # Git tracking ignore rules
├── package.json                  # Project metadata, scripts, and dependencies
└── README.md                     # Mandatory comprehensive project documentation
```

---
*Created as part of the Web Development 3 Capstone Project curriculum.*

