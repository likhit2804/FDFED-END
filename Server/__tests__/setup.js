import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer;

// Called before all tests
export async function connect() {
  // Check if mongoose is already connected before trying to connect again
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // Check if mongoServer is already running
  if (!mongoServer) {
    mongoServer = await MongoMemoryServer.create();
  }
  
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}

// Called after all tests
export async function disconnect() {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}

// Called between test files to clean collections
export async function clearDatabase() {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
}