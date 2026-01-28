import { NextResponse } from 'next/server';
import connectDB        from '../../../../lib/mongodb';
import User             from '../../../../models/User';

export async function GET() {
  try {
    await connectDB();
    
    console.log('🔄 Starting user migration...');
    
    // Update all users that don't have the new fields
    const result = await User.updateMany(
      {
        $or: [
          { phone: { $exists: false } },
          { address: { $exists: false } },
          { status: { $exists: false } }
        ]
      },
      {
        $set: {
          phone: '',
          address: '',
          status: 'active'
        }
      }
    );
    
    console.log(`✅ Migration complete! Updated ${result.modifiedCount} users`);
    
    // Verify
    const users = await User.find({});
    const userList = users.map(user => ({
      name: user.name || `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone: user.phone,
      address: user.address || 'N/A',
      status: user.status,
    }));
    
    return NextResponse.json({
      success: true,
      message: `Migration complete! Updated ${result.modifiedCount} users`,
      users: userList,
    });
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json(
      { success: false, error: 'Migration failed' },
      { status: 500 }
    );
  }
}
