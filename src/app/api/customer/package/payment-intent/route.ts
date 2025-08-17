import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

/**
 * POST /api/customer/package/payment-intent
 * Creates a Stripe payment intent for a package booking.
 * Requires Firebase Auth Bearer token.
 */
export async function POST(request: Request) {
  try {
    // Verify Firebase Auth token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Parse body
    const { packageId } = await request.json();
    if (!packageId) {
      return NextResponse.json(
        { success: false, error: "Missing packageId" },
        { status: 400 }
      );
    }

    // Fetch package info
    const packageRef = adminDb.collection("packages").doc(packageId);
    const packageSnap = await packageRef.get();

    if (!packageSnap.exists) {
      return NextResponse.json(
        { success: false, error: "Package not found" },
        { status: 404 }
      );
    }

    const packageData = packageSnap.data();
    if (!packageData?.price || packageData.status !== "active") {
      return NextResponse.json(
        { success: false, error: "Invalid or inactive package" },
        { status: 403 }
      );
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(packageData.price * 100), // cents
      currency: "usd",
      metadata: { userId, packageId },
    });

    // Save intent in Firestore
    await adminDb.collection("payments").doc(paymentIntent.id).set({
      userId,
      packageId,
      amount: packageData.price,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: true, clientSecret: paymentIntent.client_secret },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}