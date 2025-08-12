
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "flexwave-deals",
  appId: "1:189754515716:web:a4798182774bef79607051",
  storageBucket: "flexwave-deals.firebasestorage.app",
  apiKey: "AIzaSyAwmt6EkyZLsF3XV3iL4pUmDKixEzNK4GE",
  authDomain: "flexwave-deals.firebaseapp.com",
  messagingSenderId: "189754515716",
};

// Singleton pattern for Firebase services
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

auth = getAuth(app);
db = getFirestore(app);

export { app, auth, db };

