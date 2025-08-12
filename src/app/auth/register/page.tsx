"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    packageId: "",
    referralId: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const pkg = searchParams.get("packageId") || "";
    const ref = searchParams.get("referralId") || "";
    if (pkg || ref) {
      setForm((prev) => ({
        ...prev,
        packageId: pkg,
        referralId: ref,
      }));
    }
  }, [searchParams]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!form.name.trim()) newErrors.name = "Name is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Invalid email format.";
    if (!form.password)
      newErrors.password = "Password is required.";
    else if (form.password.length < 8)
      newErrors.password = "Password must be at least 8 characters.";
    else if (!/[A-Z]/.test(form.password))
      newErrors.password = "Password must contain an uppercase letter.";
    else if (!/\d/.test(form.password))
      newErrors.password = "Password must contain a number.";

    if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match.";

    if (!/^\+?\d{10,15}$/.test(form.phone))
      newErrors.phone = "Invalid phone number.";

    if (!form.address.trim())
      newErrors.address = "Address is required.";

    if (!form.packageId.trim())
      newErrors.packageId = "Package ID is required.";

    if (!form.referralId.trim())
      newErrors.referralId = "Referral ID is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        role: "customer",
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        packageId: form.packageId,
        referralId: form.referralId,
        createdAt: serverTimestamp(),
      });

      router.push("/customer/dashboard");
    } catch (error: any) {
      console.error(error);
      setErrors({ firebase: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-6 text-center text-2xl font-bold">
          Create Your Account
        </h2>
        {errors.firebase && (
          <p className="mb-4 text-sm text-red-500">{errors.firebase}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            className="w-full rounded border p-2"
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full rounded border p-2"
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="w-full rounded border p-2"
          />
          {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange}
            className="w-full rounded border p-2"
          />
          {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}

          <input
            type="text"
            name="phone"
            placeholder="Phone Number"
            value={form.phone}
            onChange={handleChange}
            className="w-full rounded border p-2"
          />
          {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}

          <input
            type="text"
            name="address"
            placeholder="Address"
            value={form.address}
            onChange={handleChange}
            className="w-full rounded border p-2"
          />
          {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}

          <input
            type="text"
            name="packageId"
            placeholder="Package ID"
            value={form.packageId}
            onChange={handleChange}
            className="w-full rounded border p-2"
            disabled={!!searchParams.get("packageId")}
          />
          {errors.packageId && <p className="text-sm text-red-500">{errors.packageId}</p>}

          <input
            type="text"
            name="referralId"
            placeholder="Referral ID"
            value={form.referralId}
            onChange={handleChange}
            className="w-full rounded border p-2"
            disabled={!!searchParams.get("referralId")}
          />
          {errors.referralId && <p className="text-sm text-red-500">{errors.referralId}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}