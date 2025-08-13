import { NextResponse } from "next/server";
import Stripe from "stripe";
import { buffer } from "micro";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();
if (process.env.NODE_ENV === "development") {
  db.settings({ host: "localhost:8080", ssl: false });
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await req.arrayBuffer();
    event = stripe.webhooks.constructEvent(
      Buffer.from(rawBody),
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const customerId = session.metadata?.customerId;
    const option = session.metadata?.option;

    if (!customerId || !option) {
      console.error("Missing metadata in checkout session");
      return NextResponse.json({ received: true });
    }

    const customerRef = db.collection("customers").doc(customerId);
    const customerSnap = await customerRef.get();

    if (!customerSnap.exists) {
      console.error("Customer doc not found:", customerId);
      return NextResponse.json({ received: true });
    }

    const customerData = customerSnap.data() || {};
    let updatedTrips = customerData.trips || 0;
    let newExpiration = customerData.expirationDate || null;

    if (option === "deposit") {
      updatedTrips += 1;
      const sixMonths = new Date();
      sixMonths.setMonth(sixMonths.getMonth() + 6);
      newExpiration = sixMonths.toISOString();
    } else if (option === "doubleUp") {
      updatedTrips = updatedTrips * 2 || 2;
      const fiftyFourMonths = new Date();
      fiftyFourMonths.setMonth(fiftyFourMonths.getMonth() + 54);
      newExpiration = fiftyFourMonths.toISOString();
    } else if (option === "full") {
      // Full payment, trips stay the same but clear timer
      newExpiration = null;
    }

    await customerRef.update({
      trips: updatedTrips,
      expirationDate: newExpiration,
      paymentStatus: "paid",
    });

    console.log(`Customer ${customerId} updated with option ${option}`);
  }

  return NextResponse.json({ received: true });
}