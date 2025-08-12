import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getFirestore } from "firebase-admin/firestore";
import { initFirebaseAdmin } from "@/lib/firebaseAdmin";
import { stripeSecretKey } from "@/lib/stripeConfig";

initFirebaseAdmin();

const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-04-10" });
const db = getFirestore();

export async function POST(req: Request) {
  try {
    const { packageId, customerId, paymentType, insurance } = await req.json();

    if (!packageId || !customerId || !paymentType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get package details
    const packageRef = db.collection("packages").doc(packageId);
    const packageDoc = await packageRef.get();

    if (!packageDoc.exists) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const pkgData = packageDoc.data();
    if (!pkgData) {
      return NextResponse.json({ error: "Package data missing" }, { status: 500 });
    }

    // Get company Stripe account
    const companyRef = db.collection("companies").doc(pkgData.companyId);
    const companyDoc = await companyRef.get();
    const stripeAccountId = companyDoc.exists ? companyDoc.data()?.stripeAccountId : null;

    // Calculate price
    let amount = pkgData.price * 100; // convert to cents
    if (paymentType === "deposit") {
      amount = pkgData.depositAmount ? pkgData.depositAmount * 100 : amount * 0.2; // fallback 20%
    }
    if (insurance) {
      amount += pkgData.insuranceFee ? pkgData.insuranceFee * 100 : 0;
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: pkgData.customerEmail || undefined,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: pkgData.title || "Travel Package",
                description: `Agent: ${pkgData.agentName || ""}`,
              },
              unit_amount: Math.round(amount),
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/customer/dashboard?status=success&packageId=${packageId}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/home?status=cancel`,
        metadata: {
          packageId,
          customerId,
          paymentType,
          insurance: insurance ? "yes" : "no",
        },
      },
      stripeAccountId ? { stripeAccount: stripeAccountId } : undefined
    );

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Checkout session error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}