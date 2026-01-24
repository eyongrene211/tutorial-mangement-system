import connectDB  from './mongodb';
import Student    from '../models/Student';
import Attendance from '../models/Attendance';
import Payment    from '../models/Payment';
import Grade      from '../models/Grade';

export async function seedDatabase() {
  try {
    await connectDB();

    console.log('🌱 Starting seed...');

    // Clear existing data
    await Student.deleteMany({});
    await Attendance.deleteMany({});
    await Payment.deleteMany({});
    await Grade.deleteMany({});

    // Create students
    const students = await Student.insertMany([
      {
        firstName: 'Jean',
        lastName: 'Dupont',
        dateOfBirth: new Date('2010-05-15'),
        gender: 'Male',
        classLevel: 'Form 3',
        parentInfo: {
          name: 'Marie Dupont',
          phone: '+237677123456',
          email: 'marie.dupont@email.com',
        },
        address: 'Akwa, Douala',
        status: 'active',
      },
      {
        firstName: 'Sandra',
        lastName: 'Fotso',
        dateOfBirth: new Date('2011-08-22'),
        gender: 'Female',
        classLevel: 'Form 2',
        parentInfo: {
          name: 'Paul Fotso',
          phone: '+237699876543',
          email: 'paul.fotso@email.com',
        },
        address: 'Bonapriso, Douala',
        status: 'active',
      },
      {
    firstName: 'Emmanuel',
    lastName: 'Kamga',
    dateOfBirth: new Date('2012-03-10'),
    gender: 'Male',
    classLevel: 'Form 1',  // ← Changed from 'CM2' to 'Form 1'
    parentInfo: {
      name: 'Grace Kamga',
      phone: '+237655445566',
    },
    address: 'Bonanjo, Douala',
    status: 'active',
},
    ]);

    console.log(`✅ Created ${students.length} students`);

    // Create attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await Attendance.insertMany([
      { student: students[0]._id, date: today, status: 'present' },
      { student: students[1]._id, date: today, status: 'present' },
      { student: students[2]._id, date: today, status: 'absent', notes: 'Sick' },
    ]);

    console.log('✅ Created attendance');

    // Create payments
    await Payment.insertMany([
      {
        student: students[0]._id,
        amount: 15000,
        monthYear: '2026-01',
        paymentDate: new Date('2026-01-05'),
        paymentMethod: 'cash',
        receiptNumber: 'REC-2026-01-001',
      },
      {
        student: students[1]._id,
        amount: 15000,
        monthYear: '2026-01',
        paymentDate: new Date('2026-01-10'),
        paymentMethod: 'mobile_money',
        receiptNumber: 'REC-2026-01-002',
      },
    ]);

    console.log('✅ Created payments');

    // Create grades
    await Grade.insertMany([
      {
        student: students[0]._id,
        subject: 'Mathematics',
        testName: 'Quiz 1',
        testDate: new Date('2026-01-15'),
        score: 18,
        maxScore: 20,
        testType: 'quiz',
      },
      {
        student: students[1]._id,
        subject: 'English',
        testName: 'Quiz 1',
        testDate: new Date('2026-01-15'),
        score: 15,
        maxScore: 20,
        testType: 'quiz',
      },
    ]);

    console.log('✅ Created grades');
    console.log('🎉 Seed complete!');

    return students; // Return students for use in creating parent users
  } catch (error) {
    console.error('❌ Seed error:', error);
    throw error;
  }
}