import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { packagePrice, insuranceType, customerEmail, packageId } = body;

    if (!packagePrice || !insuranceType || !customerEmail || !packageId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let finalAmount = packagePrice * 100; // Stripe works in cents
    let trips = 1;
    let expiryMonths = 0;

    if (insuranceType === "deposit") {
      finalAmount += 20000; // $200 deposit
      trips += 1;
      expiryMonths = 12; // 1 year
    } else if (insuranceType === "doubleup") {
      finalAmount += 60000; // $600 double up
      trips *= 2;
      expiryMonths = 54; // 54 months
    } else if (insuranceType === "full") {
      // Full price payment has no extra fee
      trips += 0;
      expiryMonths = 0; // No timer
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Travel Package - ${packageId}`,
              description: `Includes ${trips} trip(s) and ${insuranceType} insurance`,
            },
            unit_amount: finalAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-cancelled`,
      metadata: {
        packageId,
        insuranceType,
        trips,
        expiryMonths,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}