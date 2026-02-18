import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import ItemDetailPage from './pages/ItemDetailPage';
import CreateItemPage from './pages/CreateItemPage';
import MessagesPage from './pages/MessagesPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import MapPage from './pages/MapPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TekjuyfirlitPage from './pages/TekjuyfirlitPage';
import BookingsPage from './pages/BookingsPage';
import FavoritesPage from './pages/FavoritesPage';
import OnboardingPage from './pages/OnboardingPage';

function DesktopSidebar() {
  const { pathname } = useLocation();
  const NAV = [
    { path: '/', icon: '🏠', label: 'Heim' },
    { path: '/leit', icon: '🔍', label: 'Leita' },
    { path: '/skra-hlut', icon: '➕', label: 'Skrá hlut' },
    { path: '/skilabod', icon: '💬', label: 'Skilaboð' },
    { path: '/bokanir', icon: '📅', label: 'Bókanir' },
    { path: '/uppahalds', icon: '❤️', label: 'Uppáhald' },
    { path: '/tekjur', icon: '💰', label: 'Tekjur' },
    { path: '/profill', icon: '👤', label: 'Prófíll' },
  ];
  return (
    <aside className="hidden lg:flex flex-col w-56 bg-white border-r min-h-screen sticky top-0 shrink-0">
      <div className="px-5 py-6">
        <h1 className="text-2xl font-bold text-gradient">Leigja</h1>
        <p className="text-xs text-gray-400 mt-0.5">Leigumarkaður Íslands</p>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {NAV.map(({ path, icon, label }) => {
          const active = path === '/' ? pathname === '/' : pathname.startsWith(path);
          return (
            <Link key={path} to={path} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${active ? 'bg-teal-50 text-teal-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <span className="text-lg">{icon}</span>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function AppShell() {
  const { pathname } = useLocation();
  const hideNav = pathname.startsWith('/innskraning') || pathname.startsWith('/nyskraning') || pathname.startsWith('/skilabod/') || pathname === '/velkomin';
  return (
    <>
      <div className="page-enter flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/leit" element={<SearchPage />} />
          <Route path="/hlutur/:id" element={<ItemDetailPage />} />
          <Route path="/skra-hlut" element={<CreateItemPage />} />
          <Route path="/skilabod" element={<MessagesPage />} />
          <Route path="/skilabod/:conversationId" element={<ChatPage />} />
          <Route path="/profill" element={<ProfilePage />} />
          <Route path="/profill/:uid" element={<ProfilePage />} />
          <Route path="/kort" element={<MapPage />} />
          <Route path="/innskraning" element={<LoginPage />} />
          <Route path="/nyskraning" element={<RegisterPage />} />
          <Route path="/velkomin" element={<OnboardingPage />} />
          <Route path="/tekjur" element={<TekjuyfirlitPage />} />
          <Route path="/bokanir" element={<BookingsPage />} />
          <Route path="/uppahalds" element={<FavoritesPage />} />
        </Routes>
      </div>
      {!hideNav && <BottomNav />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        <DesktopSidebar />
        <AppShell />
      </div>
    </BrowserRouter>
  );
}
