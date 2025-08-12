import { buffer } from "micro";
import Stripe from "stripe";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export const config = {
  api: {
    bodyParser: false, // Stripe requires raw body
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20", // use your actual Stripe API version
});

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const sig = req.headers["stripe-signature"]!;
  let event;

  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(
      buf.toString(),
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata || {};
    const customerId = metadata.customerId;
    const paymentType = metadata.paymentType; // deposit or full
    const insurance = metadata.insurance === "true";

    console.log(`Processing payment for customer ${customerId}`);

    try {
      let tripCount = 0;
      let expiryDate: Date | null = null;

      if (paymentType === "deposit") {
        tripCount = insurance ? 2 : 1; // deposit gives 1 trip, insurance doubles
        expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 6); // +6