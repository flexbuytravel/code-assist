import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { authMiddleware } from "@/lib/auth-middleware";

export const GET = authMiddleware(async (req, user) => {
  try {
    if (user.role !== "agent") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const packagesRef = db
      .collection("packages")
      .where("agentId", "==", user.uid);

    const snapshot = await packagesRef.get();

    const packages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(packages);
  } catch (error) {
    console.error("Error fetching packages:", error);
    return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 });
  }
});