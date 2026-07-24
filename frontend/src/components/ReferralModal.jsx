import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Gift, Award, Share2, Send, Store, Coins, CheckCircle, 
  X, Heart, Sparkles, ShieldCheck, Trophy
} from 'lucide-react';

export default function ReferralModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [yearlyPrice, setYearlyPrice] = useState(999);
  const [topReferrers, setTopReferrers] = useState([
    { name: 'Lakshmi Textiles', referralsCount: 32 },
    { name: 'Sri Electricals', referralsCount: 27 },
    { name: 'ABC Traders', referralsCount: 21 }
  ]);

  const [userRole, setUserRole] = useState('partner');

  useEffect(() => {
    // Check auth status
    const storedUser = localStorage.getItem('ubt_user');
    const storedToken = localStorage.getItem('ubt_token');
    setIsLoggedIn(!!(storedUser && storedToken));
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        // We still check their actual role to show proper dashboard/join button links,
        // but the presentation of milestones is partner-only.
      } catch (e) {}
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchTopReferrers = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/referrals/top');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setTopReferrers(data.data);
        }
      } catch (err) {
        console.error('Error fetching top referrers:', err);
      }
    };

    fetchTopReferrers();

    const fetchPlanPrice = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/plans');
        const data = await res.json();
        if (data.success && data.data) {
          const yearly = data.data.find(p => p.type === 'Yearly');
          if (yearly) setYearlyPrice(yearly.price);
        }
      } catch (err) {
        console.warn('Error fetching plan price inside ReferralModal:', err);
      }
    };
    fetchPlanPrice();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleActionClick = () => {
    onClose();
    if (isLoggedIn) {
      navigate('/dashboard');
    } else {
      navigate('/login?redirect=%2Fdashboard&from=business');
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
    >
      {/* Modal Dialog */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="max-w-6xl w-full bg-white border border-slate-200 shadow-2xl rounded-[32px] p-6 md:p-10 flex flex-col gap-8 animate-scaleUp text-left max-h-[90vh] overflow-y-auto scrollbar-none relative"
      >
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute right-6 top-6 text-slate-400 hover:text-slate-655 h-8 w-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* 1. HERO SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
          {/* Left side text column (7 cols on large screens) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <span className="text-[10px] font-black uppercase text-[#027244] tracking-wider">UBT Partner Network</span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#001c41] leading-tight">
              Refer. Earn. <span className="text-[#027244]">Redeem.</span>
            </h1>
            <p className="text-slate-500 text-xs md:text-sm font-semibold leading-relaxed max-w-xl">
              {userRole === 'partner' ? (
                <span>
                  Refer new businesses to UBT and earn high cash payouts! As a partner, you earn <span className="text-[#027244] font-bold">₹49</span> for every successful business registration, plus massive milestone cash bonuses (up to <span className="text-[#027244] font-bold">₹12,000</span> total for 100 referrals).
                </span>
              ) : (
                <span>
                  Refer new businesses to UBT and earn referral points. Registered business members earn <span className="text-[#027244] font-bold">99 points</span> per referral (11 referrals for ₹1,000 refund), while partners earn <span className="text-[#027244] font-bold">49 points</span> per referral.
                </span>
              )}
            </p>

            {/* Quick Steps Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 my-2">
              {/* Step 1 */}
              <div className="flex flex-col gap-1.5">
                <div className="h-9 w-9 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100/60 text-[#027244] shrink-0">
                  <Users className="h-4.5 w-4.5" />
                </div>
                <h4 className="font-extrabold text-[12px] text-[#001c41] uppercase tracking-wider">Refer a Business</h4>
                <p className="text-slate-500 text-[12px] font-medium leading-relaxed">
                  Share your referral link with friends or business connections.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col gap-1.5">
                <div className="h-9 w-9 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100/60 text-[#027244] shrink-0">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <h4 className="font-extrabold text-[12px] text-[#001c41] uppercase tracking-wider">They Join & Subscribe</h4>
                <p className="text-slate-500 text-[12px] font-medium leading-relaxed">
                  When they join and complete payment, you earn your rewards.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col gap-1.5">
                <div className="h-9 w-9 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100/60 text-[#027244] shrink-0">
                  <Gift className="h-4.5 w-4.5" />
                </div>
                <h4 className="font-extrabold text-[12px] text-[#001c41] uppercase tracking-wider">
                  {userRole === 'partner' ? 'Earn Cash Payouts' : '₹1,000 Cashback'}
                </h4>
                <p className="text-slate-500 text-[12px] font-medium leading-relaxed">
                  {userRole === 'partner' 
                    ? 'Get direct cash payouts from ₹49 up to ₹12,000 via UPI/Bank.'
                    : 'Redeem 1,000 points to claim a direct ₹1,000 cashback refund.'}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3.5 mt-2">
              {isLoggedIn ? (
                <button 
                  onClick={() => {
                    onClose();
                    navigate('/dashboard');
                  }}
                  className="py-3 px-6 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-98 border-none"
                >
                  Go to My Partner Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/register-partner');
                    }}
                    className="py-3 px-6 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-98 border-none"
                  >
                    Join as Partner to Earn Rewards
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/login-partner');
                    }}
                    className="py-3 px-6 bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-98 border-none"
                  >
                    Partner Login
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right side Illustration column (5 cols) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[340px] rounded-3xl bg-white p-2.5 border border-slate-200/60 shadow-md">
              <img 
                src="/referral_hero.jpg" 
                alt="UBT Referral Program illustration" 
                className="w-full h-auto object-contain rounded-2xl select-none"
              />
            </div>
          </div>
        </section>

        {/* 2. HOW IT WORKS SECTION */}
        <section className="bg-slate-50/50 border border-slate-200/60 rounded-3xl py-8 px-6 text-center flex flex-col gap-6 scroll-mt-10">
          <div className="flex flex-col items-center gap-1">
            <h2 className="text-xl font-extrabold text-[#001c41]">How It Works</h2>
            <div className="h-1 w-10 bg-[#027244] rounded-full mt-0.5" />
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            
            {/* Step 01 */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="relative">
                <div className="h-12 w-12 bg-white border border-slate-200 shadow-2xs hover:border-[#027244] transition-colors rounded-full flex items-center justify-center text-[#027244]">
                  <Share2 className="h-5 w-5" />
                </div>
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-[#027244] text-white font-extrabold text-[10px] rounded-full flex items-center justify-center select-none shadow-sm">
                  01
                </span>
              </div>
              <h4 className="font-extrabold text-[13.5px] text-[#001c41]">Get Your Referral Link</h4>
              <p className="text-slate-500 text-[12px] font-medium leading-relaxed max-w-[180px]">
                Login to your dashboard and get your unique referral link or code.
              </p>
            </div>

            {/* Step 02 */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="relative">
                <div className="h-12 w-12 bg-white border border-slate-200 shadow-2xs hover:border-[#027244] transition-colors rounded-full flex items-center justify-center text-[#027244]">
                  <Send className="h-5 w-5" />
                </div>
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-[#027244] text-white font-extrabold text-[10px] rounded-full flex items-center justify-center select-none shadow-sm">
                  02
                </span>
              </div>
              <h4 className="font-extrabold text-[13.5px] text-[#001c41]">Share With Others</h4>
              <p className="text-slate-500 text-[12px] font-medium leading-relaxed max-w-[180px]">
                Share your link with your friends, family or any business owner around you.
              </p>
            </div>

            {/* Step 03 */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="relative">
                <div className="h-12 w-12 bg-white border border-slate-200 shadow-2xs hover:border-[#027244] transition-colors rounded-full flex items-center justify-center text-[#027244]">
                  <Store className="h-5 w-5" />
                </div>
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-[#027244] text-white font-extrabold text-[10px] rounded-full flex items-center justify-center select-none shadow-sm">
                  03
                </span>
              </div>
              <h4 className="font-extrabold text-[13.5px] text-[#001c41]">They Join UBT</h4>
              <p className="text-slate-500 text-[12px] font-medium leading-relaxed max-w-[180px]">
                When they register and subscribe to any paid plan, the referral is successful.
              </p>
            </div>

            {/* Step 04 */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="relative">
                <div className="h-12 w-12 bg-white border border-slate-200 shadow-2xs hover:border-[#027244] transition-colors rounded-full flex items-center justify-center text-[#027244]">
                  <Coins className="h-5 w-5" />
                </div>
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-[#027244] text-white font-extrabold text-[10px] rounded-full flex items-center justify-center select-none shadow-sm">
                  04
                </span>
              </div>
              <h4 className="font-extrabold text-[13.5px] text-[#001c41]">
                {userRole === 'partner' ? 'You Request Payout' : 'You Redeem for Cashback'}
              </h4>
              <p className="text-slate-500 text-[12px] font-medium leading-relaxed max-w-[180px]">
                {userRole === 'partner'
                  ? 'Request payout once your balance is at least ₹500 (the amount is rounded-off).'
                  : 'You earn points that can be redeemed for a direct ₹1,000 cashback refund from the admin.'}
              </p>
            </div>

          </div>
        </section>
        {/* 3. CONVERSIONS AND CALCULATOR */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left column - Earn More, Refund More */}
          <div className="bg-white border border-slate-200 shadow-2xs rounded-3xl p-5 md:p-6 flex flex-col gap-5 text-left">
            <div className="flex flex-col gap-0.5 border-b border-slate-100 pb-2.5">
              <h3 className="text-base font-extrabold text-slate-800">
                {userRole === 'partner' ? 'Partner Milestone Bonuses' : 'Referral Point Milestones'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {userRole === 'partner' 
                  ? 'Unlock high cash bonuses as your successful business referral count grows.'
                  : 'Accumulate referral points and redeem 1,000 points for a ₹1,000 cashback refund.'}
              </p>
            </div>

            {userRole === 'partner' ? (
              <div className="overflow-hidden border border-slate-200/85 rounded-xl">
                <table className="w-full text-xs font-bold text-slate-700 text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase text-[9px] tracking-wider">
                      <th className="px-4 py-2">Referrals</th>
                      <th className="px-4 py-2">Base Earnings</th>
                      <th className="px-4 py-2">Milestone Bonus</th>
                      <th className="px-4 py-2">Total Cash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { ref: '1 Business', base: '₹49', bonus: '—', total: '₹49' },
                      { ref: '10 Businesses', base: '₹490', bonus: '+ ₹100', total: '₹590' },
                      { ref: '25 Businesses', base: '₹1,225', bonus: '+ ₹500 (Total ₹600)', total: '₹1,825' },
                      { ref: '50 Businesses', base: '₹2,450', bonus: '+ ₹1,500 (Total ₹2,100)', total: '₹4,550' },
                      { ref: '100 Businesses', base: '₹4,900', bonus: '+ ₹5,000 (Total ₹7,100)', total: '₹12,000 *' }
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2 text-slate-800 font-extrabold">{row.ref}</td>
                        <td className="px-4 py-2 text-slate-500">{row.base}</td>
                        <td className="px-4 py-2 text-emerald-650">{row.bonus}</td>
                        <td className="px-4 py-2 text-[#027244] font-black">{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-hidden border border-slate-200/85 rounded-xl">
                <table className="w-full text-xs font-bold text-slate-700 text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase text-[9px] tracking-wider">
                      <th className="px-4 py-2">Referrals</th>
                      <th className="px-4 py-2">Points Earned</th>
                      <th className="px-4 py-2">Redemption Option</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { ref: '1 Business', pts: '99 Points', val: 'Accumulate' },
                      { ref: '5 Businesses', pts: '495 Points', val: 'Accumulate' },
                      { ref: '10 Businesses', pts: '990 Points', val: 'Accumulate' },
                      { ref: '11 Businesses', pts: '1089 Points', val: 'Redeem for ₹1,000 Cashback' }
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2 text-slate-800 font-extrabold">{row.ref}</td>
                        <td className="px-4 py-2 text-slate-500">{row.pts}</td>
                        <td className="px-4 py-2 text-[#027244] font-black">{row.val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* conversion banner info */}
            <div className="bg-emerald-50/45 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
              <div className="h-8 w-8 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 text-[#027244] shrink-0 mt-0.5">
                <Award className="h-4.5 w-4.5" />
              </div>
              <div className="flex flex-col gap-0.5 text-slate-700 leading-normal text-xs">
                {userRole === 'partner' ? (
                  <>
                    <span className="font-extrabold text-slate-800">Earn ₹49 per referral. Avail milestone bonuses once reached, and request payout when balance is at least ₹500.</span>
                    <span className="text-[#027244] font-black mt-0.5">* Reaching 100 referrals awards you "Gold Partner" recognition status!</span>
                  </>
                ) : (
                  <>
                    <span className="font-extrabold text-slate-800">Once you reach 1,000 points, redeem them on the merchant dashboard.</span>
                    <span className="text-[#027244] font-black mt-0.5">1 Referral = 99 Points</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right column - Example calculator */}
          <div className="bg-white border border-slate-200 shadow-2xs rounded-3xl p-5 md:p-6 flex flex-col gap-5 text-left">
            <div className="flex flex-col gap-0.5 border-b border-slate-100 pb-2.5">
              <h3 className="text-base font-extrabold text-slate-800">
                {userRole === 'partner' ? 'How Partner Payouts Work' : 'Example: How You Redeem'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {userRole === 'partner' 
                  ? 'Step-by-step payout logic and direct bank/UPI transfer details.'
                  : 'Step-by-step example showing manual refund redemption flows.'}
              </p>
            </div>

            {userRole === 'partner' ? (
              <div className="flex flex-col gap-3 font-semibold text-xs border border-slate-200/80 rounded-xl p-4 bg-slate-50/30">
                <div className="flex justify-between border-b border-slate-100 pb-2 text-slate-500">
                  <span>Base Rate per Referral</span>
                  <span className="font-extrabold text-slate-800">₹49 / registration</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2 text-slate-500">
                  <span>First Milestone (10 Referrals)</span>
                  <span className="font-extrabold text-slate-800">₹490 + ₹100 Bonus = ₹590</span>
                </div>
                 <div className="flex justify-between pt-1.5 text-xs">
                   <span className="font-extrabold text-slate-800">Maximum Earning (100 Referrals)</span>
                   <span className="font-black text-[#027244] text-sm">₹12,000 Payout</span>
                 </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 font-semibold text-xs border border-slate-200/80 rounded-xl p-4 bg-slate-50/30">
                <div className="flex justify-between border-b border-slate-100 pb-2 text-slate-500">
                  <span>Required Points for Cashback</span>
                  <span className="font-extrabold text-slate-850">1,000 Points</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2 text-slate-500">
                  <span>Successful Referred Businesses</span>
                  <span className="font-extrabold text-slate-800">11 Businesses</span>
                </div>
                <div className="flex justify-between pt-1.5 text-xs">
                  <span className="font-extrabold text-slate-800">Redeemable Value</span>
                  <span className="font-black text-[#027244] text-sm">₹1,000 Cashback Refund</span>
                </div>
              </div>
            )}

            {/* piggy banner info */}
            <div className="bg-emerald-50/45 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
              <div className="h-8 w-8 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 text-[#027244] shrink-0 mt-0.5">
                <Coins className="h-4.5 w-4.5" />
              </div>
              <div className="flex flex-col gap-0.5 text-slate-700 leading-normal text-xs">
                {userRole === 'partner' ? (
                  <>
                    <span className="font-extrabold text-slate-800">Earnings are active once referred businesses subscribe. Minimum payout is ₹500 (rounded-off).</span>
                    <span className="text-emerald-700 font-bold mt-0.5">Partner payouts are processed to your UPI/Bank Account within 2-3 business days.</span>
                  </>
                ) : (
                  <>
                    <span className="font-extrabold text-slate-800">Points are earned ONLY after success payment of referred member.</span>
                    <span className="text-emerald-700 font-bold mt-0.5">Manual cashback refund processed within 2-3 business days!</span>
                  </>
                )}
            </div>
          </div>
        </div>
      </section>

        {/* 4. WHY REFER BUSINESSES */}
        <section className="bg-white border-y border-slate-150 py-8 text-center flex flex-col gap-8">
          <div className="flex flex-col items-center gap-1">
            <h2 className="text-xl font-extrabold text-slate-805">Why Refer Businesses to UBT?</h2>
            <div className="h-1 w-10 bg-[#027244] rounded-full mt-0.5" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 text-center">
            
            {/* Card 1 */}
            <div className="flex flex-col items-center gap-2.5">
              <div className="h-11 w-11 bg-emerald-50 rounded-full border border-emerald-100 flex items-center justify-center text-[#027244] shadow-2xs">
                <Users className="h-5 w-5" />
              </div>
              <h4 className="font-extrabold text-[12px] text-[#001c41] uppercase tracking-wider leading-tight">Help Local Businesses Grow Online</h4>
              <p className="text-slate-500 text-[12px] font-medium leading-relaxed max-w-[170px] mx-auto">
                Support other businesses in getting discovered by thousands of customers.
              </p>
            </div>

            {/* Card 2 */}
            <div className="flex flex-col items-center gap-2.5">
              <div className="h-11 w-11 bg-emerald-50 rounded-full border border-emerald-100 flex items-center justify-center text-[#027244] shadow-2xs">
                <Coins className="h-5 w-5" />
              </div>
              <h4 className="font-extrabold text-[12px] text-[#001c41] uppercase tracking-wider leading-tight">Earn Cash Automatically</h4>
              <p className="text-slate-500 text-[12px] font-medium leading-relaxed max-w-[170px] mx-auto">
                Earn ₹49 cash for every successful business referral automatically.
              </p>
            </div>

            {/* Card 3 */}
            <div className="flex flex-col items-center gap-2.5">
              <div className="h-11 w-11 bg-emerald-50 rounded-full border border-emerald-100 flex items-center justify-center text-[#027244] shadow-2xs">
                <Gift className="h-5 w-5" />
              </div>
              <h4 className="font-extrabold text-[12px] text-[#001c41] uppercase tracking-wider leading-tight">Up to ₹12,000 Payouts</h4>
              <p className="text-slate-500 text-[12px] font-medium leading-relaxed max-w-[170px] mx-auto">
                Avail milestone bonuses (up to ₹7,100 additional) and request cash payouts directly to Bank/UPI.
              </p>
            </div>

            {/* Card 4 */}
            <div className="flex flex-col items-center gap-2.5">
              <div className="h-11 w-11 bg-emerald-50 rounded-full border border-emerald-100 flex items-center justify-center text-[#027244] shadow-2xs">
                <Award className="h-5 w-5" />
              </div>
              <h4 className="font-extrabold text-[12px] text-[#001c41] uppercase tracking-wider leading-tight">Be a Community Champion</h4>
              <p className="text-slate-500 text-[12px] font-medium leading-relaxed max-w-[170px] mx-auto">
                Top referrers will be featured on our platform as UBT Champions.
              </p>
            </div>

            {/* Card 5 */}
            <div className="flex flex-col items-center gap-2.5">
              <div className="h-11 w-11 bg-emerald-50 rounded-full border border-emerald-100 flex items-center justify-center text-[#027244] shadow-2xs">
                <Trophy className="h-5 w-5" />
              </div>
              <h4 className="font-extrabold text-[12px] text-[#001c41] uppercase tracking-wider leading-tight">Build a Stronger Network</h4>
              <p className="text-slate-500 text-[12px] font-medium leading-relaxed max-w-[170px] mx-auto">
                The more good businesses join, the stronger our local business community.
              </p>
            </div>

          </div>
        </section>

        {/* 5. TOP REFERRERS, TOP RECOGNITION */}
        <section className="bg-[#001c41] text-white rounded-[24px] p-6 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 text-left">
          {/* Left panel info */}
          <div className="flex-1 flex flex-col gap-2 text-left">
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-400 shrink-0" />
              <h3 className="text-base md:text-lg font-black font-sans leading-tight">Top Referrers, Top Recognition!</h3>
            </div>
            <p className="text-slate-300 text-[11px] font-semibold leading-relaxed max-w-sm">
              Top referrers will be recognized as UBT Community Champions on our platform and events.
            </p>
          </div>

          {/* Right leaderboard panel */}
          <div className="w-full md:max-w-xs bg-white border border-slate-200/80 rounded-xl p-4 text-[#001c41]">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3 select-none">
              <span className="font-black text-[9px] uppercase tracking-wider text-slate-500">Top Referrers This Month</span>
            </div>
            <div className="flex flex-col gap-2.5 font-sans text-[11px] font-semibold text-slate-700">
              {topReferrers.map((referrer, idx) => {
                const badgeStyles = [
                  'bg-amber-100 text-amber-800',     // Rank 1 (Gold)
                  'bg-slate-100 text-slate-800',     // Rank 2 (Silver)
                  'bg-orange-100 text-orange-850'    // Rank 3 (Bronze)
                ];
                const badgeStyle = badgeStyles[idx] || 'bg-slate-50 text-slate-600';
                const isLast = idx === topReferrers.length - 1;
                
                return (
                  <div 
                    key={idx} 
                    className={`flex justify-between items-center ${!isLast ? 'border-b border-slate-50 pb-1.5' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-4.5 w-4.5 rounded font-black flex items-center justify-center text-[9px] ${badgeStyle}`}>
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-805">{referrer.name}</span>
                    </div>
                    <span className="text-[#027244] font-black">{referrer.referralsCount} Referrals</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 6. BOTTOM BANNER */}
        <section className="border-t border-slate-150 pt-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] font-bold text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-655">
            <CheckCircle className="h-4 w-4 text-[#027244] shrink-0" />
            <span>Trusted by 500+ Businesses in Udumalpet</span>
          </div>
          <div className="text-slate-450 leading-relaxed text-center sm:text-right">
            Have questions? Contact us at <a href="mailto:info@udumalpet.business" className="text-slate-600 hover:text-[#027244] font-extrabold hover:underline transition-colors">info@udumalpet.business</a> | <a href="tel:+918925728260" className="text-slate-600 hover:text-[#027244] font-extrabold hover:underline transition-colors">+91 89257 28260</a>
          </div>
        </section>

      </div>
    </div>
  );
}
