import mongoose from 'mongoose';

async function resetDatabase() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    if (!db) {
      throw new Error('Database connection not established');
    }

    // Collections to reset
    const collections = ['users', 'students', 'grades', 'attendances'];

    console.log('\n🗑️  Clearing collections...\n');

    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();

        if (count > 0) {
          await collection.drop();
          console.log(`✅ Dropped ${collectionName} (${count} documents removed)`);
        } else {
          console.log(`ℹ️  ${collectionName} is already empty`);
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes('ns not found')) {
          console.log(`ℹ️  ${collectionName} collection does not exist`);
        } else {
          console.log(`⚠️  Error with ${collectionName}:`, error);
        }
      }
    }

    console.log('\n🎉 Database reset completed successfully!');
    console.log('ℹ️  Your Clerk users are still intact');
    console.log('ℹ️  MongoDB collections will be recreated automatically on next login\n');

    await mongoose.connection.close();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  }
}

// Run the reset
resetDatabase();
