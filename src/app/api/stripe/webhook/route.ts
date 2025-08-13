import { NextResponse } from "next/server";
import Stripe from "stripe";
import { buffer } from "micro";
import admin from "@/lib/firebaseAdmin";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  const buf = await buffer(req.body as any);
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const db = admin.firestore();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.metadata?.customerId;
        const paymentType = session.metadata?.paymentType;

        if (!customerId || !paymentType) {
          throw new Error("Missing customerId or paymentType in session metadata");
        }

        let updateData: Record<string, any> = {
          paymentStatus: "paid",
          stripeSessionId: session.id,
          paidAt: admin.firestore.Timestamp.now(),
        };

        if (paymentType === "deposit") {
          updateData.trips = admin.firestore.FieldValue.increment(1);
          updateData.timeExtensionMonths = 6;
          updateData.timerEndsAt = admin.firestore.Timestamp.fromDate(
            new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000)
          );
        } else if (paymentType === "full") {
          updateData.timerEndsAt = null; // no timer
          updateData.fullPaid = true;
        }

        await db.collection("customers").doc(customerId).update(updateData);
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.metadata?.customerId;
        if (customerId) {
          await db.collection("customers").doc(customerId).update({
            paymentStatus: "expired",
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Error handling webhook:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}