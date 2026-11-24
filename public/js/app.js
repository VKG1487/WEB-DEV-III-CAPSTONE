// Core Application Logic & State Controller
let state = {
  currentUser: null,
  activeTab: 'marketplace',
  categories: [],
  selectedCategory: '',
  searchQuery: '',
  sortBy: '-createdAt',
  products: [],
  cart: [],
  selectedApiEndpointIndex: 0,
};

// Actor-Wise API Catalog for Live Documentation & Interactive Explorer
const API_ENDPOINTS = [
  // Customer / User Endpoints
  {
    actor: 'customer',
    method: 'POST',
    endpoint: '/api/users/register',
    name: 'Register User',
    description: 'Registers a new customer or vendor with email, password, and profile',
    authRequired: false,
    body: {
      name: 'Vibhash Kumar',
      email: 'newuser@example.com',
      password: 'mypassword123',
      role: 'customer',
      phone: '+91 9876543210'
    }
  },
  {
    actor: 'customer',
    method: 'POST',
    endpoint: '/api/users/login',
    name: 'Login User',
    description: 'Authenticates credentials and returns user profile session',
    authRequired: false,
    body: {
      email: 'customer@shopsphere.com',
      password: 'customerpassword123'
    }
  },
  {
    actor: 'customer',
    method: 'GET',
    endpoint: '/api/users/profile',
    name: 'Get Current Profile',
    description: 'Retrieves current logged-in user profile details',
    authRequired: true,
    body: null
  },
  {
    actor: 'customer',
    method: 'PUT',
    endpoint: '/api/users/profile',
    name: 'Update Profile',
    description: 'Updates user personal details, contact info, and delivery address',
    authRequired: true,
    body: {
      name: 'Vibhash Kumar Giri',
      phone: '+91 9999888877',
      address: {
        street: 'Sector 14, Urban Estate',
        city: 'Gurugram',
        state: 'Haryana',
        postalCode: '122001',
        country: 'India'
      }
    }
  },
  {
    actor: 'customer',
    method: 'GET',
    endpoint: '/api/products',
    name: 'Browse Products',
    description: 'Public catalog query with search, category filtering, sort, and pagination',
    authRequired: false,
    body: null
  },
  {
    actor: 'customer',
    method: 'POST',
    endpoint: '/api/orders',
    name: 'Place Order',
    description: 'Submits a new order, decrements stock, and returns order code (Direct Capstone format)',
    authRequired: true,
    body: {
      items: [
        {
          productId: 'REPLACE_WITH_PRODUCT_ID',
          quantity: 1
        }
      ],
      shippingAddress: 'Sector 14, Urban Estate, Gurugram, India',
      paymentMethod: 'COD'
    }
  },
  {
    actor: 'customer',
    method: 'GET',
    endpoint: '/api/orders/my-orders',
    name: 'View Personal Orders',
    description: 'Returns customer order history with item breakdown and tracking status',
    authRequired: true,
    body: null
  },
  // Vendor Endpoints
  {
    actor: 'vendor',
    method: 'GET',
    endpoint: '/api/products/vendor/my-products',
    name: 'Vendor Inventory',
    description: 'Retrieves all catalog items owned by authenticated vendor',
    authRequired: true,
    body: null
  },
  {
    actor: 'vendor',
    method: 'POST',
    endpoint: '/api/products',
    name: 'Create Product',
    description: 'Allows vendor to list new product with price, category, stock, and imagery',
    authRequired: true,
    body: {
      title: 'Wireless Mechanical Keyboard Pro',
      price: 7499,
      comparePrice: 8999,
      stock: 25,
      category: 'REPLACE_WITH_CATEGORY_ID',
      description: 'Hot-swappable RGB wireless mechanical keyboard with tactile switches.',
      imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800'
    }
  },
  {
    actor: 'vendor',
    method: 'GET',
    endpoint: '/api/orders/vendor/my-orders',
    name: 'Vendor Incoming Orders',
    description: 'Lists all customer orders containing items from this vendor',
    authRequired: true,
    body: null
  },
  {
    actor: 'vendor',
    method: 'PUT',
    endpoint: '/api/orders/REPLACE_WITH_ORDER_ID/status',
    name: 'Update Order Shipment',
    description: 'Vendor or Admin updates shipment status (Processing, Shipped, Delivered)',
    authRequired: true,
    body: {
      status: 'Shipped'
    }
  },
  {
    actor: 'vendor',
    method: 'GET',
    endpoint: '/api/stats/vendor',
    name: 'Vendor Performance Analytics',
    description: 'Calculates total vendor earnings, items sold, low stock alerts, and orders',
    authRequired: true,
    body: null
  },
  // Admin Endpoints
  {
    actor: 'admin',
    method: 'GET',
    endpoint: '/api/stats/admin',
    name: 'Platform Analytics',
    description: 'System-wide revenue, order distribution, user counts, and platform health',
    authRequired: true,
    body: null
  },
  {
    actor: 'admin',
    method: 'GET',
    endpoint: '/api/users',
    name: 'Admin List Users',
    description: 'Audits all registered accounts with role and activation status',
    authRequired: true,
    body: null
  },
  {
    actor: 'admin',
    method: 'GET',
    endpoint: '/api/orders',
    name: 'Admin All Orders',
    description: 'Master order book across entire marketplace with filtering',
    authRequired: true,
    body: null
  },
  {
    actor: 'admin',
    method: 'POST',
    endpoint: '/api/categories',
    name: 'Create Category',
    description: 'Admin creates a new catalog category with slug and metadata',
    authRequired: true,
    body: {
      name: 'Gaming & VR',
      description: 'Next-generation consoles, accessories, and virtual reality gear',
      icon: 'gamepad'
    }
  }
];

// App Initialization
document.addEventListener('DOMContentLoaded', async () => {
  // Load saved cart from localStorage
  const savedCart = localStorage.getItem('shopsphere_cart');
  if (savedCart) {
    try {
      state.cart = JSON.parse(savedCart);
    } catch (e) {
      state.cart = [];
    }
  }

  // Restore existing user session if token exists
  state.currentUser = api.getUser();
  updateAuthUI();
  updateCartBadge();

  // Load initial data
  await loadCategories();
  await loadProducts();
  renderApiExplorerEndpoints();
  selectApiEndpoint(0);

  // Initialize Socket.IO connection (Unit 4 Lecture 39-40 WebSockets & Real-Time Messaging)
  if (typeof io !== 'undefined') {
    const socket = io();
    socket.on('order:created', (data) => {
      showToast(`Real-Time Alert: New order placed by ${data.customer} (₹${data.totalPrice.toLocaleString('en-IN')})`, 'info');
      if (state.activeTab === 'admin-panel') loadAdminData();
      if (state.activeTab === 'vendor-portal') loadVendorData();
    });

    socket.on('order:status_updated', (data) => {
      showToast(`Real-Time Alert: Order ${data.orderCode} status updated to "${data.orderStatus}"`, 'info');
      if (state.activeTab === 'my-orders') loadMyOrders();
      if (state.activeTab === 'vendor-portal') loadVendorData();
      if (state.activeTab === 'admin-panel') loadAdminData();
    });

    socket.on('product:stock_alert', (data) => {
      if (state.currentUser && (state.currentUser.role === 'vendor' || state.currentUser.role === 'admin')) {
        showToast(`Low Stock Alert: "${data.title}" has only ${data.stock} units left!`, 'error');
      }
    });
  }
});

