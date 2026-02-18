import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Award, Flame, Target, ChevronRight, Star, Calendar, DollarSign } from 'lucide-react';
import { useAuth, useItems, useReviews, useBookings } from '../store/useStore';

interface EarningEntry {
  date: string;
  amount: number;
  itemId: string;
  itemTitle: string;
  renterName: string;
  days: number;
}

function generateMockEarnings(itemIds: string[], items: any[]): EarningEntry[] {
  const entries: EarningEntry[] = [];
  const renters = ['Ólafur Þór', 'Kristín Björk', 'Magnús Aron', 'Sigrún Edda', 'Bjarki Már', 'Hanna Lind', 'Einar Borg', 'Þóra Sól'];
  const now = new Date();
  for (let d = 0; d < 90; d++) {
    if (Math.random() > 0.4) continue;
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const item = items[Math.floor(Math.random() * items.length)];
    if (!item) continue;
    const days = Math.ceil(Math.random() * 5);
    entries.push({
      date: date.toISOString().split('T')[0],
      amount: item.pricePerDayISK * days,
      itemId: item.id,
      itemTitle: item.title,
      renterName: renters[Math.floor(Math.random() * renters.length)],
      days,
    });
  }
  return entries.sort((a, b) => b.date.localeCompare(a.date));
}

