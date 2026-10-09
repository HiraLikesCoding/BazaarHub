'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { FREE_SHIPPING_OVER, SHIPPING_FLAT } from '@/lib/constants';

const CartContext = createContext(null);

const CART_KEY = 'bazaarhub_cart';
const WISHLIST_KEY = 'bazaarhub_wishlist';

function readStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    return fallback;
  }
}

function writeStorage(key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    /* storage full or disabled */
  }
}

function toCartItem(product, quantity) {
  return {
    id: String(product._id),
    name: product.name,
    slug: product.slug,
    image: product.images?.[0] || '',
    price: Number(product.effectivePrice ?? product.price),
    listPrice: Number(product.price) || 0,
    stock: Number(product.stock) || 0,
    category: product.category || '',
    quantity,
  };
}

/**
 * Cart + wishlist state. Persisted in localStorage so it survives reloads
 * and works for guests (no account required until checkout).
 */
export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  // Ref keeps the latest items available synchronously (for return values)
  const itemsRef = useRef(items);

  useEffect(() => {
    const stored = readStorage(CART_KEY, []);
    itemsRef.current = stored;
    setItems(stored);
    setWishlist(readStorage(WISHLIST_KEY, []));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeStorage(CART_KEY, items);
  }, [items, hydrated]);

  useEffect(() => {
    if (hydrated) writeStorage(WISHLIST_KEY, wishlist);
  }, [wishlist, hydrated]);

  /** Adds a product; clamps the quantity to the available stock. */
  const addItem = useCallback((product, quantity = 1) => {
    const stock = Number(product.stock) || 0;
    if (stock <= 0) return { ok: false, message: 'This product is out of stock.' };

    const id = String(product._id);
    const current = itemsRef.current;
    const existing = current.find((item) => item.id === id);
    const alreadyInCart = existing ? existing.quantity : 0;
    const nextQty = Math.min(alreadyInCart + Math.max(1, quantity), stock);

    if (nextQty === alreadyInCart) {
      return { ok: false, message: `Only ${stock} unit(s) available.` };
    }

    const nextItems = existing
      ? current.map((item) => (item.id === id ? { ...item, quantity: nextQty } : item))
      : [...current, toCartItem(product, nextQty)];

    itemsRef.current = nextItems;
    setItems(nextItems);
    return { ok: true, message: alreadyInCart > 0 ? `Cart updated to ${nextQty}.` : 'Added to cart.' };
  }, []);

  const removeItem = useCallback((id) => {
    setItems((current) => {
      const next = current.filter((item) => item.id !== String(id));
      itemsRef.current = next;
      return next;
    });
  }, []);

  const setQuantity = useCallback((id, quantity) => {
    const qty = Math.max(1, Math.floor(Number(quantity) || 1));
    setItems((current) => {
      const next = current.map((item) =>
        item.id === String(id) ? { ...item, quantity: Math.min(qty, Math.max(1, item.stock)) } : item
      );
      itemsRef.current = next;
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    itemsRef.current = [];
    setItems([]);
  }, []);

  const toggleWishlist = useCallback((id) => {
    const key = String(id);
    setWishlist((current) =>
      current.includes(key) ? current.filter((x) => x !== key) : [...current, key]
    );
  }, []);

  const isInWishlist = useCallback((id) => wishlist.includes(String(id)), [wishlist]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const shipping = items.length === 0 || subtotal >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FLAT;
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      shipping: Math.round(shipping * 100) / 100,
      total: Math.round((subtotal + shipping) * 100) / 100,
      count,
      freeShippingRemaining: Math.max(0, FREE_SHIPPING_OVER - subtotal),
    };
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      wishlist,
      hydrated,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
      toggleWishlist,
      isInWishlist,
      ...totals,
    }),
    [items, wishlist, hydrated, addItem, removeItem, setQuantity, clearCart, toggleWishlist, isInWishlist, totals]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
