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
      
    // Safely handle unknown error types
    let errorMessage = 'An unexpected error occurred';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    console.error('Seed error:', error); // Log for debugging
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
    }, { status: 500 });
  }
}

// Add this AFTER creating admin user, BEFORE creating students

// CREATE SAMPLE TUTOR
const tutorEmail = 'tutor@example.com';
let tutorUser = await User.findOne({ email: tutorEmail });

if (!tutorUser) {
  console.log('Creating tutor user...');
  
  // You need to manually create this user in Clerk first!
  // Go to Clerk Dashboard -> Users -> Add User
  // Email: tutor@example.com
  // Then get the Clerk ID and paste it here
  
  tutorUser = await User.create({
    clerkId: 'YOUR_CLERK_ID_HERE', // Replace with actual Clerk ID
    email: tutorEmail,
    firstName: 'John',
    lastName: 'Tutor',
    role: 'tutor',
    subjects: ['Mathematics', 'Physics', 'Chemistry'], // Assign subjects
  });
  
  console.log('✅ Tutor user created');
} else {
  console.log('Tutor user already exists');
}
