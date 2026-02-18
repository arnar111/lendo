export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  phone?: string;
  bio?: string;
  createdAt: string;
  lastActiveAt: string;
  homeLocation?: GeoPoint;
  defaultRadiusKm: number;
  ratingAsOwnerAvg: number;
  ratingAsRenterAvg: number;
  ratingCountAsOwner: number;
  ratingCountAsRenter: number;
  verified?: boolean;
  needsOnboarding?: boolean;
}

export interface GeoPoint {
  lat: number;
  lng: number;
  geohash?: string;
  city?: string;
  postalCode?: string;
}

export type ItemCondition = 'nytt' | 'gott' | 'notad' | 'slitid';
export type ItemStatus = 'virkt' | 'falid' | 'eytt';

export const CONDITION_LABELS: Record<ItemCondition, string> = {
  nytt: 'Nýtt',
  gott: 'Gott ástand',
  notad: 'Notað',
  slitid: 'Slitið',
};

export interface Item {
  id: string;
  ownerId: string;
  ownerDisplayName: string;
  title: string;
  description: string;
  categoryId: string;
  condition: ItemCondition;
  photos: string[];
  pricePerDayISK: number;
  pricePerWeekendISK?: number;
  pricePerWeekISK?: number;
  depositISK?: number;
  location: GeoPoint;
  ratingAvg: number;
  ratingCount: number;
  status: ItemStatus;
  availableDays?: string[];
  blockedDays?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  participantIds: [string, string];
  itemId?: string;
  itemTitle?: string;
  lastMessageText?: string;
  lastMessageAt?: string;
  lastMessageSenderId?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export type ReviewTargetType = 'user_owner' | 'user_renter' | 'item';

export interface Review {
  id: string;
  authorId: string;
  authorDisplayName: string;
  targetType: ReviewTargetType;
  targetId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text?: string;
  createdAt: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'returned' | 'reviewed' | 'cancelled' | 'rejected';

export interface Booking {
  id: string;
  itemId: string;
  itemTitle: string;
  itemPhoto: string;
  ownerId: string;
  ownerName: string;
  renterId: string;
  renterName: string;
  startDate: string;
  endDate: string;
  days: number;
  totalISK: number;
  depositISK: number;
  serviceFeeISK: number;
  status: BookingStatus;
  message?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Favorite {
  itemId: string;
  addedAt: string;
}

export interface Category {
  id: string;
  label: string;
  icon: string;
}

export const CATEGORIES: Category[] = [
  { id: 'verkfaeri', label: 'Verkfæri', icon: '🔧' },
  { id: 'utilega', label: 'Útilega & tjöld', icon: '⛺' },
  { id: 'ithrottir', label: 'Íþróttir', icon: '⚽' },
  { id: 'tonaflutningar', label: 'Tónlistarhlutir', icon: '🎸' },
  { id: 'rafmagn', label: 'Raftæki', icon: '💻' },
  { id: 'gardfraedi', label: 'Garðfræði', icon: '🌱' },
  { id: 'bilhlutir', label: 'Bifreiðar & ferðir', icon: '🚗' },
  { id: 'event', label: 'Veislur & viðburðir', icon: '🎉' },
  { id: 'fatnadur', label: 'Fatnaður & fylgihlutir', icon: '👗' },
  { id: 'annad', label: 'Annað', icon: '📦' },
];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Bíður samþykkis',
  confirmed: 'Staðfest',
  active: 'Í leigu',
  returned: 'Skilað',
  reviewed: 'Lokið',
  cancelled: 'Hætt við',
  rejected: 'Hafnað',
};

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  returned: 'bg-purple-100 text-purple-700',
  reviewed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
  rejected: 'bg-red-100 text-red-600',
};
