import { NextResponse } from "next/server";
import Stripe from "stripe";
import { firestore } from "@/lib/firebase"; // your firebase init file
import { doc, getDoc } from "firebase/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(req: Request) {
  try {
    const { packageId, insuranceType, customerId } = await req.json();

    // Get package details from Firestore
    const packageRef = doc(firestore, "packages", packageId);
    const packageSnap = await getDoc(packageRef);

    if (!packageSnap.exists()) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const packageData = packageSnap.data();
    const basePrice = packageData.promotionalPrice || packageData.price; // $998 for promo, $2498 normal

    // Adjust price based on insurance type
    let totalPrice = basePrice;
    if (insuranceType === "deposit") totalPrice += 200;
    if (insuranceType === "double_up") totalPrice += 600;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${packageData.name} Package`,
              description: `Package with ${insuranceType.replace("_", " ")}`,
            },
            unit_amount: totalPrice * 100, // Stripe works in cents
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-cancelled`,
      metadata: {
        packageId,
        insuranceType,
        customerId,
      },
    });

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}