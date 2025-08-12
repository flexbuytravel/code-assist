import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const claimPackage = functions.https.onCall(async (data, context) => {
  try {
    // Only customers can claim packages
    if (!context.auth || context.auth.token.role !== "customer") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only customers can claim packages."
      );
    }

    const { packageId } = data;
    const customerId = context.auth.uid; // ✅ Always use logged-in customer

    if (!packageId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Package ID is required."
      );
    }

    // Transaction to prevent double-claim
    await db.runTransaction(async (transaction) => {
      const packageRef = db.collection("packages").doc(packageId);
      const packageSnap = await transaction.get(packageRef);

      if (!packageSnap.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "Package not found."
        );
      }

      const pkgData = packageSnap.data();

      // Already claimed?
      if (pkgData?.claimedBy) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "This package has already been claimed."
        );
      }

      // Lock package to this customer
      transaction.update(packageRef, {
        claimedBy: customerId,
        claimedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: "claimed"
      });

      // Optionally create a "customerPackages" reference
      const customerPkgRef = db
        .collection("customers")
        .doc(customerId)
        .collection("claimedPackages")
        .doc(packageId);

      transaction.set(customerPkgRef, {
        packageId,
        companyId: pkgData.companyId,
        agentId: pkgData.agentId,
        price: pkgData.price,
        claimedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    return { message: "Package claimed successfully", packageId };
  } catch (error: any) {
    console.error("Error claiming package:", error);
    throw new functions.https.HttpsError(
      "unknown",
      error.message || "Failed to claim package."
    );
  }
});