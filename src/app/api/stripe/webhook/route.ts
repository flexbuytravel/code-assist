import { NextResponse } from "next/server";
import Stripe from "stripe";
import { firestore } from "@/lib/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

export const config = {
  api: {
    bodyParser: false, // Stripe requires raw body for signature verification
  },
};

// Utility to read raw body
async function buffer(readable: ReadableStream<Uint8Array>) {
  const chunks: Uint8Array[] = [];
  const reader = readable.getReader();
  let result = await reader.read();
  while (!result.done) {
    chunks.push(result.value);
    result = await reader.read();
  }
  return Buffer.concat(chunks);
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    const buf = await buffer(req.body as unknown as ReadableStream<Uint8Array>);
    event = stripe.webhooks.constructEvent(
      buf,
      sig as string,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle checkout session completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const packageId = session.metadata?.packageId;
    const customerId = session.metadata?.customerId;

    if (packageId && customerId) {
      try {
        const customerRef = doc(firestore, "customers", customerId);
        const packageRef = doc(firestore, "packages", packageId);

        // Verify customer exists
        const customerSnap = await getDoc(customerRef);
        if (!customerSnap.exists()) {
          console.error("Customer not found for webhook update.");
          return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        // Extend expiry by 6 months
        const sixMonthsLater = new Date();
        sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

        await updateDoc(customerRef, {
          depositPaid: true,
          expiresAt: sixMonthsLater.toISOString(),
        });

        // Update package as well
        await updateDoc(packageRef, {
          depositPaid: true,
        });

        console.log(`✅ Deposit confirmed for customer ${customerId}`);
      } catch (error) {
        console.error("Error updating Firestore after Stripe webhook:", error);
      }
    }
  }

  return NextResponse.json({ received: true });
}