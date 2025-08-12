import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const createAgent = functions.https.onCall(async (data, context) => {
  try {
    // Only companies can create agents
    if (!context.auth || context.auth.token.role !== "company") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only companies can create agents."
      );
    }

    const { name, email, password, companyId } = data;

    if (!name || !email || !password) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Name, email, and password are required."
      );
    }

    // Ensure companyId matches the logged-in company
    if (!companyId || companyId !== context.auth.uid) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Invalid companyId. Must match your account."
      );
    }

    // Create Auth user for agent
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name
    });

    // Assign role: agent
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: "agent",
      companyId
    });

    // Create Firestore agent document
    await db.collection("agents").doc(userRecord.uid).set({
      name,
      email,
      companyId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid // company who created it
    });

    return { message: "Agent created successfully", agentId: userRecord.uid };
  } catch (error: any) {
    console.error("Error creating agent:", error);
    throw new functions.https.HttpsError(
      "unknown",
      error.message || "Failed to create agent."
    );
  }
});