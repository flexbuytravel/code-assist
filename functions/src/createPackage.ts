import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Cloud Function: createPackage
 * Allows an agent to create a travel package
 * Ensures both agentId and companyId are stored so packages are never orphaned
 */
export const createPackage = functions.https.onCall(async (data, context) => {
  try {
    // Auth check
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to create a package."
      );
    }

    const uid = context.auth.uid;
    const { name, description, price } = data;

    if (!name || !price) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Package name and price are required."
      );
    }

    // Get the agent document
    const agentDoc = await db.collection("agents").doc(uid).get();

    if (!agentDoc.exists) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only agents can create packages."
      );
    }

    const agentData = agentDoc.data();
    if (!agentData || !agentData.companyId) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Agent is missing a companyId."
      );
    }

    const companyId = agentData.companyId;

    // Generate referral code (simple random string for now)
    const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Create package
    const packageRef = db.collection("packages").doc();
    const packageData = {
      packageId: packageRef.id,
      name,
      description: description || "",
      price,
      referralCode,
      agentId: uid,
      companyId, // ✅ stored directly
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "active"
    };

    await packageRef.set(packageData);

    return {
      message: "Package created successfully.",
      package: packageData
    };
  } catch (error: any) {
    console.error("Error creating package:", error);
    throw new functions.https.HttpsError(
      "unknown",
      error.message || "Error creating package."
    );
  }
});