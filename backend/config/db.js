import mongoose from 'mongoose';

/**
 * Connect to MongoDB database via Mongoose
 * Reads MONGODB_URI from environment variables
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tkart_db';

  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: true,
      tls: true,
      tlsAllowInvalidCertificates: false,
    });

    console.log(`=========================================`);
    console.log(`  MongoDB Database Connected!            `);
    console.log(`  Host:     ${conn.connection.host}      `);
    console.log(`  Database: ${conn.connection.name}      `);
    console.log(`=========================================`);
    return conn;
  } catch (error) {
    console.error(`=========================================`);
    console.error(`  MongoDB Connection Error:`);
    console.error(`  Message: ${error.message}`);
    console.error(`-----------------------------------------`);
    console.error(`  Troubleshooting Tips:`);
    console.error(`  1. If using MongoDB Atlas:`);
    console.error(`     - Ensure your current IP is whitelisted under Network Access in Atlas.`);
    console.error(`     - Verify your db user credentials in backend/.env.`);
    console.error(`  2. If using local MongoDB:`);
    console.error(`     - Ensure MongoDB Server service is running (net start MongoDB).`);
    console.error(`=========================================`);
    // Do not terminate process immediately in development so health check can report db status
    return null;
  }
};

export default connectDB;
