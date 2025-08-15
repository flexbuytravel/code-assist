import { NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "@/lib/firebaseAdmin"; // Correct import
import { doc, getDoc } from "firebase-admin/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

/**
 * POST /api/customer/package/payment-intent
 * Creates a Stripe PaymentIntent for a given package
 */
export async function POST(request: Request) {
  try {
    const { packageId } = await request.json();

    if (!packageId) {
      return NextResponse.json(
        { success: false, error: "Missing packageId" },
        { status: 400 }
      );
    }

    // Fetch package from Firestore
    const packageRef = doc(adminDb, "packages", packageId);
    const packageSnap = await getDoc(packageRef);

    if (!packageSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "Package not found" },
        { status: 404 }
      );
    }

    const packageData = packageSnap.data();
    if (!packageData.price || typeof packageData.price !== "number") {
      return NextResponse.json(
        { success: false, error: "Invalid package price" },
        { status: 400 }
      );
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: packageData.price * 100, // convert to cents
      currency: "usd",
      metadata: { packageId },
    });

    return NextResponse.json(
      { success: true, clientSecret: paymentIntent.client_secret },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}