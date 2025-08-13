// src/app/api/customer/package/payment-success/route.ts

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAuth } from "firebase-admin/auth";
import { db } from "@/lib/firebaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

/**
 * POST /api/customer/package/payment-success
 * Called after successful payment to confirm booking.
 */
export async function POST(req: NextRequest) {
  try {
    // Verify Firebase Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(idToken);

    if (decodedToken.role !== "customer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { paymentIntentId, packageId } = await req.json();

    if (!paymentIntentId || !packageId) {
      return NextResponse.json(
        { error: "Missing paymentIntentId or packageId" },
        { status: 400 }
      );
    }

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: "Payment not successful" },
        { status: 400 }
      );
    }

    // Save booking record in Firestore
    const bookingRef = db.collection("bookings").doc();
    await bookingRef.set({
      packageId,
      userId: decodedToken.uid,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      paymentStatus: paymentIntent.status,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      message: "Booking confirmed",
      bookingId: bookingRef.id,
    });
  } catch (error: any) {
    console.error("Error confirming payment success:", error);
    return NextResponse.json(
      { error: "Failed to confirm booking" },
      { status: 500 }
    );
  }
}