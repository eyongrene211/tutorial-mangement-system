import connectDB from './mongodb';
import User      from '../models/User';

async function fixExistingUsers() {
  try {
    await connectDB();
    
    // Add missing fields to all existing users
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
    
    console.log(`✅ Fixed ${result.modifiedCount} users`);
    process.exit(0);
  } catch (error) {
    console.error('Error fixing users:', error);
    process.exit(1);
  }
}

fixExistingUsers();
