/**
 * Firebase configuration and initialization module
 * This module handles the setup and validation of Firebase services
 */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

/**
 * Firebase configuration object containing essential API keys and identifiers
 * Values are loaded from environment variables for security
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

/**
 * Validates the Firebase configuration by checking for required fields
 * Throws an error if any required configuration values are missing
 */
const validateConfig = () => {
  const requiredFields = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];

  const missingFields = requiredFields.filter(
    field => !firebaseConfig[field as keyof typeof firebaseConfig]
  );

  if (missingFields.length > 0) {
    throw new Error(
      `Missing required Firebase configuration fields: ${missingFields.join(', ')}`
    );
  }
};

// Validate configuration before initialization
validateConfig();

// Initialize Firebase app instance
const app = initializeApp(firebaseConfig);

// Export initialized Firebase services
export const auth = getAuth(app);         // Authentication service
export const storage = getStorage(app);    // Cloud Storage service
export const db = getFirestore(app);      // Firestore database service
export const analytics = getAnalytics(app); // Analytics service
export const functions = getFunctions(app, 'us-west1');  // Cloud Functions service (us-west1 region)