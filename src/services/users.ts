import { doc, getDoc, updateDoc, onSnapshot, serverTimestamp, type Unsubscribe } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { User } from '../types';

const USERS = 'users';

export async function getUser(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, USERS, uid));
  return snap.exists() ? { uid: snap.id, ...snap.data() } as User : null;
}

export async function updateUser(uid: string, data: Partial<User>): Promise<void> {
  await updateDoc(doc(db, USERS, uid), { ...data, lastActiveAt: serverTimestamp() });
}

export function subscribeToUser(uid: string, callback: (user: User | null) => void): Unsubscribe {
  return onSnapshot(doc(db, USERS, uid), snap => {
    callback(snap.exists() ? { uid: snap.id, ...snap.data() } as User : null);
  });
}
