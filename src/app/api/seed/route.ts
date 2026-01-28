import { NextResponse } from 'next/server';
import { seedDatabase } from '../../../../lib/seed';
import User             from '../../../../models/User';

export async function GET() {
  try {
    await seedDatabase();
    return NextResponse.json({ 
      success: true, 
      message: '✅ Database seeded!' 
    });
  } catch (error) {
    let errorMessage = 'An unexpected error occurred';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    console.error('Seed error:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
    }, { status: 500 });
  }
}

// NOTE: If you want to create a tutor user, add this to your seed function:
/*
const tutorEmail = 'tutor@example.com';
let tutorUser = await User.findOne({ email: tutorEmail });

if (!tutorUser) {
  console.log('Creating tutor user...');
  
  tutorUser = await User.create({
    clerkUserId: `tutor_${Date.now()}`,
    email: tutorEmail,
    firstName: 'John',
    lastName: 'Tutor',
    role: 'tutor',
    phone: '+237123456789',
    status: 'active',
    subjects: ['Mathematics', 'Physics', 'Chemistry'],
  });
  
  console.log('✅ Tutor user created');
}
*/
