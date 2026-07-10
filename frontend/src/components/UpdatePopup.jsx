import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Bell, ShieldCheck, MapPin, Phone, User, Loader, Sparkles } from 'lucide-react';

export default function UpdatePopup() {
  const location = useLocation();
  const path = location.pathname.replace(/\/$/, '');
  const isAuthPage = 
    path === '/login' || 
    path === '/register' || 
    path === '/signup' || 
    path === '/add-business' || 
    path === '/choose-plan' ||
    path === '/reset-password' ||
    path === '/verify-email' ||
    path === '/partner-register' ||
    path.startsWith('/dashboard') || 
    path.startsWith('/admin') || 
    path.startsWith('/superadmin');

  const [isOpen, setIsOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [area, setArea] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | success

  // Initialize and run the timer logic
  useEffect(() => {
    // Check if the user is already subscribed (saved permanently in localStorage)
    const alreadySubscribed = localStorage.getItem('ubt_subscribed') === 'true';
    if (alreadySubscribed) {
      setIsSubscribed(true);
      return;
    }

    // Check shown count
    const shownCount = parseInt(localStorage.getItem('ubt_popup_shown_count') || '0', 10);
    if (shownCount >= 2) {
      return;
    }

    // Do not show the popup on authentication and registration pages (login, register/signup, add-business, choose-plan, or dashboards)
    if (isAuthPage) {
      setIsOpen(false);
      return;
    }

    // Initialize session/visit start time in localStorage if not present
    let sessionStart = localStorage.getItem('ubt_session_start');
    if (!sessionStart) {
      sessionStart = Date.now().toString();
      localStorage.setItem('ubt_session_start', sessionStart);
    }
    const startTime = parseInt(sessionStart, 10);

    // Retrieve or establish the next show timestamp (3rd minute initially)
    let nextShow = localStorage.getItem('ubt_popup_next_show');
    if (!nextShow) {
      const firstShowTime = startTime + 3 * 60 * 1000; // 3rd minute delay (3 minutes / 180 seconds)
      localStorage.setItem('ubt_popup_next_show', firstShowTime.toString());
      nextShow = firstShowTime.toString();
    }

    const interval = setInterval(() => {
      const currentNextShowStr = localStorage.getItem('ubt_popup_next_show');
      if (currentNextShowStr === 'never') {
        clearInterval(interval);
        return;
      }

      const currentNextShow = parseInt(currentNextShowStr || '0', 10);
      const isDone = localStorage.getItem('ubt_subscribed') === 'true';
      const currentShownCount = parseInt(localStorage.getItem('ubt_popup_shown_count') || '0', 10);

      if (isDone || currentShownCount >= 2) {
        setIsSubscribed(true);
        setIsOpen(false);
        clearInterval(interval);
        return;
      }

      // If the scheduled time has arrived and the popup is closed, open it (unless on auth/registration page or dashboard)
      if (!isOpen && currentNextShow && Date.now() >= currentNextShow) {
        if (!isAuthPage) {
          setIsOpen(true);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isSubscribed, isAuthPage]);

  // Handle popup closure/dismissal
  const handleClose = () => {
    setIsOpen(false);
    
    // Increment the shown count
    const currentCount = parseInt(localStorage.getItem('ubt_popup_shown_count') || '0', 10);
    const newCount = currentCount + 1;
    localStorage.setItem('ubt_popup_shown_count', newCount.toString());

    if (newCount >= 2) {
      localStorage.setItem('ubt_popup_next_show', 'never');
      return;
    }

    // Schedule 2nd show to appear exactly 10 minutes after the first popup is dismissed
    const secondShowTime = Date.now() + 10 * 60 * 1000; // 10 minutes delay from now
    localStorage.setItem('ubt_popup_next_show', secondShowTime.toString());
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && status !== 'success') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, status]);

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    
    // Indian Mobile Number validation (10 digits starting with 6-9)
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!area.trim()) {
      setError('Please enter your area or neighborhood.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/update-subscribers/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          mobile: mobile,
          area: area.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        localStorage.setItem('ubt_subscribed', 'true');
        setIsSubscribed(true);
        // Clear fields
        setName('');
        setMobile('');
        setArea('');
        // Auto close the success message after 3 seconds
        setTimeout(() => {
          setIsOpen(false);
        }, 3000);
      } else {
        setError(data.message || 'Subscription failed. Please check details and try again.');
      }
    } catch (err) {
      setError('Connection to server failed. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthPage || !isOpen) return null;

  return (
    <div 
      onClick={() => status !== 'success' && handleClose()}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 max-h-[calc(100vh-2rem)] overflow-y-auto p-5 xs:p-6 sm:p-8 flex flex-col items-center animate-scale-up"
      >
        
        {/* Close Button */}
        {status !== 'success' && (
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
            aria-label="Close updates popup"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {status === 'success' ? (
          <div className="flex flex-col items-center text-center py-6">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-4 animate-bounce">
              <ShieldCheck className="h-9 w-9" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Subscription Confirmed!</h3>
            <p className="text-sm text-slate-500 font-semibold leading-relaxed max-w-xs">
              Thank you for staying connected. You will now receive important updates about trusted Udumalpet businesses, offers, and events!
            </p>
          </div>
        ) : (
          <div className="w-full flex flex-col">
            {/* Header Icon & Text */}
            <div className="flex flex-col items-center text-center mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-3 sm:mb-4 animate-pulse">
                <Bell className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#001c41] tracking-tight mb-2 flex items-center gap-1.5 justify-center">
                <span>Stay Updated with Udumalpet Business Tour</span>
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 fill-current shrink-0" />
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 font-semibold leading-relaxed">
                Enter your name, mobile number, and area to receive updates about trusted local businesses, services, special offers, events, and opportunities in and around Udumalpet.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-650 rounded-xl p-3 text-xs font-semibold flex items-start gap-2">
                <span className="mt-0.5 text-red-500">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Subscription Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4">
              {/* Name Field */}
              <div className="flex flex-col gap-1 sm:gap-1.5">
                <label className="text-xs font-bold text-slate-700">Full Name</label>
                <div className="relative flex items-center">
                  <User className="h-4.5 w-4.5 text-slate-400 absolute left-3" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full py-2 sm:py-2.5 pl-10 pr-4 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
                  />
                </div>
              </div>

              {/* Mobile Number Field */}
              <div className="flex flex-col gap-1 sm:gap-1.5">
                <label className="text-xs font-bold text-slate-700">Mobile Number</label>
                <div className="relative flex items-center">
                  <Phone className="h-4.5 w-4.5 text-slate-400 absolute left-3" />
                  <input
                    type="tel"
                    required
                    maxLength="10"
                    placeholder="Enter 10-digit mobile number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    className="w-full py-2 sm:py-2.5 pl-10 pr-4 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
                  />
                </div>
              </div>

              {/* Area Field */}
              <div className="flex flex-col gap-1 sm:gap-1.5">
                <label className="text-xs font-bold text-slate-700">Area / Location</label>
                <div className="relative flex items-center">
                  <MapPin className="h-4.5 w-4.5 text-slate-400 absolute left-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g., Udumalpet Town, Palani Road"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full py-2 sm:py-2.5 pl-10 pr-4 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-1 sm:mt-2 w-full py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-all shadow-md shadow-emerald-600/15 flex items-center justify-center gap-2 cursor-pointer hover:translate-y-[-1px] active:translate-y-[0px]"
              >
                {loading && <Loader className="h-4.5 w-4.5 animate-spin" />}
                <span>Subscribe for Updates</span>
              </button>
            </form>

            {/* Snooze/Maybe Later Link */}
            <button
              onClick={handleClose}
              className="mt-3 sm:mt-4 text-center text-[11px] text-slate-400 hover:text-slate-600 font-bold hover:underline cursor-pointer"
            >
              Maybe Later
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
