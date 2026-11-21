import React, { useState } from 'react';
import { Heart, Star, Plus } from 'lucide-react';
import { reviewService } from '../services/parceloServices';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const DishCard = ({ dish, onCustomize }) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const { showToast } = useToast();
  const [isFavorite, setIsFavorite] = useState(dish.is_favorite || false);

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      openAuthModal('login');
      showToast('Please sign in to favourite dishes.');
      return;
    }
    try {
      const res = await reviewService.toggleFavorite('dish', dish.id);
      const newFav = res.data.action !== 'removed';
      setIsFavorite(newFav);
      showToast(newFav ? `Saved "${dish.name}" to Favourites` : `Removed "${dish.name}" from Favourites`);
    } catch (err) {
      showToast('Could not update favourite dish.');
    }
  };

  return (
    <div className="hover-zoom-card rounded-3xl theme-bg-card border theme-border overflow-hidden flex flex-col theme-shadow">
      <div 
        onClick={() => onCustomize(dish)} 
        className="relative h-44 overflow-hidden cursor-pointer bg-neutral-900"
      >
        <img
          src={dish.image}
          alt={dish.name}
          onError={(e) => {
            e.target.src = 'https://placehold.co/600x400/1C1C1C/D4AF37?text=Parcelo+Dish';
          }}
          className="zoom-img w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

        {dish.tag && (
          <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-black/65 text-amber-300 backdrop-blur-md">
            {dish.tag}
          </span>
        )}

        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center text-xs hover:scale-110 transition-transform cursor-pointer"
          aria-label="Toggle favourite dish"
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
        </button>

        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className={`w-3.5 h-3.5 rounded-sm border ${dish.is_veg ? 'border-emerald-500' : 'border-rose-500'} bg-white flex items-center justify-center`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dish.is_veg ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
            </span>
            <span>{dish.cuisine || dish.restaurant_name}</span>
          </span>
          <span className="font-bold text-amber-300 flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-300" /> {dish.rating}
          </span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div onClick={() => onCustomize(dish)} className="cursor-pointer">
          <h3 className="font-serif text-xl font-bold leading-snug mb-1 line-clamp-1">{dish.name}</h3>
          <p className="text-[11px] theme-text-secondary line-clamp-2 mb-3 leading-relaxed">{dish.description}</p>
        </div>
        <div className="pt-3 border-t theme-border flex items-center justify-between">
          <span className="text-base font-bold theme-accent-text">₹{dish.price}</span>
          <button
            onClick={() => onCustomize(dish)}
            className="px-3.5 py-1.5 rounded-xl theme-accent-bg text-xs font-bold flex items-center gap-1 cursor-pointer hover:scale-105 transition-transform"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </div>
    </div>
  );
};
