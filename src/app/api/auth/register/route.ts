import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const auth = getAuth();
const db = getFirestore();

export async function POST(req: Request) {
  try {
    const { name, email, password, confirmPassword, phone, address, packageId } = await req.json();

    // Basic validation
    if (!name || !email || !password || !confirmPassword || !phone || !address || !packageId) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // Get package details
    const packageRef = db.collection("packages").doc(packageId);
    const packageSnap = await packageRef.get();

    if (!packageSnap.exists) {
      return NextResponse.json({ error: "Invalid package ID" }, { status: 404 });
    }

    const packageData = packageSnap.data();

    if (packageData.claimed) {
      return NextResponse.json({ error: "This package has already been claimed" }, { status: 400 });
    }

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
      phoneNumber: phone,
    });

    // Assign role
    await auth.setCustomUserClaims(userRecord.uid, {
      role: "customer",
      companyId: packageData.companyId,
      agentId: packageData.agentId,
    });

    // Save user profile in Firestore
    await db.collection("users").doc(userRecord.uid).set({
      name,
      email,
      phone,
      address,
      role: "customer",
      companyId: packageData.companyId,
      agentId: packageData.agentId,
      packageId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Lock package to this customer
    await packageRef.update({
      claimed: true,
      claimedBy: userRecord.uid,
      claimedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, uid: userRecord.uid });
  } catch (error: any) {
    console.error("Error registering user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}