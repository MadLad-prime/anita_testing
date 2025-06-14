// ⚠️ PASTE YOUR FIREBASE CONFIGURATION OBJECT HERE ⚠️
// This is an example, replace with your actual config from the Firebase console
const firebaseConfig = {
    apiKey: "AIzaSyCqRfBspIXHiFrKoJk7KEAjq49zk5SQfRs",
    authDomain: "gym-agent.firebaseapp.com",
    projectId: "gym-agent",
    storageBucket: "gym-agent.firebasestorage.app",
    messagingSenderId: "24360577316",
    appId: "1:24360577316:web:bc159758d351f8d7c26bb1",
    measurementId: "G-YVHKDDVRW4"
};

let app;
let db;

try {
    app = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    console.log("Firebase initialized successfully.");
} catch (e) {
    console.error("Error initializing Firebase:", e);
    alert("Firebase could not be initialized. Please check your configuration and ensure SDKs are loaded.");
}