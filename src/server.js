const dotenv = require('dotenv');

// Load environment variables before anything else
dotenv.config();

const connectDB = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start HTTP server
const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(` ShopSphere Enterprise Platform Running`);
      console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(` Port: ${PORT}`);
      console.log(` URL:  http://localhost:${PORT}`);
      console.log(` Health: http://localhost:${PORT}/api/health`);
      console.log(`=======================================================`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error(`Unhandled Rejection Error: ${err.message}`);
      // Close server & exit process
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error(`Failed to initialize server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

