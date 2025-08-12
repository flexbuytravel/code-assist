import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getFirestore, doc, getDoc } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

if (!getApps().length) {
  initializeApp({
    credential: require('firebase-admin').credential.applicationDefault(),
  });
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
});

export async function POST(req: Request) {
  try {
    const { packageId, paymentType, insurance } = await req.json();
    if (!packageId || !paymentType) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const db = getFirestore();
    const packageRef = doc(db, 'packages', packageId);
    const packageSnap = await getDoc(packageRef);

    if (!packageSnap.exists()) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    const packageData = packageSnap.data();
    let totalAmount = 0;

    // Pricing logic
    if (paymentType === 'deposit') {
      totalAmount = 20000; // $200 in cents
    } else if (paymentType === 'full') {
      totalAmount = packageData.price * 100; // convert to cents
    }

    if (insurance === 'double-up') {
      totalAmount += 60000; // +$600
    }

    // Determine connected account (company that owns the agent)
    let stripeAccountId = null;
    if (packageData.companyStripeId) {
      stripeAccountId = packageData.companyStripeId;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: packageData.name || 'Travel Package' },
            unit_amount: totalAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/customer/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/customer/dashboard?canceled=true`,
      metadata: {
        packageId,
        paymentType,
        insurance: insurance || 'none',
        customerId: packageData.customerId || '',
      },
    }, stripeAccountId ? { stripeAccount: stripeAccountId } : undefined);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}