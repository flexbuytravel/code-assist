import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, name, email, phone, address, packageId, referralId, depositAmount } = body;

    if (!uid || !email || !packageId || !referralId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = admin.firestore();

    // Set expiry to 48 hours from now
    const expiryDate = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 48 * 60 * 60 * 1000)
    );

    await db.collection("customers").doc(uid).set({
      name,
      email,
      phone,
      address,
      packageId,
      referralId,
      depositPaid: false,
      depositAmount: depositAmount || 100, // default if not set
      expiryDate,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error registering customer:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}