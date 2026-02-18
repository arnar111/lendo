import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, MapPin, X, Heart, Navigation } from 'lucide-react';
import Fuse from 'fuse.js';
import ItemCard from '../components/ItemCard';
import { useItems, useAuth, useGeo, distanceKm } from '../store/useStore';
import { CATEGORIES } from '../types';

const RADII = [2, 5, 10, 25, 50];
type SortMode = 'near' | 'new' | 'popular' | 'price';

export default function HomePage() {
  const { items } = useItems();
  const { user } = useAuth();
  const { location, hasRealLocation, requestLocation } = useGeo();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string | null>(null);
  const [pMin, setPMin] = useState(0);
  const [pMax, setPMax] = useState(100000);
  const [radius, setRadius] = useState(10);
  const [showF, setShowF] = useState(false);
  const [sort, setSort] = useState<SortMode>('near');

  const active = items.filter(i => i.status === 'virkt');
  const fuse = useMemo(() => new Fuse(active, { keys: ['title', 'description', 'categoryId'], threshold: 0.4 }), [active]);

  const filtered = useMemo(() => {
    let r = q.trim() ? fuse.search(q).map(x => x.item) : active;
    if (cat) r = r.filter(i => i.categoryId === cat);
    r = r.filter(i => i.pricePerDayISK >= pMin && i.pricePerDayISK <= pMax);
    r = r.filter(i => distanceKm(location.lat, location.lng, i.location.lat, i.location.lng) <= radius);
    switch (sort) {
      case 'near': r.sort((a, b) => distanceKm(location.lat, location.lng, a.location.lat, a.location.lng) - distanceKm(location.lat, location.lng, b.location.lat, b.location.lng)); break;
      case 'new': r.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break;
      case 'popular': r.sort((a, b) => b.ratingCount - a.ratingCount); break;
      case 'price': r.sort((a, b) => a.pricePerDayISK - b.pricePerDayISK); break;
    }
    return r;
  }, [q, active, fuse, cat, pMin, pMax, radius, sort, location]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-gradient">Lendó</h1>
            <div className="flex items-center gap-2">
              <Link to="/uppahalds" className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><Heart size={16} className="text-gray-500" /></Link>
              {user ? <Link to="/profill" className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-sm">{user.displayName.charAt(0)}</Link>
                : <Link to="/innskraning" className="text-sm font-medium text-teal-600">Innskrá</Link>}
            </div>
          </div>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Leita að hlutum..." value={q} onChange={e => setQ(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
            <button onClick={() => setShowF(!showF)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"><SlidersHorizontal size={18} /></button>
          </div>
          <div className="flex items-center gap-2 mt-2 text-sm">
            <button onClick={requestLocation} className="flex items-center gap-1 text-teal-600">
              <Navigation size={14} className={hasRealLocation ? 'fill-teal-600' : ''} />
              <span className="text-xs">{hasRealLocation ? 'GPS' : 'Sjálfgefið'}</span>
            </button>
            <div className="flex gap-1">{RADII.map(r => (
              <button key={r} onClick={() => setRadius(r)} className={`px-2.5 py-1 rounded-full text-xs font-medium ${radius === r ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{r}km</button>
            ))}</div>
          </div>
        </div>
      </header>

      {showF && (
        <div className="bg-white border-b px-4 py-4 max-w-lg mx-auto animate-slide-up">
          <div className="flex items-center justify-between mb-3"><h3 className="font-semibold">Síur</h3><button onClick={() => setShowF(false)}><X size={20} className="text-gray-400" /></button></div>
          <p className="text-sm text-gray-600 mb-2">Flokkur</p>
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => setCat(null)} className={`px-3 py-1.5 rounded-full text-sm ${!cat ? 'bg-teal-600 text-white' : 'bg-gray-100'}`}>Allt</button>
            {CATEGORIES.map(c => <button key={c.id} onClick={() => setCat(cat === c.id ? null : c.id)} className={`px-3 py-1.5 rounded-full text-sm ${cat === c.id ? 'bg-teal-600 text-white' : 'bg-gray-100'}`}>{c.icon} {c.label}</button>)}
          </div>
          <p className="text-sm text-gray-600 mb-2">Verðbil (kr/dag)</p>
          <div className="flex gap-2 items-center">
            <input type="number" value={pMin} onChange={e => setPMin(Number(e.target.value))} className="w-24 px-3 py-2 border rounded-lg text-sm" />
            <span>–</span>
            <input type="number" value={pMax} onChange={e => setPMax(Number(e.target.value))} className="w-24 px-3 py-2 border rounded-lg text-sm" />
          </div>
          <button onClick={() => setShowF(false)} className="w-full mt-4 py-2.5 bg-teal-600 text-white rounded-xl font-medium text-sm">Sýna ({filtered.length})</button>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 min-w-max">
          {CATEGORIES.map(c => <button key={c.id} onClick={() => setCat(cat === c.id ? null : c.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm whitespace-nowrap ${cat === c.id ? 'bg-teal-600 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}>
            <span>{c.icon}</span><span>{c.label}</span>
          </button>)}
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            {([['near','Nálægt'],['new','Nýjast'],['popular','Vinsælt'],['price','Verð']] as [SortMode,string][]).map(([k,l]) => (
              <button key={k} onClick={() => setSort(k)} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${sort === k ? 'bg-white shadow-sm text-teal-700' : 'text-gray-500'}`}>{l}</button>
            ))}
          </div>
          <Link to="/kort" className="text-sm text-teal-600 font-medium flex items-center gap-1"><MapPin size={14} /> Kort</Link>
        </div>
        <p className="text-xs text-gray-400 mb-3">{filtered.length} hlutir innan {radius}km</p>
        {filtered.length === 0 ? (
          <div className="text-center py-16"><div className="text-5xl mb-4">🔍</div><h3 className="font-semibold mb-1">Ekkert fannst</h3><p className="text-sm text-gray-500">Breyttu leit eða stækkaðu radíus</p></div>
        ) : (
          <div className="grid grid-cols-2 gap-3">{filtered.map(item => <ItemCard key={item.id} item={item} distance={distanceKm(location.lat, location.lng, item.location.lat, item.location.lng)} />)}</div>
        )}
      </main>
    </div>
  );
}
