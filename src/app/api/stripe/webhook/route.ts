import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { buffer } from 'micro';
import admin from '@/lib/firebaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20', // Match your Stripe dashboard API version
});

export const config = {
  api: {
    bodyParser: false, // Stripe needs raw body
  },
};

export async function POST(req: Request) {
  const buf = await req.arrayBuffer();
  const rawBody = Buffer.from(buf);
  const sig = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;

        // Get custom metadata we sent during checkout
        const customerId = session.metadata?.customerId;
        const packageId = session.metadata?.packageId;
        const paymentType = session.metadata?.paymentType; // "deposit" or "full"

        if (customerId && packageId) {
          const db = admin.firestore();

          // Update payment status in Firestore
          await db.collection('customers').doc(customerId).update({
            paymentStatus: 'paid',
            paymentType,
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // If deposit, extend package by 6 months; if full, set to indefinite
          if (paymentType === 'deposit') {
            await db.collection('packages').doc(packageId).update({
              bookingDeadline: admin.firestore.Timestamp.fromDate(
                new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // +6 months
              ),
            });
          } else if (paymentType === 'full') {
            await db.collection('packages').doc(packageId).update({
              bookingDeadline: null, // No deadline
            });
          }
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
    console.error('Error handling webhook:', error);
    return new NextResponse('Webhook handler failed', { status: 500 });
  }

  return new NextResponse('Success', { status: 200 });
}