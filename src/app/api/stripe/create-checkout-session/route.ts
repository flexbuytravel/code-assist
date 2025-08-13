import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  try {
    const { packageId, packagePrice, option } = await req.json();

    let finalAmount = packagePrice;

    // Adjust price based on option
    if (option === "deposit") {
      finalAmount = 200;
    } else if (option === "double-up") {
      finalAmount = 600;
    } else if (option === "full") {
      finalAmount = packagePrice; // promotional $998 from your logic
    }

    // Convert to cents
    const amountInCents = Math.round(finalAmount * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Travel Package - ${option}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-cancelled`,
      metadata: {
        packageId,
        option,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}