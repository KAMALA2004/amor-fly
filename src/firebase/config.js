import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBl52Qe0IVhUmDKPEskWOFtHlBqh8CNzF4",
  authDomain: "amor-fly.firebaseapp.com",
  projectId: "amor-fly",
  storageBucket: "amor-fly.firebasestorage.app",
  messagingSenderId: "788920448601",
  appId: "1:788920448601:web:92ba7acd7b927e444ca348",
  measurementId: "G-MFN2D3KHEE"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
