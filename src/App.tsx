import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
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

function AppShell() {
  const { pathname } = useLocation();
  const hideNav = pathname.startsWith('/innskraning') || pathname.startsWith('/nyskraning') || pathname.startsWith('/skilabod/');
  return (
    <>
      <div className="page-enter">
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
      <AppShell />
    </BrowserRouter>
  );
}
