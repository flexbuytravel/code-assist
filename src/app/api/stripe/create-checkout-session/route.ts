import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

export async function POST(req: Request) {
  try {
    const { packageId, option } = await req.json();

    // Base price
    const basePrice = 998;

    let amount = 0;
    if (option === "deposit") {
      amount = 200;
    } else if (option === "double-up") {
      amount = basePrice + 600;
    } else if (option === "full") {
      amount = basePrice;
    } else {
      return NextResponse.json({ error: "Invalid payment option" }, { status: 400 });
    }

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Package ${packageId} - ${option}`,
            },
            unit_amount: amount * 100, // Stripe takes cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        packageId,
        option,
        amount,
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/customer/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/customer/payment-cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout session error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}