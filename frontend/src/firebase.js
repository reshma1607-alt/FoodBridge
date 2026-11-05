import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBKmamZsBttTFrI8DEtJpwEi3TVahrJba8",
  authDomain: "foodbridge-9334b.firebaseapp.com",
  projectId: "foodbridge-9334b",
  storageBucket: "foodbridge-9334b.firebasestorage.app",
  messagingSenderId: "663074531040",
  appId: "1:663074531040:web:a8b92e86113566a7f05285",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);