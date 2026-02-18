import { useState, useCallback, useEffect } from 'react';
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

// ─── AUTH ────────────────────────────────────────────────────────────────────

let _listeners: Array<(u: User | null) => void> = [];
let _currentUser: User | null = null;
let _firebaseUser: FirebaseUser | null = null;
let _authInitialized = false;

// Listen for auth state changes once
onAuthStateChanged(auth, async (fbUser) => {
  _firebaseUser = fbUser;
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
      _currentUser = u; _listeners.forEach(l => l(u)); return true;
    }
    await authService.signIn(email, password);
    return true;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    if (USE_MOCK) {
      const u: User = { uid: 'user_' + Date.now(), displayName: name, email, createdAt: new Date().toISOString(), lastActiveAt: new Date().toISOString(), defaultRadiusKm: 5, ratingAsOwnerAvg: 0, ratingAsRenterAvg: 0, ratingCountAsOwner: 0, ratingCountAsRenter: 0 };
      _currentUser = u; _listeners.forEach(l => l(u)); return true;
    }
    await authService.signUp(email, password, name);
    return true;
  }, []);

  const loginWithGoogle = useCallback(async () => {
    await authService.signInWithGoogle();
    return true;
  }, []);

  const logout = useCallback(async () => {
    if (USE_MOCK) {
      _currentUser = null; _listeners.forEach(l => l(null)); return;
    }
    await authService.logout();
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!_currentUser) return;
    if (USE_MOCK) {
      _currentUser = { ..._currentUser, ...updates };
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
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items', filters],
    queryFn: () => USE_MOCK ? Promise.resolve(MOCK_ITEMS) : itemsService.queryItems(filters),
    staleTime: 30_000,
  });

  const addItemMutation = useMutation({
    mutationFn: (data: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'ratingAvg' | 'ratingCount' | 'status'>) =>
      itemsService.createItem(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Item> }) => itemsService.updateItem(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  });

  const addItem = useCallback(
    (data: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'ratingAvg' | 'ratingCount' | 'status'>) =>
      addItemMutation.mutateAsync(data),
    [addItemMutation],
  );

  const updateItem = useCallback(
    (id: string, updates: Partial<Item>) => updateItemMutation.mutateAsync({ id, data: updates }),
    [updateItemMutation],
  );

  return { items, isLoading, addItem, updateItem };
}

export function useItemsNearby(lat: number | null, lng: number | null, radiusKm: number, filters?: itemsService.ItemFilters) {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items-nearby', lat, lng, radiusKm, filters],
    queryFn: () => {
      if (!lat || !lng) return Promise.resolve([]);
      if (USE_MOCK) return Promise.resolve(MOCK_ITEMS);
      return itemsService.queryItemsNearby(lat, lng, radiusKm, filters);
    },
    enabled: lat !== null && lng !== null,
    staleTime: 30_000,
  });

  return { items, isLoading };
}

// ─── CONVERSATIONS ───────────────────────────────────────────────────────────

export function useConversations() {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [msgs, setMsgs] = useState<Map<string, Message[]>>(new Map());
  const { user } = useAuth();

  // Subscribe to conversations
  useEffect(() => {
    if (!user?.uid) { setConvs([]); return; }
    if (USE_MOCK) { setConvs(MOCK_CONVERSATIONS); return; }
    const unsub = convoService.subscribeToConversations(user.uid, setConvs);
    return unsub;
  }, [user?.uid]);

  const getOrCreateConversation = useCallback(
    async (u1: string, u2: string, itemId?: string, itemTitle?: string): Promise<Conversation> => {
      if (USE_MOCK) {
        const ex = MOCK_CONVERSATIONS.find(c => c.participantIds.includes(u1) && c.participantIds.includes(u2));
        if (ex) return ex;
        const c: Conversation = { id: 'conv_' + Date.now(), participantIds: [u1, u2], itemId, itemTitle, createdAt: new Date().toISOString() };
        return c;
      }
      return convoService.getOrCreateConversation(u1, u2, itemId, itemTitle);
    }, [],
  );

  const sendMessage = useCallback(
    async (cid: string, sid: string, text: string) => {
      if (USE_MOCK) return { id: 'msg_' + Date.now(), conversationId: cid, senderId: sid, text, createdAt: new Date().toISOString() };
      return convoService.sendMessage(cid, sid, text);
    }, [],
  );

  const subscribeToMessages = useCallback(
    (cid: string, callback: (msgs: Message[]) => void) => {
      if (USE_MOCK) {
        callback(MOCK_MESSAGES.filter(m => m.conversationId === cid));
        return () => {};
      }
      return convoService.subscribeToMessages(cid, callback);
    }, [],
  );

  const getMessages = useCallback(
    (cid: string) => {
      if (USE_MOCK) return MOCK_MESSAGES.filter(m => m.conversationId === cid);
      return msgs.get(cid) || [];
    }, [msgs],
  );

  return { conversations: convs, getOrCreateConversation, sendMessage, getMessages, subscribeToMessages };
}

