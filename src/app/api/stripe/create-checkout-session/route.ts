import { NextResponse } from "next/server";
import Stripe from "stripe";
import { firestore } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

export async function POST(req: Request) {
  try {
    const { packageId, customerId } = await req.json();

    if (!packageId || !customerId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify package exists
    const packageRef = doc(firestore, "packages", packageId);
    const packageSnap = await getDoc(packageRef);
    if (!packageSnap.exists()) {
      return NextResponse.json(
        { success: false, message: "Package not found" },
        { status: 404 }
      );
    }

    const packageData = packageSnap.data();

    // Prevent checkout for already claimed packages
    if (packageData.claimed && packageData.customerId !== customerId) {
      return NextResponse.json(
        { success: false, message: "Package already claimed" },
        { status: 409 }
      );
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: packageData.name,
              description: `Referral: ${packageData.referralId}`,
            },
            unit_amount: Math.round(packageData.price * 100), // convert to cents
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?packageId=${packageId}&customerId=${customerId}`,
      cancel_url: `${process