import React from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, UtensilsCrossed, Sparkles, Clock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const BottomNav = ({ onOpenAi }) => {
  const { isAuthenticated, openAuthModal } = useAuth();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 theme-glass border-t theme-border py-1.5 px-3 flex items-center justify-around shadow-lg">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
            isActive ? 'theme-accent-text scale-105' : 'theme-text-secondary opacity-75'
          }`
        }
      >
        <Compass className="w-5 h-5" />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/restaurants"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
            isActive ? 'theme-accent-text scale-105' : 'theme-text-secondary opacity-75'
          }`
        }
      >
        <UtensilsCrossed className="w-5 h-5" />
        <span>Explore</span>
      </NavLink>

      <button
        onClick={onOpenAi}
        className="flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold theme-text-secondary hover:theme-accent-text transition-all cursor-pointer"
      >
        <div className="w-7 h-7 rounded-xl theme-accent-bg flex items-center justify-center -mt-3 shadow-md">
          <Sparkles className="w-4 h-4" />
        </div>
        <span>Concierge</span>
      </button>

      <NavLink
        to="/profile?tab=orders"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
            isActive ? 'theme-accent-text scale-105' : 'theme-text-secondary opacity-75'
          }`
        }
      >
        <Clock className="w-5 h-5" />
        <span>Orders</span>
      </NavLink>

      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
            isActive ? 'theme-accent-text scale-105' : 'theme-text-secondary opacity-75'
          }`
        }
      >
        <User className="w-5 h-5" />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
};
