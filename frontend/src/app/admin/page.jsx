import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, ToggleLeft, RefreshCw, Star, HelpCircle, Check, X, AlertCircle, AlertTriangle, 
  ArrowRight, Eye, Grid, Shield, CreditCard, LayoutDashboard, Store, BookOpen, Calendar, 
  MessageSquare, CreditCard as CardIcon, Bell, BarChart3, Settings, LogOut, Search, User, Users,
  MapPin, ChevronRight, Landmark, Trash2, Mail, Globe, Award, ShieldAlert, CheckCircle2,
  Clock, Plus, Filter, ShieldCheck as ShieldOk, Activity, Cpu, Database, Terminal, Gift, Smile,
  Upload, Heart, Copy, XCircle
} from 'lucide-react';
import BloodDonorsTab from '../../components/BloodDonorsTab';

const isBizDraft = (b) => {
  if (!b) return false;
  const totalPhotos = (b.galleryUrls ? (Array.isArray(b.galleryUrls) ? b.galleryUrls.length : (typeof b.galleryUrls === 'string' ? b.galleryUrls.split(',').filter(Boolean).length : 0)) : 0) + (b.logoUrl ? 1 : 0) + (b.coverImageUrl ? 1 : 0);
  return (
    (Array.isArray(b.tags) && b.tags.includes('draft')) ||
    !b.name ||
    !b.category ||
    !b.description ||
    !b.phone ||
    !b.pincode ||
    !b.address ||
    totalPhotos < 3
  );
};

const availableCategories = [
  'Automotive',
  'Beauty & Wellness',
  'Education',
  'Electronics',
  'Food & Restaurants',
  'Health & Medical',
  'Home Services',
  'Real Estate',
  'Shopping',
  'Manufacturing',
  'Professional Services',
  'Travel & Hospitality',
  'Construction',
  'Agriculture',
  'Finance & Insurance',
  'Events & Entertainment',
  'Sports & Fitness',
  'Governmental organisations',
  'Public Sector'
];

const parentCategoryMapping = {
  'Shopping': [
    'Grocery Stores', 'Supermarkets', 'Vegetable & Fruit Shops', 'Textile & Garments', 
    'Footwear Shops', 'Jewelry Shops', 'Gift Shops', 'Stationery & Book Stores', 
    'Furniture Shops', 'Hardware Stores', 'Paint Stores', 'Pet Shops', 'Cosmetic Stores'
  ],
  'Electronics': [
    'Mobile Stores', 'Computer & Laptop Stores', 'Electronics & Appliances'
  ],
  'Food & Restaurants': [
    'Restaurants', 'Hotels & Lodges', 'Bakeries', 'Cafes & Tea Shops', 
    'Sweet Shops', 'Fast Food Centers', 'Catering Services', 'Juice & Ice Cream Parlors'
  ],
  'Health & Medical': [
    'Hospitals', 'Clinics', 'Dental Clinics', 'Pharmacies', 
    'Diagnostic Labs', 'Physiotherapy Centers', 'Veterinary Clinics'
  ],
  'Beauty & Wellness': [
    'Beauty Parlours', 'Salons & Barbers', 'Spa & Wellness Centers'
  ],
  'Education': [
    'Schools', 'Colleges', 'Tuition Centers', 'Coaching Institutes', 
    'Computer Training Centers', 'Driving Schools'
  ],
  'Automotive': [
    'Car Showrooms', 'Bike Showrooms', 'Automobile Service Centers', 
    'Car Wash Services', 'Tyre Shops', 'Spare Parts Dealers', 'Petrol Bunks'
  ],
  'Home Services': [
    'Electricians', 'Plumbers', 'Carpenters', 'AC Service & Repair', 
    'Home Cleaning Services', 'Interior Designers', 'Pest Control Services'
  ],
  'Real Estate': [
    'Real Estate Agencies'
  ],
  'Construction': [
    'Builders & Contractors', 'Construction Material Suppliers', 'Cement & Steel Dealers', 
    'Architects', 'Borewell Services'
  ],
  'Agriculture': [
    'Farm Equipment Dealers', 'Coconut Traders', 'Fertilizer & Pesticide Shops', 
    'Dairy Farms', 'Poultry Farms', 'Agricultural Consultants', 'Irrigation Equipment Suppliers'
  ],
  'Professional Services': [
    'Chartered Accountants', 'Auditors', 'Advocates / Lawyers', 'Tax Consultants'
  ],
  'Finance & Insurance': [
    'Insurance Agents', 'Financial Advisors'
  ],
  'Events & Entertainment': [
    'Event Organizers', 'Wedding Planners', 'Photography & Videography', 
    'Decoration Services', 'Sound & Lighting Services', 'Printing & Flex Services'
  ],
  'Travel & Hospitality': [
    'Travel Agencies', 'Tours & Travels', 'Vehicle Rentals', 'Taxi Services', 'Bus Operators'
  ],
  'Sports & Fitness': [
    'Gyms', 'Yoga Centers', 'Sports Academies', 'Sports Equipment Stores'
  ],
  'Governmental organisations': [
    'Taluk Office', 'Municipality', 'Police Stations', 'Hospitals', 'Banks', 'Schools'
  ],
  'Public Sector': [
    'Temples', 'Govt Schools', 'Govt Offices', 'Govt Hospitals', 'Marriage Halls', 'Community Halls', 'Trusts & NGOs', 'Others'
  ]
};


