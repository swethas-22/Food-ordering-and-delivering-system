import React from 'react';
import { X, Mic } from 'lucide-react';

export const VoiceSearchModal = ({ isOpen, onClose, onSelectTerm }) => {
  if (!isOpen) return null;

  const samplePhrases = [
    'Hyderabadi Dum Biryani',
    'Black Truffle Risotto',
    'Omakase Dragon Roll',
    'Beirut Royal Mezze',
    'Chipotle Birria Tacos',
    'Pure vegetarian restaurants',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl theme-bg-card border theme-border theme-shadow p-6 text-center space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full theme-bg-secondary flex items-center justify-center hover:opacity-80 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-20 h-20 rounded-full theme-accent-bg mx-auto flex items-center justify-center shadow-2xl animate-pulse">
          <Mic className="w-8 h-8" />
        </div>

        {/* Animated Soundwave */}
        <div className="flex items-center justify-center gap-2 h-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="w-1.5 rounded-full soundwave-bar" />
          ))}
        </div>

        <div>
          <h4 className="font-serif text-2xl font-bold">Listening for Flavors...</h4>
          <p className="text-xs theme-text-secondary mt-1">
            Say a dish, cuisine, or restaurant name, or select a sample phrase below:
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {samplePhrases.map((phrase, idx) => (
            <button
              key={idx}
              onClick={() => {
                onSelectTerm(phrase);
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl theme-bg-secondary border theme-border text-xs font-semibold hover:theme-accent-bg transition-colors cursor-pointer"
            >
              "{phrase}"
            </button>
          ))}
        </div>

        <div className="text-[10px] theme-text-secondary opacity-70">
          Parcelo Voice Search Simulation • No audio recorded
        </div>
      </div>
    </div>
  );
};
