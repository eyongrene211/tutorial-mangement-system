import { NextResponse } from 'next/server';
import { auth }         from '@clerk/nextjs/server';
import mongoose         from 'mongoose';
import dbConnect        from 'lib/mongodb';
export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database not connected');
    }

    console.log('🗑️  Deleting users collection...');

    try {
      const usersCollection = db.collection('users');
      const count = await usersCollection.countDocuments();
      
      // Drop the entire collection (removes all indexes too)
      await usersCollection.drop();
      
      console.log(`✅ Deleted users collection (${count} users removed)`);
      
      return NextResponse.json({
        success: true,
        message: `✅ Successfully deleted ${count} users and all indexes`,
        note: 'Please refresh the page to create a new user',
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('ns not found')) {
        return NextResponse.json({
          success: true,
          message: 'Users collection already empty',
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ Delete failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
