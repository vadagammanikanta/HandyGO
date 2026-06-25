import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import {
  ChevronLeft,
  Bell,
  Gift,
  ShieldAlert,
  BadgeCheck,
  MapPin,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

const TYPE_CONFIG = {
  booking_confirmed:  { icon: BadgeCheck,    bg: 'bg-emerald-50', text: 'text-emerald-600' },
  booking_cancelled:  { icon: ShieldAlert,   bg: 'bg-red-50',     text: 'text-red-600' },
  partner_assigned:   { icon: CheckCircle2,  bg: 'bg-blue-50',    text: 'text-blue-600' },
  partner_enroute:    { icon: MapPin,        bg: 'bg-indigo-50',  text: 'text-indigo-600' },
  booking_completed:  { icon: CheckCircle2,  bg: 'bg-emerald-50', text: 'text-emerald-600' },
  promo:              { icon: Gift,          bg: 'bg-amber-50',   text: 'text-amber-600' },
  alert:              { icon: ShieldAlert,   bg: 'bg-red-50',     text: 'text-red-600' },
  default:            { icon: Bell,          bg: 'bg-blue-50',    text: 'text-primary' },
};

const relativeTime = (dateStr) => {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)        return 'Just now';
  if (diff < 3600)      return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)     return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const Notifications = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch notifications from backend
  const { data: notifications = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data?.data?.notifications || res.data?.data || [];
    },
    refetchInterval: 30000, // auto-refresh every 30 s
  });

  // Mark notification as read
  const markReadMutation = useMutation({
    mutationFn: async (id) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const getConfig = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.default;

  return (
    <div className="mobile-shell flex flex-col bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1 hover:bg-slate-50 rounded-full transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-lg font-bold text-slate-800">Notifications</h1>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-full transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Notifications List */}
      <div className="px-6 py-6 space-y-3 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm animate-pulse h-20" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShieldAlert className="w-10 h-10 text-red-300 mb-3" />
            <h4 className="font-bold text-slate-700 text-sm">Failed to Load</h4>
            <p className="text-xs text-slate-400 mt-1">Could not fetch notifications.</p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-5 py-2 bg-primary text-white font-bold text-xs rounded-xl"
            >
              Retry
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-slate-300" />
            </div>
            <h4 className="font-bold text-slate-700 text-sm">No Notifications</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              You will see booking updates and alerts here.
            </p>
          </div>
        ) : (
          notifications.map((notif) => {
            const cfg = getConfig(notif.type);
            const Icon = cfg.icon;
            const isUnread = !notif.isRead;

            return (
              <div
                key={notif._id || notif.id}
                onClick={() => {
                  if (isUnread) markReadMutation.mutate(notif._id || notif.id);
                  if (notif.bookingId) navigate(`/bookings/${notif.bookingId}`);
                }}
                className={`bg-white border rounded-2xl p-4 shadow-sm flex items-start gap-3 transition-all cursor-pointer hover:shadow-md ${
                  isUnread ? 'border-primary/20 bg-primary/[0.02]' : 'border-slate-100'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className={`text-xs ${isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'} truncate`}>
                      {notif.title}
                    </h4>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isUnread && (
                        <span className="w-2 h-2 bg-primary rounded-full" />
                      )}
                      <span className="text-[9px] text-slate-400 whitespace-nowrap font-medium">
                        {relativeTime(notif.createdAt)}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                    {notif.body || notif.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Notifications;
