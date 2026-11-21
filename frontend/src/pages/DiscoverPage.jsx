import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Mic, X, Tag, Sparkles, ArrowRight, 
  Flame, Crown, Utensils, Star, Clock 
} from 'lucide-react';
import { restaurantService, menuService, reviewService } from '../services/parceloServices';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { RestaurantCard } from '../components/RestaurantCard';
import { DishCard } from '../components/DishCard';
import { CustomizationModal } from '../components/CustomizationModal';
import { VoiceSearchModal } from '../components/VoiceSearchModal';

export const DiscoverPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const { applyCoupon, openCartDrawer } = useCart();
  const { showToast } = useToast();

  const [cuisines, setCuisines] = useState([]);
  const [popularRestaurants, setPopularRestaurants] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [offers, setOffers] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [searchHistoryOpen, setSearchHistoryOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [dishTab, setDishTab] = useState('all'); // 'all', 'trending', 'special'
  const [selectedDishForCustomization, setSelectedDishForCustomization] = useState(null);
  const [voiceSearchOpen, setVoiceSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, [dishTab]);

  const loadHomeData = async () => {
    try {
      const results = await Promise.allSettled([
        restaurantService.getCuisines(),
        restaurantService.getRestaurants({ ordering: 'popularity' }),
        restaurantService.getOffers(),
      ]);

      if (results[0].status === 'fulfilled') setCuisines(results[0].value.data || []);
      if (results[1].status === 'fulfilled') setPopularRestaurants((results[1].value.data || []).slice(0, 3));
      if (results[2].status === 'fulfilled') setOffers(results[2].value.data || []);

      const params = {};
      if (dishTab === 'trending') params.trending = true;
      if (dishTab === 'special') params.chef_special = true;

      try {
        const dRes = await menuService.getFoodItems(params);
        setDishes(dRes.data || []);
      } catch (err) {
        console.error('Error fetching food items:', err);
      }

      if (isAuthenticated) {
        reviewService.getRecentSearches().then((res) => {
          setRecentSearches(res.data.map((s) => s.term));
        }).catch(() => {});
      } else {
        setRecentSearches(['Hyderabadi Biryani', 'Truffle Risotto', 'Omakase Sushi', 'Lebanese Mezze']);
      }
    } catch (err) {
      console.error('Error loading discovery highlights:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    const term = searchTerm.trim();
    if (isAuthenticated) {
      reviewService.addRecentSearch(term).catch(() => {});
    }
    setRecentSearches((prev) => [term, ...prev.filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, 6));
    setSearchHistoryOpen(false);
  };

  const handleApplyRecentSearch = (term) => {
    setSearchTerm(term);
    setSearchHistoryOpen(false);
  };

  const handleClearHistory = async () => {
    if (isAuthenticated) {
      reviewService.clearRecentSearches().catch(() => {});
    }
    setRecentSearches([]);
    showToast('Recent search history cleared.');
  };

  const handleApplyOfferCode = (code) => {
    applyCoupon(code);
    openCartDrawer('items');
  };

  // Filter dishes by in-page search
  const filteredDishes = dishes.filter((d) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      d.cuisine?.toLowerCase().includes(q)
    );
  });

  const firstName = user?.full_name?.split(' ')[0] || 'Gourmand';

  return (
    <div className="min-w-0 pb-16 space-y-10 sm:space-y-12">
      {/* Hero Greeting & Search Bar (FR-2.1, FR-2.3, FR-2.4) */}
      <section className="relative pt-6 sm:pt-10">
        <div className="max-w-4xl mx-auto text-center px-4 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full theme-bg-secondary border theme-border text-xs font-bold theme-accent-text tracking-wider uppercase">
            <Crown className="w-3.5 h-3.5" /> Haute Gastronomie Delivered
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            Good Evening, <span className="italic font-normal">{firstName}</span>
          </h1>
          <p className="text-xs sm:text-sm theme-text-secondary max-w-xl mx-auto leading-relaxed">
            Curated Michelin-inspired kitchens, bespoke spice customisation, and AI-assisted culinary concierge.
          </p>

          {/* Luxury Search Bar */}
          <div className="relative max-w-2xl mx-auto mt-6">
            <form
              onSubmit={handleSearchSubmit}
              className="relative flex items-center rounded-2xl theme-bg-card border theme-border theme-shadow p-1.5"
            >
              <Search className="w-5 h-5 theme-accent-text ml-3 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onFocus={() => setSearchHistoryOpen(true)}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search dishes, signature spices, or kitchens..."
                className="w-full px-3 py-2.5 bg-transparent text-xs sm:text-sm focus:outline-none placeholder:opacity-60"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="p-1.5 rounded-full hover:theme-bg-secondary mr-1 cursor-pointer"
                >
                  <X className="w-4 h-4 text-neutral-400" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setVoiceSearchOpen(true)}
                className="p-2.5 rounded-xl theme-bg-secondary border theme-border hover:theme-accent-bg transition-colors cursor-pointer"
                title="Voice Search"
              >
                <Mic className="w-4 h-4 theme-accent-text" />
              </button>
            </form>

            {/* Recent Searches Panel (FR-2.4) */}
            {searchHistoryOpen && recentSearches.length > 0 && (
              <div 
                className="absolute left-0 right-0 mt-2 p-4 rounded-2xl theme-bg-card border theme-border theme-shadow z-30 text-left animate-in fade-in zoom-in-95"
                onMouseLeave={() => setSearchHistoryOpen(false)}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-2.5">
                  <span className="theme-text-secondary uppercase tracking-wider text-[10px]">
                    Recent Searches
                  </span>
                  <button
                    onClick={handleClearHistory}
                    className="text-[11px] theme-accent-text hover:underline cursor-pointer"
                  >
                    Clear History
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleApplyRecentSearch(term)}
                      className="px-3 py-1.5 rounded-xl theme-bg-secondary border theme-border text-xs font-semibold hover:theme-accent-bg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Search className="w-3 h-3 theme-accent-text" /> {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Promotional Banners Carousel (FR-2.7) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 border theme-border theme-shadow flex flex-col justify-between bg-gradient-to-r from-amber-950/40 via-neutral-900 to-black">
            <div className="space-y-2">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-widest theme-accent-bg">
                Privé Exclusive
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold">20% Off Culinary Deliveries</h3>
              <p className="text-xs theme-text-secondary max-w-sm">
                Experience bespoke fine dining from Bangalore's premier kitchens with code <strong className="theme-accent-text font-mono">PARCELO20</strong>.
              </p>
            </div>
            <div className="pt-4 flex items-center gap-3">
              <button
                onClick={() => handleApplyOfferCode('PARCELO20')}
                className="px-4 py-2 rounded-xl theme-accent-bg text-xs font-extrabold flex items-center gap-1.5 shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                <Tag className="w-3.5 h-3.5" /> Apply Code
              </button>
              <button
                onClick={() => navigate('/restaurants')}
                className="text-xs font-bold theme-accent-text hover:underline"
              >
                Explore Menus →
              </button>
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 border theme-border theme-shadow flex flex-col justify-between bg-gradient-to-r from-rose-950/40 via-neutral-900 to-black">
            <div className="space-y-2">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-widest bg-rose-500 text-white">
                Chef's Table
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold">₹150 Flat Off Royal Feasts</h3>
              <p className="text-xs theme-text-secondary max-w-sm">
                Order gourmet selections above ₹500 and enjoy an instant ₹150 discount with code <strong className="theme-accent-text font-mono">FEAST150</strong>.
              </p>
            </div>
            <div className="pt-4 flex items-center gap-3">
              <button
                onClick={() => handleApplyOfferCode('FEAST150')}
                className="px-4 py-2 rounded-xl theme-accent-bg text-xs font-extrabold flex items-center gap-1.5 shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                <Tag className="w-3.5 h-3.5" /> Apply Code
              </button>
              <button
                onClick={() => navigate('/restaurants')}
                className="text-xs font-bold theme-accent-text hover:underline"
              >
                View Kitchens →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 9 Cuisines Strip (FR-2.6: including Thai!) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold">Signature Cuisines</h2>
            <p className="text-xs theme-text-secondary mt-0.5">Filter premier kitchens by culinary heritage</p>
          </div>
          <button
            onClick={() => navigate('/restaurants')}
            className="text-xs font-bold theme-accent-text hover:underline flex items-center gap-1"
          >
            All Kitchens <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-2">
          {cuisines.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`/restaurants?cuisine=${encodeURIComponent(c.name)}`)}
              className="group shrink-0 w-28 sm:w-32 rounded-2xl theme-bg-card border theme-border p-2.5 text-center hover:scale-[1.03] transition-transform cursor-pointer"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden mx-auto mb-2 border-2 theme-border bg-neutral-900">
                <img
                  src={c.image}
                  alt={c.name}
                  onError={(e) => {
                    e.target.src = `https://placehold.co/200x200/1C1C1C/D4AF37?text=${c.name}`;
                  }}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                />
              </div>
              <span className="text-xs font-bold block truncate">{c.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Popular Flagship Restaurants (FR-2.1) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold">Featured Flagship Kitchens</h2>
            <p className="text-xs theme-text-secondary mt-0.5">Top-rated dining institutions in Bengaluru</p>
          </div>
          <button
            onClick={() => navigate('/restaurants')}
            className="text-xs font-bold theme-accent-text hover:underline flex items-center gap-1"
          >
            View All ({popularRestaurants.length}+) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {popularRestaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      </section>

      {/* Recommended Dishes & Trending Section (FR-2.8) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold">Bespoke Culinary Recommendations</h2>
            <p className="text-xs theme-text-secondary mt-0.5">Slow-simmered dum handis, black truffle risottos, and omakase rolls</p>
          </div>

          {/* 3 Tabs (FR-2.8: All Picks, Trending, Chef Specials) */}
          <div className="flex p-1 rounded-2xl theme-bg-secondary border theme-border self-start sm:self-auto">
            {[
              { id: 'all', label: 'All Picks' },
              { id: 'trending', label: 'Trending Now' },
              { id: 'special', label: "Chef's Specials" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setDishTab(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  dishTab === t.id
                    ? 'theme-accent-bg shadow-sm'
                    : 'theme-text-secondary hover:opacity-80'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dishes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredDishes.map((dish) => (
            <DishCard
              key={dish.id}
              dish={dish}
              onCustomize={(d) => setSelectedDishForCustomization(d)}
            />
          ))}
        </div>
      </section>

      {/* Active Offers Section (FR-2.9) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 theme-accent-text" />
          <h2 className="font-serif text-2xl font-bold">Privé Complimentary Privileges</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {offers.map((coupon) => (
            <div
              key={coupon.id}
              className="p-5 rounded-3xl theme-bg-card border theme-border theme-shadow flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded-lg theme-accent-bg">
                    {coupon.code}
                  </span>
                  <span className="text-[10px] theme-text-secondary uppercase font-bold">Active</span>
                </div>
                <h4 className="font-serif text-lg font-bold pt-1">{coupon.title}</h4>
                <p className="text-xs theme-text-secondary leading-relaxed">{coupon.description}</p>
              </div>

              <div className="pt-3 border-t theme-border flex items-center justify-between text-xs">
                <span className="text-[11px] theme-text-secondary">{coupon.conditions}</span>
                <button
                  onClick={() => handleApplyOfferCode(coupon.code)}
                  className="px-3 py-1.5 rounded-xl theme-bg-secondary border theme-border font-bold hover:theme-accent-bg transition-colors cursor-pointer"
                >
                  Apply Code
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Customization Modal */}
      <CustomizationModal
        dish={selectedDishForCustomization}
        isOpen={!!selectedDishForCustomization}
        onClose={() => setSelectedDishForCustomization(null)}
      />

      {/* Voice Search Modal (FR-2.5) */}
      <VoiceSearchModal
        isOpen={voiceSearchOpen}
        onClose={() => setVoiceSearchOpen(false)}
        onSelectTerm={(term) => {
          setSearchTerm(term);
          handleSearchSubmit({ preventDefault: () => {} });
        }}
      />
    </div>
  );
};
