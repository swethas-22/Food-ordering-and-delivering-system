import React, { useState, useEffect } from 'react';
import { X, Minus, Plus, Sliders, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CustomizationModal = ({ dish, isOpen, onClose }) => {
  const { addToCart } = useCart();

  const [portion, setPortion] = useState('Regular');
  const [portionDelta, setPortionDelta] = useState(0);
  const [spice, setSpice] = useState('Medium');
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [instructions, setInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Group dish customizations by kind
  const portions = dish?.customizations?.filter((c) => c.kind === 'portion') || [
    { id: 1, name: 'Regular', price_delta: '0.00', is_default: true },
    { id: 2, name: 'Large (+₹120)', price_delta: '120.00', is_default: false },
    { id: 3, name: 'Family Feast (+₹260)', price_delta: '260.00', is_default: false },
  ];

  const spices = dish?.customizations?.filter((c) => c.kind === 'spice') || [
    { id: 4, name: 'Mild', is_default: false },
    { id: 5, name: 'Medium', is_default: true },
    { id: 6, name: 'Spicy', is_default: false },
    { id: 7, name: 'Fiery', is_default: false },
  ];

  const extras = dish?.customizations?.filter((c) => c.kind === 'extra') || [
    { id: 8, name: 'Truffle Oil (+₹140)', price_delta: '140.00' },
    { id: 9, name: 'Extra Burrata (+₹95)', price_delta: '95.00' },
    { id: 10, name: 'Kasuri Methi Butter (+₹65)', price_delta: '65.00' },
    { id: 11, name: 'Saffron Strands (+₹45)', price_delta: '45.00' },
  ];

  useEffect(() => {
    if (dish) {
      const defPortion = portions.find((p) => p.is_default) || portions[0];
      setPortion(defPortion?.name || 'Regular');
      setPortionDelta(parseFloat(defPortion?.price_delta || 0));

      const defSpice = spices.find((s) => s.is_default) || spices[0];
      setSpice(defSpice?.name || 'Medium');

      setSelectedExtras([]);
      setInstructions('');
      setQuantity(1);
    }
  }, [dish]);

  if (!isOpen || !dish) return null;

  const basePrice = parseFloat(dish.price || 0);
  const extrasTotal = selectedExtras.reduce((sum, ext) => sum + parseFloat(ext.price_delta || 0), 0);
  const unitTotal = basePrice + portionDelta + extrasTotal;
  const grandTotal = unitTotal * quantity;

  const handleToggleExtra = (ext) => {
    if (selectedExtras.some((e) => e.id === ext.id)) {
      setSelectedExtras((prev) => prev.filter((e) => e.id !== ext.id));
    } else {
      setSelectedExtras((prev) => [...prev, ext]);
    }
  };

  const handleConfirm = async () => {
    const success = await addToCart(
      dish,
      {
        portion,
        spice,
        extras: selectedExtras.map((e) => e.id),
        instructions,
      },
      quantity
    );
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl theme-bg-card border theme-border theme-shadow overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Dish Banner */}
        <div className="relative h-44 bg-neutral-900 shrink-0">
          <img
            src={dish.image}
            alt={dish.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:scale-105 cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-5 right-5 text-white">
            <span className="text-[11px] font-bold uppercase tracking-wider theme-accent-text block mb-1">
              {dish.cuisine} • {dish.tag}
            </span>
            <h3 className="font-serif text-2xl font-bold leading-snug">{dish.name}</h3>
          </div>
        </div>

        {/* Scrollable Customization Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          <p className="text-xs theme-text-secondary leading-relaxed">{dish.description}</p>

          {/* Portion Size */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2">
              1. Choose Portion Size
            </label>
            <div className="grid grid-cols-3 gap-2">
              {portions.map((p) => {
                const isSelected = portion === p.name;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPortion(p.name);
                      setPortionDelta(parseFloat(p.price_delta || 0));
                    }}
                    className={`p-2.5 rounded-2xl text-xs font-bold text-center border cursor-pointer transition-all ${
                      isSelected
                        ? 'theme-accent-bg border-transparent shadow-sm'
                        : 'theme-bg-secondary theme-border hover:opacity-85'
                    }`}
                  >
                    <span className="block">{p.name.split(' (')[0]}</span>
                    <span className="text-[10px] opacity-80 mt-0.5 block">
                      {parseFloat(p.price_delta) > 0 ? `+₹${p.price_delta}` : 'Included'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Spice Level */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2">
              2. Choose Spice Level
            </label>
            <div className="grid grid-cols-4 gap-2">
              {spices.map((s) => {
                const isSelected = spice === s.name;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSpice(s.name)}
                    className={`py-2 px-1 rounded-2xl text-xs font-bold text-center border cursor-pointer transition-all ${
                      isSelected
                        ? 'theme-accent-bg border-transparent shadow-sm'
                        : 'theme-bg-secondary theme-border hover:opacity-85'
                    }`}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gourmet Add-ons & Extras */}
          {extras.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2">
                3. Bespoke Add-ons & Extras
              </label>
              <div className="space-y-2">
                {extras.map((ext) => {
                  const isChecked = selectedExtras.some((e) => e.id === ext.id);
                  return (
                    <label
                      key={ext.id}
                      onClick={() => handleToggleExtra(ext)}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'theme-bg-elevated theme-border shadow-sm'
                          : 'theme-bg-secondary theme-border hover:opacity-85'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                          isChecked ? 'theme-accent-bg border-transparent' : 'theme-border'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 text-black stroke-[3]" />}
                        </div>
                        <span className="text-xs font-semibold">{ext.name.split(' (')[0]}</span>
                      </div>
                      <span className="text-xs font-bold theme-accent-text">+₹{ext.price_delta}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special Instructions (FR-4.6: up to 200 chars) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2">
              Special Chef Instructions (Optional)
            </label>
            <textarea
              maxLength={200}
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Less oil, extra lime, allergy cautions..."
              className="w-full p-3 rounded-2xl theme-bg-secondary border theme-border text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
            <div className="text-right text-[10px] theme-text-secondary mt-1">
              {instructions.length} / 200
            </div>
          </div>
        </div>

        {/* Footer: Stepper & Add to Bag (FR-4.8) */}
        <div className="p-4 sm:p-5 border-t theme-border flex items-center justify-between gap-4 theme-bg-card shrink-0">
          <div className="flex items-center gap-2.5 p-1 rounded-2xl theme-bg-secondary border theme-border">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-80 cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-sm font-extrabold w-6 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              className="w-8 h-8 rounded-xl theme-accent-bg flex items-center justify-center cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleConfirm}
            className="flex-1 py-3 px-5 rounded-2xl theme-accent-bg text-xs font-extrabold flex items-center justify-between shadow-lg hover:scale-[1.01] transition-transform cursor-pointer"
          >
            <span>Add to Culinary Bag</span>
            <span className="text-sm font-serif font-black">₹{grandTotal.toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
