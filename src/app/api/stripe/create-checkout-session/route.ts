import { NextResponse } from "next/server";
import Stripe from "stripe";
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

export async function POST(req: Request) {
  try {
    const { customerId, option } = await req.json();

    if (!customerId || !option) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 });
    }

    // Fetch the customer doc
    const docRef = db.collection("customers").doc(customerId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const customerData = docSnap.data();
    const basePrice = customerData?.fullPrice || 0;

    // Pricing logic
    let amount = 0;
    if (option === "full") {
      amount = basePrice;
    } else if (option === "deposit") {
      amount = 200;
    } else if (option === "doubleUp") {
      amount = 600;
    } else {
      return NextResponse.json({ error: "Invalid option" }, { status: 400 });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name:
                option === "full"
                  ? "Full Payment"
                  : option === "deposit"
                  ? "Deposit Payment"
                  : "Double Up Payment",
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}