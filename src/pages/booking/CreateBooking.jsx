import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import {
  ChevronLeft,
  MapPin,
  Calendar,
  Clock,
  FileText,
  ShieldAlert,
  Smartphone,
} from 'lucide-react';
import UPIPaymentSheet from '../../components/UPIPaymentSheet';

const CreateBooking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const service = location.state?.service;

  const [address, setAddress]           = useState('');
  const [landmark, setLandmark]         = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [notes, setNotes]               = useState('');
  const [bookingType, setBookingType]   = useState('instant');
  const [coords, setCoords]             = useState({ lat: 12.9716, lng: 77.5946 });
  const [error, setError]               = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Attempt to get user's geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  // Redirect if no service provided
  useEffect(() => {
    if (!service) navigate('/discovery');
  }, [service, navigate]);

  // Create booking mutation
  const bookingMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/bookings', payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      const booking = data.data?.booking;
      if (booking) {
        setConfirmedBooking(booking);
      } else {
        navigate('/bookings');
      }
    },
    onError: (err) => {
      const data = err.response?.data;
      let msg = data?.message || 'Failed to create booking. Please try again.';
      if (data?.errors?.length > 0) {
        msg = `${data.errors[0].path.join('.')}: ${data.errors[0].message}`;
      }
      setError(msg);
    },
  });

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!address) return setError('Address is required');
    setError('');

    let scheduledAt = new Date().toISOString();
    if (bookingType === 'scheduled') {
      if (!scheduledDate || !scheduledTime) {
        return setError('Please select a date and time for scheduled booking');
      }
      scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
    }

    bookingMutation.mutate({
      serviceId: service._id,
      categoryId: service.categoryId?._id || service.categoryId,
      bookingType,
      scheduledAt,
      amount: service.basePrice,
      paymentMethod: 'upi',
      address: {
        fullAddress: address,
        landmark,
        lat: coords.lat,
        lng: coords.lng,
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
      },
      customerNotes: notes,
    });
  };

  if (!service) return null;

  return (
    <div className="mobile-shell flex flex-col justify-between bg-slate-50 min-h-screen">
      {/* UPI Payment Sheet — shown after booking is created */}
      {confirmedBooking && (
        <UPIPaymentSheet
          booking={{ ...confirmedBooking, service, amount: service.basePrice }}
          onPaid={() => navigate(`/bookings/${confirmedBooking._id}`)}
          onPayLater={() => navigate(`/bookings/${confirmedBooking._id}`)}
          onClose={() => navigate(`/bookings/${confirmedBooking._id}`)}
        />
      )}

      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-4 border-b border-slate-100 flex items-center gap-3 sticky top-0 z-40">
        <button
          onClick={() => navigate('/discovery')}
          className="p-1 hover:bg-slate-50 rounded-full transition-all"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-lg font-bold text-slate-800">Book {service.name}</h1>
      </div>

      {/* Booking Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6 pb-28">

        {/* Booking Type */}
        <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-sm">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Service Schedule
          </label>
          <div className="flex gap-3">
            {['instant', 'scheduled'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setBookingType(type)}
                className={`flex-1 py-3 rounded-xl border text-xs font-bold capitalize transition-all ${
                  bookingType === type
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50'
                }`}
              >
                {type === 'instant' ? 'Book Instant' : 'Schedule Later'}
              </button>
            ))}
          </div>
        </div>

        {/* Date / Time (scheduled only) */}
        {bookingType === 'scheduled' && (
          <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-sm grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={scheduledDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary focus:bg-white transition-all font-semibold text-slate-700"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Time
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary focus:bg-white transition-all font-semibold text-slate-700"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Address */}
        <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Full Address
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <textarea
                placeholder="Flat/House No., Street Name, Area..."
                value={address}
                rows={2}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary focus:bg-white transition-all font-medium text-slate-700 resize-none"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Landmark (Optional)
            </label>
            <input
              type="text"
              placeholder="Near Apollo Hospital, etc."
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary focus:bg-white transition-all font-medium text-slate-700"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-sm">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Job Details / Notes
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <textarea
              placeholder="Add description of the issue or special instructions..."
              value={notes}
              rows={3}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary focus:bg-white transition-all font-medium text-slate-700 resize-none"
            />
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-sm space-y-3">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Pricing Summary
          </label>
          {[
            { label: 'Base Fare',       value: `₹${service.basePrice}` },
            { label: 'Convenience Fee', value: 'FREE', valueClass: 'text-emerald-600' },
          ].map(({ label, value, valueClass }) => (
            <div key={label} className="flex justify-between items-center text-xs text-slate-600 font-medium">
              <span>{label}</span>
              <span className={valueClass}>{value}</span>
            </div>
          ))}
          <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-sm font-bold text-slate-800">
            <span>Total Price</span>
            <span>₹{service.basePrice}</span>
          </div>
        </div>

        {/* Payment method badge */}
        <div className="flex items-center gap-2 px-1">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg">
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px] font-bold text-emerald-700">Pay via UPI</span>
          </div>
          <span className="text-[11px] text-slate-400">after booking confirmation</span>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </form>

      {/* Footer Confirm Action */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-4 z-50">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Total Cost</span>
          <span className="text-lg font-extrabold text-slate-800">₹{service.basePrice}</span>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={bookingMutation.isPending}
          className="flex-1 py-4 bg-primary hover:bg-primary-dark text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center disabled:opacity-50"
        >
          {bookingMutation.isPending ? 'Confirming…' : 'Confirm & Request'}
        </button>
      </div>
    </div>
  );
};

export default CreateBooking;
