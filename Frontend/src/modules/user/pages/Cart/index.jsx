import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiArrowLeft, 
  FiShoppingCart, 
  FiTrash2, 
  FiPlus, 
  FiMinus, 
  FiInfo, 
  FiChevronRight,
  FiShoppingBag,
  FiCheckCircle,
  FiZap
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useCart } from '../../../../context/CartContext';
import Header from '../../components/layout/Header';
import { publicCatalogService } from '../../../../services/catalogService';

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, isLoading: loading, removeItem, updateItem } = useCart();
  const [homeContent, setHomeContent] = useState(null);

  useEffect(() => {
    const fetchHome = async () => {
      const res = await publicCatalogService.getHomeData();
      if (res.success) setHomeContent(res.homeContent);
    };
    fetchHome();
  }, []);

  const toAssetUrl = (url) => {
    if (!url) return '';
    const clean = url.replace('/api/upload', '/upload');
    if (clean.startsWith('http')) return clean;
    const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/api$/, '');
    return `${base}${clean.startsWith('/') ? '' : '/'}${clean}`;
  };

  const totals = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);
    const tax = subtotal * 0.18; // 18% GST
    const delivery = subtotal > 0 ? 49 : 0;
    return {
      subtotal,
      tax,
      delivery,
      total: subtotal + tax + delivery
    };
  }, [cartItems]);

  const handleQuantityChange = async (itemId, currentCount, change) => {
    const newCount = currentCount + change;
    
    if (newCount <= 0) {
      return handleRemove(itemId);
    }
    
    try {
      const res = await updateItem(itemId, newCount);
      if (!res.success) toast.error('Failed to update quantity');
    } catch (error) {
      toast.error('Error updating cart');
    }
  };

  const handleRemove = async (itemId) => {
    try {
      const res = await removeItem(itemId);
      if (res.success) toast.success('Item removed');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header
        location={localStorage.getItem('currentAddress') || ''}
        onLocationClick={() => {}}
        navLinks={homeContent?.navLinks}
        siteIdentity={homeContent?.siteIdentity}
        homeContent={homeContent}
      />

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate(-1)}
              className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-900 hover:bg-gray-50 transition-all active:scale-90"
            >
              <FiArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-[1000] text-gray-900 tracking-tight uppercase">Your Basket</h1>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">
                {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'} Secured
              </p>
            </div>
          </div>
          
          {cartItems.length > 0 && (
            <button 
              onClick={() => navigate('/user/products')}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              Add More Items
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Items List */}
          <div className="lg:col-span-8 space-y-6">
            <AnimatePresence mode="popLayout">
              {cartItems.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-[3rem] p-20 text-center border border-gray-100 shadow-sm"
                >
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
                    <FiShoppingCart className="w-10 h-10 text-gray-300" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Empty Basket</h2>
                  <p className="text-gray-400 font-bold text-sm mb-8">Looks like you haven't added anything yet.</p>
                  <button 
                    onClick={() => navigate('/user/products')}
                    className="px-10 py-4 bg-[#00246b] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all"
                  >
                    Start Shopping
                  </button>
                </motion.div>
              ) : (
                cartItems.map((item, idx) => (
                  <motion.div
                    key={item.id || item._id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, scale: 0.95 }}
                    className="group bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                  >
                    <div className="flex items-center gap-8">
                      {/* Image */}
                      <div className="w-32 h-32 rounded-3xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                        <img 
                          src={toAssetUrl(item.icon || '')} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                          alt="" 
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-md mb-2 inline-block">
                              {item.category || 'Service'}
                            </span>
                            <h3 className="text-xl font-black text-gray-900 truncate uppercase tracking-tight">
                              {item.title}
                            </h3>
                          </div>
                          <button 
                            onClick={() => handleRemove(item.id || item._id)}
                            className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center transition-all hover:bg-red-500 hover:text-white"
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <p className="text-xs font-bold text-gray-400 line-clamp-1 mb-6 uppercase tracking-wider">
                          {item.description || 'Premium selection'}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-2xl font-black text-gray-900">₹{item.price}</span>
                            <span className="text-xs font-bold text-gray-300 line-through">₹{item.price + 200}</span>
                          </div>

                          {/* Quantity Selector */}
                          <div className="flex items-center bg-gray-50 rounded-2xl p-1.5 border border-gray-100">
                            <button 
                              onClick={() => handleQuantityChange(item.id || item._id, item.serviceCount || 1, -1)}
                              className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors active:scale-90"
                            >
                              <FiMinus className="w-4 h-4" />
                            </button>
                            <span className="w-12 text-center text-sm font-black">{item.serviceCount || 1}</span>
                            <button 
                              onClick={() => handleQuantityChange(item.id || item._id, item.serviceCount || 1, 1)}
                              className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors active:scale-90"
                            >
                              <FiPlus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Checkout Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-32 space-y-6">
              <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm">
                <h2 className="text-lg font-black text-gray-900 mb-8 uppercase tracking-widest flex items-center gap-3">
                  <FiShoppingBag className="text-blue-600" />
                  Order Summary
                </h2>

                <div className="space-y-6 mb-10">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-gray-400 uppercase tracking-widest">Basket Subtotal</span>
                    <span className="font-black text-gray-900">₹{totals.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-gray-400 uppercase tracking-widest">GST (18%)</span>
                    <span className="font-black text-gray-900">₹{totals.tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-gray-400 uppercase tracking-widest">Platform Fee</span>
                    <span className="font-black text-emerald-500">
                      {totals.delivery === 0 ? 'FREE' : `₹${totals.delivery}`}
                    </span>
                  </div>
                  <div className="pt-6 border-t border-dashed border-gray-100 flex justify-between items-center">
                    <span className="text-xl font-black text-gray-900 uppercase tracking-tight">Total Amount</span>
                    <span className="text-3xl font-[1000] text-gray-900">₹{totals.total.toLocaleString()}</span>
                  </div>
                </div>

                <button 
                  disabled={cartItems.length === 0}
                  onClick={() => navigate('/user/checkout')}
                  className="w-full bg-[#00246b] text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
                >
                  <FiZap className="w-5 h-5 fill-current" />
                  Proceed to Checkout
                </button>

                <div className="mt-8 flex items-center justify-center gap-4 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                  <FiCheckCircle className="w-4 h-4" />
                  Guaranteed Safe Checkout
                </div>
              </div>

              {/* Promo Section */}
              <div className="bg-emerald-500 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-emerald-500/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                <h4 className="text-sm font-black uppercase tracking-widest mb-2">Nexus Prime Discount</h4>
                <p className="text-[10px] font-bold opacity-80 uppercase leading-relaxed">
                  You are saving ₹540 on this order with your Prime status.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Cart;
