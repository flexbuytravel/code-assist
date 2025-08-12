"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth"; // Your auth hook
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [customerData, setCustomerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchCustomerData = async () => {
      try {
        const docRef = doc(db, "customers", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCustomerData(docSnap.data());
        }
      } catch (err) {
        console.error("Error fetching customer data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [user]);

  const handlePayDeposit = async () => {
    if (!customerData || !customerData.packageId) {
      alert("No package found for your account.");
      return;
    }

    setPaying(true);
    try {
      const res = await fetch("/api/createCheckoutSession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: user?.uid,
          packageId: customerData.packageId,
          price: customerData.depositAmount || 100, // fallback default
        }),
      });

      const { url, error } = await res.json();
      if (error) {
        alert(error);
        setPaying(false);
        return;
      }
      window.location.href = url; // Redirect to Stripe
    } catch (err) {
      console.error("Payment error:", err);
      setPaying(false);
    }
  };

  if (loading) return <p>Loading dashboard...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Customer Dashboard</h1>

      {customerData && (
        <div className="bg-white shadow-md rounded p-4 mb-6">
          <p><strong>Package ID:</strong> {customerData.packageId}</p>
          <p><strong>Referral ID:</strong> {customerData.referralId}</p>
          <p>
            <strong>Deposit Paid:</strong>{" "}
            {customerData.depositPaid ? "✅ Yes" : "❌ No"}
          </p>
          {customerData.expiryDate && (
            <p>
              <strong>Expiry Date:</strong>{" "}
              {new Date(customerData.expiryDate.seconds * 1000).toLocaleString()}
            </p>
          )}

          {!customerData.depositPaid && (
            <button
              onClick={handlePayDeposit}
              disabled={paying}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {paying ? "Processing..." : "Pay Deposit"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}