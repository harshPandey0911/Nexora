import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiPackage, FiPlus, FiTrash2, FiSearch, 
  FiBriefcase, FiStar, FiChevronDown, FiBox, FiTool
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import vendorService from '../../services/vendorService';
import { publicCatalogService } from '../../../../services/catalogService';
import { toast } from 'react-hot-toast';

const MyServices = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [groupedServices, setGroupedServices] = useState({});
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  
  const [quickAdd, setQuickAdd] = useState({ title: '', basePrice: '', categoryId: '' });
  const [isAdding, setIsAdding] = useState(false);

  const [editingCategory, setEditingCategory] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const loadServices = async () => {
    try {
      setLoading(true);
      const res = await vendorService.getMyCustomContent();
      const resStats = await vendorService.getMyServices(); // For category stats
      const publicCatsRes = await publicCatalogService.getCategories(); // Fetch all platform categories

      if (res.success) {
        const myCats = (res.data?.categories || []).map(c => ({ ...c, id: c._id || c.id }));
        const platformCats = (publicCatsRes.success ? publicCatsRes.categories : []).map(c => ({ ...c, id: c._id || c.id }));
        
        // Filter by SERVICE type and merge (Prioritize myCats)
        const combined = [...myCats];
        platformCats.forEach(pc => {
          if (!combined.find(vc => vc.title.toLowerCase() === pc.title.toLowerCase())) {
            combined.push(pc);
          }
        });

        const serviceCats = combined.filter(c => !c.offeringType || c.offeringType === 'SERVICE');
        
        console.log('[loadServices] Final categories with IDs:', serviceCats.map(c => ({ title: c.title, id: c.id })));

        // Add stats from getMyServices to categories
        const statsMap = {};
        if (resStats.success) {
           resStats.data.forEach(s => {
             statsMap[s.id || s._id] = s.stats;
           });
        }

        const catsWithStats = serviceCats.map(cat => ({
          ...cat,
          stats: statsMap[cat.id] || { totalJobs: 0, completedJobs: 0, rating: 0 }
        }));

        setCategories(catsWithStats);
        
        // Group by categoryId
        const grouped = {};
        const allItems = (res.data?.services || []).map(s => ({ ...s, id: s._id || s.id }));
        const servicesOnly = allItems.filter(item => !item.offeringType || item.offeringType === 'SERVICE');

        servicesOnly.forEach(p => {
          const catId = p.categoryId?._id || p.categoryId || 'uncategorized';
          if (!grouped[catId]) grouped[catId] = [];
          grouped[catId].push(p);
        });
        setGroupedServices(grouped);
      }
    } catch (error) {
      console.error('Error loading services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleUpdateCategory = async (categoryId) => {
    if (!editTitle.trim()) return setEditingCategory(null);
    try {
      setLoading(true);
      const res = await vendorService.updateCategory(categoryId, { title: editTitle });
      if (res.success) {
        toast.success('Category updated');
        setEditingCategory(null);
        loadServices();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to remove this category from your portfolio?')) return;
    try {
      setLoading(true);
      const res = await vendorService.removeService(categoryId);
      if (res.success) {
        toast.success(res.message);
        loadServices();
      }
    } catch (error) {
      toast.error('Failed to remove category');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      setIsRemoving(true);
      const res = await vendorService.removeService(itemId);
      if (res.success) {
        toast.success('Service item removed');
        loadServices();
        setShowConfirm(null);
      }
    } catch (error) {
      console.error('Remove item error:', error);
      toast.error('Failed to remove item');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleQuickAdd = async (e, catId) => {
    e.preventDefault();
    if (!quickAdd.title || !quickAdd.basePrice) return toast.error('Please enter service name and price');
    
    try {
      setIsAdding(true);
      const res = await vendorService.addVendorService({
        title: quickAdd.title,
        basePrice: quickAdd.basePrice,
        categoryId: catId,
        offeringType: 'SERVICE'
      });
      if (res.success) {
        toast.success('Service added!');
        setQuickAdd({ title: '', basePrice: '', categoryId: '' });
        loadServices();
      }
    } catch (error) {
      toast.error('Failed to add service');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header - White Style */}
      <div className="bg-white p-6 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between text-gray-900 border border-gray-100 gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none uppercase">
            Service Portfolio
          </h2>
          <p className="text-gray-500 font-medium mt-2">
            Configure your expertise and pricing for user bookings
          </p>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => navigate('/vendor/add-custom-content?type=SERVICE')}
             className="flex items-center gap-2 px-6 py-3 bg-gray-50 text-gray-400 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-100 transition-all active:scale-95 border border-gray-100"
           >
             <FiPlus className="w-4 h-4" />
             New Skill Set
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Syncing Expertise...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-gray-200">
             <FiBriefcase className="w-16 h-16 text-gray-100 mx-auto mb-4" />
             <h3 className="text-xl font-black text-gray-800 uppercase">No Active Skills</h3>
             <p className="text-sm text-gray-400 mt-2">Awaiting administrative assignment or custom skill creation</p>
          </div>
        ) : (
          categories.map(cat => (
            <div key={cat._id} className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
              {/* Category Header with Inline Add */}
              <div className="bg-gray-50/50 px-8 py-6 border-b border-gray-100">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm">
                      {cat.imageUrl ? (
                        <img src={cat.imageUrl} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <FiTool className="text-gray-400 w-6 h-6" />
                      )}
                    </div>
                    <div>
                      {editingCategory === cat.id ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="px-3 py-1 bg-white border border-blue-500/30 rounded-lg text-sm font-bold text-gray-800 focus:outline-none"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateCategory(cat.id)}
                          />
                          <button 
                            onClick={() => handleUpdateCategory(cat.id)}
                            className="text-[10px] font-black text-blue-600 uppercase"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{cat.title}</h3>
                          {cat.vendorId && (
                            <>
                              <button 
                                onClick={() => {
                                  setEditingCategory(cat.id);
                                  setEditTitle(cat.title);
                                }}
                                className="p-1.5 text-gray-300 hover:text-blue-500 transition-all"
                              >
                                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="14" width="14" xmlns="http://www.w3.org/2000/svg"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                              </button>
                              <button 
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="p-1.5 text-gray-300 hover:text-red-500 transition-all"
                                title="Delete Category"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                          {groupedServices[cat._id]?.length || 0} Specialties
                        </p>
                        <div className="w-1 h-1 bg-gray-300 rounded-full" />
                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1">
                           <FiStar className="fill-amber-500" /> {cat.stats?.rating || '0.0'} Rating
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Add Form */}
                  <form 
                    onSubmit={(e) => handleQuickAdd(e, cat._id)}
                    className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-[20px] border border-gray-100 shadow-sm"
                  >
                    <input 
                      type="text"
                      placeholder="Service (e.g. AC Cleaning)"
                      value={quickAdd.categoryId === cat._id ? quickAdd.title : ''}
                      onChange={(e) => setQuickAdd({ ...quickAdd, title: e.target.value, categoryId: cat._id })}
                      className="px-4 py-2 bg-gray-50 border border-transparent rounded-xl text-xs font-bold text-gray-700 focus:bg-white focus:border-blue-500/30 outline-none min-w-[180px] transition-all"
                    />
                    <input 
                      type="number"
                      placeholder="Price"
                      value={quickAdd.categoryId === cat._id ? quickAdd.basePrice : ''}
                      onChange={(e) => setQuickAdd({ ...quickAdd, basePrice: e.target.value, categoryId: cat._id })}
                      className="w-24 px-4 py-2 bg-gray-50 border border-transparent rounded-xl text-xs font-bold text-gray-700 focus:bg-white focus:border-blue-500/30 outline-none transition-all"
                    />
                    <button 
                      type="submit"
                      disabled={isAdding && quickAdd.categoryId === cat._id}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                    >
                      {isAdding && quickAdd.categoryId === cat._id ? '...' : <><FiPlus className="w-3.5 h-3.5" /> Add Skill</>}
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleDeleteCategory(cat._id)}
                      className="p-2.5 bg-gray-50 text-gray-400 hover:text-red-500 rounded-xl transition-all"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Service Specification</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pricing</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 px-2">
                    {!groupedServices[cat._id] || groupedServices[cat._id].length === 0 ? (
                      <tr>
                        <td colSpan="3" className="px-8 py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No specialized skills added</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase">Define your service rates above</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      groupedServices[cat._id].map(item => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 shadow-sm flex items-center justify-center">
                                {item.iconUrl ? (
                                   <img src={item.iconUrl} className="w-full h-full object-cover" alt="" />
                                ) : (
                                   <FiBriefcase className="text-gray-300 w-5 h-5" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-black text-gray-800 uppercase truncate tracking-tight">{item.title}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">SKU: {item.id.slice(-6).toUpperCase()}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-lg font-black text-blue-600">₹{item.basePrice.toLocaleString()}</span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-3">
                               <button 
                                 onClick={() => navigate(`/vendor/service/edit/${item.id}`)}
                                 className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all border border-blue-100 shadow-sm active:scale-95"
                               >
                                 Details
                               </button>
                               <button 
                                 onClick={() => setShowConfirm(item.id)}
                                 className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                               >
                                 <FiTrash2 className="w-4 h-4" />
                               </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modern Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirm(null)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-white rounded-2xl p-8 shadow-2xl border border-gray-100 text-center"
            >
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FiTrash2 className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Remove Skill?</h3>
              <p className="text-sm text-gray-500 mb-8">
                Are you sure you want to remove this service expertise?
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(null)}
                  className="flex-1 py-3 rounded-xl bg-gray-100 text-sm font-bold text-gray-600 hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRemoveItem(showConfirm)}
                  disabled={isRemoving}
                  className="flex-1 py-3 rounded-xl bg-rose-600 text-sm font-bold text-white shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all"
                >
                  {isRemoving ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyServices;
