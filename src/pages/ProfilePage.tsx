import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, LogOut, Settings, TrendingUp } from 'lucide-react';
import { useAuth, useUsers, useItems, useReviews } from '../store/useStore';
import ItemCard from '../components/ItemCard';
import StarRating from '../components/StarRating';
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

export default function ProfilePage() {
  const { uid } = useParams<{ uid: string }>();
  const nav = useNavigate();
  const { user: me, logout, updateProfile } = useAuth();
  const { getUser } = useUsers();
  const { items } = useItems();
  const { getReviewsFor, addReview } = useReviews();
  const [editing, setEditing] = useState(false);
  const [eName, setEName] = useState('');
  const [eBio, setEBio] = useState('');
  const [showRF, setShowRF] = useState(false);
  const [rr, setRR] = useState(5);
  const [rt, setRT] = useState('');

  const isOwn = !uid || uid === me?.uid;
  const pu = isOwn ? me : getUser(uid!);
  if (!pu) { if (!me) return <Navigate to="/innskraning" replace />; return <div className="min-h-screen flex items-center justify-center text-gray-500">Notandi fannst ekki</div>; }

  const uItems = items.filter(i => i.ownerId === pu.uid && i.status === 'virkt');
  const oRevs = getReviewsFor(pu.uid, 'user_owner');

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-40 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="font-bold text-lg">{isOwn ? 'Prófíllinn minn' : 'Prófíll'}</h1>
          {isOwn && <div className="flex gap-2">
            <button onClick={() => nav('/tekjur')}><TrendingUp size={20} className="text-brand-600" /></button>
            <button onClick={() => { setEName(pu.displayName); setEBio(pu.bio || ''); setEditing(!editing); }}><Settings size={20} className="text-gray-500" /></button>
            <button onClick={() => { logout(); nav('/'); }}><LogOut size={20} className="text-gray-500" /></button>
          </div>}
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-2xl overflow-hidden shrink-0">{pu.photoURL ? <img src={pu.photoURL} className="w-full h-full object-cover" /> : pu.displayName.charAt(0)}</div>
          <div>
            <h2 className="text-xl font-bold">{pu.displayName}</h2>
            {pu.bio && <p className="text-sm text-gray-600 mt-1">{pu.bio}</p>}
            <div className="flex gap-4 mt-2 text-sm text-gray-500">
              {pu.ratingCountAsOwner > 0 && <span className="flex items-center gap-1"><Star size={14} className="text-amber-400 fill-amber-400" />{pu.ratingAsOwnerAvg.toFixed(1)} eigandi</span>}
              {pu.ratingCountAsRenter > 0 && <span className="flex items-center gap-1"><Star size={14} className="text-amber-400 fill-amber-400" />{pu.ratingAsRenterAvg.toFixed(1)} leigjandi</span>}
            </div>
          </div>
        </div>

        {isOwn && (
          <button onClick={() => nav('/tekjur')} className="w-full bg-gradient-to-r from-brand-600 to-brand-400 text-white rounded-2xl p-4 mb-6 flex items-center gap-3 hover:from-brand-700 hover:to-emerald-700 transition-all shadow-sm">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center"><TrendingUp size={24} /></div>
            <div className="text-left flex-1"><p className="font-bold">Tekjuyfirlit</p><p className="text-sm text-brand-100">Sjáðu tekjur þínar og tölfræði</p></div>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        )}

        {editing && <div className="bg-white rounded-xl border p-4 mb-6 space-y-3">
          <div><label className="text-sm font-medium">Nafn</label><input type="text" value={eName} onChange={e => setEName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm mt-1" /></div>
          <div><label className="text-sm font-medium">Um mig</label><textarea value={eBio} onChange={e => setEBio(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm mt-1 h-20 resize-none" /></div>
          <button onClick={() => { updateProfile({ displayName: eName || pu.displayName, bio: eBio }); setEditing(false); }} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium">Vista</button>
        </div>}

        <div className="mb-6">
          <h3 className="font-semibold mb-3">Auglýsingar ({uItems.length})</h3>
          {uItems.length === 0 ? <div className="text-center py-8 bg-white rounded-xl border"><p className="text-gray-500 text-sm">Engar auglýsingar</p>{isOwn && <Link to="/skra-hlut" className="text-brand-600 text-sm font-medium mt-2 inline-block">+ Skrá hlut</Link>}</div>
           : <div className="grid grid-cols-2 gap-3">{uItems.map(i => <ItemCard key={i.id} item={i} />)}</div>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3"><h3 className="font-semibold">Umsagnir sem eigandi</h3>
            {me && !isOwn && <button onClick={() => setShowRF(!showRF)} className="text-sm text-brand-600 font-medium">+ Skrifa</button>}</div>
          {showRF && <div className="bg-white rounded-xl border p-4 mb-4"><StarRating rating={rr} onChange={setRR} /><textarea value={rt} onChange={e => setRT(e.target.value)} className="w-full mt-2 p-2 border rounded-lg text-sm resize-none h-20" /><button onClick={() => { if (!me) return; addReview({ authorId: me.uid, authorDisplayName: me.displayName, targetType: 'user_owner', targetId: pu.uid, rating: rr as 1|2|3|4|5, text: rt || undefined }); setShowRF(false); setRT(''); }} className="mt-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium">Senda</button></div>}
          {oRevs.length === 0 ? <p className="text-sm text-gray-500">Engar umsagnir</p> : <div className="space-y-3">{oRevs.map(r => <div key={r.id} className="bg-white rounded-xl border p-3"><div className="flex items-center gap-2 mb-1"><span className="font-medium text-sm">{r.authorDisplayName}</span><StarRating rating={r.rating} size={14} /></div>{r.text && <p className="text-sm text-gray-700">{r.text}</p>}</div>)}</div>}
        </div>
      </main>
    </div>
  );
}
