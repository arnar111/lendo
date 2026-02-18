import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { User } from '../types';

const googleProvider = new GoogleAuthProvider();

export async function signUp(email: string, password: string, displayName: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = buildUser(cred.user, displayName);
  await setDoc(doc(db, 'users', cred.user.uid), { ...user, createdAt: serverTimestamp(), lastActiveAt: serverTimestamp() });
  return user;
}

export async function signIn(email: string, password: string): Promise<FirebaseUser> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signInWithGoogle(): Promise<User> {
  const cred = await signInWithPopup(auth, googleProvider);
  const existingDoc = await getDoc(doc(db, 'users', cred.user.uid));
  if (existingDoc.exists()) {
    return existingDoc.data() as User;
  }
  const user = buildUser(cred.user, cred.user.displayName || 'Notandi');
  await setDoc(doc(db, 'users', cred.user.uid), { ...user, createdAt: serverTimestamp(), lastActiveAt: serverTimestamp() });
  return user;
}

export async function logout(): Promise<void> {
  await firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

export async function getUserProfile(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as User) : null;
}

function buildUser(fbUser: FirebaseUser, displayName: string): User {
  return {
    uid: fbUser.uid,
    displayName,
    email: fbUser.email || '',
    photoURL: fbUser.photoURL || undefined,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    defaultRadiusKm: 5,
    ratingAsOwnerAvg: 0,
    ratingAsRenterAvg: 0,
    ratingCountAsOwner: 0,
    ratingCountAsRenter: 0,
  };
}
