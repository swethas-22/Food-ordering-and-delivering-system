import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { DiscoverPage } from './pages/DiscoverPage';
import { RestaurantsPage } from './pages/RestaurantsPage';
import { MenuPage } from './pages/MenuPage';
import { LiveTrackPage } from './pages/LiveTrackPage';
import { ProfilePage } from './pages/ProfilePage';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { CartDrawer } from './components/CartDrawer';
import { ReplaceCartModal } from './components/ReplaceCartModal';
import { AuthModal } from './components/AuthModal';
import { ParceloAiModal } from './components/ParceloAiModal';

export const App = () => {
  const location = useLocation();
  const [aiModalOpen, setAiModalOpen] = useState(false);

  // Scroll to top on route change (SRS 4.1.2)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col theme-bg-primary theme-text-primary selection:bg-amber-400 selection:text-black">
      {/* 2-Row Sticky Luxury Header (FR-9.5) */}
      <Header onOpenAi={() => setAiModalOpen(true)} />

      {/* Main Content Router */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<DiscoverPage />} />
          <Route path="/restaurants" element={<RestaurantsPage />} />
          <Route path="/restaurants/:id" element={<MenuPage />} />
          <Route path="/orders/:id/track" element={<LiveTrackPage />} />
          <Route path="/profile" element={<ProfilePage onOpenAi={() => setAiModalOpen(true)} />} />
          <Route path="*" element={<DiscoverPage />} />
        </Routes>
      </main>

      {/* Floating Bottom AI Concierge Button (FR-8.1, 4.1.2: does not overlap menu bar) */}
      <button
        onClick={() => setAiModalOpen(true)}
        className="fixed bottom-20 md:bottom-8 right-5 md:right-8 z-30 p-3.5 sm:px-5 sm:py-3.5 rounded-full theme-accent-bg text-black font-extrabold shadow-2xl flex items-center gap-2 hover:scale-105 transition-transform cursor-pointer group"
        aria-label="Ask Parcelo AI"
      >
        <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline text-xs font-serif tracking-wider uppercase">
          Parcelo AI
        </span>
      </button>

      {/* Bottom Navigation on screens < 768px (FR-9.6) */}
      <BottomNav onOpenAi={() => setAiModalOpen(true)} />

      {/* Modals & Overlays */}
      <CartDrawer />
      <ReplaceCartModal />
      <AuthModal />
      <ParceloAiModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} />
    </div>
  );
};
