import { NextResponse } from "next/server";
import Stripe from "stripe";
import { firestore } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

// Stripe requires the raw request body for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig as string,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error("⚠️ Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const packageId = session.metadata?.packageId;
    const customerId = session.metadata?.customerId;

    if (!packageId || !customerId) {
      console.error("Missing packageId or customerId in webhook metadata.");
      return NextResponse.json({ received: true }, { status: 200 });
    }

    try {
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

      // Update customer record
      await updateDoc(doc(firestore, "customers", customerId), {
        depositPaid: true,
        expiresAt: sixMonthsFromNow.toISOString(),
        updatedAt: serverTimestamp(),
      });

      // Update package record
      await updateDoc(doc(firestore, "packages", packageId), {
        depositPaid: true,
        expiresAt: sixMonthsFromNow.toISOString(),
        updatedAt: serverTimestamp(),
      });

      console.log(
        `✅ Deposit confirmed: package ${packageId}, customer ${customerId}`
      );
    } catch (error) {
      console.error("Error updating Firestore in webhook:", error);
      return NextResponse.json({ error: "Firestore update failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}