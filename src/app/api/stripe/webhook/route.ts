// src/app/api/stripe/webhook/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { buffer } from 'micro';
import admin from '@/lib/firebaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16',
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  let event;

  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(
      buf.toString(),
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed.`, err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('🔔 Stripe Event Received:', event.type);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.metadata?.customerId;
        const paymentType = session.metadata?.paymentType;

        if (!customerId || !paymentType) break;

        const customerRef = admin.firestore().collection('customers').doc(customerId);

        if (paymentType === 'deposit') {
          await customerRef.update({
            status: 'deposit',
            trips: admin.firestore.FieldValue.increment(1),
            bookingDeadline: admin.firestore.Timestamp.fromDate(
              new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000)
            ),
          });
        } else if (paymentType === 'double_up') {
          const customerDoc = await customerRef.get();
          const trips = customerDoc.data()?.trips || 0;
          await customerRef.update({
            status: 'double_up',
            trips: trips * 2,
            bookingDeadline: admin.firestore.Timestamp.fromDate(
              new Date(Date.now() + 54 * 30 * 24 * 60 * 60 * 1000)
            ),
          });
        } else if (paymentType === 'full') {
          await customerRef.update({
            status: 'paid',
            bookingDeadline: null,
          });
        }
        break;
      }

      case 'checkout.session.expired':
      case 'payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.metadata?.customerId;
        if (customerId) {
          await admin.firestore().collection('