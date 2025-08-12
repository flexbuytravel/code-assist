import { NextResponse } from "next/server";
import Stripe from "stripe";
import * as admin from "firebase-admin";

// Init Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10", // match your Stripe dashboard version
});

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature")!;
  let event: Stripe.Event;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error(`Webhook signature verification failed.`, err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      const customerId = session.metadata?.customerId;
      const packageId = session.metadata?.packageId;
      const paymentType = session.metadata?.paymentType; // "deposit" | "doubleUp" | "full"

      if (!customerId || !packageId || !paymentType) {
        throw new Error("Missing required metadata in Stripe session");
      }

      const packageRef = admin.firestore().collection("customers").doc(customerId);

      // Defaults
      let tripCount = Number(session.metadata?.baseTripCount) || 1;
      let expiryDate = new Date();

      // Handle payment types
      if (paymentType === "deposit") {
        tripCount += 1;
        expiryDate.setMonth(expiryDate.getMonth() + 6);
      } else if (paymentType === "doubleUp") {
        tripCount *= 2;
        expiryDate.setMonth(expiryDate.getMonth() + 54);
      } else if (paymentType === "full") {
        expiryDate.setMonth(expiryDate.getMonth() + 54);
      }

      await packageRef.update({
        paymentStatus: paymentType === "deposit" ? "depositPaid" : "paidInFull",
        tripCount,
        expiryDate: expiryDate.toISOString(),
        paymentAmount: session.amount_total ? session.amount_total / 100 : null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ Updated customer ${customerId} with payment info.`);
    } catch (err) {
      console.error("❌ Error handling checkout.session.completed", err);
      return NextResponse.json({ error: "Failed to process payment" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

export const config = {
  api: {
    bodyParser: false, // Stripe needs raw body
  },
};