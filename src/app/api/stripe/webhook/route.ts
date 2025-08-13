import { NextResponse } from "next/server";
import Stripe from "stripe";
import { buffer } from "micro";
import admin from "@/lib/firebase-admin"; // make sure this is your firebase-admin setup file

// Disable the default body parser so we can verify the raw request
export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle event types
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { packageId, option } = session.metadata || {};

    if (!packageId || !option) {
      console.error("Missing packageId or option in metadata");
      return NextResponse.json({ received: true });
    }

    try {
      const db = admin.firestore();
      const packageRef = db.collection("packages").doc(packageId);

      let updates: any = {
        paymentStatus: "paid",
        paymentOption: option,
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Adjust timers based on payment option
      if (option === "deposit") {
        updates.tripCount = admin.firestore.FieldValue.increment(1);
        updates.bookingDeadline = admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
        );
      } else if (option === "double-up") {
        updates.tripCount = admin.firestore.FieldValue.increment(2);
        updates.bookingDeadline = admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 54 * 30 * 24 * 60 * 60 * 1000) // ~54 months
        );
      } else if (option === "full") {
        updates.tripCount = admin.firestore.FieldValue.increment(1);
        updates.bookingDeadline = admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 54 * 30 * 24 * 60 * 60 * 1000) // ~54 months
        );
      }

      await packageRef.update(updates);
      console.log(`Package ${packageId} updated after payment`);
    } catch (error) {
      console.error("Error updating Firestore:", error);
    }
  }

  return NextResponse.json({ received: true });
}