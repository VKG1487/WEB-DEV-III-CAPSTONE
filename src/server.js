const http = require('http');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

// Load environment variables before anything else (Lecture 29-30)
dotenv.config();

const connectDB = require('./config/db');
const app = require('./app');
const appEvents = require('./utils/eventEmitter');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start HTTP server with Socket.IO
const startServer = async () => {
  try {
    await connectDB();

    // Create HTTP server (Lecture 7)
    const server = http.createServer(app);

    // Initialize Socket.IO for real-time bidirectional communication (Lecture 39-40)
    const io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (socket) => {
      console.log(`[Socket.IO Client Connected]: ${socket.id}`);

      socket.on('disconnect', () => {
        console.log(`[Socket.IO Client Disconnected]: ${socket.id}`);
      });
    });

    // Bridge EventEmitter to WebSockets (Lecture 38 & 40)
    appEvents.on('order:created', (order) => {
      io.emit('order:created', {
        orderId: order.orderCode,
        totalPrice: order.totalPrice,
        customer: order.shippingAddress?.fullName || 'Customer',
        timestamp: new Date(),
      });
    });

    appEvents.on('order:status_updated', (data) => {
      io.emit('order:status_updated', {
        orderCode: data.orderCode,
        orderStatus: data.orderStatus,
        timestamp: new Date(),
      });
    });

    appEvents.on('product:stock_alert', (product) => {
      io.emit('product:stock_alert', {
        title: product.title,
        stock: product.stock,
      });
    });

    server.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(` ShopSphere Enterprise Platform Running`);
      console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(` Port: ${PORT}`);
      console.log(` URL:  http://localhost:${PORT}`);
      console.log(` WebSockets: Socket.IO active`);
      console.log(` Health: http://localhost:${PORT}/api/health`);
      console.log(`=======================================================`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error(`Unhandled Rejection Error: ${err.message}`);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error(`Failed to initialize server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
