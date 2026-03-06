import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCx0ib7u0CuUTthQtLCkBfVAO-O-gTvHkE",
  authDomain: "amor-fly-f31f0.firebaseapp.com",
  projectId: "amor-fly-f31f0",
  storageBucket: "amor-fly-f31f0.firebasestorage.app",
  messagingSenderId: "33370056153",
  appId: "1:33370056153:web:3f21500f01d885f11765c8",
  measurementId: "G-F61EFP27H9"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
