import connectDB from './mongodb';
import User      from '../models/User';
import Student   from '../models/Student';

export async function createTestUsers() {
  try {
    await connectDB();

    console.log('👥 Creating test users...');

    // Get first student for parent account
    const student = await Student.findOne({ firstName: 'Jean' });

    if (!student) {
      throw new Error('No students found. Run seed first!');
    }

    // Clear existing test users
    await User.deleteMany({});

    const users = await User.insertMany([
      // ADMIN
      {
        clerkId: 'admin_test_001',
        email: 'admin@tutorial.com',
        name: 'Mr. Bertrand (Admin)',
        role: 'admin',
      },
      // TEACHER
      {
        clerkId: 'teacher_test_001',
        email: 'teacher@tutorial.com',
        name: 'Assistant Teacher',
        role: 'teacher',
      },
      // PARENT
      {
        clerkId: 'parent_test_001',
        email: 'marie.dupont@email.com',
        name: 'Marie Dupont (Parent)',
        role: 'parent',
        studentId: student._id,
      },
    ]);

    console.log('✅ Created test users:');
    users.forEach(user => {
      console.log(`  - ${user.role.toUpperCase()}: ${user.email}`);
    });

    return users;
  } catch (error) {
    console.error('❌ Error creating users:', error);
    throw error;
  }
}