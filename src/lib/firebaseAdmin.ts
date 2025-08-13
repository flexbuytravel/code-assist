import * as admin from "firebase-admin";

if (!admin.apps.length) {
  if (process.env.NODE_ENV === "development") {
    // Local emulator
    admin.initializeApp({
      projectId: "demo-project", // change to your Firebase project ID
    });
  } else {
    // Production
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();

// Connect to emulators if in dev
if (process.env.NODE_ENV === "development") {
  adminDb.settings({
    host: "localhost:8080",
    ssl: false,
  });
}