// src/app/api/customer/package/payment-intent/route.ts

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAuth } from "firebase-admin/auth";
import { db } from "@/lib/firebaseAdmin";

// Use your Stripe test secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

/**
 * POST /api/customer/package/payment-intent
 * Creates a Stripe PaymentIntent for the given package.
 */
export async function POST(req: NextRequest) {
  try {
    // Verify Firebase Auth ID Token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(idToken);

    // Role check — must be 'customer'
    if (decodedToken.role !== "customer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { packageId, amount, currency } = await req.json();

    if (!packageId || !amount) {
      return NextResponse.json(
        { error: "Package ID and amount are required" },
        { status: 400 }
      );
    }

    // Optional: Validate packageId exists in Firestore
    const packageDoc = await db.collection("packages").doc(packageId).get();
    if (!packageDoc.exists) {
      return NextResponse.json(
        { error: "Package not found" },
        { status: 404 }
      );
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency || "usd",
      metadata: {
        packageId,
        userId: decodedToken.uid,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}