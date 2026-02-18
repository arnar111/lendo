import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useAuth, useConversations, useUsers } from '../store/useStore';

export default function MessagesPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { conversations } = useConversations();
  const { getUser } = useUsers();
  if (!user) return <Navigate to="/innskraning" replace />;

  const my = conversations.filter(c => c.participantIds.includes(user.uid)).sort((a, b) => (b.lastMessageAt || b.createdAt).localeCompare(a.lastMessageAt || a.createdAt));

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-40 px-4 py-3"><div className="max-w-lg mx-auto"><h1 className="font-bold text-lg">Skilaboð</h1></div></header>
      <main className="max-w-lg mx-auto">
        {my.length === 0 ? <div className="text-center py-16"><MessageCircle size={48} className="mx-auto text-gray-300 mb-3" /><h3 className="font-semibold">Engin skilaboð</h3></div> : (
          <div className="divide-y">{my.map(c => {
            const oid = c.participantIds.find(id => id !== user.uid)!;
            const o = getUser(oid);
            const t = c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleString('is-IS', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
            return (
              <button key={c.id} onClick={() => nav('/skilabod/' + c.id)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left">
                <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold shrink-0 overflow-hidden">{o?.photoURL ? <img src={o.photoURL} className="w-full h-full object-cover" /> : (o?.displayName.charAt(0) || '?')}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between"><p className="font-semibold text-sm truncate">{o?.displayName || 'Notandi'}</p><span className="text-xs text-gray-400 shrink-0">{t}</span></div>
                  {c.itemTitle && <p className="text-xs text-teal-600 truncate">{c.itemTitle}</p>}
                  {c.lastMessageText && <p className="text-sm text-gray-500 truncate">{c.lastMessageText}</p>}
                </div>
              </button>
            );
          })}</div>
        )}
      </main>
    </div>
  );
}
