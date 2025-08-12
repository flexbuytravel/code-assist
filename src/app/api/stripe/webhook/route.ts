import { buffer } from "micro";
import * as admin from "firebase-admin";
import Stripe from "stripe";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20", // Match your Stripe account API version
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const sig = req.headers["stripe-signature"];
  const buf = await buffer(req);

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerId = session.metadata?.customerId;
    const paymentType = session.metadata?.paymentType; // "deposit" or "full"
    const insurance = session.metadata?.insurance === "true";

    let trips = 0;
    let deadline: Date | null = null;

    if (paymentType === "deposit") {
      trips = insurance ? 2 : 1;
      deadline = new Date();
      deadline.setMonth(deadline.getMonth() + 6); // 6 months
    } else if (paymentType === "full") {
      trips = insurance ? 4 : 2;
      if (insurance) {
        deadline = new Date();
        deadline.setMonth(deadline.getMonth() + 54); // 54 months
      }
    }

    if (customerId) {
      await db.collection("customers").doc(customerId).update({
        paymentStatus: "paid",
        tripsAvailable: trips,
        bookingDeadline: deadline ? admin.firestore.Timestamp.fromDate(deadline) : null,
      });
    }
  }

  res.status(200).json({ received: true });
}