import { NextResponse } from 'next/server';
import { auth }         from '@clerk/nextjs/server';
import mongoose         from 'mongoose';
import dbConnect        from 'lib/mongodb';
export async function POST() {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    await dbConnect();

    const db = mongoose.connection.db;

    if (!db) {
      throw new Error('Database connection not established');
    }

    // Collections to reset
    const collections = ['users', 'students', 'grades', 'attendances'];
    const results: Record<string, string> = {};

    console.log('🗑️  Clearing collections...');

    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();

        if (count > 0) {
          await collection.drop();
          results[collectionName] = `✅ Dropped (${count} documents removed)`;
          console.log(`✅ Dropped ${collectionName}`);
        } else {
          results[collectionName] = 'ℹ️  Already empty';
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes('ns not found')) {
          results[collectionName] = 'ℹ️  Does not exist';
        } else {
          results[collectionName] = '⚠️  Error: ' + String(error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: '🎉 Database reset completed successfully!',
      results,
      note: 'Please refresh your page and sign in again',
    });
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
