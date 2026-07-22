import { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('ubt_cookie_consent');
    if (!consent) {
      // Delay slightly for smooth transition on load
      const timer = setTimeout(() => {
        setVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('ubt_cookie_consent', 'accepted');
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('ubt_cookie_consent', 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-5 left-5 right-5 md:left-auto md:right-5 md:w-96 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl p-5 shadow-2xl z-[9999] animate-slide-up flex flex-col gap-4 text-left">
      <div className="flex items-start justify-between gap-3">
        <div className="h-10 w-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
          <ShieldCheck className="h-5 w-5 text-[#027244]" />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <h4 className="font-extrabold text-slate-800 text-sm">Cookie Preferences</h4>
          <p className="text-[11px] font-semibold text-slate-500 leading-normal">
            We use cookies to personalize content, ads, and analyze platform traffic to provide a secure and reliable experience.
          </p>
        </div>
        <button
          onClick={handleDecline}
          className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 cursor-pointer"
          title="Decline"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-3 mt-1">
        <button
          onClick={handleDecline}
          className="flex-1 py-2 border border-slate-200 hover:border-slate-350 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl transition-all cursor-pointer"
        >
          Decline
        </button>
        <button
          onClick={handleAccept}
          className="flex-1 py-2 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-sm border-none"
        >
          Accept All
        </button>
      </div>
    </div>
  );
}
