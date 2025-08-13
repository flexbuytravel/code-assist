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
    const session