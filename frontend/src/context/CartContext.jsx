import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartService } from '../services/parceloServices';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const { showToast } = useToast();

  const [cart, setCart] = useState({
    items: [],
    bill: {
      subtotal: '0.00',
      discount: '0.00',
      delivery_fee: '0.00',
      tax: '0.00',
      total: '0.00',
      coupon_code: null,
      coupon_error: null,
    },
    restaurant_id: null,
    restaurant_name: null,
    restaurant_min_order: '0.00',
    eta_minutes: 25,
  });

  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [cartStep, setCartStep] = useState('items'); // 'items', 'checkout', 'success'
  const [lastPlacedOrder, setLastPlacedOrder] = useState(null);
  const [conflictData, setConflictData] = useState(null); // When restaurant conflict occurs (FR-5.3)

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart({
        items: [],
        bill: { subtotal: '0.00', discount: '0.00', delivery_fee: '0.00', tax: '0.00', total: '0.00', coupon_code: null },
        restaurant_id: null,
        restaurant_name: null,
        eta_minutes: 25,
      });
      return;
    }
    try {
      const res = await cartService.getCart();
      setCart(res.data);
    } catch (err) {}
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (foodItem, { portion, spice, extras = [], instructions = '' }, quantity = 1, replace = false) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      showToast('Please sign in to add items to your culinary bag.');
      return false;
    }

    try {
      const payload = {
        food_item: foodItem.id,
        quantity,
        portion,
        spice,
        extras,
        instructions,
        replace,
      };
      const res = await cartService.addItem(payload);
      setCart(res.data);
      setConflictData(null);
      showToast(`Added ${quantity}× ${foodItem.name} to bag`);
      return true;
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.code === 'restaurant_conflict') {
        setConflictData({
          pendingItem: { foodItem, customizations: { portion, spice, extras, instructions }, quantity },
          message: err.response.data.detail,
          currentRestaurant: err.response.data.current_restaurant,
          newRestaurant: err.response.data.new_restaurant,
        });
        return false;
      }
      showToast(err.response?.data?.detail || 'Failed to add item to bag.');
      return false;
    }
  };

  const confirmReplaceCart = async () => {
    if (!conflictData?.pendingItem) return;
    const { foodItem, customizations, quantity } = conflictData.pendingItem;
    await addToCart(foodItem, customizations, quantity, true);
    setConflictData(null);
  };

  const cancelReplaceCart = () => {
    setConflictData(null);
  };

  const updateItemQty = async (itemId, delta) => {
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) return;
    const newQty = item.quantity + delta;
    try {
      const res = await cartService.updateItem(itemId, { quantity: newQty });
      setCart(res.data);
    } catch (err) {
      showToast('Error updating item quantity.');
    }
  };

  const removeItem = async (itemId) => {
    try {
      const res = await cartService.deleteItem(itemId);
      setCart(res.data);
      showToast('Item removed from bag.');
    } catch (err) {
      showToast('Error removing item.');
    }
  };

  const clearCart = async () => {
    try {
      await cartService.clearCart();
      fetchCart();
      showToast('Bag emptied.');
    } catch (err) {}
  };

  const applyCoupon = async (code) => {
    try {
      const res = await cartService.applyCoupon(code);
      setCart(res.data);
      showToast(`Promo code ${code.toUpperCase()} applied!`);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid promo code.';
      showToast(msg);
      return { success: false, detail: msg };
    }
  };

  const removeCoupon = async () => {
    try {
      const res = await cartService.removeCoupon();
      setCart(res.data);
      showToast('Promo code removed.');
    } catch (err) {}
  };

  const openCartDrawer = (step = 'items') => {
    if (!isAuthenticated) {
      openAuthModal('login');
      showToast('Please sign in to view your culinary bag.');
      return;
    }
    setCartStep(step);
    setCartDrawerOpen(true);
  };

  const closeCartDrawer = () => setCartDrawerOpen(false);

  const totalItemsCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        totalItemsCount,
        cartDrawerOpen,
        cartStep,
        setCartStep,
        openCartDrawer,
        closeCartDrawer,
        addToCart,
        updateItemQty,
        removeItem,
        clearCart,
        applyCoupon,
        removeCoupon,
        conflictData,
        confirmReplaceCart,
        cancelReplaceCart,
        lastPlacedOrder,
        setLastPlacedOrder,
        fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
