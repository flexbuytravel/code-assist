import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// Use your Stripe Secret Key (Test Mode)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20"
});

export async function POST(request: Request) {
  try {
    const { customerId, packageId } = await request.json();
    if (!customerId || !packageId) {
      return NextResponse.json({ error: "Missing customerId or packageId" }, { status: 400 });
    }

    // Get package data to ensure correct price
    const pkgSnap = await getDoc(doc(db, "packages", packageId));
    if (!pkgSnap.exists()) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }
    const pkgData = pkgSnap.data();

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: pkgData.title || "Travel Package"
            },
            unit_amount: Math.round(pkgData.price * 100) // price in cents
          },
          quantity: 1
        }
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/deposit-success?customerId=${customerId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/customer/dashboard`
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Error creating checkout session:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}