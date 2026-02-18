import { useState, useCallback, useEffect } from 'react';
import type { User, Item, Conversation, Message, Review, Booking, BookingStatus, Favorite } from '../types';
import { MOCK_USERS, MOCK_ITEMS, MOCK_CONVERSATIONS, MOCK_MESSAGES, MOCK_REVIEWS, MOCK_BOOKINGS } from '../data/mock';

function load<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem('leigja_' + key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
function save<T>(key: string, data: T) { localStorage.setItem('leigja_' + key, JSON.stringify(data)); }

let _listeners: Array<(u: User | null) => void> = [];
let _user: User | null = load<User | null>('currentUser', null);

export function useAuth() {
  const [user, setUser] = useState<User | null>(_user);
  useEffect(() => { _listeners.push(setUser); return () => { _listeners = _listeners.filter(l => l !== setUser); }; }, []);

  const login = useCallback((email: string, _pw: string) => {
    const found = MOCK_USERS.find(u => u.email === email);
    const u: User = found || { uid: 'user_' + Date.now(), displayName: email.split('@')[0], email, createdAt: new Date().toISOString(), lastActiveAt: new Date().toISOString(), defaultRadiusKm: 5, ratingAsOwnerAvg: 0, ratingAsRenterAvg: 0, ratingCountAsOwner: 0, ratingCountAsRenter: 0 };
    _user = u; save('currentUser', u); _listeners.forEach(l => l(u)); return true;
  }, []);

  const register = useCallback((name: string, email: string, _pw: string) => {
    const u: User = { uid: 'user_' + Date.now(), displayName: name, email, createdAt: new Date().toISOString(), lastActiveAt: new Date().toISOString(), defaultRadiusKm: 5, ratingAsOwnerAvg: 0, ratingAsRenterAvg: 0, ratingCountAsOwner: 0, ratingCountAsRenter: 0 };
    _user = u; save('currentUser', u); _listeners.forEach(l => l(u)); return true;
  }, []);

  const logout = useCallback(() => { _user = null; localStorage.removeItem('leigja_currentUser'); _listeners.forEach(l => l(null)); }, []);

  const updateProfile = useCallback((updates: Partial<User>) => {
    if (!_user) return; _user = { ..._user, ...updates }; save('currentUser', _user); _listeners.forEach(l => l(_user));
  }, []);

  return { user, login, register, logout, updateProfile };
}

export function useItems() {
  const [items, setItems] = useState<Item[]>(load<Item[]>('items', MOCK_ITEMS));
  const addItem = useCallback((item: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'ratingAvg' | 'ratingCount' | 'status'>) => {
    const n: Item = { ...item, id: 'item_' + Date.now(), ratingAvg: 0, ratingCount: 0, status: 'virkt', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setItems(prev => { const next = [n, ...prev]; save('items', next); return next; }); return n;
  }, []);
  const updateItem = useCallback((id: string, updates: Partial<Item>) => {
    setItems(prev => { const next = prev.map(i => i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i); save('items', next); return next; });
  }, []);
  return { items, addItem, updateItem };
}

export function useConversations() {
  const [convs, setConvs] = useState<Conversation[]>(load<Conversation[]>('conversations', MOCK_CONVERSATIONS));
  const [msgs, setMsgs] = useState<Message[]>(load<Message[]>('messages', MOCK_MESSAGES));

  const getOrCreateConversation = useCallback((u1: string, u2: string, itemId?: string, itemTitle?: string): Conversation => {
    const ex = convs.find(c => c.participantIds.includes(u1) && c.participantIds.includes(u2) && (!itemId || c.itemId === itemId));
    if (ex) return ex;
    const c: Conversation = { id: 'conv_' + Date.now(), participantIds: [u1, u2], itemId, itemTitle, createdAt: new Date().toISOString() };
    setConvs(prev => { const next = [c, ...prev]; save('conversations', next); return next; }); return c;
  }, [convs]);

  const sendMessage = useCallback((cid: string, sid: string, text: string) => {
    const m: Message = { id: 'msg_' + Date.now(), conversationId: cid, senderId: sid, text, createdAt: new Date().toISOString() };
    setMsgs(prev => { const next = [...prev, m]; save('messages', next); return next; });
    setConvs(prev => { const next = prev.map(c => c.id === cid ? { ...c, lastMessageText: text, lastMessageAt: m.createdAt, lastMessageSenderId: sid } : c); save('conversations', next); return next; });
    return m;
  }, []);

  const getMessages = useCallback((cid: string) => msgs.filter(m => m.conversationId === cid), [msgs]);
  return { conversations: convs, getOrCreateConversation, sendMessage, getMessages };
}

export function useReviews() {
  const [reviews, setReviews] = useState<Review[]>(load<Review[]>('reviews', MOCK_REVIEWS));
  const addReview = useCallback((r: Omit<Review, 'id' | 'createdAt'>) => {
    const nr: Review = { ...r, id: 'rev_' + Date.now(), createdAt: new Date().toISOString() };
    setReviews(prev => { const next = [nr, ...prev]; save('reviews', next); return next; }); return nr;
  }, []);
  const getReviewsFor = useCallback((tid: string, tt?: string) => reviews.filter(r => r.targetId === tid && (!tt || r.targetType === tt)), [reviews]);
  return { reviews, addReview, getReviewsFor };
}

export function useUsers() {
  const getUser = useCallback((uid: string): User | undefined => MOCK_USERS.find(u => u.uid === uid), []);
  return { users: MOCK_USERS, getUser };
}

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>(load<Booking[]>('bookings', MOCK_BOOKINGS));

  const createBooking = useCallback((b: Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    const nb: Booking = { ...b, id: 'book_' + Date.now(), status: 'pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setBookings(prev => { const next = [nb, ...prev]; save('bookings', next); return next; }); return nb;
  }, []);

  const updateBooking = useCallback((id: string, status: BookingStatus) => {
    setBookings(prev => { const next = prev.map(b => b.id === id ? { ...b, status, updatedAt: new Date().toISOString() } : b); save('bookings', next); return next; });
  }, []);

  const getBookingsForUser = useCallback((uid: string) => bookings.filter(b => b.renterId === uid || b.ownerId === uid), [bookings]);
  const getBookingsForItem = useCallback((itemId: string) => bookings.filter(b => b.itemId === itemId && !['cancelled', 'rejected'].includes(b.status)), [bookings]);

  return { bookings, createBooking, updateBooking, getBookingsForUser, getBookingsForItem };
}

export function useFavorites() {
  const [favs, setFavs] = useState<Favorite[]>(load<Favorite[]>('favorites', []));

  const toggle = useCallback((itemId: string) => {
    setFavs(prev => {
      const exists = prev.some(f => f.itemId === itemId);
      const next = exists ? prev.filter(f => f.itemId !== itemId) : [...prev, { itemId, addedAt: new Date().toISOString() }];
      save('favorites', next); return next;
    });
  }, []);

  const isFav = useCallback((itemId: string) => favs.some(f => f.itemId === itemId), [favs]);
  return { favorites: favs, toggle, isFav };
}

export function useGeo() {
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(load('userGeo', null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) { setError('Staðsetning ekki studd'); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const g = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLoc(g); save('userGeo', g); setLoading(false); setError(null);
      },
      () => { setError('Ekki tókst'); setLoading(false); },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  useEffect(() => { if (!loc) requestLocation(); }, []);

  const defaultLoc = { lat: 64.1466, lng: -21.9426 };
  return { location: loc || defaultLoc, loading, error, requestLocation, hasRealLocation: !!loc };
}

export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; const dLat = (lat2 - lat1) * Math.PI / 180; const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
