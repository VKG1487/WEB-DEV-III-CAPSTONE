const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Customer, Admin)
exports.createOrder = asyncHandler(async (req, res, next) => {
  const { items, shippingAddress, paymentMethod, notes } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return next(new ErrorResponse('Order must contain at least one product item', 400));
  }

  // Parse shipping address if provided as a string or object
  let formattedAddress = {};
  if (typeof shippingAddress === 'string') {
    formattedAddress = {
      fullName: req.user.name || 'Valued Customer',
      address: shippingAddress,
      city: shippingAddress.split(',')[0] ? shippingAddress.split(',')[0].trim() : 'New Delhi',
      postalCode: '110001',
      country: 'India',
      phone: req.user.phone || '9999999999',
    };
  } else if (typeof shippingAddress === 'object' && shippingAddress !== null) {
    formattedAddress = {
      fullName: shippingAddress.fullName || req.user.name,
      address: shippingAddress.address || 'Standard Address',
      city: shippingAddress.city || 'City',
      state: shippingAddress.state || '',
      postalCode: shippingAddress.postalCode || '100001',
      country: shippingAddress.country || 'India',
      phone: shippingAddress.phone || req.user.phone || '',
    };
  } else {
    return next(new ErrorResponse('Please provide a valid shipping address string or object', 400));
  }

  // Resolve and validate each product item from database
  const orderItems = [];
  let calculatedItemsPrice = 0;

  for (const item of items) {
    const prodId = item.productId || item.product || item.id;
    const quantity = Number(item.quantity || item.qty || 1);

    if (!prodId) {
      return next(new ErrorResponse('Each order item must specify a valid productId', 400));
    }

    const product = await Product.findById(prodId);
    if (!product) {
      return next(new ErrorResponse(`Product not found with id ${prodId}`, 404));
    }

    if (!product.isActive) {
      return next(new ErrorResponse(`Product "${product.title}" is currently not available for purchase`, 400));
    }

    if (product.stock < quantity) {
      return next(
        new ErrorResponse(
          `Insufficient stock for "${product.title}". Requested: ${quantity}, Available: ${product.stock}`,
          400
        )
      );
    }

    // Decrement stock
    product.stock -= quantity;
    await product.save();

    const itemTotal = product.price * quantity;
    calculatedItemsPrice += itemTotal;

    orderItems.push({
      product: product._id,
      title: product.title,
      quantity,
      price: product.price,
      vendor: product.vendor,
      imageUrl: product.imageUrl,
    });
  }

  // Calculate pricing breakdown
  const taxPrice = Math.round(calculatedItemsPrice * 0.18 * 100) / 100; // 18% GST
  const shippingPrice = calculatedItemsPrice > 999 ? 0 : 50; // Free shipping over 999
  const totalPrice = Math.round((calculatedItemsPrice + taxPrice + shippingPrice) * 100) / 100;

  const order = await Order.create({
    customer: req.user.id,
    items: orderItems,
    shippingAddress: formattedAddress,
    paymentMethod: paymentMethod || 'COD',
    paymentStatus: paymentMethod === 'Card' || paymentMethod === 'UPI' ? 'Completed' : 'Pending',
    itemsPrice: calculatedItemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    orderStatus: 'Pending',
    notes: notes || '',
  });

  res.status(201).json({
    success: true,
    message: 'Order placed successfully',
    data: {
      orderId: order.orderCode,
      _id: order._id,
      status: order.orderStatus,
      itemsCount: order.items.length,
      totalPrice: order.totalPrice,
      paymentMethod: order.paymentMethod,
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt,
    },
  });
});

