import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc, query, where, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Booking, BookingStatus } from '../types';

const BOOKINGS = 'bookings';
const SERVICE_FEE_RATE = 0.12;

export async function createBooking(
  data: Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'serviceFeeISK'>,
): Promise<Booking> {
  const serviceFeeISK = Math.round(data.totalISK * SERVICE_FEE_RATE);
  const docData = {
    ...data,
    serviceFeeISK,
    status: 'pending' as BookingStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, BOOKINGS), docData);
  return { ...docData, id: ref.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

export async function getBooking(id: string): Promise<Booking | null> {
  const snap = await getDoc(doc(db, BOOKINGS, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } as Booking : null;
}

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<void> {
  await updateDoc(doc(db, BOOKINGS, id), { status, updatedAt: serverTimestamp() });
}

export async function getBookingsForUser(uid: string): Promise<Booking[]> {
  // Firestore doesn't support OR queries across fields natively, so we do two queries
  const [asRenter, asOwner] = await Promise.all([
    getDocs(query(collection(db, BOOKINGS), where('renterId', '==', uid), orderBy('createdAt', 'desc'))),
    getDocs(query(collection(db, BOOKINGS), where('ownerId', '==', uid), orderBy('createdAt', 'desc'))),
  ]);

  const map = new Map<string, Booking>();
  for (const snap of [asRenter, asOwner]) {
    for (const d of snap.docs) {
      map.set(d.id, { id: d.id, ...d.data() } as Booking);
    }
  }
  return [...map.values()].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
}

export async function getBookingsForItem(itemId: string): Promise<Booking[]> {
  const q = query(
    collection(db, BOOKINGS),
    where('itemId', '==', itemId),
    where('status', 'not-in', ['cancelled', 'rejected']),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking));
}
