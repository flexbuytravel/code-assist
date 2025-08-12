import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20', // Match webhook version
});

export async function POST(req: Request) {
  try {
    const { customerId, packageId, price, paymentType, successUrl, cancelUrl } = await req.json();

    if (!customerId || !packageId || !price || !paymentType) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: paymentType === 'deposit' ? 'Trip Deposit' : 'Full Payment',
              description:
                paymentType === 'deposit'
                  ? 'Deposit to hold your trip for 6 months'
                  : 'Full trip payment (unlimited booking time)',
            },
            unit_amount: Math.round(price * 100), // convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/customer/dashboard?status=success`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/customer/dashboard?status=cancelled`,
      metadata: {
        customerId,
        packageId,
        paymentType,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new NextResponse('Failed to create checkout session', { status: 500 });
  }
}