import { NextResponse } from "next/server";
import { auth, firestore } from "@/lib/firebase";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

export async function POST(req: Request) {
  try {
    const { name, email, password, phone, address, packageId } = await req.json();

    if (!name || !email || !password || !packageId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify package exists
    const packageRef = doc(firestore, "packages", packageId);
    const packageSnap = await getDoc(packageRef);
    if (!packageSnap.exists()) {
      return NextResponse.json(
        { success: false, message: "Package not found" },
        { status: 404 }
      );
    }

    const packageData = packageSnap.data();

    // Prevent reuse if already claimed
    if (packageData.claimed) {
      return NextResponse.json(
        { success: false, message: "Package already claimed" },
        { status: 409 }
      );
    }

    // Create Firebase Auth user
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;

    // Create customer document
    await setDoc(doc(firestore, "customers", uid), {
      uid,
      name,
      email,
      phone: phone || "",
      address: address || "",
      role: "customer",
      packageId,
      agentId: packageData.agentId,
      companyId: packageData.companyId,
      depositPaid: false,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours from now
      createdAt: new Date().toISOString(),
    });

    // Mark package as claimed
    await updateDoc(packageRef, {
      claimed: true,
      customerId: uid,
    });

    return NextResponse.json({
      success: true,
      message: "Customer registered and package claimed successfully",
      data: { uid, name, email, packageId },
    });
  } catch (error: any) {
    console.error("Error registering customer:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}