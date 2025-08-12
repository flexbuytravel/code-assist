"use client";

import { useState, useEffect } from "react";
import { auth, db, functions } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useRouter } from "next/navigation";

export default function CustomerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [customerData, setCustomerData] = useState<any>(null);
  const [packageData, setPackageData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Listen for auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/home");
        return;
      }
      setUser(u);

      try {
        // Get customer doc
        const custSnap = await getDoc(doc(db, "customers", u.uid));
        if (!custSnap.exists()) {
          setError("Customer record not found.");
          setLoading(false);
          return;
        }
        const custData = custSnap.data();
        setCustomerData(custData);

        // Get package doc
        const pkgSnap = await getDoc(doc(db, "packages", custData.packageId));
        if (!pkgSnap.exists()) {
          setError("Package record not found.");
          setLoading(false);
          return;
        }
        const pkgData = pkgSnap.data();
        setPackageData(pkgData);

        if (pkgData.claimStartTime) {
          const expirationTime =
            pkgData.claimStartTime.toMillis() + 48 * 60 * 60 * 1000;
          setTimeLeft(expirationTime - Date.now());
        }
      } catch (err) {
        console.error(err);
        setError("Error loading dashboard.");
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  // Countdown interval
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1000 : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const handleProceedToPayment = async () => {
    if (timeLeft !== null && timeLeft <= 0) {
      setError("This package claim has expired.");
      return;
    }
    try {
      const checkoutFn = httpsCallable(functions, "createCheckoutSession");
      const sessionRes: any = await checkoutFn({ packageId: customerData.packageId });
      const sessionId = sessionRes.data.id;
      if (!sessionId) throw new Error("Failed to create checkout session.");
      window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not start payment.");
    }
  };

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Customer Dashboard</h1>

      {packageData && (
        <div className="bg-white shadow rounded p-4 mb-4">
          <h2 className="text-xl font-semibold mb-2">Your Package</h2>
          <p><strong>Package ID:</strong> {customerData.packageId}</p>
          <p><strong>Referral ID:</strong> {customerData.referralId || "N/A"}</p>
          <p><strong>Price:</strong> ${packageData.price}</p>

          {timeLeft !== null && (
            <div className={`mt-3 font-medium ${timeLeft <= 0 ? "text-red-600" : "text-green-600"}`}>
              {timeLeft <= 0
                ? "Claim expired — please contact support."
                : `Time remaining to pay: ${formatTime(timeLeft)}`}
            </div>
          )}
        </div>
      )}

      {timeLeft !== null && timeLeft > 0 && (
        <button
          onClick={handleProceedToPayment}
          className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
        >
          Proceed to Payment
        </button>
      )}
    </div>
  );
}