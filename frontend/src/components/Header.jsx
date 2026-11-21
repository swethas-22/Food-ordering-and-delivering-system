import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShoppingBag, User, Sparkles, MapPin, ChevronDown, 
  Search, Compass, UtensilsCrossed, Clock, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';

export const Header = ({ onOpenAi, onOpenVoiceSearch }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const { totalItemsCount, openCartDrawer } = useCart();
  const { theme, setTheme, themeNames } = useTheme();

  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const activeAddress = user?.default_address_details?.line?.split(',')[0] || 
    (user?.addresses?.[0]?.line?.split(',')[0]) || 
    'Lavelle Road, Bengaluru';

  return (
    <header className="sticky top-0 z-40 w-full theme-glass border-b theme-border transition-colors duration-300">
      {/* Top Row: Brand, Location, Theme Switcher, Bag, Profile */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo & Wordmark */}
        <div className="flex items-center gap-3">
          <NavLink to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-2xl theme-accent-bg flex items-center justify-center font-serif font-black text-xl shadow-md group-hover:scale-105 transition-transform">
              P
            </div>
            <div className="flex flex-col">
              <span className="font-serif tracking-wider text-xl font-bold uppercase theme-text-primary leading-none">
                Parcelo
              </span>
              <span className="text-[10px] tracking-widest uppercase font-bold theme-accent-text mt-0.5">
                Privé Culinary
              </span>
            </div>
          </NavLink>

          {/* Delivery Location Selector */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl theme-bg-secondary border theme-border text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              <MapPin className="w-3.5 h-3.5 theme-accent-text shrink-0" />
              <span className="max-w-[130px] truncate">{activeAddress}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {locationDropdownOpen && (
              <div 
                className="absolute left-0 mt-2 w-64 rounded-2xl theme-bg-card border theme-border theme-shadow p-3 z-50 animate-in fade-in zoom-in-95"
                onMouseLeave={() => setLocationDropdownOpen(false)}
              >
                <div className="text-[11px] font-bold theme-text-secondary uppercase tracking-wider mb-2">
                  Delivery Destination
                </div>
                {isAuthenticated && user?.addresses?.length > 0 ? (
                  user.addresses.map((addr) => (
                    <button
                      key={addr.id}
                      onClick={() => {
                        setLocationDropdownOpen(false);
                      }}
                      className="w-full text-left p-2 rounded-xl text-xs hover:theme-bg-secondary flex items-start gap-2 mb-1"
                    >
                      <MapPin className="w-3.5 h-3.5 theme-accent-text mt-0.5" />
                      <div>
                        <span className="block font-bold">{addr.label}</span>
                        <span className="text-[11px] opacity-75 line-clamp-1">{addr.line}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-xs theme-text-secondary p-2">
                    {isAuthenticated ? 'No saved addresses yet.' : 'Sign in to select saved addresses.'}
                  </div>
                )}
                <button
                  onClick={() => {
                    setLocationDropdownOpen(false);
                    if (isAuthenticated) {
                      navigate('/profile?tab=addresses');
                    } else {
                      openAuthModal('login');
                    }
                  }}
                  className="w-full mt-2 py-2 text-center text-xs font-bold theme-accent-text hover:underline border-t theme-border pt-2"
                >
                  + Add / Manage Addresses
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Controls: Themes, Bag, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 3-Theme Switcher Pills (FR-9.1, FR-9.3) */}
          <div className="hidden sm:flex items-center p-1 rounded-2xl theme-bg-secondary border theme-border">
            {[
              { id: 'midnight', label: 'Midnight', tip: 'Black & Gold' },
              { id: 'royal', label: 'Royal', tip: 'Sapphire & Ivory' },
              { id: 'velvet', label: 'Velvet', tip: 'Burgundy & Beige' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                title={t.tip}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                  theme === t.id
                    ? 'theme-accent-bg shadow-sm scale-100'
                    : 'theme-text-secondary hover:opacity-80'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Culinary Bag Button */}
          <button
            onClick={() => openCartDrawer('items')}
            className="relative p-2.5 rounded-2xl theme-bg-secondary border theme-border hover:scale-105 transition-transform flex items-center justify-center cursor-pointer"
            aria-label="View Culinary Bag"
          >
            <ShoppingBag className="w-5 h-5 theme-accent-text" />
            {totalItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full theme-accent-bg text-[10px] font-extrabold flex items-center justify-center shadow-md animate-pulse">
                {totalItemsCount}
              </span>
            )}
          </button>

          {/* User Profile / Sign In Button */}
          <div className="relative">
            {isAuthenticated ? (
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl theme-bg-secondary border theme-border hover:opacity-90 transition-opacity"
              >
                <div className="w-7 h-7 rounded-full overflow-hidden bg-neutral-700 border theme-border shrink-0">
                  <img
                    src={user.profile?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                    alt={user.full_name || 'Member'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold leading-none">{user.full_name?.split(' ')[0] || 'Member'}</span>
                  <span className="text-[10px] font-semibold theme-accent-text">Privé Gold</span>
                </div>
                <ChevronDown className="w-3 h-3 opacity-60 hidden md:block" />
              </button>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="px-3.5 py-2 rounded-2xl theme-accent-bg text-xs font-bold flex items-center gap-1.5 shadow-sm hover:scale-[1.02] transition-transform"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Profile Dropdown */}
            {profileDropdownOpen && isAuthenticated && (
              <div 
                className="absolute right-0 mt-2 w-52 rounded-2xl theme-bg-card border theme-border theme-shadow p-2 z-50 animate-in fade-in zoom-in-95"
                onMouseLeave={() => setProfileDropdownOpen(false)}
              >
                <div className="px-3 py-2 border-b theme-border">
                  <p className="text-xs font-bold leading-snug">{user.full_name || user.email}</p>
                  <p className="text-[10px] theme-text-secondary truncate">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    navigate('/profile?tab=orders');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-xl hover:theme-bg-secondary flex items-center gap-2"
                >
                  <Clock className="w-3.5 h-3.5 theme-accent-text" /> Order History
                </button>
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    navigate('/profile?tab=profile');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-xl hover:theme-bg-secondary flex items-center gap-2"
                >
                  <User className="w-3.5 h-3.5 theme-accent-text" /> Profile & Addresses
                </button>
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-xl text-rose-500 hover:theme-bg-secondary border-t theme-border mt-1"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Navigation Pills (FR-9.5) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              isActive
                ? 'theme-accent-bg shadow-sm'
                : 'theme-text-secondary hover:theme-text-primary'
            }`
          }
        >
          Discover
        </NavLink>
        <NavLink
          to="/restaurants"
          className={({ isActive }) =>
            `px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              isActive
                ? 'theme-accent-bg shadow-sm'
                : 'theme-text-secondary hover:theme-text-primary'
            }`
          }
        >
          Restaurants
        </NavLink>
        <NavLink
          to="/restaurants/1"
          className={({ isActive }) =>
            `px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              isActive
                ? 'theme-accent-bg shadow-sm'
                : 'theme-text-secondary hover:theme-text-primary'
            }`
          }
        >
          Menu
        </NavLink>
        <NavLink
          to="/orders/latest/track"
          className={({ isActive }) =>
            `px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              isActive
                ? 'theme-accent-bg shadow-sm'
                : 'theme-text-secondary hover:theme-text-primary'
            }`
          }
        >
          Live Track
        </NavLink>
        <button
          onClick={onOpenAi}
          className="px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 theme-text-secondary hover:theme-text-primary transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 theme-accent-text" />
          <span>Parcelo AI</span>
        </button>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              isActive
                ? 'theme-accent-bg shadow-sm'
                : 'theme-text-secondary hover:theme-text-primary'
            }`
          }
        >
          Orders & Profile
        </NavLink>
      </div>
    </header>
  );
};
