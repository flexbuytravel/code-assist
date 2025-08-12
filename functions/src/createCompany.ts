import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const createCompany = functions.https.onCall(async (data, context) => {
  try {
    // Only admins can create companies
    if (!context.auth || context.auth.token.role !== "admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins can create companies."
      );
    }

    const { name, email, password } = data;

    if (!name || !email || !password) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Name, email, and password are required."
      );
    }

    // Create Auth user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name
    });

    // Assign role: company
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: "company" });

    // Create Firestore document for company
    await db.collection("companies").doc(userRecord.uid).set({
      name,
      email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid // admin who created it
    });

    return { message: "Company created successfully", companyId: userRecord.uid };
  } catch (error: any) {
    console.error("Error creating company:", error);
    throw new functions.https.HttpsError(
      "unknown",
      error.message || "Failed to create company."
    );
  }
});