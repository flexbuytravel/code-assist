"use client";

import { useState } from "react";

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [depositOnly, setDepositOnly] = useState(true);
  const [includeInsurance, setIncludeInsurance] = useState(false);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      const packageId = document.getElementById("packageIdInput")?.value;

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
        window.location.href = data.url; // Redirect to Stripe Checkout
      } else {
        alert(data.error || "Something went wrong");
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Claim Your Package</h1>
      <input
        id="packageIdInput"
        placeholder="Enter Package ID"
        className="border p-2 rounded mb-4 block w-full"
      />

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
        onClick={handleCheckout}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Processing..." : "Checkout"}
      </button>
    </div>
  );
}