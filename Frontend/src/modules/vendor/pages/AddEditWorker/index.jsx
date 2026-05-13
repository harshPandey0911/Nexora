import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSave, FiX, FiLink, FiUserPlus, FiSearch, FiChevronDown, FiCamera, FiUpload, FiMapPin, FiPlusCircle, FiCheck, FiUser } from 'react-icons/fi';
import AddressSelectionModal from '../../../user/pages/Checkout/components/AddressSelectionModal';
import { vendorTheme as themeColors } from '../../../../theme';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
import { createWorker, updateWorker, getWorkerById, linkWorker } from '../../services/workerService';
import { publicCatalogService } from '../../../../services/catalogService';
import { toast } from 'react-hot-toast';
import { z } from "zod";

// Zod schemas
const addWorkerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().regex(/^\d{10}$/, "Enter valid 10-digit phone number"),
  serviceCategories: z.array(z.string()).min(1, "Select at least one category"),
  aadhar: z.object({
    number: z.string().regex(/^\d{12}$/, "Aadhar must be 12 digits"),
    // document: z.any() 
  }),
  // address: z.any().optional() // Make address optional or strict as needed
});

const editWorkerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().regex(/^\d{10}$/, "Enter valid 10-digit phone number"),
  serviceCategories: z.array(z.string()).min(1, "Select at least one category"),
});

