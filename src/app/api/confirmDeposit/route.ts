import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const { customerId, packageId } = await req.json();

    if (!customerId || !packageId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify package exists and belongs to this customer
    const packageRef = doc(firestore, "packages", packageId);
    const packageSnap = await getDoc(packageRef);
    if (!packageSnap.exists()) {
      return NextResponse.json(
        { success: false, message: "Package not found" },
        { status: 404 }
      );
    }

    const packageData = packageSnap.data();
    if (packageData.customerId !== customerId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized deposit confirmation" },
        { status: 403 }
      );
    }

    // Update customer to mark deposit as paid and extend expiry by 6 months
    const customerRef = doc(firestore, "customers", customerId);
    const customerSnap = await getDoc(customerRef);
    if (!customerSnap.exists()) {
      return NextResponse.json(
        { success: false, message: "Customer not found" },
        { status: 404 }
      );
    }

    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

    await updateDoc(customerRef, {
      depositPaid: true,
      expiresAt: sixMonthsLater.toISOString(),
    });

    // Also update the package record
    await updateDoc(packageRef, {
      depositPaid: true,
    });

    return NextResponse.json({
      success: true,
      message: "Deposit confirmed and expiry extended by 6 months",
    });
  } catch (error: any) {
    console.error("Error confirming deposit:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}