// This file uses the "compat" version of Firebase to work with the <script> tags in your HTML.
// It avoids "import" statements to prevent syntax errors.

// Your Woke Coffee web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAImuN5YnOW53GTV1Pc5Fs5lJGtJtuJLM8", // Replace with your actual API key
  authDomain: "symbiosis-7a23b.firebaseapp.com",
  projectId: "symbiosis-7a23b",
  storageBucket: "symbiosis-7a23b.appspot.com",
  messagingSenderId: "1049959814526", // Replace with your value
  appId: "1:1049959814526:web:b9d90bc22e2861b5b28f2f" // Replace with your value
};

// Initialize Firebase using the global `firebase` object from the compat SDK script
firebase.initializeApp(firebaseConfig);

// Create a constant `db` that your other scripts (shop.js, blog.js, admin.js) can use to interact with Firestore.
const db = firebase.firestore();

// ---
// Optional: A small check to confirm it's working in the console.
// console.log("Firebase config loaded and initialized successfully.");
// ---