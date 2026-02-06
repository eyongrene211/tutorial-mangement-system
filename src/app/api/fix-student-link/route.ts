import { NextResponse } from 'next/server';
import connectDB        from '@/lib/mongodb';
import Student          from '@/models/Student';

export async function GET() {
  try {
    await connectDB();
    
    console.log('🔧 Fixing student-parent links...');
    
    // Link payment student to parent
    const result1 = await Student.updateOne(
      { _id: '6976127b6d71b3ef136a7808' }, // Alice Johnson
      { 
        $set: { 
          parentUser: '697611db6d71b3ef136a77eb' // Your parent ID
        } 
      }
    );
    
    console.log('✅ Alice Johnson linked:', result1);
    
    // Link dashboard student to parent (if different)
    const result2 = await Student.updateOne(
      { _id: '697360b878e0f44007361900' }, // Fofana Doe
      { 
        $set: { 
          parentUser: '697611db6d71b3ef136a77eb' 
        } 
      }
    );
    
    console.log('✅ Fofana Doe linked:', result2);

    return NextResponse.json({ 
      success: true, 
      message: 'All students linked to parent',
      updates: [result1, result2]
    });
  } catch (error) {
    console.error('Fix error:', error);
    return NextResponse.json({ error: 'Fix failed' }, { status: 500 });
  }
}
