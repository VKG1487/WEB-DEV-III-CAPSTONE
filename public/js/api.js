// API Client Module with Header-Based Role & User Authentication
const API_BASE = '/api';

const api = {
  getUser() {
    const raw = localStorage.getItem('shopsphere_user');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  setUser(user) {
    if (user) {
      localStorage.setItem('shopsphere_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('shopsphere_user');
    }
  },

  async request(endpoint, options = {}) {
    const user = this.getUser();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (user) {
      headers['x-user-id'] = user._id || user.id;
      headers['role'] = user.role;
    }

    const config = {
      ...options,
      headers,
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    const startTime = performance.now();
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const duration = Math.round(performance.now() - startTime);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.error || 'Network request failed');
      error.status = response.status;
      error.data = data;
      error.duration = duration;
      throw error;
    }

    return {
      status: response.status,
      duration,
      data,
    };
  },

  // Auth endpoints
  login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },

  register(payload) {
    return this.request('/auth/register', {
      method: 'POST',
      body: payload,
    });
  },

  getProfile() {
    return this.request('/auth/me');
  },

  updateProfile(payload) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: payload,
    });
  },

  // Products
  getProducts(params = '') {
    return this.request(`/products${params}`);
  },

  getProductById(id) {
    return this.request(`/products/${id}`);
  },

  createProduct(payload) {
    return this.request('/products', {
      method: 'POST',
      body: payload,
    });
  },

  updateProduct(id, payload) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: payload,
    });
  },

  deleteProduct(id) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  getVendorProducts() {
    return this.request('/products/vendor/my-products');
  },

  addReview(productId, payload) {
    return this.request(`/products/${productId}/reviews`, {
      method: 'POST',
      body: payload,
    });
  },

  // Orders
  createOrder(payload) {
    return this.request('/orders', {
      method: 'POST',
      body: payload,
    });
  },

  getMyOrders() {
    return this.request('/orders/my-orders');
  },

  getVendorOrders() {
    return this.request('/orders/vendor/my-orders');
  },

  getAllOrders() {
    return this.request('/orders');
  },

  updateOrderStatus(orderId, status) {
    return this.request(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: { status },
    });
  },

  cancelOrder(orderId) {
    return this.request(`/orders/${orderId}/cancel`, {
      method: 'PUT',
    });
  },

  // Categories
  getCategories() {
    return this.request('/categories');
  },

  createCategory(payload) {
    return this.request('/categories', {
      method: 'POST',
      body: payload,
    });
  },

  deleteCategory(id) {
    return this.request(`/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // Admin stats & users
  getAdminStats() {
    return this.request('/stats/admin');
  },

  getVendorStats() {
    return this.request('/stats/vendor');
  },

  getUsers() {
    return this.request('/users');
  },

  updateUser(id, payload) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: payload,
    });
  },

  deleteUser(id) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};

