import { NextResponse } from "next/server";
import Stripe from "stripe";
import { firestore } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const customerId = session.metadata?.customerId;
    const packageId = session.metadata?.packageId;
    const paymentType = session.metadata?.paymentType;
    const insurance = session.metadata?.insurance === "true";

    if (!customerId || !packageId || !paymentType) {
      console.error("Webhook missing metadata:", session.metadata);
      return NextResponse.json({ received: true });
    }

    try {
      const customerRef = doc(firestore, "customers", customerId);

      if (paymentType === "deposit") {
        // Deposit paid: extend expiry by 6 months
        const sixMonthsLater = Timestamp.fromDate(
          new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000)
        );
        await updateDoc(customerRef, {
          depositPaid: true,
          expiresAt: sixMonthsLater,
          insurance,
          lastPaymentAt: serverTimestamp(),
        });
      } else if (paymentType === "full") {
        // Full payment: remove expiry
        await updateDoc(customerRef, {
          fullyPaid: true,
          expiresAt: null,
          insurance,
          lastPaymentAt: serverTimestamp(),
        });
      }

      console.log(
        `Payment processed for customer ${customerId}, type: ${paymentType}`
      );
    } catch (err) {
      console.error("Error updating Firestore after payment:", err);
    }
  }

  return NextResponse.json({ received: true });
}