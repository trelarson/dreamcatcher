import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration (paste what you copied earlier)
const firebaseConfig = {
  apiKey: "AIzaSyDICBOzLftCTyVpG5_YY85ke7XzctNt6r4",
  authDomain: "dreamcatcher-brass.firebaseapp.com",
  projectId: "dreamcatcher-brass",
  storageBucket: "dreamcatcher-brass.firebasestorage.app",
  messagingSenderId: "849277838244",
  appId: "1:849277838244:web:f83523a896ef6c5f7ad731",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
