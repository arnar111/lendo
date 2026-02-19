import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import Fuse from 'fuse.js';
import ItemCard from '../components/ItemCard';
import { useItems } from '../store/useStore';
import { CATEGORIES } from '../types';

export default function SearchPage() {
  const { items } = useItems();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string | null>(null);
  const [pMin, setPMin] = useState(0);
  const [pMax, setPMax] = useState(100000);
  const [cond, setCond] = useState<string | null>(null);

  const active = items.filter(i => i.status === 'virkt');
  const fuse = useMemo(() => new Fuse(active, { keys: ['title', 'description', 'categoryId'], threshold: 0.4 }), [active]);

  const results = useMemo(() => {
    let r = q.trim() ? fuse.search(q).map(x => x.item) : active;
    if (cat) r = r.filter(i => i.categoryId === cat);
    if (cond) r = r.filter(i => i.condition === cond);
    return r.filter(i => i.pricePerDayISK >= pMin && i.pricePerDayISK <= pMax);
  }, [q, active, fuse, cat, cond, pMin, pMax]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-40 px-4 py-3 max-w-lg mx-auto">
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="Leita\u2026" autoFocus
            className="w-full pl-10 pr-10 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
          {q && <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X size={18} className="text-gray-400" /></button>}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map(c => <button key={c.id} onClick={() => setCat(cat === c.id ? null : c.id)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${cat === c.id ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700'}`}>{c.icon} {c.label}</button>)}
        </div>
        <div className="flex gap-2 mt-2 items-center text-sm">
          <input type="number" value={pMin || ''} onChange={e => setPMin(Number(e.target.value))} placeholder="Lágm." className="w-20 px-2 py-1.5 border rounded-lg text-xs" />
          <span>\u2013</span>
          <input type="number" value={pMax === 100000 ? '' : pMax} onChange={e => setPMax(Number(e.target.value) || 100000)} placeholder="Hám." className="w-20 px-2 py-1.5 border rounded-lg text-xs" />
          <select value={cond || ''} onChange={e => setCond(e.target.value || null)} className="px-2 py-1.5 border rounded-lg text-xs">
            <option value="">Allt ástand</option><option value="nytt">Nýtt</option><option value="gott">Gott</option><option value="notad">Notað</option>
          </select>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 pt-4">
        <p className="text-sm text-gray-500 mb-3">{results.length} niðurstöður</p>
        {results.length === 0 ? <div className="text-center py-16"><div className="text-5xl mb-4">\ud83d\udd0d</div><h3 className="font-semibold">Engar niðurstöður</h3></div>
         : <div className="grid grid-cols-2 gap-3">{results.map(i => <ItemCard key={i.id} item={i} />)}</div>}
      </main>
    </div>
  );
}
