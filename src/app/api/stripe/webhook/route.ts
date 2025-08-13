import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import admin from '@/lib/firebaseAdmin'; // Make sure you have firebaseAdmin.ts configured

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
});

export const config = {
  api: {
    bodyParser: false, // Stripe requires raw body
  },
};

function buffer(req: any) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export async function POST(req: NextRequest) {
  const buf = await req.arrayBuffer();
  const rawBody = Buffer.from(buf);
  const sig = req.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    const packageId = session.metadata?.packageId;
    const customerId = session.metadata?.customerId;
    const paymentType = session.metadata?.paymentType;
    const insuranceOption = session.metadata?.insuranceOption;

    if (!packageId || !customerId || !paymentType) {
      console.error('Missing metadata in webhook');
      return NextResponse.json({ received: true });
    }

    try {
      const db = admin.firestore();
      const customerRef = db.collection('customers').doc(customerId);

      // Fetch current customer data
      const customerDoc = await customerRef.get();
      if (!customerDoc.exists) {
        console.error('Customer not found:', customerId);
        return NextResponse.json({ received: true });
      }

      const customerData = customerDoc.data() || {};

      let trips = customerData.trips || 0;
      let expirationDate = customerData.expirationDate
        ? customerData.expirationDate.toDate()
        : null;

      const now = new Date();

      if (paymentType === 'deposit') {
        trips += 1;
        expirationDate = new Date();
        expirationDate.setMonth(expirationDate.getMonth() + 6); // 6-month extension
      } else if (paymentType === 'double') {
        trips *= 2;
        expirationDate = new Date();
        expirationDate.setMonth(expirationDate.getMonth() + 54); // 54-month extension
      } else if (paymentType === 'full') {
        expirationDate = null; // No timer
      }

      if (insuranceOption === 'add') {
        trips *= 2;
      }

      await customerRef.update({
        trips,
        expirationDate: expirationDate ? admin.firestore.Timestamp.fromDate(expirationDate) : null,
        paymentStatus: 'paid',
        lastPaymentDate: admin.firestore.Timestamp.fromDate(now),
      });

      console.log(`Updated customer ${customerId} after payment`);
    } catch (err) {
      console.error('Error updating Firestore from webhook:', err);
    }
  }

  return NextResponse.json({ received: true });
}