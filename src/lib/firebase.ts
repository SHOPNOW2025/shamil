import { initializeApp } from 'firebase/app';
import { getAuth, indexedDBLocalPersistence, setPersistence } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDQujQ0BJzGvA_kGIdgrFSRMYeXVfErpyI",
  authDomain: "shamil-b3ea3.firebaseapp.com",
  projectId: "shamil-b3ea3",
  storageBucket: "shamil-b3ea3.firebasestorage.app",
  messagingSenderId: "748277812309",
  appId: "1:748277812309:web:8624856379d69781f9d8dc",
  measurementId: "G-3VP7K7ZZ7K"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Set persistence to indexedDBLocalPersistence for better iframe compatibility
setPersistence(auth, indexedDBLocalPersistence).catch((err) => {
  console.error("Auth persistence error:", err);
});

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export default app;
