import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getFirestore, doc, updateDoc, serverTimestamp } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { buffer } from 'micro';

if (!getApps().length) {
  initializeApp({
    credential: require('firebase-admin').credential.applicationDefault(),
  });
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
});

export const config = {
  api: {
    bodyParser: false, // Stripe needs raw body
  },
};

export async function POST(req: Request) {
  const rawBody = await req.arrayBuffer();
  const sig = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      Buffer.from(rawBody),
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }

  const db = getFirestore();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { packageId, paymentType, insurance } = session.metadata as any;

    const packageRef = doc(db, 'packages', packageId);

    let bookingDeadline;
    let tripsToAdd = 0;

    if (paymentType === 'deposit') {
      tripsToAdd += 1;
      bookingDeadline = new Date();
      bookingDeadline.setMonth(bookingDeadline.getMonth() + 6);
    } else if (paymentType === 'full') {
      bookingDeadline = new Date();
      bookingDeadline.setMonth(bookingDeadline.getMonth() + 54);
    }

    if (insurance === 'double-up') {
      tripsToAdd *= 2;
      bookingDeadline = new Date();
      bookingDeadline.setMonth(bookingDeadline.getMonth() + 54);
    }

    await updateDoc(packageRef, {
      paymentStatus: 'paid',
      lastPaymentAt: serverTimestamp(),
      trips: tripsToAdd,
      bookingDeadline,
    });
  }

  return NextResponse.json({ received: true });
}