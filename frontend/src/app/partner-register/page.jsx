import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, User, Mail, Phone, CreditCard, MapPin, Sparkles, AlertCircle, Loader, ArrowLeft } from 'lucide-react';

export default function PartnerRegister() {
  const navigate = useNavigate();

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [address, setAddress] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('ubt_token');
    const storedUser = localStorage.getItem('ubt_user');

    if (!token || !storedUser) {
      navigate('/login?from=partner');
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      setSessionUser(user);
      
      // Prefill values with placeholder values as default
      setFullName(user.fullName || user.name || '');
      setEmail(user.email || '');
      setMobileNumber(user.phone || user.mobileNumber || '');
      setAadhaarNumber(user.aadhaarNumber || '');
      setAddress(user.address || '');

      // If they are already a registered partner, let them go straight to dashboard
      if (user.role === 'partner' && user.isPartnerRegistered) {
        navigate('/dashboard');
      }
      if (user.partnerStatus === 'rejected') {
        setError('Your previous registration request was not approved by administration. Please review your details and resubmit.');
      }
    } catch (err) {
      navigate('/login?from=partner');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!fullName.trim()) {
      setError('Name is required');
      return;
    }
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!mobileNumber.trim()) {
      setError('Mobile number is required');
      return;
    }
    if (!aadhaarNumber.trim()) {
      setError('Aadhaar Number is required');
      return;
    }
    if (aadhaarNumber.trim().replace(/\s/g, '').length !== 12) {
      setError('Please provide a valid 12-digit Aadhaar Number');
      return;
    }
    if (!address.trim()) {
      setError('Address is required');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('ubt_token');
      const res = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName,
          email,
          mobileNumber,
          aadhaarNumber: aadhaarNumber.trim().replace(/\s/g, ''),
          address: address.trim(),
          isPartnerRegistered: true, // Complete onboarding!
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Partnership registration complete! Redirecting to dashboard...');
        
        // Update user session details in localStorage
        const updatedUser = {
          ...sessionUser,
          fullName: data.data.fullName,
          email: data.data.email,
          phone: data.data.phone,
          mobileNumber: data.data.mobileNumber,
          aadhaarNumber: data.data.aadhaarNumber,
          address: data.data.address,
          isPartnerRegistered: true,
          isPartnerApproved: data.data.isPartnerApproved || false,
          partnerStatus: data.data.partnerStatus || 'pending',
        };
        localStorage.setItem('ubt_user', JSON.stringify(updatedUser));

        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setError(data.message || 'Registration failed. Try again.');
      }
    } catch (err) {
      setError('Connection failed. Server might be offline.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between font-sans text-slate-800">
      
      {/* Header */}
      <header className="w-full bg-white border-b border-slate-100 py-4 px-6 md:px-12 flex justify-between items-center shadow-xs">
        <Link to="/" className="flex items-center select-none py-1">
          <img src="/logo.png" alt="Udumalpet Business Tour" className="h-10 sm:h-12 w-auto object-contain" />
        </Link>
        <Link to="/" className="flex items-center gap-1.5 text-xs font-bold text-slate-505 hover:text-[#027244] transition-colors bg-slate-50 py-2 px-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-8 py-10 flex flex-col lg:flex-row gap-8 items-start justify-center text-slate-800">
        
        {/* Onboarding info panel */}
        <div className="w-full lg:w-[42%] flex flex-col gap-6 text-left shrink-0">
          <div className="flex flex-col gap-2.5">
            <span className="bg-emerald-50 text-[#027244] border border-emerald-100/50 px-3 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider w-fit">
              Partnership Program
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-[#001c41] tracking-tight leading-tight">
              Onboard as a Platform Partner
            </h1>
            <p className="text-slate-500 text-xs font-medium leading-relaxed mt-1">
              Connect businesses, friends, and traders to the Udumalpet Business Tour directory and earn high reward points.
            </p>
          </div>

          <div className="flex flex-col gap-4 mt-2">
            {[
              {
                title: '99 Points Per Referral',
                desc: 'Earn 99 reward points immediately for every successful referred business that gets approved.',
                icon: <Sparkles className="h-4.5 w-4.5 text-amber-500 fill-current" />,
                bg: 'bg-amber-50 border-amber-100/30'
              },
              {
                title: 'Payout at 1,000 Points',
                desc: 'Easily redeem your accumulated points for cash payouts when your balance reaches 1,000 points.',
                icon: <CreditCard className="h-4.5 w-4.5 text-[#027244]" />,
                bg: 'bg-emerald-50 border-emerald-100/30'
              },
              {
                title: 'Live Referral Tracking',
                desc: 'Keep track of all click referrals, reward history, and redemption status from a custom dashboard.',
                icon: <ShieldCheck className="h-4.5 w-4.5 text-[#001c41]" />,
                bg: 'bg-blue-50 border-blue-100/30'
              }
            ].map((feature, i) => (
              <div key={i} className={`p-4 border rounded-2xl flex gap-3 items-start ${feature.bg} shadow-2xs`}>
                <span className="p-2 bg-white rounded-xl shadow-3xs shrink-0">{feature.icon}</span>
                <div className="flex flex-col gap-0.5 text-left">
                  <h4 className="font-extrabold text-[#001c41] text-[12.5px]">{feature.title}</h4>
                  <p className="text-[10.5px] text-slate-500 font-semibold leading-relaxed mt-0.5">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-grow w-full bg-white border border-slate-200 shadow-md rounded-[32px] p-6 md:p-8 flex flex-col gap-5">
          <h2 className="text-lg font-black text-slate-800 text-left border-b border-slate-100 pb-3 flex items-center gap-2">
            <User className="h-5 w-5 text-[#027244]" /> Partner Basic Details
          </h2>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3.5 text-xs font-bold flex items-center gap-2 animate-fadeIn text-left">
              <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-255 text-[#027244] rounded-xl p-3.5 text-xs font-bold flex items-center gap-2 animate-fadeIn text-left">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4.5 text-left">
            {/* Prefilled: Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest flex items-center gap-1">
                Full Name <span className="text-slate-400 font-medium lowercase">(default - editable)</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="e.g. Harish Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3.5 border border-slate-250 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/20"
                />
              </div>
            </div>

            {/* Prefilled: Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest flex items-center gap-1">
                Email Address <span className="text-slate-400 font-medium lowercase">(default - editable)</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  placeholder="e.g. name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3.5 border border-slate-250 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/20"
                />
              </div>
            </div>

            {/* Prefilled: Mobile */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-455 uppercase tracking-widest flex items-center gap-1">
                Mobile Number <span className="text-slate-400 font-medium lowercase">(default - editable)</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3.5 border border-slate-250 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4.5 border-t border-slate-100 pt-5 mt-1.5">
              {/* Aadhaar Number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-455 uppercase tracking-widest">
                  Aadhaar Card Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                    <CreditCard className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    maxLength={12}
                    placeholder="12-digit Aadhaar Card Number"
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                    required
                    className="w-full pl-10 pr-4 py-3.5 border border-slate-250 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-455 uppercase tracking-widest">
                  Residential Address
                </label>
                <div className="relative">
                  <span className="absolute top-4.5 left-4 text-slate-400">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <textarea
                    placeholder="Complete Residential Address details..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 border border-slate-250 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-4 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader className="h-4.5 w-4.5 animate-spin" /> Completing Onboarding...
                </>
              ) : (
                'Submit & Register'
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#001c41] py-4 text-center text-xs text-slate-450 border-t border-slate-800">
        <span>© 2025 Udumalpet Business Tour. All rights reserved.</span>
      </footer>
    </div>
  );
}
