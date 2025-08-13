// src/app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { buffer } from "micro";
import admin from "@/lib/firebaseAdmin"; // Make sure you have this firebaseAdmin setup

export const config = {
  api: {
    bodyParser: false, // Stripe needs raw body
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-04-10",
});

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature") as string;

  if (!sig) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const buf = await buffer(req.body as any);
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const packageId = session.metadata?.packageId;
    const customerId = session.metadata?.customerId;
    const insuranceType = session.metadata?.insuranceType;

    if (!packageId || !customerId) {
      console.warn("Missing metadata in checkout session");
      return NextResponse.json({ received: true });
    }

    // Determine trip count and expiry date
    let tripCount = 1;
    let expiry = new Date();

    if (insuranceType === "deposit") {
      tripCount += 1;
      expiry.setMonth(expiry.getMonth() + 12); // 1 year
    }
    if (insuranceType === "doubleUp") {
      tripCount *= 2;
      expiry.setMonth(expiry.getMonth() + 54); // 54 months
    }
    if (!insuranceType) {
      expiry.setMonth(expiry.getMonth() + 6); // Default expiry
    }

    // Update Firestore
    const db = admin.firestore();
    await db.collection("customers").doc(customerId).update({
      paymentStatus: "paid",
      tripsAvailable: tripCount,
      expiryDate: expiry.toISOString(),
      lastPayment: new Date().toISOString(),
    });

    console.log(`✅ Updated customer ${customerId} after payment`);
  }

  return NextResponse.json({ received: true });
}