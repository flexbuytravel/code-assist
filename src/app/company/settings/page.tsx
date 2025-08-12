"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth"; // Assuming you have a custom auth hook

export default function CompanySettingsPage() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const connectStripe = async () => {
    if (!user) return alert("You must be logged in");

    setLoading(true);
    try {
      const res = await fetch("/api/company/stripe/create-account-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect Stripe account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Company Settings</h1>
      <button onClick={connectStripe} disabled={loading}>
        {loading ? "Connecting to Stripe..." : "Connect Stripe Account"}
      </button>
    </div>
  );
}