// Toast notification helper
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  const bg = type === 'success' ? 'bg-green-700' : type === 'error' ? 'bg-red-700' : 'bg-blue-700';
  const icon = type === 'success' ? 'fa-check' : type === 'error' ? 'fa-triangle-exclamation' : 'fa-info';

  toast.className = `toast flex items-center p-3 text-xs text-white ${bg} rounded border border-black/10 shadow-md`;
  toast.innerHTML = `<i class="fa-solid ${icon} mr-2"></i> <span>${message}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

// Quick Login Helper (for Demo & Evaluation)
async function quickLogin(email, password) {
  try {
    const res = await api.login(email, password);
    api.setUser(res.data.data);
    state.currentUser = res.data.data;
    updateAuthUI();
    showToast(`Logged in as ${res.data.data.name} (${res.data.data.role.toUpperCase()})`, 'success');

    // Auto navigate to relevant tab
    if (res.data.data.role === 'admin') {
      switchTab('admin-panel');
    } else if (res.data.data.role === 'vendor') {
      switchTab('vendor-portal');
    } else {
      switchTab('marketplace');
    }
  } catch (err) {
    showToast(`Login failed: ${err.message}`, 'error');
  }
}

// Logout
function logout() {
  api.setUser(null);
  state.currentUser = null;
  updateAuthUI();
  switchTab('marketplace');
  showToast('Logged out. You are now browsing as Guest.', 'info');
}

// Update Header Navigation & User Actions based on Role
function updateAuthUI() {
  const authContainer = document.getElementById('authActions');
  const vendorBtn = document.getElementById('vendorTabBtn');
  const adminBtn = document.getElementById('adminTabBtn');
  const myOrdersBtn = document.getElementById('myOrdersTabBtn');
  const activeTokenDisplay = document.getElementById('activeTokenDisplay');

  if (state.currentUser) {
    const role = state.currentUser.role;
    const roleBadgeColor = role === 'admin' ? 'bg-amber-100 text-amber-800' : role === 'vendor' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';

    authContainer.innerHTML = `
      <div class="flex items-center space-x-2">
        <div class="text-right hidden sm:block">
          <div class="text-xs font-bold text-slate-800 leading-tight">${state.currentUser.name}</div>
          <span class="inline-block text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded ${roleBadgeColor}">
            ${role}
          </span>
        </div>
        <button onclick="logout()" title="Logout" class="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition">
          <i class="fa-solid fa-arrow-right-from-bracket"></i>
        </button>
      </div>
    `;

    // Role tabs visibility
    if (role === 'admin') {
      adminBtn.classList.remove('hidden');
      vendorBtn.classList.remove('hidden');
      myOrdersBtn.classList.remove('hidden');
    } else if (role === 'vendor') {
      vendorBtn.classList.remove('hidden');
      adminBtn.classList.add('hidden');
      myOrdersBtn.classList.remove('hidden');
    } else {
      vendorBtn.classList.add('hidden');
      adminBtn.classList.add('hidden');
      myOrdersBtn.classList.remove('hidden');
    }

    if (activeTokenDisplay) {
      activeTokenDisplay.textContent = `${state.currentUser.name} (${role.toUpperCase()})`;
    }
  } else {
    authContainer.innerHTML = `
      <button onclick="openAuthModal('login')" class="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition">
        Sign In
      </button>
      <button onclick="openAuthModal('register')" class="px-3.5 py-1.5 rounded text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm">
        Register
      </button>
    `;

    vendorBtn.classList.add('hidden');
    adminBtn.classList.add('hidden');
    myOrdersBtn.classList.add('hidden');

    if (activeTokenDisplay) {
      activeTokenDisplay.textContent = 'None (Guest / Public)';
    }
  }
}

// Tab Switching
function switchTab(tabId) {
  state.activeTab = tabId;

  // Update navbar buttons
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Toggle views
  document.querySelectorAll('.tab-view').forEach((view) => {
    view.classList.add('hidden');
  });

  const activeView = document.getElementById(`view-${tabId}`);
  if (activeView) {
    activeView.classList.remove('hidden');
  }

  // Load view-specific data
  if (tabId === 'my-orders') {
    loadMyOrders();
  } else if (tabId === 'vendor-portal') {
    loadVendorData();
  } else if (tabId === 'admin-panel') {
    loadAdminData();
  }
}

// Load Categories
async function loadCategories() {
  try {
    const res = await api.getCategories();
    state.categories = res.data.data;

    const container = document.getElementById('categoryFilterContainer');
    const pCategorySelect = document.getElementById('pCategory');

    // Build filter pills
    let html = `
      <button onclick="filterCategory('')" class="category-pill ${state.selectedCategory === '' ? 'active bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'} px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition">
        All Products
      </button>
    `;

    // Populate category select options
    let selectOptions = '';

    state.categories.forEach((cat) => {
      const isActive = state.selectedCategory === cat.slug;
      html += `
        <button onclick="filterCategory('${cat.slug}')" class="category-pill ${isActive ? 'active bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'} px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition">
          ${cat.name} (${cat.productCount || 0})
        </button>
      `;
      selectOptions += `<option value="${cat._id}">${cat.name}</option>`;
    });

    container.innerHTML = html;
    if (pCategorySelect) pCategorySelect.innerHTML = selectOptions;
  } catch (err) {
    console.error('Failed to load categories', err);
  }
}

// Filter Category
function filterCategory(slug) {
  state.selectedCategory = slug;
  loadCategories();
  loadProducts();
}

// Search
let searchTimeout;
function handleSearch(val) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    state.searchQuery = val.trim();
    loadProducts();
  }, 300);
}

// Sort
function handleSortChange(val) {
  state.sortBy = val;
  loadProducts();
}

// Load Products
async function loadProducts() {
  try {
    const countEl = document.getElementById('productTotalCount');
    countEl.textContent = 'Searching...';

    let queryParams = `?sort=${state.sortBy}`;
    if (state.selectedCategory) queryParams += `&category=${state.selectedCategory}`;
    if (state.searchQuery) queryParams += `&search=${encodeURIComponent(state.searchQuery)}`;

    const res = await api.getProducts(queryParams);
    state.products = res.data.data;

    countEl.textContent = `${res.data.count} items`;
    renderProducts(state.products);

    // Update product id placeholder in API Explorer example
    if (state.products.length > 0) {
      const example = API_ENDPOINTS.find(e => e.endpoint === '/api/orders');
      if (example && example.body && example.body.items) {
        example.body.items[0].productId = state.products[0]._id;
      }
      const exampleCat = API_ENDPOINTS.find(e => e.name === 'Create Product');
      if (exampleCat && state.categories.length > 0) {
        exampleCat.body.category = state.categories[0]._id;
      }
    }
  } catch (err) {
    console.error('Failed to load products', err);
  }
}

// Render Products Grid (Classic Clean Card Design)
function renderProducts(products) {
  const grid = document.getElementById('productGrid');

  if (!products || products.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-12 text-center bg-white rounded-lg border border-gray-200">
        <i class="fa-solid fa-box-open text-3xl text-gray-400 mb-2"></i>
        <h3 class="font-bold text-gray-700 text-sm">No products found</h3>
        <p class="text-xs text-gray-400 mt-1">Try resetting filters or adjusting your search keyword.</p>
        <button onclick="filterCategory(''); document.getElementById('searchInput').value='';" class="mt-3 px-3 py-1.5 rounded bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 border border-blue-200">
          Reset All Filters
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = products.map((p) => {
    const inStock = p.stock > 0;
    const vendorName = p.vendor?.vendorDetails?.storeName || p.vendor?.name || 'Verified Vendor';

    return `
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm hover:border-gray-300 transition overflow-hidden flex flex-col justify-between">
        <div>
          <!-- Image & Badges -->
          <div class="relative aspect-square w-full bg-gray-100 overflow-hidden cursor-pointer border-b border-gray-100" onclick="openProductDetailModal('${p._id}')">
            <img
              src="${p.imageUrl}"
              alt="${p.title}"
              class="w-full h-full object-cover object-center"
              loading="lazy"
              onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'"
            />
            <div class="absolute top-2 left-2 flex flex-col gap-1">
              ${p.category?.name ? `<span class="bg-white px-2 py-0.5 rounded text-[10px] font-bold text-gray-700 border border-gray-200 shadow-sm">${p.category.name}</span>` : ''}
            </div>
            <div class="absolute top-2 right-2">
              ${inStock
                ? `<span class="bg-green-700 text-white px-2 py-0.5 rounded text-[10px] font-semibold">In Stock (${p.stock})</span>`
                : `<span class="bg-red-700 text-white px-2 py-0.5 rounded text-[10px] font-semibold">Sold Out</span>`
              }
            </div>
          </div>

          <!-- Product Info -->
          <div class="p-3.5 space-y-1.5">
            <div class="text-[11px] text-gray-500 flex items-center justify-between">
              <span class="truncate max-w-[130px]"><i class="fa-solid fa-store mr-1 text-gray-400"></i> ${vendorName}</span>
              <span class="text-amber-600 font-bold"><i class="fa-solid fa-star text-[10px]"></i> ${p.rating || '4.8'} (${p.numReviews || 0})</span>
            </div>
            <h3 class="font-bold text-gray-900 text-xs line-clamp-2 hover:text-blue-700 transition cursor-pointer" onclick="openProductDetailModal('${p._id}')" title="${p.title}">
              ${p.title}
            </h3>
          </div>
        </div>

        <!-- Price & Action -->
        <div class="p-3.5 pt-0">
          <div class="pt-2.5 border-t border-gray-100 flex items-center justify-between">
            <div>
              <div class="text-sm font-bold text-gray-900">
                ₹${p.price.toLocaleString('en-IN')}
                ${p.comparePrice > p.price ? `<span class="text-[11px] font-normal text-gray-400 line-through ml-1">₹${p.comparePrice.toLocaleString('en-IN')}</span>` : ''}
              </div>
            </div>

            <button
              onclick="addToCart('${p._id}')"
              ${!inStock ? 'disabled' : ''}
              class="px-3 py-1.5 rounded text-xs font-semibold transition flex items-center ${
                inStock
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              }"
            >
              <i class="fa-solid fa-cart-plus mr-1"></i> Add
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Cart Logic
function addToCart(productId) {
  const product = state.products.find((p) => p._id === productId);
  if (!product) return;

  if (product.stock <= 0) {
    showToast('This product is out of stock', 'error');
    return;
  }

  const existing = state.cart.find((item) => item.product._id === productId);
  if (existing) {
    if (existing.quantity >= product.stock) {
      showToast(`Only ${product.stock} units available in inventory`, 'error');
      return;
    }
    existing.quantity += 1;
  } else {
    state.cart.push({
      product,
      quantity: 1,
    });
  }

  saveCart();
  updateCartBadge();
  showToast(`Added "${product.title.substring(0, 24)}..." to bag`, 'success');
}

