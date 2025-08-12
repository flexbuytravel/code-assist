import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getFirestore } from "firebase-admin/firestore";
import { stripeSecretKey, stripeWebhookSecret } from "@/lib/stripeConfig";

const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-04-10" });
const db = getFirestore();

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, stripeWebhookSecret);
  } catch (err: any) {
    console.error("Webhook signature error:", err.message);
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const { packageId, customerId, depositOnly } = session.metadata || {};

      if (!packageId || !customerId) {
        console.warn("Missing metadata in Stripe session");
        return NextResponse.json({ received: true });
      }

      // Mark payment as completed in Firestore
      const packageRef = db.collection("packages").doc(packageId);

      await packageRef.update({
        sold: true,
        soldTo: customerId,
        paymentStatus: depositOnly ? "deposit_paid" : "paid_in_full",
        depositPaidAt: depositOnly ? new Date() : null,
        fullyPaidAt: !depositOnly ? new Date() : null,
        expiresAt: depositOnly
          ? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // 6 months for deposit
          : null, // no expiration if fully paid
      });

      console.log(`Package ${packageId} updated for customer ${customerId}`);
    }
  } catch (err: any) {
    console.error("Error handling Stripe webhook:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}