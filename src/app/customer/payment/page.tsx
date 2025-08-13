"use client";

import { useState } from "react";

export default function PaymentPage({ params }: { params: { packageId: string } }) {
  const [option, setOption] = useState("deposit");
  const [loading, setLoading] = useState(false);

  // Adjust package base price here if needed
  const basePrice = 998; // promotional package price

  const getTotalPrice = () => {
    if (option === "deposit") return 200;
    if (option === "double-up") return basePrice + 600;
    if (option === "full") return basePrice;
    return basePrice;
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: params.packageId,
          option,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to start checkout session.");
      }
    } catch (err) {
      console.error("Error starting checkout:", err);
      alert("Checkout error");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Complete Your Payment</h1>
      <p>Package ID: {params.packageId}</p>

      <div>
        <label>
          <input
            type="radio"
            name="paymentOption"
            value="deposit"
            checked={option === "deposit"}
            onChange={() => setOption("deposit")}
          />
          Deposit - $200
        </label>
        <br />
        <label>
          <input
            type="radio"
            name="paymentOption"
            value="double-up"
            checked={option === "double-up"}
            onChange={() => setOption("double-up")}
          />
          Double-Up - ${basePrice + 600}
        </label>
        <br />
        <label>
          <input
            type="radio"
            name="paymentOption"
            value="full"
            checked={option === "full"}
            onChange={() => setOption("full")}
          />
          Full Payment - ${basePrice}
        </label>
      </div>

      <p style={{ marginTop: 20, fontSize: "1.2rem" }}>
        <strong>Total: ${getTotalPrice()}</strong>
      </p>

      <button
        onClick={handleCheckout}
        disabled={loading}
        style={{
          padding: "10px 20px",
          fontSize: "1rem",
          cursor: "pointer",
          background: "#0070f3",
          color: "#fff",
          border: "none",
          borderRadius: 4,
        }}
      >
        {loading ? "Redirecting..." : "Pay Now"}
      </button>
    </div>
  );
}