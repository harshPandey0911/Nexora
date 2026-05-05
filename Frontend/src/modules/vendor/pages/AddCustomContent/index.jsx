import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiBox, FiGrid, FiArrowLeft, FiSave, FiImage, FiType, FiDollarSign } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { vendorTheme as themeColors } from '../../../../theme';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
import vendorService from '../../services/vendorService';
import { serviceService } from '../../../../services/catalogService';
import { toast } from 'react-hot-toast';
import { toAssetUrl } from '../../../../modules/admin/pages/UserCategories/utils';

const AddCustomContent = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('category'); // 'category' or 'product'
  const [loading, setLoading] = useState(false);
  const [myCategories, setMyCategories] = useState([]);
  
  // Form States
  const [categoryForm, setCategoryForm] = useState({
    title: '',
    description: '',
    imageUrl: '',
    homeIconUrl: ''
  });
  const [uploading, setUploading] = useState(false);

  const [productForm, setProductForm] = useState({
    title: '',
    description: '',
    basePrice: '',
    categoryId: '',
    iconUrl: ''
  });

  useEffect(() => {
    fetchMyContent();
  }, []);

  const fetchMyContent = async () => {
    try {
      const res = await vendorService.getMyCustomContent();
      if (res.success) {
        setMyCategories(res.data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await vendorService.addVendorCategory(categoryForm);
      if (res.success) {
        toast.success('Category added successfully!');
        setCategoryForm({ title: '', description: '', imageUrl: '', homeIconUrl: '' });
        fetchMyContent();
        setActiveTab('product'); // Switch to product to add items under this category
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add category');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const folder = 'vendor-custom-content';
      const res = await serviceService.uploadImage(file, folder);
      if (res.success) {
        setCategoryForm(prev => ({ ...prev, imageUrl: res.imageUrl, homeIconUrl: res.imageUrl }));
        toast.success('Image uploaded successfully!');
      }
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleProductImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const folder = 'vendor-custom-services';
      const res = await serviceService.uploadImage(file, folder);
      if (res.success) {
        setProductForm(prev => ({ ...prev, iconUrl: res.imageUrl }));
        toast.success('Product image uploaded successfully!');
      }
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await vendorService.addVendorService(productForm);
      if (res.success) {
        toast.success('Product/Service added successfully!');
        setProductForm({ title: '', description: '', basePrice: '', categoryId: '', iconUrl: '' });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: themeColors.backgroundGradient }}>
      <Header title="Add New Offering" showBack={true} />

      <main className="px-4 py-6 max-w-lg mx-auto">
        {/* Tab Switcher */}
        <div className="flex bg-white/40 backdrop-blur-md rounded-[2rem] p-1.5 mb-8 border border-white/40 shadow-inner">
          <button
            onClick={() => setActiveTab('category')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              activeTab === 'category' 
                ? 'bg-white text-teal-600 shadow-md' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <FiGrid className="w-4 h-4" />
            Category
          </button>
          <button
            onClick={() => setActiveTab('product')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              activeTab === 'product' 
                ? 'bg-white text-teal-600 shadow-md' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <FiBox className="w-4 h-4" />
            Product/Service
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'category' ? (
            <motion.div
              key="category-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/40 shadow-xl"
            >
              <div className="mb-6">
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Create Category</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Group your services together</p>
              </div>

              <form onSubmit={handleAddCategory} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Category Title</label>
                  <div className="relative">
                    <FiType className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="e.g. Home Decor, Special Repair"
                      value={categoryForm.title}
                      onChange={(e) => setCategoryForm({ ...categoryForm, title: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-teal-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Description</label>
                  <textarea
                    placeholder="Describe what this category covers..."
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-teal-500 transition-all min-h-[100px]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Category Image / Icon</label>
                  <div className="space-y-4">
                    <div className="relative group">
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 group-hover:border-teal-500 transition-all cursor-pointer relative overflow-hidden">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploading}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                          {uploading ? (
                            <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FiImage className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-gray-700 uppercase tracking-wider">
                            {categoryForm.imageUrl ? 'Change Image' : 'Upload Image'}
                          </p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">JPG, PNG up to 5MB</p>
                        </div>
                      </div>
                    </div>

                    {categoryForm.imageUrl && (
                      <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-lg">
                        <img 
                          src={toAssetUrl(categoryForm.imageUrl)} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setCategoryForm(prev => ({ ...prev, imageUrl: '', homeIconUrl: '' }))}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-md"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-teal-600 text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-teal-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? 'Processing...' : (
                    <>
                      <FiSave className="w-4 h-4" />
                      Save Category
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="product-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/40 shadow-xl"
            >
              <div className="mb-6">
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Create Product/Service</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Add individual bookable items</p>
              </div>

              <form onSubmit={handleAddProduct} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Select Category</label>
                  <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-teal-500 transition-all appearance-none"
                    required
                  >
                    <option value="">Choose a category</option>
                    {myCategories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Service Title</label>
                  <div className="relative">
                    <FiType className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="e.g. Full House Painting"
                      value={productForm.title}
                      onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-teal-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Base Price (₹)</label>
                  <div className="relative">
                    <FiDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      placeholder="0.00"
                      value={productForm.basePrice}
                      onChange={(e) => setProductForm({ ...productForm, basePrice: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-teal-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Service Icon / Image</label>
                  <div className="space-y-4">
                    <div className="relative group">
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 group-hover:border-teal-500 transition-all cursor-pointer relative overflow-hidden">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProductImageUpload}
                          disabled={uploading}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                          {uploading ? (
                            <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FiImage className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-gray-700 uppercase tracking-wider">
                            {productForm.iconUrl ? 'Change Image' : 'Upload Image'}
                          </p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">JPG, PNG up to 5MB</p>
                        </div>
                      </div>
                    </div>

                    {productForm.iconUrl && (
                      <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-lg">
                        <img 
                          src={toAssetUrl(productForm.iconUrl)} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setProductForm(prev => ({ ...prev, iconUrl: '' }))}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-md"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-teal-600 text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-teal-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? 'Processing...' : (
                    <>
                      <FiSave className="w-4 h-4" />
                      Save Product
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Existing Content Preview */}
        <div className="mt-12">
          <div className="flex items-center gap-2 mb-6 px-1">
            <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Your Current Offerings</h2>
          </div>
          
          {myCategories.length === 0 ? (
            <div className="text-center py-10 bg-white/30 rounded-[2rem] border border-dashed border-white/50">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nothing added yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myCategories.map(cat => (
                <div key={cat._id} className="bg-white/60 backdrop-blur-md rounded-3xl p-4 border border-white/40 shadow-sm">
                  <h4 className="text-sm font-black text-gray-800">{cat.title}</h4>
                  <p className="text-[10px] text-gray-500 mt-1">{cat.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default AddCustomContent;
