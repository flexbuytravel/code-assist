import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase"; // Client SDK for emulator/local dev
import { doc, updateDoc, getDoc } from "firebase/firestore";

// Middleware-like helper for role-based access
async function requireAdmin(user: any) {
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
}

export async function PATCH(req: Request) {
  try {
    const { companyId, data, user } = await req.json();

    if (!companyId || !data) {
      return NextResponse.json(
        { error: "Missing companyId or update data" },
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

    await updateDoc(companyRef, data);

    return NextResponse.json({
      success: true,
      companyId,
      updatedData: data,
    });
  } catch (error: any) {
    console.error("Error updating company:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}