// ─── REVIEWS ─────────────────────────────────────────────────────────────────

export function useReviews() {
  const qc = useQueryClient();

  const addReviewMutation = useMutation({
    mutationFn: (data: Omit<Review, 'id' | 'createdAt'>) => reviewsService.createReview(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }),
  });

  const addReview = useCallback(
    (r: Omit<Review, 'id' | 'createdAt'>) => addReviewMutation.mutateAsync(r),
    [addReviewMutation],
  );

  const getReviewsFor = useCallback(
    async (tid: string, tt?: string) => {
      if (USE_MOCK) return MOCK_REVIEWS.filter(r => r.targetId === tid && (!tt || r.targetType === tt));
      return reviewsService.getReviewsForTarget(tid, tt as Review['targetType']);
    }, [],
  );

  return { addReview, getReviewsFor };
}

// ─── USERS ───────────────────────────────────────────────────────────────────

export function useUsers() {
  const getUser = useCallback(
    async (uid: string): Promise<User | undefined> => {
      if (USE_MOCK) return MOCK_USERS.find(u => u.uid === uid);
      const u = await usersService.getUser(uid);
      return u || undefined;
    }, [],
  );

  return { users: USE_MOCK ? MOCK_USERS : [], getUser };
}

// ─── BOOKINGS ────────────────────────────────────────────────────────────────

export function useBookings() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings', user?.uid],
    queryFn: () => {
      if (!user?.uid) return Promise.resolve([]);
      if (USE_MOCK) return Promise.resolve(MOCK_BOOKINGS);
      return bookingsService.getBookingsForUser(user.uid);
    },
    enabled: !!user?.uid,
    staleTime: 15_000,
  });

  const createBookingMutation = useMutation({
    mutationFn: (data: Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'serviceFeeISK'>) =>
      bookingsService.createBooking(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });

  const updateBookingMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) =>
      bookingsService.updateBookingStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });

  const createBooking = useCallback(
    (b: Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'serviceFeeISK'>) =>
      createBookingMutation.mutateAsync(b),
    [createBookingMutation],
  );

  const updateBooking = useCallback(
    (id: string, status: BookingStatus) => updateBookingMutation.mutateAsync({ id, status }),
    [updateBookingMutation],
  );

  const getBookingsForUser = useCallback(
    (uid: string) => bookings.filter(b => b.renterId === uid || b.ownerId === uid),
    [bookings],
  );

  const getBookingsForItem = useCallback(
    (itemId: string) => bookings.filter(b => b.itemId === itemId && !['cancelled', 'rejected'].includes(b.status)),
    [bookings],
  );

  return { bookings, isLoading, createBooking, updateBooking, getBookingsForUser, getBookingsForItem };
}

// ─── GEO ─────────────────────────────────────────────────────────────────────

export function useGeo() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation er ekki stutt');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => setError(err.message),
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }, []);

  return { location, error };
}

export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── FAVORITES ───────────────────────────────────────────────────────────────

export function useFavorites() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', user?.uid],
    queryFn: () => user?.uid ? favoritesService.getFavorites(user.uid) : Promise.resolve([]),
    enabled: !!user?.uid,
  });

  const toggleMutation = useMutation({
    mutationFn: (itemId: string) => {
      if (!user?.uid) throw new Error('Not authenticated');
      return favoritesService.toggleFavorite(user.uid, itemId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  });

  const toggleFavorite = useCallback(
    (itemId: string) => toggleMutation.mutateAsync(itemId),
    [toggleMutation],
  );

  const isFavorite = useCallback(
    (itemId: string) => favorites.some(f => f.itemId === itemId),
    [favorites],
  );

  return { favorites, toggleFavorite, isFavorite };
}
