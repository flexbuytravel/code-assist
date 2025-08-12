"use client";

import { useState, useEffect } from "react";

export default function CompanySettings() {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check Stripe connection status on page load
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/company/stripe/status");
        const data = await res.json();
        if (data.connected) {
          setConnected(true);
        }
      } catch (err) {
        console.error("Error checking Stripe status", err);
      } finally {
        setChecking(false);
      }
    };
    checkStatus();
  }, []);

  const handleConnectStripe = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/company/stripe/connect", {
        method: "POST",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe onboarding
      } else {
        alert(data.error || "Unable to start Stripe onboarding");
      }
    } catch (err) {
      console.error("Error starting Stripe onboarding", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Company Settings</h1>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Stripe Connection</h2>

        {checking ? (
          <p>Checking connection status...</p>
        ) : connected ? (
          <p className="text-green-600 font-semibold">
            ✅ Your company is connected to Stripe.
          </p>
        ) : (
          <>
            <p className="mb-4">
              Connect your company’s Stripe account to start receiving payments
              directly.
            </p>
            <button
              onClick={handleConnectStripe}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              {loading ? "Connecting..." : "Connect Stripe"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}