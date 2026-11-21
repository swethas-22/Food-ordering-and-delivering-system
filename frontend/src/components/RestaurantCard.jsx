import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Clock, Star } from 'lucide-react';
import { reviewService } from '../services/parceloServices';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const RestaurantCard = ({ restaurant, onFavoriteToggle }) => {
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal } = useAuth();
  const { showToast } = useToast();
  const [isFavorite, setIsFavorite] = useState(restaurant.is_favorite || false);

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      openAuthModal('login');
      showToast('Please sign in to save favourite restaurants.');
      return;
    }
    try {
      const res = await reviewService.toggleFavorite('restaurant', restaurant.id);
      const newFav = res.data.action !== 'removed';
      setIsFavorite(newFav);
      showToast(newFav ? `Saved ${restaurant.name} to Favourites` : `Removed ${restaurant.name} from Favourites`);
      if (onFavoriteToggle) onFavoriteToggle(restaurant.id, newFav);
    } catch (err) {
      showToast('Could not update favourites.');
    }
  };

  const cuisinesList = restaurant.cuisines?.length ? restaurant.cuisines : (restaurant.cuisine_name ? [restaurant.cuisine_name] : []);

  return (
    <article
      onClick={() => navigate(`/restaurants/${restaurant.id}`)}
      className="hover-zoom-card rounded-3xl theme-bg-card border theme-border overflow-hidden flex flex-col theme-shadow cursor-pointer group"
    >
      <div className="relative h-52 overflow-hidden bg-neutral-900">
        <img
          src={restaurant.image}
          alt={restaurant.name}
          onError={(e) => {
            e.target.src = `https://placehold.co/800x500/1C1C1C/D4AF37?text=${encodeURIComponent(restaurant.name)}`;
          }}
          className="zoom-img w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

        {restaurant.badge && (
          <span className="absolute top-3.5 left-3.5 px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-black/65 text-amber-300 backdrop-blur-md">
            {restaurant.badge}
          </span>
        )}

        <button
          onClick={handleFavoriteClick}
          className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center text-xs hover:scale-110 transition-transform cursor-pointer"
          aria-label="Toggle favourite"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
        </button>

        <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-white text-xs">
          <span className="font-semibold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-300" />
            {restaurant.delivery_time}
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-emerald-600 font-bold text-[11px] flex items-center gap-1">
            <Star className="w-3 h-3 fill-white" /> {restaurant.rating} ★ ({restaurant.review_count})
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-serif text-2xl font-bold mb-1 leading-snug">{restaurant.name}</h3>
          <p className="text-xs theme-text-secondary mb-3">{cuisinesList.join(' • ')}</p>
        </div>
        <div className="pt-3 border-t theme-border flex items-center justify-between text-[11px] theme-text-secondary font-semibold">
          <span>Delivery: <strong className="theme-text-primary">{restaurant.delivery_fee_display}</strong></span>
          <span>Min Order: <strong className="theme-text-primary">₹{restaurant.min_order}</strong></span>
        </div>
      </div>
    </article>
  );
};
