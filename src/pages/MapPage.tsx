import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useItems } from '../store/useStore';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function MapPage() {
  const nav = useNavigate();
  const { items } = useItems();
  const active = items.filter(i => i.status === 'virkt');

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b sticky top-0 z-[1000] px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => nav(-1)}><ArrowLeft size={20} /></button>
          <h1 className="font-bold text-lg">Kort</h1>
          <span className="text-sm text-gray-500">{active.length} hlutir</span>
        </div>
      </header>
      <div className="flex-1" style={{ zIndex: 0 }}>
        <MapContainer center={[64.1466, -21.9426]} zoom={12} className="w-full h-full" style={{ height: 'calc(100vh - 52px)' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="OpenStreetMap" />
          {active.map(item => (
            <Marker key={item.id} position={[item.location.lat, item.location.lng]}>
              <Popup><div className="text-sm"><p className="font-semibold">{item.title}</p><p className="text-brand-600 font-bold">{item.pricePerDayISK.toLocaleString('is-IS')} kr/dag</p><button onClick={() => nav('/hlutur/' + item.id)} className="mt-1 text-brand-600 underline text-xs">Skoða</button></div></Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
