import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

/**
 * Admin creates a company account
 */
export const createCompanyUser = functions.https.onCall(async (data, context) => {
  if (context.auth?.token.role !== "admin") {
    throw new functions.https.HttpsError("permission-denied", "Only admins can create company accounts.");
  }

  const { email, displayName } = data;
  if (!email || !displayName) {
    throw new functions.https.HttpsError("invalid-argument", "Email and display name are required.");
  }

  // Create Firebase Auth user
  const userRecord = await admin.auth().createUser({ email, displayName });
  
  // Create company doc
  const companyDoc = await db.collection("companies").add({
    name: displayName,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Create linked user doc
  await db.collection("users").doc(userRecord.uid).set({
    role: "company",
    companyId: companyDoc.id,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Set custom claims
  await admin.auth().setCustomUserClaims(userRecord.uid, {
    role: "company",
    companyId: companyDoc.id
  });

  return { success: true, uid: userRecord.uid, companyId: companyDoc.id };
});

/**
 * Company creates an agent account
 */
export const createAgentUser = functions.https.onCall(async (data, context) => {
  if (context.auth?.token.role !== "company") {
    throw new functions.https.HttpsError("permission-denied", "Only companies can create agent accounts.");
  }

  const companyId = context.auth.token.companyId;
  if (!companyId) {
    throw new functions.https.HttpsError("failed-precondition", "Company ID missing from claims.");
  }

  const { email, displayName } = data;
  if (!email || !displayName) {
    throw new functions.https.HttpsError("invalid-argument", "Email and display name are required.");
  }

  // Create Firebase Auth user
  const userRecord = await admin.auth().createUser({ email, displayName });

  // Create linked user doc
  await db.collection("users").doc(userRecord.uid).set({
    role: "agent",
    companyId: companyId,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Set custom claims
  await admin.auth().setCustomUserClaims(userRecord.uid, {
    role: "agent",
    companyId: companyId
  });

  return { success: true, uid: userRecord.uid, companyId };
});

/**
 * Public customer self-registration
 */
export const createCustomerUser = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError("unauthenticated", "You must be signed in to register as a customer.");
  }

  // Create or update customer user doc
  await db.collection("users").doc(uid).set({
    role: "customer",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // Set custom claims
  await admin.auth().setCustomUserClaims(uid, {
    role: "customer"
  });

  return { success: true, uid };
});