import { useEffect, useState } from 'react';
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
import GlobalModalProvider from './components/GlobalModalProvider';

function SlugRouteWrapper() {
  const { id, subtab, businessSlug } = useParams();
  const [routeType, setRouteType] = useState('loading'); // 'loading', 'category', 'event', 'blog', 'business'

  // Determine if this is a blog or event route (either /:businessSlug/:id OR subtab is present but not a known subtab)
  const knownSubtabs = ['overview', 'menu', 'services', 'photos', 'reviews', 'offers', 'about', 'branches', 'blogs', 'map'];
  const isBusinessSubtab = subtab && knownSubtabs.includes(subtab.toLowerCase());
  const isBlogOrEventRoute = !!businessSlug || (!!subtab && !isBusinessSubtab);

  // The actual slug to look up in the database
  const lookupSlug = isBlogOrEventRoute ? (businessSlug ? id : subtab) : id;
  const lowerLookupSlug = (lookupSlug || '').toLowerCase();

  useEffect(() => {
    // 1. Check if it is a category (only for single segment URLs)
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

  if (routeType === 'category') {
    return <BusinessesingsPage />;
  }

  if (routeType === 'event') {
    return <EventDetail />;
  }

  if (routeType === 'blog') {
    return <BlogDetail />;
  }

  return <BusinessDetail />;
}

function AppContent() {
  const location = useLocation();
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  
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
  
  useEffect(() => {
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
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
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

  return (
    <div className="w-full min-h-screen flex flex-col justify-between bg-[#F8FAFC]">
      {!hideNavAndFooter && <Navbar />}
      <main key={getMainPageKey(location.pathname)} className="flex-grow animate-page-entrance">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/businesses" element={<BusinessesingsPage />} />
          <Route path="/businesses/:id/:subtab?" element={<BusinessDetail />} />
          <Route path="/add-business" element={<AddBusiness />} />
          <Route path="/admin/:tab?" element={<AdminDashboard />} />
          <Route path="/superadmin/:tab?" element={<SuperAdminDashboard />} />
          <Route path="/dashboard/:tab?" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
