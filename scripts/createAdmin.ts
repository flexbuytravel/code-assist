import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import dotenv from "dotenv";

dotenv.config();

// Firebase config (use the same env vars as your app)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app);

const ADMIN_EMAIL = "admin@flexbuytravel.com";
const ADMIN_PASSWORD = "poopie";

async function createAdminUser() {
  try {
    // Try to create the user
    const userCred = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log(`✅ Created admin user: ${ADMIN_EMAIL}`);
    await setAdminRole(userCred.user.uid);
  } catch (err: any) {