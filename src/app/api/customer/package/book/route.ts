// src/app/api/customer/package/book/route.ts

import { NextResponse } from "next/server";
import { auth, firestore } from "@/lib/firebase";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

/**
 * POST /api/customer/package/book
 * Books a package for a customer.
 * Expected body: { email, password, packageId, bookingData }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, packageId, bookingData } = body;

    if (!email || !password || !packageId || !bookingData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if the package exists
    const packageRef = doc(firestore, "packages", packageId);
    const packageSnap = await getDoc(packageRef);

    if (!packageSnap.exists()) {
      return NextResponse.json(
        { error: "Package not found" },
        { status: 404 }
      );
    }

    // Create the customer in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const uid = userCredential.user.uid;

    // Store booking data under the customer's document
    const customerRef = doc(firestore, "customers", uid);
    await setDoc(customerRef, {
      email,
      createdAt: new Date().toISOString(),
    });

    // Create a booking record
    const bookingRef = doc(firestore, "bookings", `${uid}_${packageId}`);
    await setDoc(bookingRef, {
      uid,
      packageId,
      bookingData,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    // Optional: Update package's booked count
    await updateDoc(packageRef, {
      bookedCount: (packageSnap.data().bookedCount || 0) + 1,
    });

    return NextResponse.json({
      success: true,
      message: "Package booked successfully",
      bookingId: `${uid}_${packageId}`,
    });
  } catch (error: any) {
    console.error("Error booking package:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}