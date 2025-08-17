import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

/**
 * POST /api/customer/notifications/mark-read
 * Marks a notification as read for the authenticated customer
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(idToken);
    const userId = decoded.uid;

    const { notificationId } = await request.json();

    if (!notificationId) {
      return NextResponse.json({ success: false, error: "Missing notificationId" }, { status: 400 });
    }

    const notifRef = adminDb
      .collection("users")
      .doc(userId)
      .collection("notifications")
      .doc(notificationId);

    await notifRef.set({ read: true, readAt: new Date().toISOString() }, { merge: true });

    return NextResponse.json({ success: true, message: "Notification marked as read" }, { status: 200 });
  } catch (error: any) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}