function AnimatedCounter({ target, duration = 2000, prefix = '', suffix = '' }: { target: number; duration?: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return <span>{prefix}{count.toLocaleString('is-IS')}{suffix}</span>;
}

function MiniBarChart({ data, maxHeight = 80 }: { data: { label: string; value: number }[]; maxHeight?: number }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 h-24">
      {data.map((d, i) => {
        const h = Math.max((d.value / max) * maxHeight, 4);
        const isToday = i === data.length - 1;
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <div
              className={`w-full rounded-t-md transition-all duration-700 ${isToday ? 'bg-teal-500' : 'bg-teal-300'}`}
              style={{ height: `${h}px`, animationDelay: `${i * 80}ms` }}
            />
            <span className="text-[9px] text-gray-400">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function ProgressRing({ progress, size = 100, strokeWidth = 8 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(progress, 1) * circumference);
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#14b8a6" strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        className="transition-all duration-1000 ease-out" />
    </svg>
  );
}

export default function TekjuyfirlitPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { items } = useItems();
  const { getReviewsFor } = useReviews();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setTimeout(() => setLoaded(true), 100); }, []);

  const { bookings } = useBookings();
  const myItems = items.filter(i => i.ownerId === user?.uid);

  // Use real bookings data — fall back to mock generator if no bookings yet
  const earnings = useMemo(() => {
    const ownerBookings = bookings.filter(b => b.ownerId === user?.uid && !['cancelled', 'rejected'].includes(b.status));
    if (ownerBookings.length > 0) {
      return ownerBookings.map(b => ({
        date: b.startDate,
        amount: b.totalISK,
        itemId: b.itemId,
        itemTitle: b.itemTitle,
        renterName: b.renterName,
        days: b.days,
      })).sort((a, b) => b.date.localeCompare(a.date));
    }
    // Fallback to mock data for demo
    return generateMockEarnings(myItems.map(i => i.id), myItems);
  }, [bookings, user?.uid, myItems]);

  const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - periodDays);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const periodEarnings = earnings.filter(e => e.date >= cutoffStr);
  const totalRevenue = periodEarnings.reduce((s, e) => s + e.amount, 0);
  const totalRentals = periodEarnings.length;
  const avgPerRental = totalRentals > 0 ? Math.round(totalRevenue / totalRentals) : 0;

  const prevCutoff = new Date(cutoff);
  prevCutoff.setDate(prevCutoff.getDate() - periodDays);
  const prevCutoffStr = prevCutoff.toISOString().split('T')[0];
  const prevEarnings = earnings.filter(e => e.date >= prevCutoffStr && e.date < cutoffStr);
  const prevTotal = prevEarnings.reduce((s, e) => s + e.amount, 0);
  const growthPct = prevTotal > 0 ? Math.round(((totalRevenue - prevTotal) / prevTotal) * 100) : 100;

  // Weekly chart data
  const chartData = useMemo(() => {
    const weeks: { label: string; value: number }[] = [];
    const numBars = period === '7d' ? 7 : period === '30d' ? 10 : 12;
    const daysPerBar = Math.ceil(periodDays / numBars);
    for (let i = numBars - 1; i >= 0; i--) {
      const from = new Date(); from.setDate(from.getDate() - (i + 1) * daysPerBar);
      const to = new Date(); to.setDate(to.getDate() - i * daysPerBar);
      const fromStr = from.toISOString().split('T')[0];
      const toStr = to.toISOString().split('T')[0];
      const sum = earnings.filter(e => e.date >= fromStr && e.date < toStr).reduce((s, e) => s + e.amount, 0);
      const label = period === '7d' ? ['Mán','Þri','Mið','Fim','Fös','Lau','Sun'][numBars - 1 - i] || '' :
        `${from.getDate()}/${from.getMonth()+1}`;
      weeks.push({ label, value: sum });
    }
    return weeks;
  }, [earnings, period, periodDays]);

  // Item breakdown
  const itemBreakdown = useMemo(() => {
    const map: Record<string, { title: string; total: number; count: number }> = {};
    periodEarnings.forEach(e => {
      if (!map[e.itemId]) map[e.itemId] = { title: e.itemTitle, total: 0, count: 0 };
      map[e.itemId].total += e.amount;
      map[e.itemId].count++;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total).slice(0, 5);
  }, [periodEarnings]);

  // Streak
  const streak = useMemo(() => {
    let s = 0;
    const today = new Date();
    for (let d = 0; d < 60; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      const ds = date.toISOString().split('T')[0];
      if (earnings.some(e => e.date === ds)) s++;
      else break;
    }
    return s;
  }, [earnings]);

  const monthlyGoal = 200000;
  const monthEarnings = earnings.filter(e => {
    const d = new Date(e.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, e) => s + e.amount, 0);
  const goalProgress = monthEarnings / monthlyGoal;

  if (!user) { nav('/innskraning'); return null; }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 text-white">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => nav(-1)} className="w-10 h-10 bg-white/10 backdrop-blur rounded-full flex items-center justify-center"><ArrowLeft size={20} /></button>
            <h1 className="text-lg font-bold">Tekjuyfirlit</h1>
          </div>

          {/* Big number */}
          <div className={`transition-all duration-700 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <p className="text-teal-200 text-sm mb-1">Heildartekjur ({period === '7d' ? '7 dagar' : period === '30d' ? '30 dagar' : '90 dagar'})</p>
            <p className="text-4xl font-black tracking-tight">
              <AnimatedCounter target={totalRevenue} suffix=" kr" />
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className={`inline-flex items-center gap-1 text-sm font-semibold px-2 py-0.5 rounded-full ${growthPct >= 0 ? 'bg-green-400/20 text-green-200' : 'bg-red-400/20 text-red-200'}`}>
                <TrendingUp size={14} className={growthPct < 0 ? 'rotate-180' : ''} />
                {growthPct >= 0 ? '+' : ''}{growthPct}%
              </span>
              <span className="text-teal-200 text-sm">miðað við síðasta tímabil</span>
            </div>
          </div>

          {/* Period selector */}
          <div className="flex gap-2 mt-4">
            {(['7d', '30d', '90d'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${period === p ? 'bg-white text-teal-700' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}>
                {p === '7d' ? '7 dagar' : p === '30d' ? '30 dagar' : '90 dagar'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 -mt-2 space-y-4">
        {/* Quick stats */}
        <div className={`grid grid-cols-3 gap-3 transition-all duration-700 delay-200 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="bg-white rounded-2xl shadow-sm border p-3 text-center">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center mx-auto mb-2"><Calendar size={20} className="text-teal-600" /></div>
            <p className="text-xl font-bold text-gray-900">{totalRentals}</p>
            <p className="text-xs text-gray-500">Leigur</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border p-3 text-center">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-2"><DollarSign size={20} className="text-amber-600" /></div>
            <p className="text-xl font-bold text-gray-900"><AnimatedCounter target={avgPerRental} duration={1200} /></p>
            <p className="text-xs text-gray-500">Meðaltal/leiga</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border p-3 text-center">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-2"><Flame size={20} className="text-orange-500" /></div>
            <p className="text-xl font-bold text-gray-900">{streak}</p>
            <p className="text-xs text-gray-500">Daga streak</p>
          </div>
        </div>

        {/* Revenue chart */}
        <div className={`bg-white rounded-2xl shadow-sm border p-4 transition-all duration-700 delay-300 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <h3 className="font-semibold text-gray-900 mb-3">Tekjuþróun</h3>
          <MiniBarChart data={chartData} />
        </div>

        {/* Monthly goal */}
        <div className={`bg-white rounded-2xl shadow-sm border p-4 transition-all duration-700 delay-400 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="flex items-center gap-4">
            <div className="relative">
              <ProgressRing progress={goalProgress} size={80} strokeWidth={6} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-teal-700">{Math.min(Math.round(goalProgress * 100), 100)}%</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1"><Target size={16} className="text-teal-600" /><h3 className="font-semibold text-gray-900">Mánaðarmarkmið</h3></div>
              <p className="text-sm text-gray-600"><span className="font-bold text-teal-700">{monthEarnings.toLocaleString('is-IS')} kr</span> af {monthlyGoal.toLocaleString('is-IS')} kr</p>
              <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                <div className="bg-gradient-to-r from-teal-400 to-emerald-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${Math.min(goalProgress * 100, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Item breakdown */}
        <div className={`bg-white rounded-2xl shadow-sm border p-4 transition-all duration-700 delay-500 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <h3 className="font-semibold text-gray-900 mb-3">Tekjur eftir hlutum</h3>
          {itemBreakdown.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Engar tekjur á þessu tímabili</p>
          ) : (
            <div className="space-y-3">
              {itemBreakdown.map(([id, data], idx) => {
                const maxTotal = itemBreakdown[0][1].total;
                const pct = (data.total / maxTotal) * 100;
                return (
                  <div key={id} className="group cursor-pointer" onClick={() => nav('/hlutur/' + id)}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-teal-600 bg-teal-50 w-6 h-6 rounded-full flex items-center justify-center">{idx + 1}</span>
                        <span className="text-sm font-medium text-gray-900 group-hover:text-teal-600 transition-colors">{data.title}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-900">{data.total.toLocaleString('is-IS')} kr</span>
                        <span className="text-xs text-gray-400 ml-1">({data.count}x)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-gradient-to-r from-teal-400 to-teal-600 h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent earnings */}
        <div className={`bg-white rounded-2xl shadow-sm border p-4 transition-all duration-700 delay-[600ms] ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <h3 className="font-semibold text-gray-900 mb-3">Nýlegar leigur</h3>
          <div className="space-y-2">
            {periodEarnings.slice(0, 8).map((e, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                  <TrendingUp size={16} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{e.itemTitle}</p>
                  <p className="text-xs text-gray-400">{e.renterName} · {e.days} {e.days === 1 ? 'dagur' : 'dagar'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-green-600">+{e.amount.toLocaleString('is-IS')} kr</p>
                  <p className="text-[10px] text-gray-400">{new Date(e.date).toLocaleDateString('is-IS', { day: 'numeric', month: 'short' })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className={`bg-white rounded-2xl shadow-sm border p-4 transition-all duration-700 delay-700 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <h3 className="font-semibold text-gray-900 mb-3">Afrek</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '🏆', title: 'Fyrsta leigan', desc: 'Fyrsta leigan kláruð', done: true },
              { icon: '🔥', title: '7 daga streak', desc: 'Leiga 7 daga í röð', done: streak >= 7 },
              { icon: '💰', title: '100.000 kr', desc: 'Heildar tekjur yfir 100k', done: totalRevenue >= 100000 },
              { icon: '⭐', title: 'Superhost', desc: '4.8+ einkunn', done: myItems.some(i => i.ratingAvg >= 4.8) },
            ].map((a, i) => (
              <div key={i} className={`rounded-xl p-3 border transition-all ${a.done ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200' : 'bg-gray-50 border-gray-200 opacity-50'}`}>
                <span className="text-2xl">{a.icon}</span>
                <p className="text-sm font-semibold mt-1">{a.title}</p>
                <p className="text-xs text-gray-500">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
