import { NextResponse } from "next/server";
import Stripe from "stripe";
import { firestore } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

export const config = { api: { bodyParser: false } };

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
    console.error("Webhook signature failed:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const packageId = session.metadata?.packageId;
    const customerId = session.metadata?.customerId;
    const paymentType = session.metadata?.paymentType;

    if (!packageId || !customerId || !paymentType) {
      console.error("Missing metadata in webhook");
      return NextResponse.json({ received: true }, { status: 200 });
    }

    try {
      if (paymentType === "deposit") {
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

        await updateDoc(doc(firestore, "customers", customerId), {
          depositPaid: true,
          expiresAt: sixMonthsFromNow.toISOString(),
          updatedAt: serverTimestamp(),
        });
        await updateDoc(doc(firestore, "packages", packageId), {
          depositPaid: true,
          expiresAt: sixMonthsFromNow.toISOString(),
          updatedAt: serverTimestamp(),
        });

        console.log(`✅ Deposit processed for ${customerId}`);
      }

      if (paymentType === "full") {
        await updateDoc(doc(firestore, "customers", customerId), {
          fullyPaid: true,
          expiresAt: null,
          updatedAt: serverTimestamp(),
        });
        await updateDoc(doc(firestore, "packages", packageId), {
          fullyPaid: true,
          expiresAt: null,
          updatedAt: serverTimestamp(),
        });

        console.log(`✅ Full payment processed for ${customerId}`);
      }
    } catch (error) {
      console.error("Firestore update failed:", error);
      return NextResponse.json({ error: "Firestore update failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}