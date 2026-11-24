const EventEmitter = require('events');

// Custom EventEmitter class implementing Unit 4 Lecture 38
class AppEventEmitter extends EventEmitter {}

const appEvents = new AppEventEmitter();

// Event Listener 1: Order Creation
appEvents.on('order:created', (order) => {
  console.log(`[Event: order:created] Order ${order.orderCode} placed by customer ${order.customer}. Total: ₹${order.totalPrice}`);
});

// Event Listener 2: Order Status Update
appEvents.on('order:status_updated', (data) => {
  console.log(`[Event: order:status_updated] Order ${data.orderCode} status changed to "${data.orderStatus}"`);
});

// Event Listener 3: Low Inventory Stock Alert
appEvents.on('product:stock_alert', (product) => {
  console.warn(`[Event: product:stock_alert] WARNING: Product "${product.title}" has critically low stock: ${product.stock} units remaining.`);
});

// Event Listener 4: User Registration
appEvents.on('user:registered', (user) => {
  console.log(`[Event: user:registered] New ${user.role} registered: ${user.name} (${user.email})`);
});

module.exports = appEvents;

