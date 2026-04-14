import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCTjh2GXaDC_bBL8LCLPyrAO5k84eACLiM",
  authDomain: "la-intranet-8651f.firebaseapp.com",
  projectId: "la-intranet-8651f",
  storageBucket: "la-intranet-8651f.firebasestorage.app",
  messagingSenderId: "633975796359",
  appId: "1:633975796359:web:ff685054fd32f78d38fe22",
  measurementId: "G-VRER7XXJV7"
};

// Initialize Firebase (SSR Safe)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
