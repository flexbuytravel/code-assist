import { NextResponse } from "next/server";
import Stripe from "stripe";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20", // Match webhook version
});

export async function POST(req: Request) {
  try {
    const { customerId, paymentType, insurance } = await req.json();

    if (!customerId || !paymentType) {
      return NextResponse.json(
        { error: "Missing customerId or paymentType" },
        { status: 400 }
      );
    }

    // Determine price
    let amount = 0;
    if (paymentType === "deposit") {
      amount = 200; // $200 deposit
    } else if (paymentType === "full") {
      amount = 1000; // Example: $1000 full price (adjust as needed)
    }

    // Add insurance cost if selected
    if (insurance) {
      amount += paymentType === "deposit" ? 200 : 600;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name:
                paymentType === "deposit"
                  ? "Trip Package Deposit"
                  : "Trip Package Full Payment",
            },
            unit_amount: amount * 100, // Stripe works in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/customer/dashboard`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/customer/dashboard`,
      metadata: {
        customerId,
        paymentType,
        insurance: insurance ? "true" : "false",
      },
    });

    // Optional: mark payment as pending in Firestore
    await db.collection("customers").doc(customerId).update({
      paymentStatus: "pending",
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Error creating checkout session:", err);
    return NextResponse.json(
      { error: "Unable to create checkout session" },
      { status: 500 }
    );
  }
}