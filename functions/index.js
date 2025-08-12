const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Secure role assignment endpoint
 * Requires caller to be authenticated as an admin
 */
exports.setUserRole = functions.https.onRequest(async (req, res) => {
  try {
    // CORS headers for local dev/public IP access
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decoded = await admin.auth().verifyIdToken(idToken);

    // Only admins can set roles
    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Only admins can set roles" });
    }

    const { uid, role } = req.body;
    if (!uid || !role) {
      return res.status(400).json({ error: "Missing uid or role" });
    }

    await admin.auth().setCustomUserClaims(uid, { role });
    return res.status(200).json({ message: `Role ${role} set for user ${uid}` });
  } catch (err) {
    console.error("Error setting user role:", err);
    return res.status(500).json({ error: err.message });
  }
});