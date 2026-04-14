import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCTjh2GXaDC_bBL8LCLPyrAO5k84eACLiM",
  authDomain: "la-intranet-8651f.firebaseapp.com",
  projectId: "la-intranet-8651f",
  storageBucket: "la-intranet-8651f.firebasestorage.app",
  messagingSenderId: "633975796359",
  appId: "1:633975796359:web:ff685054fd32f78d38fe22",
  measurementId: "G-VRER7XXJV7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const newMembers = [
  {
    studentId: "204306",
    name: "박민선",
    phone: "010-4669-7611",
    email: "worlffkf@gmail.com",
    address: "전라남도 목포시 하당로 30번길 11(상동) 3층",
    batch: "1기",
    grade: "졸업생",
    photoUrl: "https://api.dicebear.com/9.x/initials/svg?seed=박민선",
    researchFields: "조경학과 1기 연구생",
    createdAt: serverTimestamp()
  },
  {
    studentId: "164306",
    name: "김민수",
    phone: "010-5420-3671",
    email: "kms33550@naver.com",
    address: "전라남도 진도군 진도읍 성동길 8-17 (성동연립주택) 2층 208호",
    batch: "1기",
    grade: "졸업생",
    photoUrl: "https://api.dicebear.com/9.x/initials/svg?seed=김민수",
    researchFields: "조경학과 1기 연구생",
    createdAt: serverTimestamp()
  }
];

async function seed() {
  try {
    for (const member of newMembers) {
      await addDoc(collection(db, "members"), member);
      console.log(`Added ${member.name}`);
    }
    console.log("Successfully seeded 1st batch members!");
    process.exit(0);
  } catch (e) {
    console.error("Error adding document: ", e);
    process.exit(1);
  }
}

seed();
