import { Link, useLocation } from 'react-router-dom';
import { Home, Search, PlusCircle, Calendar, User } from 'lucide-react';

const NAV = [
  { path: '/', icon: Home, label: 'Heim' },
  { path: '/leit', icon: Search, label: 'Leita' },
  { path: '/skra-hlut', icon: PlusCircle, label: 'Skrá' },
  { path: '/bokanir', icon: Calendar, label: 'Bókanir' },
  { path: '/profill', icon: User, label: 'Prófíll' },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {NAV.map(({ path, icon: Icon, label }) => {
          const active = path === '/' ? pathname === '/' : pathname.startsWith(path);
          return (
            <Link key={path} to={path} className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${active ? 'text-teal-600' : 'text-gray-500'}`}>
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className={active ? 'font-semibold' : ''}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
