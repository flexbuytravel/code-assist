"use client";

import { httpsCallable } from "firebase/functions";
import { functions } from "./firebaseClient";

// ADMIN → Create Company
export const createCompanyUser = async (email: string, displayName: string) => {
  const callable = httpsCallable(functions, "createCompanyUser");
  return (await callable({ email, displayName })).data;
};

// COMPANY → Create Agent
export const createAgentUser = async (email: string, displayName: string) => {
  const callable = httpsCallable(functions, "createAgentUser");
  return (await callable({ email, displayName })).data;
};

// PUBLIC → Register as Customer
export const createCustomerUser = async () => {
  const callable = httpsCallable(functions, "createCustomerUser");
  return (await callable({})).data;
};

// AGENT → Create Package
export const createPackage = async (name: string, description: string, price: number) => {
  const callable = httpsCallable(functions, "createPackage");
  return (await callable({ name, description, price })).data;
};

// CUSTOMER → Claim Package
export const claimPackage = async (packageId: string) => {
  const callable = httpsCallable(functions, "claimPackage");
  return (await callable({ packageId })).data;
};

// CUSTOMER → Stripe Checkout
export const createCheckoutSession = async (packageId: string) => {
  const callable = httpsCallable(functions, "createCheckoutSession");
  return (await callable({ packageId })).data;
};