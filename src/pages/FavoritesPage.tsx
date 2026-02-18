import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import ItemCard from '../components/ItemCard';
import { useAuth, useItems, useFavorites, useGeo, distanceKm } from '../store/useStore';

export default function FavoritesPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { items } = useItems();
  const { favorites } = useFavorites();
  const { location } = useGeo();

  if (!user) return <Navigate to="/innskraning" replace />;
  const favItems = items.filter(i => favorites.some(f => f.itemId === i.id));

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-40 px-4 py-3">
        <div className="max-w-lg mx-auto"><h1 className="font-bold text-lg">Uppáhald</h1></div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-4">
        {favItems.length === 0 ? (
          <div className="text-center py-16">
            <Heart size={48} className="mx-auto text-gray-300 mb-3" />
            <h3 className="font-semibold mb-1">Engin uppáhald</h3>
            <p className="text-sm text-gray-500">Ýttu á hjartað til að vista hluti</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {favItems.map(item => (
              <ItemCard key={item.id} item={item} distance={distanceKm(location.lat, location.lng, item.location.lat, item.location.lng)} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
