import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getFirestore } from "firebase-admin/firestore";
import { verifyAuth } from "@/lib/verifyAuth";
import { stripeSecretKey } from "@/lib/stripeConfig";

const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-04-10" });
const db = getFirestore();

export async function POST(req: Request) {
  try {
    const { packageId, depositOnly, includeInsurance } = await req.json();

    // Must be logged in as a customer
    const { decodedToken, errorResponse } = await verifyAuth(req, ["customer"]);
    if (errorResponse) return errorResponse;

    // Get package info
    const packageRef = db.collection("packages").doc(packageId);
    const packageDoc = await packageRef.get();
    if (!packageDoc.exists) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }
    const pkg = packageDoc.data();

    // Find agent → company
    const agentRef = db.collection("agents").doc(pkg.agentId);
    const agentDoc = await agentRef.get();
    if (!agentDoc.exists) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }
    const agent = agentDoc.data();

    const companyRef = db.collection("companies").doc(agent.companyId);
    const companyDoc = await companyRef.get();
    if (!companyDoc.exists) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
    const company = companyDoc.data();

    // Calculate price
    let amount = depositOnly ? pkg.depositAmount : pkg.fullAmount;
    if (includeInsurance) {
      amount += pkg.insuranceAmount;
    }

    // Stripe payment session options
    const sessionData: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: pkg.name },
            unit_amount: Math.round(amount * 100), // in cents
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/customer/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/customer/dashboard?canceled=true`,
      metadata: {
        packageId,
        customerId: decodedToken.uid,
        depositOnly,
        includeInsurance,
      },
    };

    // If company has Stripe Connect, route payment directly
    if (company.stripeAccountId && company.stripeConnected) {
      sessionData.payment_intent_data = {
        transfer_data: {
          destination: company.stripeAccountId,
        },
      };
    }

    // Create Stripe session
    const session = await stripe.checkout.sessions.create(sessionData);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout session error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}