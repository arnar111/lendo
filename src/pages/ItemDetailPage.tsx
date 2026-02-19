import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Shield, MessageCircle, Heart, Share2, BadgeCheck, Calendar, ChevronDown } from 'lucide-react';
import { useItems, useAuth, useReviews, useConversations, useUsers, useBookings, useFavorites } from '../store/useStore';
import { CATEGORIES, CONDITION_LABELS } from '../types';
import StarRating from '../components/StarRating';
import { useState, useMemo } from 'react';

function daysBetween(a: string, b: string): number {
  return Math.max(1, Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { items } = useItems();
  const { user } = useAuth();
  const { getReviewsFor, addReview } = useReviews();
  const { getOrCreateConversation } = useConversations();
  const { getUser } = useUsers();
  const { createBooking, getBookingsForItem } = useBookings();
  const { isFav, toggle } = useFavorites();
  const [pi, setPi] = useState(0);
  const [showRF, setShowRF] = useState(false);
  const [rr, setRR] = useState(5);
  const [rt, setRT] = useState('');
  const [showBook, setShowBook] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookMsg, setBookMsg] = useState('');
  const [bookSent, setBookSent] = useState(false);

  const item = items.find(i => i.id === id);
  if (!item) return <div className="min-h-screen flex items-center justify-center text-gray-500">Hlutur fannst ekki</div>;
  const owner = getUser(item.ownerId);
  const revs = getReviewsFor(item.id, 'item');
  const cat = CATEGORIES.find(c => c.id === item.categoryId);
  const fav = isFav(item.id);
  const existingBookings = getBookingsForItem(item.id);

  const days = startDate && endDate ? daysBetween(startDate, endDate) : 0;
  const totalISK = days * item.pricePerDayISK;
  const serviceFee = Math.round(totalISK * 0.12);

  const share = async () => {
    const url = window.location.href;
    const text = `${item.title} — ${item.pricePerDayISK.toLocaleString('is-IS')} kr/dag á Lendó`;
    if (navigator.share) { try { await navigator.share({ title: item.title, text, url }); } catch {} }
    else { navigator.clipboard.writeText(`${text}\n${url}`); }
  };

  const msg = () => { if (!user) { nav('/innskraning'); return; } const c = getOrCreateConversation(user.uid, item.ownerId, item.id, item.title); nav('/skilabod/' + c.id); };

  const book = () => {
    if (!user || !startDate || !endDate) return;
    createBooking({
      itemId: item.id, itemTitle: item.title, itemPhoto: item.photos[0],
      ownerId: item.ownerId, ownerName: item.ownerDisplayName,
      renterId: user.uid, renterName: user.displayName,
      startDate, endDate, days,
      totalISK, depositISK: item.depositISK || 0,
      message: bookMsg || undefined,
    });
    setBookSent(true);
    setTimeout(() => nav('/bokanir'), 1500);
  };

  const rev = () => { if (!user) return; addReview({ authorId: user.uid, authorDisplayName: user.displayName, targetType: 'item', targetId: item.id, rating: rr as 1|2|3|4|5, text: rt || undefined }); setShowRF(false); setRT(''); };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Photo */}
      <div className="relative aspect-[4/3] bg-gray-200">
        <img src={item.photos[pi]} alt={item.title} className="w-full h-full object-cover" />
        <div className="absolute top-4 left-4 flex gap-2">
          <button onClick={() => nav(-1)} className="w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-sm"><ArrowLeft size={20} /></button>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={share} className="w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-sm"><Share2 size={18} /></button>
          <button onClick={() => toggle(item.id)} className="w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-sm"><Heart size={18} className={fav ? 'fill-red-500 text-red-500' : ''} /></button>
        </div>
        {item.photos.length > 1 && <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">{item.photos.map((_, i) => <button key={i} onClick={() => setPi(i)} className={'w-2 h-2 rounded-full ' + (i === pi ? 'bg-white' : 'bg-white/50')} />)}</div>}
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto">
        {/* Title + price */}
        <div className="flex items-start justify-between gap-3">
          <div><h1 className="text-xl font-bold">{item.title}</h1>{cat && <span className="text-sm text-gray-500">{cat.icon} {cat.label}</span>}</div>
          <div className="text-right shrink-0"><p className="text-xl font-bold text-brand-600">{item.pricePerDayISK.toLocaleString('is-IS')} kr</p><p className="text-xs text-gray-500">á dag</p></div>
        </div>

        {item.ratingCount > 0 && <div className="flex items-center gap-1.5 mt-2 text-sm"><Star size={16} className="text-amber-400 fill-amber-400" /><span className="font-semibold">{item.ratingAvg.toFixed(1)}</span><span className="text-gray-500">({item.ratingCount} umsagnir)</span></div>}

        {/* Pricing cards */}
        <div className="flex gap-3 mt-4 text-sm">
          <div className="bg-gray-50 rounded-xl px-3 py-2 flex-1 text-center"><p className="font-bold">{item.pricePerDayISK.toLocaleString('is-IS')} kr</p><p className="text-gray-500 text-xs">Dagur</p></div>
          {item.pricePerWeekendISK && <div className="bg-gray-50 rounded-xl px-3 py-2 flex-1 text-center"><p className="font-bold">{item.pricePerWeekendISK.toLocaleString('is-IS')} kr</p><p className="text-gray-500 text-xs">Helgi</p></div>}
          {item.pricePerWeekISK && <div className="bg-gray-50 rounded-xl px-3 py-2 flex-1 text-center"><p className="font-bold">{item.pricePerWeekISK.toLocaleString('is-IS')} kr</p><p className="text-gray-500 text-xs">Vika</p></div>}
        </div>

        {/* Condition + deposit */}
        <div className="flex gap-3 mt-3 text-sm flex-wrap">
          <div className="flex items-center gap-1.5 bg-green-50 text-green-700 rounded-lg px-3 py-1.5"><Shield size={14} />{CONDITION_LABELS[item.condition]}</div>
          {item.depositISK && <div className="bg-amber-50 text-amber-700 rounded-lg px-3 py-1.5">Trygging: {item.depositISK.toLocaleString('is-IS')} kr</div>}
        </div>

        {/* Description */}
        <div className="mt-5"><h2 className="font-semibold mb-2">Lýsing</h2><p className="text-sm text-gray-700 leading-relaxed">{item.description}</p></div>

        {/* Location */}
        <div className="mt-5"><h2 className="font-semibold mb-2">Staðsetning</h2><p className="text-sm text-gray-600 flex items-center gap-1.5"><MapPin size={16} className="text-brand-500" />{item.location.city}{item.location.postalCode ? ', ' + item.location.postalCode : ''}</p></div>

        {/* Owner */}
        {owner && <Link to={'/profill/' + owner.uid} className="mt-5 flex items-center gap-3 bg-gray-50 rounded-xl p-3">
          <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg overflow-hidden">{owner.photoURL ? <img src={owner.photoURL} className="w-full h-full object-cover" /> : owner.displayName.charAt(0)}</div>
          <div className="flex-1">
            <p className="font-semibold flex items-center gap-1">{owner.displayName}{owner.verified && <BadgeCheck size={16} className="text-blue-500" />}</p>
            {owner.ratingCountAsOwner > 0 && <p className="text-sm text-gray-500 flex items-center gap-1"><Star size={12} className="text-amber-400 fill-amber-400" />{owner.ratingAsOwnerAvg.toFixed(1)} ({owner.ratingCountAsOwner})</p>}
          </div>
        </Link>}

        {/* Existing bookings indicator */}
        {existingBookings.length > 0 && (
          <div className="mt-4 bg-blue-50 rounded-xl p-3">
            <p className="text-sm text-blue-700 font-medium">{existingBookings.length} {existingBookings.length === 1 ? 'bókun' : 'bókanir'} á þessum hlut</p>
          </div>
        )}

        {/* Booking form */}
        {showBook && !bookSent && user && user.uid !== item.ownerId && (
          <div className="mt-5 bg-brand-50 rounded-2xl p-4 animate-slide-up">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Calendar size={18} className="text-brand-600" />Bóka hlut</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div><label className="text-xs font-medium text-gray-600 mb-1 block">Frá</label><input type="date" min={today} value={startDate} onChange={e => { setStartDate(e.target.value); if (endDate && e.target.value > endDate) setEndDate(''); }} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div><label className="text-xs font-medium text-gray-600 mb-1 block">Til</label><input type="date" min={startDate || today} value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            </div>
            <textarea value={bookMsg} onChange={e => setBookMsg(e.target.value)} placeholder="Skilaboð til eiganda (valkvætt)..." className="w-full px-3 py-2 border rounded-lg text-sm resize-none h-16 mb-3" />
            {days > 0 && (
              <div className="bg-white rounded-xl p-3 mb-3 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">{item.pricePerDayISK.toLocaleString('is-IS')} kr × {days} {days === 1 ? 'dagur' : 'dagar'}</span><span className="font-medium">{totalISK.toLocaleString('is-IS')} kr</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Þjónustugjald (12%)</span><span className="font-medium">{serviceFee.toLocaleString('is-IS')} kr</span></div>
                {item.depositISK && <div className="flex justify-between text-amber-700"><span>Trygging (endurgreidd)</span><span className="font-medium">{item.depositISK.toLocaleString('is-IS')} kr</span></div>}
                <div className="border-t pt-1.5 flex justify-between font-bold"><span>Samtals</span><span className="text-brand-700">{(totalISK + serviceFee).toLocaleString('is-IS')} kr</span></div>
              </div>
            )}
            <button onClick={book} disabled={!startDate || !endDate} className="w-full py-3 bg-brand-600 text-white rounded-xl font-semibold text-sm disabled:opacity-40">Senda bókunarbeiðni</button>
          </div>
        )}
        {bookSent && (
          <div className="mt-5 bg-green-50 rounded-2xl p-6 text-center animate-fade-in-up">
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="font-bold text-lg text-green-800">Bókunarbeiðni send!</h3>
            <p className="text-sm text-green-600 mt-1">Eigandi fær tilkynningu og samþykkir eða hafnar.</p>
          </div>
        )}

        {/* Reviews */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3"><h2 className="font-semibold">Umsagnir</h2>{user && user.uid !== item.ownerId && <button onClick={() => setShowRF(!showRF)} className="text-sm text-brand-600 font-medium">+ Skrifa</button>}</div>
          {showRF && <div className="bg-gray-50 rounded-xl p-4 mb-4"><StarRating rating={rr} onChange={setRR} /><textarea value={rt} onChange={e => setRT(e.target.value)} placeholder="Segðu frá..." className="w-full mt-2 p-2 border rounded-lg text-sm resize-none h-20" /><button onClick={rev} className="mt-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium">Senda</button></div>}
          {revs.length === 0 ? <p className="text-sm text-gray-500">Engar umsagnir ennþá</p> : <div className="space-y-3">{revs.map(r => <div key={r.id} className="bg-gray-50 rounded-xl p-3"><div className="flex items-center gap-2 mb-1"><span className="font-medium text-sm">{r.authorDisplayName}</span><StarRating rating={r.rating} size={14} /></div>{r.text && <p className="text-sm text-gray-700">{r.text}</p>}</div>)}</div>}
        </div>
      </div>

      {/* Fixed bottom CTA */}
      {(!user || user.uid !== item.ownerId) && !bookSent && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t px-4 py-3 z-40 safe-area-bottom">
          <div className="max-w-lg mx-auto flex gap-2">
            <button onClick={msg} className="flex-1 py-3 border-2 border-brand-600 text-brand-600 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm"><MessageCircle size={18} />Spjall</button>
            <button onClick={() => { if (!user) { nav('/innskraning'); return; } setShowBook(!showBook); }} className="flex-[2] py-3 bg-brand-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 text-sm"><Calendar size={18} />Bóka</button>
          </div>
        </div>
      )}
    </div>
  );
}
