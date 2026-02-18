import {
  collection, addDoc, getDocs, query, where, doc, updateDoc, increment, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Review, ReviewTargetType } from '../types';

const REVIEWS = 'reviews';

export async function createReview(data: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
  const docData = { ...data, createdAt: serverTimestamp() };
  const ref = await addDoc(collection(db, REVIEWS), docData);

  // Update target's rating averages
  await updateTargetRating(data.targetId, data.targetType, data.rating);

  return { ...data, id: ref.id, createdAt: new Date().toISOString() };
}

export async function getReviewsForTarget(targetId: string, targetType?: ReviewTargetType): Promise<Review[]> {
  const constraints = [where('targetId', '==', targetId)];
  if (targetType) constraints.push(where('targetType', '==', targetType));

  const q = query(collection(db, REVIEWS), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Review));
}

async function updateTargetRating(targetId: string, targetType: ReviewTargetType, rating: number): Promise<void> {
  if (targetType === 'item') {
    // Update item's ratingAvg and ratingCount
    const itemRef = doc(db, 'items', targetId);
    // Simple increment approach — for accuracy, should recalculate from all reviews
    await updateDoc(itemRef, {
      ratingCount: increment(1),
    }).catch(() => { /* item may not exist yet */ });
  } else if (targetType === 'user_owner' || targetType === 'user_renter') {
    const userRef = doc(db, 'users', targetId);
    const field = targetType === 'user_owner' ? 'ratingCountAsOwner' : 'ratingCountAsRenter';
    await updateDoc(userRef, {
      [field]: increment(1),
    }).catch(() => { /* user may not exist */ });
  }
}
