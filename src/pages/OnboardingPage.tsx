import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../store/useStore';

const AVATAR_SEEDS = ['Felix', 'Aneka', 'Bella', 'Dusty', 'Leo', 'Mia', 'Oscar', 'Luna', 'Nala', 'Simba', 'Coco', 'Max'];

export default function OnboardingPage() {
  const nav = useNavigate();
  const { user, updateProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(user?.displayName || '');
  const [bio, setBio] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [customPhoto, setCustomPhoto] = useState<string | null>(user?.photoURL || null);
  const [useCustomPhoto, setUseCustomPhoto] = useState(!!user?.photoURL);
  const fileRef = useRef<HTMLInputElement>(null);

  const currentPhoto = useCustomPhoto && customPhoto
    ? customPhoto
    : selectedAvatar
      ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedAvatar}`
      : user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || 'default'}`;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCustomPhoto(reader.result as string);
      setUseCustomPhoto(true);
      setSelectedAvatar(null);
    };
    reader.readAsDataURL(file);
  };

  const selectAvatar = (seed: string) => {
    setSelectedAvatar(seed);
    setUseCustomPhoto(false);
  };

  const finish = async () => {
    const photoURL = useCustomPhoto && customPhoto
      ? customPhoto
      : selectedAvatar
        ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedAvatar}`
        : currentPhoto;

    await updateProfile({
      displayName: name.trim() || 'Notandi',
      bio: bio.trim() || undefined,
      photoURL,
      needsOnboarding: false,
    });
    nav('/');
  };

  if (!user) { nav('/innskraning'); return null; }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {[0, 1, 2].map(i => (
            <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${i === step ? 'bg-white w-6' : i < step ? 'bg-white/80' : 'bg-white/30'}`} />
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          {/* Step 0: Name */}
          {step === 0 && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="text-center mb-2">
                <Sparkles size={32} className="mx-auto text-teal-500 mb-2" />
                <h2 className="text-xl font-bold">Velkomin á Leigja!</h2>
                <p className="text-sm text-gray-500 mt-1">Hvað heitirðu?</p>
              </div>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Fullt nafn"
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-gray-100 text-sm border-0 focus:ring-2 focus:ring-teal-500 text-center text-lg font-medium"
              />
              <button
                onClick={() => { if (name.trim()) setStep(1); }}
                disabled={!name.trim()}
                className="w-full py-3 bg-teal-600 text-white rounded-xl font-semibold text-sm disabled:opacity-40"
              >
                Áfram
              </button>
            </div>
          )}

          {/* Step 1: Photo */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="text-center mb-2">
                <h2 className="text-xl font-bold">Veldu prófílmynd</h2>
                <p className="text-sm text-gray-500 mt-1">Veldu avatar eða settu þína eigin mynd</p>
              </div>

              {/* Current photo preview */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-teal-100 shadow-lg">
                    <img src={currentPhoto} alt="" className="w-full h-full object-cover" />
                  </div>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center shadow-md"
                  >
                    <Camera size={14} />
                  </button>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

              {/* Avatar grid */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Eða veldu avatar:</p>
                <div className="grid grid-cols-6 gap-2">
                  {AVATAR_SEEDS.map(seed => (
                    <button
                      key={seed}
                      onClick={() => selectAvatar(seed)}
                      className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${selectedAvatar === seed && !useCustomPhoto ? 'border-teal-500 ring-2 ring-teal-200 scale-110' : 'border-gray-200 hover:border-teal-300'}`}
                    >
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`} alt={seed} className="w-full h-full" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep(0)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600">Til baka</button>
                <button onClick={() => setStep(2)} className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-semibold text-sm">Áfram</button>
              </div>
            </div>
          )}

          {/* Step 2: Bio + finish */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="text-center mb-2">
                <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 border-2 border-teal-100">
                  <img src={currentPhoto} alt="" className="w-full h-full object-cover" />
                </div>
                <h2 className="text-xl font-bold">{name}</h2>
                <p className="text-sm text-gray-500 mt-1">Segðu öðrum smá frá þér (valkvætt)</p>
              </div>

              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="T.d. Verkfæra-áhugamaður í Kópavogi 🔧"
                className="w-full px-4 py-3 rounded-xl bg-gray-100 text-sm border-0 focus:ring-2 focus:ring-teal-500 resize-none h-20"
              />

              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600">Til baka</button>
                <button onClick={finish} className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                  <Check size={18} /> Klára
                </button>
              </div>
            </div>
          )}
        </div>

        <button onClick={finish} className="w-full text-center text-white/60 text-sm mt-4 hover:text-white/80">
          Sleppa þessu
        </button>
      </div>
    </div>
  );
}
