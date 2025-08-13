import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { authMiddleware } from "@/lib/auth-middleware";

export const POST = authMiddleware(async (req, user) => {
  try {
    if (user.role !== "agent") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, trips, price } = body;

    if (!title || !description || !trips || !price) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get the agent's company
    const agentDoc = await db.collection("agents").doc(user.uid).get();
    if (!agentDoc.exists) {
      return NextResponse.json({ error: "Agent profile not found" }, { status: 404 });
    }

    const { companyId } = agentDoc.data();

    // Create package
    const packageData = {
      title,
      description,
      trips,
      price,
      agentId: user.uid,
      companyId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newPackageRef = await db.collection("packages").add(packageData);

    return NextResponse.json({
      message: "Package created successfully",
      packageId: newPackageRef.id,
    });
  } catch (error) {
    console.error("Error creating package:", error);
    return NextResponse.json({ error: "Failed to create package" }, { status: 500 });
  }
});