import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineSearch, HiX, HiChevronRight, HiOutlineFilter } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import api from '../../../../services/api';
import { themeColors } from '../../../../theme';

const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      const saved = localStorage.getItem('recentSearches');
      if (saved) setRecentSearches(JSON.parse(saved));
    }
  }, [isOpen]);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (query.length >= 2) {
        try {
          setLoading(true);
          const response = await api.get(`/public/catalog/search?q=${query}`);
          if (response.data.success) {
            setResults(response.data.results);
          }
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleResultClick = (result) => {
    // Save to recent searches
    const updatedRecent = [
      result.title,
      ...recentSearches.filter(s => s !== result.title)
    ].slice(0, 5);
    setRecentSearches(updatedRecent);
    localStorage.setItem('recentSearches', JSON.stringify(updatedRecent));

    onClose();
    if (result.type === 'category') {
      navigate(`/user/brands?categoryId=${result.id}`);
    } else {
      navigate(`/user/brands/${result.slug}`);
    }
  };

  const handleRecentClick = (term) => {
    setQuery(term);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-start sm:justify-center px-4 pt-20 sm:pt-0">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
          />

          {/* Search Content */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: '80vh' }}
          >
            {/* Input Header */}
            <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100">
              <HiOutlineSearch className="w-6 h-6 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for services, brands or categories..."
                className="flex-1 text-lg font-medium text-gray-900 outline-none placeholder:text-gray-400"
              />
              {query && (
                <button 
                  onClick={() => setQuery('')}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-400"
                >
                  <HiX className="w-5 h-5" />
                </button>
              )}
              <div className="h-6 w-px bg-gray-200 hidden sm:block mx-2" />
              <button 
                onClick={onClose}
                className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors hidden sm:block"
              >
                Esc
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: `${themeColors.primary} transparent ${themeColors.primary} ${themeColors.primary}` }} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Searching Catalog...</p>
                </div>
              ) : query.length < 2 ? (
                /* Recent Searches & Suggestions */
                <div className="space-y-8">
                  {recentSearches.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 px-2">Recent Searches</h4>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((term, i) => (
                          <button
                            key={i}
                            onClick={() => handleRecentClick(term)}
                            className="px-4 py-2 rounded-xl bg-gray-50 border border-gray-100 text-[13px] font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 px-2">Popular Categories</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {['Cleaning', 'Electrician', 'Plumber', 'Beauty'].map((cat, i) => (
                        <button
                          key={i}
                          onClick={() => setQuery(cat)}
                          className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100 group hover:border-blue-100 transition-all"
                        >
                          <span className="text-sm font-bold text-gray-800">{cat}</span>
                          <HiChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : results.length === 0 ? (
                /* No Results */
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                    <HiOutlineSearch className="w-8 h-8 text-gray-200" />
                  </div>
                  <h3 className="text-lg font-black text-gray-800">No results found</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Try searching for something else</p>
                </div>
              ) : (
                /* Search Results */
                <div className="space-y-6">
                  {/* Categorized Results */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 px-2">Best Matches</h4>
                    <div className="space-y-2">
                      {results.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleResultClick(result)}
                          className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100 group"
                        >
                          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                            {result.icon ? (
                              <img src={result.icon} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <HiOutlineSearch className="w-5 h-5 text-gray-300" />
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className="text-[15px] font-black text-gray-900">{result.title}</span>
                              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                                result.type === 'category' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'
                              }`}>
                                {result.type}
                              </span>
                            </div>
                            {result.description && (
                              <p className="text-[10px] text-gray-400 font-medium truncate max-w-[200px] mt-0.5">
                                {result.description}
                              </p>
                            )}
                          </div>
                          <HiChevronRight className="w-5 h-5 text-gray-300 group-hover:text-black group-hover:translate-x-1 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[9px] font-bold text-gray-400 uppercase tracking-widest">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-200 shadow-sm text-gray-900">Enter</kbd>
                  to select
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-200 shadow-sm text-gray-900">↑↓</kbd>
                  to navigate
                </span>
              </div>
              <div className="flex items-center gap-1">
                Powered by <span className="text-black font-black">Nexora AI</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SearchModal;
