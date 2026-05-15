import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiStar, FiUser, FiMessageSquare, FiFilter, FiLoader } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { vendorTheme as themeColors } from '../../../../theme';
import { getRatings } from '../../services/bookingService';

const MyRatings = () => {
  const navigate = useNavigate();
  const [ratings, setRatings] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  const fetchRatings = async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await getRatings({ page, limit: 10 });
      if (response.success) {
        setRatings(response.data);
        setStats(response.stats);
        setPagination(response.pagination);
      } else {
        toast.error(response.message || 'Failed to fetch ratings');
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
      toast.error('Failed to load ratings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const RatingBar = ({ star, count, total }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 w-8">
          <span className="text-xs font-bold text-gray-600">{star}</span>
          <FiStar className="w-3 h-3 text-black fill-black" />
        </div>
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-black rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs font-medium text-gray-400 w-8 text-right">{count}</span>
      </div>
    );
  };

  if (isLoading && pagination.page === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiLoader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-6" />
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em]">Analyzing Feedback Ecosystem...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header - White Style */}
      <div className="bg-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between text-gray-900 border border-gray-100 gap-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none">
            Reputation Hub
          </h2>
          <p className="text-gray-500 text-[11px] font-medium mt-2">
            Monitor service quality and operational feedback scores
          </p>
        </div>
        <div className="w-12 h-12 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center shadow-inner group transition-all">
          <FiStar className="w-6 h-6 text-amber-400 fill-amber-400/20 group-hover:fill-amber-400 transition-all" />
        </div>
      </div>

      {/* Overall Rating Stats */}
      {stats && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[80px] -mr-32 -mt-32" />
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative z-10">
            <div className="md:col-span-2 flex flex-col items-center justify-center md:border-r border-gray-100">
              <h2 className="text-5xl font-black text-gray-900 mb-2 tracking-tighter">
                {stats.averageRating?.toFixed(1) || '0.0'}
              </h2>
              <div className="flex gap-1.5 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <FiStar
                    key={s}
                    className={`w-4 h-4 ${s <= Math.round(stats.averageRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
                  />
                ))}
              </div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                {stats.totalReviews} Operational Audits
              </p>
            </div>
            <div className="md:col-span-3 space-y-3 py-2">
              <RatingBar star={5} count={stats.star5} total={stats.totalReviews} />
              <RatingBar star={4} count={stats.star4} total={stats.totalReviews} />
              <RatingBar star={3} count={stats.star3} total={stats.totalReviews} />
              <RatingBar star={2} count={stats.star2} total={stats.totalReviews} />
              <RatingBar star={1} count={stats.star1} total={stats.totalReviews} />
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-bold text-gray-800 uppercase tracking-widest">Customer Feedback</h3>
          <button className="w-10 h-10 bg-white rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors shadow-sm">
            <FiFilter className="w-4 h-4" />
          </button>
        </div>

        {ratings.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {ratings.map((rating, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100 shrink-0 shadow-inner">
                      {rating.userId?.profilePhoto ? (
                        <img src={rating.userId.profilePhoto} alt={rating.userId.name} className="w-full h-full object-cover" />
                      ) : (
                        <FiUser className="w-6 h-6 text-gray-300" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-base tracking-tight uppercase">{rating.userId?.name || 'Authorized Client'}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <FiStar
                              key={s}
                              className={`w-3 h-3 ${s <= rating.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-100'}`}
                            />
                          ))}
                        </div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{formatDate(rating.reviewedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                    <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">{rating.serviceId?.title || rating.serviceName}</span>
                  </div>
                </div>

                {rating.review && (
                  <p className="text-gray-600 text-[13px] leading-relaxed font-medium mt-4 pl-4 border-l-2 border-blue-600/20 italic">
                    "{rating.review}"
                  </p>
                )}

                {rating.reviewImages && rating.reviewImages.length > 0 && (
                  <div className="flex gap-2.5 overflow-x-auto mt-4 pb-1 scrollbar-hide">
                    {rating.reviewImages.map((img, i) => (
                      <img key={i} src={img} className="w-20 h-20 rounded-xl object-cover shrink-0 border border-gray-100 shadow-sm" alt="Review" />
                    ))}
                  </div>
                )}

                {rating.workerId && (
                  <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Protocol Executed By:</span>
                      <span className="text-[10px] font-bold text-gray-800 uppercase tracking-tight">{rating.workerId.name}</span>
                    </div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Order ID: #{rating.bookingNumber}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-gray-100">
              <FiMessageSquare className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No Operational Logs Found</p>
          </div>
        )}

        {/* Load More */}
        {pagination.total > ratings.length && (
          <button
            onClick={() => fetchRatings(pagination.page + 1)}
            className="w-full py-5 bg-white rounded-[24px] border border-gray-100 text-blue-600 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
          >
            {isLoading ? <FiLoader className="animate-spin" /> : 'Synchronize More Logs'}
          </button>
        )}
      </div>
    </div>
  );
};

export default MyRatings;
