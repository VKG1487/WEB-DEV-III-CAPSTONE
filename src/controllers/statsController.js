const asyncHandler = require('../utils/asyncHandler');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

// @desc    Get system-wide platform statistics
// @route   GET /api/stats/admin
// @access  Private (Admin)
exports.getAdminStats = asyncHandler(async (req, res, next) => {
  const [
    totalUsers,
    totalVendors,
    totalCustomers,
    totalProducts,
    totalOrders,
    revenueData,
    ordersByStatus,
    recentOrders,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'vendor' }),
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } },
    ]),
    Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
    ]),
    Order.find()
      .populate('customer', 'name email')
      .sort('-createdAt')
      .limit(5),
  ]);

  const totalRevenue = revenueData.length > 0 ? Math.round(revenueData[0].totalRevenue * 100) / 100 : 0;

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalVendors,
      totalCustomers,
      totalProducts,
      totalOrders,
      totalRevenue,
      ordersByStatus: ordersByStatus.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      recentOrders,
    },
  });
});

// @desc    Get vendor-specific analytics
// @route   GET /api/stats/vendor
// @access  Private (Vendor)
exports.getVendorStats = asyncHandler(async (req, res, next) => {
  const vendorId = req.user._id;

  const [totalProducts, lowStockProducts, vendorOrders] = await Promise.all([
    Product.countDocuments({ vendor: vendorId }),
    Product.countDocuments({ vendor: vendorId, stock: { $lte: 5 } }),
    Order.find({ 'items.vendor': vendorId }),
  ]);

  let totalEarnings = 0;
  let itemsSold = 0;

  vendorOrders.forEach((order) => {
    if (order.orderStatus !== 'Cancelled') {
      order.items.forEach((item) => {
        if (item.vendor && item.vendor.toString() === vendorId.toString()) {
          totalEarnings += item.price * item.quantity;
          itemsSold += item.quantity;
        }
      });
    }
  });

  res.status(200).json({
    success: true,
    data: {
      totalProducts,
      lowStockProducts,
      totalOrders: vendorOrders.length,
      itemsSold,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
    },
  });
});

