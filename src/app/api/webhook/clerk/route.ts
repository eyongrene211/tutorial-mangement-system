import { NextRequest, NextResponse } from 'next/server';
import { Webhook }                   from 'svix';
import { WebhookEvent }              from '@clerk/nextjs/server';
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

    // Get the body as a raw string for verification
    const body = await req.text();

    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!;
    const wh = new Webhook(webhookSecret);
    
    let evt: WebhookEvent;

    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as WebhookEvent;
    } catch (err) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }

    await dbConnect();

    const eventType = evt.type;

    switch (eventType) {
      case 'user.created': {
        const clerkUser = evt.data;
        const metadata = clerkUser.public_metadata as { role?: string };
        const role = metadata?.role || 'parent';
        
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
      }

      case 'user.updated': {
        const clerkUser = evt.data;
        const metadata = clerkUser.public_metadata as { role?: string };

        await User.findOneAndUpdate(
          { clerkUserId: clerkUser.id },
          {
            email: clerkUser.email_addresses[0]?.email_address || '',
            firstName: clerkUser.first_name || 'User',
            lastName: clerkUser.last_name || '',
            role: metadata?.role || 'parent',
          }
        );
        break;
      }

      case 'user.deleted': {
        const clerkUser = evt.data;
        await User.findOneAndUpdate(
          { clerkUserId: clerkUser.id },
          { status: 'inactive' }
        );
        break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    // Safely extract the error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}