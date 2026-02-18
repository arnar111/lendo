import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../store/useStore';

export default function RegisterPage() {
  const nav = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');

  const go = (e: React.FormEvent) => { e.preventDefault(); if (!name || !email || !pw) { setErr('Fylltu út alla reiti'); return; } register(name, email, pw); nav('/'); };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8"><h1 className="text-3xl font-bold text-teal-600 mb-2">Lendó</h1><p className="text-gray-500">Búðu til aðgang</p></div>
        <form onSubmit={go} className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
          {err && <p className="text-red-500 text-sm">{err}</p>}
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Nafn</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-teal-300 focus:outline-none" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Netfang</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-teal-300 focus:outline-none" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Lykilorð</label>
            <input type="password" value={pw} onChange={e => setPw(e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-teal-300 focus:outline-none" /></div>
          <button type="submit" className="w-full py-3 bg-teal-600 text-white rounded-xl font-semibold text-sm">Nýskrá</button>
          <p className="text-center text-sm text-gray-500">Þegar með aðgang? <Link to="/innskraning" className="text-teal-600 font-medium">Innskrá</Link></p>
        </form>
      </div>
    </div>
  );
}
