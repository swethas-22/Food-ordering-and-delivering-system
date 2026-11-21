import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Star, Leaf, RefreshCw, X } from 'lucide-react';
import { restaurantService } from '../services/parceloServices';
import { RestaurantCard } from '../components/RestaurantCard';
import { useToast } from '../context/ToastContext';

export const RestaurantsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  const [restaurants, setRestaurants] = useState([]);
  const [cuisines, setCuisines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Read state from URL query params (FR-3.5)
  const searchQuery = searchParams.get('search') || '';
  const selectedCuisine = searchParams.get('cuisine') || 'All';
  const vegOnly = searchParams.get('veg_only') === 'true';
  const minRating = searchParams.get('min_rating') === '4.7';
  const priceTier = searchParams.get('price_tier') || 'all';
  const sortBy = searchParams.get('ordering') || 'rating';

  useEffect(() => {
    restaurantService.getCuisines().then((res) => setCuisines(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    loadRestaurants();
  }, [searchParams]);

  const loadRestaurants = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedCuisine && selectedCuisine !== 'All') params.cuisine = selectedCuisine;
      if (vegOnly) params.veg_only = true;
      if (minRating) params.min_rating = 4.7;
      if (priceTier && priceTier !== 'all') params.price_tier = priceTier;
      if (sortBy) params.ordering = sortBy;

      const res = await restaurantService.getRestaurants(params);
      setRestaurants(res.data);
    } catch (err) {
      showToast('Error loading restaurants.');
    } finally {
      setLoading(false);
    }
  };

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all' || value === 'All' || value === false) {
      next.delete(key);
    } else {
      next.set(key, value.toString());
    }
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Title & In-Page Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider theme-accent-text block mb-1">
            Haute Culinary Directory
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold">Discover Fine Dining Kitchens</h1>
        </div>

        {/* Search input (FR-3.2) */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 theme-accent-text" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => updateParam('search', e.target.value)}
            placeholder="Search kitchen or cuisine..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl theme-bg-card border theme-border text-xs focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => updateParam('search', '')}
              className="absolute right-3 top-2.5 text-neutral-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar (FR-3.3, FR-3.4) */}
      <div className="p-4 rounded-3xl theme-bg-card border theme-border theme-shadow flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Pure Veg Pill */}
          <button
            onClick={() => updateParam('veg_only', !vegOnly)}
            className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              vegOnly
                ? 'theme-accent-bg border-transparent shadow-sm'
                : 'theme-bg-secondary theme-border hover:opacity-80'
            }`}
          >
            <Leaf className={`w-3.5 h-3.5 ${vegOnly ? 'text-black' : 'text-emerald-500'}`} />
            <span>Pure Veg</span>
          </button>

          {/* 4.7+ Rating Pill */}
          <button
            onClick={() => updateParam('min_rating', minRating ? '' : '4.7')}
            className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              minRating
                ? 'theme-accent-bg border-transparent shadow-sm'
                : 'theme-bg-secondary theme-border hover:opacity-80'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${minRating ? 'fill-black' : 'fill-amber-400 text-amber-400'}`} />
            <span>Rating 4.7+</span>
          </button>

          {/* Cuisine Dropdown */}
          <select
            value={selectedCuisine}
            onChange={(e) => updateParam('cuisine', e.target.value)}
            className="px-3 py-1.5 rounded-xl theme-bg-secondary border theme-border font-bold focus:outline-none cursor-pointer"
          >
            <option value="All">All Cuisines</option>
            {cuisines.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Price Tier Dropdown (FR-3.3) */}
          <select
            value={priceTier}
            onChange={(e) => updateParam('price_tier', e.target.value)}
            className="px-3 py-1.5 rounded-xl theme-bg-secondary border theme-border font-bold focus:outline-none cursor-pointer"
          >
            <option value="all">All Budgets</option>
            <option value="budget">Budget (Min &lt; ₹300)</option>
            <option value="mid">Mid Tier (₹300 – ₹450)</option>
            <option value="luxury">Luxury Tier (&gt; ₹450)</option>
          </select>
        </div>

        {/* Sort Menu (FR-3.4) */}
        <div className="flex items-center gap-2">
          <span className="theme-text-secondary font-semibold">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => updateParam('ordering', e.target.value)}
            className="px-3 py-1.5 rounded-xl theme-bg-secondary border theme-border font-bold focus:outline-none cursor-pointer"
          >
            <option value="rating">Highest Rated</option>
            <option value="popularity">Most Popular</option>
            <option value="delivery_time">Fastest Delivery</option>
            <option value="min_order">Min Order: Low to High</option>
          </select>
        </div>
      </div>

      {/* Restaurant Grid or Empty State (FR-3.1, FR-3.7) */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-72 rounded-3xl theme-bg-card animate-pulse" />
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="text-center py-20 rounded-3xl theme-bg-card border theme-border space-y-4">
          <div className="w-16 h-16 rounded-3xl theme-bg-secondary border theme-border mx-auto flex items-center justify-center text-amber-400">
            <SlidersHorizontal className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-3xl font-bold">No Flagship Kitchens Found</h3>
          <p className="text-xs theme-text-secondary max-w-sm mx-auto">
            No kitchens match the active combination of cuisine, dietary, and budget filters.
          </p>
          <button
            onClick={clearAllFilters}
            className="px-5 py-2.5 rounded-2xl theme-accent-bg text-xs font-bold shadow-md hover:scale-105 transition-transform cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              className={!restaurant.is_available ? 'opacity-50 grayscale pointer-events-none' : ''}
            >
              <RestaurantCard restaurant={restaurant} />
              {!restaurant.is_available && (
                <div className="text-center text-[11px] font-bold text-rose-400 mt-1">
                  Kitchen Currently Closed
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