function updateCartQuantity(productId, delta) {
  const item = state.cart.find((i) => i.product._id === productId);
  if (!item) return;

  const newQty = item.quantity + delta;
  if (newQty <= 0) {
    state.cart = state.cart.filter((i) => i.product._id !== productId);
  } else {
    if (newQty > item.product.stock) {
      showToast(`Cannot exceed available stock of ${item.product.stock}`, 'error');
      return;
    }
    item.quantity = newQty;
  }

  saveCart();
  updateCartBadge();
  renderCartDrawer();
}

function removeFromCart(productId) {
  state.cart = state.cart.filter((i) => i.product._id !== productId);
  saveCart();
  updateCartBadge();
  renderCartDrawer();
}

function saveCart() {
  localStorage.setItem('shopsphere_cart', JSON.stringify(state.cart));
}

function updateCartBadge() {
  const badge = document.getElementById('cartCountBadge');
  const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  badge.textContent = count;
}

function toggleCartDrawer(open) {
  const drawer = document.getElementById('cartDrawer');
  if (open) {
    renderCartDrawer();
    drawer.classList.remove('hidden');
  } else {
    drawer.classList.add('hidden');
  }
}

function renderCartDrawer() {
  const container = document.getElementById('cartItemsContainer');
  const subtotalEl = document.getElementById('cartSubtotal');
  const taxEl = document.getElementById('cartTax');
  const shippingEl = document.getElementById('cartShipping');
  const totalEl = document.getElementById('cartTotal');

  if (state.cart.length === 0) {
    container.innerHTML = `
      <div class="py-16 text-center">
        <i class="fa-solid fa-cart-shopping text-4xl text-slate-300 mb-3"></i>
        <h4 class="font-bold text-slate-700">Your bag is empty</h4>
        <p class="text-xs text-slate-400 mt-1">Explore our marketplace and add some items!</p>
        <button onclick="toggleCartDrawer(false)" class="mt-4 px-4 py-2 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700">
          Continue Shopping
        </button>
      </div>
    `;
    subtotalEl.textContent = '₹0';
    taxEl.textContent = '₹0';
    totalEl.textContent = '₹0';
    return;
  }

  let subtotal = 0;
  container.innerHTML = state.cart.map((item) => {
    const itemTotal = item.product.price * item.quantity;
    subtotal += itemTotal;

    return `
      <div class="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
        <img src="${item.product.imageUrl}" class="w-14 h-14 object-cover rounded-lg bg-white border border-slate-200" />
        <div class="flex-1 min-w-0">
          <h4 class="font-bold text-xs text-slate-800 truncate">${item.product.title}</h4>
          <div class="text-[11px] font-semibold text-slate-500 mt-0.5">₹${item.product.price.toLocaleString('en-IN')}</div>
          <div class="flex items-center space-x-2 mt-2">
            <button onclick="updateCartQuantity('${item.product._id}', -1)" class="w-6 h-6 rounded bg-white border border-slate-200 text-slate-700 text-xs flex items-center justify-center hover:bg-slate-100">-</button>
            <span class="text-xs font-bold text-slate-800">${item.quantity}</span>
            <button onclick="updateCartQuantity('${item.product._id}', 1)" class="w-6 h-6 rounded bg-white border border-slate-200 text-slate-700 text-xs flex items-center justify-center hover:bg-slate-100">+</button>
          </div>
        </div>
        <div class="text-right">
          <div class="text-xs font-extrabold text-slate-900">₹${itemTotal.toLocaleString('en-IN')}</div>
          <button onclick="removeFromCart('${item.product._id}')" class="text-slate-400 hover:text-rose-500 text-xs mt-2">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  const tax = Math.round(subtotal * 0.18 * 100) / 100;
  const shipping = subtotal > 999 ? 0 : 50;
  const total = subtotal + tax + shipping;

  subtotalEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
  taxEl.textContent = `₹${tax.toLocaleString('en-IN')}`;
  shippingEl.textContent = shipping === 0 ? 'Free (Over ₹999)' : `₹${shipping}`;
  totalEl.textContent = `₹${total.toLocaleString('en-IN')}`;
}

// Checkout & Place Order
async function handlePlaceOrder() {
  if (state.cart.length === 0) {
    showToast('Your cart is empty', 'error');
    return;
  }

  if (!state.currentUser) {
    showToast('Please sign in or use Quick Login before placing an order', 'error');
    openAuthModal('login');
    return;
  }

  const address = document.getElementById('checkoutAddressInput').value.trim();
  const paymentMethod = document.getElementById('checkoutPaymentMethod').value;

  if (!address) {
    showToast('Please enter a delivery address', 'error');
    return;
  }

  const items = state.cart.map((i) => ({
    productId: i.product._id,
    quantity: i.quantity,
  }));

  try {
    const btn = document.getElementById('placeOrderBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Placing Order...';

    const res = await api.createOrder({
      items,
      shippingAddress: address,
      paymentMethod,
    });

    // Clear cart
    state.cart = [];
    saveCart();
    updateCartBadge();
    toggleCartDrawer(false);

    showToast(`Order ${res.data.data.orderId} placed successfully!`, 'success');
    await loadProducts(); // Refresh stock
    switchTab('my-orders');
  } catch (err) {
    showToast(`Order failed: ${err.message}`, 'error');
  } finally {
    const btn = document.getElementById('placeOrderBtn');
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-lock mr-2 text-xs"></i> Place Order Now';
  }
}

// Load Customer "My Orders"
async function loadMyOrders() {
  if (!state.currentUser) return;
  const container = document.getElementById('myOrdersList');
  container.innerHTML = '<div class="py-12 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin text-2xl"></i><p class="mt-2 text-xs">Loading orders...</p></div>';

  try {
    const res = await api.getMyOrders();
    const orders = res.data.data;

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="py-12 text-center bg-white rounded-lg border border-gray-200">
          <i class="fa-solid fa-receipt text-3xl text-gray-400 mb-2"></i>
          <h3 class="font-bold text-gray-700 text-sm">No orders placed yet</h3>
          <p class="text-xs text-gray-400 mt-1">When you place orders, track them live here.</p>
          <button onclick="switchTab('marketplace')" class="mt-3 px-3.5 py-1.5 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700">
            Browse Marketplace
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = orders.map((o) => {
      const statusColor = {
        Pending: 'bg-amber-100 text-amber-800 border-amber-300',
        Processing: 'bg-blue-100 text-blue-800 border-blue-300',
        Shipped: 'bg-purple-100 text-purple-800 border-purple-300',
        Delivered: 'bg-green-100 text-green-800 border-green-300',
        Cancelled: 'bg-red-100 text-red-800 border-red-300',
      }[o.orderStatus] || 'bg-gray-100 text-gray-800';

      const dateStr = new Date(o.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      return `
        <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-gray-100 gap-2">
            <div>
              <span class="font-mono text-xs font-bold text-gray-900">${o.orderCode}</span>
              <span class="text-xs text-gray-400 ml-2">Placed on ${dateStr}</span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="px-2 py-0.5 rounded text-[11px] font-bold border ${statusColor}">
                ${o.orderStatus}
              </span>
              ${
                o.orderStatus === 'Pending'
                  ? `<button onclick="handleCancelOrder('${o._id}')" class="px-2 py-0.5 rounded bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold border border-red-200 transition">Cancel Order</button>`
                  : ''
              }
            </div>
          </div>

          <!-- Items in Order -->
          <div class="divide-y divide-gray-100">
            ${o.items.map((item) => `
              <div class="py-2 flex items-center justify-between text-xs">
                <div class="flex items-center space-x-3">
                  <img src="${item.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'}" class="w-10 h-10 object-cover rounded border border-gray-200" />
                  <div>
                    <h5 class="font-bold text-gray-800">${item.title}</h5>
                    <span class="text-gray-500">Qty: ${item.quantity} × ₹${item.price.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div class="font-bold text-gray-900">
                  ₹${(item.price * item.quantity).toLocaleString('en-IN')}
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Order Summary Footer -->
          <div class="pt-2.5 border-t border-gray-100 flex flex-col sm:flex-row justify-between text-xs text-gray-600 gap-2 bg-gray-50 -mx-4 -mb-4 p-3 rounded-b-lg">
            <div>
              <span class="font-semibold text-gray-700">Delivery Address:</span> ${o.shippingAddress?.address || 'Standard Address'}, ${o.shippingAddress?.city || 'Delhi'}
            </div>
            <div>
              <span class="text-gray-500">Payment: ${o.paymentMethod} (${o.paymentStatus})</span>
              <span class="ml-3 font-bold text-xs text-gray-900">Total: ₹${o.totalPrice.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div class="p-4 bg-rose-50 text-rose-600 text-xs rounded-xl">${err.message}</div>`;
  }
}

// Cancel Order
async function handleCancelOrder(orderId) {
  if (!confirm('Are you sure you want to cancel this order?')) return;
  try {
    await api.cancelOrder(orderId);
    showToast('Order cancelled and inventory restored', 'success');
    loadMyOrders();
    loadProducts();
  } catch (err) {
    showToast(`Cancellation error: ${err.message}`, 'error');
  }
}

// Vendor Portal Logic
async function loadVendorData() {
  if (!state.currentUser || (state.currentUser.role !== 'vendor' && state.currentUser.role !== 'admin')) return;

  try {
    // 1. Load Vendor Stats
    const statsRes = await api.getVendorStats();
    const stats = statsRes.data.data;
    document.getElementById('vendorKpiProducts').textContent = stats.totalProducts;
    document.getElementById('vendorKpiLowStock').textContent = stats.lowStockProducts;
    document.getElementById('vendorKpiOrders').textContent = stats.totalOrders;
    document.getElementById('vendorKpiEarnings').textContent = `₹${stats.totalEarnings.toLocaleString('en-IN')}`;

    // 2. Load Vendor Products
    const prodRes = await api.getVendorProducts();
    const products = prodRes.data.data;
    document.getElementById('vendorProductCount').textContent = `${products.length} catalog items`;

    const tableBody = document.getElementById('vendorProductsTableBody');
    if (products.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" class="px-4 py-6 text-center text-gray-400">No products listed in your inventory yet. Click "Add New Product" to create one.</td></tr>`;
    } else {
      tableBody.innerHTML = products.map((p) => `
        <tr class="hover:bg-gray-50 transition">
          <td class="px-4 py-2.5 flex items-center space-x-3">
            <img src="${p.imageUrl}" class="w-9 h-9 rounded object-cover border border-gray-200" />
            <div>
              <div class="font-bold text-xs text-gray-900 line-clamp-1">${p.title}</div>
              <span class="text-[10px] text-gray-400 font-mono">${p.sku}</span>
            </div>
          </td>
          <td class="px-4 py-2.5 text-xs text-gray-600">${p.category?.name || 'General'}</td>
          <td class="px-4 py-2.5 text-xs font-bold text-gray-900">₹${p.price.toLocaleString('en-IN')}</td>
          <td class="px-4 py-2.5 text-xs font-semibold ${p.stock <= 5 ? 'text-amber-700' : 'text-gray-700'}">${p.stock} units</td>
          <td class="px-4 py-2.5">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}">
              ${p.isActive ? 'Active' : 'Inactive'}
            </span>
          </td>
          <td class="px-4 py-2.5 text-right space-x-1">
            <button onclick="openProductModal('${p._id}')" class="p-1 rounded text-gray-500 hover:text-blue-700 hover:bg-gray-100">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="handleDeleteProduct('${p._id}')" class="p-1 rounded text-gray-500 hover:text-red-700 hover:bg-gray-100">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `).join('');
    }

    // 3. Load Vendor Orders
    const ordersRes = await api.getVendorOrders();
    const orders = ordersRes.data.data;
    document.getElementById('vendorOrderCount').textContent = `${orders.length} orders`;

    const ordersTable = document.getElementById('vendorOrdersTableBody');
    if (orders.length === 0) {
      ordersTable.innerHTML = `<tr><td colspan="6" class="px-4 py-6 text-center text-gray-400">No incoming customer orders recorded yet.</td></tr>`;
    } else {
      ordersTable.innerHTML = orders.map((o) => `
        <tr class="hover:bg-gray-50 transition">
          <td class="px-4 py-2.5 font-mono text-xs font-bold text-blue-700">${o.orderCode}</td>
          <td class="px-4 py-2.5 text-xs text-gray-700">
            <div class="font-bold">${o.customer?.name || 'Customer'}</div>
            <div class="text-[10px] text-gray-400">${o.customer?.email || ''}</div>
          </td>
          <td class="px-4 py-2.5 text-xs text-gray-600">${o.vendorItems?.length || 1} item(s)</td>
          <td class="px-4 py-2.5 text-xs font-bold text-gray-900">₹${(o.vendorSubtotal || o.totalPrice).toLocaleString('en-IN')}</td>
          <td class="px-4 py-2.5">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-800">
              ${o.orderStatus}
            </span>
          </td>
          <td class="px-4 py-2.5 text-right">
            <select onchange="handleUpdateOrderStatus('${o._id}', this.value)" class="text-xs bg-white border border-gray-300 rounded px-2 py-1">
              <option value="">Status</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
            </select>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to load vendor data', err);
  }
}

// Vendor Product Modal Handlers
function openProductModal(productId = null) {
  const modal = document.getElementById('productEditModal');
  const title = document.getElementById('productModalTitle');
  const form = document.getElementById('productForm');

  if (productId) {
    const p = state.products.find((prod) => prod._id === productId);
    if (!p) return;
    title.textContent = 'Edit Catalog Product';
    document.getElementById('editProductId').value = p._id;
    document.getElementById('pTitle').value = p.title;
    document.getElementById('pPrice').value = p.price;
    document.getElementById('pStock').value = p.stock;
    document.getElementById('pCategory').value = p.category?._id || p.category;
    document.getElementById('pImageUrl').value = p.imageUrl;
    document.getElementById('pDescription').value = p.description;
  } else {
    title.textContent = 'Add New Catalog Product';
    form.reset();
    document.getElementById('editProductId').value = '';
  }

  modal.classList.remove('hidden');
}

function closeProductModal() {
  document.getElementById('productEditModal').classList.add('hidden');
}

async function handleSaveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('editProductId').value;
  const payload = {
    title: document.getElementById('pTitle').value,
    price: Number(document.getElementById('pPrice').value),
    stock: Number(document.getElementById('pStock').value),
    category: document.getElementById('pCategory').value,
    imageUrl: document.getElementById('pImageUrl').value || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
    description: document.getElementById('pDescription').value,
  };

  try {
    if (id) {
      await api.updateProduct(id, payload);
      showToast('Product updated successfully', 'success');
    } else {
      await api.createProduct(payload);
      showToast('Product created successfully', 'success');
    }
    closeProductModal();
    loadProducts();
    loadVendorData();
  } catch (err) {
    showToast(`Error saving product: ${err.message}`, 'error');
  }
}

async function handleDeleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  try {
    await api.deleteProduct(id);
    showToast('Product removed from catalog', 'success');
    loadProducts();
    loadVendorData();
  } catch (err) {
    showToast(`Error deleting product: ${err.message}`, 'error');
  }
}

async function handleUpdateOrderStatus(orderId, status) {
  if (!status) return;
  try {
    await api.updateOrderStatus(orderId, status);
    showToast(`Order status updated to ${status}`, 'success');
    loadVendorData();
    loadAdminData();
  } catch (err) {
    showToast(`Status update failed: ${err.message}`, 'error');
  }
}

// Admin Panel Logic
async function loadAdminData() {
  if (!state.currentUser || state.currentUser.role !== 'admin') return;

  try {
    // 1. Stats
    const statsRes = await api.getAdminStats();
    const stats = statsRes.data.data;
    document.getElementById('adminKpiRevenue').textContent = `₹${stats.totalRevenue.toLocaleString('en-IN')}`;
    document.getElementById('adminKpiOrders').textContent = stats.totalOrders;
    document.getElementById('adminKpiVendors').textContent = stats.totalVendors;
    document.getElementById('adminKpiUsers').textContent = stats.totalUsers;
    document.getElementById('adminKpiProducts').textContent = stats.totalProducts;

    // 2. Users Table
    const usersRes = await api.getUsers();
    const users = usersRes.data.data;
    const usersTable = document.getElementById('adminUsersTableBody');
    if (users.length === 0) {
      usersTable.innerHTML = `<tr><td colspan="6" class="px-4 py-6 text-center text-gray-400">No registered users found.</td></tr>`;
    } else {
      usersTable.innerHTML = users.map((u) => `
        <tr class="hover:bg-gray-50 transition">
          <td class="px-4 py-2.5 font-bold text-xs text-gray-900">${u.name}</td>
          <td class="px-4 py-2.5 text-xs text-gray-500 font-mono">${u.email}</td>
          <td class="px-4 py-2.5">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
              u.role === 'admin' ? 'bg-amber-100 text-amber-800' : u.role === 'vendor' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }">
              ${u.role}
            </span>
          </td>
          <td class="px-4 py-2.5">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
              ${u.isActive ? 'Active' : 'Disabled'}
            </span>
          </td>
          <td class="px-4 py-2.5 text-xs text-gray-400">${new Date(u.createdAt).toLocaleDateString()}</td>
          <td class="px-4 py-2.5 text-right space-x-1">
            <button onclick="handleToggleUserRole('${u._id}', '${u.role === 'vendor' ? 'customer' : 'vendor'}')" class="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold border border-gray-300">
              Toggle Role
            </button>
          </td>
        </tr>
      `).join('');
    }

    // 3. Categories Grid
    if (!state.categories || state.categories.length === 0) {
      await loadCategories();
    }
    const catGrid = document.getElementById('adminCategoriesGrid');
    if (state.categories.length === 0) {
      catGrid.innerHTML = `<div class="col-span-full py-6 text-center text-gray-400 text-xs">No categories created yet. Click "Add Category".</div>`;
    } else {
      catGrid.innerHTML = state.categories.map((c) => `
        <div class="bg-gray-50 p-3.5 rounded border border-gray-200 flex justify-between items-start">
          <div>
            <div class="font-bold text-xs text-gray-900">${c.name}</div>
            <p class="text-[11px] text-gray-500 mt-0.5 line-clamp-2">${c.description || 'No description'}</p>
            <span class="inline-block mt-2 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">${c.productCount || 0} products</span>
          </div>
          <button onclick="handleDeleteCategory('${c._id}')" class="text-gray-400 hover:text-red-700 text-xs p-1">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `).join('');
    }

    // 4. All Orders Audit
    const ordersRes = await api.getAllOrders();
    const orders = ordersRes.data.data;
    const ordersTable = document.getElementById('adminOrdersTableBody');
    if (orders.length === 0) {
      ordersTable.innerHTML = `<tr><td colspan="7" class="px-4 py-6 text-center text-gray-400">No orders placed on platform yet.</td></tr>`;
    } else {
      ordersTable.innerHTML = orders.map((o) => `
        <tr class="hover:bg-gray-50 transition">
          <td class="px-4 py-2.5 font-mono text-xs font-bold text-gray-900">${o.orderCode}</td>
          <td class="px-4 py-2.5 text-xs text-gray-700">${o.customer?.name || 'Customer'}</td>
          <td class="px-4 py-2.5 text-xs text-gray-600">${o.items?.length || 0} items</td>
          <td class="px-4 py-2.5 text-xs font-bold text-gray-900">₹${o.totalPrice.toLocaleString('en-IN')}</td>
          <td class="px-4 py-2.5 text-xs text-gray-500">${o.paymentMethod}</td>
          <td class="px-4 py-2.5">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-800">${o.orderStatus}</span>
          </td>
          <td class="px-4 py-2.5 text-right">
            <select onchange="handleUpdateOrderStatus('${o._id}', this.value)" class="text-xs bg-white border border-gray-300 rounded px-2 py-1">
              <option value="">Status</option>
              <option value="Delivered">Mark Delivered</option>
              <option value="Cancelled">Cancel Order</option>
            </select>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to load admin data', err);
  }
}

function switchAdminSubtab(subtab) {
  document.querySelectorAll('.admin-subtab').forEach((btn) => {
    if (btn.getAttribute('data-subtab') === subtab) {
      btn.classList.add('active', 'bg-blue-100', 'text-blue-800');
      btn.classList.remove('text-gray-600');
    } else {
      btn.classList.remove('active', 'bg-blue-100', 'text-blue-800');
      btn.classList.add('text-gray-600');
    }
  });

  document.querySelectorAll('.admin-view-sub').forEach((view) => view.classList.add('hidden'));
  document.getElementById(`admin-subtab-${subtab}`).classList.remove('hidden');
}

async function handleToggleUserRole(userId, newRole) {
  try {
    await api.updateUser(userId, { role: newRole });
    showToast(`User role updated to ${newRole}`, 'success');
    loadAdminData();
  } catch (err) {
    showToast(`Failed: ${err.message}`, 'error');
  }
}

// Category Creation
function openCategoryModal() {
  document.getElementById('categoryModal').classList.remove('hidden');
}

function closeCategoryModal() {
  document.getElementById('categoryModal').classList.add('hidden');
}

async function handleCreateCategory(e) {
  e.preventDefault();
  const name = document.getElementById('catName').value;
  const description = document.getElementById('catDescription').value;

  try {
    await api.createCategory({ name, description });
    showToast('Category created successfully', 'success');
    closeCategoryModal();
    loadCategories();
    loadAdminData();
  } catch (err) {
    showToast(`Category error: ${err.message}`, 'error');
  }
}

async function handleDeleteCategory(id) {
  if (!confirm('Are you sure you want to delete this category?')) return;
  try {
    await api.deleteCategory(id);
    showToast('Category deleted', 'success');
    loadCategories();
    loadAdminData();
  } catch (err) {
    showToast(`Delete failed: ${err.message}`, 'error');
  }
}

// Product Details & Review Modal (Classic Design)
async function openProductDetailModal(productId) {
  const modal = document.getElementById('productDetailModal');
  const content = document.getElementById('productDetailModalContent');
  content.innerHTML = '<div class="p-12 text-center text-gray-400"><i class="fa-solid fa-spinner fa-spin text-2xl"></i></div>';
  modal.classList.remove('hidden');

  try {
    const res = await api.getProductById(productId);
    const p = res.data.data;
    const vendorName = p.vendor?.vendorDetails?.storeName || p.vendor?.name || 'Verified Vendor';

    content.innerHTML = `
      <div class="relative p-6 sm:p-7">
        <button onclick="closeProductDetailModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <img src="${p.imageUrl}" class="w-full h-64 object-cover rounded border border-gray-200" />
          <div class="flex flex-col justify-between">
            <div>
              <span class="text-xs font-bold text-blue-700 uppercase tracking-wider">${p.category?.name || 'Catalog'}</span>
              <h2 class="text-lg font-bold text-gray-900 mt-1">${p.title}</h2>
              <div class="text-xs text-gray-500 mt-1"><i class="fa-solid fa-store mr-1 text-gray-400"></i> Merchant: <strong>${vendorName}</strong></div>

              <div class="mt-2.5 flex items-center space-x-2">
                <span class="text-amber-600 font-bold text-xs"><i class="fa-solid fa-star"></i> ${p.rating || '4.8'}</span>
                <span class="text-xs text-gray-400">(${p.numReviews || 0} reviews)</span>
                <span class="text-gray-300">•</span>
                <span class="text-xs ${p.stock > 0 ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}">
                  ${p.stock > 0 ? `${p.stock} units in stock` : 'Out of stock'}
                </span>
              </div>

              <div class="mt-3">
                <div class="text-xl font-bold text-gray-900">₹${p.price.toLocaleString('en-IN')}</div>
                ${p.comparePrice > p.price ? `<div class="text-xs text-gray-400 line-through">MRP: ₹${p.comparePrice.toLocaleString('en-IN')}</div>` : ''}
              </div>

              <p class="text-xs text-gray-600 mt-3 leading-relaxed">${p.description}</p>
            </div>

            <button onclick="addToCart('${p._id}'); closeProductDetailModal();" class="mt-5 w-full py-2.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition">
              <i class="fa-solid fa-cart-plus mr-1.5"></i> Add to Shopping Bag
            </button>
          </div>
        </div>

        <!-- Product Reviews Section -->
        <div class="mt-6 pt-5 border-t border-gray-200">
          <h4 class="font-bold text-xs text-gray-800 uppercase tracking-wider mb-2.5">Customer Reviews & Ratings</h4>
          <div class="space-y-2.5 max-h-44 overflow-y-auto pr-1">
            ${
              p.reviews && p.reviews.length > 0
                ? p.reviews.map((r) => `
                    <div class="p-2.5 bg-gray-50 rounded border border-gray-200 text-xs">
                      <div class="flex items-center justify-between">
                        <span class="font-bold text-gray-800">${r.user?.name || 'Customer'}</span>
                        <div class="text-amber-500 text-[11px]">
                          ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}
                        </div>
                      </div>
                      <p class="text-gray-600 mt-1">${r.comment}</p>
                    </div>
                  `).join('')
                : '<p class="text-xs text-gray-400">No reviews recorded yet for this product.</p>'
            }
          </div>

          <!-- Add Review Form -->
          ${
            state.currentUser
              ? `
                <form onsubmit="handleReviewSubmit(event, '${p._id}')" class="mt-3.5 pt-3 border-t border-gray-100">
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-xs font-bold text-gray-700">Submit a Verified Review</span>
                    <select id="reviewRatingInput" class="text-xs bg-gray-50 border border-gray-300 rounded px-2 py-0.5">
                      <option value="5">5 Stars - Excellent</option>
                      <option value="4">4 Stars - Good</option>
                      <option value="3">3 Stars - Average</option>
                      <option value="2">2 Stars - Poor</option>
                      <option value="1">1 Star - Terrible</option>
                    </select>
                  </div>
                  <div class="flex space-x-2">
                    <input type="text" id="reviewCommentInput" required placeholder="Write your feedback..." class="flex-1 text-xs px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded focus:ring-1 focus:ring-blue-600" />
                    <button type="submit" class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded transition">Submit</button>
                  </div>
                </form>
              `
              : '<p class="text-[11px] text-gray-400 mt-2.5">Please sign in to write a review.</p>'
          }
        </div>
      </div>
    `;
  } catch (err) {
    content.innerHTML = `<div class="p-5 text-red-700 text-xs">${err.message}</div>`;
  }
}

function closeProductDetailModal() {
  document.getElementById('productDetailModal').classList.add('hidden');
}

async function handleReviewSubmit(e, productId) {
  e.preventDefault();
  const rating = document.getElementById('reviewRatingInput').value;
  const comment = document.getElementById('reviewCommentInput').value;

  try {
    await api.addReview(productId, { rating, comment });
    showToast('Review submitted successfully!', 'success');
    openProductDetailModal(productId);
    loadProducts();
  } catch (err) {
    showToast(`Review failed: ${err.message}`, 'error');
  }
}

// Auth Modal
function openAuthModal(mode = 'login') {
  document.getElementById('authModal').classList.remove('hidden');
  switchAuthMode(mode);
}

function closeAuthModal() {
  document.getElementById('authModal').classList.add('hidden');
}

function switchAuthMode(mode) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const tabLogin = document.getElementById('authTabLogin');
  const tabRegister = document.getElementById('authTabRegister');

  if (mode === 'login') {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    tabLogin.className = 'flex-1 py-2 font-bold text-xs border-b-2 border-blue-600 text-blue-700 text-center';
    tabRegister.className = 'flex-1 py-2 font-bold text-xs text-gray-400 text-center';
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    tabRegister.className = 'flex-1 py-2 font-bold text-xs border-b-2 border-blue-600 text-blue-700 text-center';
    tabLogin.className = 'flex-1 py-2 font-bold text-xs text-gray-400 text-center';
  }
}

function toggleRegStoreField(role) {
  const field = document.getElementById('regStoreField');
  if (role === 'vendor') {
    field.classList.remove('hidden');
  } else {
    field.classList.add('hidden');
  }
}

async function handleAuthLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await api.login(email, password);
    api.setUser(res.data.data);
    state.currentUser = res.data.data;
    updateAuthUI();
    closeAuthModal();
    showToast(`Welcome back, ${res.data.data.name}!`, 'success');
  } catch (err) {
    showToast(`Login failed: ${err.message}`, 'error');
  }
}

