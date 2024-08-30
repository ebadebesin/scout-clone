// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAEBsK4WTAb-_mOOYCNm1JCe6HzpKqcay0",
  authDomain: "final-p-90397.firebaseapp.com",
  projectId: "final-p-90397",
  storageBucket: "final-p-90397.appspot.com",
  messagingSenderId: "127140807419",
  appId: "1:127140807419:web:5d1923e9771d4482f7a65e",
  measurementId: "G-645ZY801Y8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const db = getFirestore(app);

export { db }; // Export the Firestore instance