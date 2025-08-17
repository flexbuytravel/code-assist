import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

/**
 * POST /api/customer/package/payment-success
 * Confirms a successful payment and updates Firestore records.
 * This can be triggered by a frontend call after Stripe confirmation,
 * or ideally, handled by a Stripe webhook for security.
 */
export async function POST(request: Request) {
  try {
    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { success: false, error: "Missing paymentIntentId" },
        { status: 400 }
      );
    }

    // Fetch payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { success: false, error: "Payment not successful" },
        { status: 400 }
      );
    }

    const { userId, packageId } = paymentIntent.metadata || {};
    if (!userId || !packageId) {
      return NextResponse.json(
        { success: false, error: "Missing metadata on payment" },
        { status: 500 }
      );
    }

    // Update Firestore payment record
    const paymentRef = adminDb.collection("payments").doc(paymentIntentId);
    await paymentRef.update({
      status: "succeeded",
      confirmedAt: new Date().toISOString(),
    });

    // Optionally mark booking as confirmed
    await adminDb
      .collection("bookings")
      .doc(`${userId}_${packageId}`)
      .set(
        {
          userId,
          packageId,
          paymentId: paymentIntentId,
          status: "confirmed",
          confirmedAt: new Date().toISOString(),
        },
        { merge: true }
      );

    return NextResponse.json(
      { success: true, message: "Payment confirmed and booking recorded" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error confirming payment:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}