import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, ChevronLeft } from 'lucide-react';
import api from '../../services/api';

const OtpAuth = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const phoneNumber = location.state?.phoneNumber || location.state?.phone || '';
  const isTest = location.state?.isTest || false;

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) return setError('Please enter a 6-digit code');

    setLoading(true);
    setError('');

    try {
      const confirmationResult = window.confirmationResult;
      if (!confirmationResult) {
        throw new Error('No confirmation result found. Go back and resend the code.');
      }
      
      const result = await confirmationResult.confirm(otp);
      console.log('Firebase user successfully authenticated:', result.user);
      
      // Call backend API login endpoint to synchronize the user profile in MongoDB!
      await api.post('/auth/login');
      
      navigate('/home');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Incorrect verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-shell flex flex-col justify-between bg-white px-6 py-8 min-h-screen">
      {/* Top back button & brand */}
      <div className="flex flex-col mt-4">
        <button
          onClick={() => navigate('/auth/phone')}
          className="self-start flex items-center gap-1 text-slate-500 hover:text-slate-800 text-xs font-semibold uppercase tracking-wider mb-8"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 text-center">Enter 6-Digit Code</h1>
          <p className="text-slate-400 text-sm text-center mt-2 px-6">
            Sent to <span className="text-slate-700 font-semibold">{phoneNumber}</span>
          </p>
        </div>
      </div>

      {/* Code Input Form */}
      <form onSubmit={handleVerifyOtp} className="w-full flex-1 flex flex-col justify-center mt-8">
        <div className="mb-6 flex flex-col items-center">
          <input
            type="text"
            maxLength={6}
            placeholder="0 0 0 0 0 0"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
            className="w-full text-center tracking-[0.5em] text-3xl py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold outline-none focus:border-primary focus:bg-white transition-all placeholder:tracking-normal placeholder:font-medium placeholder:text-lg"
            required
            autoFocus
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify & Continue'}
        </button>
      </form>

      {/* Developer note */}
      {isTest && (
        <div className="mt-auto bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
          <p className="text-xs font-semibold text-primary">Test Mode Active</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Use verification code: <span className="font-bold text-slate-700">123456</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default OtpAuth;
