import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAP-X_wGYPOxRepba-YLkZzb64e4qzAeaA",
  authDomain: "lendo-9eb23.firebaseapp.com",
  projectId: "lendo-9eb23",
  storageBucket: "lendo-9eb23.firebasestorage.app",
  messagingSenderId: "485876916892",
  appId: "1:485876916892:web:d35b90d9b11ff289988359",
  measurementId: "G-H4CRQSTMZD"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
