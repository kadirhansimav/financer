import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// LÜTFEN AŞAĞIDAKİ ALANLARI FIREBASE KONSOLUNDAN ALDIĞINIZ BİLGİLERLE DOLDURUN
// Firebase Console -> Project Settings -> General -> Your Apps kısmından alabilirsiniz.
const firebaseConfig = {
  apiKey: "AIzaSyC90nduSGga4ehcZpS9e8gPjZOkUFfRx8s",
  authDomain: "finance-cde1b.firebaseapp.com",
  projectId: "finance-cde1b",
  storageBucket: "finance-cde1b.firebasestorage.app",
  messagingSenderId: "571856851136",
  appId: "1:571856851136:web:871d49e84d71fad7535d25",
  measurementId: "G-WRX8VVKX3C"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Servisleri dışa aktar
export const auth = getAuth(app);
export const db = getFirestore(app);