import { NextRequest, NextResponse }      from 'next/server';
import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';
import dbConnect                          from '@/lib/mongodb'; // Ensure path is correct (@/ alias usually preferred)
import User                               from '@/models/User';
import { nanoid }                         from 'nanoid';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const requestingUser = await User.findOne({ clerkUserId: userId });
    
    if (!requestingUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    if (requestingUser.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admins only.' }, { status: 403 });
    }

    const users = await User.find({})
      .select('-__v')
      .sort({ createdAt: -1 })
      .lean();

    console.log('✅ Fetched users:', users.length);
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Initialize Clerk Client (Fix for: Property 'users' does not exist...)
    const client = await clerkClient();

    const requestingUser = await User.findOne({ clerkUserId: userId });
    
    if (!requestingUser || requestingUser.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admins only.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, firstName, lastName, role, phone, address, status, studentId, activationMethod } = body;

    // Parse name if provided
    let fName = firstName;
    let lName = lastName;
    if (name && !firstName) {
      const parts = name.split(' ');
      fName = parts[0] || '';
      lName = parts.slice(1).join(' ') || '';
    }

    // Validate required fields
    if (!email || !fName || !lName) {
      return NextResponse.json(
        { error: 'Email, first name, and last name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists in MongoDB
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    let clerkUserId = null;
    let temporaryPassword = null;

    // Handle different activation methods
    switch (activationMethod) {
      case 'invitation':
        try {
          console.log('📧 Creating Clerk user with email invitation...');
          
          // Create user in Clerk with email invitation
          // Note: using 'client' variable we created earlier
          const clerkUser = await client.users.createUser({
            emailAddress: [email],
            firstName: fName,
            lastName: lName,
            publicMetadata: {
              role: role || 'parent',
              dbId: null // Will update after MongoDB user is created
            },
            skipPasswordRequirement: false,
            skipPasswordChecks: false,
          });

          clerkUserId = clerkUser.id;
          console.log('✅ Clerk user created:', clerkUserId);

          // Send invitation email
          await client.invitations.createInvitation({
            emailAddress: email,
            redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
            publicMetadata: {
              role: role || 'parent'
            }
          });

          console.log('✅ Invitation email sent');
        } catch (clerkError: unknown) {
          const errorMessage = clerkError instanceof Error ? clerkError.message : 'Unknown Clerk error';
          console.error('❌ Clerk creation failed:', errorMessage);
          return NextResponse.json(
            { error: `Clerk account creation failed: ${errorMessage}` },
            { status: 500 }
          );
        }
        break;

      case 'temporary':
        try {
          console.log('🔑 Creating Clerk user with temporary password...');
          
          // Generate strong temporary password
          temporaryPassword = `${nanoid(12)}!A1`;
          
          // Create user in Clerk with password
          const clerkUser = await client.users.createUser({
            emailAddress: [email],
            password: temporaryPassword,
            firstName: fName,
            lastName: lName,
            publicMetadata: {
              role: role || 'parent',
              dbId: null,
              needsPasswordChange: true
            },
            skipPasswordChecks: false,
          });

          clerkUserId = clerkUser.id;
          console.log('✅ Clerk user created with temp password:', clerkUserId);
        } catch (clerkError: unknown) {
          const errorMessage = clerkError instanceof Error ? clerkError.message : 'Unknown Clerk error';
          console.error('❌ Clerk creation failed:', errorMessage);
          return NextResponse.json(
            { error: `Clerk account creation failed: ${errorMessage}` },
            { status: 500 }
          );
        }
        break;

      case 'manual':
        console.log('👤 Creating MongoDB user only (no Clerk account)');
        clerkUserId = null;
        break;

      default:
        // Default to manual mode
        clerkUserId = null;
    }

    // Create user in MongoDB
    const newUser = await User.create({
      clerkUserId: clerkUserId,
      email,
      firstName: fName,
      lastName: lName,
      role: role || 'teacher',
      phone: phone || '',
      address: address || '',
      status: status || 'active',
      studentId: studentId || null,
      tempPassword: temporaryPassword || undefined,
      requirePasswordChange: !!temporaryPassword,
    });

    // Update Clerk user with MongoDB ID
    if (clerkUserId) {
      try {
        await client.users.updateUser(clerkUserId, {
          publicMetadata: {
            role: role || 'parent',
            dbId: newUser._id.toString()
          }
        });
        console.log('✅ Updated Clerk user with MongoDB ID');
      } catch (error) {
        console.error('⚠️  Failed to update Clerk metadata:', error);
      }
    }

    console.log('✅ Created user:', newUser.email, 'Role:', newUser.role, 'ClerkId:', clerkUserId);

    // Return response with temp password if generated
    return NextResponse.json({
      ...newUser.toObject(),
      temporaryPassword: temporaryPassword || undefined
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Error creating user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}