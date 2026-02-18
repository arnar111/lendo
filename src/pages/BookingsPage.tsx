import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, ChevronRight, Package, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useAuth, useBookings } from '../store/useStore';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from '../types';
import type { Booking, BookingStatus } from '../types';

const TABS = [
  { id: 'renter', label: 'Mínar leigur' },
  { id: 'owner', label: 'Ég leigi út' },
] as const;

function BookingCard({ booking, isOwner, onAction }: { booking: Booking; isOwner: boolean; onAction: (id: string, status: BookingStatus) => void }) {
  const nav = useNavigate();
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden animate-fade-in-up">
      <div className="flex gap-3 p-3">
        <img src={booking.itemPhoto} alt={booking.itemTitle} className="w-20 h-20 rounded-xl object-cover shrink-0" onClick={() => nav('/hlutur/' + booking.itemId)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm truncate">{booking.itemTitle}</h3>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${BOOKING_STATUS_COLORS[booking.status]}`}>
              {BOOKING_STATUS_LABELS[booking.status]}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{isOwner ? booking.renterName : booking.ownerName}</p>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-600">
            <span className="flex items-center gap-1"><Calendar size={12} />{booking.startDate} → {booking.endDate}</span>
            <span className="font-semibold text-teal-700">{booking.totalISK.toLocaleString('is-IS')} kr</span>
          </div>
          {booking.message && <p className="text-xs text-gray-400 mt-1 truncate">"{booking.message}"</p>}
        </div>
      </div>

      {/* Action buttons */}
      {isOwner && booking.status === 'pending' && (
        <div className="flex border-t">
          <button onClick={() => onAction(booking.id, 'rejected')} className="flex-1 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center justify-center gap-1"><XCircle size={16} />Hafna</button>
          <div className="w-px bg-gray-200" />
          <button onClick={() => onAction(booking.id, 'confirmed')} className="flex-1 py-2.5 text-sm font-medium text-teal-600 hover:bg-teal-50 flex items-center justify-center gap-1"><CheckCircle2 size={16} />Samþykkja</button>
        </div>
      )}
      {isOwner && booking.status === 'confirmed' && (
        <div className="border-t">
          <button onClick={() => onAction(booking.id, 'active')} className="w-full py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-1"><Package size={16} />Afhent — hefja leigu</button>
        </div>
      )}
      {!isOwner && booking.status === 'active' && (
        <div className="border-t">
          <button onClick={() => onAction(booking.id, 'returned')} className="w-full py-2.5 text-sm font-medium text-purple-600 hover:bg-purple-50 flex items-center justify-center gap-1"><CheckCircle2 size={16} />Skilað</button>
        </div>
      )}
      {booking.status === 'returned' && (
        <div className="border-t">
          <button onClick={() => nav('/hlutur/' + booking.itemId)} className="w-full py-2.5 text-sm font-medium text-amber-600 hover:bg-amber-50 flex items-center justify-center gap-1">⭐ Gefa einkunn</button>
        </div>
      )}
      {!isOwner && booking.status === 'pending' && (
        <div className="border-t">
          <button onClick={() => onAction(booking.id, 'cancelled')} className="w-full py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-1"><XCircle size={16} />Hætta við</button>
        </div>
      )}
    </div>
  );
}

export default function BookingsPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { bookings, updateBooking, getBookingsForUser } = useBookings();
  const [tab, setTab] = useState<'renter' | 'owner'>('renter');

  if (!user) return <Navigate to="/innskraning" replace />;

  const myBookings = getBookingsForUser(user.uid);
  const filtered = myBookings
    .filter(b => tab === 'renter' ? b.renterId === user.uid : b.ownerId === user.uid)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const pendingCount = myBookings.filter(b => b.ownerId === user.uid && b.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-bold text-lg">Bókanir</h1>
            {pendingCount > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingCount} bíða</span>}
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white shadow-sm text-teal-700' : 'text-gray-500'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
            <h3 className="font-semibold mb-1">{tab === 'renter' ? 'Engar bókanir' : 'Engar leigubeiðnir'}</h3>
            <p className="text-sm text-gray-500">{tab === 'renter' ? 'Finndu hluti og bókaðu!' : 'Skráðu hluti til leigu'}</p>
          </div>
        ) : filtered.map(b => (
          <BookingCard key={b.id} booking={b} isOwner={b.ownerId === user.uid} onAction={updateBooking} />
        ))}
      </main>
    </div>
  );
}
