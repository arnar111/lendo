import { Star } from 'lucide-react';

export default function StarRating({ rating, onChange, size = 20 }: { rating: number; onChange?: (r: number) => void; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" disabled={!onChange} onClick={() => onChange?.(i)} className={onChange ? 'cursor-pointer' : 'cursor-default'}>
          <Star size={size} className={i <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
        </button>
      ))}
    </div>
  );
}