const AddEditWorker = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'link'
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    aadhar: {
      number: '',
      document: '' // Base64 string ideally
    },
    serviceCategories: [],
    address: {
      addressLine1: '',
      city: '',
      state: '',
      pincode: ''
    },
    status: 'active',
    profilePhoto: '', // URL
  });

  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [aadharFile, setAadharFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const [linkPhone, setLinkPhone] = useState('');

  const [errors, setErrors] = useState({});

  useLayoutEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    const bgStyle = themeColors.backgroundGradient;

    if (html) html.style.background = bgStyle;
    if (body) body.style.background = bgStyle;
    if (root) root.style.background = bgStyle;

    return () => {
      if (html) html.style.background = '';
      if (body) body.style.background = '';
      if (root) root.style.background = '';
    };
  }, []);

  useEffect(() => {
    const initData = async () => {
      try {
        const catRes = await publicCatalogService.getCategories();
        if (catRes.success) {
          console.log('Loaded Categories:', catRes.categories || []);
          setCategories(catRes.categories || []);
        }

        if (isEdit) {
          setLoading(true);
          const res = await getWorkerById(id);
          if (res.success) {
            const w = res.data;
            setFormData({
              name: w.name || '',
              phone: w.phone || '',
              email: w.email || '',
              aadhar: {
                number: w.aadhar?.number || '',
                document: w.aadhar?.document || ''
              },
              serviceCategories: w.serviceCategories || (w.serviceCategory ? [w.serviceCategory] : []),
              address: {
                addressLine1: w.address?.addressLine1 || '',
                city: w.address?.city || '',
                state: w.address?.state || '',
                pincode: w.address?.pincode || ''
              },
              status: w.status || 'active',
              profilePhoto: w.profilePhoto || ''
            });

            if (w.profilePhoto) {
              setPhotoPreview(w.profilePhoto);
            }
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Init error:', error);
        toast.error('Failed to load data');
        setLoading(false);
      }
    };
    initData();
  }, [id, isEdit]);

  // Upload file helper
  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    let baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    if (!baseUrl) {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        baseUrl = 'http://localhost:5000';
      } else {
        baseUrl = window.location.origin;
      }
    }
    baseUrl = baseUrl.replace(/\/api$/, '');
    const response = await fetch(`${baseUrl}/api/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Upload failed');
    return data.imageUrl;
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleAadharChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      setAadharFile(file);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const toggleCategory = (val) => {
    setFormData(prev => {
      const serviceCategories = prev.serviceCategories.includes(val)
        ? prev.serviceCategories.filter(c => c !== val)
        : [...prev.serviceCategories, val];

      return {
        ...prev,
        serviceCategories
      };
    });
  };

  const handleAddressSave = (houseNumber, location) => {
    let city = '';
    let state = '';
    let pincode = '';
    let addressLine2 = '';

    if (location.components) {
      location.components.forEach(comp => {
        if (comp.types.includes('locality')) city = comp.long_name;
        if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
        if (comp.types.includes('postal_code')) pincode = comp.long_name;
        if (comp.types.includes('sublocality')) addressLine2 = comp.long_name;
      });
    }

    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        addressLine1: houseNumber,
        addressLine2: addressLine2,
        city: city,
        state: state,
        pincode: pincode,
        fullAddress: location.address
      }
    }));
    setIsAddressModalOpen(false);
  };

  // toggleSkill removed


  const handleSubmit = async () => {
    // Zod Validation depending on mode
    const schema = isEdit ? editWorkerSchema : addWorkerSchema;

    // Construct validation object
    const validationData = {
      name: formData.name,
      phone: formData.phone,
      serviceCategories: formData.serviceCategories,
      ...(isEdit ? {} : { aadhar: { number: formData.aadhar.number } })
    };

    const validationResult = schema.safeParse(validationData);

    if (!validationResult.success) {
      toast.error(validationResult.error.errors[0].message);
      return;
    }

    // Additional manual check for Aadhar doc on 'new'
    if (!isEdit && !formData.aadhar.document && !aadharFile) {
      toast.error("Aadhar document is required");
      return;
    }

    try {
      setLoading(true);
      setUploading(true);

      let photoUrl = formData.profilePhoto;
      let aadharUrl = formData.aadhar.document;

      // Upload photo if selected
      if (photoFile) {
        try {
          photoUrl = await uploadFile(photoFile);
        } catch (err) {
          console.error('Photo upload failed:', err);
          toast.error('Failed to upload profile photo');
          setLoading(false);
          setUploading(false);
          return;
        }
      }

      // Upload Aadhar if selected
      if (aadharFile) {
        try {
          aadharUrl = await uploadFile(aadharFile);
        } catch (err) {
          console.error('Aadhar upload failed:', err);
          toast.error('Failed to upload Aadhar document');
          setLoading(false);
          setUploading(false);
          return;
        }
      }

      // Clean payload
      const payload = {
        ...formData,
        profilePhoto: photoUrl,
        aadhar: {
          ...formData.aadhar,
          document: aadharUrl || 'pending_upload' // Ensure strictly that we have something
        }
      };

      if (!payload.aadhar.document && !isEdit) {
        // Should have been caught by validation, but double check
        // If still empty and no file, maybe error?
        // For now let backend handle it or user re-try
      }

      if (isEdit) {
        await updateWorker(id, payload);
        toast.success('Worker updated');
      } else {
        await createWorker(payload);
        toast.success('Worker added');
      }
      window.dispatchEvent(new Event('vendorWorkersUpdated'));
      navigate('/vendor/workers');
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleLinkWorker = async () => {
    if (!linkPhone.trim() || linkPhone.length < 10) {
      toast.error('Enter valid phone number');
      return;
    }
    try {
      setLoading(true);
      await linkWorker(linkPhone);
      toast.success('Worker linked successfully!');
      window.dispatchEvent(new Event('vendorWorkersUpdated'));
      navigate('/vendor/workers');
    } catch (error) {
      console.error('Link error:', error);
      toast.error(error.response?.data?.message || 'Failed to link worker');
    } finally {
      setLoading(false);
    }
  };

  // selectedCategoriesData and allAvailableSkills removed as they are no longer needed

  return (
    <div className="min-h-screen pb-28 relative" style={{ background: '#FFFFFF' }}>
      {/* Premium Background Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0"
          style={{
            background: `
              radial-gradient(at 0% 0%, rgba(13, 148, 136, 0.1) 0%, transparent 70%),
              radial-gradient(at 100% 100%, rgba(13, 148, 136, 0.05) 0%, transparent 75%),
              #F8FAFC
            `
          }}
        />
      </div>

      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/40 border-b border-black/[0.03] px-6 py-5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white rounded-xl shadow-sm border border-black/[0.02] flex items-center justify-center cursor-pointer"
          >
            <FiX className="w-5 h-5 text-gray-900" />
          </motion.button>
          <h1 className="text-xl font-[1000] text-gray-900 tracking-tight">{isEdit ? 'Edit Worker' : 'New Worker'}</h1>
        </div>
        <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-black/[0.02] flex items-center justify-center">
          <FiUserPlus className="w-5 h-5 text-teal-600" />
        </div>
      </header>

      <main className="px-5 pt-8 relative z-10 max-w-lg mx-auto">
        {/* Tabs (Premium Theme) */}
        {!isEdit && (
          <div className="flex bg-white/50 backdrop-blur-md rounded-[24px] p-1.5 mb-10 border border-white shadow-sm">
            <button
              onClick={() => setActiveTab('new')}
              className={`flex-1 py-3.5 rounded-[20px] text-[10px] font-[1000] uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-2 ${activeTab === 'new'
                ? 'bg-teal-600 text-white shadow-xl shadow-teal-900/20'
                : 'text-black hover:text-teal-600'
                }`}
            >
              <FiUserPlus className="w-4 h-4" />
              Direct Entry
            </button>
            <button
              onClick={() => setActiveTab('link')}
              className={`flex-1 py-3.5 rounded-[20px] text-[10px] font-[1000] uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-2 ${activeTab === 'link'
                ? 'bg-teal-600 text-white shadow-xl shadow-teal-900/20'
                : 'text-black hover:text-teal-600'
                }`}
            >
              <FiLink className="w-4 h-4" />
              Link Phone
            </button>
          </div>
        )}

        {/* Link Existing Mode (Premium Theme) */}
        {activeTab === 'link' && !isEdit && (
          <div className="bg-white/70 backdrop-blur-md rounded-[40px] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white/60 text-center space-y-8">
            <div className="w-24 h-24 rounded-[32px] bg-teal-50 flex items-center justify-center mx-auto mb-2 border border-teal-100/50 text-teal-600 shadow-sm">
              <FiSearch className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-[1000] text-gray-900 tracking-tight mb-3">Sync Existing Worker</h3>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-tighter leading-relaxed px-4 opacity-70">
                Enter the verified phone number to instantly authorize a registered worker.
              </p>
            </div>

            <div className="pt-2">
              <input
                type="tel"
                value={linkPhone}
                onChange={(e) => setLinkPhone(e.target.value)}
                placeholder="0000000000"
                className="w-full px-8 py-6 bg-white/50 border border-gray-100 rounded-[28px] focus:border-teal-500/30 focus:bg-white outline-none text-center text-3xl font-[1000] tracking-[0.2em] text-gray-900 shadow-inner"
                maxLength={10}
              />
            </div>

            <button
              onClick={handleLinkWorker}
              disabled={loading}
              className="w-full py-5.5 text-white rounded-[28px] font-[1000] text-[11px] uppercase tracking-[0.25em] bg-black shadow-2xl shadow-black/10 active:scale-95 transition-all flex items-center justify-center gap-3 mt-6"
            >
              {loading ? 'Searching...' : 'Search & Authorize'}
            </button>
          </div>
        )}

        {/* Create / Edit Mode (Premium Theme) */}
        {(activeTab === 'new' || isEdit) && (
          <div className="space-y-10 pb-10">

            {/* Profile Photo Upload */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-[48px] overflow-hidden border-4 border-white shadow-2xl bg-white flex items-center justify-center group relative">
                  {photoPreview || formData.profilePhoto ? (
                    <img
                      src={photoPreview || formData.profilePhoto}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-teal-100">
                      <FiUserPlus className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-teal-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <FiCamera className="text-white w-7 h-7" />
                  </div>
                  <input
                    id="worker-photo-upload"
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handlePhotoChange}
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-11 h-11 bg-teal-600 rounded-2xl flex items-center justify-center shadow-xl border-4 border-white text-white">
                  <FiPlusCircle className="w-5 h-5" />
                </div>
              </div>
              <p className="text-teal-600/40 text-[9px] font-[1000] uppercase tracking-[0.3em] mt-7">Worker Snapshot</p>
            </div>

            {/* Basic Info */}
            <div className="bg-white/70 backdrop-blur-md rounded-[40px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white/60 space-y-8">
              <h4 className="text-[10px] font-[1000] text-gray-400 uppercase tracking-[0.25em]">Personal Details</h4>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-[1000] text-gray-400 uppercase tracking-widest ml-1">Full Identity</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="NAME"
                    className="w-full px-6 py-4.5 bg-white border border-black/[0.03] rounded-2xl focus:border-teal-500/30 focus:ring-4 focus:ring-teal-500/5 outline-none text-[13px] font-black text-gray-900 uppercase tracking-widest transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-[1000] text-gray-400 uppercase tracking-widest ml-1">Phone Line</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="0000000000"
                    className="w-full px-6 py-4.5 bg-white border border-black/[0.03] rounded-2xl focus:border-teal-500/30 focus:ring-4 focus:ring-teal-500/5 outline-none text-[13px] font-black text-gray-900 tracking-[0.25em] transition-all"
                    maxLength={10}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-[1000] text-gray-400 uppercase tracking-widest ml-1">Email Contact</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="OPTIONAL"
                    className="w-full px-6 py-4.5 bg-white border border-black/[0.03] rounded-2xl focus:border-teal-500/30 focus:ring-4 focus:ring-teal-500/5 outline-none text-[13px] font-black text-gray-900 uppercase tracking-widest transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Address Info */}
            <div className="bg-white/70 backdrop-blur-md rounded-[40px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white/60 space-y-8">
              <h4 className="text-[10px] font-[1000] text-gray-400 uppercase tracking-[0.25em]">Operational Node</h4>

              <div className="p-6 bg-teal-50/50 rounded-[32px] border border-teal-100/30 flex items-start gap-4">
                <FiMapPin className="text-teal-600 w-5 h-5 mt-0.5" />
                <p className="text-[12px] font-black text-gray-900 leading-relaxed tracking-tight">
                  {formData.address?.fullAddress ||
                    (formData.address?.addressLine1 ? `${formData.address.addressLine1}, ${formData.address.city}` : 'ADDRESS NOT ASSIGNED')
                  }
                </p>
              </div>

              <button
                onClick={() => setIsAddressModalOpen(true)}
                className="w-full py-4.5 bg-white text-gray-900 rounded-2xl font-[1000] text-[10px] uppercase tracking-widest border border-black/[0.05] hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                Set Location Coordinates
              </button>
            </div>

            {/* Work Profile */}
            <div className="bg-white/70 backdrop-blur-md rounded-[40px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white/60 space-y-8">
              <h4 className="text-[10px] font-[1000] text-gray-400 uppercase tracking-[0.25em]">Expertise Profile</h4>

              {/* Category Dropdown */}
              <div>
                <label className="text-[9px] font-[1000] text-gray-400 uppercase tracking-widest mb-3 block ml-1">Specializations</label>
                <div className="relative">
                  <button
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className="w-full px-6 py-4.5 bg-white rounded-2xl border border-black/[0.03] flex items-center justify-between focus:border-teal-500/30 outline-none shadow-sm"
                  >
                    <span className={`text-[12px] font-black uppercase tracking-widest truncate ${formData.serviceCategories.length > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                      {formData.serviceCategories.length > 0
                        ? `${formData.serviceCategories.length} Categories Selected`
                        : 'Select Skillsets'}
                    </span>
                    <FiChevronDown className={`w-5 h-5 text-teal-600 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isCategoryOpen && (
                    <>
                      <div className="fixed inset-0 z-10 bg-transparent" onClick={() => setIsCategoryOpen(false)} />
                      <div className="absolute z-20 w-full mt-4 bg-white/95 backdrop-blur-xl rounded-[32px] shadow-2xl border border-black/[0.03] max-h-72 overflow-y-auto p-3">
                        {categories.length > 0 ? (
                          categories.map(cat => (
                            <button
                              key={cat._id}
                              onClick={() => toggleCategory(cat.title)}
                              className="w-full text-left px-6 py-4.5 hover:bg-teal-50/50 rounded-2xl transition-all border-b border-black/[0.02] last:border-0 flex items-center justify-between group"
                            >
                              <span className="text-[11px] font-[1000] text-gray-900 uppercase tracking-widest group-hover:translate-x-1 transition-transform">{cat.title}</span>
                              {formData.serviceCategories.includes(cat.title) && (
                                <div className="w-2.5 h-2.5 rounded-full bg-teal-600 shadow-lg shadow-teal-900/20" />
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="px-6 py-5 text-gray-300 text-[10px] font-black uppercase tracking-widest text-center">No categories found</div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Selected Categories Tags */}
                {formData.serviceCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 mt-5">
                    {formData.serviceCategories.map((cat, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-4 py-2 bg-teal-50 text-teal-700 rounded-xl text-[9px] font-[1000] uppercase tracking-widest border border-teal-100"
                      >
                        {cat}
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleCategory(cat); }}
                          className="ml-2.5 text-teal-300 hover:text-teal-600 transition-colors"
                        >
                          <FiX className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Documents */}
            {!isEdit && (
              <div className="bg-white/70 backdrop-blur-md rounded-[40px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white/60 space-y-8">
                <h4 className="text-[10px] font-[1000] text-gray-400 uppercase tracking-[0.25em]">Identity Verification</h4>
                <div className="space-y-2">
                  <label className="text-[9px] font-[1000] text-gray-400 uppercase tracking-widest ml-1">Aadhar Identification</label>
                  <input
                    type="text"
                    value={formData.aadhar.number}
                    onChange={(e) => handleInputChange('aadhar.number', e.target.value)}
                    placeholder="0000 0000 0000"
                    className="w-full px-6 py-4.5 bg-white border border-black/[0.03] rounded-2xl focus:border-teal-500/30 focus:bg-white outline-none text-[14px] font-black text-gray-900 tracking-[0.4em] transition-all"
                    maxLength={12}
                  />
                </div>

                <div className="border-2 border-dashed border-teal-100 rounded-[36px] p-12 text-center transition-all hover:border-teal-400 bg-teal-50/20 group cursor-pointer relative overflow-hidden">
                  <div className="absolute inset-0 bg-teal-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <input
                    id="worker-aadhar-upload"
                    type="file"
                    accept="image/*,.pdf"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleAadharChange}
                  />
                  <div className="flex flex-col items-center relative z-10">
                    {aadharFile ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-teal-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-teal-900/20">
                          <FiCheck className="w-7 h-7" />
                        </div>
                        <span className="text-[10px] font-[1000] text-gray-900 uppercase tracking-widest truncate max-w-[200px]">{aadharFile.name}</span>
                      </div>
                    ) : formData.aadhar.document && formData.aadhar.document !== 'data:image/png;base64,placeholder' ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-white border border-teal-100 text-teal-600 rounded-2xl flex items-center justify-center shadow-sm">
                          <FiUpload className="w-7 h-7" />
                        </div>
                        <p className="text-[10px] font-[1000] text-teal-600 uppercase tracking-widest">Document Verified</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-white border border-teal-50 text-teal-200 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm">
                          <FiUpload className="w-7 h-7" />
                        </div>
                        <span className="text-[10px] font-[1000] text-gray-400 uppercase tracking-widest">Upload Digital Identity</span>
                        <span className="text-[8px] font-black text-teal-300 mt-2 uppercase tracking-[0.2em]">Government Issued ID</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-6 text-white rounded-[32px] font-[1000] text-[13px] uppercase tracking-[0.35em] shadow-2xl shadow-teal-900/20 active:scale-95 transition-all flex items-center justify-center gap-4 bg-teal-600"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (isEdit ? 'Update Credentials' : 'Authorize Deployment')}
            </button>
          </div >
        )}
      </main >

      <AddressSelectionModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        address={formData.address?.fullAddress || ''}
        houseNumber={formData.address?.addressLine1 || ''}
        onHouseNumberChange={(val) => handleInputChange('address.addressLine1', val)}
        onSave={handleAddressSave}
      />

      <BottomNav />
    </div >
  );
};

export default AddEditWorker;
