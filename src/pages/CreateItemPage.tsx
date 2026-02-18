import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ImagePlus } from 'lucide-react';
import { useItems, useAuth } from '../store/useStore';
import { CATEGORIES } from '../types';
import type { ItemCondition } from '../types';

const CONDS: { v: ItemCondition; l: string }[] = [{ v: 'nytt', l: 'Nýtt' }, { v: 'gott', l: 'Gott' }, { v: 'notad', l: 'Notað' }, { v: 'slitid', l: 'Slitið' }];

export default function CreateItemPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { addItem } = useItems();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [catId, setCatId] = useState('verkfaeri');
  const [cond, setCond] = useState<ItemCondition>('gott');
  const [price, setPrice] = useState('');
  const [weekPrice, setWeekPrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  if (!user) return <Navigate to="/innskraning" replace />;

  const go = (e: React.FormEvent) => {
    e.preventDefault(); if (!title || !price) return;
    const item = addItem({ ownerId: user.uid, ownerDisplayName: user.displayName, title, description: desc, categoryId: catId, condition: cond,
      photos: photos.length > 0 ? photos : ['https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600'],
      pricePerDayISK: Number(price), pricePerWeekISK: weekPrice ? Number(weekPrice) : undefined, depositISK: deposit ? Number(deposit) : undefined,
      location: { lat: 64.1466 + (Math.random() - 0.5) * 0.02, lng: -21.9426 + (Math.random() - 0.5) * 0.04, city: 'Reykjavík', postalCode: '101' } });
    nav('/hlutur/' + item.id);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-40 px-4 py-3"><div className="max-w-lg mx-auto flex items-center gap-3"><button onClick={() => nav(-1)}><ArrowLeft size={20} /></button><h1 className="font-bold text-lg">Skrá hlut</h1></div></header>
      <form onSubmit={go} className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Myndir</label>
          <div className="flex gap-2 flex-wrap mb-2">{photos.map((p, i) => <div key={i} className="w-20 h-20 rounded-lg overflow-hidden relative"><img src={p} className="w-full h-full object-cover" /><button type="button" onClick={() => setPhotos(pr => pr.filter((_, j) => j !== i))} className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">x</button></div>)}</div>
          <div className="flex gap-2"><input type="text" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} placeholder="URL á mynd" className="flex-1 px-3 py-2 border rounded-lg text-sm" /><button type="button" onClick={() => { if (photoUrl.trim()) { setPhotos(p => [...p, photoUrl.trim()]); setPhotoUrl(''); } }} className="px-3 py-2 bg-gray-100 rounded-lg"><ImagePlus size={18} /></button></div></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Titill *</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="t.d. Bosch borvél" className="w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-teal-300 focus:outline-none" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Flokkur</label><select value={catId} onChange={e => setCatId(e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-sm">{CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}</select></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Lýsing</label><textarea value={desc} onChange={e => setDesc(e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-sm resize-none h-24" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Ástand</label><div className="flex gap-2 flex-wrap">{CONDS.map(c => <button key={c.v} type="button" onClick={() => setCond(c.v)} className={`px-3 py-1.5 rounded-full text-sm ${cond === c.v ? 'bg-teal-600 text-white' : 'bg-gray-100'}`}>{c.l}</button>)}</div></div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Dagverð *</label><input type="number" value={price} onChange={e => setPrice(e.target.value)} required className="w-full px-3 py-2.5 border rounded-xl text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Vikuverð</label><input type="number" value={weekPrice} onChange={e => setWeekPrice(e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Trygging</label><input type="number" value={deposit} onChange={e => setDeposit(e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-sm" /></div>
        </div>
        <button type="submit" className="w-full py-3 bg-teal-600 text-white rounded-xl font-semibold text-sm">Birta auglýsingu</button>
      </form>
    </div>
  );
}
