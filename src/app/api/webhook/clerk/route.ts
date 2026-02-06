import { NextRequest, NextResponse } from 'next/server';
import { Webhook }                   from 'svix';
import dbConnect                     from '@/lib/mongodb';
import User                          from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const svix_id = req.headers.get('svix-id');
    const svix_timestamp = req.headers.get('svix-timestamp');
    const svix_signature = req.headers.get('svix-signature');

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return NextResponse.json({ error: 'Missing headers' }, { status: 400 });
    }

    const payload = await req.json();
    const body = JSON.stringify(payload);

    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!;
    const wh = new Webhook(webhookSecret);
    
    let evt: any;
    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      });
    } catch (err) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }

    await dbConnect();

    const eventType = evt.type;
    const clerkUser = evt.data;

    switch (eventType) {
      case 'user.created':
        const role = clerkUser.public_metadata?.role || 'parent';
        await User.findOneAndUpdate(
          { clerkUserId: clerkUser.id },
          {
            clerkUserId: clerkUser.id,
            email: clerkUser.email_addresses[0]?.email_address || '',
            firstName: clerkUser.first_name || 'User',
            lastName: clerkUser.last_name || '',
            role: role,
            phone: clerkUser.phone_numbers[0]?.phone_number || '',
            status: 'active'
          },
          { upsert: true, new: true }
        );
        break;

      case 'user.updated':
        await User.findOneAndUpdate(
          { clerkUserId: clerkUser.id },
          {
            email: clerkUser.email_addresses[0]?.email_address || '',
            firstName: clerkUser.first_name || 'User',
            lastName: clerkUser.last_name || '',
            role: clerkUser.public_metadata?.role || 'parent',
          }
        );
        break;

      case 'user.deleted':
        await User.findOneAndUpdate(
          { clerkUserId: clerkUser.id },
          { status: 'inactive' }
        );
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}