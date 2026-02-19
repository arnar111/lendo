import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '../lib/firebase';
import type { User, Item, Conversation, Message, Review, Booking, BookingStatus, Favorite } from '../types';

// Services
import * as authService from '../services/auth';
import * as itemsService from '../services/items';
import * as usersService from '../services/users';
import * as convoService from '../services/conversations';
import * as reviewsService from '../services/reviews';
import * as bookingsService from '../services/bookings';
import * as favoritesService from '../services/favorites';

// Mock data (fallback for demo/development)
import { MOCK_USERS, MOCK_ITEMS, MOCK_CONVERSATIONS, MOCK_MESSAGES, MOCK_REVIEWS, MOCK_BOOKINGS } from '../data/mock';

// Set to true to use mock data instead of Firebase
const USE_MOCK = false;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function load<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem('leigja_' + key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
function save<T>(key: string, data: T) { localStorage.setItem('leigja_' + key, JSON.stringify(data)); }

// ─── AUTH ────────────────────────────────────────────────────────────────────

let _listeners: Array<(u: User | null) => void> = [];
let _currentUser: User | null = USE_MOCK ? load<User | null>('currentUser', null) : null;
let _authInitialized = USE_MOCK;

if (!USE_MOCK) {
  onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      const profile = await authService.getUserProfile(fbUser.uid);
      _currentUser = profile || {
        uid: fbUser.uid,
        displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Notandi',
        email: fbUser.email || '',
        photoURL: fbUser.photoURL || undefined,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        defaultRadiusKm: 5,
        ratingAsOwnerAvg: 0, ratingAsRenterAvg: 0,
        ratingCountAsOwner: 0, ratingCountAsRenter: 0,
      };
    } else {
      _currentUser = null;
    }
    _authInitialized = true;
    _listeners.forEach(l => l(_currentUser));
  });
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(_currentUser);
  const [loading, setLoading] = useState(!_authInitialized);

  useEffect(() => {
    const listener = (u: User | null) => { setUser(u); setLoading(false); };
    _listeners.push(listener);
    if (_authInitialized) { setUser(_currentUser); setLoading(false); }
    return () => { _listeners = _listeners.filter(l => l !== listener); };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (USE_MOCK) {
      const found = MOCK_USERS.find(u => u.email === email);
      const u: User = found || { uid: 'user_' + Date.now(), displayName: email.split('@')[0], email, createdAt: new Date().toISOString(), lastActiveAt: new Date().toISOString(), defaultRadiusKm: 5, ratingAsOwnerAvg: 0, ratingAsRenterAvg: 0, ratingCountAsOwner: 0, ratingCountAsRenter: 0 };
      _currentUser = u; save('currentUser', u); _listeners.forEach(l => l(u)); return true;
    }
    await authService.signIn(email, password);
    return true;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    if (USE_MOCK) {
      const u: User = { uid: 'user_' + Date.now(), displayName: name, email, photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`, createdAt: new Date().toISOString(), lastActiveAt: new Date().toISOString(), defaultRadiusKm: 5, ratingAsOwnerAvg: 0, ratingAsRenterAvg: 0, ratingCountAsOwner: 0, ratingCountAsRenter: 0, needsOnboarding: true };
      _currentUser = u; save('currentUser', u); _listeners.forEach(l => l(u)); return true;
    }
    await authService.signUp(email, password, name);
    return true;
  }, []);

  const loginWithGoogle = useCallback(async () => {
    if (USE_MOCK) {
      const u: User = { uid: 'user_google', displayName: 'Google Notandi', email: 'google@gmail.com', photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Google', createdAt: new Date().toISOString(), lastActiveAt: new Date().toISOString(), defaultRadiusKm: 5, ratingAsOwnerAvg: 0, ratingAsRenterAvg: 0, ratingCountAsOwner: 0, ratingCountAsRenter: 0, needsOnboarding: true };
      _currentUser = u; save('currentUser', u); _listeners.forEach(l => l(u)); return u;
    }
    const u = await authService.signInWithGoogle();
    return u;
  }, []);

  const logout = useCallback(async () => {
    if (USE_MOCK) {
      _currentUser = null; localStorage.removeItem('leigja_currentUser'); _listeners.forEach(l => l(null)); return;
    }
    await authService.logout();
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!_currentUser) return;
    if (USE_MOCK) {
      _currentUser = { ..._currentUser, ...updates };
      save('currentUser', _currentUser);
      _listeners.forEach(l => l(_currentUser)); return;
    }
    await usersService.updateUser(_currentUser.uid, updates);
    _currentUser = { ..._currentUser, ...updates };
    _listeners.forEach(l => l(_currentUser));
  }, []);

  return { user, loading, login, register, loginWithGoogle, logout, updateProfile };
}

// ─── ITEMS ───────────────────────────────────────────────────────────────────

export function useItems(filters?: itemsService.ItemFilters) {
  const [mockItems, setMockItems] = useState<Item[]>(USE_MOCK ? load<Item[]>('items', MOCK_ITEMS) : []);

  const { data: fbItems = [] } = useQuery({
    queryKey: ['items', filters],
    queryFn: () => itemsService.queryItems(filters),
    staleTime: 30_000,
    enabled: !USE_MOCK,
  });

  const items = USE_MOCK ? mockItems : fbItems;

  const addItem = useCallback((data: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'ratingAvg' | 'ratingCount' | 'status'>) => {
    if (USE_MOCK) {
      const n: Item = { ...data, id: 'item_' + Date.now(), ratingAvg: 0, ratingCount: 0, status: 'virkt', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      setMockItems(prev => { const next = [n, ...prev]; save('items', next); return next; });
      return n;
    }
    return itemsService.createItem(data);
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<Item>) => {
    if (USE_MOCK) {
      setMockItems(prev => { const next = prev.map(i => i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i); save('items', next); return next; });
      return;
    }
    return itemsService.updateItem(id, updates);
  }, []);

  return { items, addItem, updateItem };
}

// ─── GEO ─────────────────────────────────────────────────────────────────────

// Default location: Reykjavík center
const DEFAULT_LOCATION = { lat: 64.1466, lng: -21.9426 };

export function useGeo() {
  const [location, setLocation] = useState<{ lat: number; lng: number }>(DEFAULT_LOCATION);
  const [hasRealLocation, setHasRealLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation er ekki stutt');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setHasRealLocation(true);
      },
      (err) => setError(err.message),
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }, []);

  // Try to get location on mount
  useEffect(() => { requestLocation(); }, [requestLocation]);

  return { location, hasRealLocation, error, requestLocation };
}

export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── CONVERSATIONS (sync API) ────────────────────────────────────────────────

export function useConversations() {
  const [convs, setConvs] = useState<Conversation[]>(USE_MOCK ? load<Conversation[]>('conversations', MOCK_CONVERSATIONS) : []);
  const [msgs, setMsgs] = useState<Message[]>(USE_MOCK ? load<Message[]>('messages', MOCK_MESSAGES) : []);
  const { user } = useAuth();

  // Firebase: subscribe to conversations
  useEffect(() => {
    if (USE_MOCK || !user?.uid) return;
    const unsub = convoService.subscribeToConversations(user.uid, setConvs);
    return unsub;
  }, [user?.uid]);

  const getOrCreateConversation = useCallback((u1: string, u2: string, itemId?: string, itemTitle?: string): Conversation => {
    if (USE_MOCK) {
      const ex = convs.find(c => c.participantIds.includes(u1) && c.participantIds.includes(u2) && (!itemId || c.itemId === itemId));
      if (ex) return ex;
      const c: Conversation = { id: 'conv_' + Date.now(), participantIds: [u1, u2], itemId, itemTitle, createdAt: new Date().toISOString() };
      setConvs(prev => { const next = [c, ...prev]; save('conversations', next); return next; });
      return c;
    }
    // For Firebase, return a placeholder and create async
    const ex = convs.find(c => c.participantIds.includes(u1) && c.participantIds.includes(u2) && (!itemId || c.itemId === itemId));
    if (ex) return ex;
    const tempId = 'conv_' + Date.now();
    const temp: Conversation = { id: tempId, participantIds: [u1, u2], itemId, itemTitle, createdAt: new Date().toISOString() };
    // Fire and forget — the subscription will update convs
    convoService.getOrCreateConversation(u1, u2, itemId, itemTitle).then(real => {
      if (real.id !== tempId) {
        setConvs(prev => prev.map(c => c.id === tempId ? real : c));
      }
    });
    setConvs(prev => [temp, ...prev]);
    return temp;
  }, [convs]);

  const sendMessage = useCallback((cid: string, sid: string, text: string) => {
    const m: Message = { id: 'msg_' + Date.now(), conversationId: cid, senderId: sid, text, createdAt: new Date().toISOString() };
    if (USE_MOCK) {
      setMsgs(prev => { const next = [...prev, m]; save('messages', next); return next; });
      setConvs(prev => { const next = prev.map(c => c.id === cid ? { ...c, lastMessageText: text, lastMessageAt: m.createdAt, lastMessageSenderId: sid } : c); save('conversations', next); return next; });
    } else {
      // Optimistic update + fire async
      setMsgs(prev => [...prev, m]);
      convoService.sendMessage(cid, sid, text);
    }
    return m;
  }, []);

  const getMessages = useCallback((cid: string) => msgs.filter(m => m.conversationId === cid), [msgs]);

  // For Firebase real-time message subscription (used by ChatPage)
  const subscribeToMessages = useCallback((cid: string, callback: (msgs: Message[]) => void) => {
    if (USE_MOCK) {
      callback(msgs.filter(m => m.conversationId === cid));
      return () => {};
    }
    return convoService.subscribeToMessages(cid, callback);
  }, [msgs]);

  return { conversations: convs, getOrCreateConversation, sendMessage, getMessages, subscribeToMessages };
}

// ─── REVIEWS (sync API) ──────────────────────────────────────────────────────

export function useReviews() {
  const [reviews, setReviews] = useState<Review[]>(USE_MOCK ? load<Review[]>('reviews', MOCK_REVIEWS) : []);

  // Load reviews from Firebase once
  useEffect(() => {
    if (USE_MOCK) return;
    // We'll load reviews on demand via getReviewsFor
  }, []);

  const addReview = useCallback((r: Omit<Review, 'id' | 'createdAt'>) => {
    const nr: Review = { ...r, id: 'rev_' + Date.now(), createdAt: new Date().toISOString() };
    if (USE_MOCK) {
      setReviews(prev => { const next = [nr, ...prev]; save('reviews', next); return next; });
    } else {
      setReviews(prev => [nr, ...prev]);
      reviewsService.createReview(r);
    }
    return nr;
  }, []);

  // SYNC API — returns array immediately
  const getReviewsFor = useCallback((tid: string, tt?: string) => {
    return reviews.filter(r => r.targetId === tid && (!tt || r.targetType === tt));
  }, [reviews]);

  return { reviews, addReview, getReviewsFor };
}

// ─── USERS (sync API) ────────────────────────────────────────────────────────

export function useUsers() {
  const [userCache, setUserCache] = useState<Map<string, User>>(
    USE_MOCK ? new Map(MOCK_USERS.map(u => [u.uid, u])) : new Map()
  );

  // SYNC API — returns User | undefined immediately
  const getUser = useCallback((uid: string): User | undefined => {
    const cached = userCache.get(uid);
    if (cached) return cached;

    if (!USE_MOCK) {
      // Fire async fetch, will update cache
      usersService.getUser(uid).then(u => {
        if (u) setUserCache(prev => new Map(prev).set(uid, u));
      });
    }
    return undefined;
  }, [userCache]);

  return { users: USE_MOCK ? MOCK_USERS : [...userCache.values()], getUser };
}

// ─── BOOKINGS ────────────────────────────────────────────────────────────────

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>(USE_MOCK ? load<Booking[]>('bookings', MOCK_BOOKINGS) : []);
  const { user } = useAuth();

  // Load from Firebase
  useEffect(() => {
    if (USE_MOCK || !user?.uid) return;
    bookingsService.getBookingsForUser(user.uid).then(setBookings);
  }, [user?.uid]);

  const createBooking = useCallback((b: Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'serviceFeeISK'>) => {
    const serviceFeeISK = Math.round(b.totalISK * 0.12);
    const nb: Booking = { ...b, id: 'book_' + Date.now(), serviceFeeISK, status: 'pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    if (USE_MOCK) {
      setBookings(prev => { const next = [nb, ...prev]; save('bookings', next); return next; });
    } else {
      setBookings(prev => [nb, ...prev]);
      bookingsService.createBooking(b);
    }
    return nb;
  }, []);

  const updateBooking = useCallback((id: string, status: BookingStatus) => {
    setBookings(prev => {
      const next = prev.map(b => b.id === id ? { ...b, status, updatedAt: new Date().toISOString() } : b);
      if (USE_MOCK) save('bookings', next);
      return next;
    });
    if (!USE_MOCK) bookingsService.updateBookingStatus(id, status);
  }, []);

  const getBookingsForUser = useCallback((uid: string) =>
    bookings.filter(b => b.renterId === uid || b.ownerId === uid),
  [bookings]);

  const getBookingsForItem = useCallback((itemId: string) =>
    bookings.filter(b => b.itemId === itemId && !['cancelled', 'rejected'].includes(b.status)),
  [bookings]);

  return { bookings, createBooking, updateBooking, getBookingsForUser, getBookingsForItem };
}

// ─── FAVORITES ───────────────────────────────────────────────────────────────

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>(USE_MOCK ? load<Favorite[]>('favorites', []) : []);

  // Load from Firebase
  useEffect(() => {
    if (USE_MOCK || !user?.uid) return;
    favoritesService.getFavorites(user.uid).then(setFavorites);
  }, [user?.uid]);

  const toggle = useCallback((itemId: string) => {
    const exists = favorites.some(f => f.itemId === itemId);
    if (exists) {
      setFavorites(prev => {
        const next = prev.filter(f => f.itemId !== itemId);
        if (USE_MOCK) save('favorites', next);
        return next;
      });
    } else {
      const nf: Favorite = { itemId, addedAt: new Date().toISOString() };
      setFavorites(prev => {
        const next = [...prev, nf];
        if (USE_MOCK) save('favorites', next);
        return next;
      });
    }
    if (!USE_MOCK && user?.uid) favoritesService.toggleFavorite(user.uid, itemId);
    return !exists;
  }, [favorites, user?.uid]);

  // Sync check — returns boolean immediately
  const isFav = useCallback((itemId: string) => favorites.some(f => f.itemId === itemId), [favorites]);

  return { favorites, toggle, isFav, toggleFavorite: toggle, isFavorite: isFav };
}
