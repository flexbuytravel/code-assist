import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getAuth } from "firebase/auth";
import { db } from "@/lib/firebaseAdmin";
import { doc, setDoc } from "firebase-admin/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20", // latest stable
});

export async function POST(req: Request) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: No authenticated customer" },
        { status: 401 }
      );
    }

    const { packageId, insuranceOption } = await req.json();

    if (!packageId || !insuranceOption) {
      return NextResponse.json(
        { error: "Missing required fields: packageId or insuranceOption" },
        { status: 400 }
      );
    }

    // Pricing logic based on your promo rules
    const basePrice = 99800; // $998 in cents
    let insurancePrice = 0;

    if (insuranceOption === "standard") {
      insurancePrice = 20000; // $200 in cents
    } else if (insuranceOption === "doubleUp") {
      insurancePrice = 60000; // $600 in cents
    } else {
      return NextResponse.json(
        { error: "Invalid insurance option" },
        { status: 400 }
      );
    }

    const totalAmount = basePrice + insurancePrice;

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: "usd",
      metadata: {
        userId: user.uid,
        packageId,
        insuranceOption,
      },
    });

    // Save payment attempt in Firestore
    const paymentRef = doc(db, "payments", paymentIntent.id);
    await setDoc(paymentRef, {
      userId: user.uid,
      packageId,
      insuranceOption,
      amount: totalAmount,
      status: "created",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { clientSecret: paymentIntent.client_secret },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error creating PaymentIntent:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}