import { NextResponse } from "next/server";
import { db, auth } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const { name, email, password, phone, address, packageId, referralId } = await req.json();

    if (!name || !email || !password || !phone || !address || !packageId || !referralId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    // Firestore timestamps
    const claimTimestamp = Timestamp.now();
    const expiryTimestamp = Timestamp.fromMillis(claimTimestamp.toMillis() + 48 * 60 * 60 * 1000);

    // Attach customer to package and agent/company
    await db.collection("customers").doc(userRecord.uid).set({
      name,
      email,
      phone,
      address,
      packageId,
      referralId,
      claimTimestamp,
      expiryTimestamp,
      status: "pending_payment", // waiting for deposit or full payment
    });

    // Lock package as claimed
    await db.collection("packages").doc(packageId).update({
      claimedBy: userRecord.uid,
      claimedAt: claimTimestamp,
      status: "claimed",
    });

    return NextResponse.json({ success: true, uid: userRecord.uid });
  } catch (error: any) {
    console.error("Error registering customer:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}