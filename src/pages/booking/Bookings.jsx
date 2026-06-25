import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Calendar, ChevronRight, Sparkles } from 'lucide-react';

const Bookings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'past'

  // Fetch all user bookings
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings', 'customer'],
    queryFn: async () => {
      const res = await api.get('/bookings/my/customer');
      return res.data?.data || [];
    },
  });

  // Group bookings
  const activeStates = ['pending', 'accepted', 'in_progress'];
  const activeBookings = bookings.filter(b => activeStates.includes(b.status));
  const pastBookings = bookings.filter(b => !activeStates.includes(b.status));

  const displayedBookings = activeTab === 'active' ? activeBookings : pastBookings;

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'accepted':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'in_progress':
        return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'completed':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  return (
    <div className="flex flex-col bg-slate-50 min-h-screen">
      {/* Sticky Header */}
      <div className="bg-white px-6 pt-12 pb-4 border-b border-slate-100 sticky top-0 z-40">
        <h1 className="text-xl font-bold text-slate-800">My Bookings</h1>
        
        {/* Active/Past Tabs Switcher */}
        <div className="flex bg-slate-50 p-1 rounded-xl mt-4 border border-slate-100">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
              activeTab === 'active'
                ? 'bg-white text-primary shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Active ({activeBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
              activeTab === 'past'
                ? 'bg-white text-primary shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Past ({pastBookings.length})
          </button>
        </div>
      </div>

      {/* Bookings List */}
      <div className="px-6 py-6 flex-1">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm animate-pulse h-28"></div>
            ))}
          </div>
        ) : displayedBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-slate-300" />
            </div>
            <h4 className="font-bold text-slate-700 text-sm">No Bookings Yet</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              You don't have any {activeTab} bookings at the moment.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedBookings.map((booking) => (
              <div
                key={booking._id}
                onClick={() => navigate(`/bookings/${booking._id}`)}
                className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm capitalize">
                      {booking.service?.name || 'Handyman Service'}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(booking.scheduledAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 border text-[10px] font-bold rounded-full capitalize ${getStatusStyle(booking.status)}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        ₹{booking.totalPrice || booking.service?.basePrice}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;
