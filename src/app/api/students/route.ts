import { NextRequest, NextResponse } from 'next/server';
import { auth }                      from '@clerk/nextjs/server';
import dbConnect                     from 'lib/mongodb';
import Student                       from 'models/Student';
import { nanoid }                    from 'nanoid';
import User                          from 'models/User';

interface StudentQueryFilter extends Record<string, unknown> {
  status?: string;
  classLevel?: string;
  $or?: Array<{
    firstName?: { $regex: string; $options: string };
    lastName?: { $regex: string; $options: string };
    'parentInfo.name'?: { $regex: string; $options: string };
  }>;
}

// Helper function to generate temporary password
function generateTempPassword(): string {
  return nanoid(10);
}

// GET - Fetch all students with filters
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const classLevel = searchParams.get('classLevel');
    const search = searchParams.get('search');

    const query: StudentQueryFilter = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (classLevel && classLevel !== 'all') {
      query.classLevel = classLevel;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { 'parentInfo.name': { $regex: search, $options: 'i' } },
      ];
    }

    const students = await Student.find(query)
      .sort({ lastName: 1, firstName: 1 })
      .lean()
      .exec();

    return NextResponse.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

// POST - Create new student
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      classLevel,
      parentUserId,
      parentInfo,
      address,
      photoUrl,
      notes,
    } = body;

    console.log('📝 Received student data:', { firstName, lastName, parentUserId, parentInfo });

    // Validation
    if (!firstName || !lastName || !dateOfBirth || !gender || !classLevel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!parentInfo || !parentInfo.name || !parentInfo.phone) {
      return NextResponse.json(
        { error: 'Parent information is required' },
        { status: 400 }
      );
    }

    // Validate gender
    if (gender !== 'Male' && gender !== 'Female') {
      return NextResponse.json(
        { error: 'Gender must be either Male or Female' },
        { status: 400 }
      );
    }

    let finalParentUserId = parentUserId;
    let parentUserCredentials = null;

    // ✅ AUTO-CREATE PARENT USER if not linking to existing user
    if (!parentUserId || parentUserId === '' || parentUserId === null) {
      console.log('🔄 No parent user selected, creating new parent account...');
      
      try {
        // Check if user with this email or phone already exists
        const query: Record<string, unknown> = {};
        if (parentInfo.email) {
          query.email = parentInfo.email.toLowerCase();
        } else {
          query.phone = parentInfo.phone;
        }

        const existingUser = await User.findOne(query);

        if (existingUser && existingUser.role === 'parent') {
          // Link to existing parent user
          finalParentUserId = existingUser._id.toString();
          console.log('✅ Found existing parent user, linking:', existingUser.email);
        } else {
          // Generate temporary password
          const tempPassword = generateTempPassword();
          
          // Extract first and last name from parent full name
          const nameParts = parentInfo.name.trim().split(/\s+/);
          const parentFirstName = nameParts[0] || 'Parent';
          const parentLastName = nameParts.slice(1).join(' ') || 'User';
          
          // Create username
          let username = '';
          if (parentInfo.email) {
            username = parentInfo.email.split('@')[0].toLowerCase();
          } else {
            username = `parent_${parentInfo.phone.replace(/[^0-9]/g, '').slice(-8)}`;
          }

          // Create email if not provided
          const parentEmail = parentInfo.email || `${username}@parent.local`;

          console.log('✅ Creating new parent user:', { username, parentEmail });

          // ✅ FIXED: Use correct field names from IUser interface
          const newParentUser = await User.create({
            clerkUserId: `manual_${nanoid(12)}`,
            email: parentEmail,
            username: username,
            firstName: parentFirstName,
            lastName: parentLastName,
            phone: parentInfo.phone,
            role: 'parent',
            status: 'active',
            tempPassword: tempPassword,
            requirePasswordChange: true,
          });

          finalParentUserId = newParentUser._id.toString();
          
          // Prepare credentials to show admin
          parentUserCredentials = {
            username: username,
            email: parentEmail,
            tempPassword: tempPassword,
            message: '🎉 New parent account created successfully!',
          };

          console.log('✅ Parent user created successfully:', newParentUser._id);
        }
      } catch (userError) {
        console.error('❌ Error creating parent user:', userError);
        // Continue without parent user link
        finalParentUserId = null;
      }
    } else {
      // Validate existing parent user
      console.log('🔗 Linking to existing parent user:', parentUserId);
      const parentUser = await User.findById(parentUserId);
      if (!parentUser || parentUser.role !== 'parent') {
        return NextResponse.json(
          { error: 'Invalid parent user selected' },
          { status: 400 }
        );
      }
      finalParentUserId = parentUserId;
    }

    // Create student
    const studentData = {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      classLevel,
      parentInfo: {
        name: parentInfo.name,
        phone: parentInfo.phone,
        email: parentInfo.email || undefined,
      },
      parentUser: finalParentUserId || undefined,
      address: address || undefined,
      photoUrl: photoUrl || undefined,
      notes: notes || undefined,
      status: 'active',
    };

    console.log('✅ Creating student with data:', studentData);

    const student = await Student.create(studentData);

    console.log('✅ Student created successfully:', student._id);

    // Return response with parent credentials if created
    const response: Record<string, unknown> = {
      student,
      success: true,
    };

    if (parentUserCredentials) {
      response.parentAccount = parentUserCredentials;
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating student:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    );
  }
}
