import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useNavigate, Link, useParams } from 'react-router-dom';
import { 
  Search, MapPin, Grid, List, Star, ShieldCheck, HeartHandshake, PhoneCall, 
  Filter, RefreshCw, AlertCircle, Sparkles, Folder, Check, ArrowRight, ArrowLeft, 
  ChevronDown, ChevronUp, Users, Car, GraduationCap, Tv, Utensils, 
  HeartPulse, Home as HomeIcon, Building, ShoppingBag, Factory, Compass, 
  Wrench, Sprout, CreditCard, Dumbbell, Briefcase, Mail, Info, Clock,
  Activity, Leaf, Coins, Camera, Plane, Landmark, Store, X, Globe, Upload,
  Zap, Smartphone, Hotel, Laptop, Gem, Scale, Heart, Truck, Smile, PawPrint,
  Printer, Sun, Key, Shield, Droplet
} from 'lucide-react';
import AboutUsView from '../../components/AboutUsView';

const lucideIcons = {
  Search, MapPin, Grid, List, Star, ShieldCheck, HeartHandshake, PhoneCall, 
  Filter, RefreshCw, AlertCircle, Sparkles, Folder, Check, ArrowRight, ArrowLeft, 
  ChevronDown, ChevronUp, Users, Car, GraduationCap, Tv, Utensils, 
  HeartPulse, HomeIcon, Building, ShoppingBag, Factory, Compass, 
  Wrench, Sprout, CreditCard, Dumbbell, Briefcase, Mail, Info, Clock,
  Activity, Leaf, Coins, Camera, Plane, Landmark, Store, X, Globe, Upload,
  Zap, Smartphone, Hotel, Laptop, Gem, Scale, Heart, Truck, Smile, PawPrint,
  Printer, Sun, Key, Shield, Droplet
};

const renderCategoryIcon = (iconName, className = "h-4.5 w-4.5") => {
  const IconComp = lucideIcons[iconName] || Store;
  return <IconComp className={className} />;
};

const isGovernmentalOrPublic = (biz) => {
  if (!biz) return false;
  const parent = (biz.requestedParentCategory || '').toLowerCase();
  const cat = (biz.category || '').toLowerCase();
  
  const govParents = ['governmental organisations', 'government organisations', 'governmental organisation', 'government organisation', 'public sector'];
  if (govParents.includes(parent)) return true;
  
  const govCats = ['taluk office', 'municipality', 'police stations', 'police station', 'hospitals', 'hospital', 'banks', 'bank', 'schools', 'school'];
  if (govCats.includes(cat)) return true;
  
  return false;
};


const parentIconStringMap = {
  'Automotive': 'Car',
  'Beauty & Wellness': 'Sparkles',
  'Education': 'GraduationCap',
  'Electronics': 'Tv',
  'Food & Restaurants': 'Utensils',
  'Health & Medical': 'HeartPulse',
  'Home Services': 'HomeIcon',
  'Real Estate': 'Building',
  'Shopping': 'ShoppingBag',
  'Manufacturing': 'Factory',
  'Professional Services': 'Briefcase',
  'Travel & Hospitality': 'Compass',
  'Construction': 'Wrench',
  'Agriculture': 'Sprout',
  'Finance & Insurance': 'CreditCard',
  'Events & Entertainment': 'Sparkles',
  'Sports & Fitness': 'Dumbbell',
  'Governmental organisations': 'Building',
  'Public Sector': 'Landmark'
};

const availableLocalities = [
  'Gandhi Nagar', 
  'Pollachi Road', 
  'Palladam Road', 
  'Coimbatore Road', 
  'Madathukulam Road',
  'Dharapuram Road',
  'Palani Road',
  'Dhali Road',
  'Kaniyur Road'
];

const staticData = [
  {
    _id: 'biz_1',
    name: 'Sri Murugan Stores',
    category: 'Shopping',
    locality: 'Gandhi Nagar',
    pincode: '642126',
    googleRating: 4.6,
    googleReviewsCount: 128,
    isPremium: true,
    isAddressVerified: true,
    subscriptionStatus: 'active',
    coverImageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80',
    phone: '+91 94430 12345',
    whatsapp: '+91 94430 12345',
    highlights: ['Quality Products', 'Good Service', 'Fair Prices'],
  },
  {
    _id: 'biz_2',
    name: 'Green Valley Hotel',
    category: 'Food & Restaurants',
    locality: 'Pollachi Road',
    pincode: '642128',
    googleRating: 4.8,
    googleReviewsCount: 98,
    isPremium: true,
    isAddressVerified: true,
    subscriptionStatus: 'active',
    coverImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80',
    phone: '+91 98945 99999',
    whatsapp: '+91 98945 99999',
    highlights: ['Pure Veg', 'Family Restaurant', 'AC Rooms'],
  },
  {
    _id: 'biz_3',
    name: 'R.K. Electricals',
    category: 'Home Services',
    locality: 'Pollachi Road',
    pincode: '642126',
    googleRating: 4.7,
    googleReviewsCount: 84,
    isPremium: false,
    isAddressVerified: true,
    subscriptionStatus: 'active',
    coverImageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&q=80',
    phone: '+91 98945 43100',
    whatsapp: '+91 98945 43100',
    highlights: ['On-time Service', 'Expert Technicians', 'Warranty'],
  },
  {
    _id: 'biz_4',
    name: 'City Hospital',
    category: 'Health & Medical',
    locality: 'Dharapuram Road',
    pincode: '642126',
    googleRating: 4.5,
    googleReviewsCount: 206,
    isPremium: true,
    isAddressVerified: false,
    subscriptionStatus: 'active',
    coverImageUrl: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=500&q=80',
    phone: '+91 4252 223456',
    whatsapp: '+91 98425 22345',
    highlights: ['24x7 Service', 'Experienced Doctors', 'Pharmacy'],
  },
  {
    _id: 'biz_5',
    name: 'Siva Soft Solutions',
    category: 'Professional Services',
    locality: 'Gandhi Nagar',
    pincode: '642126',
    googleRating: 4.6,
    googleReviewsCount: 61,
    isPremium: false,
    isAddressVerified: true,
    subscriptionStatus: 'active',
    coverImageUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&q=80',
    phone: '+91 97895 43210',
    whatsapp: '+91 97895 43210',
    highlights: ['Web Development', 'Digital Marketing', 'Support'],
  },
  {
    _id: 'biz_6',
    name: 'Glamour Ladies Salon',
    category: 'Beauty & Wellness',
    locality: 'Coimbatore Road',
    pincode: '642126',
    googleRating: 4.4,
    googleReviewsCount: 53,
    isPremium: false,
    isAddressVerified: true,
    subscriptionStatus: 'expired',
    coverImageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&q=80',
    phone: '+91 98432 12345',
    whatsapp: '+91 98432 12345',
    highlights: ['Hair Styling', 'Skin Care', 'Bridal Makeup'],
  },
];

