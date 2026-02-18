import {
  collection, doc, addDoc, getDocs, updateDoc, query, where, orderBy, onSnapshot,
  serverTimestamp, type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Conversation, Message } from '../types';

const CONVERSATIONS = 'conversations';

export async function getOrCreateConversation(
  uid1: string, uid2: string, itemId?: string, itemTitle?: string,
): Promise<Conversation> {
  // Try to find existing
  const q = query(
    collection(db, CONVERSATIONS),
    where('participantIds', 'array-contains', uid1),
  );
  const snap = await getDocs(q);
  const existing = snap.docs.find(d => {
    const data = d.data();
    return data.participantIds.includes(uid2) && (!itemId || data.itemId === itemId);
  });

  if (existing) {
    return { id: existing.id, ...existing.data() } as Conversation;
  }

  const conv = {
    participantIds: [uid1, uid2],
    itemId: itemId || null,
    itemTitle: itemTitle || null,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, CONVERSATIONS), conv);
  return { id: ref.id, participantIds: [uid1, uid2], itemId, itemTitle, createdAt: new Date().toISOString() };
}

export async function getConversationsForUser(uid: string): Promise<Conversation[]> {
  const q = query(
    collection(db, CONVERSATIONS),
    where('participantIds', 'array-contains', uid),
    orderBy('lastMessageAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Conversation));
}

export function subscribeToConversations(uid: string, callback: (convs: Conversation[]) => void): Unsubscribe {
  const q = query(
    collection(db, CONVERSATIONS),
    where('participantIds', 'array-contains', uid),
    orderBy('lastMessageAt', 'desc'),
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Conversation)));
  });
}

export function subscribeToMessages(conversationId: string, callback: (msgs: Message[]) => void): Unsubscribe {
  const q = query(
    collection(db, CONVERSATIONS, conversationId, 'messages'),
    orderBy('createdAt', 'asc'),
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
  });
}

export async function sendMessage(conversationId: string, senderId: string, text: string): Promise<Message> {
  const msgData = {
    senderId,
    text,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, CONVERSATIONS, conversationId, 'messages'), msgData);

  // Update conversation's lastMessage fields
  await updateDoc(doc(db, CONVERSATIONS, conversationId), {
    lastMessageText: text,
    lastMessageAt: serverTimestamp(),
    lastMessageSenderId: senderId,
  });

  return { id: ref.id, conversationId, senderId, text, createdAt: new Date().toISOString() };
}
