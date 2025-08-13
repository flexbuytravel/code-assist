import { NextResponse } from "next/server";
import Stripe from "stripe";
import { firestore } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature") as string;

  let event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const packageId = session.metadata?.packageId;
    const insuranceType = session.metadata?.insuranceType;
    const customerId = session.metadata?.customerId;

    // Update customer record in Firestore
    const customerRef = doc(firestore, "customers", customerId);
    let trips = 1;
    let expiryMonths = 0;

    if (insuranceType === "deposit") {
      trips += 1;
      expiryMonths = 6;
    } else if (insuranceType === "double_up") {
      trips *= 2;
      expiryMonths = 54;
    }

    await updateDoc(customerRef, {
      paymentStatus: "paid",
      amountPaid: session.amount_total! / 100,
      insuranceType,
      trips,
      expiryDate: new Date(new Date().setMonth(new Date().getMonth() + expiryMonths)),
    });
  }

  return NextResponse.json({ received: true });
}