function BusinessesList({ forceFocus }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('ubt_user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to parse user from local storage', err);
      }
    }
  }, []);

  // Search & Filter state variables
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All Categories');
  const [selectedLocality, setSelectedLocality] = useState(searchParams.get('locality') || 'All Localities');
  const [showHints, setShowHints] = useState(false);
  const [suggestions, setSuggestions] = useState({ categories: [], businesses: [] });

  // Debounced autocomplete suggestions API fetch
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions({ categories: [], businesses: [] });
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/businesses/suggest?q=${encodeURIComponent(searchTerm)}`);
        const data = await res.json();
        if (data.success) {
          setSuggestions({
            categories: data.categories || [],
            businesses: data.businesses || []
          });
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      }
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);
  
  // Sidebar checkbox states
  const [checkedCategories, setCheckedCategories] = useState({});
  const [checkedLocalities, setCheckedLocalities] = useState({});
  const [selectedRating, setSelectedRating] = useState(null);
  const [verifiedFilter, setVerifiedFilter] = useState(false);
  const [premiumFilter, setPremiumFilter] = useState(false);

  // Sidebar live text searches
  const [categorySearchText, setCategorySearchText] = useState('');
  const [localitySearchText, setLocalitySearchText] = useState('');
  const [showAllLocalities, setShowAllLocalities] = useState(false);

  const [businesses, setBusinesses] = useState([]);
  const [visibleCategoryLimit, setVisibleCategoryLimit] = useState(12);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('list'); // list | grid
  const [sortBy, setSortBy] = useState('Most Relevant');
  const [currentPage, setCurrentPage] = useState(1);
  const [explorePage, setExplorePage] = useState(1);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [categoriesSearchQuery, setCategoriesSearchQuery] = useState('');
  const [allBusinesses, setAllBusinesses] = useState([]);
  const [selectedCategoryInExplore, setSelectedCategoryInExplore] = useState(searchParams.get('category') || null);
  const [selectedSubcategoryInExplore, setSelectedSubcategoryInExplore] = useState(searchParams.get('subcategory') || null);
  const [showTop7Only, setShowTop7Only] = useState(false);
  const [dbCategories, setDbCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const { id: urlSlug } = useParams();

  const normalizeRobust = (str) => {
    if (!str) return '';
    return str.toLowerCase()
      .replace(/ & /g, '-and-')
      .replace(/&/g, 'and')
      .replace(/\band\b/g, '')
      .replace(/[^a-z0-9]/g, '');
  };

  const getCategorySlug = (name) => {
    if (!name) return '';
    const slug = name.toLowerCase()
      .replace(/ & /g, '-and-')
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return `/${slug}-in-udumalpet`;
  };

  const resolvedFromSlug = useMemo(() => {
    console.log('[SlugRoute] urlSlug is:', urlSlug, 'dbCategories length:', dbCategories.length);
    if (!urlSlug || !urlSlug.toLowerCase().endsWith('-in-udumalpet')) {
      return null;
    }
    const targetSlug = urlSlug.replace(/-in-udumalpet$/i, ''); // Remove '-in-udumalpet'
    const normSlug = normalizeRobust(targetSlug);
    console.log('[SlugRoute] targetSlug:', targetSlug, 'normSlug:', normSlug);
    
    // Check if the slug matches any unique parentCategory dynamically
    const uniqueParents = Array.from(new Set(dbCategories.map(c => c.parentCategory).filter(p => p && p.trim() !== '' && p !== 'Others')));
    const matchedParent = uniqueParents.find(parent => normalizeRobust(parent) === normSlug);
    if (matchedParent) {
      console.log('[SlugRoute] MATCHED parent category:', matchedParent);
      return { type: 'category', value: matchedParent };
    }

    for (const cat of dbCategories) {
      const normCatName = normalizeRobust(cat.categoryName);
      console.log('[SlugRoute] comparing category:', cat.categoryName, 'norm:', normCatName, 'with:', normSlug);
      if (normCatName === normSlug) {
        console.log('[SlugRoute] MATCHED category:', cat.categoryName);
        if (cat.parentCategory && cat.parentCategory !== 'None' && cat.parentCategory.trim() !== '') {
          return { type: 'subcategory', value: cat.categoryName, parent: cat.parentCategory };
        }
        return { type: 'category', value: cat.categoryName };
      }
      const matchedSub = (cat.subcategories || []).find(sub => {
        const normSub = normalizeRobust(sub);
        console.log('[SlugRoute] comparing subcategory:', sub, 'norm:', normSub, 'with:', normSlug);
        return normSub === normSlug;
      });
      if (matchedSub) {
        console.log('[SlugRoute] MATCHED subcategory:', matchedSub);
        return { type: 'subcategory', value: matchedSub, parent: cat.categoryName };
      }
    }
    console.log('[SlugRoute] NO MATCH FOUND');
    return null;
  }, [urlSlug, dbCategories]);

  const focusParam = forceFocus || searchParams.get('focus');
  const isCategoriesView = focusParam === 'categories' || !!resolvedFromSlug;

  const initialAnonForm = {
    name: '',
    requestedParentCategory: 'Public Sector',
    category: '',
    customCategoryName: '',
    address: '',
    locality: '',
    phone: '',
    website: '',
    googleMapsLocation: '',
    googlePlaceId: '',
    pincode: '642126',
    latitude: 10.5891,
    longitude: 77.2412,
    description: '',
    googleRating: 0,
    googleReviewsCount: 0,
    googleReviews: [],
    logoUrl: '',
    coverImageUrl: '',
    galleryUrls: []
  };

  const [showAnonymousAddModal, setShowAnonymousAddModal] = useState(false);
  const [anonForm, setAnonForm] = useState(initialAnonForm);
  const [anonGmbLink, setAnonGmbLink] = useState('');
  const [anonAutofillLoading, setAnonAutofillLoading] = useState(false);
  const [anonAutofillSuccess, setAnonAutofillSuccess] = useState(false);
  const [anonSubmitLoading, setAnonSubmitLoading] = useState(false);
  const [isAnonCustomSub, setIsAnonCustomSub] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  // Draft business state — shown when user is logged in but hasn't completed registration
  const [draftBusiness, setDraftBusiness] = useState(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('ubt_token');
    if (!token) return;
    (async () => {
      try {
        const res = await fetch('http://localhost:5000/api/businesses/my-business', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.data) {
          const biz = data.data;
          // Check if it's a draft (missing required fields)
          const isDraft = !biz.name || !biz.category || !biz.description || !biz.phone || !biz.pincode || !biz.address;
          if (isDraft) {
            setDraftBusiness(biz);
            setShowDraftBanner(true);
          }
        }
      } catch (err) {
        // Silently ignore errors
      }
    })();
  }, []);


  const getDraftResumeStep = (biz) => {
    if (!biz) return 1;
    if (!biz.pincode) return 1;
    if (!biz.name || !biz.category) return 2;
    if (!biz.description) return 3;
    if (!biz.phone || !biz.address) return 4;
    return 5;
  };

  const resetAnonForm = () => {
    setAnonForm(initialAnonForm);
    setAnonGmbLink('');
    setAnonAutofillSuccess(false);
    setIsAnonCustomSub(false);
    setImageUploading(false);
  };

  useEffect(() => {
    if (!showAnonymousAddModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowAnonymousAddModal(false);
        resetAnonForm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAnonymousAddModal]);

  const handleAnonLinkAutofill = async () => {
    if (!anonGmbLink.trim()) return;
    setAnonAutofillLoading(true);
    setAnonAutofillSuccess(false);
    try {
      const isUrl = anonGmbLink.includes('http://') || anonGmbLink.includes('https://') || anonGmbLink.includes('google.com') || anonGmbLink.includes('goo.gl') || anonGmbLink.includes('share.google');
      const endpoint = isUrl ? 'google-autofill-link' : 'google-autofill';
      const body = isUrl ? { link: anonGmbLink } : { placeId: anonGmbLink };
      
      const res = await fetch(`http://localhost:5000/api/businesses/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      
      if (data.success && data.data) {
        const d = data.data;
        setAnonForm(prev => ({
          ...prev,
          name: d.name || prev.name,
          address: d.address || prev.address,
          locality: d.locality || prev.locality,
          phone: d.phone || prev.phone,
          website: d.website || prev.website,
          pincode: d.pincode || prev.pincode,
          googlePlaceId: d.googlePlaceId || prev.googlePlaceId,
          latitude: d.latitude || prev.latitude,
          longitude: d.longitude || prev.longitude,
          googleRating: d.googleRating || prev.googleRating,
          googleReviewsCount: d.googleReviewsCount || prev.googleReviewsCount,
          googleReviews: d.googleReviews || prev.googleReviews,
          logoUrl: d.logoUrl || prev.logoUrl,
          coverImageUrl: d.coverImageUrl || prev.coverImageUrl,
          galleryUrls: d.galleryUrls || prev.galleryUrls,
          googleMapsLocation: anonGmbLink
        }));
        setAnonAutofillSuccess(true);
      } else {
        alert(data.message || 'Failed to auto-fill details from Google link.');
      }
    } catch (err) {
      console.error('Error GMB link autofill:', err);
      alert('Network error fetching details from Google Link.');
    } finally {
      setAnonAutofillLoading(false);
    }
  };

  const handleAnonImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size must be less than 5MB.');
      return;
    }

    setImageUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('http://localhost:5000/api/upload/public', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        setAnonForm(prev => ({ ...prev, coverImageUrl: data.url }));
      } else {
        alert(data.message || 'Failed to upload image.');
      }
    } catch (err) {
      console.error('Image upload error:', err);
      alert('Network error uploading image.');
    } finally {
      setImageUploading(false);
    }
  };

  const handlePublishAnonListing = async () => {
    setAnonSubmitLoading(true);
    try {
      const payload = {
        name: anonForm.name || 'Unnamed Public Listing',
        requestedParentCategory: 'Public Sector',
        category: anonForm.category || 'Others',
        customCategoryName: anonForm.category === 'Others' ? (anonForm.customCategoryName || 'Others') : '',
        address: anonForm.address,
        locality: anonForm.locality,
        phone: anonForm.phone,
        website: anonForm.website,
        googleMapsLocation: anonForm.googleMapsLocation,
        googlePlaceId: anonForm.googlePlaceId,
        pincode: anonForm.pincode,
        latitude: anonForm.latitude,
        longitude: anonForm.longitude,
        description: anonForm.description,
        googleRating: anonForm.googleRating,
        googleReviewsCount: anonForm.googleReviewsCount,
        googleReviews: anonForm.googleReviews,
        logoUrl: anonForm.logoUrl,
        coverImageUrl: anonForm.coverImageUrl,
        galleryUrls: anonForm.galleryUrls
      };
      
      const res = await fetch('http://localhost:5000/api/businesses/anonymous-add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert('Your listing has been submitted successfully and is pending admin approval.');
        setShowAnonymousAddModal(false);
        resetAnonForm();
      } else {
        alert(data.message || 'Failed to submit listing');
      }
    } catch (err) {
      console.error('Error submitting listing:', err);
      alert('Network error submitting listing');
    } finally {
      setAnonSubmitLoading(false);
    }
  };

  const renderFilterContent = (isMobile = false) => {
    return (
      <>
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <span className="font-extrabold text-sm text-[#001c41] flex items-center gap-1.5 font-sans">
            <Filter className="h-4.5 w-4.5 text-[#027244]" /> Filter Businesses
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                handleResetFilters();
                if (isMobile) setShowMobileFilters(false);
              }}
              className="text-xs font-bold text-[#027244] hover:underline cursor-pointer bg-transparent border-none"
            >
              Reset All
            </button>
            {isMobile && (
              <button 
                onClick={() => setShowMobileFilters(false)}
                className="text-slate-400 hover:text-slate-600 p-1 bg-slate-50 hover:bg-slate-100 rounded-full cursor-pointer ml-1 flex items-center justify-center h-6 w-6 border-none"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Checkboxes */}
        <div className="flex flex-col gap-2.5 border-b border-slate-100 pb-5">
          <h4 className="font-extrabold text-xs text-[#001c41] uppercase tracking-wider text-left">Category</h4>
          
          {/* Live Search Category Box */}
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search category" 
              value={categorySearchText}
              onChange={(e) => setCategorySearchText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#027244]"
            />
          </div>

          <div className="flex flex-col gap-2 mt-2 max-h-56 overflow-y-auto pr-1">
            {/* All Categories Checkbox */}
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none text-left">
              <input
                type="checkbox"
                checked={selectedCategory === 'All Categories'}
                onChange={(e) => handleCategoryCheckbox('All Categories', e.target.checked)}
                className="h-4 w-4 text-[#027244] border-slate-300 rounded focus:ring-[#027244]"
              />
              <span>All Categories</span>
            </label>

            {filteredCategories.map((c) => (
              <label key={c} className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none text-left">
                <input
                  type="checkbox"
                  checked={!!checkedCategories[c]}
                  onChange={(e) => handleCategoryCheckbox(c, e.target.checked)}
                  className="h-4 w-4 text-[#027244] border-slate-300 rounded focus:ring-[#027244]"
                />
                <span>{c}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Location Area Checkboxes */}
        <div className="flex flex-col gap-2.5 border-b border-slate-100 pb-5">
          <h4 className="font-extrabold text-xs text-[#001c41] uppercase tracking-wider text-left">Location</h4>
          
          {/* Live Search Location Box */}
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search location" 
              value={localitySearchText}
              onChange={(e) => setLocalitySearchText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#027244]"
            />
          </div>

          <div className="flex flex-col gap-2 mt-2">
            {/* Udumalpet checkbox acting as parent/all */}
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none text-left">
              <input
                type="checkbox"
                checked={selectedLocality === 'All Localities'}
                onChange={(e) => handleLocalityCheckbox('Udumalpet', e.target.checked)}
                className="h-4 w-4 text-[#027244] border-slate-300 rounded focus:ring-[#027244]"
              />
              <span>Udumalpet</span>
            </label>

            {displayedLocalities.map((l) => (
              <label key={l} className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none text-left">
                <input
                  type="checkbox"
                  checked={!!checkedLocalities[l]}
                  onChange={(e) => handleLocalityCheckbox(l, e.target.checked)}
                  className="h-4 w-4 text-[#027244] border-slate-300 rounded focus:ring-[#027244]"
                />
                <span>{l}</span>
              </label>
            ))}

            {filteredLocalities.length > 5 && (
              <button 
                onClick={() => setShowAllLocalities(!showAllLocalities)}
                className="text-[#027244] hover:text-[#005934] font-bold text-xs flex items-center gap-0.5 mt-1 cursor-pointer bg-transparent border-none text-left"
              >
                {showAllLocalities ? (
                  <>Show Less <ChevronUp className="h-3.5 w-3.5" /></>
                ) : (
                  <>Show More <ChevronDown className="h-3.5 w-3.5" /></>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Ratings Filters Checkboxes */}
        <div className="flex flex-col gap-2.5 border-b border-slate-100 pb-5">
          <h4 className="font-extrabold text-xs text-[#001c41] uppercase tracking-wider text-left">Rating</h4>
          <div className="flex flex-col gap-2.5 mt-1">
            {[4, 3, 2, 1].map((r) => (
              <label key={r} className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none text-left">
                <input 
                  type="checkbox"
                  checked={selectedRating === r}
                  onChange={() => {
                    const nextRating = selectedRating === r ? null : r;
                    setSelectedRating(nextRating);
                    triggerQueryUpdate(undefined, undefined, undefined, undefined, nextRating);
                  }}
                  className="h-4 w-4 text-[#027244] border-slate-300 rounded focus:ring-[#027244]"
                />
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-3 w-3 ${i < r ? 'fill-current' : 'text-slate-200'}`} />
                  ))}
                </div>
                <span>({r} & above)</span>
              </label>
            ))}
          </div>
        </div>

        {/* Business verified/premium visibility toggle */}
        <div className="flex flex-col gap-2.5 pb-4">
          <h4 className="font-extrabold text-xs text-[#001c41] uppercase tracking-wider text-left">Business Type</h4>
          <div className="flex flex-col gap-2.5 mt-1">
            <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-600 cursor-pointer select-none text-left">
              <input
                type="checkbox"
                checked={verifiedFilter}
                onChange={(e) => {
                  const nextVerified = e.target.checked;
                  setVerifiedFilter(nextVerified);
                  triggerQueryUpdate(undefined, undefined, nextVerified, undefined, undefined);
                }}
                className="h-4 w-4 text-[#027244] border-slate-300 rounded focus:ring-[#027244]"
              />
              <span>Verified Businesses</span>
            </label>
            <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-600 cursor-pointer select-none text-left">
              <input
                type="checkbox"
                checked={premiumFilter}
                onChange={(e) => {
                  const nextPremium = e.target.checked;
                  setPremiumFilter(nextPremium);
                  triggerQueryUpdate(undefined, undefined, undefined, nextPremium, undefined);
                }}
                className="h-4 w-4 text-[#027244] border-slate-300 rounded focus:ring-[#027244]"
              />
              <span>Premium Businesses</span>
            </label>
          </div>
        </div>

        {/* Apply Filters Green Button */}
        <button 
          onClick={() => {
            fetchBusinesses();
            if (isMobile) setShowMobileFilters(false);
          }}
          className="w-full bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md shrink-0 cursor-pointer text-center border-none"
        >
          Apply Filters
        </button>
      </>
    );
  };

  // Contact form state variables
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(null);
  const [contactError, setContactError] = useState('');

  const parentCategoryStylesMap = {
    'Agriculture & Farming': { icon: 'Leaf', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    'Automobile Services': { icon: 'Car', bg: 'bg-red-50', text: 'text-red-500' },
    'Baby & Kids Stores': { icon: 'ShoppingBag', bg: 'bg-pink-50', text: 'text-pink-500' },
    'Beauty Salons & Spa': { icon: 'Sparkles', bg: 'bg-pink-50', text: 'text-pink-500' },
    'Books & Stationery': { icon: 'BookOpen', bg: 'bg-blue-50', text: 'text-blue-500' },
    'Builders & Contractors': { icon: 'Building', bg: 'bg-indigo-50', text: 'text-indigo-500' },
    'Building Materials': { icon: 'Building', bg: 'bg-slate-50', text: 'text-slate-500' },
    'Business Services': { icon: 'Briefcase', bg: 'bg-emerald-50', text: 'text-emerald-500' },
    'Clothing & Fashion': { icon: 'ShoppingBag', bg: 'bg-amber-50', text: 'text-amber-500' },
    'Doctors & Healthcare': { icon: 'Activity', bg: 'bg-red-50', text: 'text-red-500' },
    'Electrical & Solar': { icon: 'Zap', bg: 'bg-amber-50', text: 'text-amber-500' },
    'Electronics & Mobiles': { icon: 'Smartphone', bg: 'bg-emerald-50', text: 'text-emerald-500' },
    'Finance & Insurance': { icon: 'Coins', bg: 'bg-blue-50', text: 'text-blue-500' },
    'Furniture & Home Decor': { icon: 'HomeIcon', bg: 'bg-teal-50', text: 'text-teal-500' },
    'Grocery & Food Stores': { icon: 'ShoppingBag', bg: 'bg-amber-50', text: 'text-amber-500' },
    'Home Services': { icon: 'Wrench', bg: 'bg-teal-50', text: 'text-teal-500' },
    'Hotels & Lodges': { icon: 'Hotel', bg: 'bg-purple-50', text: 'text-purple-500' },
    'Internet & Telecom': { icon: 'Globe', bg: 'bg-blue-50', text: 'text-blue-500' },
    'IT & Digital Services': { icon: 'Laptop', bg: 'bg-emerald-50', text: 'text-emerald-500' },
    'Jewellery Shops': { icon: 'Gem', bg: 'bg-amber-50', text: 'text-amber-500' },
    'Legal & Document Services': { icon: 'Scale', bg: 'bg-slate-50', text: 'text-slate-500' },
    'Manufacturers & Industries': { icon: 'Factory', bg: 'bg-slate-50', text: 'text-slate-500' },
    'NGOs & Social Services': { icon: 'Heart', bg: 'bg-red-50', text: 'text-red-500' },
    'Packers & Movers': { icon: 'Truck', bg: 'bg-orange-50', text: 'text-orange-500' },
    'Personal Services': { icon: 'Smile', bg: 'bg-indigo-50', text: 'text-indigo-500' },
    'Pet & Veterinary Services': { icon: 'PawPrint', bg: 'bg-green-50', text: 'text-green-500' },
    'Photography & Video': { icon: 'Camera', bg: 'bg-purple-50', text: 'text-purple-500' },
    'Printing & Advertising': { icon: 'Printer', bg: 'bg-slate-50', text: 'text-slate-500' },
    'Real Estate': { icon: 'Building', bg: 'bg-indigo-50', text: 'text-indigo-500' },
    'Religious Services': { icon: 'Sun', bg: 'bg-amber-50', text: 'text-amber-500' },
    'Rental Services': { icon: 'Key', bg: 'bg-blue-50', text: 'text-blue-500' },
    'Repair Services': { icon: 'Wrench', bg: 'bg-orange-50', text: 'text-orange-500' },
    'Restaurants & Food': { icon: 'Utensils', bg: 'bg-amber-50', text: 'text-amber-500' },
    'Schools & Colleges': { icon: 'GraduationCap', bg: 'bg-blue-50', text: 'text-blue-500' },
    'Security Services': { icon: 'Shield', bg: 'bg-slate-50', text: 'text-slate-500' },
    'Shops & Retail Stores': { icon: 'Store', bg: 'bg-emerald-50', text: 'text-emerald-500' },
    'Sports & Fitness': { icon: 'Dumbbell', bg: 'bg-emerald-50', text: 'text-emerald-500' },
    'Training & Coaching': { icon: 'GraduationCap', bg: 'bg-blue-50', text: 'text-blue-500' },
    'Travel & Transport': { icon: 'Plane', bg: 'bg-purple-50', text: 'text-purple-500' },
    'Water & Environmental Services': { icon: 'Droplet', bg: 'bg-blue-50', text: 'text-blue-500' },
    'Wedding & Event Services': { icon: 'Camera', bg: 'bg-pink-50', text: 'text-pink-500' },
    'Public Sector': { icon: 'Landmark', bg: 'bg-slate-50', text: 'text-slate-500' }
  };

  // Build dynamicCategoryDetails and dynamicAvailableCategories fully from dbCategories
  const parentCategoryViews = {};
  dbCategories.forEach(cat => {
    if (cat.parentCategory) {
      parentCategoryViews[cat.parentCategory] = (parentCategoryViews[cat.parentCategory] || 0) + (cat.views || 0);
    }
  });

  const dynamicAvailableCategories = Array.from(
    new Set(dbCategories.map(cat => cat.parentCategory).filter(p => p && p.trim() !== '' && p !== 'Others'))
  ).sort((a, b) => (parentCategoryViews[b] || 0) - (parentCategoryViews[a] || 0));

  const dynamicCategoryDetails = [];
  dynamicAvailableCategories.forEach(parentName => {
    const styles = parentCategoryStylesMap[parentName] || { icon: 'Store', bg: 'bg-emerald-50', text: 'text-emerald-500' };
    dynamicCategoryDetails.push({
      name: parentName,
      icon: renderCategoryIcon(styles.icon, `h-4.5 w-4.5 ${styles.text}`),
      bg: styles.bg
    });
  });

  const getParentCategory = useMemo(() => {
    const lookup = {};
    dbCategories.forEach(c => {
      if (c.categoryName) {
        lookup[c.categoryName.toLowerCase()] = c.parentCategory || 'Others';
      }
    });
    
    const dynamicAvailableCatsSet = new Set(dynamicAvailableCategories.map(p => p.toLowerCase()));

    return (subName) => {
      if (!subName) return 'Others';
      const lowerSub = subName.toLowerCase();
      const parent = lookup[lowerSub];
      if (parent && parent !== 'Others') {
        return parent;
      }
      if (dynamicAvailableCatsSet.has(lowerSub)) {
        return subName;
      }
      // If it exists in db and has no parentCategory, it is a main category itself
      const dbCat = dbCategories.find(c => c.categoryName.toLowerCase() === lowerSub);
      if (dbCat && !dbCat.parentCategory) {
        return dbCat.categoryName;
      }
      return 'Others';
    };
  }, [dbCategories, dynamicAvailableCategories]);

  const handleCategoryClick = async (categoryName) => {
    const parent = getParentCategory(categoryName);
    
    if (isCategoriesView) {
      if (urlSlug) {
        if (parent.toLowerCase() === categoryName.toLowerCase()) {
          navigate(`/businesses?focus=categories&category=${encodeURIComponent(parent)}`);
        } else {
          navigate(`/businesses?focus=categories&category=${encodeURIComponent(parent)}&subcategory=${encodeURIComponent(categoryName)}`);
        }
      } else {
        if (parent.toLowerCase() === categoryName.toLowerCase()) {
          setSearchParams({ focus: 'categories', category: parent });
        } else {
          setSearchParams({ focus: 'categories', category: parent, subcategory: categoryName });
        }
      }
    } else {
      if (parent.toLowerCase() === categoryName.toLowerCase()) {
        navigate(getCategorySlug(parent));
      } else {
        navigate(getCategorySlug(categoryName));
      }
    }
    
    // Background view increment
    try {
      await fetch('http://localhost:5000/api/categories/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryName })
      });
    } catch (err) {
      console.warn('Failed to increment category view:', err);
    }
  };

  const handleHotCategoryClick = async (categoryName, parentCatName) => {
    const parent = parentCatName || getParentCategory(categoryName);
    
    if (isCategoriesView) {
      if (urlSlug) {
        if (parent.toLowerCase() === categoryName.toLowerCase()) {
          navigate(`/businesses?focus=categories&category=${encodeURIComponent(parent)}`);
        } else {
          navigate(`/businesses?focus=categories&category=${encodeURIComponent(parent)}&subcategory=${encodeURIComponent(categoryName)}`);
        }
      } else {
        if (parent.toLowerCase() === categoryName.toLowerCase()) {
          setSearchParams({ focus: 'categories', category: parent });
        } else {
          setSearchParams({ focus: 'categories', category: parent, subcategory: categoryName });
        }
      }
    } else {
      if (parent.toLowerCase() === categoryName.toLowerCase()) {
        navigate(getCategorySlug(parent));
      } else {
        navigate(getCategorySlug(categoryName));
      }
    }
    
    // Background view increment
    try {
      await fetch('http://localhost:5000/api/categories/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryName })
      });
      
      setDbCategories(prev => prev.map(c => 
        c.categoryName === categoryName ? { ...c, views: (c.views || 0) + 1 } : c
      ));
    } catch (err) {
      console.warn('Failed to increment category view:', err);
    }
  };

  useEffect(() => {
    if (resolvedFromSlug) {
      if (resolvedFromSlug.type === 'category') {
        setSelectedCategoryInExplore(resolvedFromSlug.value);
        const subParam = searchParams.get('subcategory');
        setSelectedSubcategoryInExplore(subParam || null);
      } else {
        setSelectedCategoryInExplore(resolvedFromSlug.parent);
        setSelectedSubcategoryInExplore(resolvedFromSlug.value);
      }
    } else {
      const focusParam = searchParams.get('focus');
      if (focusParam === 'categories') {
        const catParam = searchParams.get('category');
        const subParam = searchParams.get('subcategory');
        setSelectedCategoryInExplore(catParam || null);
        setSelectedSubcategoryInExplore(subParam || null);
      } else {
        setSelectedCategoryInExplore(null);
        setSelectedSubcategoryInExplore(null);
      }
    }
    setExplorePage(1);
  }, [searchParams, urlSlug, resolvedFromSlug]);

  useEffect(() => {
    const fetchDbCategories = async () => {
      setCategoriesLoading(true);
      try {
        const res = await fetch('http://localhost:5000/api/categories');
        const data = await res.json();
        if (data.success) {
          setDbCategories(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch categories from database:', err);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchDbCategories();
  }, []);



  useEffect(() => {
    const fetchAllCounts = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/businesses');
        const data = await res.json();
        if (data.success) {
          setAllBusinesses(data.data);
        }
      } catch (err) {
        console.warn('API error, empty counts.');
        setAllBusinesses([]);
      }
    };
    fetchAllCounts();
  }, []);

  useEffect(() => {
    const counts = {};
    dynamicAvailableCategories.forEach(c => {
      counts[c] = 0;
    });
    dbCategories.forEach(cat => {
      if (!cat.parentCategory) {
        counts[cat.categoryName] = 0;
      }
    });
    allBusinesses.forEach(biz => {
      const parentCats = new Set();
      if (biz.categories && biz.categories.length > 0) {
        biz.categories.forEach(c => {
          if (c.categoryStatus !== 'Pending Review') {
            const parent = getParentCategory(c.category || '');
            if (parent) parentCats.add(parent);
          }
        });
      } else {
        const parent = getParentCategory(biz.category || '');
        if (parent) parentCats.add(parent);
      }
      
      parentCats.forEach(parent => {
        counts[parent] = (counts[parent] || 0) + 1;
      });
    });
    setCategoryCounts(counts);
  }, [allBusinesses, dbCategories]);

  // 1. Fetch businesses on searchParams change
  useEffect(() => {
    fetchBusinesses();
  }, [searchParams, urlSlug, dbCategories]);

  // 2. Synchronize checked filter states from searchParams on load, param update, or dbCategories load
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      if (cat === 'All Categories') {
        const allChecked = {};
        dynamicAvailableCategories.forEach(c => {
          allChecked[c] = true;
        });
        setCheckedCategories(allChecked);
        setSelectedCategory('All Categories');
      } else {
        const cats = cat.split(',');
        const catObj = {};
        cats.forEach(c => {
          if (c) {
            // Check if it's a parent category in dynamicAvailableCategories
            if (dynamicAvailableCategories.some(availCat => availCat.toLowerCase() === c.toLowerCase())) {
              const matchedParent = dynamicAvailableCategories.find(availCat => availCat.toLowerCase() === c.toLowerCase());
              catObj[matchedParent] = true;
            } else {
              // It is a subcategory, find its parent and check the parent box
              const parent = getParentCategory(c);
              if (parent && parent !== 'Others') {
                const matchedParent = dynamicAvailableCategories.find(availCat => availCat.toLowerCase() === parent.toLowerCase()) || parent;
                catObj[matchedParent] = true;
              }
            }
          }
        });
        setCheckedCategories(catObj);
        setSelectedCategory(cats[0]);
      }
    } else {
      setCheckedCategories({});
      setSelectedCategory('All Categories');
    }

    const loc = searchParams.get('locality');
    if (loc) {
      if (loc === 'All Localities') {
        setCheckedLocalities({});
        setSelectedLocality('All Localities');
      } else {
        const locs = loc.split(',');
        const locObj = {};
        locs.forEach(l => { 
          if (l) {
            // Case-insensitive search inside dynamicLocalities
            const matchedLoc = dynamicLocalities.find(availLoc => availLoc.toLowerCase() === l.toLowerCase()) || l;
            locObj[matchedLoc] = true; 
          }
        });
        setCheckedLocalities(locObj);
        setSelectedLocality(locs[0]);
      }
    } else {
      setCheckedLocalities({});
      setSelectedLocality('All Localities');
    }

    // Synchronize rating, verified, and type from searchParams
    const verifiedParam = searchParams.get('verified');
    setVerifiedFilter(verifiedParam === 'true');

    const premiumParam = searchParams.get('type');
    setPremiumFilter(premiumParam === 'Premium');

    const ratingParam = searchParams.get('rating');
    if (ratingParam) {
      setSelectedRating(parseFloat(ratingParam));
    } else {
      setSelectedRating(null);
    }
  }, [searchParams, dbCategories, allBusinesses]);

  const fetchBusinesses = async () => {
    setLoading(true);
    setError('');
    setCurrentPage(1);
    try {
      // Build API query string
      let url = 'http://localhost:5000/api/businesses?';
      
      const q = searchParams.get('q');
      if (q) url += `q=${encodeURIComponent(q)}&`;
      
      let cat = searchParams.get('category');
      if (resolvedFromSlug) {
        cat = resolvedFromSlug.value;
      }
      if (cat && cat !== 'All Categories') url += `category=${encodeURIComponent(cat)}&`;
      
      const loc = searchParams.get('locality');
      if (loc && loc !== 'All Localities') url += `locality=${encodeURIComponent(loc)}&`;

      const verifiedParam = searchParams.get('verified');
      if (verifiedParam === 'true') url += 'verified=true&';

      const premiumParam = searchParams.get('type');
      if (premiumParam === 'Premium') url += 'type=Premium&';

      const ratingParam = searchParams.get('rating');
      if (ratingParam) url += `rating=${encodeURIComponent(ratingParam)}&`;

      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success) {
        let results = data.data;

        // Apply sorting manually based on selection
        if (sortBy === 'Highest Rating') {
          results.sort((a, b) => b.googleRating - a.googleRating);
        } else if (sortBy === 'Newest') {
          results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        setBusinesses(results);
      }
    } catch (err) {
      console.warn('API error, empty results.');
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryHints = () => {
    if (!searchTerm.trim()) return [];
    
    const query = searchTerm.toLowerCase();
    const suggestions = [];
    const seenNames = new Set();
    
    // 1. Check parent categories (dynamicAvailableCategories)
    dynamicAvailableCategories.forEach(cat => {
      if (cat.toLowerCase().includes(query) && !seenNames.has(cat.toLowerCase()) && cat !== 'Others' && cat !== 'All Categories') {
        seenNames.add(cat.toLowerCase());
        suggestions.push({ name: cat, type: 'category' });
      }
    });
    
    // 2. Check DB subcategories
    if (Array.isArray(dbCategories)) {
      dbCategories.forEach(cat => {
        if (cat.categoryName && cat.categoryName.toLowerCase().includes(query) && !seenNames.has(cat.categoryName.toLowerCase())) {
          seenNames.add(cat.categoryName.toLowerCase());
          suggestions.push({ name: cat.categoryName, type: 'subcategory', parent: cat.parentCategory || 'Others' });
        }
      });
    }

    return suggestions.slice(0, 8); // Limit to 8 hints
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    
    // Smart category override: If they searched for a keyword that doesn't match
    // the currently selected category or its subcategories, reset to global search.
    let targetCat = selectedCategory;
    if (searchTerm.trim() && selectedCategory !== 'All Categories') {
      const query = searchTerm.toLowerCase();
      const isSubOfCurrent = Array.isArray(dbCategories) && dbCategories.some(cat => 
        cat.categoryName && cat.categoryName.toLowerCase().includes(query) && 
        cat.parentCategory === selectedCategory
      );
      const isCurrentCat = selectedCategory.toLowerCase().includes(query);
      
      if (!isSubOfCurrent && !isCurrentCat) {
        targetCat = 'All Categories';
        setSelectedCategory('All Categories');
        setCheckedCategories({});
      }
    }
    
    triggerQueryUpdate(targetCat, selectedLocality);
  };

  const triggerQueryUpdate = (newCat, newLoc, newVerified, newPremium, newRating, newSearch) => {
    const sTerm = newSearch !== undefined ? newSearch : searchTerm;
    let url = `/businesses?q=${encodeURIComponent(sTerm)}`;
    
    // category filter
    let cat = '';
    if (newCat !== undefined) {
      cat = newCat;
    } else {
      const activeCats = Object.keys(checkedCategories).filter(k => checkedCategories[k]);
      const allSelected = dynamicAvailableCategories.length > 0 && dynamicAvailableCategories.every(c => checkedCategories[c]);
      if (allSelected) {
        cat = 'All Categories';
      } else {
        cat = activeCats.join(',');
      }
    }
    if (cat) url += `&category=${encodeURIComponent(cat)}`;
    
    // locality filter
    let loc = '';
    if (newLoc !== undefined) {
      loc = newLoc === 'All Localities' || newLoc === 'Udumalpet' ? '' : newLoc;
    } else {
      const activeLocs = Object.keys(checkedLocalities).filter(k => checkedLocalities[k]);
      loc = activeLocs.join(',');
    }
    if (loc) url += `&locality=${encodeURIComponent(loc)}`;

    // verified filter
    const ver = newVerified !== undefined ? newVerified : verifiedFilter;
    if (ver) url += `&verified=true`;

    // premium filter
    const prem = newPremium !== undefined ? newPremium : premiumFilter;
    if (prem) url += `&type=Premium`;

    // rating filter
    const rat = newRating !== undefined ? newRating : selectedRating;
    if (rat) url += `&rating=${rat}`;

    navigate(url);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All Categories');
    setSelectedLocality('All Localities');
    setCheckedCategories({});
    setCheckedLocalities({});
    setSelectedRating(null);
    setVerifiedFilter(false);
    setPremiumFilter(false);
    navigate('/businesses');
  };

  const handleCategoryCheckbox = (cat, checked) => {
    if (cat === 'All Categories') {
      if (checked) {
        const allChecked = {};
        dynamicAvailableCategories.forEach(c => {
          allChecked[c] = true;
        });
        setCheckedCategories(allChecked);
        setSelectedCategory('All Categories');
        triggerQueryUpdate('All Categories', undefined);
      } else {
        setCheckedCategories({});
        setSelectedCategory('');
        triggerQueryUpdate('', undefined);
      }
    } else {
      const updated = { ...checkedCategories, [cat]: checked };
      setCheckedCategories(updated);
      const activeCats = Object.keys(updated).filter(key => updated[key] && key !== 'All Categories');
      
      const allSelected = dynamicAvailableCategories.every(c => updated[c]);
      if (allSelected || activeCats.length === 0) {
        setSelectedCategory('All Categories');
        triggerQueryUpdate('All Categories', undefined);
      } else {
        const catStr = activeCats.join(',');
        setSelectedCategory(activeCats[0]);
        triggerQueryUpdate(catStr, undefined);
      }
    }
  };

  const handleLocalityCheckbox = (loc, checked) => {
    if (loc === 'Udumalpet') {
      if (checked) {
        setCheckedLocalities({});
        setSelectedLocality('All Localities');
        triggerQueryUpdate(undefined, 'All Localities');
      }
    } else {
      const updated = { ...checkedLocalities, [loc]: checked };
      setCheckedLocalities(updated);
      const activeLocs = Object.keys(updated).filter(key => updated[key] && key !== 'Udumalpet');
      if (activeLocs.length > 0) {
        const locStr = activeLocs.join(',');
        setSelectedLocality(activeLocs[0]);
        triggerQueryUpdate(undefined, locStr);
      } else {
        setSelectedLocality('All Localities');
        triggerQueryUpdate(undefined, 'All Localities');
      }
    }
  };

  const handleCall = async (phone, name, bizId) => {
    if (bizId) {
      try {
        await fetch(`http://localhost:5000/api/businesses/${bizId}/click`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'call' })
        });
      } catch (err) {
        console.error('Failed to track call click:', err);
      }
    }
    window.open(`tel:${phone}`);
  };

  const handleWhatsApp = async (whatsapp, name, bizId) => {
    if (bizId) {
      try {
        await fetch(`http://localhost:5000/api/businesses/${bizId}/click`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'whatsapp' })
        });
      } catch (err) {
        console.error('Failed to track whatsapp click:', err);
      }
    }
    let cleanNum = whatsapp.replace(/[^0-9]/g, '');
    cleanNum = cleanNum.replace(/^0+/, '');
    if (cleanNum.length === 10) {
      cleanNum = '91' + cleanNum;
    }
    const textMsg = `Hello ${name}, I saw your listing on Udumalpet Business Tour.`;
    window.open(`https://wa.me/${cleanNum}?text=${encodeURIComponent(textMsg)}`);
  };

  const handleMapClick = async (e, bizId) => {
    if (e) e.stopPropagation();
    if (bizId) {
      try {
        await fetch(`http://localhost:5000/api/businesses/${bizId}/click`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'directions' })
        });
      } catch (err) {
        console.error('Failed to track directions click:', err);
      }
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactSubmitting(true);
    setContactSuccess(null);
    setContactError('');
    try {
      const res = await fetch('http://localhost:5000/api/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          subject: contactSubject,
          message: contactMessage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setContactSuccess(true);
        setContactName('');
        setContactEmail('');
        setContactSubject('');
        setContactMessage('');
      } else {
        setContactError(data.message || 'Failed to send message.');
      }
    } catch (err) {
      setContactError('Server connection error. Please try again later.');
    } finally {
      setContactSubmitting(false);
    }
  };

  // Filter lists based on text searches
  const filteredCategories = dynamicAvailableCategories.filter(c => 
    c.toLowerCase().includes(categorySearchText.toLowerCase())
  );
  
  // Collect all unique localities dynamically from approved listings
  const dynamicLocalities = (() => {
    const unique = [...availableLocalities];
    allBusinesses.forEach(biz => {
      if (biz.locality) {
        const trimmed = biz.locality.trim();
        if (trimmed && !unique.some(l => l.toLowerCase() === trimmed.toLowerCase())) {
          unique.push(trimmed);
        }
      }
    });
    return unique;
  })();

  const filteredLocalities = dynamicLocalities.filter(l => 
    l.toLowerCase().includes(localitySearchText.toLowerCase())
  );

  const displayedLocalities = showAllLocalities 
    ? filteredLocalities 
    : filteredLocalities.slice(0, 5);

  // Pagination helpers
  const itemsPerPage = 10;
  const totalPages = Math.ceil(businesses.length / itemsPerPage);
  const displayedBusinesses = businesses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      if (currentPage <= 3) {
        end = 4;
      }
      if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }
      if (start > 2) {
        pages.push('...');
      }
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (end < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    return pages;
  };

  const isAboutView = focusParam === 'about';
  const isContactView = focusParam === 'contact';

  const isTermsView = focusParam === 'terms';
  const isPrivacyView = focusParam === 'privacy';
  const isRefundView = focusParam === 'refund';
  const isGuidelinesView = focusParam === 'guidelines';

  if (isTermsView || isPrivacyView || isRefundView || isGuidelinesView) {
    const docTitle = isTermsView 
      ? 'Terms & Conditions' 
      : isPrivacyView 
        ? 'Privacy Policy' 
        : isRefundView 
          ? 'Refund Policy' 
          : 'Business Guidelines';

    const docSub = isTermsView
      ? 'Understand your rights and responsibilities when using Udumalpet Business Tour.'
      : isPrivacyView
        ? 'Learn how we collect, store, protect, and use your personal data.'
        : isRefundView
          ? 'Review our terms regarding payment processing, plans renewal, and refund requests.'
          : 'Read the rules, quality standards, and verification guidelines for listing businesses.';

    return (
      <div className="w-full flex flex-col items-center bg-[#F8FAFC]">
        {/* Header Banner */}
        <section 
          className="w-full relative min-h-[260px] bg-[#001c41] text-white py-10 px-4 md:px-8 border-b border-slate-800"
        >
          <div className="relative max-w-[1600px] mx-auto flex flex-col items-center z-10 text-left">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-bold self-start mt-2">
              <Link to="/" className="hover:text-emerald-450 transition-colors">Home</Link>
              <span className="text-slate-505">&gt;</span>
              <span className="text-slate-100">{docTitle}</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mt-4 self-start font-sans">
              {docTitle}
            </h1>
            <p className="text-slate-400 text-xs font-semibold self-start mt-1.5 leading-relaxed max-w-2xl">
              {docSub}
            </p>
          </div>
        </section>

        {/* Content sections */}
        <section className="mx-auto max-w-[1600px] w-full px-4 md:px-8 py-12 text-left">
          <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8 flex flex-col gap-6 font-sans">
            <h3 className="font-extrabold text-[#001c41] text-base border-b border-slate-100 pb-3">
              Official {docTitle} — Last Updated: {isTermsView ? 'June 2026' : 'May 30, 2026'}
            </h3>
            
            {isTermsView && (
              <div className="flex flex-col gap-4 text-xs font-semibold text-slate-600 leading-relaxed max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
                <p>Welcome to UBT (Udumalpet Business Tour). By accessing or using our directory platform, you agree to comply with and be bound by the following terms and conditions. If you do not agree with any part of these terms, you must discontinue the use of the platform.</p>
                
                <h4 className="font-extrabold text-slate-800 text-sm mt-2">1. Acceptance of Terms</h4>
                <p>By accessing or using UBT (Udumalpet Business Tour), you agree to comply with these Terms & Conditions. If you do not agree with any part of these terms, you must discontinue the use of the platform.</p>
                
                <h4 className="font-extrabold text-slate-800 text-sm mt-2">2. Eligibility</h4>
                <ul className="list-disc pl-4 flex flex-col gap-1">
                  <li>Users must be at least 18 years of age.</li>
                  <li>Business owners and partners must provide accurate and complete information during registration.</li>
                  <li>UBT reserves the right to verify user and business information at any time.</li>
                </ul>
                
                <h4 className="font-extrabold text-slate-800 text-sm mt-2">3. Account Registration</h4>
                <ul className="list-disc pl-4 flex flex-col gap-1">
                  <li>Users are responsible for maintaining the confidentiality of their login credentials.</li>
                  <li>One account per individual or business is permitted unless otherwise approved by UBT.</li>
                  <li>Providing false or misleading information may result in account suspension or termination.</li>
                </ul>
                
                <h4 className="font-extrabold text-slate-800 text-sm mt-2">4. Business Listings</h4>
                <p>Business owners are solely responsible for the accuracy of their Business Name, Address, Contact Details, Business Hours, Images, Products and Services, and Offers and Promotions.</p>
                <p>UBT reserves the right to edit formatting and categorization, reject or remove listings that violate platform policies, and request proof of business ownership before approving or transferring listings.</p>
                
                <h4 className="font-extrabold text-slate-800 text-sm mt-2">5. Community Listings</h4>
                <p>Registered users may submit public information such as Government Offices, Public Service Organizations, and Temples or Religious Places. UBT reserves the right to review, modify, approve or reject community-submitted listings before publication.</p>
                
                <h4 className="font-extrabold text-slate-800 text-sm mt-2">6. Subscription Plans</h4>
                <p>Current subscription plans are:</p>
                <ul className="list-disc pl-4 flex flex-col gap-1">
                  <li>Monthly Plan – ₹99</li>
                  <li>Yearly Plan – ₹999</li>
                </ul>
                <p>Benefits may include: Dedicated Business Page, Digital Visiting Card, Business Dashboard, Blog Publishing, Event Listings, Offers Management, Priority Listing, and Customer Engagement Features. UBT reserves the right to modify subscription pricing. Existing subscriptions remain valid until their expiry date.</p>
                
                <h4 className="font-extrabold text-slate-800 text-sm mt-2">7. Events</h4>
                <p>Businesses may publish events through the platform. UBT may remove events containing illegal activities, adult content, hate speech, fraudulent information, or misleading advertisements. Completed events may be automatically archived.</p>
                
                <h4 className="font-extrabold text-slate-800 text-sm mt-2">8. Business Blogs</h4>
                <p>Businesses may publish blogs related to their services. Prohibited content includes plagiarism, copyright infringement, false information, political propaganda, hate speech, and illegal content.</p>
                
                <h4 className="font-extrabold text-slate-800 text-sm mt-2">9. Reviews & Testimonials</h4>
                <p>Google Reviews displayed on UBT are retrieved from publicly available Google Business Profiles. UBT does not modify or manipulate Google reviews. Testimonials submitted directly to UBT may be displayed after moderation.</p>
                
                <h4 className="font-extrabold text-slate-800 text-sm mt-2">10. Digital Visiting Card</h4>
                <p>Businesses may generate digital business cards using the information they provide. Businesses are responsible for ensuring all contact information remains accurate and up to date.</p>
                
                <h4 className="font-extrabold text-slate-800 text-sm mt-2">11. Referral Program</h4>
                <p>Registered users may participate in the referral program. Current policy states:</p>
                <ul className="list-disc pl-4 flex flex-col gap-1">
                  <li>Every successful verified referral earns <strong>99 referral points</strong>.</li>
                  <li>Referral points are non-transferable and have no direct cash value.</li>
                  <li>Referral points may only be redeemed according to UBT's current referral policy.</li>
                  <li>Fraudulent, duplicate or self-referrals will be cancelled.</li>
                </ul>
                <p>UBT reserves the right to modify referral benefits at any time.</p>
                
                <h4 className="font-extrabold text-slate-800 text-sm mt-2">12. Partner Program</h4>
                <p>UBT offers a Partner Program for individuals who promote business registrations. Partners must provide their Full Name, Email Address, Mobile Number, Aadhaar Details, and any additional verification documents requested by UBT.</p>
                <p>Partners receive 99 referral points for every successful verified business registration, and reach redemption eligibility upon reaching <strong>1000 referral points</strong>, subject to verification and approval. UBT reserves the right to reject requests involving suspicious or fraudulent activities.</p>
                
                <h4 className="font-extrabold text-slate-800 text-sm mt-2">13. Founding Member Recognition</h4>
                <p>The first 100 eligible businesses registered on UBT may receive a Founding Member badge. UBT reserves the right to determine eligibility and remove the badge if eligibility criteria are no longer satisfied.</p>
                
                <h4 className="font-extrabold text-slate-800 text-sm mt-2">14. Payments</h4>
                <p>Payments are processed securely through approved third-party gateways such as Razorpay. UBT does not store debit card, credit card, or banking credentials.</p>
                
                <h4 className="font-extrabold text-slate-800 text-sm mt-2">15. Intellectual Property</h4>
                <p>All intellectual property, including the UBT Logo, Brand Name, Website Design, Graphics, Icons, Software, and Content, remains the exclusive property of UBT unless otherwise stated.</p>
                
                <h4 className="font-extrabold text-slate-800 text-sm mt-2">16. Accuracy of Information</h4>
                <p>Business owners are solely responsible for maintaining accurate business information. UBT does not guarantee the completeness or accuracy of information submitted by users.</p>
                
                <h4 className="font-extrabold text-slate-800 text-sm mt-2">17. Limitation of Liability</h4>
                <p>UBT operates solely as a digital business discovery platform. UBT does not guarantee business quality, product quality, service quality, sales, customer leads, event attendance, or business growth. All commercial transactions occur directly between customers and businesses.</p>
                
                <h4 className="font-extrabold text-slate-800 text-sm mt-2">18. Suspension & Termination</h4>
                <p>UBT reserves the right to suspend or remove accounts involved in fake business registrations, fraud, spam, abuse, policy violations, or illegal activities without prior notice.</p>
                
                <h4 className="font-extrabold text-slate-800 text-sm mt-2">19. Privacy</h4>
                <p>User information is collected and processed according to the UBT Privacy Policy.</p>
                
                <h4 className="font-extrabold text-slate-800 text-sm mt-2">20. Governing Law</h4>
                <p>These Terms & Conditions shall be governed by the laws of India. Any disputes shall fall under the jurisdiction of the competent courts in Tamil Nadu.</p>
              </div>
            )}

            {isPrivacyView && (
              <div className="flex flex-col gap-4 text-xs font-semibold text-slate-600 leading-relaxed">
                <p>At Udumalpet Business Tour, your privacy is our core priority. This Policy describes how we handle the personal information collected on our platform.</p>
                
                <h4 className="font-extrabold text-slate-800 text-sm mt-2">1. Information We Collect</h4>
                <p>We collect data (name, email, phone number, password) during registration. For merchants, we collect and publish business-related data (GST numbers, timings, category classifications, and logo files) to display on the public directory listings.</p>
                
                <h4 className="font-extrabold text-slate-800 text-sm mt-2">2. How We Protect Your Data</h4>
                <p>Your session tokens are stored securely in localStorage, and critical credentials like passwords are encrypted in our database. We do not sell or rent user contact details to third-party advertisers.</p>
                
                <h4 className="font-extrabold text-slate-800 text-sm mt-2">3. Cookies & Session Storage</h4>
                <p>We utilize standard browser cookies and local storage tokens (`ubt_token`, `ubt_user`) to keep you logged in and deliver custom dashboard states.</p>
              </div>
            )}

            {isRefundView && (
              <div className="flex flex-col gap-4 text-xs font-semibold text-slate-600 leading-relaxed">
                <p>Our payment terms outline the billing cycles and refund policies for paid premium listings on Udumalpet Business Tour.</p>
                
                <h4 className="font-extrabold text-slate-800 text-sm mt-2">1. Subscription Renewals</h4>
                <p>Premium plans (Monthly and Yearly) are activated instantly upon successful payment completion. These subscriptions do not automatically auto-charge your credit card or bank account. You must manually renew upon expiry to keep listings active.</p>
                
                <h4 className="font-extrabold text-slate-800 text-sm mt-2">2. Cancellation & Refunds</h4>
                <p>Since premium listings are processed and activated instantly to increase visibility, all subscription payments are non-refundable. You can choose to cancel or let your subscription expire at any point without incurring cancellation penalties.</p>
              </div>
            )}

            {isGuidelinesView && (
              <div className="flex flex-col gap-4 text-xs font-semibold text-slate-600 leading-relaxed">
                <p>These quality guidelines ensure all listings on Udumalpet Business Tour remain professional, helpful, and safe for the public.</p>
                
                <h4 className="font-extrabold text-slate-800 text-sm mt-2">1. Listing Verification Standards</h4>
                <p>All newly registered business profiles go through manual review. To get the "UDT Verified" badge, you must provide valid business registration (GST/licensing) and establish active call/WhatsApp connections.</p>
                
                <h4 className="font-extrabold text-slate-800 text-sm mt-2">2. Prohibited Content</h4>
                <p>Do not post misleading prices, copycat listings, or copyright-infringing cover photos. Event promotions must represent legitimate public activities with real organizer contacts.</p>
              </div>
            )}

            <div className="flex justify-between items-center border-t border-slate-100 pt-6 mt-2">
              <Link 
                to="/businesses" 
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#027244] bg-slate-100 hover:bg-emerald-50/50 px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Business Directory
              </Link>
              <Link 
                to="/" 
                className="py-2.5 px-5 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer"
              >
                Go to Homepage
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (isAboutView) {
    return <AboutUsView />;
  }

  if (isContactView) {
    return (
      <div className="w-full flex flex-col items-center bg-[#F8FAFC]">
        {/* Header Banner */}
        <section 
          className="w-full relative min-h-[260px] bg-[#001c41] text-white py-10 px-4 md:px-8 border-b border-slate-800"
        >
          <div className="relative max-w-[1600px] mx-auto flex flex-col items-center z-10 text-left">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-bold self-start mt-2">
              <Link to="/" className="hover:text-emerald-450 transition-colors">Home</Link>
              <span className="text-slate-505">&gt;</span>
              <span className="text-slate-100">Contact Us</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mt-4 self-start font-sans">
              Contact Support
            </h1>
            <p className="text-slate-400 text-xs font-semibold self-start mt-1.5 leading-relaxed max-w-2xl">
              Have questions about registration, verified badges, or advertising options? We are here to help.
            </p>
          </div>
        </section>

        {/* Content sections */}
        <section className="mx-auto max-w-[1600px] w-full px-4 md:px-8 py-12 grid grid-cols-1 md:grid-cols-5 gap-8">
          
          {/* Left Column: Form (3 cols) */}
          <div className="md:col-span-3 bg-white border border-slate-200 shadow-sm rounded-3xl p-6 md:p-8 text-left flex flex-col gap-5">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Send Us a Message</h3>
              <p className="text-slate-450 text-[10px] font-semibold mt-1">Provide your details and inquiry, and our team will email or call you back shortly.</p>
            </div>

            {contactSuccess && (
              <div className="bg-emerald-50 border border-emerald-250 text-[#027244] rounded-2xl p-4.5 text-xs font-extrabold animate-fadeIn select-none leading-relaxed">
                ✓ Thank you for reaching out! A support representative will review your query and reply shortly.
              </div>
            )}

            {contactError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-650 rounded-2xl p-4.5 text-xs font-extrabold animate-fadeIn select-none leading-relaxed">
                ✗ {contactError}
              </div>
            )}
            
            <form 
              onSubmit={handleContactSubmit}
              className="flex flex-col gap-4.5"
            >
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Full Name *</span>
                <input 
                  type="text" 
                  required 
                  placeholder="Enter your full name" 
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="h-10 px-3 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#027244]" 
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Email Address *</span>
                <input 
                  type="email" 
                  required 
                  placeholder="Enter your email address" 
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="h-10 px-3 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#027244]" 
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Subject *</span>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Inquiring about Verified Badge / Listing assistance" 
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  className="h-10 px-3 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#027244]" 
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Inquiry Message *</span>
                <textarea 
                  required 
                  rows="4" 
                  placeholder="Detail your question or requirement..." 
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="py-2.5 px-3 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#027244] resize-none" 
                />
              </div>

              <button 
                type="submit" 
                disabled={contactSubmitting}
                className="h-11 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md mt-2 flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                {contactSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>

          {/* Right Column: Details (2 cols) */}
          <div className="md:col-span-2 flex flex-col gap-6 text-left">
            <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 flex flex-col gap-5">
              <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-2.5">Local Contact Info</h3>
              
              <div className="flex gap-3.5 items-start">
                <div className="h-8.5 w-8.5 rounded-full bg-emerald-50 text-[#027244] border border-emerald-100/50 flex items-center justify-center shrink-0 shadow-2xs">
                  <PhoneCall className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-extrabold text-slate-450 uppercase leading-none">Call Us</span>
                  <a href="tel:+918925728260" className="text-xs text-slate-800 font-extrabold hover:underline mt-1 leading-normal">+91 89257 28260</a>
                </div>
              </div>

              <div className="flex gap-3.5 items-start">
                <div className="h-8.5 w-8.5 rounded-full bg-emerald-50 text-[#027244] border border-emerald-100/50 flex items-center justify-center shrink-0 shadow-2xs">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase leading-none">Email Us</span>
                  <a href="mailto:info@udumalpet.business" className="text-xs text-slate-800 font-extrabold hover:underline mt-1 leading-normal">info@udumalpet.business</a>
                </div>
              </div>
            </div>
          </div>

        </section>
      </div>
    );
  }

  if (isCategoriesView) {
    const subcatHasApprovedListing = (subcatName) => {
      return allBusinesses.some(biz => {
        if (biz.status !== 'Approved') return false;
        if (biz.category?.toLowerCase() === subcatName.toLowerCase()) return true;
        if (biz.categories && biz.categories.some(c => (c.type === 'Others' ? c.customCategoryName : c.type)?.toLowerCase() === subcatName.toLowerCase())) return true;
        return false;
      });
    };

    const hotCategories = [...dbCategories]
      .filter(cat => {
        if (allBusinesses.length === 0) return true;
        return subcatHasApprovedListing(cat.categoryName);
      })
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 10);

    const isSearching = categoriesSearchQuery.trim() !== '';
    const searchResults = isSearching 
      ? dbCategories.filter(cat => {
          if (allBusinesses.length > 0 && !subcatHasApprovedListing(cat.categoryName)) return false;
          return cat.categoryName.toLowerCase().includes(categoriesSearchQuery.toLowerCase()) ||
                 (cat.description && cat.description.toLowerCase().includes(categoriesSearchQuery.toLowerCase()));
        })
      : [];

    const relatedSubcategories = selectedCategoryInExplore
      ? dbCategories.filter(cat => {
          if (cat.parentCategory?.toLowerCase() !== selectedCategoryInExplore.toLowerCase()) return false;
          if (allBusinesses.length === 0) return true;
          return subcatHasApprovedListing(cat.categoryName);
        })
      : [];

    const exploreSubcatNames = selectedCategoryInExplore
      ? dbCategories
          .filter(cat => {
            if (cat.parentCategory?.toLowerCase() !== selectedCategoryInExplore.toLowerCase()) return false;
            if (allBusinesses.length === 0) return true;
            return subcatHasApprovedListing(cat.categoryName);
          })
          .map(cat => cat.categoryName.toLowerCase())
      : [];

    const filteredExploreBusinesses = (() => {
      if (!selectedCategoryInExplore) return [];
      
      return allBusinesses.filter(biz => {
        if (biz.status !== 'Approved') return false;

        const parentMatches = (biz.categories && biz.categories.some(c => c.category.toLowerCase() === selectedCategoryInExplore.toLowerCase())) ||
                              getParentCategory(biz.category || '').toLowerCase() === selectedCategoryInExplore.toLowerCase() ||
                              (biz.requestedParentCategory && biz.requestedParentCategory.toLowerCase() === selectedCategoryInExplore.toLowerCase());
                              
        if (!parentMatches) return false;

        if (selectedSubcategoryInExplore && selectedSubcategoryInExplore !== 'All') {
          const bizSubMatches = (biz.categories && biz.categories.some(c => (c.type === 'Others' ? c.customCategoryName : c.type).toLowerCase() === selectedSubcategoryInExplore.toLowerCase())) ||
                                (biz.category === 'Others' ? biz.customCategoryName : biz.category)?.toLowerCase() === selectedSubcategoryInExplore.toLowerCase();
          if (!bizSubMatches) return false;
        }
        return true;
      });
    })();

    const exploreItemsPerPage = 10;
    const totalExplorePages = Math.ceil(filteredExploreBusinesses.length / exploreItemsPerPage);
    const displayedExploreBusinesses = filteredExploreBusinesses.slice((explorePage - 1) * exploreItemsPerPage, explorePage * exploreItemsPerPage);

    const getExplorePageNumbers = () => {
      const pages = [];
      if (totalExplorePages <= 7) {
        for (let i = 1; i <= totalExplorePages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        let start = Math.max(2, explorePage - 1);
        let end = Math.min(totalExplorePages - 1, explorePage + 1);
        if (explorePage <= 3) {
          end = 4;
        }
        if (explorePage >= totalExplorePages - 2) {
          start = totalExplorePages - 3;
        }
        if (start > 2) {
          pages.push('...');
        }
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
        if (end < totalExplorePages - 1) {
          pages.push('...');
        }
        pages.push(totalExplorePages);
      }
      return pages;
    };

    if (urlSlug && dbCategories.length === 0) {
      return (
        <div className="w-full min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4 font-sans">
          <div className="flex flex-col items-center gap-3">
            <div className="relative flex items-center justify-center">
              <div className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-emerald-400 opacity-20"></div>
              <div className="relative rounded-full h-12 w-12 border-4 border-slate-200 border-t-[#027244] animate-spin"></div>
            </div>
            <span className="text-xs font-bold text-slate-500 tracking-wider uppercase animate-pulse mt-2">
              Loading Directory Listings...
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full flex flex-col items-center bg-[#F8FAFC]">
        {/* Header Banner */}
        <section 
          className="w-full relative min-h-0 md:min-h-[260px] bg-[#001c41] text-white py-4 md:py-10 px-4 md:px-8 border-b border-slate-800"
        >
          <div className="relative max-w-[1600px] mx-auto flex flex-col items-center z-10 text-left w-full">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-bold self-start mt-1 md:mt-2 order-1">
              <Link to="/" className="hover:text-emerald-450 transition-colors">Home</Link>
              <span className="text-slate-505">&gt;</span>
              {selectedCategoryInExplore ? (
                <>
                  <Link to="/businesses?focus=categories" className="hover:text-emerald-450 transition-colors">Categories</Link>
                  <span className="text-slate-505">&gt;</span>
                  {selectedSubcategoryInExplore && selectedSubcategoryInExplore !== 'All' ? (
                    <>
                      <button 
                        onClick={() => {
                          if (urlSlug) {
                            navigate(`/businesses?focus=categories&category=${encodeURIComponent(selectedCategoryInExplore)}`);
                          } else {
                            setSearchParams({ focus: 'categories', category: selectedCategoryInExplore });
                          }
                        }} 
                        className="hover:text-emerald-450 transition-colors bg-transparent border-none p-0 cursor-pointer font-bold text-xs text-slate-300 hover:underline"
                      >
                        {selectedCategoryInExplore}
                      </button>
                      <span className="text-slate-505">&gt;</span>
                      <span className="text-slate-100">{selectedSubcategoryInExplore}</span>
                    </>
                  ) : (
                    <span className="text-slate-100">{selectedCategoryInExplore}</span>
                  )}
                </>
              ) : (
                <span className="text-slate-100">Categories</span>
              )}
            </div>

            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white mt-3 md:mt-4 self-start font-sans order-2">
              {selectedSubcategoryInExplore && selectedSubcategoryInExplore !== 'All' 
                ? selectedSubcategoryInExplore 
                : (selectedCategoryInExplore || 'Categories')} in Udumalpet
            </h1>
            <p className="hidden sm:block text-slate-400 text-xs font-semibold self-start mt-1.5 leading-relaxed order-3">
              Find local businesses and specialized services in Udumalpet
            </p>

            <form onSubmit={(e) => e.preventDefault()} className="mt-4 md:mt-8 w-full bg-white border border-slate-200 shadow-xl rounded-2xl p-2 flex gap-2 max-w-3xl order-4 text-slate-700">
              <div className="flex-1 flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                <Search className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search for categories or services..."
                  value={categoriesSearchQuery}
                  onChange={(e) => setCategoriesSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none"
                />
              </div>
            </form>
          </div>
        </section>

        {/* Main Two-Column Split Grid */}
        <section className="mx-auto max-w-[1600px] w-full px-4 md:px-8 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Column: Main categories grid, search results, or subcategory drilldown */}
          <div className="lg:col-span-3 flex flex-col gap-6">
               {isSearching ? (
              // Search Results View
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <span className="font-extrabold text-sm text-[#001c41]">
                    Search Results for "{categoriesSearchQuery}" ({searchResults.length})
                  </span>
                  <button 
                    onClick={() => setCategoriesSearchQuery('')}
                    className="text-xs font-bold text-[#027244] hover:underline"
                  >
                    Clear Search
                  </button>
                </div>

                {searchResults.length === 0 ? (
                  <div className="bg-white border border-slate-200/60 rounded-3xl py-14 px-6 text-center shadow-sm flex flex-col items-center justify-center gap-4 text-slate-400">
                    <AlertCircle className="h-10 w-10 text-slate-400" />
                    <div>
                      <h4 className="font-extrabold text-slate-700 text-base leading-none">No categories found</h4>
                      <p className="text-xs text-slate-400 font-semibold mt-2">Try searching with other keywords or browse our catalog.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4.5 text-left">
                    {searchResults.map((cat) => {
                      const count = allBusinesses.filter(b => b.status === 'Approved' && (b.category?.toLowerCase() === cat.categoryName.toLowerCase() || (b.categories && b.categories.some(c => (c.type === 'Others' ? c.customCategoryName : c.type)?.toLowerCase() === cat.categoryName.toLowerCase())))).length;
                      return (
                        <div 
                           key={cat._id}
                           onClick={() => handleCategoryClick(cat.categoryName)}
                           className="card-premium group rounded-3xl p-4 sm:p-6 cursor-pointer flex flex-col justify-between min-h-[7.5rem] sm:h-36 h-auto relative overflow-hidden bg-white border border-slate-200/65 hover:border-[#027244]"
                         >
                           <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-slate-50 rounded-full group-hover:bg-emerald-50/40 transition-colors duration-500 pointer-events-none" />
                           <div className="h-10 w-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 shadow-2xs transition-transform duration-500 group-hover:scale-110">
                             {renderCategoryIcon(cat.icon, "h-4.5 w-4.5 text-[#027244]")}
                           </div>
                           <div className="flex flex-col z-10 mt-3">
                             <span className="font-medium text-[#001c41] text-xs sm:text-sm md:text-[17px] leading-tight sm:leading-snug group-hover:text-[#027244] transition-colors duration-300 line-clamp-2">
                               {cat.categoryName}
                             </span>
                             <span className="text-[9px] sm:text-[10px] text-slate-400 font-extrabold mt-1 uppercase tracking-wide leading-none">
                               {count} Business{count !== 1 ? 'es' : ''}
                             </span>
                           </div>
                         </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              // Main explorer states (State A, State B, State C)
              <div className="flex flex-col gap-6">
                {!selectedCategoryInExplore ? (
                  // State A: Parent category grid
                  <>
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <span className="font-extrabold text-sm text-[#001c41]">
                        Browse by Parent Category
                      </span>
                      <span className="text-[10.5px] text-slate-400 font-bold">Select a parent category to view subcategories</span>
                    </div>

                    {(() => {
                      if (categoriesLoading && dbCategories.length === 0) {
                        return (
                          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4.5 text-left animate-pulse">
                            {[...Array(9)].map((_, i) => (
                              <div key={i} className="card-premium rounded-3xl p-4 sm:p-6 min-h-[7.5rem] sm:h-36 h-auto bg-white border border-slate-200/60 flex flex-col justify-between">
                                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-slate-150" />
                                <div className="flex flex-col gap-2 mt-3">
                                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                                  <div className="h-3.5 bg-slate-150 rounded w-1/3" />
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      const sortedCats = [...dynamicCategoryDetails].sort((a, b) => (categoryCounts[b.name] || 0) - (categoryCounts[a.name] || 0));
                      const visibleCats = sortedCats.slice(0, visibleCategoryLimit);
                      return (
                        <>
                          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4.5 text-left animate-fadeIn">
                            {visibleCats.map((cat, idx) => {
                              const count = categoryCounts[cat.name] || 0;
                              return (
                                <div 
                                  key={idx}
                                  onClick={async () => {
                                    try {
                                      fetch('http://localhost:5000/api/categories/view', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ categoryName: cat.name })
                                      });
                                    } catch (e) {}
                                    if (urlSlug) {
                                      navigate(`/businesses?focus=categories&category=${encodeURIComponent(cat.name)}`);
                                    } else {
                                      setSearchParams({ focus: 'categories', category: cat.name });
                                    }
                                  }}
                                  className="card-premium group rounded-3xl p-4 sm:p-6 cursor-pointer flex flex-col justify-between min-h-[7.5rem] sm:h-36 h-auto relative overflow-hidden bg-white border border-slate-200/65 hover:border-[#027244] transition-all"
                                >
                                  <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-slate-50 rounded-full group-hover:bg-emerald-50/40 transition-colors duration-500 pointer-events-none" />
                                  <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full ${cat.bg} flex items-center justify-center shrink-0 shadow-2xs transition-transform duration-500 group-hover:scale-110`}>
                                    {cat.icon}
                                  </div>
                                  <div className="flex flex-col z-10 mt-3">
                                    <span className="font-medium text-[#001c41] text-xs sm:text-sm md:text-[17px] leading-tight sm:leading-snug group-hover:text-[#027244] transition-colors duration-300 line-clamp-2">
                                      {cat.name}
                                    </span>
                                    <div className="flex items-center justify-between gap-1.5 w-full mt-1.5 text-[9px] sm:text-[10px] text-slate-455 font-extrabold uppercase tracking-wide leading-none">
                                      <span className="whitespace-nowrap">{count} Listings</span>
                                      <span className="text-[#027244] font-black hover:underline whitespace-nowrap text-[8px] sm:text-[9px] uppercase tracking-wider">Explore</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {visibleCategoryLimit < sortedCats.length && (
                            <div className="w-full flex items-center justify-center py-6 mt-4">
                              <button
                                onClick={() => setVisibleCategoryLimit((prev) => prev + 6)}
                                className="flex flex-col items-center gap-1 bg-[#E6F2ED] hover:bg-[#D5EAE2] text-[#027244] hover:text-[#005934] font-black text-xs px-6 py-3 shadow-2xs hover:shadow-xs rounded-full border border-emerald-100/50 transition-all cursor-pointer group"
                              >
                                <span>Show More Categories</span>
                                <ChevronDown className="h-4.5 w-4.5 animate-bounce group-hover:translate-y-0.5 transition-transform duration-300" />
                              </button>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </>
                ) : !selectedSubcategoryInExplore ? (
                  // State B: Subcategories grid (drilldown) under selected parent category.
                  // Occupies the entire right-side content pane.
                  <>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
                       <div className="flex flex-col gap-2">
                         <div className="flex items-center gap-3">
                           <button 
                             onClick={() => {
                                if (urlSlug) {
                                  navigate('/businesses?focus=categories');
                                } else {
                                  setSearchParams({ focus: 'categories' });
                                }
                              }}
                             className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#027244] bg-slate-100 hover:bg-emerald-50/50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                           >
                             <ArrowLeft className="h-3.5 w-3.5" /> Back to Categories
                           </button>
                           <div className="h-4 w-px bg-slate-200" />
                           <h2 className="font-extrabold text-base text-[#001c41] flex items-center gap-2">
                             {renderCategoryIcon(parentIconStringMap[selectedCategoryInExplore], "h-5 w-5 text-[#027244]")}
                             {selectedCategoryInExplore}
                           </h2>
                         </div>
                         <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                           Select a subcategory to browse local listings under {selectedCategoryInExplore}.
                         </p>
                       </div>
                       {selectedCategoryInExplore === 'Public Sector' && (
                         <button
                           onClick={() => { setShowAnonymousAddModal(true); resetAnonForm(); }}
                           className="self-start sm:self-center py-2.5 px-4.5 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow transition-all cursor-pointer border-none"
                         >
                           <span>+ Add Directory Listing</span>
                         </button>
                       )}
                     </div>

                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4 text-left animate-fadeIn">
                      {/* "All" parent category card first */}
                      {(() => {
                        const totalCount = categoryCounts[selectedCategoryInExplore] || 0;
                        const parentIconStr = parentIconStringMap[selectedCategoryInExplore] || 'Store';
                        return (
                          <div 
                            onClick={() => {
                              if (urlSlug) {
                                navigate(`/businesses?focus=categories&category=${encodeURIComponent(selectedCategoryInExplore)}&subcategory=All`);
                              } else {
                                setSearchParams({ focus: 'categories', category: selectedCategoryInExplore, subcategory: 'All' });
                              }
                            }}
                            className="bg-white border border-slate-200/60 rounded-2xl p-3 sm:p-4 flex items-center justify-between cursor-pointer hover:border-emerald-100 hover:bg-emerald-50/30 transition-all duration-300 group"
                          >
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-[#027244] group-hover:scale-110 transition-transform duration-300">
                                {renderCategoryIcon(parentIconStr, "h-4 w-4 text-[#027244]")}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs sm:text-sm md:text-[17px] font-medium text-slate-700 group-hover:text-[#027244] transition-colors line-clamp-2 leading-tight">
                                  All {selectedCategoryInExplore}
                                </span>
                                <span className="text-[8px] sm:text-[9px] text-slate-400 font-semibold mt-0.5 leading-none">
                                  {totalCount} active listing{totalCount !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                            <span className="text-[8px] sm:text-[9px] font-extrabold text-slate-500 bg-slate-50 border border-slate-200 px-1 sm:px-1.5 py-0.5 rounded shrink-0">
                              All
                            </span>
                          </div>
                        );
                      })()}

                      {/* Other related subcategories */}
                      {relatedSubcategories.map((cat) => {
                        const count = allBusinesses.filter(b => b.status === 'Approved' && (b.category?.toLowerCase() === cat.categoryName.toLowerCase() || (b.categories && b.categories.some(c => (c.type === 'Others' ? c.customCategoryName : c.type)?.toLowerCase() === cat.categoryName.toLowerCase())))).length;
                        return (
                           <div 
                             key={cat._id}
                             onClick={async () => {
                               try {
                                 await fetch('http://localhost:5000/api/categories/view', {
                                   method: 'POST',
                                   headers: { 'Content-Type': 'application/json' },
                                   body: JSON.stringify({ categoryName: cat.categoryName })
                                 });
                                 setDbCategories(prev => prev.map(c => 
                                   c.categoryName === cat.categoryName ? { ...c, views: (c.views || 0) + 1 } : c
                                 ));
                               } catch (err) {
                                 console.warn('Failed to increment category view:', err);
                               }
                               if (urlSlug) {
                                 navigate(`/businesses?focus=categories&category=${encodeURIComponent(selectedCategoryInExplore)}&subcategory=${encodeURIComponent(cat.categoryName)}`);
                               } else {
                                 setSearchParams({ focus: 'categories', category: selectedCategoryInExplore, subcategory: cat.categoryName });
                               }
                             }}
                             className="bg-white border border-slate-200/60 rounded-2xl p-3 sm:p-4 flex items-center justify-between cursor-pointer hover:border-emerald-100 hover:bg-emerald-50/30 transition-all duration-300 group"
                           >
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-emerald-50 border border-emerald-100/50 flex items-center justify-center shrink-0 text-[#027244] group-hover:scale-110 transition-transform duration-300">
                                {renderCategoryIcon(cat.icon, "h-4 w-4 text-[#027244]")}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs sm:text-sm md:text-[17px] font-medium text-slate-700 group-hover:text-[#027244] transition-colors line-clamp-2 leading-tight">
                                  {cat.categoryName}
                                </span>
                                <span className="text-[8px] sm:text-[9px] text-slate-400 font-semibold mt-0.5 leading-none">
                                  {count} active listing{count !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                            <span className="text-[8px] sm:text-[9px] font-extrabold text-amber-600 bg-amber-50 border border-amber-100 px-1 sm:px-1.5 py-0.5 rounded shrink-0">
                              👁 {cat.views || 0}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  // State C: Business listings list under the selected subcategory.
                  // Replaces the subcategories grid entirely.
                  <>
                    <div className="flex flex-col gap-4 border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => {
                            if (urlSlug) {
                              navigate(`/businesses?focus=categories&category=${encodeURIComponent(selectedCategoryInExplore)}`);
                            } else {
                              setSearchParams({ focus: 'categories', category: selectedCategoryInExplore });
                            }
                          }}
                          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#027244] bg-slate-100 hover:bg-emerald-50/50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" /> Back to {selectedCategoryInExplore}
                        </button>
                        <div className="h-4 w-px bg-slate-200" />
                        <h2 className="font-extrabold text-base text-[#001c41]">
                          {selectedSubcategoryInExplore === 'All' ? `All ${selectedCategoryInExplore}` : selectedSubcategoryInExplore}
                        </h2>
                      </div>
                      <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                        Found {filteredExploreBusinesses.length} active listing{filteredExploreBusinesses.length !== 1 ? 's' : ''} in {selectedSubcategoryInExplore === 'All' ? selectedCategoryInExplore : selectedSubcategoryInExplore}.
                      </p>
                    </div>

                    {filteredExploreBusinesses.length === 0 ? (
                      <div className="bg-white border border-slate-200/60 rounded-3xl py-16 px-6 text-center shadow-sm flex flex-col items-center justify-center gap-4 text-slate-400">
                        <AlertCircle className="h-10 w-10 text-slate-400" />
                        <div>
                          <h4 className="font-extrabold text-slate-700 text-base leading-none">No listings found</h4>
                          <p className="text-xs text-slate-400 font-semibold mt-2">There are currently no registered businesses under this subcategory.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-5">
                        {displayedExploreBusinesses.map((biz) => {
                          const isExpired = biz.subscriptionStatus === 'expired' && !isGovernmentalOrPublic(biz);
                          const isSubscribed = biz.subscriptionStatus === 'active' || isGovernmentalOrPublic(biz);
                          const isOwner = currentUser && biz && (
                            (currentUser._id && biz.ownerId && currentUser._id === biz.ownerId) ||
                            (currentUser.id && biz.ownerId && currentUser.id === biz.ownerId) ||
                            (currentUser._id && biz.owner && currentUser._id === biz.owner) ||
                            (currentUser.id && biz.owner && currentUser.id === biz.owner) ||
                            (biz._id && typeof biz._id === 'string' && biz._id.startsWith('biz_')) ||
                            (!biz.ownerId && !biz.owner)
                          );
                          const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin');
                          return (
                            <div
                              key={biz._id}
                              className="relative card-premium group rounded-3xl overflow-hidden flex flex-col md:flex-row cursor-pointer"
                              onClick={() => navigate(`/${biz.slug || biz._id}`)}
                            >
                              {/* Cover image (Blurred if subscription is expired!) */}
                              <div 
                                onClick={(e) => { e.stopPropagation(); navigate(`/${biz.slug || biz._id}`); }}
                                className="shrink-0 overflow-hidden relative w-full aspect-square md:w-48 md:h-48 rounded-t-[23px] md:rounded-l-[23px] md:rounded-tr-none border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50 cursor-pointer"
                              >
                                <img 
                                  src={biz.logoUrl ? window.getImageUrl(biz.logoUrl) : '/default_business_cover.png'} 
                                  alt={biz.name}
                                  className={`h-full w-full transition-transform duration-750 ease-out-expo group-hover:scale-105 ${
                                    biz.logoUrl ? 'object-contain p-4 bg-white' : 'object-cover'
                                  }`}
                                  style={{
                                    filter: !isSubscribed ? 'blur(6px) grayscale(30%)' : 'none'
                                  }}
                                />
                                {/* Badge (Verified / Premium / Google Linked) */}
                                {!isExpired && (
                                  <div className="absolute top-3 left-3 flex flex-wrap gap-1 z-10">
                                    {biz.isFoundingMember && (
                                      <div className="bg-amber-500 text-white px-2 py-0.5 rounded-lg shadow-xs flex items-center gap-1 border border-amber-600">
                                        <Sparkles className="h-3.5 w-3.5 text-white fill-current" />
                                        <span className="text-[9px] font-black uppercase tracking-wider">Founding Member</span>
                                      </div>
                                    )}
                                    {((biz.googlePlaceId && biz.googlePlaceId !== '') || (biz.googleBusinessLink && biz.googleBusinessLink !== '') || biz.googleLinked) && (
                                      <div className="bg-white border border-blue-100 px-2 py-0.5 rounded-lg shadow-xs flex items-center gap-1">
                                         <svg className="h-3.5 w-3.5 text-[#1a73e8] shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                           <path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.8 17 5 19 5a1 1 0 0 1 1 1z" fill="currentColor" />
                                           <path d="m9 12 2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                         </svg>
                                        <span className="text-[9px] font-black text-[#1a73e8] uppercase tracking-wider font-sans">Google Verified</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {isExpired && (isOwner || isAdmin) && (
                                  <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center text-center p-2 text-white z-10">
                                    <span className="bg-red-650 text-[9px] font-extrabold uppercase px-2 py-1 rounded shadow">
                                      Subscription Expired
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Content Body */}
                              <div className="p-6 flex-1 flex flex-col md:flex-row justify-between gap-5 text-left relative">
                                <div className="flex flex-col gap-2 flex-1 relative z-30">
                                  <Link
                                    to={`/${biz.slug || biz._id}`}
                                    className="font-black text-[19px] text-[#001c41] hover:text-[#027244] transition-colors leading-tight"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {biz.name}
                                  </Link>
                                  <div 
                                    className="flex flex-col gap-2"
                                    style={{
                                      filter: !isSubscribed ? 'blur-[4px] select-none pointer-events-none' : 'none'
                                    }}
                                  >
                                    <a 
                                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(biz.address ? `${biz.name}, ${biz.address}` : `${biz.name}, ${biz.locality || ''}, Udumalpet`)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-xs font-semibold text-slate-500 mt-0.5 hover:text-[#027244] transition-colors cursor-pointer group"
                                      onClick={(e) => handleMapClick(e, biz._id)}
                                      title="View on Google Maps"
                                    >
                                      <MapPin className="h-4 w-4 text-slate-400 group-hover:text-[#027244] shrink-0" />
                                      <span className="group-hover:underline">{biz.locality}, Udumalpet</span>
                                    </a>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-450 font-bold mt-0.5 select-none w-fit">
                                      <Folder className="h-3.5 w-3.5 text-[#027244] shrink-0" />
                                      <span>{biz.category}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5 text-slate-600 text-xs">
                                      <div className="flex text-amber-400 shrink-0">
                                        {[...Array(5)].map((_, i) => (
                                          <Star key={i} className={`h-3 w-3 ${i < Math.floor(biz.googleRating || 0) ? 'fill-current' : 'text-slate-200'}`} />
                                        ))}
                                      </div>
                                      <span className="font-extrabold">{(biz.googleRating || 0).toFixed(1)}</span>
                                      <span className="text-[10px] text-slate-500 font-bold">({biz.googleReviewsCount || 0})</span>
                                    </div>
                                    {Array.isArray(biz.highlights) && (
                                      <div className="flex flex-wrap items-center gap-4 mt-2 max-h-5 overflow-hidden">
                                        {biz.highlights.map((h, i) => (
                                          <div key={i} className="flex items-center gap-1 text-xs text-[#027244] font-semibold">
                                            <span className="h-4 w-4 bg-emerald-50 rounded-full border border-emerald-100 flex items-center justify-center text-[9px] font-extrabold shrink-0">✓</span>
                                            <span>{h}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Right Panel Actions */}
                                <div 
                                  className="flex flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 shrink-0 md:w-36 relative z-30"
                                  style={{
                                    filter: !isSubscribed ? 'blur-[4px] select-none pointer-events-none' : 'none'
                                  }}
                                >
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleCall(biz.phone, biz.name, biz._id); }}
                                    className="py-2.5 w-full border border-[#027244] hover:bg-emerald-50 text-[#027244] font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                  >
                                    <PhoneCall className="h-3.5 w-3.5" />
                                    <span>Call</span>
                                  </button>
                                  {!isExpired ? (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleWhatsApp(biz.whatsapp, biz.name, biz._id); }}
                                      className="py-2.5 w-full bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                                    >
                                      <span>WhatsApp</span>
                                    </button>
                                  ) : (
                                    <span className="py-2.5 w-full bg-slate-100 text-slate-400 border border-slate-200 font-extrabold text-xs rounded-xl flex items-center justify-center select-none text-center leading-none">
                                      WhatsApp Locked
                                    </span>
                                  )}
                                  <Link
                                    to={`/${biz.slug || biz._id}`}
                                    className="py-2.5 w-full bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-555 font-extrabold text-xs rounded-xl flex items-center justify-center transition-colors text-center font-bold"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    View Details
                                  </Link>
                                </div>
                              </div>

                              {/* Glassmorphism Lock Overlay for Inactive Subscriptions */}
                              {!isSubscribed && (
                                <div 
                                  onClick={(e) => { e.stopPropagation(); navigate(`/${biz.slug || biz._id}`); }}
                                  className="absolute inset-0 bg-transparent hover:bg-slate-900/5 z-20 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer p-4 text-center"
                                >
                                  <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3 flex flex-col items-center gap-1.5 shadow-lg max-w-[180px]">
                                    <svg className="h-5 w-5 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white select-none">
                                      Profile Locked
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Pagination Component */}
                        {totalExplorePages > 1 && (
                          <div className="flex justify-center items-center gap-1.5 mt-10 select-none">
                            {/* Previous Button */}
                            <button
                              disabled={explorePage === 1}
                              onClick={() => {
                                setExplorePage(prev => Math.max(1, prev - 1));
                                window.scrollTo({ top: 300, behavior: 'smooth' });
                              }}
                              className={`px-3 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                              Prev
                            </button>

                            {/* Page Number Buttons */}
                            {getExplorePageNumbers().map((page, idx) => {
                              if (page === '...') {
                                return (
                                  <span key={`ellipsis-${idx}`} className="text-slate-400 px-1.5 text-xs select-none">
                                    ...
                                  </span>
                                );
                              }
                              const isActive = page === explorePage;
                              return (
                                <button
                                  key={`page-${page}`}
                                  onClick={() => {
                                    setExplorePage(page);
                                    window.scrollTo({ top: 300, behavior: 'smooth' });
                                  }}
                                  className={`h-9 w-9 rounded-lg font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                                    isActive
                                      ? 'bg-[#027244] text-white font-extrabold shadow'
                                      : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                                  }`}
                                >
                                  {page}
                                </button>
                              );
                            })}

                            {/* Next Button */}
                            <button
                              disabled={explorePage === totalExplorePages}
                              onClick={() => {
                                setExplorePage(prev => Math.min(totalExplorePages, prev + 1));
                                window.scrollTo({ top: 300, behavior: 'smooth' });
                              }}
                              className={`px-3 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Hot Categories (Always Present, Sticky) */}
          <aside className="lg:col-span-1 text-left">
            <div className="bg-white border border-slate-200/60 shadow-md rounded-[28px] p-6 flex flex-col gap-5 sticky top-6">
              <div className="flex flex-col border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-sm text-[#001c41] flex items-center gap-1.5">
                  <span className="text-amber-500">🔥</span> Hot Categories
                </h3>
                <span className="text-[9.5px] text-slate-400 font-semibold mt-0.5">Most viewed classifications</span>
              </div>

              {categoriesLoading && dbCategories.length === 0 ? (
                <div className="flex flex-col gap-3.5 py-4 animate-pulse">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-10 bg-slate-100 rounded-xl w-full" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-[560px] overflow-y-auto pr-1">
                  {hotCategories.map((cat) => {
                    const count = allBusinesses.filter(b => b.status === 'Approved' && (b.category?.toLowerCase() === cat.categoryName.toLowerCase() || (b.categories && b.categories.some(c => (c.type === 'Others' ? c.customCategoryName : c.type)?.toLowerCase() === cat.categoryName.toLowerCase())))).length;
                    return (
                      <div 
                        key={cat._id}
                        onClick={() => handleHotCategoryClick(cat.categoryName, cat.parentCategory)}
                        className="flex items-center justify-between cursor-pointer group p-2.5 rounded-xl border border-transparent hover:border-emerald-100 hover:bg-emerald-50/30 transition-all duration-300"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-100/50 flex items-center justify-center shrink-0 text-[#027244] group-hover:scale-110 transition-transform duration-300">
                            {renderCategoryIcon(cat.icon, "h-4 w-4 text-[#027244]")}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[17px] font-medium text-slate-700 group-hover:text-[#027244] transition-colors truncate">
                              {cat.categoryName}
                            </span>
                            <span className="text-[9px] text-slate-400 font-semibold mt-0.5 leading-none">
                              {count} active listing{count !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] font-extrabold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded shrink-0">
                          👁 {cat.views || 0}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        </section>

        {showAnonymousAddModal && (
          <div 
            onClick={() => { setShowAnonymousAddModal(false); resetAnonForm(); }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-end p-0"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between animate-slideLeft text-left font-sans"
            >
              
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-black text-[#027244] uppercase tracking-widest">Public Sector Listing</span>
                  <h3 className="font-extrabold text-[#001c41] text-base mt-1">Add Directory Listing</h3>
                </div>
                <button 
                  onClick={() => { setShowAnonymousAddModal(false); resetAnonForm(); }}
                  className="h-8.5 w-8.5 rounded-xl hover:bg-slate-200/80 flex items-center justify-center text-slate-450 hover:text-slate-700 transition-colors cursor-pointer border-none bg-transparent"
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
                        value={anonGmbLink}
                        onChange={(e) => setAnonGmbLink(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-205 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#027244]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAnonLinkAutofill}
                      disabled={anonAutofillLoading || !anonGmbLink.trim()}
                      className="px-4 py-2 bg-[#027244] hover:bg-[#005934] disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-xl cursor-pointer transition-colors shadow flex items-center gap-1 shrink-0 border-none"
                    >
                      {anonAutofillLoading ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Fetching...
                        </>
                      ) : (
                        'Autofill'
                      )}
                    </button>
                  </div>
                  {anonAutofillLoading && (
                    <div className="text-[10px] text-[#027244] font-bold flex items-center gap-1">
                      <RefreshCw className="h-3 w-3 animate-spin" /> Importing details from Google...
                    </div>
                  )}
                  {anonAutofillSuccess && (
                    <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Details, photos, and ratings imported successfully.
                    </div>
                  )}
                </div>

                {/* Directory Listing Form Fields */}
                <div className="flex flex-col gap-4">
                  
                  {/* Business Name */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10.5px] font-black text-slate-700 uppercase">Business Name</label>
                    <input
                      type="text"
                      value={anonForm.name}
                      onChange={(e) => setAnonForm({ ...anonForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#027244]"
                      placeholder="e.g. Taluk Office"
                    />
                  </div>

                  {/* Main Category (ReadOnly Public Sector) */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10.5px] font-black text-slate-700 uppercase">Main Category</label>
                    <input
                      type="text"
                      readOnly
                      value="Public Sector"
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-100 rounded-xl text-xs font-semibold text-slate-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Subcategory Selection */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <div className="flex justify-between items-center">
                      <label className="text-[10.5px] font-black text-slate-700 uppercase">Sub Category</label>
                      {anonForm.category === 'Others' && (
                        <button
                          type="button"
                          onClick={() => {
                            setAnonForm(prev => ({
                              ...prev,
                              category: 'Temples',
                              customCategoryName: ''
                            }));
                          }}
                          className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold underline focus:outline-hidden border-none bg-transparent"
                        >
                          Choose Standard
                        </button>
                      )}
                    </div>
                    {anonForm.category === 'Others' ? (
                      <input
                        type="text"
                        placeholder="Specify Custom Subcategory (e.g. Govt Library, Fire Station)"
                        value={anonForm.customCategoryName || ''}
                        onChange={(e) => {
                          setAnonForm({
                            ...anonForm,
                            customCategoryName: e.target.value
                          });
                        }}
                        className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#027244]"
                      />
                    ) : (
                      <select
                        value={anonForm.category}
                        onChange={(e) => {
                          const subVal = e.target.value;
                          setAnonForm({
                            ...anonForm,
                            category: subVal,
                            customCategoryName: ''
                          });
                        }}
                        className="w-full px-3 py-2 border border-slate-205 bg-white rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#027244] cursor-pointer"
                      >
                        <option value="">-- Choose Subcategory --</option>
                        <option value="Temples">Temples</option>
                        <option value="Govt Schools">Govt Schools</option>
                        <option value="Govt Offices">Govt Offices</option>
                        <option value="Govt Hospitals">Govt Hospitals</option>
                        <option value="Marriage Halls">Marriage Halls</option>
                        <option value="Community Halls">Community Halls</option>
                        <option value="Trusts & NGOs">Trusts & NGOs</option>
                        <option value="Others">Others (Custom Category)</option>
                      </select>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10.5px] font-black text-slate-700 uppercase">Phone Number</label>
                    <input
                      type="text"
                      value={anonForm.phone}
                      onChange={(e) => setAnonForm({ ...anonForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#027244]"
                      placeholder="e.g. 04252 223456"
                    />
                  </div>

                  {/* Website */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10.5px] font-black text-slate-700 uppercase">Website (Optional)</label>
                    <input
                      type="url"
                      value={anonForm.website}
                      onChange={(e) => setAnonForm({ ...anonForm, website: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#027244]"
                      placeholder="e.g. https://udumalpet.nic.in"
                    />
                  </div>

                  {/* Location / Locality */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[10.5px] font-black text-slate-700 uppercase">Location / Locality</label>
                      <input
                        type="text"
                        value={anonForm.locality}
                        onChange={(e) => setAnonForm({ ...anonForm, locality: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#027244]"
                        placeholder="e.g. Gandhi Nagar"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[10.5px] font-black text-slate-700 uppercase">Pincode (Optional)</label>
                      <input
                        type="text"
                        value={anonForm.pincode}
                        onChange={(e) => setAnonForm({ ...anonForm, pincode: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#027244]"
                        placeholder="e.g. 642126"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10.5px] font-black text-slate-700 uppercase">Address</label>
                    <textarea
                      rows={2}
                      value={anonForm.address}
                      onChange={(e) => setAnonForm({ ...anonForm, address: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#027244]"
                      placeholder="e.g. Palani Road, Gandhi Nagar, Udumalpet"
                    />
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10.5px] font-black text-slate-700 uppercase">Description (Optional)</label>
                    <textarea
                      rows={3}
                      value={anonForm.description}
                      onChange={(e) => setAnonForm({ ...anonForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#027244]"
                      placeholder="Describe this listing..."
                    />
                  </div>

                  {/* Image Upload Option */}
                  <div className="flex flex-col gap-1.5 text-left border-t border-slate-100 pt-4 mt-2">
                    <label className="text-[10.5px] font-black text-slate-700 uppercase">Upload Business Image (Optional)</label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-205 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-100 transition-colors">
                        <Upload className="h-4 w-4 text-slate-505" />
                        <span>Choose File</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleAnonImageUpload} 
                          className="hidden" 
                        />
                      </label>
                      {imageUploading && (
                        <span className="text-[10px] text-[#027244] font-bold flex items-center gap-1">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Uploading...
                        </span>
                      )}
                      {anonForm.coverImageUrl && (
                        <div className="relative h-12 w-16 border border-slate-200 rounded-lg overflow-hidden shrink-0">
                          <img 
                            src={window.getImageUrl(anonForm.coverImageUrl)} 
                            alt="Preview" 
                            className="h-full w-full object-cover" 
                          />
                          <button
                            type="button"
                            onClick={() => setAnonForm(prev => ({ ...prev, coverImageUrl: '' }))}
                            className="absolute top-0.5 right-0.5 bg-rose-500 text-white rounded-full p-0.5 hover:bg-rose-600 transition-colors border-none flex items-center justify-center cursor-pointer"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

              </div>

              {/* Modal Actions Footer */}
              <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => { setShowAnonymousAddModal(false); resetAnonForm(); }}
                  className="px-5 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-xs rounded-xl cursor-pointer transition-colors shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePublishAnonListing}
                  disabled={anonSubmitLoading}
                  className="px-5 py-2.5 bg-[#027244] hover:bg-[#005934] disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-xl cursor-pointer transition-all shadow flex items-center gap-1.5 border-none"
                >
                  {anonSubmitLoading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Submitting...
                    </>
                  ) : (
                    'Publish Listing'
                  )}
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center bg-[#F8FAFC]">
      {/* Search Header Banner */}
      <section 
        className="w-full relative min-h-0 md:min-h-[260px] bg-[#001c41] text-white py-4 md:py-10 px-4 md:px-8 border-b border-slate-800"
      >
        <div className="relative max-w-[1600px] mx-auto flex flex-col items-center z-10 w-full">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-bold self-start mt-1 md:mt-2 order-1">
            <Link to="/" className="hover:text-[#f97316] transition-colors">Home</Link>
            <span>&gt;</span>
            <span className="text-slate-100">Businesses</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white mt-3 md:mt-4 self-start font-sans order-2">
            Businesses in Udumalpet
          </h1>
          <p className="hidden sm:block text-slate-400 text-xs font-semibold self-start mt-1.5 leading-relaxed order-3">
            Discover, compare and connect with the best local businesses.
          </p>
          
          <form onSubmit={handleSearchSubmit} className="mt-4 md:mt-8 w-full bg-white border border-slate-200 shadow-xl rounded-2xl p-2 flex flex-col md:flex-row gap-2 max-w-5xl order-4 text-slate-700">
            <div className="flex-1 flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 relative">
              <Search className="h-4.5 w-4.5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="What are you looking for?"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowHints(true);
                }}
                onFocus={() => setShowHints(true)}
                onBlur={() => setTimeout(() => setShowHints(false), 250)}
                className="w-full bg-transparent text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none"
              />

              {/* Category & Business Autocomplete Suggestions Dropdown */}
              {showHints && (suggestions.categories.length > 0 || suggestions.businesses.length > 0) && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-2xl rounded-2xl overflow-hidden z-50 max-h-80 overflow-y-auto animate-fadeIn text-left">
                  
                  {/* Categories section */}
                  {suggestions.categories.length > 0 && (
                    <div className="p-2 border-b border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 py-1.5 block">Categories</span>
                      {suggestions.categories.map((cat, idx) => (
                        <button
                          key={`cat-${idx}`}
                          type="button"
                          onClick={() => {
                            setSearchTerm(cat.name);
                            setSelectedCategory(cat.parent || 'All Categories');
                            setShowHints(false);
                            triggerQueryUpdate(cat.parent || 'All Categories', selectedLocality, undefined, undefined, undefined, cat.name);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-slate-50 rounded-lg flex items-center gap-2 text-xs font-bold text-slate-700 transition-colors border-none bg-transparent cursor-pointer"
                        >
                          <Grid className="h-3.5 w-3.5 text-emerald-500" />
                          <span>{cat.name}</span>
                          <span className="text-[10px] text-slate-400 font-semibold ml-auto">{cat.parent || ''}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Businesses section */}
                  {suggestions.businesses.length > 0 && (
                    <div className="p-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 py-1.5 block">Businesses</span>
                      {suggestions.businesses.map((biz, idx) => (
                        <button
                          key={`biz-${idx}`}
                          type="button"
                          onClick={() => {
                            setShowHints(false);
                            navigate(biz.slug ? `/${biz.slug}` : `/businesses/${biz.id}`);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-slate-50 rounded-lg flex items-center gap-2.5 text-xs font-bold text-slate-700 transition-colors border-none bg-transparent cursor-pointer"
                        >
                          {biz.logoUrl ? (
                            <img 
                              src={window.getImageUrl ? window.getImageUrl(biz.logoUrl) : biz.logoUrl} 
                              alt={biz.name} 
                              className="h-6 w-6 rounded-md object-cover border border-slate-200" 
                            />
                          ) : (
                            <Store className="h-5.5 w-5.5 text-emerald-600 bg-emerald-50 p-1 rounded-md" />
                          )}
                          <div className="flex flex-col text-left">
                            <span className="font-extrabold text-slate-800 flex items-center gap-1">
                              {biz.name}
                              {biz.isPremium && (
                                <span className="text-[8px] bg-amber-500/10 text-amber-700 font-black px-1 py-0.5 rounded">PRO</span>
                              )}
                            </span>
                            <span className="text-[9.5px] text-slate-400 font-bold">{biz.category}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="w-full md:w-48 flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
              <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Location"
                value={selectedLocality === 'All Localities' ? '' : selectedLocality}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedLocality(val || 'All Localities');
                }}
                className="w-full bg-transparent text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none"
              />
            </div>

            <div className="w-full md:w-48 flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 relative">
              <Grid className="h-4.5 w-4.5 text-slate-400 shrink-0" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option>All Categories</option>
                {dynamicAvailableCategories.map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <button type="submit" className="w-full md:w-auto bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs py-3 px-8 rounded-xl transition-all shadow-md shrink-0 cursor-pointer border-none">
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Continue Registration Banner (only shown when user has a draft business) */}
      {showDraftBanner && draftBusiness && (
        <div className="w-full max-w-[1600px] px-4 md:px-8 pt-6 pb-0 mx-auto animate-fadeIn">
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm shadow-amber-100/50">
            <div className="flex items-start sm:items-center gap-3">
              <div className="h-10 w-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0 border border-amber-200">
                <Briefcase className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-amber-900 text-xs leading-tight">
                  You have an incomplete business registration!
                </span>
                <span className="text-amber-700 text-[11px] font-semibold mt-0.5 leading-relaxed">
                  {draftBusiness.name ? `"${draftBusiness.name}"` : 'Your business'} — step {getDraftResumeStep(draftBusiness)} of 6 not yet completed. Your payment is confirmed.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                onClick={() => setShowDraftBanner(false)}
                className="text-amber-500 hover:text-amber-700 text-[10px] font-bold px-2 py-1 cursor-pointer border-none bg-transparent"
              >
                Dismiss
              </button>
              <button
                onClick={() => navigate(`/add-business?step=${getDraftResumeStep(draftBusiness)}`)}
                className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[11px] py-2 px-4 rounded-xl shadow transition-all cursor-pointer border-none flex items-center gap-1.5"
              >
                Continue Registration
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Two-column Content Grid */}
      <section className="mx-auto max-w-[1600px] w-full px-4 md:px-8 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Mobile Filter Toggle Button */}
        <div className="lg:hidden flex items-center justify-between gap-4 w-full bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm mb-1.5 text-left col-span-1">
          <button 
            onClick={() => setShowMobileFilters(true)}
            className="flex-1 py-2.5 px-4 bg-slate-50 border border-slate-250 text-slate-700 hover:text-slate-800 font-extrabold text-xs rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
          >
            <Filter className="h-4 w-4 text-[#027244]" />
            <span>Filter Businesses</span>
          </button>
          <button 
            onClick={() => {
              handleResetFilters();
              setShowMobileFilters(false);
            }}
            className="text-xs font-bold text-[#027244] hover:underline cursor-pointer px-2"
          >
            Reset
          </button>
        </div>

        {/* Mobile Filters Slide-out Drawer */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
              onClick={() => setShowMobileFilters(false)}
            />
            {/* Drawer container */}
            <aside className="relative flex flex-col gap-6 w-80 max-w-[85vw] h-full bg-white p-6 shadow-2xl overflow-y-auto animate-slideRight text-left z-50">
              {renderFilterContent(true)}
            </aside>
          </div>
        )}

        {/* Desktop Left Sidebar Filters */}
        <aside className="hidden lg:flex lg:col-span-1 bg-white border border-slate-200/80 shadow-md rounded-3xl p-6 flex-col gap-6 h-max text-left">
          {renderFilterContent(false)}
        </aside>

        {/* Right Main Results Grid */}
        <main className="lg:col-span-3 flex flex-col gap-6">
          {/* Filters summary and sorting bar */}
          <div className="bg-white border border-slate-200 shadow-sm p-3.5 sm:p-4.5 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs font-semibold text-slate-600">
            <span>
              Showing {businesses.length} result{businesses.length !== 1 ? 's' : ''} in Udumalpet
            </span>
            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-1.5">
                <span>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); triggerQueryUpdate(); }}
                  className="py-1 px-2 border border-slate-300 bg-white rounded cursor-pointer font-semibold focus:outline-none max-w-[130px] sm:max-w-none truncate"
                >
                  <option>Most Relevant</option>
                  <option>Highest Rating</option>
                  <option>Newest</option>
                </select>
              </div>
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50 shrink-0">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 sm:p-2.5 cursor-pointer transition-colors ${viewMode === 'grid' ? 'bg-[#027244] text-white' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Grid className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 sm:p-2.5 cursor-pointer transition-colors ${viewMode === 'list' ? 'bg-[#027244] text-white' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <List className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Cards Loading state */}
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="h-8 w-8 text-[#027244] animate-spin" />
              <span className="text-xs font-bold">Scanning local directory...</span>
            </div>
          )}

          {/* Empty Results state */}
          {!loading && businesses.length === 0 && (
            <div className="bg-white border border-slate-200/60 rounded-3xl py-16 px-6 text-center shadow-sm flex flex-col items-center justify-center gap-4 text-slate-400">
              <AlertCircle className="h-10 w-10 text-slate-300 animate-pulse" />
              <div>
                <h4 className="font-extrabold text-slate-700 text-base leading-none">No listings yet</h4>
                <p className="text-xs text-slate-500 font-semibold mt-2">List yours if you are a business owner!</p>
              </div>
              <div className="flex gap-3 justify-center mt-2 flex-wrap">
                <button onClick={() => navigate('/add-business')} className="py-2.5 px-6 bg-[#027244] hover:bg-[#005934] text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer">
                  Register Your Business
                </button>
                <button onClick={handleResetFilters} className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer">
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          {/* Cards rendering List / Grid */}
          {!loading && businesses.length > 0 && (
            <div className={viewMode === 'list' ? 'flex flex-col gap-5' : 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4.5 sm:gap-6'}>
              {displayedBusinesses.map((biz) => {
                const isExpired = biz.subscriptionStatus === 'expired' && !isGovernmentalOrPublic(biz);
                const isSubscribed = biz.subscriptionStatus === 'active' || isGovernmentalOrPublic(biz);
                const isOwner = currentUser && biz && (
                  (currentUser._id && biz.ownerId && currentUser._id === biz.ownerId) ||
                  (currentUser.id && biz.ownerId && currentUser.id === biz.ownerId) ||
                  (currentUser._id && biz.owner && currentUser._id === biz.owner) ||
                  (currentUser.id && biz.owner && currentUser.id === biz.owner) ||
                  (biz._id && typeof biz._id === 'string' && biz._id.startsWith('biz_')) ||
                  (!biz.ownerId && !biz.owner)
                );
                const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin');
                return (
                  <div
                    key={biz._id}
                    onClick={() => navigate(`/${biz.slug || biz._id}`)}
                    className={`relative card-premium group rounded-3xl overflow-hidden flex cursor-pointer ${
                      viewMode === 'list' ? 'flex-col md:flex-row' : 'flex-col min-h-[350px] sm:min-h-[460px]'
                    }`}
                  >
                    {/* Cover image (Blurred if subscription is expired!) */}
                    <div
                      onClick={(e) => { e.stopPropagation(); navigate(`/${biz.slug || biz._id}`); }}
                      className={`shrink-0 overflow-hidden relative bg-slate-50 border-slate-100 cursor-pointer ${
                        viewMode === 'list' 
                          ? 'w-full aspect-square md:w-48 md:h-48 rounded-t-[23px] md:rounded-l-[23px] md:rounded-tr-none border-b md:border-b-0 md:border-r' 
                          : 'w-full aspect-square rounded-t-[23px] border-b'
                      }`}
                    >
                      <img 
                        src={biz.logoUrl ? window.getImageUrl(biz.logoUrl) : '/default_business_cover.png'} 
                        alt={biz.name}
                        className={`h-full w-full transition-transform duration-750 ease-out-expo group-hover:scale-105 ${
                          biz.logoUrl ? 'object-contain p-4 bg-white' : 'object-cover'
                        }`}
                        style={{
                          filter: !isSubscribed ? 'blur(6px) grayscale(30%)' : 'none'
                        }}
                      />
                      {/* Badge (Verified / Premium / Google Linked) */}
                      {!isExpired && (
                        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1 z-10">
                          {biz.isFoundingMember && (
                            <div className="bg-amber-500 text-white px-1.5 py-0.5 rounded-lg shadow-xs flex items-center gap-0.5 border border-amber-600">
                              <Sparkles className="h-2.5 w-2.5 text-white fill-current" />
                              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider">Founding Member</span>
                            </div>
                          )}
                           {((biz.googlePlaceId && biz.googlePlaceId !== '') || (biz.googleBusinessLink && biz.googleBusinessLink !== '') || biz.googleLinked) && (
                            <div className="bg-white border border-blue-100 px-1.5 py-0.5 rounded-lg shadow-xs flex items-center gap-0.5">
                               <svg className="h-3 w-3 text-[#1a73e8] shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                 <path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.8 17 5 19 5a1 1 0 0 1 1 1z" fill="currentColor" />
                                 <path d="m9 12 2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                               </svg>
                              <span className="text-[8px] sm:text-[9px] font-black text-[#1a73e8] uppercase tracking-wider font-sans">Google Verified</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                      {isExpired && (isOwner || isAdmin) && (
                        <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center text-center p-2 text-white z-10">
                          <span className="bg-red-650 text-[8px] sm:text-[9px] font-extrabold uppercase px-2 py-1 rounded shadow">
                            Subscription Expired
                          </span>
                        </div>
                      )}
                     {/* Content Body */}
                    <div className="p-4 sm:p-6 flex-1 flex flex-col md:flex-row justify-between gap-3 sm:gap-5 relative">
                      <div className="flex flex-col gap-1.5 text-left relative z-30">
                        {/* Title */}
                        <Link
                          to={`/${biz.slug || biz._id}`}
                          className="font-black text-sm sm:text-[19px] text-[#001c41] hover:text-[#027244] transition-colors leading-tight"
                        >
                          {biz.name}
                        </Link>
                        <div 
                          className="flex flex-col gap-1.5"
                          style={{
                            filter: !isSubscribed ? 'blur-[4px] select-none pointer-events-none' : 'none'
                          }}
                        >
                          {/* Locality */}
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(biz.address ? `${biz.name}, ${biz.address}` : `${biz.name}, ${biz.locality || ''}, Udumalpet`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10.5px] sm:text-xs font-semibold text-slate-500 mt-0.5 hover:text-[#027244] transition-colors cursor-pointer group"
                            onClick={(e) => handleMapClick(e, biz._id)}
                            title="View on Google Maps"
                          >
                            <MapPin className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#027244] shrink-0" />
                            <span className="group-hover:underline">{biz.locality}, Udumalpet</span>
                          </a>

                          {/* Category */}
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(getCategorySlug(biz.category));
                            }}
                            className="flex items-center gap-1.5 text-[10.5px] sm:text-xs text-slate-455 font-semibold mt-0.5 hover:text-[#027244] hover:underline cursor-pointer transition-colors duration-200 select-none group/badge w-fit"
                          >
                            <Folder className="h-3 w-3 text-[#027244] shrink-0 transition-transform group-hover/badge:scale-110" />
                            <span>{biz.category}</span>
                          </div>

                          {/* Rating */}
                          <div className="flex items-center gap-1.5 mt-0.5 text-slate-600 text-[10.5px] sm:text-xs">
                            <div className="flex text-amber-400 shrink-0">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${i < Math.floor(biz.googleRating || 0) ? 'fill-current' : 'text-slate-200'}`} />
                              ))}
                            </div>
                            <span className="font-extrabold">{(biz.googleRating || 0).toFixed(1)}</span>
                            <span className="text-[9.5px] sm:text-xs text-slate-455 font-semibold">({biz.googleReviewsCount || 0})</span>
                          </div>

                          {/* Highlights Chips */}
                          {Array.isArray(biz.highlights) && (
                            <div className="hidden sm:flex flex-wrap items-center gap-4 mt-2 max-h-5 overflow-hidden">
                              {biz.highlights.map((h, i) => (
                                <div key={i} className="flex items-center gap-1 text-[11px] text-[#027244] font-semibold">
                                  <span className="h-4 w-4 bg-emerald-50 rounded-full border border-emerald-100 flex items-center justify-center text-[9px] font-extrabold shrink-0">✓</span>
                                  <span>{h}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Panel Actions */}
                      <div 
                        className="flex flex-col justify-center gap-1.5 sm:gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-3 sm:pt-4 md:pt-0 md:pl-6 shrink-0 md:w-36 relative z-30"
                        style={{
                          filter: !isSubscribed ? 'blur-[4px] select-none pointer-events-none' : 'none'
                        }}
                      >
                        {/* Call button */}
                        <button
                          onClick={() => handleCall(biz.phone, biz.name, biz._id)}
                          className="py-2 sm:py-2.5 w-full border border-[#027244] hover:bg-emerald-50 text-[#027244] font-extrabold text-[10.5px] sm:text-xs rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 transition-colors cursor-pointer"
                        >
                          <PhoneCall className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          <span>Call</span>
                        </button>
                        
                        {/* WhatsApp button - HIDDEN on expired subscriptions! */}
                        {!isExpired ? (
                          <button
                            onClick={() => handleWhatsApp(biz.whatsapp, biz.name, biz._id)}
                            className="py-2 sm:py-2.5 w-full bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-[10.5px] sm:text-xs rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 transition-all shadow-sm cursor-pointer"
                          >
                            <span>WhatsApp</span>
                          </button>
                        ) : (
                          <span className="py-2 sm:py-2.5 w-full bg-slate-100 text-slate-400 border border-slate-200 font-extrabold text-[9px] sm:text-[10px] rounded-xl flex items-center justify-center select-none text-center leading-none">
                            WhatsApp Locked
                          </span>
                        )}

                        <Link
                          to={`/${biz.slug || biz._id}`}
                          className="py-2 sm:py-2.5 w-full bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-555 font-extrabold text-[10.5px] sm:text-xs rounded-xl flex items-center justify-center transition-colors text-center"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>

                    {/* Glassmorphism Lock Overlay for Inactive Subscriptions */}
                    {!isSubscribed && (
                      <div 
                        onClick={(e) => { e.stopPropagation(); navigate(`/${biz.slug || biz._id}`); }}
                        className="absolute inset-0 bg-transparent hover:bg-slate-900/5 z-20 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer p-4 text-center"
                      >
                        <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3 flex flex-col items-center gap-1.5 shadow-lg max-w-[180px]">
                          <svg className="h-5 w-5 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span className="text-[10px] font-black uppercase tracking-widest text-white select-none">
                            Profile Locked
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Component */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1.5 mt-10 select-none">
              {/* Previous Button */}
              <button
                disabled={currentPage === 1}
                onClick={() => {
                  setCurrentPage(prev => Math.max(1, prev - 1));
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
                className={`px-3 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                Prev
              </button>

              {/* Page Number Buttons */}
              {getPageNumbers().map((page, idx) => {
                if (page === '...') {
                  return (
                    <span key={`ellipsis-${idx}`} className="text-slate-400 px-1.5 text-xs select-none">
                      ...
                    </span>
                  );
                }
                const isActive = page === currentPage;
                return (
                  <button
                    key={`page-${page}`}
                    onClick={() => {
                      setCurrentPage(page);
                      window.scrollTo({ top: 300, behavior: 'smooth' });
                    }}
                    className={`h-9 w-9 rounded-lg font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#027244] text-white font-extrabold shadow'
                        : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              {/* Next Button */}
              <button
                disabled={currentPage === totalPages}
                onClick={() => {
                  setCurrentPage(prev => Math.min(totalPages, prev + 1));
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
                className={`px-3 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                Next
              </button>
            </div>
          )}
        </main>
      </section>

      {/* Footer Trust Bar & Business Callout (Combined in one gorgeous container as per mockup crop) */}
      <div className="mx-auto max-w-[1600px] w-full border border-slate-200/80 bg-white rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 mt-12 shadow-sm font-sans">
        
        {/* Left Col (Col-span-9): Solid Navy Blue panel with 4 trust columns separated by lines */}
        <div className="lg:col-span-9 bg-[#001c41] text-white p-7 grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
          {[
            {
              icon: (
                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="6" />
                  <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
                </svg>
              ),
              title: 'Verified Businesses',
              desc: 'All businesses are manually verified'
            },
            {
              icon: (
                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 11 2 2 4-4" />
                </svg>
              ),
              title: 'Safe & Trusted',
              desc: 'Connect with reliable local businesses'
            },
            {
              icon: (
                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  <path d="M14 2h.01M18 2h.01M16 6h.01" strokeWidth="3" />
                </svg>
              ),
              title: 'Easy to Connect',
              desc: 'Call, WhatsApp or get directions instantly'
            },
            {
              icon: (
                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              ),
              title: 'Grow Together',
              desc: 'Support local and grow the community'
            }
          ].map((item, idx) => (
            <div key={idx} className={`flex flex-col items-center text-center gap-2 px-2 ${idx < 3 ? 'sm:border-r border-slate-700/60' : ''}`}>
              <div className="text-white shrink-0 mb-1">
                {item.icon}
              </div>
              <span className="font-extrabold text-white text-xs leading-none">{item.title}</span>
              <span className="text-[10px] text-slate-400 font-semibold leading-normal mt-1 max-w-[130px]">{item.desc}</span>
            </div>
          ))}
        </div>

        {/* Right Col (Col-span-3): White panel with Left-aligned Owner Callout & List Business Green Button */}
        <div className="lg:col-span-3 bg-white p-7 flex flex-col justify-center items-start gap-3.5 pl-8 border-t lg:border-t-0 lg:border-l border-slate-200/80">
          <div className="flex flex-col gap-1 text-left">
            <span className="font-black text-[#001c41] text-sm">Are you a business owner?</span>
            <span className="text-slate-500 text-[10.5px] font-semibold leading-relaxed max-w-[200px]">
              {showDraftBanner && draftBusiness
                ? 'You have an incomplete registration. Resume to publish your listing.'
                : 'List your business and reach thousands of local customers.'}
            </span>
          </div>
          {showDraftBanner && draftBusiness ? (
            <button
              onClick={() => navigate(`/add-business?step=${getDraftResumeStep(draftBusiness)}`)}
              className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs py-2.5 px-6 rounded-xl transition-all shadow shrink-0 cursor-pointer border-none flex items-center gap-2"
            >
              Continue Registration
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <Link 
              to="/add-business" 
              className="bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs py-2.5 px-6 rounded-xl transition-all shadow shrink-0"
            >
              List Your Business
            </Link>
          )}
        </div>

      </div>
    </div>
  );
}

export default function BusinessesingsPage({ forceFocus }) {
  return (
    <Suspense fallback={
      <div className="py-32 flex flex-col items-center justify-center gap-2 text-slate-400">
        <RefreshCw className="h-6 w-6 animate-spin text-[#027244]" />
        <span className="text-xs font-semibold">Loading platform...</span>
      </div>
    }>
      <BusinessesList forceFocus={forceFocus} />
    </Suspense>
  );
}
