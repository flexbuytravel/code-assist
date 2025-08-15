import { NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "@/lib/firebaseAdmin"; // Correct import
import { doc, updateDoc } from "firebase-admin/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

export async function POST(request: Request) {
  try {
    const sig = request.headers.get("stripe-signature");

    if (!sig) {
      return NextResponse.json(
        { success: false, error: "Missing Stripe signature" },
        { status: 400 }
      );
    }

    const body = await request.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET as string
      );
    } catch (err: any) {
      console.error("⚠️  Webhook signature verification failed:", err.message);
      return NextResponse.json(
        { success: false, error: "Invalid Stripe signature" },
        { status: 400 }
      );
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const packageId = paymentIntent.metadata.packageId;

      if (!packageId) {
        return NextResponse.json(
          { success: false, error: "Missing packageId in metadata" },
          { status: 400 }
        );
      }

      // Update package booking as paid
      const packageRef = doc(adminDb, "packages", packageId);
      await updateDoc(packageRef, {
        paymentStatus: "paid",
        updatedAt: new Date(),
      });

      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json(
      { success: false, error: "Unhandled event type" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error handling payment success webhook:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}