export default function AdminDashboard() {
  const navigate = useNavigate();

  // Dynamic Categories calculation helpers
  const getAdminDynamicMainCategories = () => {
    const mainCats = new Set(availableCategories);
    if (Array.isArray(presetCategories)) {
      presetCategories.forEach(cat => {
        if (!cat.parentCategory || cat.parentCategory.trim() === '' || cat.parentCategory === 'Others') {
          if (cat.categoryName && cat.categoryName !== 'Others') {
            mainCats.add(cat.categoryName.trim());
          }
        } else {
          mainCats.add(cat.parentCategory.trim());
        }
      });
    }
    return Array.from(mainCats).sort();
  };

  const getAdminDynamicSubcategories = (parentCategory) => {
    if (!parentCategory) return [];
    const subs = new Set(parentCategoryMapping[parentCategory] || []);
    if (Array.isArray(presetCategories)) {
      presetCategories.forEach(cat => {
        if (cat.parentCategory && cat.parentCategory.toLowerCase() === parentCategory.toLowerCase()) {
          if (cat.categoryName && cat.categoryName !== 'Others') {
            subs.add(cat.categoryName);
          }
        }
      });
    }
    return Array.from(subs).sort();
  };


  const formatEventDateRange = (startDate, endDate) => {
    if (!startDate) return 'N/A';
    const startStr = new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    if (!endDate) return startStr;
    const endStr = new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    if (startStr === endStr) return startStr;
    return `${startStr} - ${endStr}`;
  };

  const getStatusWeight = (status) => {
    if (status === 'Pending Approval' || status === 'Pending Review' || status === 'Pending Verification' || status === 'Under Review') return 0;
    if (status === 'Needs Revision') return 1;
    if (status === 'Approved') return 2;
    if (status === 'Rejected') return 3;
    return 4;
  };

  const getEventSortWeight = (e) => {
    const isExpired = new Date(e.endDate || e.date) < new Date();
    if (isExpired) return 3; // Expired goes to bottom
    const statusLower = e.status?.toLowerCase();
    if (statusLower === 'pending review' || statusLower === 'pending approval' || statusLower === 'pending') return 0; // Top pending
    if (statusLower === 'approved') return 1; // Middle approved
    return 2; // Bottom rejected/other non-expired
  };
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  
  // Toast notification state
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Tab navigation state
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [auditSubTab, setAuditSubTab] = useState('Businesses'); // Businesses | Blogs | Testimonials
  const [pendingSubTab, setPendingSubTab] = useState('Businesses'); // Businesses | Blogs | Events
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Datasets states
  const [businesses, setBusinesses] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedSignups, setSelectedSignups] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [blogs, setBlogs] = useState([]);
  const [events, setEvents] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [subscriptionTab, setSubscriptionTab] = useState('override');
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);
  const [reportsData, setReportsData] = useState({});
  const [pendingCategories, setPendingCategories] = useState([]);
  const [presetCategories, setPresetCategories] = useState([]);
  const [resolutionActionMap, setResolutionActionMap] = useState({});
  const [resolutionTargetCatMap, setResolutionTargetCatMap] = useState({});
  const [resolutionCustomSubcatMap, setResolutionCustomSubcatMap] = useState({});
  const [resolutionParentCatMap, setResolutionParentCatMap] = useState({});

  // Preset Category creation state variables
  const [presetTypeMode, setPresetTypeMode] = useState('main'); // 'main' or 'sub'
  const [presetNewMainName, setPresetNewMainName] = useState('');
  const [presetNewSubName, setPresetNewSubName] = useState('');
  const [presetSelectedMain, setPresetSelectedMain] = useState('');

  // Slide-over Modal State
  const [selectedBiz, setSelectedBiz] = useState(null);
  const [showBizModal, setShowBizModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [isFoundingMemberCheck, setIsFoundingMemberCheck] = useState(false);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }
    
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setNotificationsOpen(false);
      }
    }

    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [notificationsOpen]);

  useEffect(() => {
    if (selectedBiz) {
      setIsFoundingMemberCheck(selectedBiz.isFoundingMember || false);
    } else {
      setIsFoundingMemberCheck(false);
    }
  }, [selectedBiz]);
  
  // Blog Moderation Modal State
  const [selectedBlogModal, setSelectedBlogModal] = useState(null);
  const [suggestionText, setSuggestionText] = useState('');

  // Selected business branches for moderation
  const [selectedBizBranches, setSelectedBizBranches] = useState([]);
  const [selectedBizBranchesLoading, setSelectedBizBranchesLoading] = useState(false);
  
  // Custom states for forms
  const [newNotice, setNewNotice] = useState({ title: '', message: '', type: 'announcement' });
  const [noticeSuccess, setNoticeSuccess] = useState(false);

  // Queries related state variables
  const [queries, setQueries] = useState([]);
  const [queriesLoading, setQueriesLoading] = useState(false);
  const [queriesError, setQueriesError] = useState('');
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [queryFilter, setQueryFilter] = useState('All'); // All | Pending | Replied
  const [querySearch, setQuerySearch] = useState('');

  // UBT App Testimonials states and handlers
  const [appTestimonials, setAppTestimonials] = useState([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(false);

  // Referral System states
  const [referrals, setReferrals] = useState([]);
  const [referralsLoading, setReferralsLoading] = useState(false);
  const [referralsError, setReferralsError] = useState('');
  const [referralFilter, setReferralFilter] = useState('All'); // All | Pending | Completed | Rejected
  const [referralSearch, setReferralSearch] = useState('');

  // Redemption/Refund states
  const [redemptions, setRedemptions] = useState([]);
  const [redemptionsLoading, setRedemptionsLoading] = useState(false);
  const [redemptionsError, setRedemptionsError] = useState('');
  const [referralSubTab, setReferralSubTab] = useState('partners_list'); // queue | partners_list | approvals_list | rejected_list
  const [redemptionStatusFilter, setRedemptionStatusFilter] = useState('All'); // All | Pending | Processed

  // Partners Portal states
  const [partners, setPartners] = useState([]);
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [partnerStatusFilter, setPartnerStatusFilter] = useState('All'); // All | Approved | Rejected

  // Directory Add Modal States
  const [showAddDirectoryModal, setShowAddDirectoryModal] = useState(false);
  const [dirGmbLink, setDirGmbLink] = useState('');
  const [isCustomMain, setIsCustomMain] = useState(false);
  const [dirAutofillLoading, setDirAutofillLoading] = useState(false);
  const [dirAutofillSuccess, setDirAutofillSuccess] = useState(false);
  const [dirSubmitLoading, setDirSubmitLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);

  const initialDirForm = {
    name: '',
    requestedParentCategory: '',
    category: '',
    customCategoryName: '',
    categoryStatus: 'Normal',
    address: '',
    locality: '',
    pincode: '',
    phone: '',
    website: '',
    googleMapsLocation: '',
    googlePlaceId: '',
    description: '',
    latitude: 10.5891,
    longitude: 77.2412,
    googleRating: 0,
    googleReviewsCount: 0,
    googleReviews: [],
    logoUrl: '',
    coverImageUrl: '',
    galleryUrls: []
  };
  const [dirForm, setDirForm] = useState(initialDirForm);

  const resetDirectoryForm = () => {
    setDirForm(initialDirForm);
    setDirGmbLink('');
    setDirAutofillLoading(false);
    setDirAutofillSuccess(false);
    setLogoUploading(false);
    setCoverUploading(false);
    setGalleryUploading(false);
    setIsCustomMain(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size must be less than 5MB.');
      return;
    }

    setLogoUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('ubt_token')}`
        },
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        setDirForm(prev => ({ ...prev, logoUrl: data.url }));
      } else {
        alert(data.message || 'Failed to upload logo.');
      }
    } catch (err) {
      console.error('Logo upload error:', err);
      alert('Network error uploading logo.');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size must be less than 5MB.');
      return;
    }

    setCoverUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('ubt_token')}`
        },
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        setDirForm(prev => ({ ...prev, coverImageUrl: data.url }));
      } else {
        alert(data.message || 'Failed to upload cover image.');
      }
    } catch (err) {
      console.error('Cover upload error:', err);
      alert('Network error uploading cover image.');
    } finally {
      setCoverUploading(false);
    }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setGalleryUploading(true);
    const uploadedUrls = [];

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Must be less than 5MB.`);
        continue;
      }

      const formData = new FormData();
      formData.append('image', file);

      try {
        const res = await fetch('http://localhost:5000/api/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('ubt_token')}`
          },
          body: formData
        });

        const data = await res.json();
        if (data.success) {
          uploadedUrls.push(data.url);
        } else {
          console.warn(`Failed to upload ${file.name}:`, data.message);
        }
      } catch (err) {
        console.error(`Error uploading ${file.name}:`, err);
      }
    }

    if (uploadedUrls.length > 0) {
      setDirForm(prev => ({
        ...prev,
        galleryUrls: [...(prev.galleryUrls || []), ...uploadedUrls]
      }));
    }
    setGalleryUploading(false);
  };

  const fetchAppTestimonials = async () => {
    setTestimonialsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/testimonials/admin', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('ubt_token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setAppTestimonials(data.data);
      } else {
        throw new Error(data.message || 'Error');
      }
    } catch (err) {
      console.warn('API error, using realistic mockup testimonials.');
      const mockTestimonials = [
        {
          _id: 't1',
          authorName: 'Ramesh Krishnan',
          role: 'Business Owner',
          text: 'Udumalpet Business Tour (UBT) has increased our departmental store leads and customer footfalls significantly. Highly recommended platform for all town vendors!',
          rating: 5,
          status: 'Pending',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: 't2',
          authorName: 'Sarah John',
          role: 'Blog Writer',
          text: 'Publishing local guiding articles on UBT is super clean and elegant. The interactive dashboard keeps our reader metrics clear.',
          rating: 5,
          status: 'Approved',
          createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString()
        }
      ];
      setAppTestimonials(mockTestimonials);
    } finally {
      setTestimonialsLoading(false);
    }
  };

  const handleTestimonialStatus = async (id, status) => {
    try {
      const res = await fetch(`http://localhost:5000/api/testimonials/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ubt_token')}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        setAppTestimonials(prev => prev.map(t => t._id === id ? { ...t, status } : t));
        alert(`Testimonial thoughts successfully ${status.toLowerCase()}!`);
      } else {
        alert(data.message || 'Failed to update testimonial status.');
      }
    } catch (err) {
      setAppTestimonials(prev => prev.map(t => t._id === id ? { ...t, status } : t));
      alert(`Testimonial thoughts successfully ${status.toLowerCase()} (simulated offline mode)!`);
    }
  };

  const handleTestimonialDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this testimonial Thoughts?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/testimonials/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('ubt_token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setAppTestimonials(prev => prev.filter(t => t._id !== id));
        alert('Testimonial thoughts deleted successfully!');
      } else {
        alert(data.message || 'Failed to delete testimonial.');
      }
    } catch (err) {
      setAppTestimonials(prev => prev.filter(t => t._id !== id));
      alert('Testimonial thoughts deleted successfully (simulated offline mode)!');
    }
  };

  const fetchQueries = async () => {
    setQueriesLoading(true);
    setQueriesError('');
    try {
      const res = await fetch('http://localhost:5000/api/queries', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('ubt_token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setQueries(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch queries.');
      }
    } catch (err) {
      console.warn('API error, using realistic mockup fallback queries.');
      const mockQs = [
        {
          _id: 'q1',
          name: 'Ramesh Krishnan',
          email: 'ramesh@gmail.com',
          subject: 'Verified Badge enquiry',
          message: 'Hello, how can I apply for a verified badge for my shop (Sri Murugan Stores)? What documents are needed?',
          status: 'Pending',
          createdAt: new Date(new Date().getTime() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: 'q2',
          name: 'Sarah John',
          email: 'sarah@ubt.com',
          subject: 'Banner advertising pricing',
          message: 'I want to advertise my resort on your home banner slide. Can you share the pricing sheet and impressions data?',
          status: 'Replied',
          replyMessage: 'Hello Sarah, we have sent the media kit to your email. Our representative will follow up tomorrow.',
          repliedAt: new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(new Date().getTime() - 36 * 60 * 60 * 1000).toISOString()
        }
      ];
      setQueries(mockQs);
    } finally {
      setQueriesLoading(false);
    }
  };

  const handleQueryReply = async (queryId) => {
    if (!replyText.trim()) return;
    setReplySubmitting(true);
    try {
      const res = await fetch(`http://localhost:5000/api/queries/${queryId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ubt_token')}`
        },
        body: JSON.stringify({ replyMessage: replyText })
      });
      const data = await res.json();
      if (data.success) {
        setQueries(prev => prev.map(q => q._id === queryId ? { ...q, status: 'Replied', replyMessage: replyText, repliedAt: new Date().toISOString() } : q));
        alert('Reply sent successfully!');
        setShowReplyModal(false);
        setReplyText('');
      } else {
        alert(data.message || 'Failed to send reply.');
      }
    } catch (err) {
      console.warn('API error, simulating offline reply submission.');
      setQueries(prev => prev.map(q => q._id === queryId ? { ...q, status: 'Replied', replyMessage: replyText, repliedAt: new Date().toISOString() } : q));
      alert('Reply sent successfully (simulated offline mode)!');
      setShowReplyModal(false);
      setReplyText('');
    } finally {
      setReplySubmitting(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const activeToken = localStorage.getItem('ubt_token');
      if (!activeToken) return;
      const res = await fetch('http://localhost:5000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${activeToken}`
        }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setNotifications(data.data.filter(n => !n.isRead));
      }
    } catch (err) {
      console.error('Error fetching admin notifications:', err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      const activeToken = localStorage.getItem('ubt_token');
      if (!activeToken) return;
      const res = await fetch('http://localhost:5000/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${activeToken}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications([]);
        setNotificationsOpen(false);
      }
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const fetchReferrals = async () => {
    setReferralsLoading(true);
    setReferralsError('');
    try {
      const activeToken = localStorage.getItem('ubt_token');
      const res = await fetch('http://localhost:5000/api/referrals/admin/all', {
        headers: {
          'Authorization': `Bearer ${activeToken}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setReferrals(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch referrals.');
      }
    } catch (err) {
      console.warn('API error, using realistic mockup referrals.', err);
      const mockRefs = [
        {
          _id: 'ref1',
          referrerId: { fullName: 'Aravind Swamy', email: 'aravind@gmail.com', mobileNumber: '9443211111' },
          referredUserId: { fullName: 'Balaji Sweet Stall Owner', email: 'balaji@gmail.com', mobileNumber: '9876543210' },
          referredBusinessId: { name: 'Balaji Sweet Stall', gstNumber: '33AAAAA1111A1Z1', phone: '9876543210', status: 'Pending Verification', subscriptionStatus: 'active' },
          status: 'pending',
          points: 100,
          antiFraudChecks: { selfReferral: false, duplicateMobile: true, duplicateGST: false, duplicateBusiness: false },
          createdAt: new Date().toISOString()
        },
        {
          _id: 'ref2',
          referrerId: { fullName: 'Lakshmi Textiles', email: 'lakshmi@gmail.com', mobileNumber: '9443599999' },
          referredUserId: { fullName: 'Sri Murugan Stores Owner', email: 'murugan@gmail.com', mobileNumber: '9123456780' },
          referredBusinessId: { name: 'Sri Murugan Stores', gstNumber: '33BBBBB2222B2Z2', phone: '9123456780', status: 'Approved', subscriptionStatus: 'active' },
          status: 'completed',
          points: 100,
          antiFraudChecks: { selfReferral: false, duplicateMobile: false, duplicateGST: false, duplicateBusiness: false },
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      setReferrals(mockRefs);
    } finally {
      setReferralsLoading(false);
    }
  };

  const handleReferralModerate = async (referralId, action, rejectionReason = '') => {
    try {
      const activeToken = localStorage.getItem('ubt_token');
      const res = await fetch('http://localhost:5000/api/referrals/admin/moderate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({ referralId, action, rejectionReason })
      });
      const data = await res.json();
      if (data.success) {
        setReferrals(prev => prev.map(r => r._id === referralId ? { ...r, status: action === 'approve' ? 'completed' : 'rejected', rejectionReason } : r));
        alert(`Referral successfully ${action}d!`);
      } else {
        alert(data.message || `Failed to ${action} referral.`);
      }
    } catch (err) {
      // Simulate offline update
      setReferrals(prev => prev.map(r => r._id === referralId ? { ...r, status: action === 'approve' ? 'completed' : 'rejected', rejectionReason } : r));
      alert(`Referral successfully ${action}d (simulated offline mode)!`);
    }
  };

  const fetchRedemptions = async () => {
    setRedemptionsLoading(true);
    setRedemptionsError('');
    try {
      const activeToken = localStorage.getItem('ubt_token');
      const res = await fetch('http://localhost:5000/api/referrals/admin/redemptions', {
        headers: {
          'Authorization': `Bearer ${activeToken}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setRedemptions(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch redemptions.');
      }
    } catch (err) {
      console.warn('API error, using realistic mockup redemptions.', err);
      // Fallback mock redemptions for offline testing
      const mockRedemptions = [
        {
          _id: 'redem1',
          userId: { fullName: 'Aravind Swamy', email: 'aravind@gmail.com', mobileNumber: '9443211111' },
          points: 1000,
          status: 'Pending Approval',
          remarks: '',
          createdAt: new Date().toISOString()
        },
        {
          _id: 'redem2',
          userId: { fullName: 'Lakshmi Textiles Owner', email: 'lakshmi@gmail.com', mobileNumber: '9443599999' },
          points: 1000,
          status: 'Refunded',
          remarks: 'Bank transfer completed ref#12345',
          createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
        }
      ];
      setRedemptions(mockRedemptions);
    } finally {
      setRedemptionsLoading(false);
    }
  };

  const handleViewPartner = (partner) => {
    setSelectedPartner(partner);
    setShowPartnerModal(true);
  };

  const handleRedemptionRefund = async (redemptionId, remarks = '') => {
    try {
      const activeToken = localStorage.getItem('ubt_token');
      const res = await fetch(`http://localhost:5000/api/referrals/admin/redemptions/${redemptionId}/refund`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({ remarks })
      });
      const data = await res.json();
      if (data.success) {
        setRedemptions(prev => prev.map(r => r._id === redemptionId ? { ...r, status: 'Refunded', remarks } : r));
        alert('Redemption status successfully updated to Refunded!');
      } else {
        alert(data.message || 'Failed to update status.');
      }
    } catch (err) {
      setRedemptions(prev => prev.map(r => r._id === redemptionId ? { ...r, status: 'Refunded', remarks } : r));
      alert('Redemption successfully marked as refunded (simulated offline mode)!');
    }
  };

  const handleRedemptionReject = async (redemptionId, remarks = '') => {
    try {
      const activeToken = localStorage.getItem('ubt_token');
      const res = await fetch(`http://localhost:5000/api/referrals/admin/redemptions/${redemptionId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({ remarks })
      });
      const data = await res.json();
      if (data.success) {
        setRedemptions(prev => prev.map(r => r._id === redemptionId ? { ...r, status: 'Rejected', remarks } : r));
        alert('Redemption status successfully updated to Rejected!');
      } else {
        alert(data.message || 'Failed to reject redemption.');
      }
    } catch (err) {
      setRedemptions(prev => prev.map(r => r._id === redemptionId ? { ...r, status: 'Rejected', remarks } : r));
      alert('Redemption successfully marked as rejected (simulated offline mode)!');
    }
  };

  const fetchPartners = async () => {
    setPartnersLoading(true);
    try {
      const activeToken = localStorage.getItem('ubt_token');
      const res = await fetch('http://localhost:5000/api/admin/partners', {
        headers: {
          'Authorization': `Bearer ${activeToken}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setPartners(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to fetch partners.');
      }
    } catch (err) {
      console.warn('API error, using mockup partners.', err);
      setPartners([
        {
          _id: 'partner1',
          fullName: 'Harish Mithra',
          email: 'harishmitharamalingam@gmail.com',
          phone: '+91 89257 28260',
          role: 'partner',
          aadhaarNumber: '123456789012',
          address: 'Gandhi Nagar, Udumalpet',
          isPartnerRegistered: true,
          referralPoints: 198,
          referralCode: 'HARISHM',
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setPartnersLoading(false);
    }
  };

  const handleDirLinkAutofill = async () => {
    if (!dirGmbLink.trim()) return;
    
    setDirAutofillLoading(true);
    setDirAutofillSuccess(false);
    try {
      const token = localStorage.getItem('ubt_token');
      const res = await fetch('http://localhost:5000/api/businesses/google-autofill-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ link: dirGmbLink })
      });
      const data = await res.json();
      if (data.success && data.data) {
        const d = data.data;
        let placePincode = d.pincode ? d.pincode.replace(/\s+/g, '').slice(0, 6) : '642126';
        
        setDirForm(prev => ({
          ...prev,
          name: d.name || prev.name,
          address: d.address || prev.address,
          phone: d.phone || prev.phone,
          website: d.website || prev.website,
          locality: d.locality || prev.locality,
          pincode: placePincode,
          googlePlaceId: d.googlePlaceId || '',
          googleRating: d.googleRating || 0,
          googleReviewsCount: d.googleReviewsCount || 0,
          googleReviews: d.googleReviews || [],
          latitude: d.latitude || prev.latitude,
          longitude: d.longitude || prev.longitude,
          logoUrl: d.logoUrl || prev.logoUrl || '',
          coverImageUrl: d.coverImageUrl || prev.coverImageUrl || '',
          galleryUrls: d.galleryUrls || prev.galleryUrls || [],
          googleMapsLocation: dirGmbLink
        }));
        setDirAutofillSuccess(true);
      } else {
        alert(data.message || 'Failed to auto-fill details from Google link.');
      }
    } catch (err) {
      console.error('Error GMB link autofill:', err);
      alert('Network error fetching details from Google Link.');
    } finally {
      setDirAutofillLoading(false);
    }
  };

  const handlePublishDirListing = async () => {
    if (!dirForm.name || !dirForm.requestedParentCategory || !dirForm.category || !dirForm.address || !dirForm.locality || !dirForm.phone) {
      alert('Please fill in all required fields');
      return;
    }
    if (dirForm.category === 'Others' && (!dirForm.customCategoryName || !dirForm.customCategoryName.trim())) {
      alert('Please specify your custom subcategory name');
      return;
    }
    if (!dirForm.requestedParentCategory.trim()) {
      alert('Please specify the main category name');
      return;
    }
    
    setDirSubmitLoading(true);
    try {
      const token = localStorage.getItem('ubt_token');
      const payload = {
        name: dirForm.name,
        requestedParentCategory: dirForm.requestedParentCategory,
        category: dirForm.category,
        customCategoryName: dirForm.category === 'Others' ? dirForm.customCategoryName : '',
        categoryStatus: dirForm.category === 'Others' || !getAdminDynamicMainCategories().includes(dirForm.requestedParentCategory) ? 'Pending Review' : 'Normal',
        address: dirForm.address,
        locality: dirForm.locality,
        phone: dirForm.phone,
        website: dirForm.website,
        googleMapsLocation: dirForm.googleMapsLocation,
        googlePlaceId: dirForm.googlePlaceId,
        pincode: dirForm.pincode,
        latitude: dirForm.latitude,
        longitude: dirForm.longitude,
        description: dirForm.description,
        googleRating: dirForm.googleRating,
        googleReviewsCount: dirForm.googleReviewsCount,
        googleReviews: dirForm.googleReviews,
        logoUrl: dirForm.logoUrl,
        coverImageUrl: dirForm.coverImageUrl,
        galleryUrls: dirForm.galleryUrls
      };
      
      const res = await fetch('http://localhost:5000/api/admin/businesses/directory-add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.data) {
        // Hydrate details back to list
        const newBiz = {
          ...data.data,
          ownerName: (user && (user.fullName || user.name)) || 'Merchant',
          ownerEmail: (user && user.email) || ''
        };
        setBusinesses(prev => [newBiz, ...prev]);
        
        // Update stats
        setReportsData(prev => ({
          ...prev,
          total: (prev.total || 0) + 1
        }));
        
        alert('Directory listing successfully added and published live!');
        setShowAddDirectoryModal(false);
        resetDirectoryForm();
      } else {
        alert(data.message || 'Failed to publish directory listing');
      }
    } catch (err) {
      console.error('Error publishing directory listing:', err);
      alert('Network error publishing directory listing');
    } finally {
      setDirSubmitLoading(false);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('ubt_token');
    const storedUser = localStorage.getItem('ubt_user');

    if (!storedToken || !storedUser) {
      navigate('/login');
      return;
    }

    try {
      const uObj = JSON.parse(storedUser);
      if (uObj.role !== 'admin' && uObj.role !== 'superadmin') {
        navigate('/login?error=unauthorized');
        return;
      }
      setToken(storedToken);
      setUser(uObj);
      loadPlatformRealData();
      fetchQueries();
      fetchAppTestimonials();
      fetchReferrals();
      fetchNotifications();
    } catch (err) {
      localStorage.removeItem('ubt_user');
      localStorage.removeItem('ubt_token');
      navigate('/login');
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (activeTab === 'Referral Moderation' || activeTab === 'Partners' || activeTab === 'Pending Approvals') {
      fetchReferrals();
      fetchRedemptions();
      fetchPartners();
    }
  }, [activeTab]);

  useEffect(() => {
    const fetchSelectedBizBranches = async () => {
      if (!selectedBiz) {
        setSelectedBizBranches([]);
        return;
      }
      setSelectedBizBranchesLoading(true);
      try {
        const token = localStorage.getItem('ubt_token');
        if (!token || selectedBiz._id === 'UBT-10024') {
          // Fallback mock branches for Sri Murugan Stores or if offline
          const mockBranches = [
            {
              _id: 'mock-branch-1',
              businessId: 'UBT-10024',
              name: 'Sri Murugan Stores - Eripalayam Branch',
              address: 'Eripalayam Main Road, Udumalpet Main Town, Tamil Nadu - 642126',
              phone: '+91 94430 12345',
              googleMapsLocation: 'https://maps.google.com/?q=10.5912,77.2515',
              workingHours: '9:00 AM - 9:00 PM',
              branchManagerName: 'Murugan Jr.',
              status: 'Approved',
            },
            {
              _id: 'mock-branch-2',
              businessId: 'UBT-10024',
              name: 'Sri Murugan Stores - Dharapuram Road Branch',
              address: 'Dharapuram Road, Udumalpet Main Town, Tamil Nadu - 642126',
              phone: '+91 94430 54321',
              googleMapsLocation: 'https://maps.google.com/?q=10.584,77.252',
              workingHours: '9:00 AM - 8:30 PM',
              branchManagerName: 'Suresh Babu',
              status: 'Pending Verification',
            }
          ];
          setSelectedBizBranches(mockBranches);
          return;
        }

        const res = await fetch(`http://localhost:5000/api/branches/business/${selectedBiz._id}?all=true`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setSelectedBizBranches(data.data);
        }
      } catch (err) {
        console.error('Error fetching branches for selected business:', err);
      } finally {
        setSelectedBizBranchesLoading(false);
      }
    };

    fetchSelectedBizBranches();
  }, [selectedBiz]);

  const handleBranchStatusChange = async (branchId, newStatus) => {
    try {
      const token = localStorage.getItem('ubt_token');
      if (selectedBiz._id === 'UBT-10024') {
        // Mock branch status update
        setSelectedBizBranches(prev => prev.map(b => b._id === branchId ? { ...b, status: newStatus } : b));
        return;
      }

      const res = await fetch(`http://localhost:5000/api/admin/branches/${branchId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedBizBranches(prev => prev.map(b => b._id === branchId ? { ...b, status: newStatus } : b));
        
        // Also update the main business branch count in UI if status changed to/from Approved
        setBusinesses(prev => prev.map(b => {
          if (b._id === selectedBiz._id) {
            const oldBranch = selectedBizBranches.find(br => br._id === branchId);
            let diff = 0;
            if (oldBranch && oldBranch.status !== 'Approved' && newStatus === 'Approved') {
              diff = 1;
            } else if (oldBranch && oldBranch.status === 'Approved' && newStatus !== 'Approved') {
              diff = -1;
            }
            return { ...b, branchCount: (b.branchCount || 0) + diff };
          }
          return b;
        }));
      } else {
        alert(data.message || 'Failed to update branch status');
      }
    } catch (err) {
      console.error('Error changing branch status:', err);
      alert('Network error updating branch status');
    }
  };

  const loadPlatformRealData = async () => {
    setLoading(true);
    try {
      const storedToken = localStorage.getItem('ubt_token');
      const headers = { 'Authorization': `Bearer ${storedToken}` };

      // 1. Fetch businesses
      const bizRes = await fetch('http://localhost:5000/api/admin/businesses', { headers });
      const bizData = await bizRes.json();
      let activeBiz = [];
      if (bizData.success) {
        activeBiz = bizData.data.map(b => ({
          ...b,
          ownerName: b.ownerId ? b.ownerId.fullName || b.ownerId.name || 'Merchant' : 'Merchant',
          ownerEmail: b.ownerId ? b.ownerId.email : '',
          referralPoints: b.ownerId ? b.ownerId.referralPoints || 0 : 0,
          googlePlaceId: b.googlePlaceId || '',
          googleRating: b.googleRating || 0,
          googleReviewsCount: b.googleReviewsCount || 0
        }));
        setBusinesses(activeBiz);
      }

      // Fetch signups
      try {
        const usersRes = await fetch('http://localhost:5000/api/users', { headers });
        const usersData = await usersRes.json();
        if (usersData.success) {
          setUsers(usersData.data);
        }
      } catch (userErr) {
        console.error('Error fetching users:', userErr);
      }

      // 2. Fetch blogs
      const blogsRes = await fetch('http://localhost:5000/api/blogs/admin/all', { headers });
      const blogsData = await blogsRes.json();
      if (blogsData.success) {
        setBlogs(blogsData.data);
      }

      // 3. Fetch events
      const evRes = await fetch('http://localhost:5000/api/events/admin/all', { headers });
      const evData = await evRes.json();
      if (evData.success) {
        setEvents(evData.data);
      }

      // Keep mock subscriptions and reviews for simple UI metrics
      const mockReviews = [
        {
          _id: 'rev_1',
          businessName: 'Vibrant Bakery & Cafe',
          authorName: 'Ramesh K.',
          rating: 1,
          text: 'SPAM REVIEW: Earn Rs 5000 daily from home visit spamlink.com!',
          status: 'flagged'
        },
        {
          _id: 'rev_2',
          businessName: 'R.K. Electricals',
          authorName: 'Karthik S.',
          rating: 5,
          text: 'Excellent service! They came on time and fixed the inverter issue quickly. Very professional.',
          status: 'approved'
        }
      ];

      const mockSubs = [
        {
          _id: 'sub_1',
          businessName: 'R.K. Electricals',
          planType: 'Monthly',
          amount: 499,
          paymentStatus: 'Paid',
          expiryDate: new Date(new Date().getTime() + 15 * 24 * 60 * 60 * 1000)
        }
      ];

      setReviews(mockReviews);
      
      // Fetch admin subscriptions
      try {
        const subRes = await fetch('http://localhost:5000/api/subscriptions/admin/all', { headers });
        const subData = await subRes.json();
        if (subData.success) {
          setSubscriptions(subData.data);
        } else {
          setSubscriptions([]);
        }
      } catch (subErr) {
        console.error('Error loading admin subscriptions:', subErr);
        setSubscriptions([]);
      }

      // Fetch admin payments
      try {
        const payRes = await fetch('http://localhost:5000/api/payments/admin/all', { headers });
        const payData = await payRes.json();
        if (payData.success) {
          setPayments(payData.data);
        } else {
          setPayments([]);
        }
      } catch (payErr) {
        console.error('Error loading admin payments:', payErr);
        setPayments([]);
      }

      // Auto-calculate stats
      setReportsData({
        total: activeBiz.length,
        pending: activeBiz.filter(b => b.status === 'Pending Verification' || b.status === 'Under Review').length,
        active: activeBiz.filter(b => b.subscriptionStatus === 'active' && b.status === 'Approved').length,
        expired: activeBiz.filter(b => b.subscriptionStatus === 'expired').length
      });

      // Fetch dynamic seeded preset categories
      const categoriesRes = await fetch('http://localhost:5000/api/categories', { headers });
      const categoriesData = await categoriesRes.json();
      if (categoriesData.success) {
        setPresetCategories(categoriesData.data);
      }

      // Fetch pending custom category requests
      const pendingCatRes = await fetch('http://localhost:5000/api/admin/category-review/pending', { headers });
      const pendingCatData = await pendingCatRes.json();
      if (pendingCatData.success) {
        setPendingCategories(pendingCatData.data);
      }

    } catch (err) {
      console.error('Error hydrating admin platform datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  const resolveCategoryRequest = async (businessId, action, categoryId = null, newCategoryName = null, icon = null, parentCategory = null) => {
    try {
      const storedToken = localStorage.getItem('ubt_token');
      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${storedToken}` 
      };
      const res = await fetch('http://localhost:5000/api/admin/category-review/resolve', {
        method: 'POST',
        headers,
        body: JSON.stringify({ businessId, action, categoryId, newCategoryName, icon, parentCategory })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || "Category request resolved successfully!");
        loadPlatformRealData();
      } else {
        alert(data.message || "Failed to resolve category request.");
      }
    } catch (err) {
      console.error(err);
      alert("Error resolving category request.");
    }
  };

  const updatePresetCategory = async (catId, payload) => {
    try {
      const res = await fetch(`http://localhost:5000/api/categories/${catId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ubt_token')}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert("Category renamed successfully!");
        loadPlatformRealData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deletePresetCategory = async (catId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/categories/${catId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('ubt_token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        alert("Category removed successfully!");
        loadPlatformRealData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAction = async (bizId, type) => {
    let nextStatus = 'Pending Verification';
    if (type === 'approve') nextStatus = 'Approved';
    if (type === 'reject') nextStatus = 'Rejected';
    if (type === 'suspend') nextStatus = 'Suspended';
    if (type === 'hide') nextStatus = 'Hidden';
    if (type === 'unhide') nextStatus = 'Approved';
    
    // Update local state immediately to avoid stale rendering/flickering
    setBusinesses(prev => prev.map(b => b._id === bizId ? { ...b, status: nextStatus, isFoundingMember: type === 'approve' ? isFoundingMemberCheck : b.isFoundingMember } : b));
    if (selectedBiz && selectedBiz._id === bizId) {
      setSelectedBiz(prev => ({ ...prev, status: nextStatus, isFoundingMember: type === 'approve' ? isFoundingMemberCheck : prev.isFoundingMember }));
    }
    
    try {
      const res = await fetch(`http://localhost:5000/api/admin/businesses/${bizId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: nextStatus,
          isFoundingMember: type === 'approve' ? isFoundingMemberCheck : undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Business successfully marked as ${nextStatus}!`);
        loadPlatformRealData();
      } else {
        alert(data.message || 'Failed to update business status.');
      }
    } catch (err) {
      // Fallback mock update locally
      setBusinesses(prev => prev.map(b => b._id === bizId ? { ...b, status: nextStatus, isFoundingMember: type === 'approve' ? isFoundingMemberCheck : b.isFoundingMember } : b));
      if (selectedBiz && selectedBiz._id === bizId) {
        setSelectedBiz(prev => ({ ...prev, status: nextStatus, isFoundingMember: type === 'approve' ? isFoundingMemberCheck : prev.isFoundingMember }));
      }
    }
  };

  const handlePartnerAction = async (partnerId, action) => {
    let rejectionReason = '';
    if (action === 'reject') {
      rejectionReason = window.prompt("Please enter the reason/details for rejection:");
      if (rejectionReason === null) return; // Cancelled
    }
    try {
      const res = await fetch('http://localhost:5000/api/admin/partners/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || localStorage.getItem('ubt_token')}`
        },
        body: JSON.stringify({ partnerId, action, rejectionReason })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Partner registration successfully ${action}d!`);
        fetchPartners(); // Refresh partners list
      } else {
        alert(data.message || `Failed to ${action} partner.`);
      }
    } catch (err) {
      console.error(err);
      setPartners(prev => prev.map(p => {
        if (p._id === partnerId) {
          if (action === 'approve') {
            return { ...p, isPartnerApproved: true, partnerStatus: 'approved' };
          } else {
            return { ...p, isPartnerApproved: false, partnerStatus: 'rejected', isPartnerRegistered: false };
          }
        }
        return p;
      }));
    }
  };

  const handleDeletePartner = async (partnerId) => {
    if (!window.confirm('Are you sure you want to permanently delete this partner and their entire registration? This will also cascade delete all their referrals, redemptions, and notifications.')) {
      return;
    }
    try {
      const activeToken = localStorage.getItem('ubt_token');
      const res = await fetch(`http://localhost:5000/api/users/${partnerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${activeToken}`
        }
      });
      const data = await res.json();
      if (data.success || res.ok) {
        alert('Partner registration and all associated records deleted successfully.');
        fetchPartners(); // Refresh partners list
      } else {
        alert(data.message || 'Failed to delete partner.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while deleting partner registration.');
    }
  };

  const handleDeleteBusiness = async (bizId) => {
    if (window.confirm("Are you sure you want to permanently delete this listing? All reviews, blogs, and events matching will be cascade deleted!")) {
      try {
        const res = await fetch(`http://localhost:5000/api/admin/businesses/${bizId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          alert('Listing and its cascaded assets deleted successfully!');
          loadPlatformRealData();
        } else {
          alert(data.message || 'Failed to delete listing.');
        }
      } catch (err) {
        console.error(err);
        // Fallback local mock delete
        setBusinesses(prev => prev.filter(b => b._id !== bizId));
        alert('Listing deleted successfully (simulated offline mode)!');
      }
    }
  };

  const handleManualSubscription = async (bizId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/businesses/${bizId}/activate-subscription`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('ubt_token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        alert('Plan manually activated successfully for 30 days!');
        loadPlatformRealData();
      } else {
        alert(data.message || 'Failed to activate subscription.');
      }
    } catch (err) {
      setBusinesses(prev => prev.map(b => {
        if (b._id === bizId) {
          return { 
            ...b, 
            subscriptionStatus: 'active', 
            subscriptionExpiry: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000) 
          };
        }
        return b;
      }));
      alert('Plan manually activated successfully for 30 days (offline simulation)!');
    }
  };

  const handleSuspendSubscription = async (bizId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/businesses/${bizId}/suspend-subscription`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('ubt_token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Action executed successfully!');
        loadPlatformRealData();
      } else {
        alert(data.message || 'Failed to update subscription status.');
      }
    } catch (err) {
      setBusinesses(prev => prev.map(b => {
        if (b._id === bizId) {
          const isSuspended = b.subscriptionStatus === 'suspended';
          return { 
            ...b, 
            subscriptionStatus: isSuspended ? 'none' : 'suspended',
            isPremium: false
          };
        }
        return b;
      }));
      alert('Subscription status updated successfully (offline simulation)!');
    }
  };

  const handleSendReminder = async (bizId) => {
    const businessObj = businesses.find(b => b._id === bizId);
    const businessName = businessObj ? businessObj.name : '';
    const defaultMsg = `Friendly reminder: Please renew your subscription for "${businessName}" to maintain premium visibility and access.`;
    const customMessage = window.prompt("Enter customized reminder text (leave empty to send default message):", defaultMsg);
    
    if (customMessage === null) return;

    try {
      const res = await fetch(`http://localhost:5000/api/admin/businesses/${bizId}/send-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || localStorage.getItem('ubt_token')}`
        },
        body: JSON.stringify({ message: customMessage })
      });
      const data = await res.json();
      if (data.success) {
        alert('Subscription reminder sent successfully!');
      } else {
        alert(data.message || 'Failed to send subscription reminder.');
      }
    } catch (err) {
      alert('Subscription reminder successfully sent (offline simulation)!');
    }
  };

  const handleBroadcast = async () => {
    if (!newNotice.title || !newNotice.message) return;
    try {
      const res = await fetch('http://localhost:5000/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || localStorage.getItem('ubt_token')}`
        },
        body: JSON.stringify({
          title: newNotice.title,
          message: newNotice.message,
          type: newNotice.type
        })
      });
      const data = await res.json();
      if (data.success) {
        setNoticeSuccess(true);
        setNewNotice({ title: '', message: '', type: 'announcement' });
        setTimeout(() => setNoticeSuccess(false), 4000);
      } else {
        alert(data.message || 'Failed to broadcast system notification.');
      }
    } catch (err) {
      alert('Failed to broadcast system notification (network error).');
    }
  };

  const handleBlogAction = async (blogId, status, suggestions = '') => {
    // Update local state immediately to avoid stale rendering/flickering
    setBlogs(prev => prev.map(b => b._id === blogId ? { ...b, status, revisionSuggestions: suggestions } : b));
    if (selectedBlogModal && selectedBlogModal._id === blogId) {
      setSelectedBlogModal(prev => ({ ...prev, status, revisionSuggestions: suggestions }));
    }

    try {
      const res = await fetch(`http://localhost:5000/api/admin/blogs/moderate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || localStorage.getItem('ubt_token')}`
        },
        body: JSON.stringify({ blogId, status, suggestions })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Blog status successfully set to ${status}!`);
        loadPlatformRealData();
      } else {
        alert(data.message || 'Failed to update blog status.');
      }
    } catch (err) {
      // Fallback mock update locally
      setBlogs(prev => prev.map(b => b._id === blogId ? { ...b, status, revisionSuggestions: suggestions } : b));
    }
  };

  const handleBlogDelete = async (blogId) => {
    if (!window.confirm('Are you sure you want to permanently delete this blog post? This action cannot be undone.')) {
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/blogs/${blogId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('ubt_token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        alert('Blog post successfully deleted!');
        loadPlatformRealData();
      } else {
        alert(data.message || 'Failed to delete blog.');
      }
    } catch (err) {
      alert('Error deleting blog post.');
    }
  };

  const handleEventAction = async (eventId, status) => {
    // Update local state immediately to avoid stale rendering/flickering
    setEvents(prev => prev.map(e => e._id === eventId ? { ...e, status } : e));

    try {
      const res = await fetch(`http://localhost:5000/api/admin/events/moderate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ eventId, status })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Event status successfully set to ${status}!`);
        loadPlatformRealData();
      } else {
        alert(data.message || 'Failed to update event status.');
      }
    } catch (err) {
      // Fallback mock update locally
      setEvents(prev => prev.map(e => e._id === eventId ? { ...e, status } : e));
    }
  };

  const handleEventDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        alert('Event successfully deleted!');
        loadPlatformRealData();
      } else {
        alert(data.message || 'Failed to delete event.');
      }
    } catch (err) {
      // Fallback local mock delete
      setEvents(prev => prev.filter(e => e._id !== eventId));
    }
  };

  const handleReviewAction = (revId, action) => {
    if (action === 'delete') {
      setReviews(prev => prev.filter(r => r._id !== revId));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ubt_token');
    localStorage.removeItem('ubt_user');
    navigate('/login');
  };

  const handleDeleteSignup = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user signup? This will permanently delete the user registration and cascade-delete all their businesses, blogs, events, reviews, and subscriptions.')) {
      return;
    }
    try {
      const storedToken = localStorage.getItem('ubt_token');
      const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${storedToken}` }
      });
      const data = await res.json();
      if (data.success) {
        alert('User registration deleted successfully.');
        setUsers(prev => prev.filter(u => u._id !== userId));
        loadPlatformRealData(); // refresh everything to update cascades
      } else {
        alert(data.message || 'Failed to delete signup.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while deleting user registration.');
    }
  };

  const handleDeleteSelectedSignups = async () => {
    if (selectedSignups.length === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete the ${selectedSignups.length} selected user registrations? This will cascade-delete ALL their businesses, blogs, events, reviews, and subscriptions. This action is irreversible!`)) {
      return;
    }
    try {
      let deletedCount = 0;
      let failedCount = 0;
      const storedToken = localStorage.getItem('ubt_token');
      
      await Promise.all(selectedSignups.map(async (userId) => {
        try {
          const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${storedToken}` }
          });
          if (res.ok) {
            deletedCount++;
          } else {
            failedCount++;
          }
        } catch (err) {
          console.error(err);
          failedCount++;
        }
      }));
      
      alert(`Bulk delete complete. Successfully deleted: ${deletedCount} users. Failed: ${failedCount}.`);
      setSelectedSignups([]);
      loadPlatformRealData();
    } catch (err) {
      console.error(err);
      alert('An error occurred during bulk deletion.');
    }
  };

  // Filtered lists
  const filteredBusinesses = businesses.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (b.ownerName && b.ownerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (b.ownerEmail && b.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (b.locality && b.locality.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const filteredBlogs = blogs.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (b.authorName && b.authorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (b.category && b.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
    b.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (e.organizer && e.organizer.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (e.category && e.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (e.venue && e.venue.toLowerCase().includes(searchQuery.toLowerCase())) ||
    e.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    (u.fullName && u.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.mobileNumber && u.mobileNumber.includes(searchQuery)) ||
    (u.phone && u.phone.includes(searchQuery)) ||
    (u.role && u.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.status && u.status.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-800 text-left">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-2xl shadow-xl text-sm font-extrabold flex items-center gap-2.5 animate-fadeIn ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-4.5 w-4.5 shrink-0" /> : <AlertCircle className="h-4.5 w-4.5 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. SIDEBAR CONTAINER */}
      <aside className={`bg-[#001c41] text-white flex flex-col justify-between transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'} shrink-0 relative overflow-hidden z-20 h-screen sticky top-0 hidden md:flex`}>
        <div className="flex flex-col gap-8 py-6 flex-1 overflow-y-auto">
          {/* Logo Brand */}
          <div className="px-6 flex items-center justify-start py-2">
            <Link to="/" className="flex items-center select-none shrink-0">
              <img 
                src="/logo-dark.png" 
                alt="Udumalpet Business Tour" 
                className={`${sidebarCollapsed ? 'h-6' : 'h-10'} w-auto object-contain transition-all duration-300`} 
              />
            </Link>
          </div>

          {/* Nav Items */}
          <nav className="flex flex-col gap-1 px-3">
            {[
              { id: 'Dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
              { id: 'Businesses', label: 'Businesses', icon: <Store className="h-5 w-5" /> },
              { id: 'Signups', label: 'Signups', icon: <User className="h-5 w-5" /> },
              { id: 'Category Management', label: 'Categories', icon: <Grid className="h-5 w-5" /> },
              { id: 'Pending Approvals', label: 'Pending Approvals', icon: <ShieldAlert className="h-5 w-5" /> },
              { id: 'Partners', label: 'Partners Portal', icon: <Users className="h-5 w-5" /> },
              { id: 'Blogs', label: 'Blogs Moderation', icon: <BookOpen className="h-5 w-5" /> },
              { id: 'Events', label: 'Events Moderation', icon: <Calendar className="h-5 w-5" /> },
              { id: 'Reviews', label: 'Reviews Feed', icon: <MessageSquare className="h-5 w-5" /> },
              { id: 'Testimonials', label: 'Testimonials Moderation', icon: <Smile className="h-5 w-5" /> },
              { id: 'Subscriptions', label: 'Subscriptions', icon: <CardIcon className="h-5 w-5" /> },
              { id: 'Notifications', label: 'Notifications Hub', icon: <Bell className="h-5 w-5" /> },
              { id: 'Queries', label: 'Queries Inbox', icon: <Mail className="h-5 w-5" /> },
              { id: 'Referral Moderation', label: 'Referrals & Refunds', icon: <Gift className="h-5 w-5" /> },
              { id: 'Blood Donors', label: 'Blood Donors', icon: <Heart className="h-5 w-5" /> }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === item.id 
                    ? 'bg-[#027244] text-white shadow-md shadow-emerald-950/15' 
                    : 'text-slate-400 hover:bg-slate-900/40 hover:text-white'
                }`}
              >
                {item.icon}
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-900 flex flex-col gap-1">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full py-2.5 px-4 text-xs font-bold text-slate-400 hover:text-white rounded-xl hover:bg-slate-900/40 text-center shrink-0 hidden md:block cursor-pointer"
          >
            {sidebarCollapsed ? '→' : '← Collapse Sidebar'}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3.5 px-4 py-3 w-full rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/15 hover:text-rose-350 cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile top header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#001c41] text-white flex items-center justify-between px-4 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <img src="/logo-dark.png" alt="UBT" className="h-8 w-auto object-contain" />
          <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 rounded px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider select-none">
            AD
          </div>
          <span className="text-xs font-bold text-slate-200 border-l border-slate-700 pl-2 max-w-[180px] sm:max-w-[240px] truncate">{activeTab}</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="h-10 w-10 flex items-center justify-center text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Sidebar Overlay / Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bottom-0 z-40 bg-slate-950/80 backdrop-blur-xs flex animate-fadeIn">
          <div className="w-64 h-full bg-[#001c41] border-r border-slate-800 flex flex-col justify-between py-6 px-4 animate-slideRight">
            <div className="flex flex-col gap-5 overflow-y-auto max-h-[85vh]">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-4">Admin Dashboard</span>
              <nav className="flex flex-col gap-1">
                {[
                  { id: 'Dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
                  { id: 'Businesses', label: 'Businesses', icon: <Store className="h-5 w-5" /> },
                  { id: 'Signups', label: 'Signups', icon: <User className="h-5 w-5" /> },
                  { id: 'Category Management', label: 'Categories', icon: <Grid className="h-5 w-5" /> },
                  { id: 'Pending Approvals', label: 'Pending Approvals', icon: <ShieldAlert className="h-5 w-5" /> },
                  { id: 'Partners', label: 'Partners Portal', icon: <Users className="h-5 w-5" /> },
                  { id: 'Blogs', label: 'Blogs Moderation', icon: <BookOpen className="h-5 w-5" /> },
                  { id: 'Events', label: 'Events Moderation', icon: <Calendar className="h-5 w-5" /> },
                  { id: 'Reviews', label: 'Reviews Feed', icon: <MessageSquare className="h-5 w-5" /> },
                  { id: 'Testimonials', label: 'Testimonials Moderation', icon: <Smile className="h-5 w-5" /> },
                  { id: 'Subscriptions', label: 'Subscriptions', icon: <CardIcon className="h-5 w-5" /> },
                  { id: 'Notifications', label: 'Notifications Hub', icon: <Bell className="h-5 w-5" /> },
                  { id: 'Queries', label: 'Queries Inbox', icon: <Mail className="h-5 w-5" /> },
                  { id: 'Referral Moderation', label: 'Referrals & Refunds', icon: <Gift className="h-5 w-5" /> },
                  { id: 'Blood Donors', label: 'Blood Donors', icon: <Heart className="h-5 w-5" /> }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setActiveTab(item.id);
                    }}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-left w-full ${
                      activeTab === item.id 
                        ? 'bg-[#027244] text-white shadow-md shadow-emerald-950/15' 
                        : 'text-slate-400 hover:bg-slate-900/40 hover:text-white'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
            <div className="p-3 border-t border-slate-900 flex flex-col gap-1">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-3.5 px-4 py-3 w-full rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/15 hover:text-rose-350 cursor-pointer text-left"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* 2. MAIN APP SPACE */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen pt-16 md:pt-0">
        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 pt-4 pb-2 bg-[#F8FAFC] border-b border-slate-200">
          <div className="relative flex items-center">
            <Search className="h-4 w-4 text-slate-400 absolute left-3" />
            <input
              type="text"
              placeholder={`Search in ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-slate-200 px-4 py-2 pl-9.5 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#027244] focus:ring-1 focus:ring-emerald-100 placeholder-slate-400 shadow-2xs"
            />
          </div>
        </div>
        
        {/* Topbar navigation panel */}
        <header className="h-[76px] bg-white border-b border-slate-200/80 px-6 md:px-8 hidden md:flex items-center justify-between z-10 sticky top-0 shrink-0">
          {/* Left: tab name / Search */}
          <div className="flex items-center gap-6 flex-1 max-w-md">
            <h2 className="font-extrabold text-slate-800 text-lg hidden sm:block">{activeTab}</h2>
            <div className="relative flex items-center flex-1">
              <Search className="h-4.5 w-4.5 text-slate-400 absolute left-3" />
              <input
                type="text"
                placeholder="Search businesses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full max-w-xs border border-slate-200 px-4 py-2 pl-10 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50/50 focus:outline-none focus:border-[#027244] focus:ring-1 focus:ring-emerald-100 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Right: profile dropdown notification bar */}
          <div className="flex items-center gap-4">
            <div className="relative" ref={notificationsRef}>
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="h-10 w-10 border border-slate-200 hover:border-slate-400 hover:bg-slate-50 rounded-full flex items-center justify-center text-slate-500 relative cursor-pointer"
              >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white select-none animate-pulse" />
                )}
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl py-3 px-4 flex flex-col gap-2.5 animate-fadeIn z-50 text-[#001c41]">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="font-extrabold text-xs text-slate-700">Notifications ({notifications.length})</span>
                    {notifications.length > 0 && (
                      <button onClick={markAllNotificationsRead} className="text-emerald-600 hover:text-emerald-700 hover:underline text-[10px] font-bold cursor-pointer border-none bg-transparent">
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto flex flex-col gap-2">
                    {notifications.length === 0 ? (
                      <div className="py-4 text-center text-slate-400 text-xs font-semibold">No new notifications</div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n._id} className="p-2.5 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-slate-100 text-[11px] font-semibold leading-relaxed text-left flex flex-col gap-1">
                          <p className="text-slate-650 m-0">{n.message}</p>
                          <span className="text-[9px] text-slate-400 font-bold">
                            {new Date(n.createdAt).toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="h-10 w-[1px] bg-slate-200" />
            <div className="flex items-center gap-3">
              <div className="flex flex-col text-right hidden sm:flex leading-none">
                <span className="font-extrabold text-[#001c41] text-xs">{user?.fullName || 'Admin Account'}</span>
                <div className="mt-1 self-end">
                  <span className="text-[8.5px] text-emerald-600 font-extrabold uppercase tracking-wider bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded-full">
                    {user?.role || 'Admin'}
                  </span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-[#001c41] text-xs">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Workspace views content */}
        <div className="p-4 md:p-8 flex-1 w-full max-w-full min-w-0 overflow-x-hidden">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin" />
              <span className="text-xs font-bold">Configuring Administrator Datasets...</span>
            </div>
          ) : (
            <div className="animate-fadeIn">
                       {/* TAB: DASHBOARD VIEW */}
              {activeTab === 'Dashboard' && (
                <div className="flex flex-col gap-8">
                  {/* UBT UI Header Panel matching the reference image */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 text-left">
                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-1.5 text-red-650 font-black text-[10px] uppercase tracking-wider">
                        <Shield className="h-4 w-4 text-red-500 fill-red-50" />
                        <span>Secure Admin Dashboard</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-[#001c41] mt-1.5 tracking-tight font-sans">
                        UBT Platform Administrator
                      </h2>
                    </div>
                    <div className="self-start sm:self-center">
                      <span className="border border-red-250 bg-red-50/50 text-red-650 font-black text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-full select-none shadow-2xs">
                        Admin Mode Active
                      </span>
                    </div>
                  </div>

                  {/* Overview Cards matching the UBT UI layout */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Card 1: Pending Approvals */}
                    <div className="bg-amber-50/30 border border-amber-250/70 p-5 rounded-[22px] shadow-2xs flex justify-between items-center transition-all hover:-translate-y-0.5 hover:shadow">
                      <div className="flex flex-col gap-1 text-left">
                        <span className="text-[10px] text-amber-600 font-black uppercase tracking-wider">Pending Approvals</span>
                        <span className="text-3xl font-black text-amber-700 mt-2 leading-none">
                          {businesses.filter(b => b.status === 'Pending Verification' || b.status === 'Under Review').length +
                           blogs.filter(b => b.status === 'Pending Approval').length +
                           events.filter(e => e.status === 'Pending Review').length +
                           appTestimonials.filter(t => t.status === 'Pending').length}
                        </span>
                      </div>
                      <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 border border-amber-100/50">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                    </div>

                    {/* Card 2: Active Premium */}
                    <div className="bg-emerald-50/30 border border-emerald-250/70 p-5 rounded-[22px] shadow-2xs flex justify-between items-center transition-all hover:-translate-y-0.5 hover:shadow">
                      <div className="flex flex-col gap-1 text-left">
                        <span className="text-[10px] text-emerald-700 font-black uppercase tracking-wider">Active Premium</span>
                        <span className="text-3xl font-black text-emerald-800 mt-2 leading-none">
                          {businesses.filter(b => b.subscriptionStatus === 'active' && b.status === 'Approved').length}
                        </span>
                      </div>
                      <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100/50">
                        <CreditCard className="h-5 w-5" />
                      </div>
                    </div>

                    {/* Card 3: Expired Billing */}
                    <div className="bg-red-50/30 border border-red-200/80 p-5 rounded-[22px] shadow-2xs flex justify-between items-center transition-all hover:-translate-y-0.5 hover:shadow">
                      <div className="flex flex-col gap-1 text-left">
                        <span className="text-[10px] text-red-650 font-black uppercase tracking-wider">Expired Billing</span>
                        <span className="text-3xl font-black text-red-700 mt-2 leading-none">
                          {businesses.filter(b => b.subscriptionStatus === 'expired').length}
                        </span>
                      </div>
                      <div className="h-10 w-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500 border border-red-100/50">
                        <AlertCircle className="h-5 w-5" />
                      </div>
                    </div>

                    {/* Card 4: Total Listings */}
                    <div className="bg-slate-50/50 border border-slate-200/80 p-5 rounded-[22px] shadow-2xs flex justify-between items-center transition-all hover:-translate-y-0.5 hover:shadow">
                      <div className="flex flex-col gap-1 text-left">
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Total Listings</span>
                        <span className="text-3xl font-black text-[#001c41] mt-2 leading-none">
                          {businesses.length}
                        </span>
                      </div>
                      <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 border border-slate-200/50">
                        <Grid className="h-5 w-5" />
                      </div>
                    </div>
                  </div>

                  {/* Listings Audit & Approval Desk Card */}
                  <div className="bg-white border border-slate-200/80 shadow-sm rounded-3xl p-4 sm:p-6 md:p-8 flex flex-col gap-6 text-left w-full max-w-full overflow-hidden">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-slate-100 pb-5">
                      <div className="flex flex-col">
                        <h3 className="font-extrabold text-[#001c41] text-base leading-tight font-sans">
                          Listings Audit & Approval Desk
                        </h3>
                        <span className="text-[10px] text-slate-400 font-semibold mt-1">
                          Vetting new directories, moderation blogs and rating comments across the UBT platform.
                        </span>
                      </div>

                      {/* Pill tabs container */}
                      <div className="bg-slate-100/60 p-1 rounded-xl flex items-center self-start md:self-center overflow-x-auto shrink-0 border border-slate-200/30 w-full md:w-auto max-w-full min-w-0 scrollbar-none">
                        <button
                          onClick={() => setAuditSubTab('Businesses')}
                          className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center shrink-0 ${
                            auditSubTab === 'Businesses'
                              ? 'bg-[#027244] text-white shadow-sm shadow-emerald-950/15'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Businesses Audit
                        </button>
                        <button
                          onClick={() => setAuditSubTab('Blogs')}
                          className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                            auditSubTab === 'Blogs'
                              ? 'bg-[#027244] text-white shadow-sm shadow-emerald-950/15'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <span>Blogs Audit</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                            auditSubTab === 'Blogs' ? 'bg-white text-[#027244]' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {blogs.filter(b => b.status === 'Pending Approval').length}
                          </span>
                        </button>
                        <button
                          onClick={() => setAuditSubTab('Events')}
                          className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                            auditSubTab === 'Events'
                              ? 'bg-[#027244] text-white shadow-sm shadow-emerald-950/15'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <span>Events Audit</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                            auditSubTab === 'Events' ? 'bg-white text-[#027244]' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {events.filter(e => e.status === 'Pending Review').length}
                          </span>
                        </button>
                        <button
                          onClick={() => setAuditSubTab('Testimonials')}
                          className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                            auditSubTab === 'Testimonials'
                              ? 'bg-[#027244] text-white shadow-sm shadow-emerald-950/15'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <span>Testimonials Audit</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                            auditSubTab === 'Testimonials' ? 'bg-white text-[#027244]' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {appTestimonials.filter(t => t.status === 'Pending').length}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Sub-tab content */}
                    {auditSubTab === 'Businesses' && (
                      <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                        <table className="w-full border-collapse text-left text-xs font-semibold text-slate-600">
                          <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[9px] font-black text-slate-450 tracking-wider">
                            <tr>
                              <th className="p-4.5">Business Profile</th>
                              <th className="p-4.5">Category / Locality</th>
                              <th className="p-4.5">Branches</th>
                              <th className="p-4.5">Status</th>
                              <th className="p-4.5">Sub Expiry</th>
                              <th className="p-4.5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {filteredBusinesses.map(b => (
                              <tr key={b._id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4.5 flex items-center gap-3.5">
                                  <div className="h-11 w-11 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200 relative shadow-2xs">
                                    <img src={b.coverImageUrl} className="h-full w-full object-cover" alt={b.name} />
                                  </div>
                                  <div className="flex flex-col text-left min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-extrabold text-slate-800 text-xs sm:text-[13px] leading-tight truncate">
                                        {b.name}
                                      </span>
                                      {isBizDraft(b) && (
                                        <span className="bg-amber-100 border border-amber-250 text-amber-850 text-[7.5px] font-black px-1.5 py-0.5 rounded-md uppercase shrink-0 leading-none">
                                          Incomplete Reg
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-slate-405 font-semibold mt-1 font-sans">
                                      Owner: {b.ownerName}
                                    </span>
                                    {/* Prominent external View Profile link */}
                                    <a
                                      href={`/businesses/${b.slug || b._id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[#027244] hover:text-[#005934] hover:underline font-black text-[10.5px] mt-1.5 flex items-center gap-1 w-fit cursor-pointer leading-none"
                                    >
                                      View Profile →
                                    </a>
                                  </div>
                                </td>
                                <td className="p-4.5">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-700 text-xs">{b.type}</span>
                                    <span className="text-[10px] text-slate-400 mt-1 font-semibold">{b.locality}</span>
                                  </div>
                                </td>
                                <td className="p-4.5 font-bold text-slate-700 text-xs">
                                  {b.branchCount || 0} Branches
                                </td>
                                <td className="p-4.5">
                                  <span className={`px-2.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wide border ${
                                    b.status === 'Approved'
                                      ? 'bg-emerald-50 border-emerald-250 text-emerald-700'
                                      : b.status === 'Rejected'
                                        ? 'bg-red-50 border-red-200 text-red-650'
                                        : 'bg-amber-50 border-amber-250 text-amber-600 animate-pulse'
                                  }`}>
                                    {b.status}
                                  </span>
                                </td>
                                <td className="p-4.5 font-bold text-slate-500">
                                  {b.subscriptionExpiry ? new Date(b.subscriptionExpiry).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="p-4.5 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => { setSelectedBiz(b); setShowBizModal(true); }}
                                      className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[10.5px] font-extrabold cursor-pointer shadow-2xs"
                                    >
                                      Vet details
                                    </button>
                                    {b.status !== 'Approved' && b.status !== 'Rejected' && (
                                      <>
                                        <button
                                          onClick={() => { handleAction(b._id, 'reject'); showToast('Listing rejected.', 'error'); }}
                                          className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg text-[10.5px] font-extrabold cursor-pointer shadow-2xs"
                                        >
                                          Reject
                                        </button>
                                        <button
                                          onClick={() => { handleAction(b._id, 'approve'); showToast('Listing approved!', 'success'); }}
                                          className="px-2.5 py-1.5 bg-[#027244] hover:bg-[#005934] text-white rounded-lg text-[10.5px] font-extrabold cursor-pointer shadow-2xs"
                                        >
                                          Approve
                                        </button>
                                      </>
                                     )}
                                    <button
                                      onClick={() => handleDeleteBusiness(b._id)}
                                      className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10.5px] font-extrabold cursor-pointer transition-colors shadow-2xs"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {filteredBusinesses.length === 0 && (
                              <tr>
                                <td colSpan="6" className="p-8 text-center text-slate-400 text-xs font-bold leading-normal">
                                  No business listings match your query.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {auditSubTab === 'Blogs' && (
                      <div className="flex flex-col gap-4">
                        {blogs.map(b => (
                          <div key={b._id} className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-5 flex flex-col gap-4">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex flex-col text-left font-sans">
                                <span className="font-extrabold text-[#001c41] text-xs sm:text-[13px] leading-snug">{b.title}</span>
                                <span className="text-[9.5px] text-slate-405 font-bold mt-1 block">
                                  Author: {b.authorName} • Date: {new Date(b.createdAt).toLocaleDateString()} • Category: <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider">{b.category || 'Business Tips'}</span>
                                </span>
                                <a
                                  href={`/blogs/${b._id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#027244] hover:text-[#005934] hover:underline font-black text-[10.5px] mt-1.5 flex items-center gap-1 w-fit cursor-pointer leading-none"
                                >
                                  View Details →
                                </a>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wide border ${
                                b.status === 'Approved' ? 'bg-emerald-50 border-emerald-250 text-emerald-700' : 'bg-amber-50 border-amber-250 text-amber-600 animate-pulse'
                              }`}>
                                {b.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-3xl text-justify">{b.content}</p>
                            
                            <div className="flex justify-end gap-2 border-t border-slate-200/50 pt-3">
                              <button 
                                onClick={() => handleBlogAction(b._id, b.status === 'Hidden' ? 'Approved' : 'Hidden')}
                                className={`px-3 py-1.5 border font-extrabold text-[10.5px] rounded-xl cursor-pointer transition-colors ${
                                  b.status === 'Hidden'
                                    ? 'bg-amber-500/10 border-amber-500/25 text-amber-500 hover:bg-amber-500/20'
                                    : 'border-slate-200 hover:bg-slate-50 text-slate-650'
                                }`}
                              >
                                {b.status === 'Hidden' ? 'Unhide' : 'Hide'}
                              </button>
                              {b.status !== 'Approved' && b.status !== 'Rejected' && (
                                <>
                                  <button 
                                    onClick={() => handleBlogAction(b._id, 'Rejected')}
                                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-650 font-extrabold text-[10.5px] rounded-xl cursor-pointer shadow-2xs"
                                  >
                                    Reject
                                  </button>
                                  <button 
                                    onClick={() => handleBlogAction(b._id, 'Approved')}
                                    className="px-4.5 py-1.5 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-[10.5px] rounded-xl cursor-pointer shadow-sm shadow-emerald-800/10"
                                  >
                                    Approve & Publish
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                        {blogs.length === 0 && (
                          <div className="p-8 text-center text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl">
                            No blogs waiting for verification.
                          </div>
                        )}
                      </div>
                    )}

                    {auditSubTab === 'Events' && (
                      <div className="flex flex-col gap-4">
                        {[...events]
                          .filter(e => e.status === 'Pending Review')
                          .sort((a, b) => getEventSortWeight(a) - getEventSortWeight(b) || new Date(a.date) - new Date(b.date))
                          .map(e => {
                            const isExpired = new Date(e.endDate || e.date) < new Date();
                            return (
                              <div key={e._id} className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-5 flex flex-col gap-4">
                                <div className="flex justify-between items-start gap-4">
                                  <div className="flex flex-col text-left font-sans">
                                    <span className="font-extrabold text-[#001c41] text-xs sm:text-[13px] leading-snug">{e.title}</span>
                                    <span className="text-[9.5px] text-slate-455 font-bold mt-1 block">
                                      Organizer: {e.organizer} • Date: {formatEventDateRange(e.date, e.endDate)} • Venue: {e.venue || 'To Be Declared'}
                                    </span>
                                    <a
                                      href="/events"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[#027244] hover:text-[#005934] hover:underline font-black text-[10.5px] mt-1.5 flex items-center gap-1 w-fit cursor-pointer leading-none"
                                    >
                                      View Details →
                                    </a>
                                  </div>
                                  <div className="flex gap-1.5 shrink-0 items-center">
                                    {isExpired && (
                                      <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wide bg-red-50 border border-red-250 text-red-700">
                                        Expired
                                      </span>
                                    )}
                                    <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wide border ${
                                      e.status === 'Approved' ? 'bg-emerald-50 border-emerald-250 text-emerald-700' : 'bg-amber-50 border-amber-250 text-amber-600 animate-pulse'
                                    }`}>
                                      {e.status}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="flex justify-end gap-2 border-t border-slate-200/50 pt-3">
                                  <button 
                                    onClick={() => handleEventDelete(e._id)}
                                    className="mr-auto px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-650 font-extrabold text-[10.5px] rounded-xl cursor-pointer shadow-2xs"
                                  >
                                    Delete
                                  </button>
                                  {e.status !== 'Approved' && e.status !== 'Rejected' && (
                                    <>
                                      <button 
                                        onClick={() => handleEventAction(e._id, 'Rejected')}
                                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-650 font-extrabold text-[10.5px] rounded-xl cursor-pointer shadow-2xs"
                                      >
                                        Reject
                                      </button>
                                      <button 
                                        onClick={() => handleEventAction(e._id, 'Approved')}
                                        className="px-4 py-1.5 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-[10.5px] rounded-xl cursor-pointer shadow-sm"
                                      >
                                        Approve & Publish
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        {events.filter(e => e.status === 'Pending Review').length === 0 && (
                          <div className="p-8 text-center text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl">
                            No events waiting for verification.
                          </div>
                        )}
                      </div>
                    )}

                    {auditSubTab === 'Testimonials' && (
                      <div className="flex flex-col gap-4">
                        {testimonialsLoading ? (
                          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                            <RefreshCw className="h-6 w-6 text-emerald-600 animate-spin" />
                            <span className="text-[10px] font-bold">Loading Testimonials...</span>
                          </div>
                        ) : (
                          <>
                            {[...appTestimonials]
                              .sort((a, b) => {
                                const weight = (status) => status === 'Pending' ? 0 : status === 'Approved' ? 1 : 2;
                                return weight(a.status) - weight(b.status) || new Date(b.createdAt) - new Date(a.createdAt);
                              })
                              .map(t => (
                                <div key={t._id} className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-left">
                                  <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 bg-emerald-50 rounded-full border border-emerald-100 flex items-center justify-center font-black text-[#027244] text-xs shrink-0 select-none uppercase">
                                      {(t.authorName || 'KA').slice(0, 2)}
                                    </div>
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-extrabold text-xs text-slate-800 leading-none">{t.authorName}</span>
                                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider">{t.role}</span>
                                        <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wide border ${
                                          t.status === 'Approved'
                                            ? 'bg-emerald-50 border-emerald-250 text-emerald-700'
                                            : t.status === 'Rejected'
                                              ? 'bg-red-50 border-red-200 text-red-650'
                                              : 'bg-amber-50 border-amber-250 text-amber-600 animate-pulse'
                                        }`}>
                                          {t.status}
                                        </span>
                                      </div>
                                      
                                      <div className="flex items-center gap-1 mt-1.5 text-amber-400">
                                        {[...Array(5)].map((_, i) => (
                                          <Star key={i} className={`h-3 w-3 ${i < (t.rating || 5) ? 'fill-current' : 'text-slate-205'}`} />
                                        ))}
                                        <span className="text-[9.5px] text-slate-400 font-bold ml-2">
                                          {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                                        </span>
                                      </div>

                                      <p className="text-[11.5px] text-slate-555 font-semibold mt-2 max-w-2xl leading-relaxed italic">
                                        "{t.text}"
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                    {t.status !== 'Approved' && (
                                      <button 
                                        onClick={() => handleTestimonialStatus(t._id, 'Approved')}
                                        className="px-2.5 py-1.5 bg-[#027244] hover:bg-[#005934] text-white rounded-lg text-[10.5px] font-extrabold cursor-pointer transition-colors shadow-2xs"
                                        title="Approve Testimonial"
                                      >
                                        Approve
                                      </button>
                                    )}
                                    {t.status !== 'Rejected' && (
                                      <button 
                                        onClick={() => handleTestimonialStatus(t._id, 'Rejected')}
                                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg text-[10.5px] font-extrabold cursor-pointer transition-colors"
                                        title="Reject Testimonial"
                                      >
                                        Reject
                                      </button>
                                    )}
                                    <button 
                                      onClick={() => handleTestimonialDelete(t._id)}
                                      className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer border border-slate-205"
                                      title="Delete Permanently"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            {appTestimonials.length === 0 && (
                              <div className="p-8 text-center text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl">
                                No app testimonials have been submitted yet.
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: BUSINESSES MANAGEMENT */}
              {activeTab === 'Businesses' && (
                <div className="flex flex-col gap-6 text-left">
                  <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-col">
                      <h3 className="font-extrabold text-[#001c41] text-base">Registrations Directory</h3>
                      <span className="text-[10px] text-slate-450 font-semibold mt-0.5">Audit, suspend, or update registered listings across the town division</span>
                    </div>
                    <button
                      onClick={() => setShowAddDirectoryModal(true)}
                      className="px-4 py-2.5 bg-[#027244] hover:bg-[#005934] text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-850/15"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Directory Listing</span>
                    </button>
                  </div>

                  <div className="bg-white border border-slate-200/80 shadow-xs rounded-[28px] overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-xs font-semibold text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[9px] font-black text-slate-450 tracking-wider">
                          <tr>
                            <th className="p-4.5">Business / Owner</th>
                            <th className="p-4.5">Category / Locality</th>
                            <th className="p-4.5">Pincode</th>
                            <th className="p-4.5">Branches</th>
                            <th className="p-4.5">Verification</th>
                            <th className="p-4.5">Subscription</th>
                            <th className="p-4.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {filteredBusinesses.map(b => (
                            <tr key={b._id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4.5 flex items-center gap-3">
                                <div className="h-9 w-9 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                                  <img src={b.coverImageUrl} className="h-full w-full object-cover" alt={b.name} />
                                </div>
                                <div className="flex flex-col text-left">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-extrabold text-slate-800 text-xs leading-none">{b.name}</span>
                                    {isBizDraft(b) && (
                                      <span className="bg-amber-100 border border-amber-250 text-amber-850 text-[7.5px] font-black px-1.5 py-0.5 rounded-md uppercase shrink-0 leading-none">
                                        Incomplete Reg
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[9.5px] text-slate-400 font-bold mt-1 leading-none">Owner: {b.ownerName}</span>
                                </div>
                              </td>
                              <td className="p-4.5">
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-700 text-xs">{b.type}</span>
                                  <span className="text-[9.5px] text-slate-400 mt-1">{b.locality}</span>
                                </div>
                              </td>
                              <td className="p-4.5 font-bold text-slate-800">{b.pincode}</td>
                              <td className="p-4.5 font-bold text-slate-700 text-xs">
                                {b.branchCount || 0} Branches
                              </td>
                              <td className="p-4.5">
                                <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wide border ${
                                  b.status === 'Approved'
                                    ? 'bg-emerald-50 border-emerald-250 text-emerald-700'
                                    : b.status === 'Rejected'
                                      ? 'bg-red-50 border-red-200 text-red-650'
                                      : b.status === 'Hidden'
                                        ? 'bg-amber-50 border-amber-200 text-amber-750'
                                        : 'bg-amber-50 border-amber-250 text-amber-600 animate-pulse'
                                }`}>
                                  {b.status}
                                </span>
                              </td>
                              <td className="p-4.5">
                                <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wide border ${
                                  b.subscriptionStatus === 'active'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-red-50 border-red-200 text-red-650'
                                }`}>
                                  {b.subscriptionStatus}
                                </span>
                              </td>
                              <td className="p-4.5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <a 
                                    href={`/businesses/${b.slug || b._id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[10.5px] font-extrabold text-center leading-none shadow-2xs"
                                  >
                                    View Profile
                                  </a>
                                  {b.status !== 'Approved' && b.status !== 'Rejected' && (
                                    <>
                                      <button 
                                        onClick={() => { handleAction(b._id, 'reject'); showToast('Listing rejected.', 'error'); }}
                                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg text-[10.5px] font-extrabold cursor-pointer"
                                      >
                                        Reject
                                      </button>
                                      <button 
                                        onClick={() => { handleAction(b._id, 'approve'); showToast('Listing approved!', 'success'); }}
                                        className="px-2.5 py-1.5 bg-[#027244] hover:bg-[#005934] text-white rounded-lg text-[10.5px] font-extrabold cursor-pointer"
                                      >
                                        Approve
                                      </button>
                                    </>
                                  )}
                                  <button 
                                    onClick={() => handleAction(b._id, b.status === 'Hidden' ? 'unhide' : 'hide')}
                                    className={`px-2.5 py-1.5 rounded-lg text-[10.5px] font-extrabold cursor-pointer transition-colors shadow-2xs ${
                                      b.status === 'Hidden' 
                                        ? 'bg-amber-100 hover:bg-amber-250 text-amber-750' 
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                    }`}
                                  >
                                    {b.status === 'Hidden' ? 'Unhide' : 'Hide'}
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteBusiness(b._id)}
                                    className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10.5px] font-extrabold cursor-pointer transition-colors shadow-2xs"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: PENDING APPROVALS LIST */}
              {activeTab === 'Pending Approvals' && (
                <div className="flex flex-col gap-6 text-left">
                  <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-4 sm:p-6 flex flex-col md:flex-row justify-between md:items-center gap-4 w-full max-w-full overflow-hidden">
                    <div className="flex flex-col">
                      <h3 className="font-extrabold text-[#001c41] text-base">Pending Approvals Desk</h3>
                      <span className="text-[10px] text-slate-450 font-semibold mt-0.5">Showcasing listings, community blogs, and events waiting for administrative approval</span>
                    </div>

                    {/* Pill tabs container */}
                    <div className="bg-slate-100/60 p-1 rounded-xl flex items-center self-start md:self-center overflow-x-auto shrink-0 border border-slate-200/30 w-full md:w-auto max-w-full min-w-0 scrollbar-none">
                      <button
                        onClick={() => setPendingSubTab('Businesses')}
                        className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                          pendingSubTab === 'Businesses'
                            ? 'bg-[#027244] text-white shadow-sm shadow-emerald-950/15'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Businesses ({businesses.filter(b => b.status === 'Pending Verification' || b.status === 'Under Review').length})
                      </button>
                      <button
                        onClick={() => setPendingSubTab('Blogs')}
                        className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                          pendingSubTab === 'Blogs'
                            ? 'bg-[#027244] text-white shadow-sm shadow-emerald-950/15'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Blogs ({blogs.filter(b => b.status === 'Pending Approval').length})
                      </button>
                      <button
                        onClick={() => setPendingSubTab('Events')}
                        className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                          pendingSubTab === 'Events'
                            ? 'bg-[#027244] text-white shadow-sm shadow-emerald-950/15'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Events ({events.filter(e => e.status === 'Pending Review').length})
                      </button>
                      <button
                        onClick={() => setPendingSubTab('Testimonials')}
                        className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                          pendingSubTab === 'Testimonials'
                            ? 'bg-[#027244] text-white shadow-sm shadow-emerald-950/15'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Testimonials ({appTestimonials.filter(t => t.status === 'Pending').length})
                      </button>
                      <button
                        onClick={() => setPendingSubTab('Categories')}
                        className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                          pendingSubTab === 'Categories'
                            ? 'bg-[#027244] text-white shadow-sm shadow-emerald-950/15'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Categories ({pendingCategories.length})
                      </button>
                      <button
                        onClick={() => setPendingSubTab('Partners')}
                        className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                          pendingSubTab === 'Partners'
                            ? 'bg-[#027244] text-white shadow-sm shadow-emerald-950/15'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Partners ({partners.filter(p => p.isPartnerRegistered && !p.isPartnerApproved).length})
                      </button>
                    </div>
                  </div>

                  {/* Sub-tab view: Businesses */}
                  {pendingSubTab === 'Businesses' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {businesses.filter(b => b.status === 'Pending Verification' || b.status === 'Under Review').map(b => (
                        <div key={b._id} className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 flex flex-col justify-between gap-5 hover:shadow-md transition-shadow">
                          <div className="flex gap-4">
                            <div className="h-16 w-16 bg-slate-100 rounded-2xl overflow-hidden shrink-0 border border-slate-200">
                              <img src={b.coverImageUrl} className="h-full w-full object-cover" alt={b.name} />
                            </div>
                            <div className="flex flex-col gap-1 text-left min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-extrabold text-sm text-[#001c41] truncate leading-none">{b.name}</h4>
                                {b.googlePlaceId && <span className="bg-blue-50 border border-blue-150 text-blue-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase shrink-0">Google</span>}
                                {isBizDraft(b) && (
                                  <span className="bg-amber-100 border border-amber-250 text-amber-850 text-[8px] font-black px-1.5 py-0.5 rounded uppercase shrink-0 leading-none">
                                    Registration Incomplete
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-emerald-650 font-bold mt-1 leading-none">{b.type}</span>
                              <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-semibold">
                                <MapPin className="h-3 w-3 text-slate-400 shrink-0" /> {b.address}
                              </span>
                            </div>
                          </div>

                          {/* Specs quick cards row */}
                          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 p-2.5 rounded-2xl">
                            <div className="flex flex-col gap-0.5 border-r border-slate-200">
                              <span className="text-[8px] text-slate-400 font-extrabold uppercase">Pincode</span>
                              <span className="font-extrabold text-slate-800">{b.pincode}</span>
                            </div>
                            <div className="flex flex-col gap-0.5 border-r border-slate-200">
                              <span className="text-[8px] text-slate-400 font-extrabold uppercase">G-Rating</span>
                              <span className="font-extrabold text-slate-800">{b.googleRating || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[8px] text-slate-400 font-extrabold uppercase">Timings</span>
                              <span className="font-extrabold text-slate-800 truncate">9AM - 8PM</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center border-t border-slate-100 pt-3.5 gap-2">
                            <button 
                              onClick={() => { setSelectedBiz(b); setShowBizModal(true); }}
                              className="text-xs font-bold text-slate-550 hover:text-slate-800 flex items-center gap-0.5 cursor-pointer"
                            >
                              <Eye className="h-4 w-4 text-slate-400" /> View details
                            </button>
                            
                            <div className="flex gap-2">
                              {b.status !== 'Approved' && b.status !== 'Rejected' && (
                                <>
                                  <button 
                                    onClick={() => { handleAction(b._id, 'reject'); showToast('Listing rejected.', 'error'); }}
                                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-650 font-extrabold text-[10.5px] rounded-xl cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                  <button 
                                    onClick={() => { handleAction(b._id, 'approve'); showToast('Listing approved!', 'success'); }}
                                    className="px-4.5 py-2 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-[10.5px] rounded-xl cursor-pointer shadow shadow-emerald-800/10"
                                  >
                                    Approve listing
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {businesses.filter(b => b.status === 'Pending Verification' || b.status === 'Under Review').length === 0 && (
                        <div className="col-span-2 bg-white border border-slate-200 rounded-3xl p-16 text-center text-slate-400 flex flex-col items-center gap-3">
                          <CheckCircle2 className="h-10 w-10 text-emerald-600 animate-bounce" />
                          <span className="text-sm font-bold text-slate-800 font-sans">Queue Empty!</span>
                          <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-xs">There are no pending business listings waiting for administrative approval today.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sub-tab view: Blogs */}
                  {pendingSubTab === 'Blogs' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {blogs.filter(b => b.status === 'Pending Approval').map(b => (
                        <div key={b._id} className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 flex flex-col justify-between gap-5 hover:shadow-md transition-shadow">
                          <div className="flex gap-4">
                            <div className="h-16 w-20 rounded-2xl overflow-hidden border border-slate-200 shrink-0 bg-slate-50">
                              <img 
                                src={(!b.coverImage || b.coverImage.includes('unsplash.com')) ? '/default_blog_cover.jpg' : b.coverImage} 
                                className={`w-full h-full ${(!b.coverImage || b.coverImage.includes('unsplash.com')) ? 'object-contain bg-white p-1' : 'object-cover'}`} 
                                alt="Blog Cover" 
                              />
                            </div>
                            <div className="flex flex-col gap-1 text-left min-w-0 flex-1">
                              <h4 className="font-extrabold text-sm text-[#001c41] truncate leading-none">{b.title}</h4>
                              <span className="text-xs text-emerald-655 font-bold mt-1 leading-none">
                                Author: {b.authorName} • Category: <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider">{b.category || 'Business Tips'}</span>
                              </span>
                              <span className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1 font-semibold">
                                <Calendar className="h-3 w-3 text-slate-400 shrink-0" /> {new Date(b.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-550 font-semibold leading-relaxed line-clamp-3 text-justify">{b.content}</p>

                          <div className="flex justify-between items-center border-t border-slate-100 pt-3.5 gap-2">
                            <button 
                              onClick={() => { setSelectedBlogModal(b); setSuggestionText(b.revisionSuggestions || ''); }}
                              className="text-xs font-bold text-slate-550 hover:text-slate-800 flex items-center gap-0.5 cursor-pointer"
                            >
                              <Eye className="h-4 w-4 text-slate-400" /> View details
                            </button>
                            
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleBlogAction(b._id, b.status === 'Hidden' ? 'Approved' : 'Hidden')}
                                className={`px-3 py-2 border font-extrabold text-[10.5px] rounded-xl cursor-pointer transition-colors ${
                                  b.status === 'Hidden'
                                    ? 'bg-amber-500/10 border-amber-500/25 text-amber-500 hover:bg-amber-500/20'
                                    : 'border-slate-200 hover:bg-slate-50 text-slate-650'
                                }`}
                              >
                                {b.status === 'Hidden' ? 'Unhide' : 'Hide'}
                              </button>
                              {b.status !== 'Approved' && b.status !== 'Rejected' && (
                                <>
                                  <button 
                                    onClick={() => handleBlogAction(b._id, 'Rejected')}
                                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-650 font-extrabold text-[10.5px] rounded-xl cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                  <button 
                                    onClick={() => handleBlogAction(b._id, 'Approved')}
                                    className="px-4.5 py-2 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-[10.5px] rounded-xl cursor-pointer shadow shadow-emerald-800/10"
                                  >
                                    Approve
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {blogs.filter(b => b.status === 'Pending Approval').length === 0 && (
                        <div className="col-span-2 bg-white border border-slate-200 rounded-3xl p-16 text-center text-slate-400 flex flex-col items-center gap-3">
                          <BookOpen className="h-10 w-10 text-emerald-600 animate-bounce" />
                          <span className="text-sm font-bold text-slate-800 font-sans">Queue Empty!</span>
                          <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-xs">There are no pending blog article submissions waiting for review today.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sub-tab view: Events */}
                  {pendingSubTab === 'Events' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[...events]
                        .filter(e => e.status === 'Pending Review')
                        .sort((a, b) => getEventSortWeight(a) - getEventSortWeight(b) || new Date(a.date) - new Date(b.date))
                        .map(e => {
                          const isExpired = new Date(e.endDate || e.date) < new Date();
                          return (
                            <div key={e._id} className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 flex flex-col justify-between gap-5 hover:shadow-md transition-shadow">
                              <div className="flex flex-col gap-1 text-left min-w-0">
                                <div className="flex justify-between items-start gap-4">
                                  <h4 className="font-extrabold text-sm text-[#001c41] truncate leading-none">{e.title}</h4>
                                  {isExpired && (
                                    <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wide bg-red-50 border border-red-250 text-red-700 shrink-0">
                                      Expired
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-emerald-650 font-bold mt-1.5 leading-none">Organizer: {e.organizer}</span>
                              </div>

                              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl text-[10.5px] font-bold text-slate-600 flex flex-col gap-1.5">
                                <div>📅 Date: <span className="text-slate-800">{formatEventDateRange(e.date, e.endDate)}</span></div>
                                <div>📍 Venue: <span className="text-slate-800">{e.venue || 'To Be Declared'}</span></div>
                                <div>🎭 Category: <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider">{e.category}</span></div>
                              </div>

                              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3.5">
                                <button 
                                  onClick={() => handleEventDelete(e._id)}
                                  className="mr-auto px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-650 font-extrabold text-[10.5px] rounded-xl cursor-pointer"
                                >
                                  Delete
                                </button>
                                {e.status !== 'Approved' && e.status !== 'Rejected' && (
                                  <>
                                    <button 
                                      onClick={() => handleEventAction(e._id, 'Rejected')}
                                      className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-650 font-extrabold text-[10.5px] rounded-xl cursor-pointer"
                                    >
                                      Reject
                                    </button>
                                    <button 
                                      onClick={() => handleEventAction(e._id, 'Approved')}
                                      className="px-4.5 py-2 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-[10.5px] rounded-xl cursor-pointer shadow shadow-emerald-800/10"
                                    >
                                      Approve
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      {events.filter(e => e.status === 'Pending Review').length === 0 && (
                        <div className="col-span-2 bg-white border border-slate-200 rounded-3xl p-16 text-center text-slate-400 flex flex-col items-center gap-3">
                          <Calendar className="h-10 w-10 text-emerald-600 animate-bounce" />
                          <span className="text-sm font-bold text-slate-800 font-sans">Queue Empty!</span>
                          <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-xs">There are no pending community events waiting for review today.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sub-tab view: Testimonials */}
                  {pendingSubTab === 'Testimonials' && (
                    <div className="flex flex-col gap-4">
                      {testimonialsLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                          <RefreshCw className="h-6 w-6 text-emerald-600 animate-spin" />
                          <span className="text-[10px] font-bold">Loading Testimonials...</span>
                        </div>
                      ) : (
                        <>
                          {appTestimonials.filter(t => t.status === 'Pending').map(t => (
                            <div key={t._id} className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-left">
                              <div className="flex items-start gap-4">
                                <div className="h-10 w-10 bg-emerald-50 rounded-full border border-emerald-100 flex items-center justify-center font-black text-[#027244] text-xs shrink-0 select-none uppercase font-sans">
                                  {(t.authorName || 'KA').slice(0, 2)}
                                </div>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2 flex-wrap font-sans">
                                    <span className="font-extrabold text-xs text-slate-800 leading-none">{t.authorName}</span>
                                    <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider">{t.role}</span>
                                    <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wide border bg-amber-50 border-amber-250 text-amber-600 animate-pulse">
                                      {t.status}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center gap-1 mt-1.5 text-amber-400">
                                    {[...Array(5)].map((_, i) => (
                                      <Star key={i} className={`h-3 w-3 ${i < (t.rating || 5) ? 'fill-current' : 'text-slate-205'}`} />
                                    ))}
                                    <span className="text-[9.5px] text-slate-400 font-bold ml-2 font-sans">
                                      {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                                    </span>
                                  </div>

                                  <p className="text-[11.5px] text-slate-555 font-semibold mt-2 max-w-2xl leading-relaxed italic font-sans">
                                    "{t.text}"
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                <button 
                                  onClick={() => handleTestimonialStatus(t._id, 'Approved')}
                                  className="px-3.5 py-2 bg-[#027244] hover:bg-[#005934] text-white rounded-xl text-[10.5px] font-extrabold cursor-pointer transition-colors shadow shadow-emerald-800/10"
                                >
                                  Approve & Publish
                                </button>
                                <button 
                                  onClick={() => handleTestimonialStatus(t._id, 'Rejected')}
                                  className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-650 rounded-xl text-[10.5px] font-extrabold cursor-pointer transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          ))}
                          {appTestimonials.filter(t => t.status === 'Pending').length === 0 && (
                            <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center text-slate-400 flex flex-col items-center gap-3">
                              <CheckCircle2 className="h-10 w-10 text-emerald-600 animate-bounce" />
                              <span className="text-sm font-bold text-slate-800 font-sans">Queue Empty!</span>
                              <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-xs">There are no pending testimonials waiting for review today.</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Sub-tab view: Categories */}
                  {pendingSubTab === 'Categories' && (
                    <div className="flex flex-col gap-4">
                      {pendingCategories.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center text-slate-400 flex flex-col items-center gap-3">
                          <CheckCircle2 className="h-10 w-10 text-emerald-600 animate-bounce" />
                          <span className="text-sm font-bold text-slate-800 font-sans">Queue Empty!</span>
                          <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-xs">All custom category requests are resolved.</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {pendingCategories.map(biz => (
                            <div key={biz._id} className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-left">
                              <div className="flex flex-col text-left font-sans">
                                <div className="flex items-center gap-2">
                                  <span className="bg-amber-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded shadow-sm">Custom category request</span>
                                  <span className="text-[9px] font-extrabold text-slate-400">Biz Status: {biz.status}</span>
                                </div>
                                <span className="font-black text-sm mt-2 text-[#001c41]">"{biz.customCategoryName}"</span>
                                {biz.requestedParentCategory && (
                                  <span className="text-[11px] text-emerald-600 font-extrabold mt-1">Requested Parent Category: {biz.requestedParentCategory}</span>
                                )}
                                <span className="text-[10.5px] text-slate-400 font-semibold mt-1">Requested by business: <b className="text-slate-555">{biz.name}</b> ({biz.ownerId?.fullName || 'Owner'})</span>
                              </div>
                              <div className="flex flex-wrap gap-2 items-center">
                                {biz.requestedParentCategory && (
                                  <button
                                    onClick={() => {
                                      const confirmed = confirm(`Approve new subcategory "${biz.customCategoryName}" nested under requested parent category "${biz.requestedParentCategory}"?`);
                                      if (confirmed) {
                                        resolveCategoryRequest(biz._id, 'create', null, biz.customCategoryName, null, biz.requestedParentCategory);
                                      }
                                    }}
                                    className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold rounded-xl transition-all shadow-sm cursor-pointer font-sans"
                                  >
                                    Approve as Requested
                                  </button>
                                )}
                                <select
                                  onChange={(e) => {
                                    const catId = e.target.value;
                                    if (!catId) return;
                                    const matched = presetCategories.find(c => c._id === catId);
                                    if (matched) {
                                      const confirmed = confirm(`Assign existing category "${matched.categoryName}" for "${biz.customCategoryName}"?`);
                                      if (confirmed) {
                                        resolveCategoryRequest(biz._id, 'assign', matched._id);
                                      }
                                    }
                                    e.target.value = "";
                                  }}
                                  className="py-1.5 px-3 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-xl text-[10px] font-extrabold cursor-pointer transition-colors outline-none font-sans"
                                >
                                  <option value="">-- Assign Existing Category --</option>
                                  {presetCategories.map(c => (
                                    <option key={c._id} value={c._id}>{c.categoryName}</option>
                                  ))}
                                </select>

                                <select
                                  id={`parent-select-1-${biz._id}`}
                                  className="py-1.5 px-3 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-xl text-[10px] font-extrabold cursor-pointer transition-colors outline-none font-sans"
                                >
                                  <option value="None">-- Separate Main Category --</option>
                                  {[
                                    'Automotive', 'Beauty & Wellness', 'Education', 'Electronics',
                                    'Food & Restaurants', 'Health & Medical', 'Home Services', 'Real Estate',
                                    'Shopping', 'Professional Services', 'Travel & Hospitality', 'Construction',
                                    'Agriculture', 'Finance & Insurance', 'Events & Entertainment', 'Sports & Fitness',
                                    'Governmental organisations',
                                    'Others'
                                  ].map(c => (
                                    <option key={c} value={c}>Parent: {c}</option>
                                  ))}
                                </select>

                                <button
                                  onClick={() => {
                                    const parentVal = document.getElementById(`parent-select-1-${biz._id}`).value;
                                    const parentText = parentVal === 'None' ? 'a Separate Main Category' : `a subcategory under "${parentVal}"`;
                                    const isCreate = confirm(`Create genuinely new category "${biz.customCategoryName}" as ${parentText}? It will auto-resolve the business mapping.`);
                                    if (isCreate) {
                                      resolveCategoryRequest(biz._id, 'create', null, biz.customCategoryName, null, parentVal);
                                    }
                                  }}
                                  className="py-1.5 px-3 bg-[#027244] hover:bg-[#005934] text-white text-[10px] font-extrabold rounded-xl transition-colors cursor-pointer shadow-sm shadow-emerald-800/10 font-sans"
                                >
                                  Create & Map
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sub-tab view: Partners */}
                  {pendingSubTab === 'Partners' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {partners.filter(p => p.isPartnerRegistered && !p.isPartnerApproved).map(p => (
                        <div key={p._id} className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 flex flex-col justify-between gap-5 hover:shadow-md transition-shadow">
                          <div className="flex gap-4">
                            <div className="h-14 w-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center font-extrabold text-[#027244] uppercase select-none text-[16px] shrink-0">
                              {(p.fullName || p.name || 'P').charAt(0)}
                            </div>
                            <div className="flex flex-col gap-1 text-left min-w-0 flex-1">
                              <h4 className="font-extrabold text-sm text-[#001c41] truncate leading-none">{p.fullName || p.name}</h4>
                              <span className="text-xs text-emerald-655 font-bold mt-1 leading-none">Joined on {new Date(p.createdAt).toLocaleDateString()}</span>
                              <span className="text-[10px] text-slate-400 mt-1 font-semibold">Email: {p.email}</span>
                              <span className="text-[10px] text-slate-400 mt-0.5 font-semibold">Phone: {p.phone || p.mobileNumber || 'N/A'}</span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                            <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                              <span className="text-[9px] text-slate-400 font-extrabold uppercase">Aadhaar Number</span>
                              <span className="font-bold text-slate-800 font-mono">{p.aadhaarNumber || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col gap-0.5 pt-1">
                              <span className="text-[9px] text-slate-400 font-extrabold uppercase">Address</span>
                              <span className="font-bold text-slate-850 leading-relaxed text-[11px]">{p.address || 'N/A'}</span>
                            </div>
                          </div>

                          <div className="flex justify-end items-center border-t border-slate-100 pt-3.5 gap-2">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handlePartnerAction(p._id, 'reject')}
                                className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-655 font-extrabold text-[10.5px] rounded-xl cursor-pointer transition-colors"
                              >
                                Reject
                              </button>
                              <button 
                                onClick={() => handlePartnerAction(p._id, 'approve')}
                                className="px-4.5 py-2 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-[10.5px] rounded-xl cursor-pointer shadow shadow-emerald-800/10 transition-colors"
                              >
                                Approve Partner
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {partners.filter(p => p.isPartnerRegistered && !p.isPartnerApproved).length === 0 && (
                        <div className="col-span-2 bg-white border border-slate-200 rounded-3xl p-16 text-center text-slate-400 flex flex-col items-center gap-3">
                          <CheckCircle2 className="h-10 w-10 text-emerald-600 animate-bounce" />
                          <span className="text-sm font-bold text-slate-800 font-sans">Queue Empty!</span>
                          <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-xs">There are no pending partner registrations waiting for administrative approval today.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {/* TAB: BLOGS MODERATION */}
              {activeTab === 'Blogs' && (
                <div className="flex flex-col gap-6 text-left">
                  <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6">
                    <h3 className="font-extrabold text-[#001c41] text-base">Blogs Moderation Desk</h3>
                    <span className="text-[10px] text-slate-450 font-semibold mt-0.5">Audit community blogs, feature written items, or filter spam</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...filteredBlogs]
                      .sort((a, b) => getStatusWeight(a.status) - getStatusWeight(b.status) || new Date(b.createdAt) - new Date(a.createdAt))
                      .map(b => (
                      <div 
                        key={b._id} 
                        onClick={() => { setSelectedBlogModal(b); setSuggestionText(b.revisionSuggestions || ''); }}
                        className="bg-white border border-slate-200 hover:border-slate-400 hover:shadow-md rounded-[24px] p-5 shadow-2xs transition-all flex flex-col justify-between gap-4 cursor-pointer text-left group"
                      >
                        <div className="flex gap-4">
                          <div className="h-16 w-20 rounded-xl overflow-hidden border border-slate-100 shrink-0 select-none bg-slate-50">
                            <img 
                              src={(!b.coverImage || b.coverImage.includes('unsplash.com')) ? '/default_blog_cover.jpg' : b.coverImage} 
                              className={`w-full h-full ${(!b.coverImage || b.coverImage.includes('unsplash.com')) ? 'object-contain bg-white p-1' : 'object-cover'}`} 
                              alt="Blog Cover" 
                            />
                          </div>
                          <div className="flex flex-col min-w-0 text-left">
                            <span className="font-extrabold text-[#001c41] text-xs sm:text-[13px] leading-snug truncate group-hover:text-[#027244] transition-colors">{b.title}</span>
                            <span className="text-[9.5px] text-slate-455 font-bold mt-1">
                              Author: {b.authorName} • {new Date(b.createdAt).toLocaleDateString()} • Category: <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider">{b.category || 'Business Tips'}</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-1">
                          <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wide border ${
                            b.status === 'Approved' 
                              ? 'bg-emerald-50 border-emerald-250 text-emerald-700' 
                              : b.status === 'Pending Approval' || b.status === 'Needs Revision'
                                ? 'bg-amber-50 border-amber-200 text-amber-700 animate-pulse'
                                : b.status === 'Rejected'
                                  ? 'bg-rose-50 border-rose-200 text-rose-650'
                                  : 'bg-slate-50 border-slate-200 text-slate-500'
                          }`}>
                            {b.status}
                          </span>
                          <span className="text-[10.5px] font-extrabold text-[#027244] flex items-center gap-1 group-hover:underline">
                            Touch to Audit & Moderate →
                          </span>
                        </div>
                      </div>
                    ))}
                    {blogs.length === 0 && (
                      <div className="col-span-2 bg-white border border-slate-200 rounded-3xl p-16 text-center text-slate-400 flex flex-col items-center gap-3">
                        <BookOpen className="h-10 w-10 text-emerald-600 animate-pulse" />
                        <span className="text-sm font-bold text-slate-800 font-sans">No Blogs Yet</span>
                        <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-xs">There are no blog posts currently available in the moderation system.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'Events' && (
                <div className="flex flex-col gap-6 text-left">
                  <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6">
                    <h3 className="font-extrabold text-[#001c41] text-base">Community Events Moderation</h3>
                    <span className="text-[10px] text-slate-455 font-semibold mt-0.5">Moderate event list sub-streams to maintain community relevance</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...filteredEvents]
                      .sort((a, b) => getEventSortWeight(a) - getEventSortWeight(b) || new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
                      .map(e => {
                        const isExpired = new Date(e.endDate || e.date) < new Date();
                        return (
                          <div key={e._id} className="bg-white border border-slate-200 rounded-[20px] p-5 shadow-2xs flex flex-col gap-4 justify-between">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex flex-col text-left">
                                <h4 className="font-extrabold text-sm text-[#001c41] leading-none">{e.title}</h4>
                                <span className="text-[9.5px] text-slate-400 font-bold mt-1.5 leading-none">Organizer: {e.organizer}</span>
                              </div>
                              <div className="flex gap-1.5 shrink-0 items-center">
                                {isExpired && (
                                  <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wide bg-red-50 border border-red-250 text-red-700">
                                    Expired
                                  </span>
                                )}
                                <span className={`px-2 py-0.5 rounded text-[8.5px] font-black border ${
                                  e.status === 'Approved' 
                                    ? 'bg-emerald-50 border-emerald-250 text-emerald-700' 
                                    : e.status === 'Hidden'
                                      ? 'bg-amber-100 border-amber-300 text-amber-800'
                                      : 'bg-amber-50 border-amber-250 text-amber-600'
                                }`}>
                                  {e.status}
                                </span>
                              </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl text-[10.5px] font-bold text-slate-600 flex flex-col gap-1.5">
                              <div>📅 Date: <span className="text-slate-800">{formatEventDateRange(e.date, e.endDate)}</span></div>
                              <div>📍 Venue: <span className="text-slate-800">{e.venue || 'To Be Declared'}</span></div>
                              <div>🎭 Category: <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider">{e.category}</span></div>
                            </div>

                            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                              <button 
                                onClick={() => handleEventDelete(e._id)}
                                className="mr-auto px-3 py-1.5 bg-rose-550/10 border border-rose-550/20 hover:bg-rose-550/20 text-rose-650 font-extrabold text-[10.5px] rounded-xl cursor-pointer transition-colors"
                              >
                                Delete
                              </button>
                              <button 
                                onClick={() => handleEventAction(e._id, e.status === 'Hidden' ? 'Approved' : 'Hidden')}
                                className={`px-3 py-1.5 border font-extrabold text-[10.5px] rounded-xl cursor-pointer transition-colors ${
                                  e.status === 'Hidden'
                                    ? 'bg-amber-100 hover:bg-amber-250 border-amber-300 text-amber-800'
                                    : 'bg-slate-50 hover:bg-slate-150 border-slate-200 text-slate-600'
                                }`}
                              >
                                {e.status === 'Hidden' ? 'Unhide' : 'Hide'}
                              </button>
                              {e.status !== 'Approved' && e.status !== 'Rejected' && (
                                <>
                                  <button 
                                    onClick={() => handleEventAction(e._id, 'Rejected')}
                                    className="px-3 py-1.5 bg-red-550/10 hover:bg-red-550/20 border border-red-550/20 text-red-650 font-extrabold text-[10.5px] rounded-xl cursor-pointer transition-colors"
                                  >
                                    Reject
                                  </button>
                                  <button 
                                    onClick={() => handleEventAction(e._id, 'Approved')}
                                    className="px-4 py-1.5 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-[10.5px] rounded-xl cursor-pointer shadow-sm"
                                  >
                                    Approve
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* TAB: REVIEWS FEED */}
              {activeTab === 'Reviews' && (
                <div className="flex flex-col gap-6 text-left">
                  <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6">
                    <h3 className="font-extrabold text-[#001c41] text-base">Ratings & Reviews Moderation</h3>
                    <span className="text-[10px] text-slate-455 font-semibold mt-0.5">Purge spam, review duplicates, or filter inappropriate content</span>
                  </div>

                  <div className="flex flex-col gap-4">
                    {reviews.map(r => (
                      <div key={r._id} className="bg-white border border-slate-200 rounded-[20px] p-5 shadow-2xs flex justify-between items-center gap-6">
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center font-black text-slate-600 text-xs">
                            {r.authorName.charAt(0)}
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="font-extrabold text-xs text-slate-800 leading-none">{r.authorName} on {r.businessName}</span>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <div className="flex text-amber-400 gap-0.5 shrink-0">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`h-3 w-3 ${i < r.rating ? 'fill-current' : 'text-slate-200'}`} />
                                ))}
                              </div>
                              {r.status === 'flagged' && <span className="bg-red-50 border border-red-150 text-red-650 text-[7.5px] font-black uppercase px-1 py-0.5 rounded leading-none shrink-0 animate-pulse">SPAM FLAG</span>}
                            </div>
                            <p className="text-[11.5px] text-slate-500 font-semibold mt-2 max-w-2xl leading-relaxed">{r.text}</p>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleReviewAction(r._id, 'delete')}
                          className="h-10 w-10 rounded-xl bg-red-50 hover:bg-red-100 text-red-650 flex items-center justify-center shrink-0 shadow-2xs transition-colors cursor-pointer"
                          title="Purge Spam Review"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: TESTIMONIALS MODERATION */}
              {activeTab === 'Testimonials' && (
                <div className="flex flex-col gap-6 text-left">
                  <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6">
                    <h3 className="font-extrabold text-[#001c41] text-base font-sans leading-tight">Testimonials Moderation Desk</h3>
                    <span className="text-[10px] text-slate-450 font-semibold mt-0.5">Audit community thoughts, publish reviews to home slider, or delete feedback</span>
                  </div>

                  <div className="flex flex-col gap-4">
                    {testimonialsLoading ? (
                      <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                        <RefreshCw className="h-6 w-6 text-emerald-600 animate-spin" />
                        <span className="text-[10px] font-bold">Loading Testimonials...</span>
                      </div>
                    ) : (
                      <>
                        {[...appTestimonials]
                          .sort((a, b) => {
                            const weight = (status) => status === 'Pending' ? 0 : status === 'Approved' ? 1 : 2;
                            return weight(a.status) - weight(b.status) || new Date(b.createdAt) - new Date(a.createdAt);
                          })
                          .map(t => (
                            <div key={t._id} className="bg-white border border-slate-200 rounded-[20px] p-5 shadow-2xs flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-left">
                              <div className="flex items-start gap-4">
                                <div className="h-10 w-10 bg-emerald-50 rounded-full border border-emerald-100 flex items-center justify-center font-black text-[#027244] text-xs shrink-0 select-none uppercase font-sans">
                                  {(t.authorName || 'KA').slice(0, 2)}
                                </div>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2 flex-wrap font-sans">
                                    <span className="font-extrabold text-xs text-slate-800 leading-none">{t.authorName}</span>
                                    <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider">{t.role}</span>
                                    <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wide border ${
                                      t.status === 'Approved'
                                        ? 'bg-emerald-50 border-emerald-250 text-emerald-700'
                                        : t.status === 'Rejected'
                                          ? 'bg-red-50 border-red-200 text-red-650'
                                          : 'bg-amber-50 border-amber-250 text-amber-600 animate-pulse'
                                    }`}>
                                      {t.status}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center gap-1 mt-1.5 text-amber-400">
                                    {[...Array(5)].map((_, i) => (
                                      <Star key={i} className={`h-3 w-3 ${i < (t.rating || 5) ? 'fill-current' : 'text-slate-205'}`} />
                                    ))}
                                    <span className="text-[9.5px] text-slate-400 font-bold ml-2 font-sans">
                                      {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                                    </span>
                                  </div>

                                  <p className="text-[11.5px] text-slate-555 font-semibold mt-2 max-w-2xl leading-relaxed italic font-sans">
                                    "{t.text}"
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                {t.status !== 'Approved' && (
                                  <button 
                                    onClick={() => handleTestimonialStatus(t._id, 'Approved')}
                                    className="px-3.5 py-2 bg-[#027244] hover:bg-[#005934] text-white rounded-xl text-[10.5px] font-extrabold cursor-pointer transition-colors shadow shadow-emerald-800/10 font-sans"
                                  >
                                    Approve & Publish
                                  </button>
                                )}
                                {t.status !== 'Rejected' && (
                                  <button 
                                    onClick={() => handleTestimonialStatus(t._id, 'Rejected')}
                                    className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-650 rounded-xl text-[10.5px] font-extrabold cursor-pointer transition-colors font-sans"
                                  >
                                    Reject
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleTestimonialDelete(t._id)}
                                  className="h-8.5 w-8.5 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-650 flex items-center justify-center transition-colors cursor-pointer border border-slate-200"
                                >
                                  <Trash2 className="h-4.5 w-4.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        {appTestimonials.length === 0 && (
                          <div className="p-16 text-center text-slate-400 bg-white border border-slate-200 rounded-3xl">
                            No testimonials recorded.
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: SUBSCRIPTIONS */}
              {activeTab === 'Subscriptions' && (
                <div className="flex flex-col gap-8 text-left animate-fadeIn">
                  
                  {/* Statistics Widgets Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
                    <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl p-4.5 flex flex-col text-left">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Subscriptions</span>
                      <span className="text-xl font-black text-[#001c41] mt-1.5">{subscriptions.length} Records</span>
                    </div>
                    <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl p-4.5 flex flex-col text-left">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Plans</span>
                      <span className="text-xl font-black text-emerald-600 mt-1.5">
                        {subscriptions.filter(s => s.status === 'active').length} Active
                      </span>
                    </div>
                    <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl p-4.5 flex flex-col text-left">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-sans">Admin Revenue</span>
                      <span className="text-xl font-black text-[#001c41] mt-1.5">
                        ₹{payments.reduce((acc, p) => p.paymentStatus === 'Paid' || p.status === 'Paid' || p.status === 'captured' ? acc + p.amount : acc, 0)}
                      </span>
                    </div>
                    <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl p-4.5 flex flex-col text-left">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-sans">Points Discounted</span>
                      <span className="text-xl font-black text-orange-650 mt-1.5">
                        ₹{subscriptions.reduce((acc, s) => acc + (s.referralDiscount || 0), 0)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div className="flex flex-col">
                        <h3 className="font-extrabold text-[#001c41] text-base">Subscription Billings & Billing Audit</h3>
                        <span className="text-[10px] text-slate-450 font-semibold mt-0.5">Review active premium accounts, inspect transaction histories, or manually override validity</span>
                      </div>
                    </div>

                    {/* Navigation bar for sub-tabs */}
                    <div className="flex gap-4 border-b border-slate-200 pb-3 mt-5 overflow-x-auto whitespace-nowrap scrollbar-thin">
                      <button 
                        onClick={() => setSubscriptionTab('override')}
                        className={`pb-2 text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer border-b-2 px-1 border-solid whitespace-nowrap shrink-0 ${
                          subscriptionTab === 'override' 
                            ? 'border-[#027244] text-[#027244]' 
                            : 'border-transparent text-slate-400 hover:text-slate-650'
                        }`}
                      >
                        Business Licenses (Override)
                      </button>
                      <button 
                        onClick={() => setSubscriptionTab('subscriptions')}
                        className={`pb-2 text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer border-b-2 px-1 border-solid whitespace-nowrap shrink-0 ${
                          subscriptionTab === 'subscriptions' 
                            ? 'border-[#027244] text-[#027244]' 
                            : 'border-transparent text-slate-400 hover:text-slate-650'
                        }`}
                      >
                        Platform Subscriptions
                      </button>
                      <button 
                        onClick={() => setSubscriptionTab('payments')}
                        className={`pb-2 text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer border-b-2 px-1 border-solid whitespace-nowrap shrink-0 ${
                          subscriptionTab === 'payments' 
                            ? 'border-[#027244] text-[#027244]' 
                            : 'border-transparent text-slate-400 hover:text-slate-650'
                        }`}
                      >
                        Payment Transactions
                      </button>
                    </div>

                    <div className="mt-5">
                      {/* SUBTAB 1: OVERRIDE */}
                      {subscriptionTab === 'override' && (
                        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                          <table className="w-full text-left text-xs font-semibold text-slate-650">
                            <thead className="bg-slate-50 border-b border-slate-200 text-[9px] font-black text-slate-450 uppercase tracking-widest">
                              <tr>
                                <th className="p-4">Business Name</th>
                                <th className="p-4">Plan Type</th>
                                <th className="p-4">Price</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Expiry Date</th>
                                <th className="p-4">Days Unsubscribed</th>
                                <th className="p-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                              {businesses.map(b => {
                                const getDaysUnsubscribed = (biz) => {
                                  if (biz.subscriptionStatus === 'active') return 'N/A (Active)';
                                  const dateToCompare = biz.subscriptionExpiry ? new Date(biz.subscriptionExpiry) : new Date(biz.createdAt || Date.now());
                                  const diffDays = Math.floor((new Date() - dateToCompare) / (1000 * 60 * 60 * 24));
                                  if (diffDays <= 0) return '0 days';
                                  return `${diffDays} days${biz.subscriptionExpiry ? '' : ' (since registration)'}`;
                                };

                                return (
                                  <tr key={b._id} className="hover:bg-slate-50/50">
                                    <td className="p-4 flex items-center gap-3">
                                      <div className="h-9 w-9 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                                        <img src={b.coverImageUrl} className="h-full w-full object-cover" alt={b.name} />
                                      </div>
                                      <div className="flex flex-col text-left">
                                        <span className="font-extrabold text-slate-800 text-xs leading-none">{b.name}</span>
                                        <a 
                                          href={`/businesses/${b.slug || b._id}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[#027244] hover:text-[#005934] hover:underline font-black text-[10px] mt-1.5 flex items-center gap-1 w-fit cursor-pointer leading-none"
                                        >
                                          View Profile →
                                        </a>
                                      </div>
                                    </td>
                                    <td className="p-4">{b.subscriptionStatus === 'active' ? 'Premium Package' : 'Basic Tier'}</td>
                                    <td className="p-4 font-extrabold text-slate-800">
                                      {b.subscriptionStatus === 'active' ? '₹499 / Mon' : '₹0'}
                                    </td>
                                    <td className="p-4">
                                      <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide border ${
                                        b.subscriptionStatus === 'active' 
                                          ? 'bg-emerald-50 border-emerald-250 text-emerald-700' 
                                          : (b.subscriptionStatus === 'suspended' ? 'bg-rose-50 border-rose-250 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-400')
                                      }`}>
                                        {b.subscriptionStatus}
                                      </span>
                                    </td>
                                    <td className="p-4 font-bold text-slate-500">
                                      {b.subscriptionExpiry ? new Date(b.subscriptionExpiry).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="p-4 font-bold text-slate-550">
                                      {getDaysUnsubscribed(b)}
                                    </td>
                                    <td className="p-4 text-right">
                                      <div className="flex gap-2 justify-end">
                                        <a 
                                          href={`/businesses/${b.slug || b._id}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[9.5px] font-extrabold text-center leading-none shadow-xs flex items-center justify-center"
                                        >
                                          View Profile
                                        </a>
                                        {user?.role === 'superadmin' && (
                                          <button 
                                            onClick={() => handleManualSubscription(b._id)}
                                            disabled={b.subscriptionStatus === 'active'}
                                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[9.5px] rounded-lg cursor-pointer disabled:opacity-40 shadow-xs border-none"
                                          >
                                            Activate 30 Days
                                          </button>
                                        )}
                                        <button 
                                          onClick={() => handleSuspendSubscription(b._id)}
                                          className={`px-2.5 py-1.5 font-extrabold text-[9.5px] rounded-lg cursor-pointer shadow-xs border-none text-white ${
                                            b.subscriptionStatus === 'suspended' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-rose-600 hover:bg-rose-700'
                                          }`}
                                        >
                                          {b.subscriptionStatus === 'suspended' ? 'Reactivate' : 'Suspend'}
                                        </button>
                                        {b.subscriptionStatus !== 'active' && (
                                          <button 
                                            onClick={() => handleSendReminder(b._id)}
                                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[9.5px] rounded-lg cursor-pointer shadow-xs border-none"
                                          >
                                            Send Reminder
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* SUBTAB 2: SUBSCRIPTIONS LIST */}
                      {subscriptionTab === 'subscriptions' && (
                        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                          <table className="w-full text-left text-xs font-semibold text-slate-650">
                            <thead className="bg-slate-50 border-b border-slate-200 text-[9px] font-black text-slate-450 uppercase tracking-widest">
                              <tr>
                                <th className="p-4">Owner / Merchant</th>
                                <th className="p-4">Business</th>
                                <th className="p-4">Plan Name</th>
                                <th className="p-4">Amount Paid</th>
                                <th className="p-4">Discount Applied</th>
                                <th className="p-4">Validity Dates</th>
                                <th className="p-4">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                              {subscriptions.map(sub => {
                                const ownerName = sub.ownerId?.fullName || sub.ownerId?.name || 'Unknown';
                                const ownerEmail = sub.ownerId?.email || '';
                                const bizName = sub.businessId?.name || sub.businessId?.businessName || 'N/A';
                                const isActive = sub.status === 'active';
                                const isPending = sub.status === 'pending';
                                
                                return (
                                  <tr key={sub._id} className="hover:bg-slate-50/50">
                                    <td className="p-4 flex flex-col text-left">
                                      <span className="font-extrabold text-slate-800 text-xs sm:text-[13px]">{ownerName}</span>
                                      {ownerEmail && <span className="text-[10px] text-slate-400 font-semibold mt-0.5">{ownerEmail}</span>}
                                    </td>
                                    <td className="p-4 font-bold text-slate-700">{bizName}</td>
                                    <td className="p-4 uppercase text-[10px] font-extrabold text-slate-800">{sub.planName || sub.plan}</td>
                                    <td className="p-4 font-black text-slate-800">₹{sub.amountPaid || sub.amount}</td>
                                    <td className="p-4 text-emerald-600 font-extrabold">₹{sub.referralDiscount || 0}</td>
                                    <td className="p-4 font-bold text-slate-500">
                                      <div className="flex flex-col text-[10.5px]">
                                        <span>S: {sub.startDate ? new Date(sub.startDate).toLocaleDateString() : 'N/A'}</span>
                                        <span>E: {sub.expiryDate || sub.endDate ? new Date(sub.expiryDate || sub.endDate).toLocaleDateString() : 'N/A'}</span>
                                      </div>
                                    </td>
                                    <td className="p-4">
                                      <span className={`px-2.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wide border ${
                                        isActive 
                                          ? 'bg-emerald-50 border-emerald-250 text-emerald-700' 
                                          : isPending 
                                            ? 'bg-amber-50 border-amber-250 text-amber-600'
                                            : 'bg-rose-50 border-rose-250 text-rose-700'
                                      }`}>
                                        {sub.status}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                              {subscriptions.length === 0 && (
                                <tr>
                                  <td colSpan="7" className="p-8 text-center text-slate-400 text-xs font-bold leading-normal">
                                    No platform subscription records found.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* SUBTAB 3: PAYMENTS LIST */}
                      {subscriptionTab === 'payments' && (
                        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                          <table className="w-full text-left text-xs font-semibold text-slate-650">
                            <thead className="bg-slate-50 border-b border-slate-200 text-[9px] font-black text-slate-450 uppercase tracking-widest">
                              <tr>
                                <th className="p-4">Billing Date</th>
                                <th className="p-4">User / Merchant</th>
                                <th className="p-4">Business</th>
                                <th className="p-4">Order / Payment ID</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Method</th>
                                <th className="p-4">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                              {payments.map(pay => {
                                const userName = pay.userId?.fullName || pay.userId?.name || 'Unknown';
                                const userEmail = pay.userId?.email || '';
                                const bizName = pay.businessId?.name || pay.businessId?.businessName || (pay.eventId ? 'Event Posting Fee' : 'Platform Payment');
                                const isPaid = pay.paymentStatus === 'Paid' || pay.status === 'Paid' || pay.status === 'captured';
                                
                                return (
                                  <tr key={pay._id} className="hover:bg-slate-50/50">
                                    <td className="p-4 text-slate-500 font-bold font-sans">
                                      {pay.paymentDate ? new Date(pay.paymentDate).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="p-4 flex flex-col text-left">
                                      <span className="font-extrabold text-slate-800 text-xs sm:text-[13px]">{userName}</span>
                                      {userEmail && <span className="text-[10px] text-slate-400 font-semibold mt-0.5">{userEmail}</span>}
                                    </td>
                                    <td className="p-4">
                                      <div className="flex flex-col text-left">
                                        <span className="font-bold text-slate-700">{bizName}</span>
                                        {pay.eventId && <span className="text-[9px] text-[#027244] font-black uppercase">Event listing</span>}
                                      </div>
                                    </td>
                                    <td className="p-4 font-mono text-[10px] text-slate-500">
                                      <div className="flex flex-col gap-0.5">
                                        <span>O: {pay.orderId || pay.razorpayOrderId}</span>
                                        {pay.paymentId && <span>P: {pay.paymentId || pay.razorpayPaymentId}</span>}
                                      </div>
                                    </td>
                                    <td className="p-4 font-black text-slate-800">₹{pay.amount}</td>
                                    <td className="p-4 text-slate-650">{pay.paymentMethod || 'UPI'}</td>
                                    <td className="p-4">
                                      <span className={`px-2.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wide border ${
                                        isPaid 
                                          ? 'bg-emerald-50 border-emerald-250 text-emerald-700' 
                                          : 'bg-rose-50 border-rose-250 text-rose-700'
                                      }`}>
                                        {isPaid ? 'Paid' : 'Failed'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                              {payments.length === 0 && (
                                <tr>
                                  <td colSpan="7" className="p-8 text-center text-slate-400 text-xs font-bold leading-normal">
                                    No platform transaction records found.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: NOTIFICATIONS HUB */}
              {activeTab === 'Notifications' && (
                <div className="flex flex-col gap-6 text-left">
                  <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6">
                    <h3 className="font-extrabold text-[#001c41] text-base">Merchant Alerts & Notifications Broadcast</h3>
                    <span className="text-[10px] text-slate-450 font-semibold mt-0.5">Send alerts, announcements, maintenance alerts, or expiry warnings directly</span>
                  </div>

                  <div className="max-w-xl mx-auto w-full bg-white border border-slate-200 shadow-sm rounded-3xl p-6 md:p-8 flex flex-col gap-5">
                    <span className="font-extrabold text-sm text-slate-800 border-b border-slate-100 pb-2.5">Compose System Alert</span>
                    
                    {noticeSuccess && (
                      <div className="bg-emerald-50 border border-emerald-200 text-[#027244] rounded-xl p-3 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                        <span>System alert broadcast successfully to all active UBT merchants!</span>
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest">Alert Category</label>
                      <select 
                        value={newNotice.type}
                        onChange={(e) => setNewNotice({ ...newNotice, type: e.target.value })}
                        className="w-full border border-slate-200/70 p-3 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#027244] focus:ring-1 focus:ring-emerald-100 bg-slate-50/20 cursor-pointer animate-fadeIn"
                      >
                        <option value="announcement">Global Announcement</option>
                        <option value="maintenance">Maintenance Warning</option>
                        <option value="billing">Subscription Billing Reminder</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[9.5px] font-black text-slate-450 uppercase tracking-widest">Subject Title</label>
                      <input 
                        type="text"
                        placeholder="e.g. Scheduled System Upgrade Tonight"
                        value={newNotice.title}
                        onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                        className="w-full border border-slate-200/70 p-3 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50/20 focus:outline-none focus:border-[#027244]"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[9.5px] font-black text-slate-450 uppercase tracking-widest">Notification Body Message</label>
                      <textarea 
                        rows={4}
                        placeholder="Detail the announcement details inside town limits..."
                        value={newNotice.message}
                        onChange={(e) => setNewNotice({ ...newNotice, message: e.target.value })}
                        className="w-full border border-slate-200/70 p-3 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50/20 focus:outline-none focus:border-[#027244] resize-none leading-relaxed"
                      />
                    </div>

                    <button
                      onClick={handleBroadcast}
                      disabled={!newNotice.title || !newNotice.message}
                      className="py-3 px-6 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                    >
                      Broadcast Message
                    </button>
                  </div>
                </div>
              )}

              {/* TAB: QUERIES INBOX */}
              {activeTab === 'Queries' && (
                <div className="flex flex-col gap-6 text-left animate-fadeIn font-sans">
                  <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-col text-left font-sans">
                      <h3 className="font-extrabold text-[#001c41] text-base leading-tight">User Queries Inbox</h3>
                      <span className="text-[10px] text-slate-400 font-semibold mt-1">Vetting customer messages, support requests, and business badges enquiries</span>
                    </div>
                    {/* Tabs for query filter */}
                    <div className="bg-slate-100/60 p-1 rounded-xl flex items-center shrink-0 border border-slate-200/30 max-w-full overflow-x-auto whitespace-nowrap scrollbar-thin">
                      {['All', 'Pending', 'Replied'].map(status => (
                        <button
                          key={status}
                          onClick={() => setQueryFilter(status)}
                          className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                            queryFilter === status
                              ? 'bg-[#027244] text-white shadow-sm shadow-emerald-950/15'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {status} Messages
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Search and stats bar */}
                  <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 flex flex-col sm:flex-row gap-4 justify-between items-center font-sans">
                    <div className="w-full sm:max-w-md bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2">
                      <Search className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        placeholder="Search queries by name, email, subject..."
                        value={querySearch}
                        onChange={(e) => setQuerySearch(e.target.value)}
                        className="w-full bg-transparent text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-4.5 text-[10.5px] font-bold text-slate-500">
                      <span>Total: <b className="text-[#001c41] font-black">{queries.length}</b></span>
                      <span>Pending: <b className="text-amber-650 font-black">{queries.filter(q => q.status === 'Pending').length}</b></span>
                      <span>Replied: <b className="text-[#027244] font-black">{queries.filter(q => q.status === 'Replied').length}</b></span>
                    </div>
                  </div>

                  {/* Query cards list */}
                  <div className="flex flex-col gap-5">
                    {queries
                      .filter(q => {
                        if (queryFilter === 'Pending') return q.status === 'Pending';
                        if (queryFilter === 'Replied') return q.status === 'Replied';
                        return true;
                      })
                      .filter(q => {
                        const search = querySearch.toLowerCase();
                        return (
                          q.name.toLowerCase().includes(search) ||
                          q.email.toLowerCase().includes(search) ||
                          q.subject.toLowerCase().includes(search) ||
                          q.message.toLowerCase().includes(search)
                        );
                      })
                      .map((q) => {
                        const isPending = q.status === 'Pending';
                        return (
                          <div
                            key={q._id}
                            className="bg-white border border-slate-200 shadow-sm hover:shadow-lg rounded-3xl p-6 flex flex-col md:flex-row justify-between gap-6 transition-all animate-fadeIn"
                          >
                            <div className="flex-1 flex flex-col gap-3">
                              {/* Query header */}
                              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-3">
                                  <div className="h-9 w-9 bg-emerald-50 rounded-full border border-emerald-100 flex items-center justify-center font-black text-[#027244] text-xs font-sans shrink-0">
                                    {q.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex flex-col text-left">
                                    <span className="font-extrabold text-slate-800 text-xs sm:text-[13px] leading-tight">{q.name}</span>
                                    <span className="text-[10px] text-slate-400 font-semibold mt-1 block">{q.email}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-[10.5px] text-slate-400 font-semibold flex items-center gap-1 font-sans">
                                    <Clock className="h-3.5 w-3.5" />
                                    {new Date(q.createdAt).toLocaleString()}
                                  </span>
                                  <span className={`px-2.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wide border ${
                                    isPending
                                      ? 'bg-amber-50 border-amber-250 text-amber-600 animate-pulse'
                                      : 'bg-emerald-50 border-emerald-250 text-emerald-700'
                                  }`}>
                                    {q.status}
                                  </span>
                                </div>
                              </div>

                              {/* Query subject and message */}
                              <div className="text-left flex flex-col gap-1.5 font-sans">
                                <span className="font-extrabold text-[#001c41] text-[13px]">{q.subject}</span>
                                <p className="text-xs text-slate-505 font-semibold leading-relaxed mt-1 text-justify max-w-4xl">{q.message}</p>
                              </div>

                              {/* Reply content if Replied */}
                              {!isPending && q.replyMessage && (
                                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 text-left flex flex-col gap-2 mt-2 animate-fadeIn">
                                  <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                    <span>✓ Admin Response</span>
                                    <span>{q.repliedAt ? new Date(q.repliedAt).toLocaleString() : ''}</span>
                                  </div>
                                  <p className="text-xs text-slate-600 font-bold leading-relaxed">{q.replyMessage}</p>
                                </div>
                              )}
                            </div>

                            {/* Actions Column */}
                            <div className="flex md:flex-col justify-end md:justify-center gap-2 border-t md:border-t-0 md:border-l border-slate-200/50 pt-4 md:pt-0 md:pl-5 shrink-0 md:w-36 font-sans">
                              {isPending ? (
                                <button
                                  onClick={() => { setSelectedQuery(q); setShowReplyModal(true); }}
                                  className="w-full py-2 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                                >
                                  <Mail className="h-3.5 w-3.5" />
                                  <span>Send Reply</span>
                                </button>
                              ) : (
                                <span className="w-full py-2 bg-slate-100 text-slate-400 border border-slate-200 font-extrabold text-[10px] rounded-xl flex items-center justify-center select-none text-center leading-none">
                                  Replied Vetted
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                    {queries.filter(q => {
                      if (queryFilter === 'Pending') return q.status === 'Pending';
                      if (queryFilter === 'Replied') return q.status === 'Replied';
                      return true;
                    }).length === 0 && (
                      <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center text-slate-400 flex flex-col items-center gap-3">
                        <CheckCircle2 className="h-10 w-10 text-emerald-600 animate-bounce" />
                        <span className="text-sm font-bold text-slate-800 font-sans">No Messages!</span>
                        <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-xs">There are no queries matching your filter options at this time.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB: PARTNERS PORTAL MODERATION */}
              {/* ========================================================================= */}
              {activeTab === 'Partners' && (
                <div className="flex flex-col gap-6 text-left animate-fadeIn font-sans text-slate-800">
                  
                  {/* Header Dashboard Banner */}
                  <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-col text-left font-sans">
                      <h3 className="font-extrabold text-[#001c41] text-base leading-tight">Partners Portal Control Desk</h3>
                      <span className="text-[10px] text-slate-400 font-semibold mt-1">Monitor registered platform partners, audit points reward balances, and arrange payout refunds.</span>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex items-center gap-4 text-xs font-semibold shrink-0">
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-2 text-left">
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block leading-none">Total Partners</span>
                        <span className="text-sm font-black text-[#027244] mt-1.5 block leading-none">{partners.length}</span>
                      </div>
                      <div className="bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-2 text-left">
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block leading-none">Pending Redemptions</span>
                        <span className="text-sm font-black text-amber-600 mt-1.5 block leading-none">
                          {redemptions.filter(r => r.status === 'Pending Approval').length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Search and Filters */}
                  <div className="bg-white border border-slate-200 shadow-sm rounded-[24px] p-5 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="w-full sm:max-w-md border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2 flex items-center gap-2">
                      <Search className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        placeholder="Search partners by name or email..."
                        value={referralSearch}
                        onChange={(e) => setReferralSearch(e.target.value)}
                        className="w-full bg-transparent border-none text-xs font-semibold text-slate-700 focus:outline-none"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      {[
                        { id: 'partners_list', label: 'Partners Directory' },
                        { id: 'approvals_list', label: 'Pending Approvals' },
                        { id: 'rejected_list', label: 'Rejected Partners' },
                        { id: 'queue', label: 'Points Redemption Queue' }
                      ].map(subTab => (
                        <button
                          key={subTab.id}
                          onClick={() => setReferralSubTab(subTab.id)}
                          className={`px-4.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center ${
                            referralSubTab === subTab.id
                              ? 'bg-[#027244] text-white shadow-xs'
                              : 'text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          {subTab.label}
                          {subTab.id === 'approvals_list' && partners.filter(p => p.isPartnerRegistered && !p.isPartnerApproved).length > 0 && (
                            <span className="bg-amber-500 text-white rounded-full px-1.5 py-0.5 text-[8px] font-black ml-1.5 leading-none">
                              {partners.filter(p => p.isPartnerRegistered && !p.isPartnerApproved).length}
                            </span>
                          )}
                          {subTab.id === 'queue' && redemptions.filter(r => r.status === 'Pending Approval').length > 0 && (
                            <span className="bg-emerald-600 text-white rounded-full px-1.5 py-0.5 text-[8px] font-black ml-1.5 leading-none">
                              {redemptions.filter(r => r.status === 'Pending Approval').length}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Partners Directory Sub-tab */}
                  {referralSubTab === 'partners_list' && (
                    <div className="bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden">
                      {/* Filter group */}
                      <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-2">Filter By Status:</span>
                          {['All', 'Approved', 'Rejected'].map((status) => (
                            <button
                              key={status}
                              onClick={() => setPartnerStatusFilter(status)}
                              className={`px-3.5 py-1 rounded-full text-[10px] font-black cursor-pointer transition-all ${
                                partnerStatusFilter === status
                                  ? 'bg-[#027244] text-white shadow-xs'
                                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-xs font-semibold text-slate-600">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                              <th className="py-3.5 px-6">Partner Identity</th>
                              <th className="py-3.5 px-4">Contact Info</th>
                              <th className="py-3.5 px-4">Aadhaar Card</th>
                              <th className="py-3.5 px-4">Referral Link</th>
                              <th className="py-3.5 px-4">Rewards Balance</th>
                              <th className="py-3.5 px-4 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {partnersLoading ? (
                              <tr>
                                <td colSpan={6} className="py-12 text-center text-slate-400">
                                  <RefreshCw className="h-6 w-6 animate-spin text-emerald-600 mx-auto" />
                                  <span className="block mt-2 font-bold text-xs">Loading partners...</span>
                                </td>
                              </tr>
                            ) : partners
                              .filter(p => {
                                if (partnerStatusFilter === 'Approved') return p.isPartnerApproved;
                                if (partnerStatusFilter === 'Rejected') return p.partnerStatus === 'rejected';
                                return true;
                              })
                              .filter(p => 
                                (p.fullName || '').toLowerCase().includes(referralSearch.toLowerCase()) ||
                                (p.email || '').toLowerCase().includes(referralSearch.toLowerCase()) ||
                                (p.referralCode || '').toLowerCase().includes(referralSearch.toLowerCase())
                              ).length === 0 ? (
                              <tr>
                                <td colSpan={6} className="py-16 text-center text-slate-400">
                                  No registered platform partners found matching your search.
                                </td>
                              </tr>
                            ) : (
                              partners
                                .filter(p => {
                                  if (partnerStatusFilter === 'Approved') return p.isPartnerApproved;
                                  if (partnerStatusFilter === 'Rejected') return p.partnerStatus === 'rejected';
                                  return true;
                                })
                                .filter(p => 
                                  (p.fullName || '').toLowerCase().includes(referralSearch.toLowerCase()) ||
                                  (p.email || '').toLowerCase().includes(referralSearch.toLowerCase()) ||
                                  (p.referralCode || '').toLowerCase().includes(referralSearch.toLowerCase())
                                )
                                .map((partner) => (
                                  <tr key={partner._id} onClick={() => handleViewPartner(partner)} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                                    <td className="py-4 px-6 flex items-center gap-3">
                                      <div className="h-9 w-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center font-extrabold text-[#027244] uppercase select-none text-[12px] shrink-0">
                                        {(partner.fullName || partner.name || 'P').charAt(0)}
                                      </div>
                                      <div className="flex flex-col text-left">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="font-extrabold text-slate-800 text-xs leading-none">
                                            {partner.fullName || partner.name}
                                          </span>
                                          {!partner.isPartnerRegistered ? (
                                            <span className="bg-slate-100 border border-slate-200 text-slate-655 px-1.5 py-0.2 rounded text-[7.5px] font-black uppercase">
                                              Draft
                                            </span>
                                          ) : partner.isPartnerApproved ? (
                                            <span className="bg-emerald-50 border border-emerald-205 text-emerald-705 px-1.5 py-0.2 rounded text-[7.5px] font-black uppercase">
                                              Approved
                                            </span>
                                          ) : partner.partnerStatus === 'rejected' ? (
                                            <span className="bg-red-50 border border-red-200 text-red-700 px-1.5 py-0.2 rounded text-[7.5px] font-black uppercase">
                                              Rejected
                                            </span>
                                          ) : (
                                            <span className="bg-amber-50 border border-amber-200 text-amber-705 px-1.5 py-0.2 rounded text-[7.5px] font-black uppercase animate-pulse">
                                              Pending
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-[9.5px] text-slate-400 mt-1 block font-medium">
                                          Joined UBT on {partner.createdAt ? new Date(partner.createdAt).toLocaleDateString() : 'N/A'}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-4 px-4 text-left leading-relaxed">
                                      <div className="text-slate-700 text-xs leading-none">{partner.email}</div>
                                      <div className="text-slate-405 text-[10px] mt-1">{partner.phone || partner.mobileNumber || 'No Phone'}</div>
                                    </td>
                                    <td className="py-4 px-4 text-left">
                                      <div className="text-slate-800 font-extrabold leading-none">{partner.aadhaarNumber || 'Not Onboarded'}</div>
                                      <div className="text-slate-400 text-[9.5px] mt-1 truncate max-w-[180px] font-semibold" title={partner.address}>
                                        {partner.address || 'Address pending'}
                                      </div>
                                    </td>
                                    <td className="py-4 px-4 text-left">
                                      {partner.referralCode ? (
                                        <button
                                          onClick={() => {
                                            const link = `${window.location.origin}/register?ref=${partner.referralCode}`;
                                            navigator.clipboard.writeText(link);
                                            alert('Referral link copied to clipboard!');
                                          }}
                                          className="bg-emerald-50 hover:bg-emerald-100 text-[#027244] border border-emerald-200 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                          title="Copy Referral Link"
                                        >
                                          <Copy className="h-3 w-3" />
                                          <span>Copy Link</span>
                                        </button>
                                      ) : (
                                        <span className="text-[10px] text-slate-400 font-semibold">No Link</span>
                                      )}
                                    </td>
                                    <td className="py-4 px-4 text-left font-sans">
                                      <span className="text-xs font-black text-[#027244]">{partner.referralPoints || 0} Points</span>
                                      <span className="text-[9.5px] text-slate-400 block mt-0.5">₹{partner.referralPoints || 0} Value</span>
                                    </td>
                                    <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex flex-col items-center justify-center gap-1.5">
                                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                                          {partner.isPartnerApproved || partner.partnerStatus === 'approved' ? (
                                            <span className="px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 select-none">
                                              Approved
                                            </span>
                                          ) : (
                                            <button
                                              onClick={() => handlePartnerAction(partner._id, 'approve')}
                                              className="px-2 py-1 bg-[#027244] hover:bg-[#005934] text-white font-black text-[9px] rounded-lg cursor-pointer transition-colors shadow-2xs"
                                            >
                                              Approve
                                            </button>
                                          )}

                                          {partner.partnerStatus === 'rejected' ? (
                                            <span className="px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 select-none">
                                              Rejected
                                            </span>
                                          ) : (
                                            <button
                                              onClick={() => handlePartnerAction(partner._id, 'reject')}
                                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-black text-[9px] rounded-lg cursor-pointer transition-colors"
                                            >
                                              Reject
                                            </button>
                                          )}

                                          <button
                                            onClick={() => handleDeletePartner(partner._id)}
                                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-black text-[9px] rounded-lg cursor-pointer transition-colors"
                                          >
                                            Delete
                                          </button>
                                        </div>
                                        {partner.partnerStatus === 'rejected' && partner.partnerRejectionReason && (
                                          <div className="text-[10px] text-red-500 font-bold mt-1 text-center bg-red-50/50 border border-red-100 rounded-lg p-1.5 max-w-[150px] truncate" title={partner.partnerRejectionReason}>
                                            Reason: {partner.partnerRejectionReason}
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Pending Approvals Sub-tab */}
                  {referralSubTab === 'approvals_list' && (
                    <div className="bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-xs font-semibold text-slate-600">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                              <th className="py-3.5 px-6">Partner Identity</th>
                              <th className="py-3.5 px-4">Contact Details</th>
                              <th className="py-3.5 px-4">Aadhaar Number</th>
                              <th className="py-3.5 px-4">Address</th>
                              <th className="py-3.5 px-4">Submitted Time</th>
                              <th className="py-3.5 px-4 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {partnersLoading ? (
                              <tr>
                                <td colSpan={6} className="py-12 text-center text-slate-400">
                                  <RefreshCw className="h-6 w-6 animate-spin text-emerald-600 mx-auto" />
                                  <span className="block mt-2 font-bold text-xs">Loading pending partners...</span>
                                </td>
                              </tr>
                            ) : partners.filter(p => p.isPartnerRegistered && !p.isPartnerApproved).length === 0 ? (
                              <tr>
                                <td colSpan={6} className="py-16 text-center text-slate-400 font-sans font-bold">
                                  No pending partner registrations awaiting approval.
                                </td>
                              </tr>
                            ) : (
                              partners
                                .filter(p => p.isPartnerRegistered && !p.isPartnerApproved)
                                .filter(p => 
                                  (p.fullName || '').toLowerCase().includes(referralSearch.toLowerCase()) ||
                                  (p.email || '').toLowerCase().includes(referralSearch.toLowerCase()) ||
                                  (p.referralCode || '').toLowerCase().includes(referralSearch.toLowerCase())
                                )
                                .map((partner) => (
                                  <tr key={partner._id} onClick={(e) => { if (!e.target.closest('button')) handleViewPartner(partner); }} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                                    <td className="py-4 px-6 flex items-center gap-3">
                                      <div className="h-9 w-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center font-extrabold text-[#027244] uppercase select-none text-[12px]">
                                        {(partner.fullName || partner.name || 'P').charAt(0)}
                                      </div>
                                      <div className="flex flex-col text-left">
                                        <span className="font-extrabold text-slate-800 text-xs leading-none">
                                          {partner.fullName || partner.name}
                                        </span>
                                        <span className="text-[9.5px] text-slate-400 mt-1 block font-medium">
                                          Joined UBT on {partner.createdAt ? new Date(partner.createdAt).toLocaleDateString() : 'N/A'}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-4 px-4 text-left leading-relaxed">
                                      <div className="text-slate-700 text-xs leading-none">{partner.email}</div>
                                      <div className="text-slate-405 text-[10px] mt-1">{partner.phone || partner.mobileNumber || 'No Phone'}</div>
                                    </td>
                                    <td className="py-4 px-4 text-left">
                                      <div className="text-slate-800 font-extrabold leading-none">{partner.aadhaarNumber || 'N/A'}</div>
                                    </td>
                                    <td className="py-4 px-4 text-left">
                                      <div className="text-slate-400 text-[9.5px] truncate max-w-[180px] font-semibold" title={partner.address}>
                                        {partner.address || 'Address pending'}
                                      </div>
                                    </td>
                                    <td className="py-4 px-4 text-left font-medium text-slate-400">
                                      {partner.updatedAt || partner.createdAt ? new Date(partner.updatedAt || partner.createdAt).toLocaleString() : 'N/A'}
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                      <div className="flex items-center justify-center gap-2">
                                        <button
                                          onClick={() => handlePartnerAction(partner._id, 'reject')}
                                          className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-650 font-extrabold text-[10px] rounded-lg cursor-pointer transition-colors"
                                        >
                                          Reject
                                        </button>
                                        <button
                                          onClick={() => handlePartnerAction(partner._id, 'approve')}
                                          className="px-3 py-1.5 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-[10px] rounded-lg cursor-pointer shadow-xs transition-colors"
                                        >
                                          Approve
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Rejected Partners Sub-tab */}
                  {referralSubTab === 'rejected_list' && (
                    <div className="bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-xs font-semibold text-slate-600">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                              <th className="py-3.5 px-6">Partner Identity</th>
                              <th className="py-3.5 px-4">Contact Details</th>
                              <th className="py-3.5 px-4">Aadhaar Number</th>
                              <th className="py-3.5 px-4">Address</th>
                              <th className="py-3.5 px-4">Rejection Time</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {partnersLoading ? (
                              <tr>
                                <td colSpan={5} className="py-12 text-center text-slate-400">
                                  <RefreshCw className="h-6 w-6 animate-spin text-emerald-600 mx-auto" />
                                  <span className="block mt-2 font-bold text-xs">Loading rejected partners...</span>
                                </td>
                              </tr>
                            ) : partners.filter(p => p.partnerStatus === 'rejected').length === 0 ? (
                              <tr>
                                <td colSpan={5} className="py-16 text-center text-slate-400 font-sans font-bold">
                                  No rejected partner registrations found.
                                </td>
                              </tr>
                            ) : (
                              partners
                                .filter(p => p.partnerStatus === 'rejected')
                                .filter(p => 
                                  (p.fullName || '').toLowerCase().includes(referralSearch.toLowerCase()) ||
                                  (p.email || '').toLowerCase().includes(referralSearch.toLowerCase()) ||
                                  (p.referralCode || '').toLowerCase().includes(referralSearch.toLowerCase())
                                )
                                .map((partner) => (
                                  <tr key={partner._id} onClick={() => handleViewPartner(partner)} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                                    <td className="py-4 px-6 flex items-center gap-3">
                                      <div className="h-9 w-9 rounded-full bg-red-50 border border-red-100 flex items-center justify-center font-extrabold text-red-655 uppercase select-none text-[12px]">
                                        {(partner.fullName || partner.name || 'P').charAt(0)}
                                      </div>
                                      <div className="flex flex-col text-left">
                                        <span className="font-extrabold text-slate-850 text-xs leading-none">
                                          {partner.fullName || partner.name}
                                        </span>
                                        <span className="text-[9.5px] text-slate-400 mt-1 block font-medium">
                                          Joined UBT on {partner.createdAt ? new Date(partner.createdAt).toLocaleDateString() : 'N/A'}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-4 px-4 text-left leading-relaxed">
                                      <div className="text-slate-700 text-xs leading-none">{partner.email}</div>
                                      <div className="text-slate-405 text-[10px] mt-1">{partner.phone || partner.mobileNumber || 'No Phone'}</div>
                                    </td>
                                    <td className="py-4 px-4 text-left">
                                      <div className="text-slate-800 font-extrabold leading-none">{partner.aadhaarNumber || 'N/A'}</div>
                                    </td>
                                    <td className="py-4 px-4 text-left">
                                      <div className="text-slate-400 text-[9.5px] truncate max-w-[180px] font-semibold" title={partner.address}>
                                        {partner.address || 'Address pending'}
                                      </div>
                                    </td>
                                    <td className="py-4 px-4 text-left font-medium text-red-600">
                                      {partner.partnerRejectedAt ? new Date(partner.partnerRejectedAt).toLocaleString() : (partner.updatedAt ? new Date(partner.updatedAt).toLocaleString() : 'N/A')}
                                    </td>
                                  </tr>
                                ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Points Redemption Queue Sub-tab */}
                  {referralSubTab === 'queue' && (
                    <div className="bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden flex flex-col gap-2">
                      <div className="flex items-center gap-2 mb-2 px-6 pt-5">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider mr-2">Filter status:</span>
                        {['All', 'Pending', 'Processed'].map(f => (
                          <button
                            key={f}
                            onClick={() => setRedemptionStatusFilter(f)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-all border ${
                              redemptionStatusFilter === f
                                ? 'bg-slate-855 text-white border-slate-855 shadow-2xs'
                                : 'bg-slate-50 text-slate-550 border-slate-205 hover:bg-slate-100'
                            }`}
                          >
                            {f} ({
                              f === 'Pending' 
                                ? redemptions.filter(r => r.status === 'Pending Approval').length 
                                : f === 'Processed' 
                                  ? redemptions.filter(r => r.status === 'Refunded' || r.status === 'Rejected').length 
                                  : redemptions.length
                            })
                          </button>
                        ))}
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-xs font-semibold text-slate-600">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                              <th className="py-3.5 px-6">Partner Details</th>
                              <th className="py-3.5 px-4">Requested Points</th>
                              <th className="py-3.5 px-4">Cash Payout</th>
                              <th className="py-3.5 px-4">Remarks History</th>
                              <th className="py-3.5 px-4">Request Date</th>
                              <th className="py-3.5 px-4 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {redemptionsLoading ? (
                              <tr>
                                <td colSpan={6} className="py-12 text-center text-slate-400">
                                  <RefreshCw className="h-6 w-6 animate-spin text-emerald-600 mx-auto" />
                                  <span className="block mt-2 font-bold text-xs">Loading payout requests...</span>
                                </td>
                              </tr>
                            ) : redemptions.filter(r => {
                              if (redemptionStatusFilter === 'Pending') return r.status === 'Pending Approval';
                              if (redemptionStatusFilter === 'Processed') return r.status === 'Refunded' || r.status === 'Rejected';
                              return true;
                            }).length === 0 ? (
                              <tr>
                                <td colSpan={6} className="py-16 text-center text-slate-400 font-bold">
                                  No matching redemption requests found.
                                </td>
                              </tr>
                            ) : (
                              redemptions
                                .filter(r => {
                                  if (redemptionStatusFilter === 'Pending') return r.status === 'Pending Approval';
                                  if (redemptionStatusFilter === 'Processed') return r.status === 'Refunded' || r.status === 'Rejected';
                                  return true;
                                })
                                .filter(r => 
                                  (r.userId?.fullName || '').toLowerCase().includes(referralSearch.toLowerCase()) ||
                                  (r.userId?.email || '').toLowerCase().includes(referralSearch.toLowerCase())
                                )
                                .map((req) => (
                                  <tr key={req._id} onClick={(e) => {
                                    if (!e.target.closest('button')) {
                                      const partner = partners.find(p => p._id === (req.userId?._id || req.userId));
                                      if (partner) handleViewPartner(partner);
                                    }
                                  }} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                                    <td className="py-4 px-6 text-left leading-relaxed">
                                      <div className="font-extrabold text-slate-800 text-xs">{req.userId?.fullName || req.userId?.name || 'Partner Account'}</div>
                                      <div className="text-slate-405 text-[10px]">{req.userId?.email || 'No email'} • {req.userId?.phone || req.userId?.mobileNumber || 'No Phone'}</div>
                                    </td>
                                    <td className="py-4 px-4 text-left font-sans">
                                      <span className="text-xs font-black text-slate-700">{req.points} Points</span>
                                    </td>
                                    <td className="py-4 px-4 text-left font-sans">
                                      <span className="text-xs font-black text-[#027244]">₹{req.points} Cashback</span>
                                    </td>
                                    <td className="py-4 px-4 text-left">
                                      <div className="text-xs font-semibold text-slate-600 leading-normal max-w-xs truncate" title={req.remarks}>
                                        {req.remarks || <span className="text-slate-400 italic">No notes added</span>}
                                      </div>
                                      <div className="text-[9.5px] text-slate-400 mt-1 block">
                                        Status: <span className={`font-black ${req.status === 'Refunded' ? 'text-emerald-600' : req.status === 'Rejected' ? 'text-rose-600' : 'text-amber-600'}`}>{req.status}</span>
                                      </div>
                                    </td>
                                    <td className="py-4 px-4 text-left font-medium text-slate-405">
                                      {new Date(req.createdAt).toLocaleString()}
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                      {req.status === 'Pending Approval' ? (
                                        <div className="flex items-center justify-center gap-1.5">
                                          <button
                                            onClick={() => {
                                              const remarks = prompt('Enter payout transaction details / remarks for the partner:');
                                              if (remarks !== null) {
                                                handleRedemptionRefund(req._id, remarks);
                                              }
                                            }}
                                            className="bg-emerald-650 hover:bg-emerald-600 text-white font-extrabold text-[10px] py-1.5 px-3 rounded-lg cursor-pointer transition-all shadow-xs"
                                          >
                                            Arrange Refund
                                          </button>
                                          <button
                                            onClick={() => {
                                              const remarks = prompt('Enter rejection reason remarks for the partner:');
                                              if (remarks !== null && remarks.trim()) {
                                                handleRedemptionReject(req._id, remarks);
                                              }
                                            }}
                                            className="bg-rose-650 hover:bg-rose-600 text-white font-extrabold text-[10px] py-1.5 px-3 rounded-lg cursor-pointer transition-all shadow-xs"
                                          >
                                            Reject
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="text-slate-400 font-bold text-[10.5px]">Processed</span>
                                      )}
                                    </td>
                                  </tr>
                                ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* TAB: REFERRAL MODERATION */}
              {activeTab === 'Referral Moderation' && (
                <div className="flex flex-col gap-6 text-left animate-fadeIn font-sans">
                  {/* Header Dashboard Banner */}
                  <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-col text-left font-sans">
                      <h3 className="font-extrabold text-[#001c41] text-base leading-tight">Referrals & Refunds Control Desk</h3>
                      <span className="text-[10px] text-slate-400 font-semibold mt-1">Review referral credits request logs, verify anti-fraud flags, manage points, and process cashback refunds.</span>
                    </div>

                    {/* Sub-tab navigation */}
                    <div className="w-full sm:w-auto bg-slate-100/60 p-1 rounded-xl flex items-center shrink-0 border border-slate-200/30 overflow-x-auto whitespace-nowrap scrollbar-thin">
                      {[
                        { id: 'queue', label: 'Referrals Queue' },
                        { id: 'refunds', label: 'Cashback Refunds' },
                        { id: 'points', label: 'Business Points' }
                      ].map(sub => (
                        <button
                          key={sub.id}
                          onClick={() => setReferralSubTab(sub.id)}
                          className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                            referralSubTab === sub.id
                              ? 'bg-[#027244] text-white shadow-sm shadow-emerald-950/15'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {referralSubTab === 'queue' && (
                    <>
                      {/* Filter controls */}
                      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-extrabold text-slate-700">Filter Referrals</span>
                        </div>
                        <div className="w-full sm:w-auto bg-slate-100/60 p-1 rounded-xl flex items-center shrink-0 border border-slate-200/30 overflow-x-auto whitespace-nowrap scrollbar-thin">
                          {['All', 'Pending', 'Completed', 'Rejected'].map(status => (
                            <button
                              key={status}
                              onClick={() => setReferralFilter(status)}
                              className={`px-3 py-1.5 rounded-lg text-[10.5px] font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                                referralFilter === status
                                  ? 'bg-[#027244] text-white shadow-sm'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              {status === 'All' ? 'All Referrals' : `${status}`}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Summary Metric Stats cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 font-sans">
                        <div className="bg-white border border-slate-200 rounded-[20px] p-5 shadow-2xs text-left flex flex-col gap-1.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Total Referrals</span>
                          <span className="text-2xl font-black text-[#001c41]">{referrals.length}</span>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-[20px] p-5 shadow-2xs text-left flex flex-col gap-1.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Pending Review</span>
                          <span className="text-2xl font-black text-amber-600">{referrals.filter(r => r.status === 'pending').length}</span>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-[20px] p-5 shadow-2xs text-left flex flex-col gap-1.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Completed</span>
                          <span className="text-2xl font-black text-emerald-655">{referrals.filter(r => r.status === 'completed').length}</span>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-[20px] p-5 shadow-2xs text-left flex flex-col gap-1.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Rejected / Flagged</span>
                          <span className="text-2xl font-black text-rose-650">{referrals.filter(r => r.status === 'rejected').length}</span>
                        </div>
                      </div>

                      {/* Search bar */}
                      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 flex flex-col sm:flex-row gap-4 justify-between items-center font-sans">
                        <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2">
                          <Search className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                          <input
                            type="text"
                            placeholder="Search by Referrer or Referred Merchant name/email..."
                            value={referralSearch}
                            onChange={(e) => setReferralSearch(e.target.value)}
                            className="w-full bg-transparent text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Referrals Moderation List Table */}
                      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden font-sans">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-black text-slate-450 uppercase tracking-wider text-left">
                                <th className="px-6 py-4">Referrer (Invited By)</th>
                                <th className="px-6 py-4">Referred User</th>
                                <th className="px-6 py-4">Referred Business</th>
                                <th className="px-6 py-4">Anti-Fraud Validation</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs text-slate-655 font-semibold">
                              {referralsLoading ? (
                                <tr>
                                  <td colSpan="6" className="text-center py-12 text-slate-400 font-semibold">
                                    Loading referrals registry...
                                  </td>
                                </tr>
                              ) : referrals
                                .filter(r => {
                                  if (referralFilter === 'Pending') return r.status === 'pending';
                                  if (referralFilter === 'Completed') return r.status === 'completed';
                                  if (referralFilter === 'Rejected') return r.status === 'rejected';
                                  return true;
                                })
                                .filter(r => {
                                  const s = referralSearch.toLowerCase();
                                  const referrerName = r.referrerId?.fullName || r.referrerId?.name || '';
                                  const referrerEmail = r.referrerId?.email || '';
                                  const referredName = r.referredUserId?.fullName || r.referredUserId?.name || '';
                                  const referredEmail = r.referredUserId?.email || '';
                                  const bizName = r.referredBusinessId?.name || '';
                                  return (
                                    referrerName.toLowerCase().includes(s) ||
                                    referrerEmail.toLowerCase().includes(s) ||
                                    referredName.toLowerCase().includes(s) ||
                                    referredEmail.toLowerCase().includes(s) ||
                                    bizName.toLowerCase().includes(s)
                                  );
                                })
                                .map(r => {
                                  const checks = r.antiFraudChecks || {};
                                  const hasFlags = checks.selfReferral || checks.duplicateMobile || checks.duplicateGST || checks.duplicateBusiness;
                                  return (
                                    <tr key={r._id} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="px-6 py-4">
                                        <div className="flex flex-col text-left">
                                          <span className="font-extrabold text-slate-800">{r.referrerId?.fullName || 'UBT Member'}</span>
                                          <span className="text-[10px] text-slate-400 mt-0.5">{r.referrerId?.email || 'N/A'}</span>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4">
                                        <div className="flex flex-col text-left">
                                          <span className="font-extrabold text-slate-800">{r.referredUserId?.fullName || 'New Merchant'}</span>
                                          <span className="text-[10px] text-slate-400 mt-0.5">{r.referredUserId?.email || 'N/A'}</span>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4">
                                        <div className="flex flex-col text-left">
                                          <span className="font-extrabold text-slate-800">{r.referredBusinessId?.name || 'No business listed yet'}</span>
                                          {r.referredBusinessId?.gstNumber && (
                                            <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">GST: {r.referredBusinessId.gstNumber}</span>
                                          )}
                                          {r.referredBusinessId && (
                                            <div className="flex items-center gap-1.5 mt-1">
                                              <span className={`text-[8.5px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                                r.referredBusinessId.status === 'Approved'
                                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                  : 'bg-amber-50 text-amber-700 border border-amber-100'
                                              }`}>
                                                {r.referredBusinessId.status}
                                              </span>
                                              <span className={`text-[8.5px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                                r.referredBusinessId.subscriptionStatus === 'active'
                                                  ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                                  : 'bg-slate-50 text-slate-550 border border-slate-100'
                                              }`}>
                                                {r.referredBusinessId.subscriptionStatus === 'active' ? 'Subscribed' : 'No Sub'}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                                          {checks.selfReferral && <span className="bg-rose-50 text-rose-655 border border-rose-100 text-[8.5px] font-extrabold px-1.5 py-0.5 rounded uppercase">Self Referral</span>}
                                          {checks.duplicateMobile && <span className="bg-amber-50 text-amber-655 border border-amber-100 text-[8.5px] font-extrabold px-1.5 py-0.5 rounded uppercase">Dup Phone</span>}
                                          {checks.duplicateGST && <span className="bg-red-50 text-red-650 border border-red-100 text-[8.5px] font-extrabold px-1.5 py-0.5 rounded uppercase">Dup GST</span>}
                                          {checks.duplicateBusiness && <span className="bg-orange-50 text-orange-655 border border-orange-100 text-[8.5px] font-extrabold px-1.5 py-0.5 rounded uppercase">Dup Name</span>}
                                          {!hasFlags && <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[8.5px] font-extrabold px-1.5 py-0.5 rounded uppercase">Passed</span>}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[9.5px] font-black uppercase ${
                                          r.status === 'completed'
                                            ? 'bg-emerald-50 text-[#027244] border border-emerald-150'
                                            : r.status === 'rejected'
                                              ? 'bg-rose-50 text-rose-655 border border-rose-150'
                                              : 'bg-amber-50 text-amber-655 border border-amber-150'
                                        }`}>
                                          {r.status === 'completed' ? 'Approved' : r.status}
                                        </span>
                                        {r.rejectionReason && (
                                          <p className="text-[9px] text-rose-600 mt-1 max-w-[120px] truncate" title={r.rejectionReason}>
                                            Reason: {r.rejectionReason}
                                          </p>
                                        )}
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                          {r.status !== 'completed' && (
                                            <button
                                              onClick={() => {
                                                if (confirm('Manually approve this referral and credit 100 points to the referrer?')) {
                                                  handleReferralModerate(r._id, 'approve');
                                                }
                                              }}
                                              className="px-2.5 py-1.5 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-[10px] rounded-lg cursor-pointer transition-colors shadow-2xs"
                                            >
                                              Approve
                                            </button>
                                          )}
                                          {r.status !== 'rejected' && (
                                            <button
                                              onClick={() => {
                                                const reason = prompt('Please enter a rejection reason (optional):');
                                                if (reason !== null) {
                                                  handleReferralModerate(r._id, 'reject', reason);
                                                }
                                              }}
                                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-655 font-extrabold text-[10px] rounded-lg cursor-pointer transition-colors"
                                            >
                                              Reject
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              {!referralsLoading && referrals.length === 0 && (
                                <tr>
                                  <td colSpan="6" className="text-center py-16 text-slate-400">
                                    <div className="flex flex-col items-center gap-2">
                                      <Gift className="h-8 w-8 text-slate-300" />
                                      <span className="text-xs font-bold text-slate-700">No Referrals Recorded</span>
                                      <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs font-semibold">No referrals have been recorded or submitted on the platform yet.</p>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}

                  {referralSubTab === 'refunds' && (
                    <>
                      {/* Metric cards */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 font-sans">
                        <div className="bg-white border border-slate-200 rounded-[20px] p-5 shadow-2xs text-left flex flex-col gap-1.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Total Redemption Requests</span>
                          <span className="text-2xl font-black text-[#001c41]">{redemptions.length}</span>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-[20px] p-5 shadow-2xs text-left flex flex-col gap-1.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Pending Processing</span>
                          <span className="text-2xl font-black text-amber-600">
                            {redemptions.filter(r => r.status === 'Pending Approval').length}
                          </span>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-[20px] p-5 shadow-2xs text-left flex flex-col gap-1.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Refunded (Processed)</span>
                          <span className="text-2xl font-black text-emerald-650">
                            {redemptions.filter(r => r.status === 'Refunded').length}
                          </span>
                        </div>
                      </div>

                      {/* Search bar */}
                      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 flex flex-col sm:flex-row gap-4 justify-between items-center font-sans">
                        <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2">
                          <Search className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                          <input
                            type="text"
                            placeholder="Search by Merchant Name or Email..."
                            value={referralSearch}
                            onChange={(e) => setReferralSearch(e.target.value)}
                            className="w-full bg-transparent text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Redemptions Table */}
                      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden font-sans">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-black text-slate-455 uppercase tracking-wider text-left">
                                <th className="px-6 py-4">Merchant</th>
                                <th className="px-6 py-4">Requested Points</th>
                                <th className="px-6 py-4">Cashback Value</th>
                                <th className="px-6 py-4">Requested Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs text-slate-655 font-semibold">
                              {redemptionsLoading ? (
                                <tr>
                                  <td colSpan="6" className="text-center py-12 text-slate-400 font-semibold">
                                    Loading redemption requests...
                                  </td>
                                </tr>
                              ) : redemptions
                                .filter(r => {
                                  const s = referralSearch.toLowerCase();
                                  const merchantName = r.userId?.fullName || r.userId?.name || '';
                                  const merchantEmail = r.userId?.email || '';
                                  return merchantName.toLowerCase().includes(s) || merchantEmail.toLowerCase().includes(s);
                                })
                                .map(r => (
                                  <tr key={r._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                      <div className="flex flex-col text-left">
                                        <span className="font-extrabold text-slate-800">{r.userId?.fullName || 'UBT Merchant'}</span>
                                        <span className="text-[10px] text-slate-400 mt-0.5">{r.userId?.email || 'N/A'}</span>
                                        <span className="text-[10px] text-slate-400 mt-0.5">Phone: {r.userId?.mobileNumber || r.userId?.phone || 'N/A'}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="font-extrabold text-slate-800">{r.points} points</span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="font-extrabold text-[#027244]">₹{r.points}</span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-550">
                                      {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className={`px-2 py-1 rounded-full text-[9.5px] font-black uppercase ${
                                        r.status === 'Refunded'
                                          ? 'bg-emerald-50 text-[#027244] border border-emerald-150'
                                          : 'bg-amber-50 text-amber-655 border border-amber-150'
                                      }`}>
                                        {r.status}
                                      </span>
                                      {r.remarks && (
                                        <p className="text-[10px] text-slate-500 mt-1 max-w-[200px]" title={r.remarks}>
                                          Remarks: {r.remarks}
                                        </p>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      {r.status === 'Pending Approval' ? (
                                        <button
                                          onClick={() => {
                                            const remarks = prompt('Enter refund remarks (e.g. Transaction ID, bank payment details):');
                                            if (remarks !== null) {
                                              handleRedemptionRefund(r._id, remarks);
                                            }
                                          }}
                                          className="px-3 py-1.5 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-[10px] rounded-lg cursor-pointer transition-colors shadow-2xs"
                                        >
                                          Mark Refunded
                                        </button>
                                      ) : (
                                        <span className="text-slate-400 text-[10px] font-bold">Processed</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              {!redemptionsLoading && redemptions.length === 0 && (
                                <tr>
                                  <td colSpan="6" className="text-center py-16 text-slate-400">
                                    <div className="flex flex-col items-center gap-2">
                                      <Gift className="h-8 w-8 text-slate-300" />
                                      <span className="text-xs font-bold text-slate-700">No Redemption Requests</span>
                                      <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs font-semibold">No points refund requests have been submitted by merchants yet.</p>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}

                  {referralSubTab === 'points' && (
                    <>
                      {/* Search bar */}
                      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 flex flex-col sm:flex-row gap-4 justify-between items-center font-sans">
                        <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2">
                          <Search className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                          <input
                            type="text"
                            placeholder="Search by Business, Owner Name, or Email..."
                            value={referralSearch}
                            onChange={(e) => setReferralSearch(e.target.value)}
                            className="w-full bg-transparent text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Business Points Table */}
                      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden font-sans">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-black text-slate-455 uppercase tracking-wider text-left">
                                <th className="px-6 py-4">Business Name</th>
                                <th className="px-6 py-4">Merchant (Owner)</th>
                                <th className="px-6 py-4">Contact Info</th>
                                <th className="px-6 py-4">Referral Points Balance</th>
                                <th className="px-6 py-4 text-right">Equivalent Credit Value</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs text-slate-655 font-semibold">
                              {businesses
                                .filter(b => {
                                  const s = referralSearch.toLowerCase();
                                  const bizName = b.name || '';
                                  const ownerName = b.ownerName || '';
                                  const ownerEmail = b.ownerEmail || '';
                                  return (
                                    bizName.toLowerCase().includes(s) ||
                                    ownerName.toLowerCase().includes(s) ||
                                    ownerEmail.toLowerCase().includes(s)
                                  );
                                })
                                .map(b => (
                                  <tr key={b._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                      <div className="flex flex-col text-left">
                                        <span className="font-extrabold text-slate-800">{b.name}</span>
                                        <span className="text-[10px] text-slate-400 mt-0.5">{b.category}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-800 font-extrabold">
                                      {b.ownerName}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                      <div className="flex flex-col text-left">
                                        <span>{b.ownerEmail || 'N/A'}</span>
                                        <span className="text-[10px] text-slate-400 mt-0.5">Phone: {b.phone || 'N/A'}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-2">
                                        <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full" />
                                        <span className="font-bold text-slate-800">{b.referralPoints || 0} pts</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <span className="font-extrabold text-[#027244]">₹{b.referralPoints || 0}</span>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB: CATEGORY MANAGEMENT */}
              {activeTab === 'Category Management' && (
                <div className="flex flex-col gap-6 text-left animate-fadeIn">
                  
                  {/* Title Block */}
                  <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-col text-left">
                      <h3 className="font-extrabold text-slate-800 text-base leading-tight font-sans">Category Management Console</h3>
                      <span className="text-[10px] text-slate-400 font-semibold mt-1 block">Seeded presets, custom requests vetting, automatic icon assignment, and category mergers.</span>
                    </div>
                  </div>

                  {/* Split Layout: Left side for requests & grid, Right side for operations */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
                    
                    {/* Left & Center: Requests and Category Lists */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                      
                      {/* Section 1: Pending Requests */}
                      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6">
                        <h4 className="font-extrabold text-xs uppercase tracking-wider mb-4 border-b pb-3 border-slate-100 flex items-center gap-2 text-slate-800">
                          <Clock className="h-4.5 w-4.5 text-amber-500 animate-spin-slow" /> Custom Category Requests ({pendingCategories.length})
                        </h4>
                        
                        {pendingCategories.length === 0 ? (
                          <div className="text-center py-10 text-slate-400 text-xs font-semibold flex flex-col items-center gap-2">
                            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                            <span>All custom category requests resolved!</span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-4">
                            {pendingCategories.map(biz => (
                              <div key={biz._id} className="border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4 bg-slate-50/50 text-left">
                                <div className="flex justify-between items-start flex-wrap gap-4">
                                  <div className="flex flex-col text-left font-sans">
                                    <div className="flex items-center gap-2">
                                      <span className="bg-amber-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded shadow-sm">Custom category request</span>
                                      <span className="text-[9px] font-extrabold text-slate-400">Biz Status: {biz.status}</span>
                                    </div>
                                    <span className="font-black text-sm mt-2 text-[#001c41]">"{biz.customCategoryName}"</span>
                                    {biz.requestedParentCategory && (
                                      <span className="text-[11px] text-emerald-600 font-extrabold mt-1">Requested Parent Category: {biz.requestedParentCategory}</span>
                                    )}
                                    <span className="text-[10.5px] text-slate-400 font-semibold mt-1">Requested by business: <b className="text-slate-555">{biz.name}</b> ({biz.ownerId?.fullName || 'Owner'})</span>
                                  </div>
                                  {biz.requestedParentCategory && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const confirmed = confirm(`Approve new subcategory "${biz.customCategoryName}" nested under requested parent category "${biz.requestedParentCategory}"?`);
                                        if (confirmed) {
                                          resolveCategoryRequest(biz._id, 'create', null, biz.customCategoryName, null, biz.requestedParentCategory);
                                        }
                                      }}
                                      className="py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold rounded-xl transition-all shadow-sm cursor-pointer"
                                    >
                                      Approve as Requested
                                    </button>
                                  )}
                                </div>
                                
                                <div className="flex flex-col gap-4 mt-2 bg-slate-100/50 p-4 rounded-2xl w-full font-sans">
                                  <div className="flex flex-col sm:flex-row gap-2 border-b border-slate-200 pb-2.5">
                                    {[
                                      { id: 'assign', label: 'Map to Existing' },
                                      { id: 'create_main', label: 'Add as New Main Category' },
                                      { id: 'create_sub', label: 'Map to Existing Main & Add Sub' }
                                    ].map(opt => {
                                      const isSelected = (resolutionActionMap[biz._id] || 'assign') === opt.id;
                                      return (
                                        <button
                                          key={opt.id}
                                          type="button"
                                          onClick={() => setResolutionActionMap(prev => ({ ...prev, [biz._id]: opt.id }))}
                                          className={`px-3 py-2 rounded-lg text-[10px] font-black tracking-wide border transition-all cursor-pointer w-full sm:w-auto text-center ${
                                            isSelected 
                                              ? 'bg-[#027244] border-[#027244] text-white shadow-xs' 
                                              : 'border-slate-200 bg-white text-slate-550 hover:bg-slate-200/40'
                                          }`}
                                        >
                                          {opt.label}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  <div className="flex flex-wrap items-center gap-3 w-full">
                                    {/* Option 1: Map to Existing */}
                                    {(resolutionActionMap[biz._id] || 'assign') === 'assign' && (
                                      <div className="flex items-center gap-2.5 w-full sm:w-auto">
                                        <select
                                          value={resolutionTargetCatMap[biz._id] || ''}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setResolutionTargetCatMap(prev => ({ ...prev, [biz._id]: val }));
                                          }}
                                          className="py-1.5 px-3 border border-slate-200 bg-white text-slate-705 hover:bg-slate-50 rounded-xl text-[10.5px] font-extrabold cursor-pointer transition-colors outline-none w-full sm:w-64"
                                        >
                                          <option value="">-- Select Existing Category --</option>
                                          {presetCategories.map(c => (
                                            <option key={c._id} value={c._id}>{c.categoryName} ({c.parentCategory || 'Main'})</option>
                                          ))}
                                        </select>
                                        <button
                                          onClick={() => {
                                            const catId = resolutionTargetCatMap[biz._id];
                                            if (!catId) {
                                              alert("Please select a target category.");
                                              return;
                                            }
                                            const matched = presetCategories.find(c => c._id === catId);
                                            if (matched) {
                                              const confirmed = confirm(`Map custom request to existing category "${matched.categoryName}"?`);
                                              if (confirmed) {
                                                resolveCategoryRequest(biz._id, 'assign', matched._id);
                                              }
                                            }
                                          }}
                                          className="py-1.5 px-4 bg-[#027244] hover:bg-[#005934] text-white text-[10px] font-extrabold rounded-xl transition-colors cursor-pointer shadow-sm shadow-emerald-800/10"
                                        >
                                          Map to Existing
                                        </button>
                                      </div>
                                    )}

                                    {/* Option 2: Add as New Main Category */}
                                    {(resolutionActionMap[biz._id] || 'assign') === 'create_main' && (
                                      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 w-full">
                                        <div className="flex-1 flex flex-col text-left gap-1">
                                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">New Main Category Name</span>
                                          <input
                                            type="text"
                                            disabled
                                            value={biz.customCategoryName}
                                            className="py-2 px-3 border border-slate-200 bg-slate-100 rounded-xl text-xs font-extrabold outline-none w-full text-slate-400"
                                          />
                                        </div>
                                        <div className="flex-1 flex flex-col text-left gap-1">
                                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Specify Required Subcategory</span>
                                          <input
                                            type="text"
                                            required
                                            placeholder="e.g. General, Services, custom sub..."
                                            value={resolutionCustomSubcatMap[biz._id] || ''}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setResolutionCustomSubcatMap(prev => ({ ...prev, [biz._id]: val }));
                                            }}
                                            className="py-2 px-3 border border-slate-200 bg-white rounded-xl text-xs font-semibold outline-none w-full text-slate-705"
                                          />
                                        </div>
                                        <button
                                          onClick={() => {
                                            const subcatName = resolutionCustomSubcatMap[biz._id]?.trim();
                                            if (!subcatName) {
                                              alert("Please specify a subcategory name.");
                                              return;
                                            }
                                            const confirmed = confirm(`Create new Main Category "${biz.customCategoryName}" with Subcategory "${subcatName}"?`);
                                            if (confirmed) {
                                              resolveCategoryRequest(biz._id, 'create', null, subcatName, null, biz.customCategoryName);
                                            }
                                          }}
                                          className="py-2.5 px-4 bg-[#027244] hover:bg-[#005934] text-white text-[10.5px] font-extrabold rounded-xl transition-colors cursor-pointer shadow-sm shadow-emerald-800/10 shrink-0 self-end"
                                        >
                                          Create Main Category
                                        </button>
                                      </div>
                                    )}

                                    {/* Option 3: Map to Already Existing Main but Add New Subcategory */}
                                    {(resolutionActionMap[biz._id] || 'assign') === 'create_sub' && (
                                      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 w-full">
                                        <div className="flex-1 flex flex-col text-left gap-1">
                                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Select Existing Main Category</span>
                                          <select
                                            value={resolutionParentCatMap[biz._id] || ''}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setResolutionParentCatMap(prev => ({ ...prev, [biz._id]: val }));
                                            }}
                                            className="py-2 px-3 border border-slate-200 bg-white text-slate-705 hover:bg-slate-50 rounded-xl text-xs font-extrabold cursor-pointer transition-colors outline-none w-full"
                                          >
                                            <option value="">-- Select Main Category --</option>
                                            {getAdminDynamicMainCategories().map(c => (
                                              <option key={c} value={c}>{c}</option>
                                            ))}
                                          </select>
                                        </div>
                                        <div className="flex-1 flex flex-col text-left gap-1">
                                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">New Subcategory Name</span>
                                          <input
                                            type="text"
                                            disabled
                                            value={biz.customCategoryName}
                                            className="py-2 px-3 border border-slate-200 bg-slate-100 rounded-xl text-xs font-extrabold outline-none w-full text-slate-400"
                                          />
                                        </div>
                                        <button
                                          onClick={() => {
                                            const parentVal = resolutionParentCatMap[biz._id];
                                            if (!parentVal) {
                                              alert("Please select a parent category.");
                                              return;
                                            }
                                            const confirmed = confirm(`Add "${biz.customCategoryName}" as a new Subcategory under existing Main category "${parentVal}"?`);
                                            if (confirmed) {
                                              resolveCategoryRequest(biz._id, 'create', null, biz.customCategoryName, null, parentVal);
                                            }
                                          }}
                                          className="py-2.5 px-4 bg-[#027244] hover:bg-[#005934] text-white text-[10.5px] font-extrabold rounded-xl transition-colors cursor-pointer shadow-sm shadow-emerald-800/10 shrink-0 self-end"
                                        >
                                          Create Subcategory
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Section 2: Preset Seeded Categories Grid */}
                      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6">
                        <div className="flex justify-between items-center mb-4 border-b pb-3 border-slate-100">
                          <h4 className="font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 text-slate-800">
                            <Grid className="h-4.5 w-4.5 text-emerald-500" /> Preset Categories ({presetCategories.length})
                          </h4>
                          <span className="text-[10px] text-slate-500 font-bold">Sort: Alphabetical</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                          {presetCategories.map(cat => {
                            const count = businesses.filter(b => b.category === cat.categoryName || b.type === cat.categoryName).length;
                            return (
                              <div 
                                key={cat._id} 
                                className="border border-slate-200 rounded-2xl p-4 flex justify-between items-center transition-all bg-slate-50/50 hover:bg-slate-50 min-w-0 gap-3"
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className="h-9 w-9 rounded-xl flex items-center justify-center font-black shrink-0 bg-emerald-50 text-[#027244] border border-emerald-100">
                                    <Store className="h-4.5 w-4.5" />
                                  </div>
                                  <div className="flex flex-col text-left min-w-0 flex-1">
                                    <span className="font-extrabold text-xs truncate text-slate-800">{cat.categoryName}</span>
                                    <span className="text-[9.5px] text-slate-450 font-bold mt-1 leading-none truncate">Main: {cat.parentCategory || 'Others'}</span>
                                    <span className="text-[9px] text-slate-400 mt-1.5 font-semibold truncate leading-none">Slug: {cat.slug || cat.categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}</span>
                                    <span className="text-[9.5px] text-emerald-650 font-black mt-2 leading-none">{count} active businesses</span>
                                  </div>
                                </div>

                                <div className="flex gap-1.5 shrink-0">
                                  <button
                                    onClick={() => {
                                      const newName = prompt("Rename category:", cat.categoryName);
                                      if (!newName || newName === cat.categoryName) return;
                                      updatePresetCategory(cat._id, { categoryName: newName });
                                    }}
                                    className="h-7 w-7 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center cursor-pointer text-slate-550 font-extrabold text-[10px]"
                                    title="Edit Category Name"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to permanently delete category "${cat.categoryName}"? Businesses linked will stay fallback to "Others".`)) {
                                        deletePresetCategory(cat._id);
                                      }
                                    }}
                                    className="h-7 w-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 flex items-center justify-center cursor-pointer border border-rose-500/10"
                                    title="Delete Category"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions Column (Add Category & Merge Console) */}
                    <div className="lg:col-span-1 flex flex-col gap-6">
                      
                      {/* Action 1: Add Category Form */}
                      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 flex flex-col gap-5">
                        <div>
                          <h4 className="font-extrabold text-xs uppercase tracking-wider mb-1 text-slate-800">Add Preset Category</h4>
                          <span className="text-[10px] text-slate-400 font-semibold leading-relaxed">Add a new standard business classification instantly. Includes Levenshtein duplicate prevention warning.</span>
                        </div>

                        {/* Interactive Pill Tabs */}
                        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                          <button
                            type="button"
                            onClick={() => setPresetTypeMode('main')}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer text-center ${
                              presetTypeMode === 'main'
                                ? 'bg-[#027244] text-white shadow-xs'
                                : 'text-slate-400 hover:text-slate-500 bg-transparent'
                            }`}
                          >
                            Add Main Category
                          </button>
                          <button
                            type="button"
                            onClick={() => setPresetTypeMode('sub')}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer text-center ${
                              presetTypeMode === 'sub'
                                ? 'bg-[#027244] text-white shadow-xs'
                                : 'text-slate-400 hover:text-slate-500 bg-transparent'
                            }`}
                          >
                            Add Subcategory
                          </button>
                        </div>

                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            let targetCategoryName = '';
                            let parentCategoryName = '';

                            if (presetTypeMode === 'main') {
                              parentCategoryName = presetNewMainName.trim();
                              targetCategoryName = presetNewSubName.trim();
                              if (!parentCategoryName || !targetCategoryName) {
                                alert("Please fill in both Main Category Name and Subcategory Name.");
                                return;
                              }
                            } else {
                              parentCategoryName = presetSelectedMain;
                              targetCategoryName = presetNewSubName.trim();
                              if (!parentCategoryName || !targetCategoryName) {
                                alert("Please select a Main Category and specify the Subcategory Name.");
                                return;
                              }
                            }

                            try {
                              // Duplicate prevention fuzzy check on the subcategory
                              const dupRes = await fetch('http://localhost:5000/api/categories/check-duplicate', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ categoryName: targetCategoryName })
                              });
                              const dupData = await dupRes.json();
                              if (dupData.success && dupData.isDuplicate) {
                                alert(dupData.message);
                                return;
                              }

                              // Create Category
                              const createRes = await fetch('http://localhost:5000/api/categories', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${localStorage.getItem('ubt_token')}`
                                },
                                body: JSON.stringify({
                                  categoryName: targetCategoryName,
                                  parentCategory: parentCategoryName,
                                  description: 'Preset category created manually'
                                })
                              });
                              if (createRes.ok) {
                                alert(`Category with Subcategory "${targetCategoryName}" under Main Category "${parentCategoryName}" created successfully!`);
                                // Reset form values
                                setPresetNewMainName('');
                                setPresetNewSubName('');
                                setPresetSelectedMain('');
                                loadPlatformRealData();
                              } else {
                                const errData = await createRes.json();
                                alert(errData.message || 'Failed to create category.');
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className="flex flex-col gap-4 text-left"
                        >
                          {presetTypeMode === 'main' ? (
                            <>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[9.5px] font-black text-slate-500 uppercase tracking-widest leading-none">New Main Category Name *</label>
                                <input
                                  type="text"
                                  required
                                  value={presetNewMainName}
                                  onChange={(e) => setPresetNewMainName(e.target.value)}
                                  placeholder="e.g. Entertainment"
                                  className="w-full border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#027244] bg-slate-50/50 text-[#001c41]"
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[9.5px] font-black text-slate-500 uppercase tracking-widest leading-none">Initial Subcategory Name *</label>
                                <input
                                  type="text"
                                  required
                                  value={presetNewSubName}
                                  onChange={(e) => setPresetNewSubName(e.target.value)}
                                  placeholder="e.g. Cinema (or General)"
                                  className="w-full border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#027244] bg-slate-50/50 text-[#001c41]"
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[9.5px] font-black text-slate-500 uppercase tracking-widest leading-none">Select Main Category *</label>
                                <select
                                  required
                                  value={presetSelectedMain}
                                  onChange={(e) => setPresetSelectedMain(e.target.value)}
                                  className="w-full border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold focus:outline-none focus:border-[#027244] cursor-pointer bg-slate-50/50 text-[#001c41] hover:bg-slate-50"
                                >
                                  <option value="">-- Choose Main Category --</option>
                                  {Array.from(
                                    new Set([
                                      'Automotive',
                                      'Beauty & Wellness',
                                      'Education',
                                      'Electronics',
                                      'Food & Restaurants',
                                      'Health & Medical',
                                      'Home Services',
                                      'Real Estate',
                                      'Shopping',
                                      'Manufacturing',
                                      'Professional Services',
                                      'Travel & Hospitality',
                                      'Construction',
                                      'Agriculture',
                                      'Finance & Insurance',
                                      'Events & Entertainment',
                                      'Sports & Fitness',
                                      'Others',
                                      ...presetCategories.map(cat => cat.parentCategory).filter(Boolean)
                                    ])
                                  ).sort().map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[9.5px] font-black text-slate-500 uppercase tracking-widest leading-none">New Subcategory Name *</label>
                                <input
                                  type="text"
                                  required
                                  value={presetNewSubName}
                                  onChange={(e) => setPresetNewSubName(e.target.value)}
                                  placeholder="e.g. Solar Solutions"
                                  className="w-full border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#027244] bg-slate-50/50 text-[#001c41]"
                                />
                              </div>
                            </>
                          )}

                          <button
                            type="submit"
                            className="py-3 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                          >
                            Add Category
                          </button>
                        </form>
                      </div>

                      {/* Action 2: Merge Duplicate Categories Panel */}
                      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 flex flex-col gap-5">
                        <div>
                          <h4 className="font-extrabold text-xs uppercase tracking-wider mb-1 text-slate-800">Merge Categories Console</h4>
                          <span className="text-[10px] text-slate-400 font-semibold leading-relaxed">Combine similar or duplicate categories (e.g. "Restaurant" into "Restaurants"). Links all matching businesses to target and resolves source.</span>
                        </div>

                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const sourceId = e.target.sourceCategoryId.value;
                            const targetId = e.target.targetCategoryId.value;
                            if (!sourceId || !targetId) {
                              alert("Please select both source and target categories.");
                              return;
                            }
                            if (sourceId === targetId) {
                              alert("Source and target categories must be different.");
                              return;
                            }

                            if (confirm("Are you sure you want to merge these categories? This will remap all businesses linked to source category and permanently delete it!")) {
                              try {
                                const mergeRes = await fetch('http://localhost:5000/api/admin/categories/merge', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${localStorage.getItem('ubt_token')}`
                                  },
                                  body: JSON.stringify({ sourceCategoryId: sourceId, targetCategoryId: targetId })
                                });
                                const data = await mergeRes.json();
                                if (data.success) {
                                  alert(data.message || "Categories successfully merged!");
                                  loadPlatformRealData();
                                } else {
                                  alert(data.message || "Merge execution failed.");
                                }
                              } catch (err) {
                                console.error(err);
                              }
                            }
                          }}
                          className="flex flex-col gap-4 text-left"
                        >
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9.5px] font-black text-slate-500 uppercase tracking-widest leading-none">Source Category (To Merge / Delete)</label>
                            <select
                              name="sourceCategoryId"
                              required
                              className="w-full border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#027244] cursor-pointer bg-slate-50/50 text-[#001c41]"
                            >
                              <option value="">-- Select Source --</option>
                              {presetCategories.map(c => (
                                <option key={c._id} value={c._id}>{c.categoryName}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9.5px] font-black text-slate-500 uppercase tracking-widest leading-none">Target Category (To Keep / Direct To)</label>
                            <select
                              name="targetCategoryId"
                              required
                              className="w-full border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#027244] cursor-pointer bg-slate-50/50 text-[#001c41]"
                            >
                              <option value="">-- Select Target --</option>
                              {presetCategories.map(c => (
                                <option key={c._id} value={c._id}>{c.categoryName}</option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="submit"
                            className="py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                          >
                            Execute Category Merger
                          </button>
                        </form>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Blood Donors' && (
                <BloodDonorsTab />
              )}

              {activeTab === 'Signups' && (
                <div className="flex flex-col gap-6 text-left animate-fadeIn">
                  <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-col text-left">
                      <h3 className="font-extrabold text-[#001c41] text-base leading-tight font-sans">User Registrations & Signups</h3>
                      <span className="text-[10px] text-slate-455 font-semibold mt-1 block">
                        Audit community members, manage user signups, and purge accounts along with their directory listings.
                      </span>
                    </div>
                    {selectedSignups.length > 0 && (
                      <button
                        onClick={handleDeleteSelectedSignups}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 border-none"
                      >
                        Delete Selected ({selectedSignups.length})
                      </button>
                    )}
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-[28px] bg-white">
                    <table className="w-full border-collapse text-left text-xs font-semibold text-slate-600">
                      <thead className="uppercase text-[9px] font-black tracking-wider border-b bg-slate-50 border-slate-200 text-slate-455">
                        <tr>
                          <th className="p-4.5 w-12 text-center">
                            <input
                              type="checkbox"
                              checked={filteredUsers.length > 0 && selectedSignups.length === filteredUsers.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSignups(filteredUsers.map(u => u._id));
                                } else {
                                  setSelectedSignups([]);
                                }
                              }}
                              className="h-4 w-4 rounded text-[#027244] border-slate-350 focus:ring-[#027244] cursor-pointer"
                            />
                          </th>
                          <th className="p-4.5">User Name</th>
                          <th className="p-4.5">Email Address</th>
                          <th className="p-4.5">Mobile / Phone</th>
                          <th className="p-4.5">Access Role</th>
                          <th className="p-4.5">Joined Date</th>
                          <th className="p-4.5 text-center">Status</th>
                          <th className="p-4.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {filteredUsers.map(u => (
                          <tr key={u._id} className="transition-colors hover:bg-slate-50/50">
                            <td className="p-4.5 text-center w-12">
                              <input
                                type="checkbox"
                                checked={selectedSignups.includes(u._id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedSignups(prev => [...prev, u._id]);
                                  } else {
                                    setSelectedSignups(prev => prev.filter(id => id !== u._id));
                                  }
                                }}
                                className="h-4 w-4 rounded text-[#027244] border-slate-350 focus:ring-[#027244] cursor-pointer"
                              />
                            </td>
                            <td className="p-4.5 flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-emerald-50 text-[#027244] border border-emerald-100 flex items-center justify-center font-black text-xs shrink-0 select-none">
                                {u.fullName ? u.fullName.charAt(0).toUpperCase() : (u.name ? u.name.charAt(0).toUpperCase() : 'U')}
                              </div>
                              <div className="flex flex-col text-left">
                                <span className="font-extrabold text-xs sm:text-[13px] text-slate-800">
                                  {u.fullName || u.name || 'Anonymous User'}
                                </span>
                              </div>
                            </td>
                            <td className="p-4.5 text-slate-600 font-mono text-[11px]">{u.email}</td>
                            <td className="p-4.5 text-slate-500 font-semibold">{u.mobileNumber || u.phone || 'N/A'}</td>
                            <td className="p-4.5 text-slate-600 uppercase text-[10px] font-bold">
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold select-none ${
                                u.role === 'admin' || u.role === 'superadmin'
                                  ? 'bg-purple-100 text-purple-700'
                                  : u.role === 'merchant' || u.role === 'owner'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-slate-100 text-slate-700'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="p-4.5 text-slate-405 text-[10.5px]">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="p-4.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border select-none ${
                                u.status === 'Active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-red-500/10 border-red-500/20 text-red-500'
                              }`}>
                                {u.status || 'Active'}
                              </span>
                            </td>
                            <td className="p-4.5 text-right">
                              <button 
                                onClick={() => handleDeleteSignup(u._id)}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-650 font-extrabold text-[10.5px] rounded-xl cursor-pointer transition-colors shadow-2xs border-none"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                          <tr>
                            <td colSpan="7" className="p-16 text-center text-slate-400 font-semibold">
                              No matching user registrations found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </main>

      {/* 3. BUSINESS DETAIL REVIEW SLIDE-OVER MODAL */}
      {showBizModal && selectedBiz && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-end p-0">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between animate-slideLeft text-left font-sans">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex flex-col text-left min-w-0 flex-1 pr-3">
                <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest">Vetting Workspace</span>
                <h3 className="font-extrabold text-slate-800 text-base mt-1 truncate">{selectedBiz.name}</h3>
              </div>
              <button 
                onClick={() => { setShowBizModal(false); setSelectedBiz(null); }}
                className="h-8.5 w-8.5 rounded-xl hover:bg-slate-200/80 flex items-center justify-center text-slate-450 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-6 flex-grow overflow-y-auto flex flex-col gap-6">
              
              {/* Cover Image */}
              <div className="h-44 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-2xs relative bg-slate-50 shrink-0">
                <img src={selectedBiz.coverImageUrl} className="w-full h-full object-cover" alt={selectedBiz.name} />
              </div>

              {/* View Full Profile Direct Link */}
              <a
                href={`/businesses/${selectedBiz.slug || selectedBiz._id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs rounded-xl text-center shadow shadow-emerald-800/10 block shrink-0 cursor-pointer transition-colors"
              >
                Open Entire Profile Page ↗
              </a>

              {isBizDraft(selectedBiz) && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-2xl p-4.5 font-semibold flex items-start gap-2.5 shadow-3xs shrink-0 select-none text-left">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-extrabold text-amber-800">Registration Incomplete</span>
                    <p className="text-[11px] text-amber-700 font-medium leading-relaxed mt-0.5">
                      This business listing is still in draft mode. The merchant has confirmed payment but has not yet completed all steps of registration.
                    </p>
                  </div>
                </div>
              )}

              {/* Status details indicators */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-3.5 text-xs font-bold text-slate-600 flex flex-col gap-0.5">
                  <span className="text-[8.5px] text-slate-400 font-extrabold uppercase">Vetting Status</span>
                  <span className="text-slate-800 mt-1 font-extrabold">{selectedBiz.status}</span>
                </div>
                <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-3.5 text-xs font-bold text-slate-600 flex flex-col gap-0.5">
                  <span className="text-[8.5px] text-slate-400 font-extrabold uppercase">Sub-Status</span>
                  <span className="text-slate-800 mt-1 font-extrabold">{selectedBiz.subscriptionStatus === 'active' ? 'Premium Active' : 'Basic Tier'}</span>
                </div>
              </div>

              {/* Owner and Contact parameters */}
              <div className="flex flex-col gap-3.5">
                <span className="font-extrabold text-xs text-slate-800 border-b border-slate-100 pb-1.5 uppercase tracking-wider">Contact & Registration</span>
                
                <div className="flex flex-col gap-2.5 text-xs font-semibold text-slate-500">
                  <div className="flex flex-col sm:flex-row sm:justify-between border-b border-slate-50 pb-1.5 gap-0.5 sm:gap-2">
                    <span className="text-[10px] sm:text-xs text-slate-400 sm:text-slate-500 uppercase sm:normal-case font-bold sm:font-semibold">Merchant Full Name</span>
                    <span className="font-bold text-slate-800">{selectedBiz.ownerName}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between border-b border-slate-50 pb-1.5 gap-0.5 sm:gap-2">
                    <span className="text-[10px] sm:text-xs text-slate-400 sm:text-slate-500 uppercase sm:normal-case font-bold sm:font-semibold">Mobile Phone</span>
                    <span className="font-bold text-slate-800">{selectedBiz.phone}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between border-b border-slate-50 pb-1.5 gap-0.5 sm:gap-2">
                    <span className="text-[10px] sm:text-xs text-slate-400 sm:text-slate-500 uppercase sm:normal-case font-bold sm:font-semibold">Email Address</span>
                    <span className="font-bold text-slate-800 break-all">{selectedBiz.email || 'N/A'}</span>
                  </div>
                  {selectedBiz.website && (
                    <div className="flex flex-col sm:flex-row sm:justify-between border-b border-slate-50 pb-1.5 gap-0.5 sm:gap-2">
                      <span className="text-[10px] sm:text-xs text-slate-400 sm:text-slate-500 uppercase sm:normal-case font-bold sm:font-semibold">Website</span>
                      <span className="font-bold text-emerald-700 break-all">{selectedBiz.website}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Location parameters */}
              <div className="flex flex-col gap-3.5">
                <span className="font-extrabold text-xs text-slate-800 border-b border-slate-100 pb-1.5 uppercase tracking-wider">Location Parameters</span>
                
                <div className="flex flex-col gap-2.5 text-xs font-semibold text-slate-500">
                  <div className="flex flex-col sm:flex-row sm:justify-between border-b border-slate-50 pb-1.5 gap-0.5 sm:gap-2">
                    <span className="text-[10px] sm:text-xs text-slate-400 sm:text-slate-500 uppercase sm:normal-case font-bold sm:font-semibold">Street Address</span>
                    <span className="font-bold text-slate-805 text-left sm:text-right">{selectedBiz.address}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between border-b border-slate-50 pb-1.5 gap-0.5 sm:gap-2">
                    <span className="text-[10px] sm:text-xs text-slate-400 sm:text-slate-500 uppercase sm:normal-case font-bold sm:font-semibold">Locality</span>
                    <span className="font-bold text-slate-805">{selectedBiz.locality}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between border-b border-slate-50 pb-1.5 gap-0.5 sm:gap-2">
                    <span className="text-[10px] sm:text-xs text-slate-400 sm:text-slate-500 uppercase sm:normal-case font-bold sm:font-semibold">Pincode Boundary</span>
                    <span className="font-bold text-slate-800">{selectedBiz.pincode}</span>
                  </div>
                </div>
              </div>

              {/* Uploaded Photos and Timings specifications */}
              <div className="flex flex-col gap-3.5">
                <span className="font-extrabold text-xs text-slate-800 border-b border-slate-100 pb-1.5 uppercase tracking-wider">Vetting Parameters</span>
                
                <div className="flex flex-col gap-2.5 text-xs font-semibold text-slate-500">
                  <div className="flex flex-col sm:flex-row sm:justify-between border-b border-slate-50 pb-1.5 gap-0.5 sm:gap-2">
                    <span className="text-[10px] sm:text-xs text-slate-400 sm:text-slate-500 uppercase sm:normal-case font-bold sm:font-semibold">GST Number (Taxation)</span>
                    <span className="font-extrabold text-slate-800 tracking-wider break-all">{selectedBiz.gstNumber || 'N/A (Cottage/Unregistered)'}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between border-b border-slate-50 pb-1.5 gap-0.5 sm:gap-2">
                    <span className="text-[10px] sm:text-xs text-slate-400 sm:text-slate-500 uppercase sm:normal-case font-bold sm:font-semibold">Established Year</span>
                    <span className="font-bold text-slate-800">{selectedBiz.yearEstablished || '2012'}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between border-b border-slate-50 pb-1.5 gap-0.5 sm:gap-2">
                    <span className="text-[10px] sm:text-xs text-slate-400 sm:text-slate-500 uppercase sm:normal-case font-bold sm:font-semibold">Staff count</span>
                    <span className="font-bold text-slate-800">{selectedBiz.employeeCount || '10 - 20'}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between border-b border-slate-50 pb-1.5 gap-0.5 sm:gap-2">
                    <span className="text-[10px] sm:text-xs text-slate-400 sm:text-slate-500 uppercase sm:normal-case font-bold sm:font-semibold">Maps Connection PlaceId</span>
                    <span className="font-bold text-blue-650 truncate max-w-[200px]">{selectedBiz.googlePlaceId || 'Not connected'}</span>
                  </div>
                </div>
              </div>

              {/* Branches Sub-Section */}
              <div className="flex flex-col gap-3.5">
                <span className="font-extrabold text-xs text-slate-800 border-b border-slate-100 pb-1.5 uppercase tracking-wider">Registered Branches ({selectedBizBranches.length})</span>
                
                {selectedBizBranchesLoading ? (
                  <div className="flex items-center justify-center py-4 gap-2 text-xs text-slate-450 font-semibold">
                    <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
                    <span>Loading branches...</span>
                  </div>
                ) : selectedBizBranches.length === 0 ? (
                  <span className="text-xs text-slate-400 font-bold italic py-1">No additional branches registered for this business.</span>
                ) : (
                  <div className="flex flex-col gap-3">
                    {selectedBizBranches.map((br) => (
                      <div key={br._id} className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-2.5 text-xs text-slate-600">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-extrabold text-slate-850 text-xs leading-tight break-words">{br.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase shrink-0 border ${
                            br.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
                            br.status === 'Pending Verification' ? 'bg-amber-50 text-amber-700 border-amber-250 animate-pulse' :
                            br.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-250' :
                            'bg-red-50 text-red-700 border border-red-250'
                          }`}>
                            {br.status}
                          </span>
                        </div>
                        
                        <div className="flex flex-col gap-1.5 font-semibold text-slate-500">
                          {br.branchManagerName && (
                            <div>
                              <span className="text-slate-400 text-[10px] uppercase font-bold mr-1">Manager:</span>
                              <span className="text-slate-700 font-bold">{br.branchManagerName}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-bold mr-1">Address:</span>
                            <span className="text-slate-700 font-bold">{br.address}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-bold mr-1">Phone:</span>
                            <span className="text-slate-750 font-bold">{br.phone}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-bold mr-1">Hours:</span>
                            <span className="text-slate-700 font-bold">{br.workingHours || '9:00 AM - 8:00 PM'}</span>
                          </div>
                        </div>

                        {/* Direct moderation actions for this branch */}
                        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-2.5 mt-1">
                          {br.status !== 'Approved' && (
                            <button
                              onClick={() => handleBranchStatusChange(br._id, 'Approved')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase cursor-pointer transition-colors shadow-2xs"
                            >
                              Approve
                            </button>
                          )}
                          {(br.status === 'Pending Verification' || br.status === 'Under Review') && (
                            <button
                              onClick={() => handleBranchStatusChange(br._id, 'Rejected')}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black uppercase cursor-pointer transition-colors shadow-2xs"
                            >
                              Reject
                            </button>
                          )}
                          {br.status === 'Approved' && (
                            <button
                              onClick={() => handleBranchStatusChange(br._id, 'Suspended')}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-black uppercase cursor-pointer transition-colors shadow-2xs"
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Action Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex flex-col gap-4 shrink-0">
              {selectedBiz.status !== 'Approved' && selectedBiz.status !== 'Rejected' && (
                <label className="flex items-center gap-2 px-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isFoundingMemberCheck}
                    onChange={(e) => setIsFoundingMemberCheck(e.target.checked)}
                    className="h-4.5 w-4.5 rounded text-[#027244] focus:ring-[#027244] border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-700">Award "Founding Member" Badge upon approval</span>
                </label>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                {selectedBiz.status !== 'Approved' && selectedBiz.status !== 'Rejected' && (
                  <button 
                    onClick={() => {
                      handleAction(selectedBiz._id, 'reject');
                      setSelectedBiz(prev => ({ ...prev, status: 'Rejected' }));
                      setShowBizModal(false);
                      showToast('Listing rejected and hidden from public.', 'error');
                    }}
                    className="w-full sm:flex-1 py-3 bg-red-550/10 border border-red-550/20 hover:bg-red-550/20 text-red-650 font-extrabold text-xs rounded-xl cursor-pointer text-center"
                  >
                    Reject Listing
                  </button>
                )}
                {selectedBiz.status !== 'Approved' && selectedBiz.status !== 'Rejected' && (
                  <button 
                    onClick={() => {
                      handleAction(selectedBiz._id, 'approve');
                      setSelectedBiz(prev => ({ ...prev, status: 'Approved' }));
                      setShowBizModal(false);
                      showToast('Listing approved and published successfully!', 'success');
                    }}
                    className="w-full sm:flex-1 py-3 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs rounded-xl cursor-pointer text-center shadow shadow-emerald-800/10"
                  >
                    Approve & Publish
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* PARTNER DETAIL REVIEW SLIDE-OVER MODAL */}
      {showPartnerModal && selectedPartner && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-end p-0">
          <div className="w-full max-w-2xl h-full shadow-2xl flex flex-col justify-between animate-slideLeft text-left font-sans bg-white text-[#001c41] border-l border-slate-200">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b flex justify-between items-center shrink-0 bg-slate-50 border-slate-200">
              <div className="flex flex-col text-left min-w-0 flex-1 pr-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Partner Workspace</span>
                <h3 className="font-extrabold text-base leading-tight mt-1 truncate text-[#001c41]">
                  {selectedPartner.fullName || selectedPartner.name}
                </h3>
              </div>
              <button 
                onClick={() => { setSelectedPartner(null); setShowPartnerModal(false); }}
                className="h-8.5 w-8.5 rounded-full border border-slate-200 text-slate-550 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6 font-sans">
              
              {/* Partner Identity Card */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-emerald-50/40 border border-emerald-100/50 rounded-2xl">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-extrabold text-[#027244] uppercase select-none text-[24px] shrink-0">
                  {(selectedPartner.fullName || selectedPartner.name || 'P').charAt(0)}
                </div>
                <div className="flex-1 flex flex-col gap-1 min-w-0 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="font-extrabold text-slate-800 text-sm leading-tight">
                      {selectedPartner.fullName || selectedPartner.name}
                    </span>
                    {!selectedPartner.isPartnerRegistered ? (
                      <span className="bg-slate-100 text-slate-600 border border-slate-200/60 px-2 py-0.5 rounded text-[8px] font-black uppercase">
                        Draft User
                      </span>
                    ) : selectedPartner.isPartnerApproved ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-250 px-2 py-0.5 rounded text-[8px] font-black uppercase">
                        Approved Partner
                      </span>
                    ) : selectedPartner.partnerStatus === 'rejected' ? (
                      <span className="bg-red-50 text-red-705 border border-red-200 px-2 py-0.5 rounded text-[8px] font-black uppercase">
                        Rejected
                      </span>
                    ) : (
                      <span className="bg-amber-50 text-amber-705 border border-amber-200 px-2 py-0.5 rounded text-[8px] font-black uppercase animate-pulse">
                        Pending Approval
                      </span>
                    )}
                  </div>
                  <span className="text-[9.5px] text-slate-400 font-bold leading-none">
                    Joined UBT on {new Date(selectedPartner.createdAt).toLocaleString()}
                  </span>
                  <div className="mt-1.5 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs font-bold text-slate-500">
                    {selectedPartner.referralCode ? (
                      <button
                        onClick={() => {
                          const link = `${window.location.origin}/register?ref=${selectedPartner.referralCode}`;
                          navigator.clipboard.writeText(link);
                          alert('Referral link copied to clipboard!');
                        }}
                        className="bg-emerald-50 hover:bg-emerald-100 text-[#027244] border border-emerald-250 px-2.5 py-0.5 rounded text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-all"
                        title="Copy Referral Link"
                      >
                        <Copy className="h-3 w-3" />
                        <span>Copy Referral Link</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-semibold">No Referral Link</span>
                    )}
                    <span className="text-[#027244]">
                      {selectedPartner.referralPoints || 0} Points (₹{selectedPartner.referralPoints || 0})
                    </span>
                  </div>
                </div>
              </div>

              {/* Registration and Verification Log */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Contact Details</span>
                  <div className="flex flex-col gap-2 text-xs font-semibold text-slate-600">
                    <div>
                      <span className="text-slate-400 text-[10px] block font-bold">Email Address</span>
                      <span className="break-all">{selectedPartner.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block font-bold">Mobile Phone</span>
                      <span>{selectedPartner.phone || selectedPartner.mobileNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Identity Proof</span>
                  <div className="flex flex-col gap-2 text-xs font-semibold text-slate-600">
                    <div>
                      <span className="text-slate-400 text-[10px] block font-bold">Aadhaar Card Number</span>
                      <span>{selectedPartner.aadhaarNumber || 'Not Onboarded'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block font-bold">Residential Address</span>
                      <span className="truncate block" title={selectedPartner.address}>{selectedPartner.address || 'Address pending'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Log Timestamps */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Administrative Logs</span>
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold">Approved Timestamp</span>
                    <span className="text-emerald-700">
                      {selectedPartner.partnerApprovedAt ? new Date(selectedPartner.partnerApprovedAt).toLocaleString() : 'Not approved yet'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold">Rejected Timestamp</span>
                    <span className="text-rose-700">
                      {selectedPartner.partnerRejectedAt ? new Date(selectedPartner.partnerRejectedAt).toLocaleString() : 'No rejection logs'}
                    </span>
                  </div>
                  {selectedPartner.partnerRejectionReason && (
                    <div className="col-span-2 border-t border-slate-200/50 pt-2.5 mt-1">
                      <span className="text-slate-400 text-[10px] block font-bold">Rejection Reason / Details</span>
                      <span className="text-rose-600 font-extrabold text-[12.5px] mt-0.5 block bg-rose-50/50 border border-rose-100 rounded-xl p-3 leading-relaxed">
                        {selectedPartner.partnerRejectionReason}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Referrals Section */}
              <div className="flex flex-col gap-3">
                <span className="text-[10.5px] font-black text-slate-450 uppercase tracking-widest border-b border-slate-100 pb-2">
                  Referred Listings ({
                    referrals.filter(r => {
                      const rId = r.referrerId?._id || r.referrerId;
                      return rId === selectedPartner._id;
                    }).length
                  })
                </span>

                <div className="flex flex-col gap-3.5">
                  {referrals.filter(r => {
                    const rId = r.referrerId?._id || r.referrerId;
                    return rId === selectedPartner._id;
                  }).length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                      This partner has not referred any businesses yet.
                    </div>
                  ) : (
                    referrals
                      .filter(r => {
                        const rId = r.referrerId?._id || r.referrerId;
                        return rId === selectedPartner._id;
                      })
                      .map((ref) => {
                        const biz = ref.referredBusinessId;
                        return (
                          <div key={ref._id} className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-3xs flex flex-col gap-3 text-xs">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h4 className="font-extrabold text-slate-800 text-sm leading-tight">
                                  {biz?.businessName || biz?.name || 'Unnamed Business'}
                                </h4>
                                <span className="text-[9.5px] text-slate-400 block font-semibold mt-0.5">
                                  Referred Owner: {ref.referredUserId?.fullName || ref.referredUserId?.name || 'N/A'} ({ref.referredUserId?.phone || ref.referredUserId?.mobileNumber || 'No Phone'})
                                </span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                ref.status === 'completed' 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : ref.status === 'rejected'
                                    ? 'bg-red-50 text-red-700 border border-red-100'
                                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                              }`}>
                                {ref.status}
                              </span>
                            </div>

                            {biz && (
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] font-semibold text-slate-500 border-t border-slate-100 pt-2.5">
                                <div>
                                  <span className="text-slate-400 text-[8px] block font-bold uppercase">GST Number</span>
                                  <span className="text-slate-700">{biz.gstNumber || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[8px] block font-bold uppercase">Verification Status</span>
                                  <span className={`font-bold ${biz.verificationStatus === 'Approved' ? 'text-emerald-600' : 'text-slate-700'}`}>
                                    {biz.verificationStatus || biz.status || 'Pending'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[8px] block font-bold uppercase">Subscription Tier</span>
                                  <span className="text-slate-700 font-extrabold uppercase text-[10px]">
                                    {biz.subscriptionStatus === 'active' ? 'Premium Active' : 'Basic Tier'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[8px] block font-bold uppercase">Locality / Contact</span>
                                  <span className="text-slate-700 block truncate" title={biz.address}>{biz.locality || biz.address || 'N/A'}</span>
                                </div>
                              </div>
                            )}

                            {ref.rejectionReason && (
                              <div className="bg-red-50/50 p-2.5 rounded-xl border border-red-100 text-red-750 text-[11px]">
                                <span className="font-extrabold">Rejection Reason:</span> {ref.rejectionReason}
                              </div>
                            )}

                            {biz && (
                              <div className="flex justify-end border-t border-slate-100 pt-2.5 mt-0.5">
                                <button
                                  onClick={() => {
                                    setSelectedBiz(biz);
                                    setShowBizModal(true);
                                  }}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-205 text-slate-700 font-extrabold text-[10.5px] rounded-lg cursor-pointer transition-all"
                                >
                                  View Vetting Profile
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <span className="text-[10px] font-bold text-slate-400">UID: {selectedPartner._id}</span>
              <button 
                onClick={() => { setSelectedPartner(null); setShowPartnerModal(false); }}
                className="px-4.5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-xs rounded-xl cursor-pointer transition-all"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}


      {/* 4. REPLY TO QUERY MODAL */}
      {showReplyModal && selectedQuery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-2xl bg-white border border-slate-200 shadow-2xl rounded-[28px] overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex flex-col text-left">
                <h3 className="font-extrabold text-slate-800 text-base font-sans">Draft Support Reply</h3>
                <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Responding to query regarding "{selectedQuery.subject}"</span>
              </div>
              <button 
                onClick={() => { setShowReplyModal(false); setReplyText(''); }}
                className="h-8 w-8 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-550 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex flex-col gap-5 text-left font-sans">
              {/* Original query review */}
              <div className="bg-slate-50 border border-slate-200 p-4.5 rounded-2xl flex flex-col gap-2.5">
                <div className="flex justify-between items-center text-[9.5px] font-black text-slate-400 uppercase tracking-wider">
                  <span>From: {selectedQuery.name} ({selectedQuery.email})</span>
                  <span>Received: {new Date(selectedQuery.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex flex-col gap-1 border-t border-slate-200/50 pt-2">
                  <span className="font-extrabold text-[#001c41] text-xs">Subject: {selectedQuery.subject}</span>
                  <p className="text-xs text-slate-550 leading-relaxed font-semibold mt-1 bg-white border border-slate-100 p-3.5 rounded-xl">{selectedQuery.message}</p>
                </div>
              </div>

              {/* Draft text area */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Your Reply message *</label>
                <span className="text-[9.5px] text-slate-400 font-medium">This message will be recorded in the system and mock emailed to the user.</span>
                <textarea
                  rows={6}
                  required
                  placeholder="Type your response here..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full border border-slate-200 p-3.5 rounded-2xl text-xs font-semibold text-slate-700 bg-slate-50/20 focus:outline-none focus:border-[#027244] resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3 shrink-0 justify-end">
              <button 
                onClick={() => { setShowReplyModal(false); setReplyText(''); }}
                className="px-5 py-2.5 border border-slate-200 text-slate-700 font-extrabold text-xs rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleQueryReply(selectedQuery._id)}
                disabled={replySubmitting || !replyText.trim()}
                className="px-6 py-2.5 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs rounded-xl cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow shadow-emerald-800/10"
              >
                {replySubmitting ? 'Sending...' : 'Send Reply'}
              </button>
            </div>

          </div>
        </div>
      )}
      {/* 5. BLOG MODERATION DETAILED POPUP MODAL */}
      {selectedBlogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-2xl bg-white border border-slate-200 shadow-2xl rounded-[28px] overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex flex-col text-left">
                <h3 className="font-extrabold text-slate-800 text-base font-sans">Blog Moderation Desk</h3>
                <span className="text-[10px] text-slate-450 font-semibold mt-0.5">Review full article content, draft suggestions or approve status.</span>
              </div>
              <button 
                onClick={() => { setSelectedBlogModal(null); setSuggestionText(''); }}
                className="h-8 w-8 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-550 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex flex-col gap-6 text-left font-sans">
              
              {/* Blog Title & Metadata */}
              <div className="flex flex-col gap-2">
                <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider">
                  Submitted on {new Date(selectedBlogModal.createdAt).toLocaleString()} • Status: <span className={`font-extrabold ${
                    selectedBlogModal.status === 'Approved'
                      ? 'text-emerald-655'
                      : selectedBlogModal.status === 'Pending Approval' || selectedBlogModal.status === 'Needs Revision'
                        ? 'text-amber-600'
                        : selectedBlogModal.status === 'Rejected'
                          ? 'text-rose-600'
                          : 'text-slate-500'
                  }`}>{selectedBlogModal.status}</span> • Category: <strong className="text-emerald-700 uppercase">{selectedBlogModal.category || 'Business Tips'}</strong>
                </span>
                <h2 className="font-extrabold text-xl text-[#001c41] leading-tight font-sans">{selectedBlogModal.title}</h2>
                
                {selectedBlogModal.author && (
                  <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600 font-semibold">
                    <span>✍️ Author: <strong className="text-slate-800">{selectedBlogModal.authorName}</strong></span>
                    <span>📧 {selectedBlogModal.author.email || 'N/A'}</span>
                    <span>📞 {selectedBlogModal.author.mobileNumber || selectedBlogModal.author.phone || 'N/A'}</span>
                    <span>Role: <strong className="text-emerald-700 uppercase">{selectedBlogModal.author.role || 'Writer'}</strong></span>
                  </div>
                )}
              </div>

              {/* Cover Image */}
              {/* Cover Image */}
              <div className="w-full h-64 rounded-2xl overflow-hidden border border-slate-100 shrink-0 select-none shadow-3xs bg-slate-50">
                <img 
                  src={(!selectedBlogModal.coverImage || selectedBlogModal.coverImage.includes('unsplash.com')) ? '/default_blog_cover.jpg' : selectedBlogModal.coverImage} 
                  className={`w-full h-full ${(!selectedBlogModal.coverImage || selectedBlogModal.coverImage.includes('unsplash.com')) ? 'object-contain bg-white p-4' : 'object-cover'}`} 
                  alt="Full Blog Cover" 
                />
              </div>

              {/* Article Content */}
              <div className="flex flex-col gap-2">
                <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest leading-none">Article content</span>
                <p className="text-xs text-slate-655 leading-relaxed font-semibold bg-slate-50/40 border border-slate-100 p-4.5 rounded-2xl whitespace-pre-wrap text-justify">
                  {selectedBlogModal.content}
                </p>
              </div>

              {/* Suggestions Panel */}
              <div className="border-t border-slate-150 pt-5 flex flex-col gap-3">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none flex items-center gap-1.5">
                    💡 Revision Suggestions & Chat History
                  </span>
                  <span className="text-[9.5px] text-slate-400 font-semibold mt-1">Discuss corrections or request changes with the writer.</span>
                </div>

                {/* Revision Chat History Stream */}
                {selectedBlogModal.revisionHistory && selectedBlogModal.revisionHistory.length > 0 && (
                  <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto border border-slate-150 rounded-2xl p-4.5 bg-slate-50/50">
                    {selectedBlogModal.revisionHistory.map((item, idx) => {
                      const isAdmin = item.senderRole === 'admin' || item.senderRole === 'superadmin';
                      return (
                        <div 
                          key={idx} 
                          className={`flex flex-col max-w-[85%] rounded-2xl p-3 border text-xs leading-relaxed ${
                            isAdmin 
                              ? 'bg-amber-50 border-amber-100 self-end text-amber-900 text-right' 
                              : 'bg-emerald-50/50 border-emerald-250/20 self-start text-[#001c41] text-left'
                          }`}
                        >
                          <div className={`flex items-center gap-3.5 mb-1 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                            <span className="font-extrabold text-[8.5px] uppercase tracking-wider text-slate-450">
                              {item.senderName} ({isAdmin ? 'Admin' : 'Writer'})
                            </span>
                            <span className="text-[8.5px] text-slate-405 font-bold">
                              {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="font-semibold whitespace-pre-wrap leading-snug">{item.message}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                <textarea
                  rows={3}
                  placeholder="Type changes, additions, or reply to writer..."
                  value={suggestionText}
                  onChange={(e) => setSuggestionText(e.target.value)}
                  className="w-full border border-slate-200 p-3.5 rounded-2xl text-xs font-semibold text-slate-700 bg-slate-50/10 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-50 resize-none leading-relaxed"
                />
                
                <div className="flex justify-end">
                  <button 
                    onClick={() => {
                      if (!suggestionText.trim()) {
                        alert("Please type suggestions before requesting revision.");
                        return;
                      }
                      handleBlogAction(selectedBlogModal._id, 'Needs Revision', suggestionText);
                      setSuggestionText('');
                      setSelectedBlogModal(null);
                    }}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl cursor-pointer flex items-center gap-1 shadow-xs transition-colors"
                  >
                    Send Suggestions to Writer (Needs Revision)
                  </button>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3 shrink-0 justify-between items-center">
              <button 
                onClick={() => {
                  if (confirm("Are you sure you want to permanently delete this blog post? This action cannot be undone.")) {
                    handleBlogDelete(selectedBlogModal._id);
                    setSelectedBlogModal(null);
                  }
                }}
                className="px-4 py-2.5 bg-red-550/10 border border-red-550/20 hover:bg-red-550/20 text-red-650 font-extrabold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Delete Post
              </button>

              <div className="flex gap-2">
                <button 
                  onClick={() => { setSelectedBlogModal(null); setSuggestionText(''); }}
                  className="px-4.5 py-2.5 border border-slate-200 text-slate-700 font-extrabold text-xs rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    handleBlogAction(selectedBlogModal._id, selectedBlogModal.status === 'Hidden' ? 'Approved' : 'Hidden');
                    setSelectedBlogModal(null);
                  }}
                  className={`px-4.5 py-2.5 border font-extrabold text-xs rounded-xl cursor-pointer transition-colors ${
                    selectedBlogModal.status === 'Hidden'
                      ? 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-800'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  }`}
                >
                  {selectedBlogModal.status === 'Hidden' ? 'Unhide' : 'Hide'}
                </button>
                {selectedBlogModal.status !== 'Approved' && selectedBlogModal.status !== 'Rejected' && (
                  <>
                    <button 
                      onClick={() => {
                        handleBlogAction(selectedBlogModal._id, 'Rejected');
                        setSelectedBlogModal(null);
                      }}
                      className="px-4.5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-extrabold text-xs rounded-xl cursor-pointer transition-colors"
                    >
                      Reject & Hide
                    </button>
                    <button 
                      onClick={() => {
                        handleBlogAction(selectedBlogModal._id, 'Approved');
                        setSelectedBlogModal(null);
                      }}
                      className="px-5 py-2.5 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs rounded-xl cursor-pointer transition-all shadow shadow-emerald-800/10"
                    >
                      Approve & Publish
                    </button>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {showAddDirectoryModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-end p-0">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between animate-slideLeft text-left font-sans">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-black text-[#027244] uppercase tracking-widest">Directory Panel</span>
                <h3 className="font-extrabold text-[#001c41] text-base mt-1">Add Directory Listing</h3>
              </div>
              <button 
                onClick={() => { setShowAddDirectoryModal(false); resetDirectoryForm(); }}
                className="h-8.5 w-8.5 rounded-xl hover:bg-slate-200/80 flex items-center justify-center text-slate-450 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 flex-grow overflow-y-auto flex flex-col gap-5">
              
              {/* Google Autofill Section */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-3">
                <label className="text-xs font-black text-slate-700">Google Maps / GMB Link (Auto-fill)</label>
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="url"
                      placeholder="Paste Google Maps or GMB Link..."
                      value={dirGmbLink}
                      onChange={(e) => setDirGmbLink(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-205 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#027244]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleDirLinkAutofill}
                    disabled={dirAutofillLoading || !dirGmbLink.trim()}
                    className="px-4 py-2 bg-[#027244] hover:bg-[#005934] disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-xl cursor-pointer transition-colors shadow shadow-emerald-800/10 flex items-center gap-1 shrink-0"
                  >
                    {dirAutofillLoading ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Fetching...
                      </>
                    ) : (
                      'Autofill'
                    )}
                  </button>
                </div>
                {dirAutofillLoading && (
                  <div className="text-[10px] text-[#027244] font-bold flex items-center gap-1">
                    <RefreshCw className="h-3 w-3 animate-spin" /> Importing details from Google...
                  </div>
                )}
                {dirAutofillSuccess && (
                  <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Details, photos, and ratings imported successfully.
                  </div>
                )}
              </div>

              {/* Directory Listing Form Fields */}
              <div className="flex flex-col gap-4">
                
                {/* Business Name */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10.5px] font-black text-slate-700 uppercase">Business Name *</label>
                  <input
                    type="text"
                    required
                    value={dirForm.name}
                    onChange={(e) => setDirForm({ ...dirForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#027244]"
                    placeholder="e.g. Taluk Office"
                  />
                </div>

                {/* Main Category Selector / Input */}
                <div className="flex flex-col gap-1.5 text-left">
                  <div className="flex justify-between items-center">
                    <label className="text-[10.5px] font-black text-slate-700 uppercase">Main Category *</label>
                    {(isCustomMain || (dirForm.requestedParentCategory !== '' && !getAdminDynamicMainCategories().includes(dirForm.requestedParentCategory))) && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomMain(false);
                          setDirForm(prev => ({
                            ...prev,
                            requestedParentCategory: '',
                            category: '',
                            customCategoryName: '',
                            categoryStatus: 'Normal'
                          }));
                        }}
                        className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold underline focus:outline-hidden"
                      >
                        Choose Standard
                      </button>
                    )}
                  </div>
                  {(isCustomMain || (dirForm.requestedParentCategory !== '' && !getAdminDynamicMainCategories().includes(dirForm.requestedParentCategory))) ? (
                    <input
                      type="text"
                      placeholder="Specify Custom Main Category (e.g. Tourism, Logistics)"
                      required
                      value={getAdminDynamicMainCategories().includes(dirForm.requestedParentCategory) ? '' : dirForm.requestedParentCategory}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDirForm({
                          ...dirForm,
                          requestedParentCategory: val,
                          category: 'Others',
                          categoryStatus: 'Pending Review'
                        });
                      }}
                      className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#027244]"
                    />
                  ) : (
                    <select
                      required
                      value={getAdminDynamicMainCategories().includes(dirForm.requestedParentCategory) ? dirForm.requestedParentCategory : ''}
                      onChange={(e) => {
                        const parentVal = e.target.value;
                        if (parentVal === 'Others') {
                          setIsCustomMain(true);
                          setDirForm({
                            ...dirForm,
                            requestedParentCategory: '',
                            category: 'Others',
                            customCategoryName: '',
                            categoryStatus: 'Pending Review'
                          });
                        } else {
                          const subs = getAdminDynamicSubcategories(parentVal);
                          const subVal = subs[0] || '';
                          setDirForm({
                            ...dirForm,
                            requestedParentCategory: parentVal,
                            category: subVal,
                            customCategoryName: '',
                            categoryStatus: 'Normal'
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-205 bg-white rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#027244] cursor-pointer"
                    >
                      <option value="">-- Choose Main Category --</option>
                      {getAdminDynamicMainCategories().map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Subcategory Selector / Input */}
                {dirForm.requestedParentCategory !== '' && (
                  <div className="flex flex-col gap-1.5 text-left animate-fadeIn">
                    <div className="flex justify-between items-center">
                      <label className="text-[10.5px] font-black text-slate-700 uppercase">Sub Category *</label>
                      {dirForm.category === 'Others' && !(isCustomMain || (dirForm.requestedParentCategory !== '' && !getAdminDynamicMainCategories().includes(dirForm.requestedParentCategory))) && (
                        <button
                          type="button"
                          onClick={() => {
                            const subs = getAdminDynamicSubcategories(dirForm.requestedParentCategory);
                            const subVal = subs[0] || '';
                            setDirForm(prev => ({
                              ...prev,
                              category: subVal,
                              customCategoryName: '',
                              categoryStatus: 'Normal'
                            }));
                          }}
                          className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold underline focus:outline-hidden"
                        >
                          Choose Standard
                        </button>
                      )}
                    </div>
                    {dirForm.category === 'Others' ? (
                      <input
                        type="text"
                        placeholder="Specify Custom Subcategory (e.g. EV Charging Station, Solar Solutions)"
                        required
                        value={dirForm.customCategoryName || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDirForm({
                            ...dirForm,
                            customCategoryName: val,
                            categoryStatus: 'Pending Review'
                          });
                        }}
                        className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#027244]"
                      />
                    ) : (
                      <select
                        required
                        value={getAdminDynamicSubcategories(dirForm.requestedParentCategory).includes(dirForm.category) ? dirForm.category : ''}
                        onChange={(e) => {
                          const subVal = e.target.value;
                          const isCustomParent = !getAdminDynamicMainCategories().includes(dirForm.requestedParentCategory);
                          setDirForm({
                            ...dirForm,
                            category: subVal,
                            customCategoryName: '',
                            categoryStatus: (subVal === 'Others' || isCustomParent) ? 'Pending Review' : 'Normal'
                          });
                        }}
                        className="w-full px-3 py-2 border border-slate-205 bg-white rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#027244] cursor-pointer"
                      >
                        <option value="">-- Choose Subcategory --</option>
                        {getAdminDynamicSubcategories(dirForm.requestedParentCategory).map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                        <option value="Others">Others (Custom Category)</option>
                      </select>
                    )}
                  </div>
                )}

                {/* Phone */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10.5px] font-black text-slate-700 uppercase">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={dirForm.phone}
                    onChange={(e) => setDirForm({ ...dirForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#027244]"
                    placeholder="e.g. 04252 223456"
                  />
                </div>

                {/* Website */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10.5px] font-black text-slate-700 uppercase">Website (Optional)</label>
                  <input
                    type="url"
                    value={dirForm.website}
                    onChange={(e) => setDirForm({ ...dirForm, website: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#027244]"
                    placeholder="e.g. https://udumalpet.nic.in"
                  />
                </div>

                {/* Location / Locality */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10.5px] font-black text-slate-700 uppercase">Location / Locality *</label>
                    <input
                      type="text"
                      required
                      value={dirForm.locality}
                      onChange={(e) => setDirForm({ ...dirForm, locality: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#027244]"
                      placeholder="e.g. Gandhi Nagar"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10.5px] font-black text-slate-700 uppercase">Pincode (Optional)</label>
                    <input
                      type="text"
                      value={dirForm.pincode}
                      onChange={(e) => setDirForm({ ...dirForm, pincode: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#027244]"
                      placeholder="e.g. 642126"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10.5px] font-black text-slate-700 uppercase">Address *</label>
                  <textarea
                    required
                    rows={2}
                    value={dirForm.address}
                    onChange={(e) => setDirForm({ ...dirForm, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#027244]"
                    placeholder="e.g. Palani Road, Gandhi Nagar, Udumalpet"
                  />
                </div>

                {/* Google Maps Link */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10.5px] font-black text-slate-700 uppercase">Google Maps Link</label>
                  <input
                    type="url"
                    value={dirForm.googleMapsLocation}
                    onChange={(e) => setDirForm({ ...dirForm, googleMapsLocation: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#027244]"
                    placeholder="e.g. https://maps.google.com/?q=..."
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10.5px] font-black text-slate-700 uppercase">Description (Optional)</label>
                  <textarea
                    rows={3}
                    value={dirForm.description}
                    onChange={(e) => setDirForm({ ...dirForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#027244]"
                    placeholder="Describe this listing..."
                  />
                </div>

                {/* Google Ratings and Reviews */}
                <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 mt-2">
                  <div className="flex flex-col gap-1.5 text-left">
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-450" />
                      <label className="text-[10.5px] font-black text-slate-700 uppercase">Google Rating</label>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={dirForm.googleRating || ''}
                      onChange={(e) => setDirForm({ ...dirForm, googleRating: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#027244]"
                      placeholder="e.g. 4.5"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10.5px] font-black text-slate-700 uppercase">Reviews Count</label>
                    <input
                      type="number"
                      min="0"
                      value={dirForm.googleReviewsCount || ''}
                      onChange={(e) => setDirForm({ ...dirForm, googleReviewsCount: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#027244]"
                      placeholder="e.g. 48"
                    />
                  </div>
                </div>

                {/* Logo Image Upload */}
                <div className="flex flex-col gap-1.5 text-left border-t border-slate-100 pt-4 mt-2">
                  <label className="text-[10.5px] font-black text-slate-700 uppercase">Logo Image</label>
                  <div className="flex items-center gap-4">
                    <div className="relative h-20 w-20 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden shrink-0 group">
                      {dirForm.logoUrl ? (
                        <>
                          <img src={dirForm.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setDirForm({ ...dirForm, logoUrl: '' })}
                            className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer border-none"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </>
                      ) : logoUploading ? (
                        <RefreshCw className="h-6 w-6 animate-spin text-[#027244]" />
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center justify-center text-slate-400 hover:text-[#027244] transition-colors w-full h-full">
                          <Upload className="h-5 w-5" />
                          <span className="text-[9px] font-bold mt-1">Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-750">Business Logo</span>
                      <span className="text-[10px] text-slate-400 font-semibold mt-1">Upload a square logo. Max size 5MB.</span>
                      {dirForm.logoUrl && (
                        <span className="text-[9.5px] text-[#027244] font-bold mt-1.5 truncate max-w-xs">{dirForm.logoUrl}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cover Image Upload */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10.5px] font-black text-slate-700 uppercase">Cover Image</label>
                  <div className="relative h-36 w-full rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden group">
                    {dirForm.coverImageUrl ? (
                      <>
                        <img src={dirForm.coverImageUrl} alt="Cover Banner" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setDirForm({ ...dirForm, coverImageUrl: '' })}
                          className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer border-none"
                        >
                          <div className="flex items-center gap-1.5 bg-rose-600 px-3 py-1.5 rounded-lg text-xs font-bold shadow-md">
                            <Trash2 className="h-4 w-4" /> Remove Cover
                          </div>
                        </button>
                      </>
                    ) : coverUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="h-7 w-7 animate-spin text-[#027244]" />
                        <span className="text-[10px] text-slate-400 font-bold">Uploading Cover...</span>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center justify-center text-slate-400 hover:text-[#027244] transition-colors w-full h-full p-4">
                        <Upload className="h-6 w-6" />
                        <span className="text-xs font-extrabold mt-1">Upload Cover Photo</span>
                        <span className="text-[10px] text-slate-450 font-semibold mt-0.5">High-quality landscape banner. Max size 5MB.</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  {dirForm.coverImageUrl && (
                    <span className="text-[9.5px] text-[#027244] font-bold truncate max-w-full">{dirForm.coverImageUrl}</span>
                  )}
                </div>

                {/* Gallery Images Upload */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10.5px] font-black text-slate-700 uppercase">Gallery Images</label>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Upload button card */}
                    <label className="h-20 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center text-slate-400 hover:text-[#027244] transition-colors cursor-pointer p-2 shrink-0">
                      {galleryUploading ? (
                        <RefreshCw className="h-5 w-5 animate-spin text-[#027244]" />
                      ) : (
                        <>
                          <Plus className="h-5 w-5" />
                          <span className="text-[9px] font-bold mt-1">Add Photo</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleGalleryUpload}
                        className="hidden"
                        disabled={galleryUploading}
                      />
                    </label>

                    {/* Previews */}
                    {dirForm.galleryUrls && dirForm.galleryUrls.map((url, idx) => (
                      <div key={idx} className="relative h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group">
                        <img src={url} alt={`Gallery ${idx + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            const newUrls = dirForm.galleryUrls.filter((_, i) => i !== idx);
                            setDirForm({ ...dirForm, galleryUrls: newUrls });
                          }}
                          className="absolute top-1 right-1 h-5 w-5 rounded-full bg-slate-950/70 text-white flex items-center justify-center hover:bg-rose-600 transition-colors cursor-pointer border-none"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold mt-1">Select multiple photos for your business gallery. Max size 5MB each.</span>
                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3 shrink-0">
              <button
                type="button"
                onClick={() => { setShowAddDirectoryModal(false); resetDirectoryForm(); }}
                className="flex-1 py-3 border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs rounded-xl text-center transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={dirSubmitLoading || !dirForm.name || !dirForm.requestedParentCategory || !dirForm.category || !dirForm.address || !dirForm.locality || !dirForm.phone || (dirForm.category === 'Others' && !dirForm.customCategoryName?.trim())}
                onClick={handlePublishDirListing}
                className="flex-1 py-3 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs rounded-xl text-center shadow shadow-emerald-800/10 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {dirSubmitLoading ? 'Publishing...' : 'Publish Listing'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
