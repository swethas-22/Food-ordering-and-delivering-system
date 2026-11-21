import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Clock, User, Heart, Settings, RotateCcw, Star, 
  MapPin, Plus, Trash2, Edit2, Shield, Bell, HelpCircle, 
  Sparkles, LogOut, CheckCircle2 
} from 'lucide-react';
import { authService, orderService, reviewService } from '../services/parceloServices';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { ReviewModal } from '../components/ReviewModal';

export const ProfilePage = ({ onOpenAi }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, openAuthModal, logout, refreshProfile } = useAuth();
  const { openCartDrawer, fetchCart } = useCart();
  const { theme, setTheme, themeNames } = useTheme();
  const { showToast } = useToast();

  const activeTab = searchParams.get('tab') || 'orders';

  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [preferences, setPreferences] = useState({
    theme: 'midnight',
    notify_orders: true,
    notify_offers: true,
    dietary_preference: 'all',
  });

  // Edit Profile form state (FR-1.8)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dietaryPref, setDietaryPref] = useState('all');
  const [savingProfile, setSavingProfile] = useState(false);

  // Add Address modal / inline form state (FR-1.9)
  const [newAddrLabel, setNewAddrLabel] = useState('Home');
  const [newAddrLine, setNewAddrLine] = useState('');
  const [newAddrCity, setNewAddrCity] = useState('Bengaluru');
  const [newAddrPincode, setNewAddrPincode] = useState('560034');
  const [isDefaultAddr, setIsDefaultAddr] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  // Review modal state
  const [reviewOrder, setReviewOrder] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    loadData();
  }, [isAuthenticated, activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'orders') {
        const res = await orderService.getOrders();
        setOrders(res.data);
      } else if (activeTab === 'profile') {
        const [aRes, pRes] = await Promise.all([
          authService.getAddresses(),
          authService.getProfile(),
        ]);
        setAddresses(aRes.data);
        setFullName(pRes.data.full_name || '');
        setEmail(pRes.data.email || '');
        setPhone(pRes.data.phone || '');
        setDietaryPref(pRes.data.profile?.dietary_preference || 'all');
      } else if (activeTab === 'favorites') {
        const res = await reviewService.getFavorites();
        setFavorites(res.data);
      } else if (activeTab === 'settings') {
        const res = await authService.getPreferences();
        setPreferences(res.data);
      }
    } catch (err) {}
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await authService.updateProfile({
        full_name: fullName,
        email,
        phone,
        dietary_preference: dietaryPref,
      });
      await refreshProfile();
      showToast('Profile and dietary preferences updated.');
    } catch (err) {
      showToast(err.response?.data?.email || 'Error updating profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!newAddrLine.trim()) return;
    try {
      await authService.addAddress({
        label: newAddrLabel,
        line: newAddrLine.trim(),
        city: newAddrCity,
        pincode: newAddrPincode,
        is_default: isDefaultAddr,
      });
      setIsAddingAddress(false);
      setNewAddrLine('');
      loadData();
      refreshProfile();
      showToast('New address saved.');
    } catch (err) {
      showToast('Error saving address.');
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      await authService.deleteAddress(id);
      loadData();
      refreshProfile();
      showToast('Address removed.');
    } catch (err) {}
  };

  const handleReorder = async (orderId) => {
    try {
      const res = await orderService.reorder(orderId);
      await fetchCart();
      openCartDrawer('items');
      showToast('Items added to your bag at current prices!');
    } catch (err) {
      showToast('Error reordering items.');
    }
  };

  const handleTogglePreference = async (key, val) => {
    const updated = { ...preferences, [key]: val };
    setPreferences(updated);
    try {
      await authService.updatePreferences({ [key]: val });
      showToast('Preferences updated.');
    } catch (err) {}
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <User className="w-16 h-16 theme-accent-text mx-auto opacity-70" />
        <h3 className="font-serif text-3xl font-bold">Sign In Required</h3>
        <p className="text-xs theme-text-secondary">
          Please sign in to view your orders, saved addresses, and privileges.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-2.5 rounded-2xl theme-accent-bg text-xs font-bold shadow-md"
        >
          Sign In to Privé
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl theme-bg-card border theme-border theme-shadow flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 theme-border shadow-lg shrink-0">
            <img
              src={user.profile?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
              alt={user.full_name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="font-serif text-3xl font-bold">{user.full_name || 'Privé Member'}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold theme-accent-bg">
                Gold
              </span>
            </div>
            <p className="text-xs theme-text-secondary mt-0.5">{user.email}</p>
            <span className="text-[11px] theme-accent-text font-semibold">
              Dietary Preference: {user.profile?.dietary_preference === 'veg' ? 'Pure Vegetarian' : 'All Cuisines'}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 rounded-2xl theme-bg-secondary border theme-border text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </div>

      {/* 4 Tabs Header (FR-7.1) */}
      <div className="flex p-1 rounded-2xl theme-bg-secondary border theme-border overflow-x-auto no-scrollbar">
        {[
          { id: 'orders', label: 'Order History & Reorder', icon: Clock },
          { id: 'profile', label: 'Edit Profile & Addresses', icon: User },
          { id: 'favorites', label: 'Saved Favourites', icon: Heart },
          { id: 'settings', label: 'Settings & Privileges', icon: Settings },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSearchParams({ tab: t.id })}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? 'theme-accent-bg shadow-sm'
                  : 'theme-text-secondary hover:theme-text-primary'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ORDER HISTORY & REORDER (FR-7.2, FR-7.3, FR-7.4) */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-16 rounded-3xl theme-bg-card border theme-border">
              <Clock className="w-12 h-12 theme-accent-text mx-auto opacity-70 mb-2" />
              <h4 className="font-serif text-2xl font-bold">No Past Orders</h4>
              <p className="text-xs theme-text-secondary">Your completed culinary orders will appear here.</p>
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                className="rounded-3xl theme-bg-card border theme-border p-5 sm:p-6 theme-shadow space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b theme-border">
                  <div>
                    <span className="text-[11px] font-mono font-bold theme-accent-text uppercase tracking-wider">
                      {ord.order_number} • {ord.date_display}
                    </span>
                    <h3 className="font-serif text-2xl font-bold">{ord.restaurant_name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      ord.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400' : 'theme-accent-bg'
                    }`}>
                      {ord.status_display}
                    </span>
                    <button
                      onClick={() => navigate(`/orders/${ord.id}/track`)}
                      className="text-xs font-bold theme-accent-text hover:underline"
                    >
                      View Live Telemetry →
                    </button>
                  </div>
                </div>

                {/* Items breakdown */}
                <div className="space-y-2 text-xs">
                  {ord.items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-start">
                      <div>
                        <span className="font-bold">{item.quantity}× {item.name}</span>
                        {item.options_summary && (
                          <span className="block text-[11px] theme-text-secondary">{item.options_summary}</span>
                        )}
                      </div>
                      <span className="font-semibold">₹{item.line_total}</span>
                    </div>
                  ))}
                </div>

                {/* Total & 3-Click Reorder & Review Buttons (FR-7.3, FR-7.4) */}
                <div className="pt-3 border-t theme-border flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-bold">
                    Total Paid: <span className="theme-accent-text font-serif text-base font-black">₹{ord.total}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    {ord.status === 'delivered' && (
                      <button
                        onClick={() => setReviewOrder(ord)}
                        className="px-3.5 py-2 rounded-xl theme-bg-secondary border theme-border text-xs font-bold hover:opacity-85 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>{ord.user_review ? `Rated ${ord.user_review.rating}★` : 'Rate & Review'}</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleReorder(ord.id)}
                      className="px-4 py-2 rounded-xl theme-accent-bg text-xs font-bold flex items-center gap-1.5 shadow-md hover:scale-105 transition-transform cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reorder
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: EDIT PROFILE & SAVED ADDRESSES (FR-1.8, FR-1.9) */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Details Form */}
          <div className="p-6 rounded-3xl theme-bg-card border theme-border theme-shadow space-y-4">
            <h3 className="font-serif text-2xl font-bold">Personal Details</h3>
            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl theme-bg-secondary border theme-border text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl theme-bg-secondary border theme-border text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl theme-bg-secondary border theme-border text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Dietary Preference</label>
                <select
                  value={dietaryPref}
                  onChange={(e) => setDietaryPref(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl theme-bg-secondary border theme-border text-xs font-bold focus:outline-none"
                >
                  <option value="all">All Cuisines</option>
                  <option value="veg">Pure Vegetarian</option>
                  <option value="egg">Eggetarian</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full py-2.5 rounded-2xl theme-accent-bg text-xs font-bold shadow-md hover:scale-[1.01] transition-transform cursor-pointer"
              >
                {savingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>

          {/* Saved Addresses (FR-1.9) */}
          <div className="p-6 rounded-3xl theme-bg-card border theme-border theme-shadow space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-2xl font-bold">Saved Addresses</h3>
              <button
                onClick={() => setIsAddingAddress(!isAddingAddress)}
                className="px-3 py-1.5 rounded-xl theme-accent-bg text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Address
              </button>
            </div>

            {/* Add Address Form */}
            {isAddingAddress && (
              <form onSubmit={handleAddAddress} className="p-4 rounded-2xl theme-bg-secondary border theme-border space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={newAddrLabel}
                    onChange={(e) => setNewAddrLabel(e.target.value)}
                    placeholder="Label (e.g. Home, Work, Villa)"
                    className="px-3 py-2 rounded-xl theme-bg-card border theme-border text-xs focus:outline-none"
                  />
                  <input
                    type="text"
                    required
                    value={newAddrPincode}
                    onChange={(e) => setNewAddrPincode(e.target.value)}
                    placeholder="Pincode (e.g. 560034)"
                    className="px-3 py-2 rounded-xl theme-bg-card border theme-border text-xs focus:outline-none"
                  />
                </div>
                <textarea
                  rows={2}
                  required
                  value={newAddrLine}
                  onChange={(e) => setNewAddrLine(e.target.value)}
                  placeholder="Address Line (Building, Street, Landmark)..."
                  className="w-full px-3 py-2 rounded-xl theme-bg-card border theme-border text-xs focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl theme-accent-bg text-xs font-bold shadow-sm"
                >
                  Save Address
                </button>
              </form>
            )}

            {/* Address List */}
            <div className="space-y-2.5">
              {addresses.map((a) => (
                <div
                  key={a.id}
                  className="p-4 rounded-2xl theme-bg-secondary border theme-border flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold theme-accent-text flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {a.label} {a.is_default && '(Default)'}
                    </span>
                    <p className="text-xs theme-text-secondary">{a.line}, {a.city} {a.pincode}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteAddress(a.id)}
                    className="text-neutral-400 hover:text-rose-500 cursor-pointer p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SAVED FAVOURITES (RESTAURANTS & DISHES) (FR-7.7, Appendix A #23) */}
      {activeTab === 'favorites' && (
        <div className="space-y-4">
          {favorites.length === 0 ? (
            <div className="text-center py-16 rounded-3xl theme-bg-card border theme-border">
              <Heart className="w-12 h-12 theme-accent-text mx-auto opacity-70 mb-2" />
              <h4 className="font-serif text-2xl font-bold">No Favourites Saved Yet</h4>
              <p className="text-xs theme-text-secondary">Save your favourite kitchens and dishes with the heart icon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favorites.map((fav) => {
                const isRest = fav.type === 'restaurant';
                const data = isRest ? fav.restaurant_details : fav.dish_details;
                if (!data) return null;

                return (
                  <div
                    key={fav.id}
                    onClick={() => {
                      if (isRest) navigate(`/restaurants/${data.id}`);
                      else navigate(`/restaurants/${data.restaurant_id}`);
                    }}
                    className="p-4 rounded-3xl theme-bg-card border theme-border theme-shadow flex items-center gap-3 cursor-pointer hover:scale-[1.02] transition-transform"
                  >
                    <img
                      src={data.image}
                      alt={data.name}
                      className="w-16 h-16 rounded-2xl object-cover shrink-0 bg-neutral-800"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider theme-accent-text">
                        {isRest ? 'Flagship Kitchen' : `Dish • ${data.restaurant_name}`}
                      </span>
                      <h4 className="text-sm font-bold truncate leading-snug">{data.name}</h4>
                      <p className="text-xs theme-text-secondary">
                        {isRest ? data.cuisines?.join(' • ') : `₹${data.price}`} • {data.rating} ★
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SETTINGS & PRIVILEGES (FR-7.8, FR-7.9) */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Visual Palette Selection (FR-9.1, FR-9.3) */}
          <div className="p-6 rounded-3xl theme-bg-card border theme-border theme-shadow space-y-4">
            <h3 className="font-serif text-2xl font-bold">Visual Palette</h3>
            <p className="text-xs theme-text-secondary">
              Select one of our three bespoke luxury palettes. Persists across all screens.
            </p>
            <div className="space-y-2.5">
              {[
                { id: 'midnight', name: 'Midnight Luxe', colors: 'Black & Gold (#0F0F0F / #D4AF37)' },
                { id: 'royal', name: 'Royal Coastal', colors: 'Sapphire & Ivory (#102542 / #FFFFF0)' },
                { id: 'velvet', name: 'Velvet Heritage', colors: 'Burgundy & Beige (#F5F5DC / #4A0E17)' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`w-full p-3.5 rounded-2xl text-left border cursor-pointer transition-all ${
                    theme === t.id
                      ? 'theme-accent-bg border-transparent shadow-sm'
                      : 'theme-bg-secondary theme-border hover:opacity-85'
                  }`}
                >
                  <span className="font-serif font-bold text-sm block">{t.name}</span>
                  <span className="text-[11px] opacity-80 mt-0.5 block">{t.colors}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notifications & Help (FR-7.8, FR-7.9) */}
          <div className="p-6 rounded-3xl theme-bg-card border theme-border theme-shadow space-y-5">
            <div>
              <h3 className="font-serif text-2xl font-bold mb-3">Privé Notifications</h3>
              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3 rounded-2xl theme-bg-secondary border theme-border cursor-pointer">
                  <span>SMS & Push Order Status Updates</span>
                  <input
                    type="checkbox"
                    checked={preferences.notify_orders}
                    onChange={(e) => handleTogglePreference('notify_orders', e.target.checked)}
                    className="accent-amber-500 cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between p-3 rounded-2xl theme-bg-secondary border theme-border cursor-pointer">
                  <span>Privé Chef Seasonal Invitations & Offers</span>
                  <input
                    type="checkbox"
                    checked={preferences.notify_offers}
                    onChange={(e) => handleTogglePreference('notify_offers', e.target.checked)}
                    className="accent-amber-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Saved Payment Preferences Display (FR-7.8, NFR-S8) */}
            <div className="pt-2 border-t theme-border">
              <span className="text-xs font-bold uppercase tracking-wider block mb-2">
                Saved Payment Methods
              </span>
              <div className="p-3 rounded-2xl theme-bg-secondary border theme-border text-xs flex justify-between items-center">
                <span>Primary: UPI Handle (••••@okhdfcbank)</span>
                <span className="font-bold theme-accent-text">Default</span>
              </div>
            </div>

            {/* Help & AI Concierge */}
            <div className="pt-2 border-t theme-border flex items-center justify-between text-xs">
              <div>
                <span className="font-bold block">Need Culinary Guidance?</span>
                <span className="theme-text-secondary text-[11px]">Chat with our AI concierge 24/7</span>
              </div>
              <button
                onClick={onOpenAi}
                className="px-3 py-1.5 rounded-xl theme-accent-bg font-bold flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" /> Launch AI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rate & Review Modal */}
      <ReviewModal
        order={reviewOrder}
        isOpen={!!reviewOrder}
        onClose={() => setReviewOrder(null)}
        onReviewSubmitted={() => loadData()}
      />
    </div>
  );
};
