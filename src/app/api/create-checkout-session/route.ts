import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
});

export async function POST(req: NextRequest) {
  try {
    const { packageId, customerId, paymentType, insuranceOption } = await req.json();

    if (!packageId || !customerId || !paymentType) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Base amounts (in cents)
    let amount = 0;
    let description = '';

    if (paymentType === 'deposit') {
      amount = 20000; // $200
      description = 'Deposit Payment';
    } else if (paymentType === 'double') {
      amount = 60000; // $600
      description = 'Double-Up Payment';
    } else if (paymentType === 'full') {
      // You'd normally pull this from the package in Firestore
      amount = 100000; // example $1000
      description = 'Full Package Payment';
    }

    // Apply insurance logic
    if (insuranceOption === 'add') {
      // Add cost for insurance — example $50
      amount += 5000;
      description += ' + Insurance';
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Package: ${packageId}`,
              description,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/customer/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/customer/payment-cancel`,
      metadata: {
        packageId,
        customerId,
        paymentType,
        insuranceOption: insuranceOption || 'none',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe session error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}