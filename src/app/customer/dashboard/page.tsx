"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, firestore } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function CustomerDashboard() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [customerData, setCustomerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [paymentType, setPaymentType] = useState<"deposit" | "full">("full");
  const [insurance, setInsurance] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserId(user.uid);

        const customerRef = doc(firestore, "customers", user.uid);
        const customerSnap = await getDoc(customerRef);

        if (customerSnap.exists()) {
          setCustomerData(customerSnap.data());
        }
      } else {
        router.push("/auth/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handlePayment = async () => {
    if (!userId) return;

    setProcessingPayment(true);

    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: userId,
          paymentType,
          insurance,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe Checkout
      } else {
        console.error("Failed to create checkout session:", data.error);
      }
    } catch (error) {
      console.error("Payment error:", error);
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) return <p>Loading dashboard...</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Customer Dashboard</h1>

      {customerData?.packageId ? (
        <div className="border p-4 rounded-lg bg-white shadow">
          <p>
            <strong>Package ID:</strong> {customerData.packageId}
          </p>
          <p>
            <strong>Price per Trip:</strong> ${customerData.packagePrice}
          </p>
          <p>
            <strong>Trips:</strong> {customerData.tripCount}
          </p>

          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={paymentType === "deposit"}
                onChange={(e) =>
                  setPaymentType(e.target.checked ? "deposit" : "full")
                }
              />
              Pay Deposit Only (20% now, balance later)
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={insurance}
                onChange={(e) => setInsurance(e.target.checked)}
              />
              Add Trip Insurance (doubles trips)
            </label>

            <button
              onClick={handlePayment}
              disabled={processingPayment}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {processingPayment ? "Processing..." : "Pay Now"}
            </button>
          </div>
        </div>
      ) : (
        <p>No package assigned yet.</p>
      )}
    </div>
  );
}