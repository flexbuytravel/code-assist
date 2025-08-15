import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { doc, getDoc } from "firebase-admin/firestore";

export async function POST(request: Request) {
  try {
    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json(
        { success: false, error: "Missing user ID" },
        { status: 400 }
      );
    }

    // Optional: verify the UID is a valid Firebase Auth user
    await adminAuth.getUser(uid);

    const userRef = doc(adminDb, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, profile: userSnap.data() },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}