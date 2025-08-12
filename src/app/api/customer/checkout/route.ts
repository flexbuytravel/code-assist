import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

export async function POST(req: Request) {
  try {
    const { packageId, deposit, doubleUp } = await req.json();

    const pkgRef = doc(db, "packages", packageId);
    const pkgSnap = await getDoc(pkgRef);
    if (!pkgSnap.exists()) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const pkgData = pkgSnap.data();
    let price = pkgData.price;
    if (deposit) price = 200;
    if (doubleUp) price += 600;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: pkgData.name },
            unit_amount: price * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/customer/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/customer/dashboard?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}