async function handleAuthRegister(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const role = document.getElementById('regRole').value;
  const storeName = document.getElementById('regStoreName').value;

  try {
    const res = await api.register({
      name,
      email,
      password,
      role,
      storeName: role === 'vendor' ? storeName : undefined,
    });

    api.setUser(res.data.data);
    state.currentUser = res.data.data;
    updateAuthUI();
    closeAuthModal();
    showToast(`Account registered as ${role.toUpperCase()}!`, 'success');
  } catch (err) {
    showToast(`Registration failed: ${err.message}`, 'error');
  }
}

// Interactive API Explorer Logic
function renderApiExplorerEndpoints(filterActor = 'all') {
  const container = document.getElementById('apiEndpointList');

  const filtered = filterActor === 'all'
    ? API_ENDPOINTS
    : API_ENDPOINTS.filter((e) => e.actor === filterActor);

  container.innerHTML = filtered.map((item, idx) => {
    const actualIndex = API_ENDPOINTS.indexOf(item);
    const isSelected = actualIndex === state.selectedApiEndpointIndex;
    const methodColor = {
      GET: 'bg-green-100 text-green-800',
      POST: 'bg-blue-100 text-blue-800',
      PUT: 'bg-amber-100 text-amber-800',
      DELETE: 'bg-red-100 text-red-800',
    }[item.method] || 'bg-gray-100 text-gray-800';

    return `
      <div
        onclick="selectApiEndpoint(${actualIndex})"
        class="p-2.5 rounded border cursor-pointer transition ${
          isSelected
            ? 'bg-blue-50 border-blue-400 shadow-sm'
            : 'bg-white border-gray-200 hover:border-gray-300'
        }"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${methodColor}">${item.method}</span>
            <span class="font-mono text-xs font-semibold text-gray-800">${item.endpoint}</span>
          </div>
          <span class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
            item.actor === 'admin' ? 'bg-amber-100 text-amber-800' : item.actor === 'vendor' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
          }">${item.actor}</span>
        </div>
        <p class="text-[11px] text-gray-500 mt-1 line-clamp-1">${item.description}</p>
      </div>
    `;
  }).join('');
}

