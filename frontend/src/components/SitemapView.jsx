import { Link } from 'react-router-dom';
import { 
  Home, Store, Grid, Calendar, BookOpen, Heart, Users, Shield, 
  HelpCircle, Info, FileText, ArrowRight, MapPin, Gift, CreditCard
} from 'lucide-react';

export default function SitemapView() {
  const directoryLinks = [
    { to: '/', label: 'Home Page', desc: 'Welcome page and platform overview', icon: <Home className="h-4 w-4 text-emerald-500" /> },
    { to: '/businesses', label: 'Business Directory', desc: 'Browse and search local businesses', icon: <Store className="h-4 w-4 text-emerald-500" /> },
    { to: '/categories', label: 'Categories Explorer', desc: 'Explore businesses by specific sectors', icon: <Grid className="h-4 w-4 text-emerald-500" /> },
    { to: '/events', label: 'Community Events', desc: 'Local community events and festivals', icon: <Calendar className="h-4 w-4 text-emerald-500" /> },
    { to: '/blogs', label: 'UBT Local Blogs', desc: 'News, announcements and local updates', icon: <BookOpen className="h-4 w-4 text-emerald-500" /> },
    { to: '/blood-donors', label: 'Blood Donors Directory', desc: 'Find active emergency donors in Udumalpet', icon: <Heart className="h-4 w-4 text-rose-500" /> },
    { to: '/partner-register', label: 'Partner Program', desc: 'Register as an affiliate/partner', icon: <Users className="h-4 w-4 text-emerald-500" /> },
    { to: '/choose-plan', label: 'Subscription Plans', desc: 'Premium listings pricing packages', icon: <CreditCard className="h-4 w-4 text-emerald-500" /> }
  ];

  const categoryLinks = [
    { to: '/hotels-in-udumalpet', label: 'Hotels & Restaurants' },
    { to: '/shopping-in-udumalpet', label: 'Shopping & Retail' },
    { to: '/hospitals-in-udumalpet', label: 'Hospitals & Healthcare' },
    { to: '/schools-in-udumalpet', label: 'Schools & Education' },
    { to: '/textiles-in-udumalpet', label: 'Textiles & Clothing' },
    { to: '/construction-in-udumalpet', label: 'Builders & Construction' },
    { to: '/automobiles-in-udumalpet', label: 'Automotive & Showrooms' },
    { to: '/real-estate-in-udumalpet', label: 'Real Estate & Properties' }
  ];

  const infoLinks = [
    { to: '/about', label: 'About Us', desc: 'Mission, vision, and team details', icon: <Info className="h-4 w-4 text-blue-500" /> },
    { to: '/business-guidelines', label: 'Business Guidelines', desc: 'Listing code of conduct rules', icon: <Shield className="h-4 w-4 text-blue-500" /> },
    { to: '/terms', label: 'Terms of Service', desc: 'User agreement and terms of use', icon: <FileText className="h-4 w-4 text-blue-500" /> },
    { to: '/privacy', label: 'Privacy Policy', desc: 'Data protection and cookie policies', icon: <FileText className="h-4 w-4 text-blue-500" /> },
    { to: '/refund-policy', label: 'Refund Policy', desc: 'Details on listing refund claims', icon: <FileText className="h-4 w-4 text-blue-500" /> }
  ];

  const portalLinks = [
    { to: '/login', label: 'Merchant Login' },
    { to: '/register', label: 'Register Account' },
    { to: '/reset-password', label: 'Recover Password' }
  ];

  return (
    <div className="w-full bg-[#f8fafc] py-16 px-4 md:px-8 font-sans text-[#001c41]">
      <div className="max-w-6xl mx-auto flex flex-col gap-12">
        
        {/* Page Header */}
        <div className="text-left flex flex-col gap-2 border-b border-slate-200 pb-8">
          <span className="text-[10px] uppercase font-black tracking-widest text-[#027244]">Sitemap Directory</span>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-[#001c41]">
            HTML Sitemap & Navigation Desk
          </h1>
          <p className="text-sm text-slate-500 font-semibold max-w-2xl leading-relaxed">
            Quickly locate any public directory page, administrative section, policy documentation, or business category listing inside the Udumalpet Business Tour (UBT) platform.
          </p>
        </div>

        {/* Sitemap Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Section 1: Main Platform Pages */}
          <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-[28px] shadow-sm flex flex-col gap-6 text-left transition-all hover:shadow">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 bg-emerald-50 text-[#027244] rounded-xl flex items-center justify-center border border-emerald-100/50">
                <Store className="h-4.5 w-4.5" />
              </div>
              <h2 className="text-lg font-black tracking-tight text-[#001c41]">Core Directory Portals</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {directoryLinks.map((link) => (
                <Link 
                  key={link.to} 
                  to={link.to} 
                  className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all group"
                >
                  <div className="mt-0.5 shrink-0">{link.icon}</div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-black group-hover:text-emerald-700 transition-colors">{link.label}</span>
                    <span className="text-[10px] text-slate-400 font-semibold mt-0.5">{link.desc}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Section 2: Info & Policies */}
          <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-[28px] shadow-sm flex flex-col gap-6 text-left transition-all hover:shadow">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100/50">
                <Shield className="h-4.5 w-4.5" />
              </div>
              <h2 className="text-lg font-black tracking-tight text-[#001c41]">Documentation & Guidelines</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {infoLinks.map((link) => (
                <Link 
                  key={link.to} 
                  to={link.to} 
                  className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 transition-all group"
                >
                  <div className="mt-0.5 shrink-0">{link.icon}</div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-black group-hover:text-blue-700 transition-colors">{link.label}</span>
                    <span className="text-[10px] text-slate-400 font-semibold mt-0.5">{link.desc}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Section 3: Popular Business Categories */}
          <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-[28px] shadow-sm flex flex-col gap-6 text-left transition-all hover:shadow">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100/50">
                <Grid className="h-4.5 w-4.5" />
              </div>
              <h2 className="text-lg font-black tracking-tight text-[#001c41]">Local Business Categories</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {categoryLinks.map((cat) => (
                <Link 
                  key={cat.to} 
                  to={cat.to} 
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-50 hover:bg-amber-50/20 hover:border-amber-200 text-xs font-bold text-slate-650 group transition-all"
                >
                  <span className="group-hover:text-amber-800">{cat.label}</span>
                  <ArrowRight className="h-3 w-3 text-slate-350 opacity-0 group-hover:opacity-100 group-hover:text-amber-700 transition-all" />
                </Link>
              ))}
            </div>
          </div>

          {/* Section 4: Portals & Utility Links */}
          <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-[28px] shadow-sm flex flex-col gap-6 text-left transition-all hover:shadow">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center border border-rose-100/50">
                <Users className="h-4.5 w-4.5" />
              </div>
              <h2 className="text-lg font-black tracking-tight text-[#001c41]">Merchant Portals</h2>
            </div>
            <div className="flex flex-col gap-3">
              {portalLinks.map((port) => (
                <Link 
                  key={port.to} 
                  to={port.to} 
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:bg-rose-50/20 hover:border-rose-200 text-xs font-black text-slate-700 group transition-all"
                >
                  <span className="group-hover:text-rose-700">{port.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-rose-600 transition-colors" />
                </Link>
              ))}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mt-1 text-[11px] text-slate-450 leading-relaxed font-semibold">
                Looking to host your local directory ads, events, or sponsorships? Reach out at <a href="mailto:info@udumalpet.business" className="text-emerald-600 font-extrabold hover:underline">info@udumalpet.business</a>.
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
