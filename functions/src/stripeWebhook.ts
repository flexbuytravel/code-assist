import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";

admin.initializeApp();
const db = admin.firestore();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-04-10"
});

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig as string,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error("⚠️ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const packageId = session.metadata?.packageId;
    const customerId = session.metadata?.customerId;

    if (!packageId || !customerId) {
      console.error("Missing packageId or customerId in session metadata");
      return res.status(400).send("Missing metadata");
    }

    try {
      await db.runTransaction(async (transaction) => {
        const packageRef = db.collection("packages").doc(packageId);
        const packageSnap = await transaction.get(packageRef);

        if (!packageSnap.exists) {
          throw new Error("Package not found");
        }

        const packageData = packageSnap.data();
        if (!packageData) {
          throw new Error("Package data is empty");
        }

        // Check if already claimed
        if (packageData.claimed) {
          throw new Error("Package already claimed");
        }

        // Price verification: Stripe sends amount_total in cents
        if (session.amount_total !== packageData.price * 100) {
          throw new Error(
            `Payment amount mismatch. Expected ${packageData.price * 100}, got ${session.amount_total}`
          );
        }

        transaction.update(packageRef, {
          claimed: true,
          claimedBy: customerId,
          claimedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      console.log(`✅ Package ${packageId} successfully claimed via Stripe payment.`);
    } catch (error) {
      console.error("Error claiming package after payment:", error);
    }
  }

  res.status(200).json({ received: true });
});