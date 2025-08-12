import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

export async function POST(req: Request) {
  try {
    const { packageId, customerId, paymentType } = await req.json();

    if (!packageId || !customerId || !paymentType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name:
                paymentType === "deposit"
                  ? "Package Deposit"
                  : "Full Package Payment",
            },
            // Amount should be dynamically fetched from package details
            unit_amount: paymentType === "deposit" ? 5000 : 20000, // example: $50 deposit or $200 full
          },
          quantity: 1,
        },
      ],
      metadata: {
        packageId,
        customerId,
        paymentType, // "deposit" or "full"
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/customer/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/customer/dashboard?payment=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe session creation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}