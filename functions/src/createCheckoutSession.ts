import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";

admin.initializeApp();
const db = admin.firestore();

// Stripe test key from environment
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-04-10" // use the latest API version
});

/**
 * Callable function to create a Stripe Checkout session
 * Price is verified from Firestore package doc, not from client.
 */
export const createCheckoutSession = functions.https.onCall(async (data, context) => {
  const { packageId } = data;
  const uid = context.auth?.uid;

  if (!uid) {
    throw new functions.https.HttpsError("unauthenticated", "You must be signed in to purchase a package.");
  }

  if (!packageId) {
    throw new functions.https.HttpsError("invalid-argument", "Package ID is required.");
  }

  // Fetch package details from Firestore
  const packageRef = db.collection("packages").doc(packageId);
  const packageSnap = await packageRef.get();

  if (!packageSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Package not found.");
  }

  const packageData = packageSnap.data();

  if (packageData?.claimed) {
    throw new functions.https.HttpsError("failed-precondition", "Package has already been claimed.");
  }

  if (!packageData?.price || !packageData?.name) {
    throw new functions.https.HttpsError("invalid-argument", "Package is missing required fields.");
  }

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: packageData.name,
            description: packageData.description || ""
          },
          unit_amount: Math.round(packageData.price * 100) // Convert to cents
        },
        quantity: 1
      }
    ],
    success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/cancel`
  });

  return { sessionId: session.id };
});
