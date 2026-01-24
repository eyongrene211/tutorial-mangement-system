import { NextResponse }    from 'next/server';
import { createTestUsers } from '../../../../lib/create-test-users';
export async function GET() {
  try {
    const users = await createTestUsers();
    return NextResponse.json({ 
      success: true, 
      message: '✅ Test users created!',
      users: users.map(u => ({ email: u.email, role: u.role }))
    });
  } catch (error) {
    // Properly handle unknown error type
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    console.error('Create users error:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
    }, { status: 500 });
  }
}