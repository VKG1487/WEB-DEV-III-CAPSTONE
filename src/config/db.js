const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shopsphere_db';
  try {
    const conn = await mongoose.connect(mongoUri, {
      autoIndex: true,
    });
    console.log(`[MongoDB Connected]: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('\n=============================================================');
    console.error(' [MongoDB Connection Error]');
    console.error(` Could not connect to MongoDB at: ${mongoUri}`);
    console.error(` Error detail: ${error.message}`);
    console.error('\n Suggestions to resolve:');
    console.error(' 1. Ensure your local MongoDB service is running:');
    console.error('    - Windows: Run `net start MongoDB` or start "MongoDB" in Services');
    console.error('    - macOS: Run `brew services start mongodb/brew/mongodb-community`');
    console.error('    - Linux: Run `sudo systemctl start mongod`');
    console.error(' 2. Or connect to MongoDB Atlas by setting MONGO_URI in your .env file:');
    console.error('    MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/shopsphere_db');
    console.error('=============================================================\n');
    process.exit(1);
  }
};

module.exports = connectDB;

