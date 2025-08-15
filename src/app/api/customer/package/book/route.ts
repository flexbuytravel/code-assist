import { NextResponse } from "next/server";
import { getAuth } from "firebase/auth";
import { adminDb } from "@/lib/firebaseAdmin"; // Correct import
import { doc, setDoc, serverTimestamp } from "firebase-admin/firestore";

/**
 * POST /api/customer/package/book
 * Creates a booking for the authenticated user
 */
export async function POST(request: Request) {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { packageId, bookingDetails } = await request.json();

    if (!packageId || !bookingDetails) {
      return NextResponse.json(
        { success: false, error: "Missing required booking data" },
        { status: 400 }
      );
    }

    const bookingId = `${currentUser.uid}_${Date.now()}`;
    const bookingRef = doc(adminDb, "bookings", bookingId);

    await setDoc(bookingRef, {
      userId: currentUser.uid,
      packageId,
      bookingDetails,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    return NextResponse.json(
      { success: true, bookingId },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}