import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase"; // Client SDK for emulator/live Firestore
import { doc, deleteDoc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Middleware-like helper for role-based access
async function requireAdmin(user: any) {
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
}

export async function DELETE(req: Request) {
  try {
    const { companyId, user } = await req.json();

    if (!companyId) {
      return NextResponse.json(
        { error: "Missing companyId" },
        { status: 400 }
      );
    }

    // Role check
    await requireAdmin(user);

    const companyRef = doc(firestore, "companies", companyId);
    const snapshot = await getDoc(companyRef);

    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Delete company document
    await deleteDoc(companyRef);

    return NextResponse.json({ success: true, companyId });
  } catch (error: any) {
    console.error("Error deleting company:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}