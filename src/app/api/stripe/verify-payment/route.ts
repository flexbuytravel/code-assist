import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20", // match your Stripe dashboard API version
});

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    // Fetch checkout session details from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session.payment_status || session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    // Get the paid amount in dollars
    const amountPaid = (session.amount_total ?? 0) / 100;

    return NextResponse.json({ success: true, amountPaid });
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}