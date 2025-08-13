import { NextResponse } from "next/server";
import Stripe from "stripe";
import admin from "@/lib/firebaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  try {
    const { customerId, amountType } = await req.json();

    if (!customerId || !["deposit", "full"].includes(amountType)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const db = admin.firestore();
    const customerDoc = await db.collection("customers").doc(customerId).get();

    if (!customerDoc.exists) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const customerData = customerDoc.data();
    if (!customerData) {
      return NextResponse.json({ error: "Customer data missing" }, { status: 400 });
    }

    let amount = 0;
    let description = "";

    if (amountType === "deposit") {
      amount = 20000; // $200 in cents
      description = "Trip Deposit";
    } else if (amountType === "full") {
      amount = customerData.fullPrice * 100; // convert to cents
      description = "Full Trip Payment";
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: description },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-cancel`,
      metadata: {
        customerId,
        paymentType: amountType,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}