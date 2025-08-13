import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/firebaseAdmin"; // Matches your actual file naming
import { doc, updateDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase"; // For emulator mode

// Load Stripe with your secret key from env
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

export async function POST(req: Request) {
  try {
    const { session_id, bookingId } = await req.json();

    if (!session_id || !bookingId) {
      return NextResponse.json(
        { error: "Missing session_id or bookingId" },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    // Update booking record in Firestore (emulator or live)
    await updateDoc(doc(firestore, "bookings", bookingId), {
      paymentStatus: "paid",
      stripeSessionId: session_id,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, session });
  } catch (error: any) {
    console.error("Error confirming payment:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}