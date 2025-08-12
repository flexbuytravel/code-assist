"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const packageId = searchParams.get("packageId") || "";
  const [status, setStatus] = useState<"loading" | "success" | "pending" | "error">("loading");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!packageId) {
      setStatus("error");
      return;
    }

    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/home");
        return;
      }
      setUserId(user.uid);

      try {
        const pkgRef = doc(db, "packages", packageId);
        const pkgSnap = await getDoc(pkgRef);

        if (!pkgSnap.exists()) {
          setStatus("error");
          return;
        }

        const pkgData = pkgSnap.data();
        if (pkgData.claimedBy === user.uid) {
          setStatus("success");
        } else if (!pkgData.claimedBy) {
          // Payment succeeded but webhook not processed yet
          setStatus("pending");
          // Optional: re-check after a short delay
          setTimeout(async () => {
            const retrySnap = await getDoc(pkgRef);
            if (retrySnap.exists() && retrySnap.data().claimedBy === user.uid) {
              setStatus("success");
            }
          }, 3000);
        } else {
          setStatus("error");
        }
      } catch (err) {
        console.error("Error checking payment status:", err);
        setStatus("error");
      }
    });
  }, [packageId, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
      <Image src="/logo2.png" alt="FlexBuy Logo" width={150} height={150} className="mb-6" />

      {status === "loading" && <p className="text-lg">Checking payment status...</p>}

      {status === "pending" && (
        <>
          <p className="text-lg mb-2">Your payment was successful, but we’re finalizing your package claim.</p>
          <p>Please wait a few moments...</p>
        </>
      )}

      {status === "success" && (
        <>
          <h1 className="text-2xl font-bold mb-2">Payment Successful! 🎉</h1>
          <p className="mb-4">Your package has been successfully claimed and registered to your account.</p>
          <button
            onClick={() => router.push("/customer-dashboard")}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </>
      )}

      {status === "error" && (
        <>
          <h1 className="text-2xl font-bold mb-2 text-red-600">Payment Confirmation Failed</h1>
          <p className="mb-4">We couldn’t verify your payment. Please contact support.</p>
          <button
            onClick={() => router.push("/home")}
            className="bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
          >
            Back to Home
          </button>
        </>
      )}
    </div>
  );
}