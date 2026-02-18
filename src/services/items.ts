import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc, query, where, orderBy, onSnapshot,
  serverTimestamp, type Unsubscribe, limit as firestoreLimit,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { geohashForLocation, geohashQueryBounds, distanceBetween } from 'geofire-common';
import { db, storage } from '../lib/firebase';
import type { Item } from '../types';

const ITEMS = 'items';

function generateSearchTokens(title: string): string[] {
  const words = title.toLowerCase().replace(/[^a-záðéíóúýþæö0-9\s]/gi, '').split(/\s+/).filter(Boolean);
  const tokens: string[] = [];
  for (const w of words) {
    for (let i = 1; i <= w.length; i++) {
      tokens.push(w.substring(0, i));
    }
  }
  return [...new Set(tokens)];
}

export async function createItem(
  data: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'ratingAvg' | 'ratingCount' | 'status'>,
): Promise<Item> {
  const geohash = data.location?.lat && data.location?.lng
    ? geohashForLocation([data.location.lat, data.location.lng])
    : undefined;

  const searchTokens = generateSearchTokens(data.title);

  const docData = {
    ...data,
    location: { ...data.location, geohash },
    searchTokens,
    ratingAvg: 0,
    ratingCount: 0,
    status: 'virkt' as const,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, ITEMS), docData);
  return { ...docData, id: docRef.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

export async function getItem(id: string): Promise<Item | null> {
  const snap = await getDoc(doc(db, ITEMS, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Item;
}

export async function updateItem(id: string, data: Partial<Item>): Promise<void> {
  const updates: Record<string, unknown> = { ...data, updatedAt: serverTimestamp() };
  if (data.title) {
    updates.searchTokens = generateSearchTokens(data.title);
  }
  await updateDoc(doc(db, ITEMS, id), updates);
}

export interface ItemFilters {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  limit?: number;
}

export async function queryItems(filters: ItemFilters = {}): Promise<Item[]> {
  const constraints = [where('status', '==', filters.status || 'virkt')];
  if (filters.categoryId) constraints.push(where('categoryId', '==', filters.categoryId));
  if (filters.minPrice !== undefined) constraints.push(where('pricePerDayISK', '>=', filters.minPrice));
  if (filters.maxPrice !== undefined) constraints.push(where('pricePerDayISK', '<=', filters.maxPrice));
  constraints.push(orderBy('createdAt', 'desc'));
  if (filters.limit) constraints.push(firestoreLimit(filters.limit));

  const q = query(collection(db, ITEMS), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Item));
}

export async function queryItemsNearby(
  lat: number, lng: number, radiusKm: number, filters: ItemFilters = {},
): Promise<(Item & { distanceKm: number })[]> {
  const center: [number, number] = [lat, lng];
  const radiusM = radiusKm * 1000;
  const bounds = geohashQueryBounds(center, radiusM);

  const promises = bounds.map(([start, end]) => {
    const q = query(
      collection(db, ITEMS),
      where('status', '==', 'virkt'),
      where('location.geohash', '>=', start),
      where('location.geohash', '<=', end),
    );
    return getDocs(q);
  });

  const snapshots = await Promise.all(promises);
  const items: (Item & { distanceKm: number })[] = [];

  for (const snap of snapshots) {
    for (const d of snap.docs) {
      const item = { id: d.id, ...d.data() } as Item;
      if (!item.location?.lat || !item.location?.lng) continue;
      const dist = distanceBetween([item.location.lat, item.location.lng], center);
      if (dist <= radiusKm) {
        if (filters.categoryId && item.categoryId !== filters.categoryId) continue;
        if (filters.minPrice !== undefined && item.pricePerDayISK < filters.minPrice) continue;
        if (filters.maxPrice !== undefined && item.pricePerDayISK > filters.maxPrice) continue;
        items.push({ ...item, distanceKm: Math.round(dist * 10) / 10 });
      }
    }
  }

  // Deduplicate by id
  const seen = new Set<string>();
  return items.filter(i => { if (seen.has(i.id)) return false; seen.add(i.id); return true; })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function subscribeToItem(id: string, callback: (item: Item | null) => void): Unsubscribe {
  return onSnapshot(doc(db, ITEMS, id), snap => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } as Item : null);
  });
}

export async function uploadItemPhoto(itemId: string, file: File): Promise<string> {
  const path = `items/${itemId}/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
