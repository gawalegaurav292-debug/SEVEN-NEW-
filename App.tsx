
import React, { useState, useEffect, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { SplashScreen } from './components/SplashScreen';
import { Layout } from './components/Layout';
import { DecisionEngine } from './pages/DecisionEngine';
import { ProductDetail } from './pages/ProductDetail';
import { Wishlist } from './pages/Wishlist';
import { Orders } from './pages/Orders';
import Wardrobe from './pages/Wardrobe';
import Trends from './pages/Trends';
import StyleTribe from './pages/StyleTribe';
import SocialCloset from './pages/SocialCloset';
import { PartnerBrands } from './pages/PartnerBrands';
import { CartItem, Order } from './types';

const AppShell = () => (
  <div className="h-screen w-screen bg-white flex flex-col items-center justify-center p-12 text-center">
    <div className="w-1.5 h-1.5 bg-black rounded-full animate-ping opacity-10"></div>
  </div>
);

function MainApp() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const addToCart = (item: CartItem) => setCart(prev => [...prev, item]);
  const toggleWishlist = (id: string) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const addOrder = (order: Order) => setOrders(prev => [order, ...prev]);

  return (
    <HashRouter>
      <Layout cartCount={cart.length}>
        <Suspense fallback={<AppShell />}>
          <Routes>
            <Route path="/" element={<DecisionEngine />} />
            <Route path="/wardrobe" element={<Wardrobe />} />
            <Route path="/trends" element={<Trends />} />
            <Route path="/tribe" element={<StyleTribe />} />
            <Route path="/social" element={<SocialCloset />} />
            <Route path="/nodes" element={<PartnerBrands />} />
            <Route path="/product/:id" element={<ProductDetail addToCart={addToCart} wishlist={wishlist} toggleWishlist={toggleWishlist} currency="USD" />} />
            <Route path="/wishlist" element={<Wishlist wishlistIds={wishlist} currency="USD" />} />
            <Route path="/orders" element={<Orders orders={orders} />} />
          </Routes>
        </Suspense>
      </Layout>
    </HashRouter>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 2500);
    return () => clearTimeout(t);
  }, []);

  return ready ? <MainApp /> : <SplashScreen />;
}
