import { NextResponse } from "next/server";
import Stripe from "stripe";
import { buffer } from "micro";
import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-04-10",
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  const buf = Buffer.from(await req.arrayBuffer());

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata || {};

    const packageId = metadata.packageId;
    const paymentType = metadata.paymentType;
    const insurance = metadata.insurance === "true";

    if (packageId) {
      const pkgRef = doc(db, "packages", packageId);

      // Default: trips = 1, no timer
      let trips = 1;
      let expiresAt: Date | null = null;

      if (paymentType === "deposit") {
        trips += 1; // Deposit adds 1 trip
        expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 6); // 6-month expiration
      } else if (paymentType === "full") {
        trips = 3; // Example: base trips for full payment
        expiresAt = null; // No timer for full payment
      }

      // Insurance doubles trips
      if (insurance) {
        trips *= 2;
        if (paymentType === "deposit") {
          expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + 54); // 54 months for deposit + insurance
        }
      }

      await updateDoc(pkgRef, {
        paid: true,
        paymentType,
        insurance,
        trips,
        expiresAt: expiresAt ? expiresAt.getTime() : null,
        updatedAt: serverTimestamp(),
      });

      console.log(`✅ Package ${packageId} updated after payment`);
    }
  }

  return NextResponse.json({ received: true });
}