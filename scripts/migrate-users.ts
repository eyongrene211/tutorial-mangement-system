import connectDB from '../lib/mongodb';
import User      from '../models/User';

async function migrateUsers() {
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
    console.log('\n📋 All users after migration:');
    users.forEach(user => {
      console.log(`\n- ${user.name}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Phone: "${user.phone}"`);
      console.log(`  Address: "${user.address}"`);
      console.log(`  Status: ${user.status}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateUsers();
