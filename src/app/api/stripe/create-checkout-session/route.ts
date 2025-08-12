import { NextResponse } from "next/server";
import Stripe from "stripe";
import { firestore } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

export async function POST(req: Request) {
  try {
    const { customerId, paymentType, insurance } = await req.json();

    if (!customerId || !paymentType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch customer from Firestore
    const customerRef = doc(firestore, "customers", customerId);
    const customerSnap = await getDoc(customerRef);

    if (!customerSnap.exists()) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const customerData = customerSnap.data();
    if (!customerData.packageId) {
      return NextResponse.json({ error: "Customer has no package assigned" }, { status: 400 });
    }

    // Fetch package to get price + trip count
    const packageRef = doc(firestore, "packages", customerData.packageId);
    const packageSnap = await getDoc(packageRef);

    if (!packageSnap.exists()) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const packageData = packageSnap.data();
    const baseTripPrice = packageData.tripPrice || 0;
    let tripCount = packageData.tripCount || 1;

    // Apply insurance multiplier
    if (insurance) {
      tripCount *= 2; // doubles number of trips
    }

    // Calculate total package price
    let totalPackagePrice = baseTripPrice * tripCount;

    // Apply deposit fraction if deposit payment
    let finalPriceInCents: number;
    if (paymentType === "deposit") {
      finalPriceInCents = Math.round(totalPackagePrice * 0.2 * 100);
    } else if (paymentType === "full") {
      finalPriceInCents = Math.round(totalPackagePrice * 100);
    } else {
      return NextResponse.json({ error: "Invalid payment type" }, { status: 400 });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Travel Package (${tripCount} trips)`,
              description: insurance
                ? "Includes trip insurance (double trips)"
                : "No trip insurance",
            },
            unit_amount: finalPriceInCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/customer/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/customer/dashboard?payment=cancel`,
      metadata: {
        customerId,
        packageId: customerData.packageId,
        paymentType,
        insurance: insurance ? "true" : "false",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe session creation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}