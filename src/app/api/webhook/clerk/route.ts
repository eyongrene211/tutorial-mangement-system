import { Webhook }      from 'svix';
import { headers }      from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import User             from '../../../../../models/User';
import connectDB        from '../../../../../lib/mongodb';
export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Missing CLERK_WEBHOOK_SECRET');
  }

  // Get headers (async in Next.js 15+)
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse('Missing headers', { status: 400 });
  }

  // Get and verify webhook body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return new NextResponse('Verification failed', { status: 400 });
  }

  // Connect to database
  await connectDB();

  // Handle user.created event
  if (evt.type === 'user.created') {
    const { id, email_addresses, first_name, last_name, public_metadata } = evt.data;

    // Safely extract metadata
    const metadata = public_metadata || {};
    const role = String(metadata.role || 'teacher');
    const studentId = metadata.studentId ? String(metadata.studentId) : null;

    await User.create({
      clerkId: id,
      email: email_addresses[0].email_address,
      name: `${first_name || ''} ${last_name || ''}`.trim() || 'User',
      role: role,
      studentId: studentId,
    });

    console.log('✅ User created:', id);
  }

  return new NextResponse('Success', { status: 200 });
}