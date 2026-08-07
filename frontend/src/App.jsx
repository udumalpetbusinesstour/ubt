import { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useParams } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './app/page';
import BusinessesingsPage from './app/businesses/page';
import BusinessDetail from './app/businesses/[id]/page';
import AddBusiness from './app/add-business/page';
import AdminDashboard from './app/admin/page';
import SuperAdminDashboard from './app/superadmin/page';
import Dashboard from './app/dashboard/page';
import Login from './app/login/page';
import Register from './app/register/page';
import ResetPassword from './app/reset-password/page';
import VerifyEmail from './app/verify-email/page';
import ChoosePlan from './app/choose-plan/page';
import EventsPage from './app/events/page';
import EventDetail from './app/events/[id]/page';
import BlogsPage from './app/blogs/page';
import BlogDetail from './app/blogs/[id]/page';
import AboutPage from './app/about/page';
import UserProfile from './app/profile/page';
import ReferralModal from './components/ReferralModal';
import UpdatePopup from './components/UpdatePopup';
import CookieConsent from './components/CookieConsent';
import BloodDonorsPage from './app/blood-donors/page';
import PartnerRegister from './app/partner-register/page';
import SitemapPage from './app/sitemap/page';
import GlobalModalProvider from './components/GlobalModalProvider';
import ItemDetail from './app/items/[slug]/page';

