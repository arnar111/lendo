import { Link, useLocation } from 'react-router-dom';
import { Home, Search, PlusCircle, MessageCircle, User } from 'lucide-react';
import { useConversations, useAuth } from '../store/useStore';

export default function BottomNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { conversations } = useConversations();

  // Count conversations with unread messages (where last sender isn't current user)
  const unreadCount = user
    ? conversations.filter(c => c.lastMessageSenderId && c.lastMessageSenderId !== user.uid && c.lastMessageAt).length
    : 0;

  const NAV = [
    { path: '/', icon: Home, label: 'Heim', badge: 0 },
    { path: '/leit', icon: Search, label: 'Leita', badge: 0 },
    { path: '/skra-hlut', icon: PlusCircle, label: 'Skrá', badge: 0 },
    { path: '/skilabod', icon: MessageCircle, label: 'Skilaboð', badge: unreadCount },
    { path: '/profill', icon: User, label: 'Prófíll', badge: 0 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {NAV.map(({ path, icon: Icon, label, badge }) => {
          const active = path === '/' ? pathname === '/' : pathname.startsWith(path);
          return (
            <Link key={path} to={path} className={`relative flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${active ? 'text-teal-600' : 'text-gray-500'}`}>
              <div className="relative">
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span className={active ? 'font-semibold' : ''}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
