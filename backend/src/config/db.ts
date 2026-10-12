import mongoose from 'mongoose';
import dns from 'dns';

// Fix for Windows Node.js querySrv ECONNREFUSED on MongoDB Atlas srv URLs
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (_) {}

let isConnected = false;

export const connectDB = async (): Promise<void> => {
  const mongoUri =
    process.env.MONGODB_URI ||
    'mongodb+srv://t87575548_db_user:PdA1a8pzn4rIGELB@cluster0.0epokyl.mongodb.net/watchrealm?appName=Cluster0&compressors=zlib';

  try {
    const conn = await mongoose.connect(mongoUri, {
      dbName: 'watchrealm',
      serverSelectionTimeoutMS: 10000,
    });
    isConnected = true;
    console.log(`[WatchRealm MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
  } catch (error) {
    isConnected = false;
    console.warn(`[WatchRealm MongoDB] Connection warning: ${(error as Error).message}`);
    console.warn(`[WatchRealm MongoDB] Server will continue running with memory fallback.`);
  }
};

export const isDBConnected = (): boolean => isConnected;
export const getDBName = (): string => mongoose.connection?.name || 'none';
