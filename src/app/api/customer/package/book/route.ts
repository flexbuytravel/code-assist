// src/app/api/customer/package/book/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth as firebaseAuth } from "@/lib/firebase"; // Firebase client
import { db } from "@/lib/firebaseAdmin"; // Firebase Admin SDK for server-side
import { collection, addDoc, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

/**
 * POST /api/customer/package/book
 * Allows an authenticated CUSTOMER to book a travel package.
 */
export async function POST(req: NextRequest) {
  try {
    // Verify Firebase Auth ID Token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(idToken);

    // Role check — must be 'customer'
    if (decodedToken.role !== "customer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { packageId, options } = await req.json();

    if (!packageId) {
      return NextResponse.json(
        { error: "Package ID is required" },
        { status: 400 }
      );
    }

    // Add booking document
    const bookingsRef = db.collection("bookings");
    const bookingDoc = await bookingsRef.add({
      userId: decodedToken.uid,
      packageId,
      options: options || {},
      status: "pending",
      createdAt: Timestamp.now(),
    });

    return NextResponse.json({
      success: true,
      bookingId: bookingDoc.id,
    });
  } catch (error: any) {
    console.error("Error booking package:", error);
    return NextResponse.json(
      { error: "Failed to book package" },
      { status: 500 }
    );
  }
}