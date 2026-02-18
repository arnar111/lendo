import { Link } from 'react-router-dom';
import { Star, MapPin, Heart, BadgeCheck } from 'lucide-react';
import type { Item } from '../types';
import { useFavorites } from '../store/useStore';

export default function ItemCard({ item, distance }: { item: Item; distance?: number }) {
  const { isFav, toggle } = useFavorites();
  const fav = isFav(item.id);
  return (
    <div className="relative group">
      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(item.id); }}
        className="absolute top-2 left-2 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
        <Heart size={16} className={fav ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
      </button>
      <Link to={'/hlutur/' + item.id} className="block">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
          <div className="aspect-[4/3] relative overflow-hidden">
            <img src={item.photos[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-sm font-bold text-teal-700">
              {item.pricePerDayISK.toLocaleString('is-IS')} kr/dag
            </div>
          </div>
          <div className="p-3">
            <h3 className="font-semibold text-gray-900 truncate text-sm">{item.title}</h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              {item.ratingCount > 0 && <span className="flex items-center gap-0.5"><Star size={12} className="text-amber-400 fill-amber-400" /><span className="font-medium text-gray-700">{item.ratingAvg.toFixed(1)}</span></span>}
              {distance !== undefined ? <span className="flex items-center gap-0.5"><MapPin size={12} />{distance < 1 ? Math.round(distance * 1000) + 'm' : distance.toFixed(1) + 'km'}</span> : item.location.city ? <span className="flex items-center gap-0.5"><MapPin size={12} />{item.location.city}</span> : null}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
