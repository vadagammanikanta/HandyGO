import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import {
  ChevronLeft,
  MapPin,
  Calendar,
  ClipboardList,
  XCircle,
  Phone,
  MessageCircle,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import UPIPaymentSheet from '../../components/UPIPaymentSheet';


// ─── Main Component ───────────────────────────────────────────────────────────
const BookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);

  // Fetch booking details (polls every 8s for status changes)
  const { data: booking = {}, isLoading, error } = useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const res = await api.get(`/bookings/${id}`);
      return res.data?.data?.booking || {};
    },
    refetchInterval: 8000,
  });

  // Cancel booking mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/bookings/${id}/status`, { status: 'cancelled' });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  if (isLoading) {
    return (
      <div className="mobile-shell flex items-center justify-center bg-white min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !booking._id) {
    return (
      <div className="mobile-shell bg-slate-50 min-h-screen flex flex-col">
        <div className="bg-white px-6 pt-12 pb-4 border-b border-slate-100 flex items-center gap-3">
          <button onClick={() => navigate('/bookings')} className="p-1 hover:bg-slate-50 rounded-full">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-lg font-bold text-slate-800">Error</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-sm font-semibold text-slate-500">Failed to load booking details.</p>
          <button
            onClick={() => navigate('/bookings')}
            className="mt-4 px-6 py-2 bg-primary text-white font-bold text-xs rounded-xl"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const {
    status,
    bookingNumber,
    scheduledAt,
    address = {},
    customerNotes,
    partner = {},
    service = {},
  } = booking;

  const isPartnerAssigned = !!booking.partnerId;
  const isEnroute         = status === 'partner_enroute';
  const isCancellable     = ['pending', 'accepted'].includes(status);
  const isCompleted       = status === 'completed';
  // Show UPI pay button only when completed and not yet marked paid
  const needsPayment      = isCompleted && booking.paymentStatus !== 'paid';

  const statusSteps = [
    { label: 'Requested',   key: 'pending' },
    { label: 'Accepted',    key: 'accepted' },
    { label: 'On The Way',  key: 'partner_enroute' },
    { label: 'Arrived',     key: 'arrived' },
    { label: 'In Progress', key: 'in_progress' },
    { label: 'Completed',   key: 'completed' },
  ];

  const statusIdx = status === 'cancelled'
    ? -1
    : statusSteps.findIndex((s) => s.key === status);

  return (
    <div className="mobile-shell flex flex-col bg-slate-50 min-h-screen pb-24">
      {/* UPI Payment Sheet */}
      {showPaymentSheet && (
        <UPIPaymentSheet
          booking={booking}
          onClose={() => setShowPaymentSheet(false)}
          onPaid={() => {
            setShowPaymentSheet(false);
            queryClient.invalidateQueries({ queryKey: ['booking', id] });
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
          }}
        />
      )}

      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-4 border-b border-slate-100 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/bookings')}
            className="p-1 hover:bg-slate-50 rounded-full transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-sm font-extrabold text-slate-800">{bookingNumber}</h1>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              {service.name}
            </p>
          </div>
        </div>

        <span
          className={`px-2.5 py-0.5 border text-[10px] font-bold rounded-full capitalize ${
            status === 'cancelled'
              ? 'bg-red-50 text-red-600 border-red-100'
              : status === 'completed'
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
              : 'bg-primary/5 text-primary border-primary/10 animate-pulse'
          }`}
        >
          {status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

        {/* Status Timeline */}
        {status !== 'cancelled' ? (
          <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-4">
              Job Status
            </h3>
            <div className="relative flex flex-col gap-6 pl-6 border-l border-slate-100">
              {statusSteps.map((step, i) => {
                const isStepDone    = i <= statusIdx;
                const isStepCurrent = i === statusIdx;
                return (
                  <div key={step.key} className="relative flex items-center">
                    <span
                      className={`absolute -left-[30px] w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center ${
                        isStepCurrent
                          ? 'bg-white border-primary w-5 h-5 -left-[32px] shadow-sm shadow-primary/20'
                          : isStepDone
                          ? 'bg-primary border-primary'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      {isStepDone && !isStepCurrent && (
                        <span className="w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                      {isStepCurrent && (
                        <span className="w-2.5 h-2.5 bg-primary rounded-full animate-ping" />
                      )}
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        isStepCurrent ? 'text-primary' : isStepDone ? 'text-slate-800' : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4 flex gap-3 items-center">
            <XCircle className="w-8 h-8 flex-shrink-0 text-red-500" />
            <div>
              <h4 className="font-bold text-xs">Booking Cancelled</h4>
              <p className="text-[10px] text-red-600 mt-0.5">
                This service request was cancelled and is no longer active.
              </p>
            </div>
          </div>
        )}

        {/* Assigned Partner */}
        {isPartnerAssigned && (
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Service Partner
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm uppercase">
                  {partner.name?.substring(0, 2) || 'SP'}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    {partner.name || 'Professional Partner'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">⭐ 4.8 Rating</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/chat/${id}`)}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-primary transition-all border border-slate-200"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
                <a
                  href={`tel:${partner.phone || '9999999999'}`}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-primary transition-all border border-slate-200"
                >
                  <Phone className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Track live button */}
            {isEnroute && (
              <button
                onClick={() => navigate(`/bookings/${id}/track`)}
                className="w-full py-3 bg-primary/5 hover:bg-primary text-primary hover:text-white font-bold text-xs rounded-xl border border-primary/10 transition-all flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                Track Live Location
              </button>
            )}
          </div>
        )}

        {/* Job Information */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
            Job Information
          </h3>
          <div className="flex gap-3 text-xs">
            <ClipboardList className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">Job Description</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{customerNotes || 'No notes added.'}</p>
            </div>
          </div>
          <div className="flex gap-3 text-xs">
            <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">Service Location</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{address.fullAddress}</p>
              {address.landmark && (
                <p className="text-[10px] text-slate-400 mt-0.5">Landmark: {address.landmark}</p>
              )}
            </div>
          </div>
          <div className="flex gap-3 text-xs">
            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">Scheduled Date &amp; Time</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {new Date(scheduledAt).toLocaleDateString(undefined, {
                  weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                })}{' '}
                at{' '}
                {new Date(scheduledAt).toLocaleTimeString(undefined, {
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Status badge (if paid) */}
        {booking.paymentStatus === 'paid' && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-3 items-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-700">Payment Confirmed</p>
              <p className="text-[10px] text-emerald-600 mt-0.5">
                Paid via UPI to {booking.partner?.name || 'partner'}.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer — context-sensitive */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 z-50 space-y-2">
        {/* Pay now — only when completed and unpaid */}
        {needsPayment && (
          <button
            onClick={() => setShowPaymentSheet(true)}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 hover:opacity-90 transition-all"
          >
            <Smartphone className="w-4 h-4" />
            Pay ₹{booking.totalPrice || service.basePrice} via UPI
          </button>
        )}

        {/* Cancel — only when pending or accepted */}
        {isCancellable && (
          <button
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
            className="w-full py-3.5 border border-red-200 hover:bg-red-50 text-red-600 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            {cancelMutation.isPending ? 'Cancelling\u2026' : 'Cancel Service Request'}
          </button>
        )}
      </div>
    </div>
  );
};

export default BookingDetails;
