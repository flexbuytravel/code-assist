// src/app/api/stripe/create-checkout-session/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-04-10",
});

export async function POST(req: Request) {
  try {
    const { packageId, customerId, insuranceType } = await req.json();

    if (!packageId || !customerId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Server-side price calculation — no trusting client
    const basePrice = 998; // promotional price
    let finalPrice = basePrice;

    if (insuranceType === "deposit") finalPrice += 200;
    if (insuranceType === "doubleUp") finalPrice += 600;

    // Stripe requires amounts in cents
    const amountInCents = finalPrice * 100;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Vacation Package",
              description: `Package ID: ${packageId} — ${insuranceType}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/customer/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/customer/payment?packageId=${packageId}&customerId=${customerId}`,
      metadata: {
        packageId,
        customerId,
        insuranceType,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe Checkout Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}