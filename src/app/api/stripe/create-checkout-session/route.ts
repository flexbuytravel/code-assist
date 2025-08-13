import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20", // Match your Stripe API version
});

export async function POST(req: Request) {
  try {
    const { packageId, packagePrice, option } = await req.json();

    if (!packageId || !packagePrice) {
      return NextResponse.json(
        { error: "Missing packageId or packagePrice" },
        { status: 400 }
      );
    }

    // Determine price based on option
    let finalAmount = packagePrice; // Base package price in USD
    let description = "Full Package Payment";

    if (option === "deposit") {
      finalAmount = 200;
      description = "Deposit Payment";
    } else if (option === "double_up") {
      finalAmount = 600;
      description = "Double Up Payment";
    } else if (option === "full") {
      finalAmount = packagePrice;
      description = "Full Payment";
    }

    // Stripe requires amounts in cents
    const amountInCents = Math.round(finalAmount * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: description,
              description: `Package ID: ${packageId}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-cancelled`,
      metadata: {
        packageId: packageId,
        paymentOption: option,
        originalPrice: packagePrice.toString(),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe create-checkout-session error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create session" },
      { status: 500 }
    );
  }
}