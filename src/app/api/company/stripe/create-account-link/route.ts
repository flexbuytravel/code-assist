import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { stripeSecretKey } from "@/lib/stripeConfig";
import { initFirebaseAdmin } from "@/lib/firebaseAdmin";

initFirebaseAdmin();

const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-04-10" });
const db = getFirestore();

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const companyRef = db.collection("companies").doc(userId);
    const companyDoc = await companyRef.get();

    if (!companyDoc.exists) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    let companyData = companyDoc.data();

    // Create Stripe account if not exists
    if (!companyData?.stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: companyData.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      await companyRef.update({ stripeAccountId: account.id });
      companyData.stripeAccountId = account.id;
    }

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: companyData.stripeAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/company/settings`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/company/settings`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error("Stripe Connect Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}