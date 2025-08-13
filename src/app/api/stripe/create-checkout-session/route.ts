// src/app/api/stripe/create-checkout-session/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  try {
    const { customerId, packageId, paymentType } = await req.json();

    if (!customerId || !packageId || !paymentType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Prices based on your rules
    let amount = 0;
    if (paymentType === 'deposit') {
      amount = 20000; // $200
    } else if (paymentType === 'double_up') {
      amount = 60000; // $600
    } else if (paymentType === 'full') {
      // Full payment is based on package price stored in DB or passed in
      // This assumes it's passed in cents
      const packagePrice = 100000; // Example $1000
      amount = packagePrice;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Package ${packageId}`,
              description: `Payment type: ${paymentType}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-canceled`,
      metadata: {
        customerId,
        packageId,
        paymentType,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Error creating checkout session:', err);
    return NextResponse.json({ error: 'Unable to create checkout session' }, { status: 500 });
  }
}