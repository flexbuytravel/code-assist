import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const createPackage = functions.https.onCall(async (data, context) => {
  try {
    // Only agents can create packages
    if (!context.auth || context.auth.token.role !== "agent") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only agents can create packages."
      );
    }

    const { name, description, price } = data;
    const agentId = context.auth.uid;

    if (!name || typeof name !== "string" || name.trim() === "") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Package name is required."
      );
    }

    if (!price || typeof price !== "number" || price <= 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Package price must be a positive number."
      );
    }

    // Get agent's companyId
    const agentDoc = await db.collection("agents").doc(agentId).get();
    if (!agentDoc.exists) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Agent profile not found."
      );
    }

    const agentData = agentDoc.data();
    if (!agentData?.companyId) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Agent is not linked to a company."
      );
    }

    const companyId = agentData.companyId;

    // Generate referral code
    const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create package document
    const packageRef = db.collection("packages").doc();
    await packageRef.set({
      name: name.trim(),
      description: description || "",
      price,
      agentId,
      companyId,
      referralCode,
      status: "available",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      message: "Package created successfully",
      packageId: packageRef.id,
      referralCode
    };
  } catch (error: any) {
    console.error("Error creating package:", error);
    throw new functions.https.HttpsError(
      "unknown",
      error.message || "Failed to create package."
    );
  }
});