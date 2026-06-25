import { useState } from 'react';
import {
  IndianRupee,
  Smartphone,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import api from '../services/api';

// ─── UPI Deep-Link builder ────────────────────────────────────────────────────
// Uses the ASSIGNED partner's UPI VPA — never a single platform VPA.
// The partner stores their UPI ID in their profile during onboarding.
const buildUpiLink = ({ vpa, partnerName, amount, bookingRef }) =>
  `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(partnerName)}&am=${amount}&tn=${encodeURIComponent(`HandyGO Service - ${bookingRef}`)}&cu=INR`;

/**
 * UPIPaymentSheet — a shared bottom sheet component used for paying service partners
 * directly via UPI deep-linking.
 */
const UPIPaymentSheet = ({ booking, onClose, onPaid, onPayLater }) => {
  const [launched, setLaunched] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const partner = booking.partner || {};
  const amount  = booking.totalPrice || booking.service?.basePrice || 0;
  const vpa     = partner.upiVpa; // e.g. "rajesh.plumber@ybl"
  const bookingRef = booking.bookingNumber || booking._id?.slice(-6).toUpperCase();

  const upiLink = vpa
    ? buildUpiLink({ vpa, partnerName: partner.name, amount, bookingRef })
    : null;

  const handleLaunchUPI = () => {
    if (!upiLink) return;
    window.location.href = upiLink;
    setLaunched(true);
  };

  const handleIHavePaid = async () => {
    setConfirming(true);
    try {
      await api.patch(`/bookings/${booking._id}/payment-status`, {
        paymentStatus: 'paid',
        paidTo: vpa,
      }).catch(() => {
        // Non-critical — endpoint may not exist yet
        console.warn('[UPI] payment-status endpoint not available yet');
      });
      onPaid();
    } catch {
      onPaid();
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-white rounded-t-3xl px-6 pt-6 pb-10 shadow-2xl z-10 max-w-[440px] w-full mx-auto">
        {/* Drag handle */}
        <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto mb-5" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex flex-col items-center mb-5">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-3">
            <IndianRupee className="w-7 h-7 text-emerald-600" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800">Pay for Service</h2>
          <p className="text-xs text-slate-400 mt-1">Job completed — pay your partner directly</p>
        </div>

        {/* Partner + Amount card */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-xs text-primary uppercase">
              {partner.name?.substring(0, 2) || 'SP'}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">{partner.name || 'Service Partner'}</p>
              {vpa ? (
                <p className="text-[11px] text-slate-400 font-medium">{vpa}</p>
              ) : (
                <p className="text-[11px] text-amber-500 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Partner UPI not set up yet
                </p>
              )}
            </div>
            <span className="ml-auto text-xl font-extrabold text-slate-800">₹{amount}</span>
          </div>
        </div>

        {/* No UPI warning */}
        {!vpa && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 leading-relaxed">
              This partner hasn&apos;t added their UPI ID yet. Please pay them in cash or contact support.
            </p>
          </div>
        )}

        {/* Pay via UPI button */}
        {vpa && (
          <button
            onClick={handleLaunchUPI}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 mb-3 hover:opacity-90 transition-all"
          >
            <Smartphone className="w-5 h-5" />
            Pay ₹{amount} via UPI App
            <ExternalLink className="w-4 h-4 opacity-70" />
          </button>
        )}

        {/* Confirm after UPI app returns */}
        {launched && (
          <button
            onClick={handleIHavePaid}
            disabled={confirming}
            className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 mb-3 disabled:opacity-60"
          >
            <CheckCircle2 className="w-4 h-4" />
            {confirming ? 'Confirming…' : 'I’ve Paid — Done'}
          </button>
        )}

        {/* Cash / pay later */}
        <button
          onClick={onPayLater || onClose}
          className="w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
        >
          Paid in cash / Dismiss
        </button>

        <p className="text-center text-[10px] text-slate-300 mt-3 leading-relaxed px-4">
          Payment goes directly to your partner’s UPI account. HandyGO does not collect this payment.
        </p>
      </div>
    </div>
  );
};

export default UPIPaymentSheet;
