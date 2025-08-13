import { NextResponse } from "next/server";
import Stripe from "stripe";
import { buffer } from "micro";
import admin from "@/lib/firebaseAdmin"; // Your Firebase Admin init

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

export async function POST(req: Request) {
  const buf = await buffer(req);
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error("Webhook signature verification failed.", err.message);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { packageId, insuranceType, trips, expiryMonths } = session.metadata as any;

    const customerRef = admin.firestore().collection("customers").doc(session.customer_email!);

    await customerRef.set(
      {
        paymentStatus: "paid",
        insuranceType,
        trips: Number(trips),
        expiryMonths: Number(expiryMonths),
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  return NextResponse.json({ received: true });
}