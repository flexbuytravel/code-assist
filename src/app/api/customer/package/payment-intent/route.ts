// src/app/api/customer/package/payment-intent/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { firestore } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// Load Stripe with your test secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

/**
 * POST /api/customer/package/payment-intent
 * Creates a payment intent for a package booking
 * Expected body: { packageId, customerId, amount }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { packageId, customerId, amount } = body;

    if (!packageId || !customerId || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate package exists
    const packageRef = doc(firestore, "packages", packageId);
    const packageSnap = await getDoc(packageRef);

    if (!packageSnap.exists()) {
      return NextResponse.json(
        { error: "Package not found" },
        { status: 404 }
      );
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      metadata: {
        packageId,
        customerId,
      },
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}