import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { MapPin, Bell, Search, Sparkles, Wrench, Zap, Paintbrush, Hammer, ChevronRight } from 'lucide-react';

const categoryIconMap = {
  plumbing: Wrench,
  electrical: Zap,
  cleaning: Paintbrush,
  carpentry: Hammer,
};

const Home = () => {
  const navigate = useNavigate();

  // Fetch categories
  const { data: categories = [], isLoading: loadingCats } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data?.data?.categories || [];
    },
  });

  // Fetch active bookings
  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['bookings', 'customer', 'active'],
    queryFn: async () => {
      const res = await api.get('/bookings/my/customer');
      // Filter for active/incomplete states
      const activeStates = ['pending', 'accepted', 'in_progress'];
      return (res.data?.data || []).filter(b => activeStates.includes(b.status));
    },
  });

  return (
    <div className="flex flex-col bg-slate-50 min-h-screen">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-primary via-primary to-primary-dark text-white px-6 pt-12 pb-8 rounded-b-[2rem] shadow-lg">
        {/* Top Location and Notifications */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4 text-white/80" />
            <span className="text-xs font-medium text-white/90">Bengaluru, Karnataka</span>
          </div>
          <button 
            onClick={() => navigate('/notifications')}
            className="relative p-2 hover:bg-white/10 rounded-full transition-all"
          >
            <Bell className="w-5 h-5 text-white" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-secondary rounded-full border-2 border-primary"></span>
          </button>
        </div>

        {/* Brand/Welcome message */}
        <h2 className="text-2xl font-bold leading-tight mb-6">
          What service do<br />you need today?
        </h2>

        {/* Search Bar Gateway */}
        <div
          onClick={() => navigate('/discovery')}
          className="flex items-center gap-3 bg-white text-slate-400 px-4 py-3 rounded-xl shadow-md cursor-pointer hover:bg-slate-50 transition-all select-none"
        >
          <Search className="w-5 h-5 text-slate-400" />
          <span className="text-sm font-medium">Search services, handymen...</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-6 py-6 flex-1">
        {/* Active Bookings Section */}
        {loadingBookings ? (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
            </div>
            <div className="space-y-4">
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm animate-pulse h-20" />
            </div>
          </div>
        ) : bookings.length > 0 ? (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 text-base">Active Bookings</h3>
              <button 
                onClick={() => navigate('/bookings')}
                className="text-xs font-semibold text-primary hover:text-primary-dark flex items-center gap-0.5"
              >
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking._id}
                  onClick={() => navigate(`/bookings/${booking._id}`)}
                  className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm capitalize">
                        {booking.service?.name || 'Handyman Service'}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Status: <span className="font-semibold text-primary capitalize">{booking.status.replace('_', ' ')}</span>
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Services Category Section */}
        <div className="mb-8">
          <h3 className="font-bold text-slate-800 text-base mb-4">Services</h3>
          {loadingCats ? (
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex flex-col items-center animate-pulse">
                  <div className="w-14 h-14 bg-slate-200 rounded-2xl mb-2"></div>
                  <div className="h-3 w-12 bg-slate-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {categories.map((cat) => {
                const IconComp = categoryIconMap[cat.slug] || Sparkles;
                const catColor = cat.color || '#1B4FD8';
                return (
                  <div
                    key={cat._id}
                    onClick={() => navigate('/discovery', { state: { selectedCategory: cat } })}
                    className="flex flex-col items-center cursor-pointer group"
                  >
                    <div
                      style={{ backgroundColor: `${catColor}15`, color: catColor }}
                      className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-105"
                    >
                      <IconComp className="w-7 h-7" />
                    </div>
                    <span className="text-[11px] font-medium text-slate-600 mt-2 text-center break-words w-full px-1 line-clamp-2">
                      {cat.name}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Promo Banner */}
        <div className="bg-gradient-to-r from-orange-400 to-amber-500 rounded-2xl p-5 text-white flex items-center justify-between shadow-md">
          <div className="flex-1 pr-4">
            <h4 className="font-extrabold text-lg leading-tight">20% OFF</h4>
            <p className="text-xs text-white/90 mt-1">On your first booking!</p>
            <button
              onClick={() => navigate('/discovery')}
              className="mt-3 px-4 py-1.5 bg-white text-amber-600 font-bold text-xs rounded-full shadow-sm hover:bg-slate-50 transition-all"
            >
              Book Now
            </button>
          </div>
          <div className="text-5xl font-light">🎉</div>
        </div>
      </div>
    </div>
  );
};

export default Home;
