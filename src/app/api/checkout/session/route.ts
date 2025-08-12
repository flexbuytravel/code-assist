import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string)),
  });
}

const db = getFirestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

export async function POST(req: Request) {
  try {
    const { packageId, referralId, customerId, amount, paymentType, isDoubleUp } = await req.json();

    // Fetch company Stripe account
    const packageRef = await db.collection("packages").doc(packageId).get();
    if (!packageRef.exists) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const packageData = packageRef.data();
    const companyRef = await db.collection("companies").doc(packageData.companyId).get();
    const companyData = companyRef.data();

    if (!companyData?.stripeAccountId) {
      return NextResponse.json({ error: "Company has not connected Stripe" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `${packageData.name} - ${paymentType === "deposit" ? "Deposit" : "Full Payment"}`,
              },
              unit_amount: amount * 100,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/customer/dashboard?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/customer/dashboard?canceled=true`,
        metadata: {
          packageId,
          referralId,
          customerId,
          paymentType,
          isDoubleUp,
        },
      },
      {
        stripeAccount: companyData.stripeAccountId,
      }
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe session creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}