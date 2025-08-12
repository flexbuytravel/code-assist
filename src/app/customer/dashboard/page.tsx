"use client";

import { useState } from "react";

export default function CustomerDashboardPage() {
  const [loading, setLoading] = useState(false);
  const [depositOnly, setDepositOnly] = useState(true);
  const [includeInsurance, setIncludeInsurance] = useState(false);

  const handleCheckout = async (packageId: string) => {
    try {
      setLoading(true);

      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId,
          depositOnly,
          includeInsurance,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Something went wrong");
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setLoading(false);
    }
  };

  // This would be fetched from Firestore for the logged-in customer
  const myPackageId = "CUSTOMER_PACKAGE_ID_HERE";

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Customer Dashboard</h1>

      <label className="block mb-2">
        <input
          type="checkbox"
          checked={depositOnly}
          onChange={() => setDepositOnly(!depositOnly)}
        />{" "}
        Pay Deposit Only
      </label>

      <label className="block mb-4">
        <input
          type="checkbox"
          checked={includeInsurance}
          onChange={() => setIncludeInsurance(!includeInsurance)}
        />{" "}
        Add Trip Insurance
      </label>

      <button
        disabled={loading}
        onClick={() => handleCheckout(myPackageId)}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Processing..." : "Pay Now"}
      </button>
    </div>
  );
}