import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

export async function POST(req: Request) {
  try {
    const { packageId, paymentType, insurance } = await req.json();

    if (!packageId || !paymentType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1️⃣ Get package details from Firestore
    const packageRef = doc(db, "packages", packageId);
    const packageSnap = await getDoc(packageRef);

    if (!packageSnap.exists()) {
      return NextResponse.json(
        { error: "Package not found" },
        { status: 404 }
      );
    }

    const packageData = packageSnap.data();
    const basePrice = packageData.price || 0;

    // 2️⃣ Calculate final price based on type and insurance
    let finalPrice = 0;

    if (paymentType === "deposit") {
      finalPrice = 200; // fixed deposit
    } else if (paymentType === "full") {
      finalPrice = basePrice;
    }

    // Insurance add-ons
    if (insurance === "standard") {
      finalPrice += 200; // adds one trip
    } else if (insurance === "doubleUp") {
      finalPrice += 600; // doubles trips
    }

    // Convert to cents for Stripe
    const amountInCents = Math.round(finalPrice * 100);

    // 3️⃣ Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: packageData.name || "Travel Package",
              description: `Agent: ${packageData.agentId}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        packageId,
        companyId: packageData.companyId,
        agentId: packageData.agentId,
        paymentType,
        insurance,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/customer/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/customer/dashboard?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}