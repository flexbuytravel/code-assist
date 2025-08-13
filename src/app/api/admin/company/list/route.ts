import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase"; // Client SDK for emulator/local dev
import { collection, getDocs } from "firebase/firestore";

// Middleware-like helper for role-based access
async function requireAdmin(user: any) {
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userParam = searchParams.get("user");
    const user = userParam ? JSON.parse(userParam) : null;

    // Role check
    await requireAdmin(user);

    const companiesRef = collection(firestore, "companies");
    const snapshot = await getDocs(companiesRef);

    const companies = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ companies });
  } catch (error: any) {
    console.error("Error listing companies:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}