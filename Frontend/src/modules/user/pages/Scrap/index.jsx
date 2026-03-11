import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiMapPin, FiClock, FiCheckCircle, FiBell, FiArrowLeft, FiTrash2, FiCamera, FiX, FiLoader, FiImage } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../../../../services/api';
import { AnimatePresence, motion } from 'framer-motion';
import BottomNav from '../../components/layout/BottomNav';
import AddressSelectionModal from '../Checkout/components/AddressSelectionModal';
import { themeColors } from '../../../../theme';
import NotificationBell from '../../components/common/NotificationBell';
import { uploadToCloudinary } from '../../../../utils/cloudinaryUpload';
import flutterBridge from '../../../../utils/flutterBridge';

import { z } from "zod";

// Zod schema for Scrap
// Zod schema for Scrap
const scrapSchema = z.object({
  title: z.string().min(3, "Title too short"),
  description: z.string().optional(),
  address: z.object({
    addressLine1: z.string().min(5, "Address must be selected"),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    lat: z.any().optional(),
    lng: z.any().optional()
  }).refine((data) => data.addressLine1 && data.addressLine1.length > 0, { message: "Pickup address is required" })
});

const UserScrapPage = () => {
  // ... imports and basic state ...
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'
  const [scraps, setScraps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [houseNumber, setHouseNumber] = useState('');
  const [addressDetails, setAddressDetails] = useState(null);
  const [selectedScrap, setSelectedScrap] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    images: [],
    address: {
      addressLine1: '',
      city: '',
      state: '',
      pincode: ''
    }
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isFlutter, setIsFlutter] = useState(flutterBridge.isFlutter);
  const [showSourceSheet, setShowSourceSheet] = useState(false);

  // Sync flutter bridge state
  useEffect(() => {
    flutterBridge.waitForFlutter().then(ready => {
      setIsFlutter(ready);
    });
  }, []);

  const handleNativeCamera = async () => {
    const file = await flutterBridge.openCamera();
    if (file) {
      const newFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: 'idle'
      };
      setSelectedFiles(prev => [...prev, newFile]);
      flutterBridge.hapticFeedback('success');
    }
  };

  const handlePhotoClick = () => {
    setShowSourceSheet(true);
  };

  useEffect(() => {
    fetchMyScrap();
  }, []);

  const fetchMyScrap = async () => {
    try {
      setLoading(true);
      const res = await api.get('/scrap/my');
      if (res.data.success) {
        setScraps(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load scrap items');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 5) {
      return toast.error('Maximum 5 images allowed');
    }

    const newFiles = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: 'idle'
    }));

    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const removeImage = (index) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    // Zod Validation
    const validationResult = scrapSchema.safeParse(formData);
    if (!validationResult.success) {
      toast.error(validationResult.error.errors[0].message);
      return;
    }

    try {
      setIsUploading(true);
      toast.loading('Uploading images and listing items...', { id: 'scrap' });

      // 1. Upload images to Cloudinary
      const imageUrls = [];
      const updatedFiles = [...selectedFiles];

      for (let i = 0; i < updatedFiles.length; i++) {
        const item = updatedFiles[i];
        try {
          // Update status to uploading
          setSelectedFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'uploading' } : f));

          const url = await uploadToCloudinary(item.file, 'scrap_items', (pct) => {
            setSelectedFiles(prev => prev.map(f => f.id === item.id ? { ...f, progress: pct } : f));
          });

          imageUrls.push(url);
          setSelectedFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'done', progress: 100 } : f));
        } catch (err) {
          console.error('Image upload failed', err);
          setSelectedFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error' } : f));
          toast.error(`Failed to upload image ${i + 1}`);
        }
      }

      // Check if we have at least one image if images were selected
      if (selectedFiles.length > 0 && imageUrls.length === 0) {
        setIsUploading(false);
        toast.dismiss('scrap');
        return toast.error('Failed to upload images. Please try again.');
      }

      // 2. Prepare final data
      const finalData = {
        ...formData,
        images: imageUrls
      };

      const res = await api.post('/scrap', finalData);
      if (res.data.success) {
        toast.success('Scrap item listed!', { id: 'scrap' });
        setShowAddModal(false);
        setFormData({
          title: '', description: '',
          images: [],
          address: { addressLine1: '', city: '', state: '', pincode: '', lat: null, lng: null }
        });
        setSelectedFiles([]);
        setHouseNumber('');
        setAddressDetails(null);
        fetchMyScrap();
      }
    } catch (err) {
      toast.error('Failed to create listing', { id: 'scrap' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Prevent opening modal
    if (!window.confirm('Are you sure you want to delete this listing?')) return;

    try {
      toast.loading('Deleting listing...', { id: 'delete-scrap' });
      const res = await api.delete(`/scrap/${id}`);
      if (res.data.success) {
        toast.success('Listing deleted successfully', { id: 'delete-scrap' });
        setSelectedScrap(null);
        fetchMyScrap();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete listing', { id: 'delete-scrap' });
    }
  };
  const getAddressComponent = (components, type) => {
    return components?.find(c => c.types.includes(type))?.long_name || '';
  };

  const handleAddressSave = (savedHouseNumber, locationObj) => {
    setHouseNumber(savedHouseNumber);
    setAddressDetails(locationObj);

    // Update form data with detailed address components
    if (locationObj) {
      const components = locationObj.components;
      setFormData(prev => ({
        ...prev,
        address: {
          addressLine1: locationObj.address, // Full address string
          addressLine2: savedHouseNumber,
          city: getAddressComponent(components, 'locality') || getAddressComponent(components, 'administrative_area_level_2') || '',
          state: getAddressComponent(components, 'administrative_area_level_1') || '',
          pincode: getAddressComponent(components, 'postal_code') || '',
          lat: locationObj.lat,
          lng: locationObj.lng
        }
      }));
    }
    setShowAddressModal(false);
  };

  const activeScraps = scraps.filter(s => s.status === 'pending' || s.status === 'accepted');
  const historyScraps = scraps.filter(s => s.status === 'completed' || s.status === 'cancelled');

  // Inside return:
  return (
    <div className="min-h-screen pb-20 relative bg-white">
      {/* Refined Brand Mesh Gradient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0"
          style={{
            background: `
              radial-gradient(at 0% 0%, ${themeColors?.brand?.teal || '#347989'}25 0%, transparent 70%),
              radial-gradient(at 100% 0%, ${themeColors?.brand?.yellow || '#D68F35'}20 0%, transparent 70%),
              radial-gradient(at 100% 100%, ${themeColors?.brand?.orange || '#BB5F36'}15 0%, transparent 75%),
              radial-gradient(at 0% 100%, ${themeColors?.brand?.teal || '#347989'}10 0%, transparent 70%),
              radial-gradient(at 50% 50%, ${themeColors?.brand?.teal || '#347989'}03 0%, transparent 100%),
              #FFFFFF
            `
          }}
        />
        {/* Elegant Dot Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(${themeColors?.brand?.teal || '#347989'} 0.8px, transparent 0.8px)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Modern Glassmorphism Header */}
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/40 border-b border-black/[0.03] px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-black/[0.02]"
            >
              <FiArrowLeft className="w-5 h-5 text-gray-800" />
            </button>
            <div className="flex items-center gap-2">
              <FiTrash2 className="w-5 h-5" style={{ color: themeColors.button }} />
              <h1 className="text-xl font-extrabold text-gray-900">Sell Scrap</h1>
            </div>
          </div>
          <NotificationBell />
        </header>

        {/* Tabs */}
        <div className="flex bg-white border-b border-gray-200 mt-1">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'active'
              ? `border-[${themeColors.primary}] text-[${themeColors.primary}]`
              : 'border-transparent text-gray-500'
              }`}
            style={{ borderColor: activeTab === 'active' ? themeColors.button : 'transparent', color: activeTab === 'active' ? themeColors.button : undefined }}
          >
            Active Listings
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'history'
              ? `border-[${themeColors.primary}] text-[${themeColors.primary}]`
              : 'border-transparent text-gray-500'
              }`}
            style={{ borderColor: activeTab === 'history' ? themeColors.button : 'transparent', color: activeTab === 'history' ? themeColors.button : undefined }}
          >
            History
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 animate-pulse">
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-2">
                      <div className="h-4 w-20 bg-gray-200 rounded"></div>
                      <div className="h-5 w-40 bg-gray-200 rounded"></div>
                      <div className="h-3 w-32 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-6 w-16 bg-gray-200 rounded"></div>
                  </div>
                  <div className="pt-3 border-t border-gray-50 flex justify-between">
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (activeTab === 'active' ? activeScraps : historyScraps).length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FiPlus className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No items found</p>
              <p className="text-sm text-gray-400 mt-1">Add items to start selling</p>
            </div>
          ) : (
            (activeTab === 'active' ? activeScraps : historyScraps).map(item => (
              <div
                key={item._id}
                className="bg-white rounded-[24px] shadow-sm p-4 border border-gray-100 active:scale-[0.98] transition-all cursor-pointer overflow-hidden relative"
                onClick={() => setSelectedScrap(item)}
              >
                <div className="flex gap-4">
                  {item.images && item.images.length > 0 && (
                    <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-gray-50 bg-gray-50/50">
                      <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-extrabold text-gray-900 leading-tight line-clamp-1">{item.title}</h3>
                        <p className="text-xs font-medium text-gray-500 mt-1 line-clamp-1">{item.description}</p>
                      </div>
                      <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border
                        ${item.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : ''}
                        ${item.status === 'accepted' ? 'bg-green-50 text-green-600 border-green-100' : ''}
                        ${item.status === 'completed' ? 'bg-gray-100 text-gray-600 border-gray-200' : ''}
                        ${item.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-100' : ''}
                      `}>
                        {item.status}
                      </div>
                      {(item.status === 'pending' || item.status === 'cancelled') && (
                        <button
                          onClick={(e) => handleDelete(e, item._id)}
                          className="p-2 ml-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          title="Delete Listing"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-[11px] font-bold text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <FiClock className="w-3.5 h-3.5" />
                    <span>Listed on {new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                  {item.status === 'accepted' && (
                    <div className="flex items-center gap-1.5 text-green-600">
                      <FiCheckCircle className="w-3.5 h-3.5" />
                      <span>Pickup Confirmed</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* FAB */}
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-24 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-transform active:scale-95"
          style={{ backgroundColor: themeColors.button }}
        >
          <FiPlus className="w-7 h-7" />
        </button>

        {/* Add Modal */}
        {/* Add Modal */}
        <AnimatePresence>
          {showAddModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAddModal(false)}
                className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
              />
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 350 }}
                className="fixed bottom-20 left-4 right-4 bg-white rounded-[32px] z-50 max-h-[80vh] overflow-y-auto shadow-2xl border border-gray-100"
                onClick={e => e.stopPropagation()}
                style={{
                  boxShadow: '0 -20px 40px -15px rgba(0,0,0,0.1), 0 25px 50px -12px rgba(0,0,0,0.25)'
                }}
              >
                <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                  <h2 className="text-lg font-bold">Add Scrap Item</h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
                  >
                    <FiCheckCircle className="w-6 h-6 rotate-45" />
                  </button>
                </div>

                <form onSubmit={handleCreate} className="p-4 space-y-4 pb-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Title</label>
                    <input
                      type="text"
                      className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-1 focus:ring-primary-500"
                      placeholder="e.g. Old LG Split AC, Samsung Fridge"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>



                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-1 focus:ring-primary-500"
                      rows="2"
                      placeholder="Condition, model year, etc."
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  {/* Image Upload Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Item Images (Max 5)</label>
                    <div className="grid grid-cols-3 gap-3">
                      {selectedFiles.map((item, index) => (
                        <div key={item.id || index} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 group">
                          <img src={item.preview} alt="Preview" className="w-full h-full object-cover" />

                          {/* Upload Progress Overlay */}
                          {item.status === 'uploading' && (
                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-2">
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                                <div
                                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${item.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-[8px] text-white font-black">{item.progress}%</span>
                            </div>
                          )}

                          {item.status === 'done' && (
                            <div className="absolute top-1 left-1 bg-green-500 text-white rounded-full p-0.5">
                              <FiCheckCircle size={10} />
                            </div>
                          )}

                          {item.status === 'error' && (
                            <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                              <FiX className="text-red-500" />
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            disabled={isUploading}
                            className={`absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center transition-opacity ${isUploading ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}
                          >
                            <FiX size={14} />
                          </button>
                        </div>
                      ))}
                      {selectedFiles.length < 5 && !isUploading && (
                        <div
                          onClick={handlePhotoClick}
                          className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <FiCamera className="w-6 h-6 text-gray-400" />
                          <span className="text-[10px] font-bold text-gray-500 uppercase">Add Photo</span>
                          <input
                            id="scrap-photo-upload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={handleImageSelect}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Address Section - Matches Checkout */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <FiMapPin className="text-primary-600" /> Pickup Location
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowAddressModal(true)}
                        className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                        style={{ color: themeColors.button }}
                      >
                        {formData.address.addressLine1 ? 'Change' : 'Select'}
                      </button>
                    </div>

                    {formData.address.addressLine1 ? (
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <p className="font-medium text-gray-900 text-sm">{houseNumber ? `${houseNumber}, ` : ''}{formData.address.addressLine1.split(',')[0]}</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{formData.address.addressLine1}</p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowAddressModal(true)}
                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 text-sm font-medium hover:bg-gray-100 transition-colors"
                      >
                        + Select Pickup Address
                      </button>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={!formData.address.addressLine1 || isUploading}
                      className="w-full py-4 rounded-xl text-white font-bold shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                      style={{ backgroundColor: themeColors.button }}
                    >
                      {isUploading ? (
                        <>
                          <FiLoader className="animate-spin" />
                          <span>Listing Item...</span>
                        </>
                      ) : (
                        'List Item for Pickup'
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <AddressSelectionModal
          isOpen={showAddressModal}
          onClose={() => setShowAddressModal(false)}
          address={formData.address.addressLine1 || ''}
          houseNumber={houseNumber}
          onHouseNumberChange={setHouseNumber}
          onSave={handleAddressSave}
        />

        {/* User Scrap Details Modal */}
        <AnimatePresence>
          {selectedScrap && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedScrap(null)}
                className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-md"
              />
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 350 }}
                className="fixed bottom-20 left-4 right-4 bg-white rounded-[32px] z-[70] max-h-[85vh] overflow-y-auto shadow-2xl border border-gray-100 flex flex-col"
                onClick={e => e.stopPropagation()}
                style={{
                  boxShadow: '0 -25px 50px -12px rgba(0,0,0,0.5)'
                }}
              >
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-10">
                  <div className="flex flex-col">
                    <h2 className="text-xl font-black text-gray-900 leading-tight">{selectedScrap.title}</h2>
                  </div>
                  <button
                    onClick={() => setSelectedScrap(null)}
                    className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 active:scale-90 transition-all"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Images */}
                  {selectedScrap.images && selectedScrap.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {selectedScrap.images.map((img, i) => (
                        <div key={i} className={`rounded-3xl overflow-hidden border border-gray-100 ${i === 0 && selectedScrap.images.length % 2 !== 0 ? 'col-span-2 aspect-video' : 'aspect-square'}`}>
                          <img src={img} alt="Scrap" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}



                  {/* Status Badge */}
                  <div className={`p-4 rounded-3xl border text-center font-black uppercase tracking-widest text-xs
                    ${selectedScrap.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : ''}
                    ${selectedScrap.status === 'accepted' ? 'bg-green-50 text-green-600 border-green-100' : ''}
                    ${selectedScrap.status === 'completed' ? 'bg-gray-50 text-gray-500 border-gray-200' : ''}
                  `}>
                    Status: {selectedScrap.status}
                  </div>

                  {/* Description */}
                  {selectedScrap.description && (
                    <div className="bg-blue-50/30 p-5 rounded-3xl border border-blue-100/30 italic">
                      <p className="text-gray-600 font-medium leading-relaxed">"{selectedScrap.description}"</p>
                    </div>
                  )}

                  {/* Location */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                      <FiMapPin className="text-red-500" /> Pickup Address
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                      <p className="font-bold text-gray-800">{selectedScrap.address?.addressLine1}</p>
                      <p className="text-xs text-gray-400 mt-1 uppercase font-bold">{selectedScrap.address?.city}, {selectedScrap.address?.state}</p>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-[10px] font-black uppercase text-gray-400 tracking-wider">
                    <span className="flex items-center gap-1"><FiClock /> Posted {new Date(selectedScrap.createdAt).toLocaleDateString()}</span>
                    {selectedScrap.status === 'accepted' && <span className="text-green-600">Vendor Assigned</span>}
                  </div>
                </div>

                <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex gap-3">
                  <button
                    onClick={() => setSelectedScrap(null)}
                    className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all"
                  >
                    Back to Listings
                  </button>
                  {(selectedScrap.status === 'pending' || selectedScrap.status === 'cancelled') && (
                    <button
                      onClick={(e) => handleDelete(e, selectedScrap._id)}
                      className="px-6 py-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all flex items-center gap-2"
                    >
                      <FiTrash2 />
                      Delete
                    </button>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Hide bottom nav when modal is open to prevent z-index issues / clutter */}
      </div>

      {/* Photo Source Selection - Mobile Styled Bottom Sheet */}
      <AnimatePresence>
        {showSourceSheet && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSourceSheet(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative bg-white w-full rounded-t-[32px] p-6 pb-12 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-10"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-bold text-gray-900 text-lg">Select Photo Source</h4>
                <button 
                  onClick={() => setShowSourceSheet(false)}
                  className="p-2 bg-gray-100 rounded-full text-gray-500"
                >
                  <FiX />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Camera Option */}
                <button
                  type="button"
                  onClick={() => {
                    setShowSourceSheet(false);
                    if (isFlutter) {
                      handleNativeCamera();
                    } else {
                      document.getElementById('scrap-photo-upload')?.click();
                    }
                  }}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-teal-100 active:scale-95 transition-all"
                  style={{ backgroundColor: `${themeColors.button}10` }}
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg"
                    style={{ backgroundColor: themeColors.button }}
                  >
                    <FiCamera className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-teal-800 text-sm">Take Photo</span>
                </button>

                {/* Gallery Option */}
                <button
                  type="button"
                  onClick={() => {
                    setShowSourceSheet(false);
                    document.getElementById('scrap-photo-upload')?.click();
                  }}
                  className="flex flex-col items-center gap-3 p-6 bg-blue-50 rounded-2xl border border-blue-100 active:scale-95 transition-all"
                >
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <FiImage className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-blue-800 text-sm">Gallery</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div >
  );
};

export default UserScrapPage;
