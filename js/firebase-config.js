// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAeNU_prYg4OwnJs4gNrsKXS-NIae9KE6g",
    authDomain: "meal-planner-a5e0e.firebaseapp.com",
    databaseURL: "https://meal-planner-a5e0e-default-rtdb.firebaseio.com",
    projectId: "meal-planner-a5e0e",
    storageBucket: "meal-planner-a5e0e.firebasestorage.app",
    messagingSenderId: "416117855023",
    appId: "1:416117855023:web:eb8d3abcff2e4cf01487da",
    measurementId: "G-Q5GETBGNGX"
};

// Initialize Firebase
let db = null;
let isFirebaseConfigured = false;

try {
    if (firebaseConfig.apiKey !== "YOUR_API_KEY_HERE") {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        isFirebaseConfigured = true;
        console.log("Firebase initialized successfully");
    } else {
        console.log("Firebase not configured - using local storage only");
    }
} catch (error) {
    console.error("Firebase initialization error:", error);
}

// Export for use in other modules
window.firebaseState = {
    db,
    isFirebaseConfigured,
    firebase
};