function SlugRouteWrapper() {
  const { id, subtab, businessSlug } = useParams();
  const [routeType, setRouteType] = useState('loading'); // 'loading', 'category', 'event', 'blog', 'business'

  const knownSubtabs = ['overview', 'menu', 'catalog', 'services', 'photos', 'reviews', 'offers', 'about', 'branches', 'blogs', 'map'];
  
  // If matched by /:businessSlug/:id (where both params exist), but the second segment (id) is a known business subtab:
  // we actually want to treat businessSlug as the business ID, and id as the subtab.
  const isSecondSegmentSubtab = !!businessSlug && id && knownSubtabs.includes(id.toLowerCase());
  
  const effectiveBusinessId = isSecondSegmentSubtab ? businessSlug : (businessSlug ? businessSlug : id);
  const effectiveSubtab = isSecondSegmentSubtab ? id : (businessSlug ? undefined : subtab);
  
  const isBusinessSubtab = effectiveSubtab && knownSubtabs.includes(effectiveSubtab.toLowerCase());
  const isBlogOrEventRoute = !isSecondSegmentSubtab && (!!businessSlug || (!!effectiveSubtab && !isBusinessSubtab));

  // The actual slug to look up in the database
  const lookupSlug = isBlogOrEventRoute ? (businessSlug ? id : subtab) : effectiveBusinessId;
  const lowerLookupSlug = (lookupSlug || '').toLowerCase();

  useEffect(() => {
    // 1. Check if it is a catalog item slug like "name-for-sale-in-udumalpet"
    if (!isBlogOrEventRoute && (lowerLookupSlug.endsWith('-for-sale-in-udumalpet') || lowerLookupSlug.endsWith('-for-sale-in-udmalpet'))) {
      setRouteType('catalogItem');
      return;
    }

    // 2. Check if it is a category (only for single segment URLs)
    if (!isBlogOrEventRoute && lowerLookupSlug.endsWith('-in-udumalpet')) {
      setRouteType('category');
      return;
    }

    // 2. Check if it is a standard business detail URL
    if (!isBlogOrEventRoute) {
      setRouteType('business');
      return;
    }

    // 3. For blogs or events, fetch the lookup endpoint
    let active = true;
    const fetchType = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/slug-lookup/${encodeURIComponent(lookupSlug)}`);
        const data = await res.json();
        if (active) {
          if (data.success) {
            setRouteType(data.type);
          } else {
            setRouteType('blog'); // Default fallback
          }
        }
      } catch (err) {
        if (active) {
          setRouteType('blog'); // Default fallback
        }
      }
    };

    fetchType();
    return () => {
      active = false;
    };
  }, [lookupSlug, lowerLookupSlug, isBlogOrEventRoute]);

  if (routeType === 'loading') {
    return (
      <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
        <span className="h-8 w-8 animate-spin border-4 border-emerald-600 border-t-transparent rounded-full" />
        <span className="text-xs font-bold">Loading...</span>
      </div>
    );
  }

  if (routeType === 'catalogItem') {
    return <ItemDetail />;
  }

  if (routeType === 'category') {
    return <BusinessesingsPage />;
  }

  if (routeType === 'event') {
    return <EventDetail />;
  }

  if (routeType === 'blog') {
    return <BlogDetail />;
  }

  return <BusinessDetail idOverride={effectiveBusinessId} subtabOverride={effectiveSubtab} />;
}

function AppContent() {
  const location = useLocation();
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [customDomainBiz, setCustomDomainBiz] = useState(null);
  const [customDomainLoading, setCustomDomainLoading] = useState(true);

  useEffect(() => {
    const hostname = window.location.hostname;
    const isMainDomain = hostname === 'udumalpet.business' || 
                         hostname === 'www.udumalpet.business' || 
                         hostname === 'localhost' || 
                         hostname === '127.0.0.1';

    // Allow testing via query parameter, e.g. localhost:3000/?custom_domain=controln.in
    const urlParams = new URLSearchParams(window.location.search);
    const testDomain = urlParams.get('custom_domain');
    const activeDomain = (!isMainDomain) ? hostname : testDomain;

    if (activeDomain) {
      (async () => {
        try {
          const res = await fetch(`http://localhost:5000/api/businesses/by-domain/${encodeURIComponent(activeDomain)}`);
          const data = await res.json();
          if (data.success && data.data) {
            setCustomDomainBiz(data.data);
          }
        } catch (err) {
          console.error('Error checking custom domain:', err);
        } finally {
          setCustomDomainLoading(false);
        }
      })();
    } else {
      setCustomDomainLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleOpenModal = () => setIsReferralModalOpen(true);
    window.addEventListener('open-referral-modal', handleOpenModal);
    return () => window.removeEventListener('open-referral-modal', handleOpenModal);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('ubt_guest_id')) {
      localStorage.setItem('ubt_guest_id', 'guest_' + Math.random().toString(36).substr(2, 9));
    }
  }, []);
  
  // Update canonical tag dynamically
  useEffect(() => {
    const link = document.querySelector("link[rel='canonical']") || document.createElement("link");
    link.setAttribute("rel", "canonical");
    link.setAttribute("href", `https://udumalpet.business${location.pathname}`);
    if (!document.querySelector("link[rel='canonical']")) {
      document.head.appendChild(link);
    }
  }, [location.pathname]);

  const lastFirstSegment = useRef('');

  useEffect(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const firstSegment = segments[0] || '';

    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        const timer = setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
        return () => clearTimeout(timer);
      }
    } else {
      // Only scroll to top if the primary page section/first segment has changed
      if (firstSegment !== lastFirstSegment.current) {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    }

    lastFirstSegment.current = firstSegment;
  }, [location.pathname, location.hash]);

  // Track navigation count synchronously during render (before children mount and check it)
  if (typeof window !== 'undefined') {
    if (window.__spa_nav_count === undefined) {
      window.__spa_nav_count = 0;
    }
    if (window.__spa_last_pathname !== location.pathname) {
      window.__spa_last_pathname = location.pathname;
      window.__spa_nav_count++;
    }
  }


  const hideNavAndFooter = location.pathname.startsWith('/dashboard') || 
                           location.pathname.startsWith('/admin') || 
                           location.pathname.startsWith('/superadmin') ||
                           location.pathname.startsWith('/partner-register');

  const getMainPageKey = (pathname) => {
    if (pathname.startsWith('/dashboard')) return '/dashboard';
    if (pathname.startsWith('/superadmin')) return '/superadmin';
    if (pathname.startsWith('/admin')) return '/admin';
    
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 2 && !['businesses', 'events', 'blogs', 'profile'].includes(parts[0])) {
      return '/' + parts[0];
    }
    if (parts.length === 3 && parts[0] === 'businesses') {
      return '/businesses/' + parts[1];
    }
    return pathname;
  };

  if (customDomainLoading) {
    return (
      <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-3 min-h-screen bg-[#F8FAFC]">
        <span className="h-8 w-8 animate-spin border-4 border-emerald-600 border-t-transparent rounded-full" />
        <span className="text-xs font-bold text-slate-500 font-sans animate-pulse">Resolving custom domain...</span>
      </div>
    );
  }

  if (customDomainBiz) {
    const segments = location.pathname.split('/').filter(Boolean);
    const activeSubtab = segments[0];

    return (
      <div className="w-full min-h-screen flex flex-col justify-between bg-[#F8FAFC]">
        <main className="flex-grow animate-page-entrance">
          <BusinessDetail idOverride={customDomainBiz.slug || customDomainBiz._id} subtabOverride={activeSubtab} />
        </main>
        <ReferralModal isOpen={isReferralModalOpen} onClose={() => setIsReferralModalOpen(false)} />
        <CookieConsent />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col justify-between bg-[#F8FAFC]">
      {!hideNavAndFooter && <Navbar />}
      <main key={getMainPageKey(location.pathname)} className="flex-grow animate-page-entrance">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/businesses" element={<BusinessesingsPage />} />
          <Route path="/categories" element={<BusinessesingsPage forceFocus="categories" />} />
          <Route path="/businesses/:id/:subtab?" element={<BusinessDetail />} />
          <Route path="/add-business" element={<AddBusiness />} />
          <Route path="/admin/:tab?" element={<AdminDashboard />} />
          <Route path="/superadmin/:tab?" element={<SuperAdminDashboard />} />
          <Route path="/dashboard/:tab?" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login-partner" element={<Login isPartnerFlow={true} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-partner" element={<Register isPartnerFlow={true} />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/choose-plan" element={<ChoosePlan />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/blogs" element={<BlogsPage />} />
          <Route path="/blogs/:id" element={<BlogDetail />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/profile/:id" element={<UserProfile />} />
          <Route path="/blood-donors" element={<BloodDonorsPage />} />
          <Route path="/partner-register" element={<PartnerRegister />} />
          <Route path="/sitemap" element={<SitemapPage />} />
          <Route path="/items/:slug" element={<ItemDetail />} />
          <Route path="/privacy-policy" element={<BusinessesingsPage forceFocus="privacy" />} />
          <Route path="/privacy" element={<BusinessesingsPage forceFocus="privacy" />} />
          <Route path="/terms-of-service" element={<BusinessesingsPage forceFocus="terms" />} />
          <Route path="/terms" element={<BusinessesingsPage forceFocus="terms" />} />
          <Route path="/refund-policy" element={<BusinessesingsPage forceFocus="refund" />} />
          <Route path="/business-guidelines" element={<BusinessesingsPage forceFocus="guidelines" />} />
          <Route path="/:businessSlug/:id" element={<SlugRouteWrapper />} />
          <Route path="/:id/:subtab?" element={<SlugRouteWrapper />} />
        </Routes>
      </main>
      {!hideNavAndFooter && <Footer />}
      <ReferralModal isOpen={isReferralModalOpen} onClose={() => setIsReferralModalOpen(false)} />
      {!hideNavAndFooter && <UpdatePopup />}
      <CookieConsent />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <GlobalModalProvider>
        <AppContent />
      </GlobalModalProvider>
    </Router>
  );
}
