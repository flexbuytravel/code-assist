import { NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Init Firebase Admin once
if (!getApps().length) {
  initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

// Point to Firestore emulator in dev mode
if (process.env.NODE_ENV === "development") {
  db.settings({
    host: "localhost:8080",
    ssl: false,
  });
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const docRef = db.collection("customers").doc(params.id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const customerData = docSnap.data();
    const basePrice = customerData?.fullPrice || 0;

    // Fixed amounts for options
    const depositAmount = 200;
    const doubleUpAmount = 600;

    // Build pricing object
    const pricingOptions = {
      fullPrice: basePrice,
      deposit: depositAmount,
      doubleUp: doubleUpAmount,
    };

    return NextResponse.json({
      id: docSnap.id,
      name: customerData?.name || "",
      trips: customerData?.trips || 0,
      pricingOptions,
    });
  } catch (error) {
    console.error("Error fetching customer pricing:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}