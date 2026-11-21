import React from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const ReplaceCartModal = () => {
  const { conflictData, confirmReplaceCart, cancelReplaceCart } = useCart();

  if (!conflictData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl theme-bg-card border theme-border theme-shadow p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl theme-bg-secondary border theme-border mx-auto flex items-center justify-center text-amber-400">
          <AlertCircle className="w-8 h-8" />
        </div>

        <h3 className="font-serif text-2xl font-bold">Replace Current Bag?</h3>
        
        <p className="text-xs theme-text-secondary leading-relaxed">
          Your culinary bag already contains items from{' '}
          <strong className="theme-text-primary">{conflictData.currentRestaurant}</strong>.
          Would you like to clear the bag and add this selection from{' '}
          <strong className="theme-accent-text">{conflictData.newRestaurant}</strong>?
        </p>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={cancelReplaceCart}
            className="flex-1 py-3 rounded-2xl theme-bg-secondary border theme-border text-xs font-bold hover:opacity-85 cursor-pointer"
          >
            Keep Current Items
          </button>
          <button
            onClick={confirmReplaceCart}
            className="flex-1 py-3 rounded-2xl theme-accent-bg text-xs font-bold shadow-md hover:scale-[1.02] transition-transform cursor-pointer flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Replace Bag</span>
          </button>
        </div>
      </div>
    </div>
  );
};
