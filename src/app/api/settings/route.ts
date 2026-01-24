import { NextRequest, NextResponse } from 'next/server';
import { auth }                      from '@clerk/nextjs/server';
import connectDB                     from '../../../../lib/mongodb';
import Settings                      from '../../../../models/Settings';
import User                          from '../../../../models/User';

// GET - Fetch user settings
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find settings for this user, or create default settings
    let settings = await Settings.findOne({ userId: userId });
    
    if (!settings) {
      // Create default settings
      settings = new Settings({
        userId: userId,
      });
      await settings.save();
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT - Update settings
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();

    // Find or create settings
    let settings = await Settings.findOne({ userId: userId });
    
    if (!settings) {
      settings = new Settings({
        userId: userId,
        ...body,
      });
    } else {
      // Update settings
      Object.keys(body).forEach(key => {
        if (body[key] !== undefined) {
          settings[key] = body[key];
        }
      });
    }

    await settings.save();

    return NextResponse.json({
      message: 'Settings updated successfully',
      settings,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

// POST - Reset settings to default
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete existing settings
    await Settings.findOneAndDelete({ userId: userId });

    // Create new default settings
    const settings = new Settings({
      userId: userId,
    });
    await settings.save();

    return NextResponse.json({
      message: 'Settings reset to default',
      settings,
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    return NextResponse.json(
      { error: 'Failed to reset settings' },
      { status: 500 }
    );
  }
}
