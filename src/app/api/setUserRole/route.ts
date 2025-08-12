import { NextResponse } from "next/server";
import * as admin from "firebase-admin";

// Initialize Admin SDK only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
}

/**
 * POST /api/setUserRole
 * Requires Authorization Bearer token of an admin user
 * Body: { uid: string, role: string }
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decoded = await admin.auth().verifyIdToken(idToken);

    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Only admins can set roles" }, { status: 403 });
    }

    const { uid, role } = await req.json();
    if (!uid || !role) {
      return NextResponse.json({ error: "Missing uid or role" }, { status: 400 });
    }

    await admin.auth().setCustomUserClaims(uid, { role });

    return NextResponse.json({
      message: `Role ${role} set for user ${uid}`
    });
  } catch (err: any) {
    console.error("Error setting user role:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}