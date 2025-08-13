import Stripe from "stripe";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20", // make sure this matches your Stripe account version
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { packageId, depositOption, doubleUpOption } = body;

    if (!packageId) {
      return NextResponse.json({ error: "Package ID is required" }, { status: 400 });
    }

    // Load package from Firestore
    const packageDoc = await db.collection("packages").doc(packageId).get();
    if (!packageDoc.exists) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const packageData = packageDoc.data();

    // Calculate price
    let finalPrice = packageData.price; // base package price in USD
    let trips = packageData.trips;
    let bookingWindowMonths = packageData.bookingWindowMonths || 0;

    if (depositOption) {
      finalPrice = 200;
      trips += 1;
      bookingWindowMonths += 6;
    }

    if (doubleUpOption) {
      finalPrice = 600;
      trips *= 2;
      bookingWindowMonths = 54; // overrides
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: packageData.title,
              description: packageData.description,
            },
            unit_amount: finalPrice * 100, // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/customer/dashboard?status=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/customer/dashboard?status=cancelled`,
      metadata: {
        packageId,
        agentId: packageData.agentId,
        companyId: packageData.companyId,
        trips,
        bookingWindowMonths,
        depositOption,
        doubleUpOption,
      },
    });

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error("Stripe session error:", error);
    return NextResponse.json({ error: "Unable to create checkout session" }, { status: 500 });
  }
}