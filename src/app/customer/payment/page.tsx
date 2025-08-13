"use client";

import { useState } from "react";

export default function PaymentPage({ customerId }: { customerId: string }) {
  const [option, setOption] = useState<"deposit" | "doubleUp" | "full">("deposit");
  const [loading, setLoading] = useState(false);

  // Stripe Price IDs (test mode)
  const priceMap: Record<string, string> = {
    deposit: "price_xxxxx_deposit", // $200
    doubleUp: "price_xxxxx_doubleUp", // $600
    full: "price_xxxxx_full", // full package price
  };

  const handlePayment = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          option,
          priceId: priceMap[option],
          successUrl: `${window.location.origin}/success`,
          cancelUrl: `${window.location.origin}/cancel`,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to create checkout session");
      }
    } catch (err) {
      console.error("Payment error:", err);
      alert("An error occurred during payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Choose Your Payment Option</h2>
      <div>
        <label>
          <input
            type="radio"
            name="paymentOption"
            value="deposit"
            checked={option === "deposit"}
            onChange={() => setOption("deposit")}
          />
          Deposit - $200 (adds 1 trip, 6-month extension)
        </label>
      </div>
      <div>
        <label>
          <input
            type="radio"
            name="paymentOption"
            value="doubleUp"
            checked={option === "doubleUp"}
            onChange={() => setOption("doubleUp")}
          />
          Double Up - $600 (doubles trips, 54-month extension)
        </label>
      </div>
      <div>
        <label>
          <input
            type="radio"
            name="paymentOption"
            value="full"
            checked={option === "full"}
            onChange={() => setOption("full")}
          />
          Pay Full Price (no booking timer)
        </label>
      </div>

      <button
        onClick={handlePayment}
        disabled={loading}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: "black",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        {loading ? "Processing..." : "Proceed to Payment"}
      </button>
    </div>
  );
}