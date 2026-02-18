import {
  collection, doc, setDoc, deleteDoc, getDocs, getDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Favorite } from '../types';

function favRef(uid: string, itemId: string) {
  return doc(db, 'users', uid, 'favorites', itemId);
}

export async function toggleFavorite(uid: string, itemId: string): Promise<boolean> {
  const ref = favRef(uid, itemId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await deleteDoc(ref);
    return false; // removed
  }
  await setDoc(ref, { itemId, addedAt: serverTimestamp() });
  return true; // added
}

export async function getFavorites(uid: string): Promise<Favorite[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'favorites'));
  return snap.docs.map(d => ({ itemId: d.id, ...d.data() } as Favorite));
}

export async function isFavorite(uid: string, itemId: string): Promise<boolean> {
  const snap = await getDoc(favRef(uid, itemId));
  return snap.exists();
}
