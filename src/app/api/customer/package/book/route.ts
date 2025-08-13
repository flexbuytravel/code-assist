import { NextResponse } from "next/server";
import { getAuth } from "firebase/auth";
import { db } from "@/lib/firebaseAdmin"; // fixed import
import { doc, setDoc } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    // Ensure Firebase Auth is initialized in emulator mode
    const auth = getAuth();

    const user = auth.currentUser;
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: No authenticated customer" },
        { status: 401 }
      );
    }

    const { packageId, customerData } = await req.json();

    // Basic payload validation
    if (!packageId || !customerData) {
      return NextResponse.json(
        { error: "Missing required fields: packageId or customerData" },
        { status: 400 }
      );
    }

    // Create a booking doc in Firestore
    const bookingRef = doc(db, "bookings", `${user.uid}_${packageId}`);

    await setDoc(bookingRef, {
      packageId,
      customerData,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { message: "Booking created successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}