function filterApiActor(actor) {
  state.currentApiFilterActor = actor;
  document.querySelectorAll('.api-actor-btn').forEach((btn) => {
    if (btn.getAttribute('data-actor') === actor) {
      btn.classList.add('active', 'bg-blue-100', 'text-blue-800');
      btn.classList.remove('text-gray-600');
    } else {
      btn.classList.remove('active', 'bg-blue-100', 'text-blue-800');
      btn.classList.add('text-gray-600');
    }
  });
  renderApiExplorerEndpoints(actor);
}

function selectApiEndpoint(index) {
  state.selectedApiEndpointIndex = index;
  renderApiExplorerEndpoints();

  const item = API_ENDPOINTS[index];
  if (!item) return;

  const methodBadge = document.getElementById('runnerMethodBadge');
  const endpointPath = document.getElementById('runnerEndpointPath');
  const requestBody = document.getElementById('runnerRequestBody');
  const authNote = document.getElementById('runnerAuthNote');

  methodBadge.textContent = item.method;
  methodBadge.className = `px-2 py-0.5 rounded text-xs font-mono font-bold ${
    item.method === 'GET' ? 'bg-green-600 text-white' : item.method === 'POST' ? 'bg-blue-600 text-white' : item.method === 'PUT' ? 'bg-amber-600 text-white' : 'bg-red-600 text-white'
  }`;

  endpointPath.textContent = item.endpoint;
  authNote.textContent = item.authRequired ? `Auth: Role Header Required (${item.actor.toUpperCase()})` : 'Auth: Public';

  if (item.body) {
    requestBody.value = JSON.stringify(item.body, null, 2);
  } else {
    requestBody.value = '';
  }

  document.getElementById('responseStatusBadge').textContent = 'Status: Ready';
  document.getElementById('responseTimeBadge').textContent = 'Time: -';
  document.getElementById('runnerResponseBody').textContent = '// Click "Send Request" to test this endpoint';
}

