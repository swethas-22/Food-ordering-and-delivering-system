import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, Trash2, Minus, Plus, Tag, ArrowRight, ArrowLeft, 
  MapPin, CheckCircle2, ShieldCheck, CreditCard, 
  Smartphone, Building2, Banknote, Sparkles, AlertCircle
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { orderService, authService } from '../services/parceloServices';

export const CartDrawer = () => {
  const navigate = useNavigate();
  const { 
    cart, cartDrawerOpen, closeCartDrawer, cartStep, setCartStep, 
    updateItemQty, removeItem, clearCart, applyCoupon, removeCoupon,
    lastPlacedOrder, setLastPlacedOrder, fetchCart
  } = useCart();
  const { user, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [promoInput, setPromoInput] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState(
    user?.default_address_details?.id || user?.addresses?.[0]?.id || ''
  );
  const [newAddressLine, setNewAddressLine] = useState('');
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [deliveryInstruction, setDeliveryInstruction] = useState('leave_at_door');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [upiProvider, setUpiProvider] = useState('Google Pay');
  const [upiId, setUpiId] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);

  if (!cartDrawerOpen) return null;

  const handleApplyPromo = async (e) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    await applyCoupon(promoInput.trim());
    setPromoInput('');
  };

  const handleSaveInlineAddress = async () => {
    if (!newAddressLine.trim()) return;
    try {
      const res = await authService.addAddress({
        label: 'New Delivery Address',
        line: newAddressLine.trim(),
        city: 'Bengaluru',
        pincode: '560034',
        is_default: false,
      });
      await refreshProfile();
      setSelectedAddressId(res.data.id);
      setIsAddingNewAddress(false);
      setNewAddressLine('');
      showToast('Delivery address saved.');
    } catch (err) {
      showToast('Error saving address.');
    }
  };

  const handlePlaceOrder = async () => {
    setPlacingOrder(true);
    try {
      const payload = {
        address_id: selectedAddressId || undefined,
        payment_method: paymentMethod,
        payment_provider: paymentMethod === 'upi' ? upiProvider : 'Simulated Gateway',
        delivery_instruction: deliveryInstruction,
        idempotency_key: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      };
      const res = await orderService.createOrder(payload);
      setLastPlacedOrder(res.data);
      setCartStep('success');
      showToast(`Order #${res.data.order_id} placed successfully!`);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not place order.');
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleLaunchTrack = () => {
    const orderId = lastPlacedOrder?.id || lastPlacedOrder?.order_id || 'latest';
    closeCartDrawer();
    fetchCart();
    navigate(`/orders/${orderId}/track`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md theme-bg-card border-l theme-border theme-shadow flex flex-col justify-between">
          
          {/* Drawer Header */}
          <div className="p-5 border-b theme-border flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              {cartStep === 'checkout' && (
                <button
                  onClick={() => setCartStep('items')}
                  className="p-1 rounded-lg hover:theme-bg-secondary mr-1 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <h3 className="font-serif text-2xl font-bold">
                {cartStep === 'items' && 'Your Culinary Bag'}
                {cartStep === 'checkout' && 'Checkout & Payment'}
                {cartStep === 'success' && 'Order Confirmed'}
              </h3>
            </div>
            <button
              onClick={closeCartDrawer}
              className="w-8 h-8 rounded-full theme-bg-secondary flex items-center justify-center hover:opacity-80 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            {/* STEP 1: ITEMS & PROMO & BILL */}
            {cartStep === 'items' && (
              <>
                {cart.items.length === 0 ? (
                  <div className="text-center py-20 space-y-3">
                    <div className="w-16 h-16 rounded-3xl theme-bg-secondary border theme-border mx-auto flex items-center justify-center theme-accent-text opacity-70">
                      <Tag className="w-8 h-8" />
                    </div>
                    <h4 className="font-serif text-2xl font-bold">Your bag is empty</h4>
                    <p className="text-xs theme-text-secondary max-w-xs mx-auto">
                      Explore menus from our curated Michelin and flagship kitchens.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-xs pb-1 border-b theme-border">
                      <span className="font-bold theme-accent-text uppercase tracking-wider">
                        From: {cart.restaurant_name}
                      </span>
                      <button
                        onClick={clearCart}
                        className="text-[11px] theme-text-secondary hover:text-rose-500 cursor-pointer"
                      >
                        Clear Bag
                      </button>
                    </div>

                    {/* Items List */}
                    <div className="space-y-3">
                      {cart.items.map((item) => (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-2xl theme-bg-secondary border theme-border flex items-start gap-3"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 rounded-xl object-cover shrink-0 bg-neutral-800"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <h4 className="text-xs font-bold leading-snug truncate">{item.name}</h4>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-neutral-400 hover:text-rose-500 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-[11px] theme-text-secondary mt-0.5 line-clamp-2">
                              {item.summary}
                            </p>
                            <div className="flex items-center justify-between mt-2.5">
                              <span className="text-xs font-bold theme-accent-text">
                                ₹{item.line_total}
                              </span>
                              <div className="flex items-center gap-2 px-1 py-0.5 rounded-lg theme-bg-card border theme-border">
                                <button
                                  onClick={() => updateItemQty(item.id, -1)}
                                  className="w-5 h-5 flex items-center justify-center text-xs hover:opacity-80"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => updateItemQty(item.id, 1)}
                                  className="w-5 h-5 theme-accent-bg rounded flex items-center justify-center text-xs"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Promo Code Input (FR-2.9, FR-5.7) */}
                    <div className="pt-2">
                      <form onSubmit={handleApplyPromo} className="flex gap-2">
                        <input
                          type="text"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                          placeholder="Promo code (e.g. PARCELO20)"
                          className="flex-1 px-3 py-2 rounded-xl theme-bg-secondary border theme-border text-xs uppercase font-bold focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl theme-accent-bg text-xs font-bold shadow-sm"
                        >
                          Apply
                        </button>
                      </form>

                      {cart.bill.coupon_code && (
                        <div className="mt-2 flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400">
                          <span className="flex items-center gap-1 font-bold">
                            <Tag className="w-3.5 h-3.5" /> {cart.bill.coupon_code} applied
                          </span>
                          <button
                            onClick={removeCoupon}
                            className="text-[10px] hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                      {cart.bill.coupon_error && (
                        <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {cart.bill.coupon_error}
                        </p>
                      )}
                    </div>

                    {/* Bill Breakdown (FR-5.6) */}
                    <div className="p-4 rounded-2xl theme-bg-secondary border theme-border space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="theme-text-secondary">Item Subtotal</span>
                        <span className="font-semibold">₹{cart.bill.subtotal}</span>
                      </div>
                      {parseFloat(cart.bill.discount) > 0 && (
                        <div className="flex justify-between text-emerald-400 font-bold">
                          <span>Promo Discount</span>
                          <span>-₹{cart.bill.discount}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="theme-text-secondary">White-Glove Delivery Fee</span>
                        <span className="font-semibold">
                          {parseFloat(cart.bill.delivery_fee) === 0 ? 'FREE' : `₹${cart.bill.delivery_fee}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="theme-text-secondary">Taxes & GST (5%)</span>
                        <span className="font-semibold">₹{cart.bill.tax}</span>
                      </div>
                      <div className="pt-2 border-t theme-border flex justify-between text-sm font-extrabold">
                        <span>Grand Total</span>
                        <span className="theme-accent-text font-serif text-base">₹{cart.bill.total}</span>
                      </div>
                    </div>

                    <div className="text-[11px] theme-text-secondary text-center">
                      Estimated Delivery: <strong className="theme-text-primary">~{cart.eta_minutes} mins</strong>
                    </div>
                  </>
                )}
              </>
            )}

            {/* STEP 2: CHECKOUT & SIMULATED PAYMENT (FR-5.9, FR-5.10, FR-5.11) */}
            {cartStep === 'checkout' && (
              <div className="space-y-4">
                {/* Delivery Address */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 theme-accent-text" /> Delivery Destination
                    </label>
                    <button
                      onClick={() => setIsAddingNewAddress(!isAddingNewAddress)}
                      className="text-[11px] theme-accent-text hover:underline cursor-pointer"
                    >
                      {isAddingNewAddress ? 'Select Saved' : '+ New Address'}
                    </button>
                  </div>

                  {!isAddingNewAddress ? (
                    <div className="space-y-2">
                      {user?.addresses?.map((addr) => (
                        <label
                          key={addr.id}
                          className={`flex items-start gap-2.5 p-3 rounded-2xl border cursor-pointer transition-all ${
                            selectedAddressId === addr.id
                              ? 'theme-bg-elevated theme-border shadow-sm'
                              : 'theme-bg-secondary theme-border hover:opacity-85'
                          }`}
                        >
                          <input
                            type="radio"
                            name="delivery_address"
                            checked={selectedAddressId === addr.id}
                            onChange={() => setSelectedAddressId(addr.id)}
                            className="mt-1 accent-amber-500"
                          />
                          <div>
                            <span className="text-xs font-bold block">{addr.label}</span>
                            <span className="text-[11px] theme-text-secondary line-clamp-2">{addr.line}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl theme-bg-secondary border theme-border space-y-2">
                      <textarea
                        rows={2}
                        value={newAddressLine}
                        onChange={(e) => setNewAddressLine(e.target.value)}
                        placeholder="House/Villa no, building, road, area..."
                        className="w-full p-2 rounded-xl theme-bg-card border theme-border text-xs focus:outline-none"
                      />
                      <button
                        onClick={handleSaveInlineAddress}
                        className="w-full py-1.5 rounded-xl theme-accent-bg text-xs font-bold cursor-pointer"
                      >
                        Save & Use This Address
                      </button>
                    </div>
                  )}
                </div>

                {/* Delivery Instructions */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2">
                    Delivery Instructions
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'leave_at_door', label: 'Leave at Door' },
                      { id: 'ring_bell', label: 'Ring Bell Once' },
                      { id: 'avoid_calling', label: 'Avoid Calling' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setDeliveryInstruction(opt.id)}
                        className={`p-2 rounded-xl text-[11px] font-bold border cursor-pointer transition-all text-center ${
                          deliveryInstruction === opt.id
                            ? 'theme-accent-bg border-transparent shadow-sm'
                            : 'theme-bg-secondary theme-border hover:opacity-85'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulated Payment Methods (FR-5.10, FR-5.11) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2">
                    Select Payment Method (Simulated)
                  </label>
                  <div className="space-y-2">
                    {[
                      { id: 'upi', name: 'Instant UPI', desc: 'Google Pay, PhonePe, Paytm', icon: Smartphone },
                      { id: 'card', name: 'Credit & Debit Cards', desc: 'Visa, Mastercard, Amex Privé', icon: CreditCard },
                      { id: 'netbanking', name: 'Net Banking', desc: 'HDFC, ICICI, SBI, Axis', icon: Building2 },
                      { id: 'cod', name: 'Cash on Delivery', desc: 'Pay cash or UPI at doorstep', icon: Banknote },
                    ].map((m) => {
                      const Icon = m.icon;
                      const isSelected = paymentMethod === m.id;
                      return (
                        <div
                          key={m.id}
                          onClick={() => setPaymentMethod(m.id)}
                          className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'theme-bg-elevated theme-border shadow-sm'
                              : 'theme-bg-secondary theme-border hover:opacity-85'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <Icon className="w-4 h-4 theme-accent-text" />
                              <div>
                                <span className="text-xs font-bold block">{m.name}</span>
                                <span className="text-[10px] theme-text-secondary">{m.desc}</span>
                              </div>
                            </div>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-amber-400' : 'theme-border'
                            }`}>
                              {isSelected && <div className="w-2 h-2 rounded-full theme-accent-bg" />}
                            </div>
                          </div>

                          {/* UPI Options */}
                          {isSelected && m.id === 'upi' && (
                            <div className="mt-3 pt-3 border-t theme-border flex items-center gap-2">
                              {['Google Pay', 'PhonePe', 'Paytm'].map((p) => (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setUpiProvider(p);
                                  }}
                                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border ${
                                    upiProvider === p
                                      ? 'theme-accent-bg border-transparent'
                                      : 'theme-bg-card theme-border'
                                  }`}
                                >
                                  {p}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Security and Simulated Notice (FR-5.11, NFR-S9) */}
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-[11px] text-amber-300">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Simulated Payment in v1.0:</strong> This application executes in sandbox simulation. No real money will be deducted from your account.
                  </span>
                </div>
              </div>
            )}

            {/* STEP 3: ORDER CONFIRMED SUCCESS (FR-5.13) */}
            {cartStep === 'success' && lastPlacedOrder && (
              <div className="py-12 text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mx-auto flex items-center justify-center shadow-lg animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="font-serif text-3xl font-bold">Order Confirmed!</h3>
                <div className="inline-block px-4 py-1.5 rounded-full theme-bg-secondary border theme-border text-xs font-bold theme-accent-text tracking-wider uppercase">
                  Order ID: {lastPlacedOrder.order_id}
                </div>
                <p className="text-xs theme-text-secondary max-w-xs mx-auto leading-relaxed">
                  Your order has been routed to the flagship kitchen. Valet delivery arrives in approximately{' '}
                  <strong className="theme-text-primary">~{lastPlacedOrder.eta_minutes} mins</strong>.
                </p>
                <div className="p-4 rounded-2xl theme-bg-secondary border theme-border max-w-xs mx-auto text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="theme-text-secondary">Total Amount</span>
                    <span className="font-bold theme-accent-text font-serif">₹{lastPlacedOrder.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="theme-text-secondary">Payment Method</span>
                    <span className="font-bold uppercase">{lastPlacedOrder.payment?.method} (Simulated)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-5 border-t theme-border shrink-0">
            {cartStep === 'items' && cart.items.length > 0 && (
              <button
                onClick={() => setCartStep('checkout')}
                className="w-full py-3.5 px-5 rounded-2xl theme-accent-bg text-xs font-extrabold flex items-center justify-between shadow-lg hover:scale-[1.01] transition-transform cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <div className="flex items-center gap-1 font-serif text-sm font-black">
                  <span>₹{cart.bill.total}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </button>
            )}

            {cartStep === 'checkout' && (
              <button
                onClick={handlePlaceOrder}
                disabled={placingOrder}
                className="w-full py-3.5 px-5 rounded-2xl theme-accent-bg text-xs font-extrabold flex items-center justify-between shadow-lg hover:scale-[1.01] transition-transform cursor-pointer disabled:opacity-50"
              >
                <span>{placingOrder ? 'Confirming Order...' : 'Place Privé Order'}</span>
                <span className="font-serif text-sm font-black">₹{cart.bill.total}</span>
              </button>
            )}

            {cartStep === 'success' && (
              <button
                onClick={handleLaunchTrack}
                className="w-full py-3.5 px-5 rounded-2xl theme-accent-bg text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] transition-transform cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Track Live Order</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
