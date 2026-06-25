import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { Phone, ShieldAlert, CheckCircle2 } from 'lucide-react';

const PhoneAuth = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize recaptcha verifier
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      }
    });

    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }
    };
  }, []);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phoneNumber) return setError('Please enter a phone number');

    setLoading(true);
    setError('');

    // Ensure phone number has country code. If not, prepended with +91 (default)
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+91${formattedPhone}`;
    }

    try {
      const appVerifier = window.recaptchaVerifier;
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      
      // Store confirmation result in window to access it in the OTP screen
      window.confirmationResult = confirmationResult;
      
      navigate('/auth/otp', { state: { phone: formattedPhone } });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to send OTP. Please try again.');
      // Do not clear/recreate recaptcha verifier here, Firebase handles the reset automatically
      // for invisible recaptchas when signInWithPhoneNumber fails.
    } finally {
      setLoading(false);
    }
  };

  const handleBypassAuth = async () => {
    // Signs in with a Firebase test phone number automatically for fast dev
    setLoading(true);
    setError('');
    try {
      const appVerifier = window.recaptchaVerifier;
      const confirmationResult = await signInWithPhoneNumber(auth, '+919999900001', appVerifier);
      window.confirmationResult = confirmationResult;
      navigate('/auth/otp', { state: { phoneNumber: '+91 99999 00001', isTest: true } });
    } catch (err) {
      console.error(err);
      setError('Test verification failed. Is +91 99999 00001 added to your Firebase project?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-shell flex flex-col justify-between bg-white px-6 py-8 min-h-screen">
      {/* Top Graphic/Brand */}
      <div className="flex flex-col items-center mt-12">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Phone className="w-10 h-10 text-primary animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 text-center">Verify Your Number</h1>
        <p className="text-slate-400 text-sm text-center mt-2 px-6">
          Please enter your mobile phone number to log in or create an account.
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendOtp} className="w-full flex-1 flex flex-col justify-center mt-8">
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Phone Number
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
              +91
            </span>
            <input
              type="tel"
              placeholder="98765 43210"
              value={phoneNumber.replace(/^\+91/, '')}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full pl-14 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium outline-none focus:border-primary focus:bg-white transition-all"
              required
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div id="recaptcha-container"></div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center disabled:opacity-50"
        >
          {loading ? 'Sending OTP...' : 'Send Verification Code'}
        </button>
      </form>

      {/* Developer Bypass Footer */}
      <div className="flex flex-col items-center mt-auto border-t border-slate-100 pt-6">
        <p className="text-[10px] text-slate-400 mb-2 uppercase tracking-widest font-semibold">
          Developer Options
        </p>
        <button
          onClick={handleBypassAuth}
          disabled={loading}
          className="px-4 py-2 border border-slate-200 text-slate-600 hover:text-primary hover:border-primary font-medium text-xs rounded-lg transition-all flex items-center gap-2"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Bypass Auth (Use Test Account)
        </button>
      </div>
    </div>
  );
};

export default PhoneAuth;
