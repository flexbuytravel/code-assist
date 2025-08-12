// src/app/admin/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { getAuth, updatePassword, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";

export default function AdminSettingsPage() {
  const auth = getAuth();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/auth/login");
        return;
      }
      // Fetch custom claims for role
      const tokenResult = await currentUser.getIdTokenResult(true);
      if (tokenResult.claims.role !== "admin") {
        router.push("/auth/login");
        return;
      }
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth, router]);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (!user) throw new Error("No authenticated user.");
      await updatePassword(user, newPassword);
      setMessage({ type: "success", text: "Password updated successfully." });
      setNewPassword("");
    } catch (error: any) {
      console.error(error);
      setMessage({ type: "error", text: error.message || "Failed to update password." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">Admin Settings</h1>

        <div className="max-w-md bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Update Password</h2>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
          {message && (
            <p
              className={`mt-4 text-sm ${
                message.type === "success" ? "text-green-600" : "text-red-600"
              }`}
            >
              {message.text}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}