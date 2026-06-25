import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import api from '../../services/api';
import MapView from '../../components/MapView';
import { ChevronLeft, Phone, MessageSquare, Clock, Navigation2 } from 'lucide-react';

const LiveTracking = () => {
  const { id: bookingId } = useParams();
  const navigate = useNavigate();

  // Real-time tracking state from Firestore
  const [tracking, setTracking] = useState({
    lat: 12.9716,
    lng: 77.5946,
    eta: '--',
    distance: '--',
    status: 'En Route',
  });

  // Fetch booking details to know customer coords and partner info
  const { data: booking = {} } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const res = await api.get(`/bookings/${bookingId}`);
      return res.data?.data?.booking || {};
    },
    staleTime: 60000,
  });

  const partnerName = booking?.partner?.name || 'Service Partner';
  const partnerInitials = partnerName.substring(0, 2).toUpperCase();
  const customerLat = booking?.address?.lat || 12.9750;
  const customerLng = booking?.address?.lng || 77.5900;

  // ── Firestore real-time tracking listener ─────────────────────────────────────
  useEffect(() => {
    if (!bookingId) return;

    // Backend writes to: tracking/{bookingId} with { lat, lng, eta, distance, status }
    const trackingRef = doc(db, 'tracking', bookingId);

    const unsubscribe = onSnapshot(
      trackingRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setTracking((prev) => ({
            lat: data.lat ?? prev.lat,
            lng: data.lng ?? prev.lng,
            eta: data.eta ?? prev.eta,
            distance: data.distance ?? prev.distance,
            status: data.status
              ? data.status.replace(/_/g, ' ')
              : prev.status,
          }));
        }
      },
      (err) => {
        console.error('[LiveTracking] Firestore listener error:', err);
      }
    );

    return () => unsubscribe();
  }, [bookingId]);

  return (
    <div className="mobile-shell flex flex-col bg-slate-50 min-h-screen overflow-hidden">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1 hover:bg-slate-50 rounded-full transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-sm font-extrabold text-slate-800">Track Partner</h1>
            <p className="text-[10px] text-primary font-semibold uppercase tracking-wider flex items-center gap-1">
              <Navigation2 className="w-2.5 h-2.5 animate-pulse" />
              {tracking.status}
            </p>
          </div>
        </div>
      </div>

      {/* Live Map — fills the available space */}
      <div className="flex-1 relative">
        {/* ETA & Distance overlay card */}
        <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-md border border-slate-100 shadow-lg rounded-2xl p-4 flex justify-around items-center z-[1000]">
          <div className="text-center">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Arrival ETA
            </span>
            <h3 className="text-xl font-extrabold text-primary mt-0.5 flex items-baseline gap-1">
              {tracking.eta}
              <span className="text-xs font-medium text-slate-400">mins</span>
            </h3>
          </div>
          <div className="w-px h-8 bg-slate-100" />
          <div className="text-center">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Distance
            </span>
            <h3 className="text-xl font-extrabold text-slate-800 mt-0.5 flex items-baseline gap-1">
              {tracking.distance}
              <span className="text-xs font-medium text-slate-400">km</span>
            </h3>
          </div>
        </div>

        {/* Leaflet Map */}
        <MapView
          partnerLat={tracking.lat}
          partnerLng={tracking.lng}
          customerLat={customerLat}
          customerLng={customerLng}
          partnerName={partnerName}
        />
      </div>

      {/* Partner details card at the bottom */}
      <div className="bg-white border-t border-slate-100 px-5 py-4 space-y-0 shadow-xl z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-primary/10 rounded-full flex items-center justify-center font-bold text-sm text-primary uppercase">
              {partnerInitials}
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-xs">{partnerName}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> On the way to your location
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/chat/${bookingId}`)}
              className="p-2.5 bg-slate-50 hover:bg-primary/10 rounded-xl text-slate-600 hover:text-primary transition-all border border-slate-200"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <a
              href={`tel:${booking?.partner?.phone || '9999999999'}`}
              className="p-2.5 bg-slate-50 hover:bg-primary/10 rounded-xl text-slate-600 hover:text-primary transition-all border border-slate-200"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTracking;