async function executeApiRequest() {
  const item = API_ENDPOINTS[state.selectedApiEndpointIndex];
  if (!item) return;

  const btn = document.getElementById('sendApiRequestBtn');
  const statusBadge = document.getElementById('responseStatusBadge');
  const timeBadge = document.getElementById('responseTimeBadge');
  const responseBody = document.getElementById('runnerResponseBody');

  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i> Sending...';

  let rawEndpoint = item.endpoint;

  // Replace placeholders if present
  if (rawEndpoint.includes('REPLACE_WITH_ORDER_ID')) {
    const ordersRes = await api.getMyOrders().catch(() => null);
    if (ordersRes && ordersRes.data.data.length > 0) {
      rawEndpoint = rawEndpoint.replace('REPLACE_WITH_ORDER_ID', ordersRes.data.data[0]._id);
    }
  }

  let body = null;
  const rawBodyText = document.getElementById('runnerRequestBody').value.trim();
  if (['POST', 'PUT', 'PATCH'].includes(item.method) && rawBodyText) {
    try {
      body = JSON.parse(rawBodyText);
    } catch (e) {
      alert('Invalid JSON in request payload');
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-paper-plane mr-1.5"></i> Send Request';
      return;
    }
  }

  const endpointRelative = rawEndpoint.replace('/api', '');

  try {
    const res = await api.request(endpointRelative, {
      method: item.method,
      body,
    });

    statusBadge.textContent = `Status: ${res.status} OK`;
    statusBadge.className = 'font-mono text-emerald-400 font-bold';
    timeBadge.textContent = `Time: ${res.duration}ms`;
    responseBody.textContent = JSON.stringify(res.data, null, 2);
  } catch (err) {
    statusBadge.textContent = `Status: ${err.status || 500} Error`;
    statusBadge.className = 'font-mono text-rose-400 font-bold';
    timeBadge.textContent = `Time: ${err.duration || 0}ms`;
    responseBody.textContent = JSON.stringify(err.data || { error: err.message }, null, 2);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-paper-plane mr-1.5"></i> Send Request';
  }
}

