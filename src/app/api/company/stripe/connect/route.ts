import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getFirestore } from "firebase-admin/firestore";
import { verifyAuth } from "@/lib/verifyAuth";
import { stripeSecretKey } from "@/lib/stripeConfig"; // your env stripe key

const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-04-10" });
const db = getFirestore();

export async function POST(req: Request) {
  try {
    // Must be logged in as a company
    const { decodedToken, errorResponse } = await verifyAuth(req, ["company"]);
    if (errorResponse) return errorResponse;

    const companyId = decodedToken.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "Missing company ID in auth token" }, { status: 400 });
    }

    const companyRef = db.collection("companies").doc(companyId);
    const companyDoc = await companyRef.get();

    if (!companyDoc.exists) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    let stripeAccountId = companyDoc.data()?.stripeAccountId;

    // Create account if one doesn't exist
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: companyDoc.data()?.email || "",
        capabilities: {
          transfers: { requested: true },
        },
      });
      stripeAccountId = account.id;

      await companyRef.update({
        stripeAccountId,
        stripeConnected: false,
      });
    }

    // Generate onboarding link
    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL;
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${origin}/company/stripe/reauth`,
      return_url: `${origin}/company/stripe/success`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error("Stripe connect error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}