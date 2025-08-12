import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * Trigger when a user document is created or updated
 * This function updates Firebase Auth custom claims with:
 * - role (admin, company, agent, customer)
 * - companyId (if applicable)
 * - agentId (if applicable)
 */
export const setUserClaims = functions.firestore
  .document("users/{userId}")
  .onWrite(async (change, context) => {
    const userId = context.params.userId;
    const afterData = change.after.exists ? change.after.data() : null;

    if (!afterData) {
      console.log(`User ${userId} deleted — skipping claims update.`);
      return null;
    }

    const { role, companyId, agentId } = afterData;

    if (!role) {
      console.error(`User ${userId} has no role assigned — cannot set claims.`);
      return null;
    }

    const claims: { role: string; companyId?: string; agentId?: string } = {
      role,
    };

    if (companyId) claims.companyId = companyId;
    if (agentId) claims.agentId = agentId;

    try {
      await admin.auth().setCustomUserClaims(userId, claims);
      console.log(`Custom claims set for user ${userId}:`, claims);
    } catch (error) {
      console.error(`Error setting claims for user ${userId}:`, error);
    }

    return null;
  });
