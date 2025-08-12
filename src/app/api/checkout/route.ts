import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-04-10",
});

export async function POST(req: Request) {
  try {
    const { packageId, amount, paymentType, insurance } = await req.json();

    if (!packageId || !amount) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Fetch package details
    const pkgRef = doc(db, "packages", packageId);
    const pkgSnap = await getDoc(pkgRef);

    if (!pkgSnap.exists()) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const pkgData = pkgSnap.data();

    // Ensure company exists
    if (!pkgData.companyId) {
      return NextResponse.json({ error: "Package missing company assignment" }, { status: 400 });
    }

    // Fetch company to get Stripe account ID
    const companyRef = doc(db, "companies", pkgData.companyId);
    const companySnap = await getDoc(companyRef);

    if (!companySnap.exists()) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const companyData = companySnap.data();

    if (!companyData.stripeAccountId) {
      return NextResponse.json(
        { error: "Company does not have a connected Stripe account" },
        { status: 400 }
      );
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name:
                paymentType === "deposit"
                  ? "Package Deposit"
                  : "Full Package Payment",
              description: insurance
                ? "Includes Trip Insurance"
                : "No Insurance",
            },
            unit_amount: Math.round(amount * 100), // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/customer/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/customer/dashboard?canceled=true`,
      metadata: {
        packageId,
        paymentType,
        insurance: insurance ? "true" : "false",
      },
      payment_intent_data: {
        transfer_data: {
          destination: companyData.stripeAccountId,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: "Unable to create checkout session" }, { status: 500 });
  }
}