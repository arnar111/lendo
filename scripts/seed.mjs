import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAP-X_wGYPOxRepba-YLkZzb64e4qzAeaA",
  authDomain: "lendo-9eb23.firebaseapp.com",
  projectId: "lendo-9eb23",
  storageBucket: "lendo-9eb23.firebasestorage.app",
  messagingSenderId: "485876916892",
  appId: "1:485876916892:web:d35b90d9b11ff289988359",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const RENTER_ID = 'seed_renter_01';
const now = new Date().toISOString();

// Seed renter user
const renter = {
  uid: RENTER_ID,
  displayName: 'Jón Jónsson',
  email: 'jon@leigja.is',
  photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jon',
  createdAt: now,
  lastActiveAt: now,
  bio: 'Ég leigi ýmislegt til að prófa áður en ég kaupi.',
  defaultRadiusKm: 10,
  ratingAsOwnerAvg: 0,
  ratingAsRenterAvg: 4.5,
  ratingCountAsOwner: 0,
  ratingCountAsRenter: 3,
  needsOnboarding: false,
};

// Seed items owned by renter (so when Arnar logs in as owner of HIS items, the renter has booked them)
// Actually — Tekjuyfirlit shows YOUR earnings. So we need items owned by Arnar's account,
// and bookings FROM the renter. But we don't know Arnar's UID yet.
// 
// Better approach: seed some items owned by the renter, plus bookings.
// Then Arnar can see Tekjuyfirlit when logged in as the renter.
//
// OR: seed items with a known owner, and Arnar logs in with Google → we update ownerId.
// 
// Simplest: seed items + bookings for the seed renter, and Arnar can test by looking at renter's profile.
// But Tekjuyfirlit filters by user?.uid...
//
// Let's just seed items and bookings. When Arnar logs in with Google, we'll know his UID.
// For now, seed under renter and Arnar can test the page.

const items = [
  {
    id: 'seed_item_01',
    ownerId: RENTER_ID,
    ownerDisplayName: 'Jón Jónsson',
    title: 'Bosch borvél',
    description: 'Öflug borvél með 2 rafhlöðum. Virkar fullkomlega.',
    categoryId: 'verkfaeri',
    condition: 'gott',
    photos: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600'],
    pricePerDayISK: 3000,
    pricePerWeekISK: 15000,
    depositISK: 10000,
    location: { lat: 64.1466, lng: -21.9426, city: 'Reykjavík', postalCode: '101' },
    status: 'active',
    createdAt: now,
    viewCount: 12,
  },
  {
    id: 'seed_item_02',
    ownerId: RENTER_ID,
    ownerDisplayName: 'Jón Jónsson',
    title: 'Hilleberg Anjan 2 tjald',
    description: '4-season tjald, létt og sterkt. Fullkomið fyrir íslenskt veður.',
    categoryId: 'utivera',
    condition: 'nytt',
    photos: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600'],
    pricePerDayISK: 5000,
    pricePerWeekISK: 25000,
    pricePerWeekendISK: 8000,
    depositISK: 20000,
    location: { lat: 64.1355, lng: -21.8954, city: 'Reykjavík', postalCode: '105' },
    status: 'active',
    createdAt: now,
    viewCount: 8,
  },
  {
    id: 'seed_item_03',
    ownerId: RENTER_ID,
    ownerDisplayName: 'Jón Jónsson',
    title: 'Sony A7III myndavél',
    description: 'Full-frame mirrorless myndavél. Kemur með 28-70mm linsu.',
    categoryId: 'rafmagn',
    condition: 'gott',
    photos: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600'],
    pricePerDayISK: 8000,
    pricePerWeekISK: 40000,
    depositISK: 50000,
    location: { lat: 64.1503, lng: -21.9510, city: 'Reykjavík', postalCode: '101' },
    status: 'active',
    createdAt: now,
    viewCount: 22,
  },
];

// Generate bookings over the past 90 days
const renters = ['Ólafur Þór', 'Kristín Björk', 'Magnús Aron', 'Sigrún Edda', 'Bjarki Már'];
const bookings = [];
for (let i = 0; i < 15; i++) {
  const daysAgo = Math.floor(Math.random() * 90);
  const start = new Date();
  start.setDate(start.getDate() - daysAgo);
  const days = Math.ceil(Math.random() * 5);
  const end = new Date(start);
  end.setDate(end.getDate() + days);
  const item = items[Math.floor(Math.random() * items.length)];
  const total = item.pricePerDayISK * days;
  const fee = Math.round(total * 0.12);

  bookings.push({
    id: `seed_booking_${String(i).padStart(2, '0')}`,
    itemId: item.id,
    itemTitle: item.title,
    itemPhoto: item.photos[0],
    ownerId: RENTER_ID,
    ownerName: 'Jón Jónsson',
    renterId: `renter_${i % 5}`,
    renterName: renters[i % 5],
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
    days,
    pricePerDay: item.pricePerDayISK,
    totalPrice: total,
    serviceFee: fee,
    ownerPayout: total - fee,
    depositISK: item.depositISK || 0,
    status: daysAgo > 10 ? 'reviewed' : daysAgo > 5 ? 'returned' : 'confirmed',
    createdAt: start.toISOString(),
  });
}

async function seed() {
  console.log('Seeding user...');
  await setDoc(doc(db, 'users', RENTER_ID), renter);

  console.log('Seeding items...');
  for (const item of items) {
    await setDoc(doc(db, 'items', item.id), item);
  }

  console.log('Seeding bookings...');
  for (const b of bookings) {
    await setDoc(doc(db, 'bookings', b.id), b);
  }

  console.log(`✅ Done! Seeded 1 user, ${items.length} items, ${bookings.length} bookings.`);
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
