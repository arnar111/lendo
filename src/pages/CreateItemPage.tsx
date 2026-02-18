import { useState, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, ImagePlus, Camera, X, Sparkles, Tag, FileText, Shield, MapPin, ChevronRight } from 'lucide-react';
import { useItems, useAuth, useGeo } from '../store/useStore';
import { CATEGORIES } from '../types';
import type { ItemCondition } from '../types';

const CONDS: { v: ItemCondition; l: string; emoji: string; desc: string }[] = [
  { v: 'nytt', l: 'Nýtt', emoji: '✨', desc: 'Ónotað' },
  { v: 'gott', l: 'Gott', emoji: '👍', desc: 'Lítið notað' },
  { v: 'notad', l: 'Notað', emoji: '👌', desc: 'Virkar vel' },
  { v: 'slitid', l: 'Slitið', emoji: '🔧', desc: 'Slitnara' },
];

export default function CreateItemPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { addItem } = useItems();
  const { location } = useGeo();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [catId, setCatId] = useState('');
  const [cond, setCond] = useState<ItemCondition>('gott');
  const [price, setPrice] = useState('');
  const [weekPrice, setWeekPrice] = useState('');
  const [weekendPrice, setWeekendPrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  if (!user) return <Navigate to="/innskraning" replace />;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removePhoto = (idx: number) => setPhotos(prev => prev.filter((_, i) => i !== idx));

  const canProceed = () => {
    switch (step) {
      case 0: return photos.length > 0;
      case 1: return title.trim().length > 0 && catId;
      case 2: return true; // condition is pre-selected
      case 3: return Number(price) > 0;
      default: return false;
    }
  };

  const submit = () => {
    if (!title || !price) return;
    setSubmitting(true);
    const item = addItem({
      ownerId: user.uid, ownerDisplayName: user.displayName,
      title: title.trim(), description: desc.trim(), categoryId: catId, condition: cond,
      photos: photos.length > 0 ? photos : ['https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600'],
      pricePerDayISK: Number(price),
      pricePerWeekendISK: weekendPrice ? Number(weekendPrice) : undefined,
      pricePerWeekISK: weekPrice ? Number(weekPrice) : undefined,
      depositISK: deposit ? Number(deposit) : undefined,
      location: { lat: location.lat + (Math.random() - 0.5) * 0.01, lng: location.lng + (Math.random() - 0.5) * 0.02, city: 'Reykjavík', postalCode: '101' },
    });
    setTimeout(() => nav('/hlutur/' + item.id), 500);
  };

  const totalSteps = 4;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => step > 0 ? setStep(step - 1) : nav(-1)} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-lg">Skrá hlut</h1>
          </div>
          <span className="text-sm text-gray-400">{step + 1}/{totalSteps}</span>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div className="h-full bg-teal-500 transition-all duration-500" style={{ width: `${((step + 1) / totalSteps) * 100}%` }} />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />

        {/* Step 0: Photos */}
        {step === 0 && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-6">
              <Camera size={32} className="mx-auto text-teal-500 mb-2" />
              <h2 className="text-xl font-bold">Bættu við myndum</h2>
              <p className="text-sm text-gray-500 mt-1">Góðar myndir selja betur — bættu við a.m.k. einni</p>
            </div>

            {/* Photo grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
              {photos.map((p, i) => (
                <div key={i} className="aspect-square rounded-2xl overflow-hidden relative group shadow-sm">
                  <img src={p} className="w-full h-full object-cover" />
                  <button onClick={() => removePhoto(i)} className="absolute top-2 right-2 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={14} />
                  </button>
                  {i === 0 && <span className="absolute bottom-2 left-2 bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Forsíða</span>}
                </div>
              ))}

              {/* Add photo button */}
              <button onClick={() => fileRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-teal-300 flex flex-col items-center justify-center gap-2 hover:bg-teal-50 hover:border-teal-400 transition-colors">
                <ImagePlus size={24} className="text-teal-500" />
                <span className="text-xs text-teal-600 font-medium">Bæta við</span>
              </button>
            </div>

            {/* URL option */}
            <div className="text-center">
              <button onClick={() => setShowUrlInput(!showUrlInput)} className="text-xs text-gray-400 hover:text-gray-600">
                {showUrlInput ? 'Fela' : 'Eða bæta við frá URL'}
              </button>
              {showUrlInput && (
                <div className="flex gap-2 mt-2 max-w-sm mx-auto">
                  <input type="text" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} placeholder="https://..." className="flex-1 px-3 py-2 border rounded-xl text-sm" />
                  <button type="button" onClick={() => { if (photoUrl.trim()) { setPhotos(p => [...p, photoUrl.trim()]); setPhotoUrl(''); } }} className="px-3 py-2 bg-teal-100 text-teal-700 rounded-xl text-sm font-medium">Bæta við</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 1: Title + Category + Description */}
        {step === 1 && (
          <div className="animate-fade-in-up space-y-5">
            <div className="text-center mb-4">
              <Tag size={32} className="mx-auto text-teal-500 mb-2" />
              <h2 className="text-xl font-bold">Lýstu hlutnum</h2>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Hvað ertu að leigja? *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="t.d. Bosch borvél, Hilleberg tjald..." autoFocus
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl text-base focus:ring-2 focus:ring-teal-300 focus:border-teal-400 focus:outline-none" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Flokkur *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map(c => (
                  <button key={c.id} type="button" onClick={() => setCatId(c.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${catId === c.id ? 'bg-teal-600 text-white shadow-md scale-[1.02]' : 'bg-white border-2 border-gray-200 hover:border-teal-300'}`}>
                    <span className="text-lg">{c.icon}</span>
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Lýsing</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Segðu meira — hvað er innifalið, sérstakar athugasemdir..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm resize-none h-28 focus:ring-2 focus:ring-teal-300 focus:border-teal-400 focus:outline-none" />
            </div>
          </div>
        )}

        {/* Step 2: Condition */}
        {step === 2 && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-6">
              <Shield size={32} className="mx-auto text-teal-500 mb-2" />
              <h2 className="text-xl font-bold">Ástand</h2>
              <p className="text-sm text-gray-500 mt-1">Hvernig lítur hluturinn út?</p>
            </div>

            <div className="space-y-3 max-w-sm mx-auto">
              {CONDS.map(c => (
                <button key={c.v} type="button" onClick={() => setCond(c.v)}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all ${cond === c.v ? 'bg-teal-50 border-2 border-teal-500 shadow-sm' : 'bg-white border-2 border-gray-200 hover:border-teal-300'}`}>
                  <span className="text-2xl">{c.emoji}</span>
                  <div>
                    <p className={`font-semibold ${cond === c.v ? 'text-teal-700' : 'text-gray-900'}`}>{c.l}</p>
                    <p className="text-xs text-gray-500">{c.desc}</p>
                  </div>
                  {cond === c.v && <div className="ml-auto w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center"><ChevronRight size={14} className="text-white" /></div>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Pricing */}
        {step === 3 && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-6">
              <Sparkles size={32} className="mx-auto text-teal-500 mb-2" />
              <h2 className="text-xl font-bold">Verðlagning</h2>
              <p className="text-sm text-gray-500 mt-1">Settu verð á hlutinn þinn</p>
            </div>

            <div className="space-y-4 max-w-sm mx-auto">
              {/* Primary: Day price */}
              <div className="bg-white border-2 border-teal-200 rounded-2xl p-4">
                <label className="block text-sm font-semibold text-teal-700 mb-2">Dagverð *</label>
                <div className="relative">
                  <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" autoFocus
                    className="w-full px-4 py-3.5 pr-12 border-2 border-gray-200 rounded-xl text-2xl font-bold text-center focus:ring-2 focus:ring-teal-300 focus:border-teal-400 focus:outline-none" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">kr</span>
                </div>
              </div>

              {/* Optional prices */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-gray-200 rounded-2xl p-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Helgarverð</label>
                  <div className="relative">
                    <input type="number" value={weekendPrice} onChange={e => setWeekendPrice(e.target.value)} placeholder="—"
                      className="w-full px-3 py-2 border rounded-xl text-sm text-center focus:ring-2 focus:ring-teal-300 focus:outline-none" />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">kr</span>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Vikuverð</label>
                  <div className="relative">
                    <input type="number" value={weekPrice} onChange={e => setWeekPrice(e.target.value)} placeholder="—"
                      className="w-full px-3 py-2 border rounded-xl text-sm text-center focus:ring-2 focus:ring-teal-300 focus:outline-none" />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">kr</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-3">
                <label className="block text-xs font-medium text-gray-500 mb-1">Trygging (endurgreidd)</label>
                <div className="relative">
                  <input type="number" value={deposit} onChange={e => setDeposit(e.target.value)} placeholder="Valkvætt"
                    className="w-full px-3 py-2 border rounded-xl text-sm text-center focus:ring-2 focus:ring-teal-300 focus:outline-none" />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">kr</span>
                </div>
              </div>

              {/* Preview card */}
              {Number(price) > 0 && (
                <div className="bg-teal-50 rounded-2xl p-4 mt-2">
                  <p className="text-xs text-teal-600 font-medium mb-2">Sýnishorn:</p>
                  <div className="flex items-center gap-3">
                    {photos[0] && <img src={photos[0]} className="w-12 h-12 rounded-xl object-cover" />}
                    <div>
                      <p className="font-semibold text-sm">{title || 'Hlutur'}</p>
                      <p className="text-teal-700 font-bold">{Number(price).toLocaleString('is-IS')} kr/dag</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3 z-40 safe-area-bottom lg:relative lg:border-0 lg:bg-transparent lg:pt-0">
        <div className="max-w-2xl mx-auto flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="px-6 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
              Til baka
            </button>
          )}
          {step < totalSteps - 1 ? (
            <button onClick={() => setStep(step + 1)} disabled={!canProceed()}
              className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-semibold text-sm disabled:opacity-40 hover:bg-teal-700 transition-colors flex items-center justify-center gap-2">
              Áfram <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={submit} disabled={!canProceed() || submitting}
              className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-semibold text-sm disabled:opacity-40 hover:bg-teal-700 transition-colors flex items-center justify-center gap-2">
              {submitting ? (
                <><span className="animate-spin">⏳</span> Birti...</>
              ) : (
                <><Sparkles size={16} /> Birta auglýsingu</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
