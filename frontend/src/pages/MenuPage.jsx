import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Heart, Share2, Star, Clock, MapPin, Search, 
  Leaf, Sliders, Plus, Minus, ShoppingBag 
} from 'lucide-react';
import { menuService, reviewService } from '../services/parceloServices';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CustomizationModal } from '../components/CustomizationModal';

export const MenuPage = () => {
  const { id = '1' } = useParams();
  const navigate = useNavigate();
  const { cart, totalItemsCount, openCartDrawer, updateItemQty } = useCart();
  const { isAuthenticated, openAuthModal } = useAuth();
  const { showToast } = useToast();

  const [menuData, setMenuData] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [inMenuSearch, setInMenuSearch] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [customizingDish, setCustomizingDish] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMenu();
  }, [id, activeCategory, vegOnly]);

  const loadMenu = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeCategory !== 'All') params.category = activeCategory;
      if (vegOnly) params.veg = true;
      if (inMenuSearch.trim()) params.search = inMenuSearch.trim();

      const res = await menuService.getRestaurantMenu(id, params);
      setMenuData(res.data);
    } catch (err) {
      showToast('Error loading restaurant menu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadMenu();
  };

  const handleFavoriteRestaurant = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      showToast('Please sign in to favourite kitchens.');
      return;
    }
    try {
      const res = await reviewService.toggleFavorite('restaurant', id);
      const newFav = res.data.action !== 'removed';
      setIsFavorite(newFav);
      showToast(newFav ? 'Saved to Favourites' : 'Removed from Favourites');
    } catch (err) {}
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: menuData?.restaurant?.name || 'Parcelo Restaurant',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Kitchen link copied to clipboard!');
    }
  };

  const getDishQtyInCart = (dishId) => {
    return cart.items.filter((i) => i.food_item === dishId).reduce((s, i) => s + i.quantity, 0);
  };

  const restaurant = menuData?.restaurant;
  const categories = ['All', ...(menuData?.categories?.map((c) => c.name) || ['Starters', 'Main Course', 'Desserts', 'Beverages'])];
  const items = menuData?.items || [];

  return (
    <div className="min-w-0 pb-24">
      {/* Restaurant Cover & Info Card (FR-4.1) */}
      {restaurant && (
        <section className="relative h-72 sm:h-96 w-full overflow-hidden bg-neutral-950">
          <img
            src={restaurant.cover}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

          <div className="absolute bottom-6 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-end justify-between gap-4 text-white">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-black/65 text-amber-300 backdrop-blur-md">
                  {restaurant.badge || 'Flagship Kitchen'}
                </span>
                <span className="text-xs opacity-90">{restaurant.cuisines?.join(' • ')}</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl font-bold leading-tight">
                {restaurant.name}
              </h1>
              <p className="text-xs sm:text-sm opacity-80 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 theme-accent-text" /> {restaurant.location}
              </p>
            </div>

            {/* Metrics & Action buttons */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-4 px-4 py-2 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-xs">
                <div>
                  <div className="flex items-center gap-1 font-bold text-amber-300">
                    <Star className="w-3.5 h-3.5 fill-amber-300" /> {restaurant.rating}
                  </div>
                  <span className="text-[10px] opacity-75">{restaurant.review_count}+ reviews</span>
                </div>
                <div className="border-l border-white/20 pl-4">
                  <div className="flex items-center gap-1 font-bold">
                    <Clock className="w-3.5 h-3.5 text-amber-300" /> {restaurant.delivery_time}
                  </div>
                  <span className="text-[10px] opacity-75">{restaurant.delivery_fee} Delivery</span>
                </div>
              </div>

              <button
                onClick={handleFavoriteRestaurant}
                className="w-10 h-10 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center hover:scale-105 cursor-pointer"
                title="Save to Favourites"
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
              </button>

              <button
                onClick={handleShare}
                className="w-10 h-10 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center hover:scale-105 cursor-pointer"
                title="Share Kitchen"
              >
                <Share2 className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Menu Controls: Search, Veg Toggle & Categories (FR-4.2) */}
      <section className="sticky top-16 z-30 theme-glass border-b theme-border py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {categories.map((c) => {
              const isActive = activeCategory === c;
              return (
                <button
                  key={c}
                  onClick={() => setActiveCategory(c)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border cursor-pointer transition-all ${
                    isActive
                      ? 'theme-accent-bg border-transparent shadow-sm'
                      : 'theme-bg-secondary theme-border hover:opacity-85'
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>

          {/* Search in Menu & Veg Only switch */}
          <div className="flex items-center gap-3">
            {/* Pure Veg Switch */}
            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
              <span className="w-3.5 h-3.5 rounded-sm border border-emerald-500 bg-white flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              </span>
              <span>Veg Only</span>
              <input
                type="checkbox"
                checked={vegOnly}
                onChange={(e) => setVegOnly(e.target.checked)}
                className="accent-amber-500 cursor-pointer"
              />
            </label>

            {/* In-Menu Search Box */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 theme-text-secondary" />
              <input
                type="text"
                value={inMenuSearch}
                onChange={(e) => setInMenuSearch(e.target.value)}
                placeholder="Search in menu..."
                className="w-40 sm:w-52 pl-8 pr-3 py-1.5 rounded-xl theme-bg-card border theme-border text-xs focus:outline-none"
              />
            </form>
          </div>
        </div>
      </section>

      {/* Menu Items List - Strictly only items of the open restaurant (FR-4.3, FR-4.4, FR-4.5) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-3xl theme-bg-card animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 rounded-3xl theme-bg-card border theme-border">
            <h4 className="font-serif text-2xl font-bold mb-1">No Dishes Match Selection</h4>
            <p className="text-xs theme-text-secondary">Try turning off Veg Only or selecting another category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((dish) => {
              const qtyInCart = getDishQtyInCart(dish.id);
              return (
                <div
                  key={dish.id}
                  className="rounded-3xl theme-bg-card border theme-border p-4 sm:p-5 flex items-center justify-between gap-4 theme-shadow"
                >
                  {/* Left Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`w-3.5 h-3.5 rounded-sm border ${dish.is_veg ? 'border-emerald-500' : 'border-rose-500'} bg-white flex items-center justify-center shrink-0`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dish.is_veg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                      </span>
                      {dish.tag && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider theme-bg-secondary theme-accent-text">
                          {dish.tag}
                        </span>
                      )}
                      <span className="text-[11px] font-bold text-amber-400 flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-400" /> {dish.rating}
                      </span>
                    </div>

                    <h3
                      onClick={() => setCustomizingDish(dish)}
                      className="font-serif text-xl sm:text-2xl font-bold leading-snug cursor-pointer hover:underline line-clamp-1"
                    >
                      {dish.name}
                    </h3>
                    <p className="text-base font-bold theme-accent-text mt-0.5">₹{dish.price}</p>
                    <p className="text-xs theme-text-secondary mt-1 line-clamp-2 leading-relaxed">
                      {dish.description}
                    </p>
                    <button
                      onClick={() => setCustomizingDish(dish)}
                      className="mt-2 text-[11px] font-semibold theme-accent-text hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sliders className="w-3 h-3" /> Customize Portion & Spice
                    </button>
                  </div>

                  {/* Right Image + ADD / Stepper (FR-4.4) */}
                  <div className="relative w-28 sm:w-32 shrink-0 flex flex-col items-center">
                    <div
                      onClick={() => setCustomizingDish(dish)}
                      className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border theme-border cursor-pointer bg-neutral-900"
                    >
                      <img
                        src={dish.image}
                        alt={dish.name}
                        onError={(e) => {
                          e.target.src = 'https://placehold.co/300x300/1C1C1C/D4AF37?text=Parcelo+Dish';
                        }}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>

                    <div className="-mt-4 z-10">
                      {qtyInCart === 0 ? (
                        <button
                          onClick={() => setCustomizingDish(dish)}
                          className="px-5 py-2 rounded-xl theme-accent-bg text-xs font-extrabold tracking-wider shadow-lg flex items-center gap-1 cursor-pointer hover:scale-105 transition-transform"
                        >
                          ADD <Plus className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 px-2 py-1 rounded-xl theme-accent-bg shadow-lg">
                          <button
                            onClick={() => {
                              const cartItem = cart.items.find((i) => i.food_item === dish.id);
                              if (cartItem) updateItemQty(cartItem.id, -1);
                            }}
                            className="w-6 h-6 rounded-lg bg-black/15 flex items-center justify-center text-xs font-bold cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-extrabold min-w-[14px] text-center">
                            {qtyInCart}
                          </span>
                          <button
                            onClick={() => setCustomizingDish(dish)}
                            className="w-6 h-6 rounded-lg bg-black/15 flex items-center justify-center text-xs font-bold cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Floating Bottom Cart Bar (FR-4.10: "2 Items | ₹450" - Does not overlap AI button) */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-30 animate-in fade-in slide-in-from-bottom-3">
          <div className="flex items-center gap-4 px-6 py-3 rounded-full theme-accent-bg shadow-2xl text-black">
            <div className="flex items-center gap-2 font-serif font-black text-sm">
              <ShoppingBag className="w-4 h-4" />
              <span>
                {totalItemsCount} {totalItemsCount === 1 ? 'Item' : 'Items'} | ₹{cart.bill.subtotal}
              </span>
            </div>
            <button
              onClick={() => openCartDrawer('items')}
              className="px-4 py-1.5 rounded-full bg-black text-white text-xs font-bold hover:scale-105 transition-transform cursor-pointer"
            >
              View Bag →
            </button>
          </div>
        </div>
      )}

      {/* Customization Modal */}
      <CustomizationModal
        dish={customizingDish}
        isOpen={!!customizingDish}
        onClose={() => setCustomizingDish(null)}
      />
    </div>
  );
};
