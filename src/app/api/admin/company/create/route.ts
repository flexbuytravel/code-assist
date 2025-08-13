import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase"; // Client SDK for emulator/local dev
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";

// Middleware-like helper for role-based access
async function requireAdmin(user: any) {
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
}

export async function POST(req: Request) {
  try {
    const { companyName, details, user } = await req.json();

    if (!companyName) {
      return NextResponse.json(
        { error: "Missing companyName" },
        { status: 400 }
      );
    }

    // Role check
    await requireAdmin(user);

    // Prevent duplicate companies
    const companiesRef = collection(firestore, "companies");
    const existing = await getDocs(
      query(companiesRef, where("companyName", "==", companyName))
    );

    if (!existing.empty) {
      return NextResponse.json(
        { error: "A company with this name already exists" },
        { status: 409 }
      );
    }

    const docRef = await addDoc(companiesRef, {
      companyName,
      details: details || {},
      createdAt: new Date().toISOString(),
      createdBy: user.uid,
    });

    return NextResponse.json({
      success: true,
      companyId: docRef.id,
    });
  } catch (error: any) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}