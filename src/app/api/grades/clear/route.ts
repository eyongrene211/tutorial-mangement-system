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
    
    // Drop grades collection
    if (mongoose.connection.db) {
      await mongoose.connection.db.collection('grades').drop();
    }
    
    return NextResponse.json({ 
      message: '✅ All grades cleared successfully!' 
    });
  } catch (error) {
    console.error('Error clearing grades:', error);
    return NextResponse.json({ 
      message: 'Grades collection cleared or already empty' 
    });
  }
}