// @desc    Get logged in user's orders
// @route   GET /api/orders/my-orders
// @access  Private (Customer, Admin)
exports.getMyOrders = asyncHandler(async (req, res, next) => {
  const orders = await Order.find({ customer: req.user.id })
    .populate('items.product', 'title imageUrl price')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders,
  });
});

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private (Owner customer, Associated vendor, Admin)
exports.getOrderById = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('customer', 'name email phone')
    .populate('items.product', 'title imageUrl price sku')
    .populate('items.vendor', 'name vendorDetails email');

  if (!order) {
    return next(new ErrorResponse(`Order not found with id of ${req.params.id}`, 404));
  }

  // Check authorization: Admin, customer owner, or vendor of any item
  const isCustomer = order.customer._id.toString() === req.user.id;
  const isVendorOfItem = order.items.some(
    (item) => item.vendor && item.vendor._id.toString() === req.user.id
  );
  const isAdmin = req.user.role === 'admin';

  if (!isCustomer && !isVendorOfItem && !isAdmin) {
    return next(new ErrorResponse('Not authorized to view this order details', 403));
  }

  res.status(200).json({
    success: true,
    data: order,
  });
});

// @desc    Get vendor's orders (orders containing vendor's products)
// @route   GET /api/orders/vendor/my-orders
// @access  Private (Vendor)
exports.getVendorOrders = asyncHandler(async (req, res, next) => {
  const orders = await Order.find({ 'items.vendor': req.user.id })
    .populate('customer', 'name email phone')
    .populate('items.product', 'title imageUrl price')
    .sort('-createdAt');

  // Filter items in each order to vendor's items only for clear vendor accounting
  const vendorOrders = orders.map((order) => {
    const orderObj = order.toObject();
    orderObj.vendorItems = orderObj.items.filter(
      (item) => item.vendor && item.vendor.toString() === req.user.id
    );
    orderObj.vendorSubtotal = orderObj.vendorItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
    return orderObj;
  });

  res.status(200).json({
    success: true,
    count: vendorOrders.length,
    data: vendorOrders,
  });
});

// @desc    Get all orders (Admin only)
// @route   GET /api/orders
// @access  Private (Admin)
exports.getAllOrders = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;

  let queryObj = {};
  if (req.query.status) {
    queryObj.orderStatus = req.query.status;
  }

  const total = await Order.countDocuments(queryObj);
  const orders = await Order.find(queryObj)
    .populate('customer', 'name email')
    .populate('items.vendor', 'name vendorDetails')
    .sort('-createdAt')
    .skip(startIndex)
    .limit(limit);

  res.status(200).json({
    success: true,
    count: orders.length,
    pagination: {
      currentPage: page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      totalRecords: total,
    },
    data: orders,
  });
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Vendor, Admin)
exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const allowedStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  if (!status || !allowedStatuses.includes(status)) {
    return next(new ErrorResponse(`Invalid status. Allowed values: [${allowedStatuses.join(', ')}]`, 400));
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new ErrorResponse(`Order not found with id of ${req.params.id}`, 404));
  }

  // Restock products if order is cancelled
  if (status === 'Cancelled' && order.orderStatus !== 'Cancelled') {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }
    order.cancelledAt = Date.now();
  }

  if (status === 'Delivered') {
    order.deliveredAt = Date.now();
    order.paymentStatus = 'Completed';
  }

  order.orderStatus = status;
  await order.save();

  res.status(200).json({
    success: true,
    message: `Order status updated to ${status}`,
    data: order,
  });
});

// @desc    Cancel order (Customer if still pending)
// @route   PUT /api/orders/:id/cancel
// @access  Private (Customer, Admin)
exports.cancelOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new ErrorResponse(`Order not found with id of ${req.params.id}`, 404));
  }

  if (order.customer.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to cancel this order', 403));
  }

  if (order.orderStatus === 'Shipped' || order.orderStatus === 'Delivered') {
    return next(new ErrorResponse(`Cannot cancel order that is already ${order.orderStatus}`, 400));
  }

  if (order.orderStatus === 'Cancelled') {
    return next(new ErrorResponse('Order is already cancelled', 400));
  }

  // Restock items
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity },
    });
  }

  order.orderStatus = 'Cancelled';
  order.cancelledAt = Date.now();
  await order.save();

  res.status(200).json({
    success: true,
    message: 'Order cancelled successfully and inventory restored',
    data: order,
  });
});

