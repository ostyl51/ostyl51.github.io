// Firebase web config for the project request form.
// Paste the values from Firebase console → Project settings → Your apps → Web app.
// These values are not secret: access is controlled by the Firestore security rules (firestore.rules).
// Until projectId is filled in, the form falls back to opening the visitor's email app.
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
