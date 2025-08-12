import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getFirestore } from "firebase-admin/firestore";
import { verifyAuth } from "@/lib/verifyAuth";
import { stripeSecretKey } from "@/lib/stripeConfig"; // your env stripe key

const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-04-10" });
const db = getFirestore();

export async function GET(req: Request) {
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

    const stripeAccountId = companyDoc.data()?.stripeAccountId;
    if (!stripeAccountId) {
      return NextResponse.json({ error: "No Stripe account ID found" }, { status: 400 });
    }

    // Fetch account from Stripe
    const account = await stripe.accounts.retrieve(stripeAccountId);

    // If the account is fully onboarded, mark connected
    if (account.details_submitted && account.charges_enabled) {
      await companyRef.update({ stripeConnected: true });
      return NextResponse.json({ connected: true });
    }

    return NextResponse.json({ connected: false });
  } catch (error: any) {
    console.error("Stripe status error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}