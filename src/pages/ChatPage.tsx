import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { useAuth, useConversations, useUsers } from '../store/useStore';

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const nav = useNavigate();
  const { user } = useAuth();
  const { conversations, getMessages, sendMessage } = useConversations();
  const { getUser } = useUsers();
  const [text, setText] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const conv = conversations.find(c => c.id === conversationId);
  const msgs = conversationId ? getMessages(conversationId) : [];
  const oid = conv?.participantIds.find(id => id !== user?.uid);
  const other = oid ? getUser(oid) : undefined;
  useEffect(() => { ref.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs.length]);
  if (!user || !conv) return null;

  const send = () => { if (!text.trim()) return; sendMessage(conv.id, user.uid, text.trim()); setText(''); };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b sticky top-0 z-40 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => nav('/skilabod')}><ArrowLeft size={20} /></button>
          <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm overflow-hidden shrink-0">{other?.photoURL ? <img src={other.photoURL} className="w-full h-full object-cover" /> : (other?.displayName.charAt(0) || '?')}</div>
          <div><p className="font-semibold text-sm">{other?.displayName || 'Notandi'}</p>{conv.itemTitle && <p className="text-xs text-teal-600">{conv.itemTitle}</p>}</div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
        <div className="space-y-2">
          {msgs.map(m => {
            const mine = m.senderId === user.uid;
            return <div key={m.id} className={'flex ' + (mine ? 'justify-end' : 'justify-start')}>
              <div className={'max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ' + (mine ? 'bg-teal-600 text-white rounded-br-md' : 'bg-white border text-gray-900 rounded-bl-md')}>
                <p>{m.text}</p>
                <p className={'text-[10px] mt-0.5 ' + (mine ? 'text-indigo-200' : 'text-gray-400')}>{new Date(m.createdAt).toLocaleTimeString('is-IS', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>;
          })}
          <div ref={ref} />
        </div>
      </div>
      <div className="bg-white border-t px-4 py-3 sticky bottom-0">
        <div className="max-w-lg mx-auto flex gap-2">
          <input type="text" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Skrifa skilaboð\u2026" className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
          <button onClick={send} disabled={!text.trim()} className="w-10 h-10 bg-teal-600 text-white rounded-full flex items-center justify-center disabled:opacity-40"><Send size={18} /></button>
        </div>
      </div>
    </div>
  );
}
