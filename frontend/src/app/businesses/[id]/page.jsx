import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  MapPin, Phone, Mail, Clock, ShieldCheck, HeartHandshake, Star, Share2, Heart, Award, 
  ArrowLeft, Send, CheckCircle2, MessageSquare, AlertCircle, RefreshCw, Calendar, Globe, Sparkles,
  Briefcase, Users, ChevronRight, Check, X, Facebook, Twitter, Edit3, Plus, Upload, Trash2, Instagram, Move, ImageIcon,
  Utensils, Eye
} from 'lucide-react';


const isFoodRelated = (category, customCategoryName) => {
  const cat = (category || '').toLowerCase();
  const sub = (customCategoryName || '').toLowerCase();
  
  const foodKeywords = [
    'food', 'restaurant', 'restarent', 'cafe', 'bakery', 'sweet', 'catering', 
    'juice', 'ice cream', 'parlor', 'hotel', 'dhaba', 'mess', 
    'biryani', 'pizza', 'burger', 'kitchen', 'canteen', 'sweets', 'tea',
    'beverage', 'stall', 'caterer', 'dining', 'eatery', 'baker'
  ];
  
  const foodCategories = [
    'Restaurants', 'Bakeries', 'Cafes & Tea Shops', 'Sweet Shops', 
    'Fast Food Centers', 'Catering Services', 'Juice & Ice Cream Parlors',
    'Food & Restaurants', 'Food & Drinks', 'Hotels & Restaurants'
  ];

  return (
    foodCategories.includes(category) ||
    foodKeywords.some(keyword => cat.includes(keyword) || sub.includes(keyword))
  );
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

const getQuickTimingsDisplay = (timings) => {
  if (!timings || typeof timings !== 'object') {
    return <span>9:00 AM - 8:00 PM</span>;
  }
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];
  const todayTiming = timings[today] || 'Closed';
  return (
    <div className="flex flex-col">
      <span>Today ({today.slice(0, 3)}): {todayTiming}</span>
      <span className="text-[11px] text-slate-400 font-semibold mt-0.5">Full hours in sidebar</span>
    </div>
  );
};

const getTimingsSummaryString = (timings) => {
  if (!timings || typeof timings !== 'object') {
    return typeof timings === 'string' ? timings : '9:00 AM - 8:00 PM';
  }
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];
  const todayTiming = timings[today] || 'Closed';
  return `Today (${today.slice(0, 3)}): ${todayTiming}`;
};

const viewedBusinesses = new Set();

export default function BusinessDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Inject parent listing into history stack on direct entry
  useEffect(() => {
    if (window.__spa_nav_count === 1) {
      const currentPath = window.location.pathname + window.location.search + window.location.hash;
      window.history.replaceState(null, '', '/businesses');
      window.history.pushState(null, '', currentPath);
      window.__spa_nav_count++;
    }
  }, []);

  const [activeTab, setActiveTab] = useState('overview'); // overview | services | photos | reviews | offers | about | map
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const [business, setBusiness] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  const displayGallery = business ? Array.from(new Set(business.galleryUrls || [])).filter(Boolean).map(url => window.getImageUrl(url)) : [];
  const galleryCount = displayGallery.length;
  const mainImage = business ? (window.getImageUrl(business.coverImageUrl) || "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80") : "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80";

  const [mediaError, setMediaError] = useState('');
  const directionsUrl = business
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address ? `${business.name}, ${business.address}` : `${business.name}, Udumalpet`)}`
    : '#';

  const [showMenuModal, setShowMenuModal] = useState(false);
  const [menuUploading, setMenuUploading] = useState(false);
  const [menuUrlsState, setMenuUrlsState] = useState([]);
  const [menuError, setMenuError] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);

  // Verification states
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyPlaceId, setVerifyPlaceId] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifySuccess, setVerifySuccess] = useState('');

  // Sync menuUrlsState with business.menuUrls
  useEffect(() => {
    if (business && business.menuUrls) {
      setMenuUrlsState(business.menuUrls);
    }
  }, [business, showMenuModal]);

  useEffect(() => {
    if (activePhotoIndex === null) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActivePhotoIndex(null);
      } else if (e.key === 'ArrowRight' && typeof activePhotoIndex === 'number') {
        setActivePhotoIndex(prev => (prev < displayGallery.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowLeft' && typeof activePhotoIndex === 'number') {
        setActivePhotoIndex(prev => (prev > 0 ? prev - 1 : prev));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhotoIndex, displayGallery]);

  useEffect(() => {
    if (!showVerifyModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowVerifyModal(false);
        setVerifyError('');
        setVerifySuccess('');
        setVerifyPlaceId('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showVerifyModal]);

  const handleMenuUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setMenuUploading(true);
    setMenuError('');
    const token = localStorage.getItem('ubt_token');
    const uploaded = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        setMenuError(`File ${file.name} is too large (max 5MB).`);
        continue;
      }

      const formData = new FormData();
      formData.append('image', file);

      try {
        const res = await fetch('http://localhost:5000/api/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });
        const data = await res.json();
        if (data.success && data.url) {
          uploaded.push(data.url);
        } else {
          setMenuError(data.message || 'Failed to upload menu page.');
        }
      } catch (err) {
        console.error('Upload error:', err);
        setMenuError('Failed to upload. Make sure server is running.');
      }
    }

    if (uploaded.length > 0) {
      setMenuUrlsState(prev => [...prev, ...uploaded]);
    }
    setMenuUploading(false);
  };

  const handleSaveMenu = async () => {
    setMenuUploading(true);
    setMenuError('');
    const token = localStorage.getItem('ubt_token');
    try {
      const res = await fetch(`http://localhost:5000/api/businesses/${business._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          menuUrls: menuUrlsState,
          isFoodBusiness: true
        })
      });
      const data = await res.json();
      if (data.success) {
        setBusiness(data.data);
        setShowMenuModal(false);
      } else {
        setBusiness(prev => ({ ...prev, menuUrls: menuUrlsState, isFoodBusiness: true }));
        setShowMenuModal(false);
      }
    } catch (err) {
      console.error('Save menu error:', err);
      setBusiness(prev => ({ ...prev, menuUrls: menuUrlsState, isFoodBusiness: true }));
      setShowMenuModal(false);
    } finally {
      setMenuUploading(false);
    }
  };

  const [likeLoading, setLikeLoading] = useState(false);

  const handleLikeBusiness = async () => {
    if (!business) return;
    setLikeLoading(true);
    try {
      const guestId = localStorage.getItem('ubt_guest_id');
      const token = localStorage.getItem('ubt_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:5000/api/businesses/${business._id}/like`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ guestId })
      });
      const data = await res.json();
      if (data.success) {
        setBusiness(prev => ({
          ...prev,
          likes: data.data
        }));
      }
    } catch (err) {
      console.error('Failed to toggle business like:', err);
    } finally {
      setLikeLoading(false);
    }
  };

  const currentGuestId = localStorage.getItem('ubt_guest_id');
  const currentUserId = currentUser ? (currentUser._id || currentUser.id) : null;
  const isLiked = business && business.likes && business.likes.some(likeStr => {
    if (!likeStr) return false;
    const parts = likeStr.split('|');
    if (parts.length === 1) {
      return likeStr === currentUserId || likeStr === currentGuestId;
    }
    const [dbUserId, dbGuestId] = parts;
    if (currentUserId && dbUserId === currentUserId) return true;
    if (currentGuestId && dbGuestId === currentGuestId) return true;
    return false;
  });

  const handleVerifyGoogleBusiness = async () => {
    setVerifyLoading(true);
    setVerifyError('');
    setVerifySuccess('');
    try {
      // 1. Fetch place details using autofill endpoint
      const autofillRes = await fetch('http://localhost:5000/api/businesses/google-autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId: verifyPlaceId })
      });
      const autofillData = await autofillRes.json();
      if (!autofillData.success || !autofillData.data) {
        setVerifyError(autofillData.message || 'Failed to fetch details for the provided Place ID.');
        setVerifyLoading(false);
        return;
      }

      const googlePlace = autofillData.data;

      // 2. Verify the address matching
      const googlePincodeClean = googlePlace.pincode ? googlePlace.pincode.replace(/\s+/g, '') : '';
      const businessPincodeClean = business.pincode ? business.pincode.replace(/\s+/g, '') : '';
      
      let addressesMatch = false;
      if (googlePincodeClean && businessPincodeClean && googlePincodeClean.slice(0, 6) === businessPincodeClean.slice(0, 6)) {
        addressesMatch = true;
      } else {
        const addr1 = (googlePlace.address || '').toLowerCase().replace(/[^a-z0-9]/g, ' ');
        const addr2 = (business.address || '').toLowerCase().replace(/[^a-z0-9]/g, ' ');
        const words1 = addr1.split(' ').filter(w => w.length > 3);
        const words2 = addr2.split(' ').filter(w => w.length > 3);
        const common = words1.filter(w => words2.includes(w));
        if (common.length >= 2) {
          addressesMatch = true;
        }
      }

      if (!addressesMatch) {
        setVerifyError(`Address Mismatch! The address on Google Place does not match your registered business address. Pincode on Google: ${googlePlace.pincode || 'N/A'}, Registered Pincode: ${business.pincode || 'N/A'}`);
        setVerifyLoading(false);
        return;
      }

      // 3. Match successful! Sync with backend
      const storedToken = localStorage.getItem('ubt_token');
      
      // If it's a mock business (starts with 'biz_'), we just simulate success locally
      if (business._id && typeof business._id === 'string' && business._id.startsWith('biz_')) {
        const updatedBiz = {
          ...business,
          googlePlaceId: googlePlace.googlePlaceId,
          googleRating: googlePlace.googleRating || 4.7,
          googleReviewsCount: googlePlace.googleReviewsCount || 10,
          googleReviews: googlePlace.googleReviews || [],
          timings: googlePlace.openingHours || googlePlace.timings || business.timings,
          isAddressVerified: true,
          googleLinked: true
        };
        setVerifySuccess('Business address verified and linked successfully!');
        setBusiness(updatedBiz);
        setTimeout(() => {
          setShowVerifyModal(false);
          setVerifySuccess('');
          setVerifyPlaceId('');
        }, 2000);
        return;
      }

      const syncRes = await fetch(`http://localhost:5000/api/businesses/${business._id}/sync-google`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedToken}`
        },
        body: JSON.stringify({
          googlePlaceId: googlePlace.googlePlaceId,
          googleRating: googlePlace.googleRating,
          googleReviewsCount: googlePlace.googleReviewsCount,
          googleReviews: googlePlace.googleReviews,
          timings: googlePlace.openingHours || googlePlace.timings
        })
      });
      const syncData = await syncRes.json();
      if (syncData.success) {
        setVerifySuccess('Business address verified and linked successfully!');
        // Update local business state
        setBusiness(syncData.data);
        setTimeout(() => {
          setShowVerifyModal(false);
          setVerifySuccess('');
          setVerifyPlaceId('');
        }, 2000);
      } else {
        setVerifyError(syncData.message || 'Failed to sync Google profile.');
      }
    } catch (err) {
      setVerifyError('An error occurred during verification. Please try again.');
    } finally {
      setVerifyLoading(false);
    }
  };




  const handleGalleryUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setMediaError('');
    const token = localStorage.getItem('ubt_token');
    const uploaded = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        setMediaError(`File ${file.name} is too large (max 5MB).`);
        continue;
      }

      const formData = new FormData();
      formData.append('image', file);

      try {
        const res = await fetch('http://localhost:5000/api/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });
        const data = await res.json();
        if (data.success && data.url) {
          uploaded.push(data.url);
        } else {
          setMediaError(data.message || `Failed to upload ${file.name}`);
        }
      } catch (err) {
        console.error('Upload error:', err);
        setMediaError('Upload failed. Check if local server is running.');
      }
    }

    if (uploaded.length > 0) {
      const currentGallery = Array.from(new Set(business.galleryUrls || [])).filter(Boolean);
      const combined = Array.from(new Set([...currentGallery, ...uploaded]));
      
      try {
        const saveRes = await fetch(`http://localhost:5000/api/businesses/${business._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            galleryUrls: combined
          })
        });
        const saveData = await saveRes.json();
        if (saveData.success) {
          setBusiness(saveData.data);
        } else {
          setBusiness(prev => ({ ...prev, galleryUrls: combined }));
        }
      } catch (err) {
        console.error('Save gallery error:', err);
        setBusiness(prev => ({ ...prev, galleryUrls: combined }));
      }
    }
  };

  const handleDeleteGalleryPhoto = async (urlToDelete) => {
    if (!window.confirm('Are you sure you want to remove this image from the gallery?')) return;
    
    setMediaError('');
    const token = localStorage.getItem('ubt_token');
    const currentGallery = Array.from(new Set(business.galleryUrls || [])).filter(Boolean);
    const updated = currentGallery.filter(url => url !== urlToDelete);

    try {
      const saveRes = await fetch(`http://localhost:5000/api/businesses/${business._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          galleryUrls: updated
        })
      });
      const saveData = await saveRes.json();
      if (saveData.success) {
        setBusiness(saveData.data);
      } else {
        setBusiness(prev => ({ ...prev, galleryUrls: updated }));
      }
    } catch (err) {
      console.error('Delete photo error:', err);
      setBusiness(prev => ({ ...prev, galleryUrls: updated }));
    }
  };


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

  // Write review form states
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState('');
  const [reviewSubmitLoading, setReviewSubmitLoading] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Send enquiry form states
  const [enquiryName, setEnquiryName] = useState('');
  const [enquiryPhone, setEnquiryPhone] = useState('');
  const [enquiryMessage, setEnquiryMessage] = useState('Hello, I am interested in your services and would like to receive details.');
  const [enquirySuccess, setEnquirySuccess] = useState(false);

  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);

  // Edit Profile modal removed for read-only view

  // Handlers for edit details removed for read-only view


  useEffect(() => {
    fetchBusinessDetails();
  }, [params.id]);

  const fetchBranches = async (businessId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/branches/business/${businessId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setBranches(data.data);
      }
    } catch (err) {
      console.warn('Failed to load branches from server. Using mock branches if mock business.');
      if (businessId === 'biz_1' || businessId === 'UBT-10024') {
        setBranches([
          {
            _id: 'mock_branch_1',
            name: 'Sri Murugan Stores - Eripalayam Branch',
            address: 'Eripalayam Main Road, Udumalpet Main Town, Tamil Nadu - 642126',
            phone: '+91 94430 55555',
            googleMapsLocation: 'https://maps.google.com/?q=Eripalayam+Udumalpet',
            workingHours: '9:00 AM - 9:00 PM',
            branchManagerName: 'Murugan Jr.',
            latitude: 10.5912,
            longitude: 77.2515,
            status: 'Approved'
          },
          {
            _id: 'mock_branch_2',
            name: 'Sri Murugan Stores - Dharapuram Road Branch',
            address: 'Dharapuram Road, Udumalpet Main Town, Tamil Nadu - 642126',
            phone: '+91 94430 66666',
            googleMapsLocation: 'https://maps.google.com/?q=Dharapuram+Road+Udumalpet',
            workingHours: '9:00 AM - 9:00 PM',
            branchManagerName: 'Senthil Kumar',
            latitude: 10.584,
            longitude: 77.252,
            status: 'Approved'
          }
        ]);
      }
    }
  };

  const fetchMenu = async (businessId) => {
    if (!businessId) return;
    setMenuLoading(true);
    setMenuError('');
    try {
      if (businessId === 'UBT-10024' || String(businessId).startsWith('biz_')) {
        throw new Error('Offline mock mode');
      }
      const res = await fetch(`http://localhost:5000/api/menu/${businessId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setMenuItems(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch menu items');
      }
    } catch (err) {
      console.warn('Using mock menu items due to error or mock business id:', err.message);
      // Dynamic mock menu items based on business
      if (businessId === 'biz_7') {
        setMenuItems([
          {
            _id: 'menu_mock_1',
            businessId: businessId,
            name: 'Chocolate Truffle Cake',
            price: 650,
            offerPrice: 599,
            isVeg: true,
            isAvailable: true,
            description: 'Rich, moist chocolate cake layered with dark chocolate ganache and chocolate flakes.',
            category: 'Cakes'
          },
          {
            _id: 'menu_mock_2',
            businessId: businessId,
            name: 'Paneer Tikka Sandwich',
            price: 120,
            offerPrice: 99,
            isVeg: true,
            isAvailable: true,
            description: 'Grilled sandwich stuffed with spiced paneer tikka, mint chutney, onions, and capsicum.',
            category: 'Sandwiches'
          },
          {
            _id: 'menu_mock_3',
            businessId: businessId,
            name: 'Special Veg Burger',
            price: 110,
            offerPrice: null,
            isVeg: true,
            isAvailable: true,
            description: 'Crispy vegetable patty topped with cheese, lettuce, tomatoes, onions, and house mayonnaise.',
            category: 'Fast Food'
          },
          {
            _id: 'menu_mock_4',
            businessId: businessId,
            name: 'Cold Coffee with Ice Cream',
            price: 90,
            offerPrice: 79,
            isVeg: true,
            isAvailable: false,
            description: 'Chilled blended coffee served with a scoop of vanilla ice cream and chocolate syrup drizzle.',
            category: 'Beverages'
          }
        ]);
      } else {
        setMenuItems([
          {
            _id: 'menu_mock_1',
            businessId: businessId,
            name: 'Special South Indian Meals',
            price: 150,
            offerPrice: 120,
            isVeg: true,
            isAvailable: true,
            description: 'A traditional banana leaf meal with rice, sambar, rasam, kootu, poriyal, appalam, and sweet payasam.',
            category: 'Meals'
          },
          {
            _id: 'menu_mock_2',
            businessId: businessId,
            name: 'Udumalpet Special Mutton Biryani',
            price: 280,
            offerPrice: 250,
            isVeg: false,
            isAvailable: true,
            description: 'Aromatic seeraga samba biryani cooked with tender local lamb chops and spices, served with raita and brinjal curry.',
            category: 'Biryani'
          },
          {
            _id: 'menu_mock_3',
            businessId: businessId,
            name: 'Paneer Butter Masala',
            price: 180,
            offerPrice: null,
            isVeg: true,
            isAvailable: true,
            description: 'Rich and creamy cottage cheese chunks simmered in a mildly spiced onion-tomato gravy with butter.',
            category: 'Gravies'
          },
          {
            _id: 'menu_mock_4',
            businessId: businessId,
            name: 'Ghee Onion Rava Dosa',
            price: 110,
            offerPrice: 99,
            isVeg: true,
            isAvailable: false,
            description: 'Crispy semolina crepe with finely chopped onions, flavored with pure ghee, served with three chutneys and hot sambar.',
            category: 'Tiffin'
          }
        ]);
      }
    } finally {
      setMenuLoading(false);
    }
  };

  const fetchBusinessDetails = async () => {
    setLoading(true);
    const hasBeenViewed = viewedBusinesses.has(params.id);
    if (!hasBeenViewed) {
      viewedBusinesses.add(params.id);
    }
    try {
      const url = hasBeenViewed
        ? `http://localhost:5000/api/businesses/${params.id}?skipInc=true`
        : `http://localhost:5000/api/businesses/${params.id}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        const currentViews = data.data.views || 0;
        localStorage.setItem(`ubt_views_${params.id}`, currentViews);
        setBusiness(data.data);
        setReviews(data.data.reviews || []);
        fetchBranches(data.data._id);
        if (isFoodRelated(data.data.category, data.data.customCategoryName)) {
          fetchMenu(data.data._id);
        }
      } else {
        throw new Error('Business details not found.');
      }
    } catch (err) {
      console.warn('API error or mock ID request, falling back to gorgeous mock business details.', err);
      
      // Offline fallback: Match the correct mock business details based on the ID
      const mockBizList = {
        biz_1: {
          _id: 'biz_1',
          name: 'Sri Murugan Stores',
          category: 'Shopping',
          type: 'Departmental Stores',
          description: 'Sri Murugan Stores is a premium departmental store in Gandhi Nagar, Udumalpet offering fresh organic grocery items, dry fruits, fresh pulses and household commodities.',
          yearEstablished: 1998,
          employeeCount: '20 - 50',
          gstNumber: '33AAACM1234F1Z1',
          services: ['Organic Groceries', 'Dry Fruits Import', 'Household Commodities', 'Free Home Delivery', 'Special Festival Gift Packs'],
          brands: ['Tata', 'Aashirvaad', 'Rin', 'Surf Excel', 'Dhoni Tea'],
          phone: '+91 94430 12345',
          whatsapp: '+91 94430 12345',
          email: 'contact@muruganstores.com',
          website: '',
          address: 'Gandhi Nagar Main Road, Udumalpet - 642126',
          locality: 'Gandhi Nagar',
          pincode: '642126',
          isAddressVerified: true,
          logoUrl: '',
          coverImageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
          galleryUrls: [
            'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80',
            'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&q=80',
            'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=500&q=80'
          ],
          googlePlaceId: 'ChIJSriMuruganStores10024',
          googleRating: 4.6,
          googleReviewsCount: 128,
          googleReviews: [
            { authorName: 'Mano R.', rating: 5, text: 'Very competitive prices and excellent grocery packing quality.' },
            { authorName: 'Renuka Devi', rating: 4, text: 'Best department store in Gandhi Nagar area. Door delivery is very prompt.' }
          ],
          coordinates: { lat: 10.5898, lng: 77.2448 },
          timings: {
            Monday: '9:00 AM - 9:00 PM',
            Tuesday: '9:00 AM - 9:00 PM',
            Wednesday: '9:00 AM - 9:00 PM',
            Thursday: '9:00 AM - 9:00 PM',
            Friday: '9:00 AM - 9:00 PM',
            Saturday: '9:00 AM - 9:00 PM',
            Sunday: '9:00 AM - 1:00 PM'
          },
          languagesKnown: 'Tamil, English',
          serviceArea: 'Gandhi Nagar, Udumalpet Town',
          subscriptionStatus: 'active'
        },
        biz_2: {
          _id: 'biz_2',
          name: 'Green Valley Hotel',
          category: 'Food & Restaurants',
          type: 'Vegetarian Restaurant',
          description: 'Green Valley Hotel is one of the most popular vegetarian restaurants on Pollachi Road in Udumalpet, offering delicious South Indian meals, tiffin items, and premium accommodation facilities.',
          yearEstablished: 2010,
          employeeCount: '10 - 20',
          gstNumber: '33ABCDE1234F1Z8',
          services: ['South Indian Meals', 'North Indian Dishes', 'Tiffin Items', 'Air Conditioned Dining', 'Spacious Parking', 'Party Hall'],
          brands: [],
          phone: '+91 98945 99999',
          whatsapp: '+91 98945 99999',
          email: 'greenvalleyhotel@gmail.com',
          website: 'www.greenvalleyhotel.in',
          address: 'Pollachi Road, Udumalpet - 642128',
          locality: 'Pollachi Road',
          pincode: '642128',
          isAddressVerified: true,
          logoUrl: '',
          coverImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
          galleryUrls: [
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80',
            'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&q=80',
            'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80'
          ],
          googlePlaceId: 'ChIJGreenValleyHotelUdt',
          googleRating: 4.8,
          googleReviewsCount: 98,
          googleReviews: [
            { authorName: 'Subramanian K.', rating: 5, text: 'Delicious vegetarian food! The Ghee Roast was exceptionally crispy and flavorful.' },
            { authorName: 'Deepak Raj', rating: 4, text: 'Great place for family dining. Ample parking space is a big plus.' }
          ],
          coordinates: { lat: 10.5891, lng: 77.2412 },
          timings: {
            Monday: '6:00 AM - 10:30 PM',
            Tuesday: '6:00 AM - 10:30 PM',
            Wednesday: '6:00 AM - 10:30 PM',
            Thursday: '6:00 AM - 10:30 PM',
            Friday: '6:00 AM - 10:30 PM',
            Saturday: '6:00 AM - 10:30 PM',
            Sunday: '6:00 AM - 10:30 PM'
          },
          languagesKnown: 'Tamil, English, Malayalam',
          serviceArea: 'Udumalpet Town',
          subscriptionStatus: 'active'
        },
        biz_3: {
          _id: 'biz_3',
          name: 'R.K. Electricals',
          category: 'Home Services',
          type: 'Electrical Services',
          description: 'R.K. Electricals is a trusted electrical service provider in Udumalpet, offering a wide range of residential, commercial and industrial electrical solutions. We are known for our on-time service, expert technicians and affordable pricing.',
          yearEstablished: 2012,
          employeeCount: '10 - 20',
          gstNumber: '33ABCDE1234F1Z5',
          services: ['Home Wiring', 'Electrical Repairs', 'Inverter & Battery Setup', 'CCTV Installation', 'Fan & Light Installation', 'MCB & Switch Board Setup', 'Generator Installation', 'Industrial Electrical Works'],
          brands: ['Havells', 'Finolex', 'Legrand', 'Syska', 'Anchor'],
          phone: '+91 98945 43100',
          whatsapp: '+91 98945 43100',
          email: 'rkelectricals@gmail.com',
          website: 'www.rkelectricals.in',
          address: 'Pollachi Road, Udumalpet, Tamil Nadu - 642126',
          locality: 'Pollachi Road',
          pincode: '642126',
          isAddressVerified: true,
          logoUrl: '',
          coverImageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80',
          galleryUrls: [
            'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&q=80',
            'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&q=80',
            'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=500&q=80',
            'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&q=80'
          ],
          googlePlaceId: 'ChIJRKElectricalsUdt',
          googleRating: 4.7,
          googleReviewsCount: 84,
          googleReviews: [
            { authorName: 'Karthik S.', rating: 5, text: 'Excellent service! They came on time and fixed the inverter issue quickly. Very professional.' },
            { authorName: 'Manoj Kumar', rating: 4, text: 'Good work and polite staff. They explained the issue clearly and did a neat job.' },
            { authorName: 'Revathi Devi', rating: 5, text: 'Very reliable service for home electrical work. Highly recommended!' }
          ],
          coordinates: { lat: 10.5891, lng: 77.2412 },
          timings: {
            Monday: '9:00 AM - 8:00 PM',
            Tuesday: '9:00 AM - 8:00 PM',
            Wednesday: '9:00 AM - 8:00 PM',
            Thursday: '9:00 AM - 8:00 PM',
            Friday: '9:00 AM - 8:00 PM',
            Saturday: '9:00 AM - 8:00 PM',
            Sunday: '9:00 AM - 1:00 PM'
          },
          languagesKnown: 'Tamil, English',
          serviceArea: 'Udumalpet, Pollachi, Palladam, Madathukulam and nearby areas',
          subscriptionStatus: 'active'
        },
        biz_4: {
          _id: 'biz_4',
          name: 'City Hospital',
          category: 'Health & Medical',
          type: 'General Hospital',
          description: 'City Hospital is a premier healthcare institution on Dharapuram Road, Udumalpet, offering 24/7 emergency services, expert doctors across multiple specialties, and state-of-the-art diagnostic facilities.',
          yearEstablished: 2005,
          employeeCount: '50 - 100',
          gstNumber: '',
          services: ['24x7 Emergency Care', 'Outpatient Services', 'Inpatient General Wards', 'Pharmacy', 'Diagnostic Lab', 'ICU Facility', 'Ambulance Service'],
          brands: [],
          phone: '+91 4252 223456',
          whatsapp: '+91 98425 22345',
          email: 'info@cityhospitaludt.com',
          website: 'www.cityhospitaludt.com',
          address: 'Dharapuram Road, Udumalpet - 642126',
          locality: 'Dharapuram Road',
          pincode: '642126',
          isAddressVerified: false,
          logoUrl: '',
          coverImageUrl: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&q=80',
          galleryUrls: [
            'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=500&q=80',
            'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=500&q=80',
            'https://images.unsplash.com/photo-1504813184591-01557998c722?w=500&q=80'
          ],
          googlePlaceId: 'ChIJCityHospitalUdt',
          googleRating: 4.5,
          googleReviewsCount: 206,
          googleReviews: [
            { authorName: 'Ramesh Krishnan', rating: 5, text: 'Very quick emergency response. The doctors are highly experienced and caring.' },
            { authorName: 'Divya N.', rating: 4, text: 'Clean hospital rooms and polite nursing staff. Waiting time at OPD is slightly long.' }
          ],
          coordinates: { lat: 10.5925, lng: 77.2485 },
          timings: {
            Monday: 'Open 24 Hours',
            Tuesday: 'Open 24 Hours',
            Wednesday: 'Open 24 Hours',
            Thursday: 'Open 24 Hours',
            Friday: 'Open 24 Hours',
            Saturday: 'Open 24 Hours',
            Sunday: 'Open 24 Hours'
          },
          languagesKnown: 'Tamil, English, Hindi',
          serviceArea: 'Udumalpet Taluk and surrounding villages',
          subscriptionStatus: 'active'
        },
        biz_5: {
          _id: 'biz_5',
          name: 'Siva Soft Solutions',
          category: 'Professional Services',
          type: 'Software Development & IT',
          description: 'Siva Soft Solutions is an established software agency in Udumalpet specializing in high-quality web design, custom mobile app development, digital marketing, SEO, and IT support services for businesses.',
          yearEstablished: 2018,
          employeeCount: '5 - 10',
          gstNumber: '',
          services: ['Web Design & Dev', 'Mobile Application Dev', 'SEO Optimization', 'Social Media Marketing', 'Domain & Hosting Setup', 'IT Consultation'],
          brands: [],
          phone: '+91 97895 43210',
          whatsapp: '+91 97895 43210',
          email: 'info@sivasoftsolutions.com',
          website: 'www.sivasoftsolutions.com',
          address: 'Gandhi Nagar, Udumalpet - 642126',
          locality: 'Gandhi Nagar',
          pincode: '642126',
          isAddressVerified: true,
          logoUrl: '',
          coverImageUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&q=80',
          galleryUrls: [
            'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&q=80',
            'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&q=80',
            'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&q=80'
          ],
          googlePlaceId: 'ChIJSivaSoftSolutionsUdt',
          googleRating: 4.6,
          googleReviewsCount: 61,
          googleReviews: [
            { authorName: 'Arun Kumar', rating: 5, text: 'They developed our e-commerce website. Exceptional design and prompt support!' },
            { authorName: 'Sujatha M.', rating: 4, text: 'Professional team. They handled our local business SEO and we are seeing great traffic results.' }
          ],
          coordinates: { lat: 10.5898, lng: 77.2448 },
          timings: {
            Monday: '9:00 AM - 6:30 PM',
            Tuesday: '9:00 AM - 6:30 PM',
            Wednesday: '9:00 AM - 6:30 PM',
            Thursday: '9:00 AM - 6:30 PM',
            Friday: '9:00 AM - 6:30 PM',
            Saturday: '9:00 AM - 1:30 PM',
            Sunday: 'Closed'
          },
          languagesKnown: 'Tamil, English',
          serviceArea: 'Worldwide, Local division',
          subscriptionStatus: 'active'
        },
        biz_6: {
          _id: 'biz_6',
          name: 'Glamour Ladies Salon',
          category: 'Beauty & Wellness',
          type: 'Beauty Parlour & Salon',
          description: 'Glamour Ladies Salon is Udumalpet\'s trusted destination for premium beauty care, hair styling, bridal makeup, and skin treatment, serving our clients with style and care.',
          yearEstablished: 2017,
          employeeCount: '1 - 5',
          gstNumber: '',
          services: ['Bridal Makeup & Styling', 'Facial & Skin Care', 'Hair Cut & Styling', 'Pedicure & Manicure', 'Waxing & Threading', 'Hair Spa & Treatment'],
          brands: ['Loreal', 'Matrix', 'VLCC', 'O3+'],
          phone: '+91 98432 12345',
          whatsapp: '+91 98432 12345',
          email: 'glamoursalonudt@gmail.com',
          website: '',
          address: 'Coimbatore Road, Udumalpet - 642126',
          locality: 'Coimbatore Road',
          pincode: '642126',
          isAddressVerified: true,
          logoUrl: '',
          coverImageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
          galleryUrls: [
            'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&q=80',
            'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&q=80',
            'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=500&q=80'
          ],
          googlePlaceId: 'ChIJGlamourSalonUdt',
          googleRating: 4.4,
          googleReviewsCount: 53,
          googleReviews: [
            { authorName: 'Ramya S.', rating: 5, text: 'Awesome bridal makeup services. The staff is polite and they know what they are doing.' },
            { authorName: 'Kiruthika B.', rating: 4, text: 'Great place for haircuts and facials. The ambience is clean and hygiene is maintained.' }
          ],
          coordinates: { lat: 10.5855, lng: 77.2405 },
          timings: {
            Monday: '9:30 AM - 7:30 PM',
            Tuesday: '9:30 AM - 7:30 PM',
            Wednesday: '9:30 AM - 7:30 PM',
            Thursday: '9:30 AM - 7:30 PM',
            Friday: '9:30 AM - 7:30 PM',
            Saturday: '9:30 AM - 8:00 PM',
            Sunday: '9:30 AM - 6:00 PM'
          },
          languagesKnown: 'Tamil, English',
          serviceArea: 'Udumalpet Town',
          subscriptionStatus: 'expired'
        },
        biz_7: {
          _id: 'biz_7',
          name: 'Vibrant Bakery & Cafe',
          category: 'Food & Drinks',
          type: 'Bakery & Sweets',
          description: 'Vibrant Bakery & Cafe is Udumalpet\'s premium bakery offering fresh gourmet pastries, artisan bread, special birthday cakes, coffee, and delicious snacks in a cozy ambiance.',
          yearEstablished: 2021,
          employeeCount: '1 - 5',
          gstNumber: '',
          services: ['Gourmet Pastries', 'Birthday Cakes', 'Coffee & Tea', 'Artisan Breads', 'Hot Snacks', 'Ice Cream Shakes'],
          brands: ['Amul', 'Milky Mist', 'Nestle'],
          phone: '+91 94432 99999',
          whatsapp: '+91 94432 99999',
          email: 'vibrantbakery@gmail.com',
          website: 'www.vibrantbakery.com',
          facebook: 'https://facebook.com/vibrantbakery',
          instagram: 'vibrantbakery',
          address: 'Gandhi Nagar Main Road, Udumalpet - 642126',
          locality: 'Gandhi Nagar',
          pincode: '642126',
          isAddressVerified: true,
          logoUrl: '',
          coverImageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
          galleryUrls: [
            'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80',
            'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&q=80',
            'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80'
          ],
          googlePlaceId: 'ChIJVibrantBakeryUdt',
          googleRating: 4.5,
          googleReviewsCount: 22,
          googleReviews: [
            { authorName: 'Senthil K.', rating: 5, text: 'The best black forest cake in Udumalpet! Extremely soft and delicious.' },
            { authorName: 'Preethi R.', rating: 4, text: 'Nice seating space and yummy burgers. Coffee could be a bit stronger.' }
          ],
          coordinates: { lat: 10.5878, lng: 77.2435 },
          timings: {
            Monday: '8:00 AM - 9:00 PM',
            Tuesday: '8:00 AM - 9:00 PM',
            Wednesday: '8:00 AM - 9:00 PM',
            Thursday: '8:00 AM - 9:00 PM',
            Friday: '8:00 AM - 9:00 PM',
            Saturday: '8:00 AM - 9:00 PM',
            Sunday: 'Closed'
          },
          languagesKnown: 'Tamil, English',
          serviceArea: 'Udumalpet town limits',
          subscriptionStatus: 'none'
        },
        biz_8: {
          _id: 'biz_8',
          name: 'Green Valley Resorts',
          category: 'Services',
          type: 'Resorts & Hotels',
          description: 'Nestled at the foothills of Thirumoorthy Hills, Green Valley Resorts offers premium family cottages, a natural water swimming pool, an organic garden restaurant, and guided forest trekking paths.',
          yearEstablished: 2015,
          employeeCount: '20 - 50',
          gstNumber: '33AABCG1234F1Z0',
          services: ['Luxury Cottages', 'Natural Pool Swimming', 'Garden Restaurant', 'Forest Trekking', 'Campfire & DJ Nights', 'Conference Hall Events'],
          brands: [],
          phone: '+91 98945 99999',
          whatsapp: '+91 98945 99999',
          email: 'reservations@greenvalley.in',
          website: 'www.greenvalleyresort.in',
          address: 'Thirumoorthi Nagar, Dhali, Udumalpet - 642112',
          locality: 'Dhali',
          pincode: '642112',
          isAddressVerified: true,
          logoUrl: '',
          coverImageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
          galleryUrls: [
            'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&q=80',
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80',
            'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=500&q=80'
          ],
          googlePlaceId: 'ChIJGreenValleyUdt',
          googleRating: 4.8,
          googleReviewsCount: 98,
          googleReviews: [
            { authorName: 'Subramanian K.', rating: 5, text: 'Brilliant weekend stay! The climate and natural pool were absolutely refreshing.' },
            { authorName: 'Deepak Raj', rating: 5, text: 'Awesome hospitality and very close to Amanalingeshwarar temple and waterfalls.' }
          ],
          coordinates: { lat: 10.4789, lng: 77.1623 },
          timings: {
            Monday: 'Open 24 Hours',
            Tuesday: 'Open 24 Hours',
            Wednesday: 'Open 24 Hours',
            Thursday: 'Open 24 Hours',
            Friday: 'Open 24 Hours',
            Saturday: 'Open 24 Hours',
            Sunday: 'Open 24 Hours'
          },
          languagesKnown: 'Tamil, English, Malayalam',
          serviceArea: 'Thirumoorthy hills & surrounding areas',
          subscriptionStatus: 'active'
        },
        biz_9: {
          _id: 'biz_9',
          name: 'Amaravathi Wind Farms office',
          category: 'Services',
          type: 'Windmill Maintenance',
          description: 'Amaravathi Wind Farms office provides professional windmill engineering, maintenance, repair services, solar cell grid installations and sustainable power optimization solutions in Udumalpet.',
          yearEstablished: 2008,
          employeeCount: '50 - 100',
          gstNumber: '33AACCA1234F1Z9',
          services: ['Windmill Blade Repairs', 'Generator Maintenance', 'Solar Grid Installation', 'Efficiency Auditing', 'Grid Synchronization', 'Telemetry Setup'],
          brands: ['Suzlon', 'Siemens Gamesa', 'Vestas'],
          phone: '+91 4252 223456',
          whatsapp: '+91 4252 223456',
          email: 'info@amaravathiwind.com',
          website: 'www.amaravathiwind.com',
          address: 'Dharapuram Road, Udumalpet - 642126',
          locality: 'Dharapuram Road',
          pincode: '642126',
          isAddressVerified: true,
          logoUrl: '',
          coverImageUrl: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&q=80',
          galleryUrls: [
            'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=500&q=80',
            'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=500&q=80'
          ],
          googlePlaceId: 'ChIJAmaravathiWindUdt',
          googleRating: 4.2,
          googleReviewsCount: 15,
          googleReviews: [
            { authorName: 'Priya K.', rating: 5, text: 'Top windmill engineering contractors in the Tiruppur district division!' }
          ],
          coordinates: { lat: 10.6012, lng: 77.2589 },
          timings: {
            Monday: '9:00 AM - 6:00 PM',
            Tuesday: '9:00 AM - 6:00 PM',
            Wednesday: '9:00 AM - 6:00 PM',
            Thursday: '9:00 AM - 6:00 PM',
            Friday: '9:00 AM - 6:00 PM',
            Saturday: '9:00 AM - 6:00 PM',
            Sunday: 'Closed'
          },
          languagesKnown: 'Tamil, English',
          serviceArea: 'Udumalpet division windmills grid',
          subscriptionStatus: 'expired'
        }
      };

      const targetId = params.id === 'UBT-10024' ? 'biz_1' : params.id;
      const mockDetails = mockBizList[targetId];
      if (mockDetails) {
        let next = Number(localStorage.getItem(`ubt_views_${targetId}`) || 0);
        if (!hasBeenViewed) {
          next = next + 1;
          localStorage.setItem(`ubt_views_${targetId}`, next);
        }
        mockDetails.views = next;
        setBusiness(mockDetails);
        setReviews(mockDetails.googleReviews || []);
        if (isFoodRelated(mockDetails.category, mockDetails.customCategoryName)) {
          fetchMenu(mockDetails._id);
        }
      } else {
        setError('Business details not found.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPhonebook = () => {
    if (!business) return;
    trackClick('phonebook');

    const cleanPhone = business.phone ? business.phone.trim() : '';
    const cleanWhatsapp = business.whatsapp ? business.whatsapp.trim() : '';

    const vcardLines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${business.name}`,
      `ORG:${business.name}`,
      cleanPhone ? `TEL;TYPE=WORK,VOICE:${cleanPhone}` : '',
      cleanWhatsapp ? `TEL;TYPE=CELL,VOICE:${cleanWhatsapp}` : '',
      business.email ? `EMAIL;TYPE=PREF,INTERNET:${business.email.trim()}` : '',
      business.website ? `URL:${business.website.trim()}` : '',
      business.address ? `ADR;TYPE=WORK:;;${business.address.trim()};;;;` : '',
      'END:VCARD'
    ].filter(Boolean);

    const vcardString = vcardLines.join('\r\n');
    const blob = new Blob([vcardString], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${business.name.replace(/\s+/g, '_')}.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newReviewAuthor || !newReviewText) return;
    setReviewSubmitLoading(true);

    try {
      const res = await fetch(`http://localhost:5000/api/reviews/${business._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: newReviewAuthor,
          rating: newReviewRating,
          text: newReviewText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReviews([data.data, ...reviews]);
        setNewReviewAuthor('');
        setNewReviewText('');
        setReviewSuccess(true);
        fetchBusinessDetails();
        setTimeout(() => setReviewSuccess(false), 3000);
      }
    } catch (err) {
      // Mock local push on offline fallback
      const mockRev = {
        authorName: newReviewAuthor,
        rating: newReviewRating,
        text: newReviewText,
        createdAt: new Date(),
      };
      setReviews([mockRev, ...reviews]);
      setNewReviewAuthor('');
      setNewReviewText('');
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3000);
    } finally {
      setReviewSubmitLoading(false);
    }
  };

  const handleSendEnquiry = async (e) => {
    e.preventDefault();
    if (!enquiryName || !enquiryPhone || !enquiryMessage) return;
    
    try {
      const res = await fetch('http://localhost:5000/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business._id,
          name: enquiryName,
          phone: enquiryPhone,
          message: enquiryMessage
        })
      });
      const data = await res.json();
      if (data.success) {
        setEnquirySuccess(true);
        setEnquiryName('');
        setEnquiryPhone('');
        setEnquiryMessage('Hello, I am interested in your services and would like to receive details.');
        setTimeout(() => setEnquirySuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to submit enquiry:', err);
    }
  };
  const trackClick = async (type, customId) => {
    const id = customId || (business ? business._id : null);
    if (!id) return;
    try {
      await fetch(`http://localhost:5000/api/businesses/${id}/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
    } catch (err) {
      console.error(`Failed to track ${type} click:`, err);
    }
  };

  const handleCall = (phone) => {
    trackClick('call');
    window.open(`tel:${phone}`);
  };

  const handleWhatsApp = (whatsapp, name) => {
    trackClick('whatsapp');
    const cleanNum = whatsapp.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanNum}?text=Hello%20${encodeURIComponent(name)},%20I%20saw%2520your%20listing%20on%20UBT.`);
  };

  const handleShare = async () => {
    trackClick('share');
    const shareUrl = window.location.origin + '/' + (business?.slug || business?._id || '');
    const shareTitle = business?.name || 'Udumalpet Business Tour';
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          url: shareUrl
        });
      } catch (err) {
        console.warn('Web Share failed or cancelled:', err);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("Business profile link copied to clipboard!");
    }
  };

  const handleWhatsAppOrder = (item) => {
    trackClick('whatsapp');
    let number = business.whatsapp || business.phone || '';
    let cleanNum = number.replace(/[^0-9]/g, '');
    if (cleanNum.length === 10) {
      cleanNum = '91' + cleanNum;
    }
    const text = `Hello! I would like to order "${item.name}" from "${business.name}" via Udumalpet Business Tour (UBT).

Price: ₹${item.offerPrice || item.price}
Dietary: ${item.isVeg ? 'Veg 🌱' : 'Non-Veg 🍗'}

Please confirm availability and delivery time.`;
    window.open(`https://wa.me/${cleanNum}?text=${encodeURIComponent(text)}`);
  };

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-3 text-slate-400">
        <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin" />
        <span className="text-xs font-bold font-sans">Retrieving profile...</span>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6 text-left font-sans">
        <button 
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-500 hover:text-[#027244] transition-colors cursor-pointer w-fit py-1.5 hover:-translate-x-0.5 transition-transform"
        >
          <ArrowLeft className="h-4 w-4" /> Go Back
        </button>

        <div className="py-20 flex flex-col items-center justify-center gap-5 text-slate-500 max-w-md mx-auto text-center">
          <AlertCircle className="h-12 w-12 text-red-500 animate-bounce" />
          <div>
            <h3 className="font-black text-slate-800 text-base">Error Loading Business</h3>
            <p className="text-xs text-slate-500 font-semibold mt-2.5 leading-relaxed">
              This listing might not have been approved yet, contains an invalid ID, or the local server database is currently offline.
            </p>
          </div>
          <div className="flex gap-3 mt-2">
            <button 
              onClick={() => navigate(-1)} 
              className="py-2.5 px-5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-extrabold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Go Back
            </button>
            <button 
              onClick={() => navigate('/businesses')} 
              className="py-2.5 px-5 bg-[#027244] hover:bg-[#005934] text-white text-xs font-extrabold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Return to Directory
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isExpired = business.subscriptionStatus === 'expired';
  const isOwner = currentUser && business && (
    (currentUser._id && business.ownerId && currentUser._id === business.ownerId) ||
    (currentUser.id && business.ownerId && currentUser.id === business.ownerId) ||
    (currentUser._id && business.owner && currentUser._id === business.owner) ||
    (currentUser.id && business.owner && currentUser.id === business.owner) ||
    // Allow logged-in users to edit mock listings (starts with 'biz_') or owned-less listings for testing
    (business._id && typeof business._id === 'string' && business._id.startsWith('biz_')) ||
    (!business.ownerId && !business.owner)
  );
  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin');

  const remainingCount = Math.max(0, galleryCount - 5);

  const allReviews = [
    ...(reviews || []).map(r => ({ ...r, isGoogle: false })),
    ...(business?.googleReviews || []).map(g => ({
      _id: g._id || g.id || `google-${g.authorName}-${g.createdAt}`,
      authorName: g.authorName,
      rating: g.rating,
      text: g.text,
      createdAt: g.createdAt,
      isGoogle: true
    }))
  ];
  allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Dynamic Rating Distribution calculation based on overall rating baseline using mathematical interpolation
  const getRatingDistribution = (rating, reviewsCount) => {
    const avgRating = rating || 5;
    const totalCount = reviewsCount || 0;
    
    if (totalCount === 0) {
      return [
        { stars: 5, pct: '0%', count: 0 },
        { stars: 4, pct: '0%', count: 0 },
        { stars: 3, pct: '0%', count: 0 },
        { stars: 2, pct: '0%', count: 0 },
        { stars: 1, pct: '0%', count: 0 }
      ];
    }
    
    const anchors = [
      { r: 5.0, p: [1.00, 0.00, 0.00, 0.00, 0.00] },
      { r: 4.8, p: [0.85, 0.11, 0.03, 0.01, 0.00] },
      { r: 4.5, p: [0.70, 0.18, 0.07, 0.03, 0.02] },
      { r: 4.0, p: [0.45, 0.25, 0.18, 0.07, 0.05] },
      { r: 3.5, p: [0.25, 0.30, 0.25, 0.12, 0.08] },
      { r: 3.0, p: [0.15, 0.20, 0.30, 0.20, 0.15] },
      { r: 2.0, p: [0.05, 0.10, 0.15, 0.35, 0.35] },
      { r: 1.0, p: [0.00, 0.00, 0.00, 0.00, 1.00] }
    ];
    
    let low = anchors[anchors.length - 1];
    let high = anchors[0];
    
    for (let i = 0; i < anchors.length - 1; i++) {
      if (avgRating <= anchors[i].r && avgRating >= anchors[i + 1].r) {
        high = anchors[i];
        low = anchors[i + 1];
        break;
      }
    }
    
    let t = 0;
    if (high.r !== low.r) {
      t = (avgRating - low.r) / (high.r - low.r);
    }
    
    const probs = [];
    let sumProbs = 0;
    for (let i = 0; i < 5; i++) {
      const p = low.p[i] + t * (high.p[i] - low.p[i]);
      probs.push(p);
      sumProbs += p;
    }
    
    const normalizedProbs = probs.map(p => sumProbs > 0 ? p / sumProbs : 0);
    
    const finalCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let currentSum = 0;
    
    [5, 4, 3, 2, 1].forEach((star, idx) => {
      const share = normalizedProbs[idx];
      const calculated = Math.round(share * totalCount);
      finalCounts[star] = calculated;
      currentSum += calculated;
    });
    
    let diff = totalCount - currentSum;
    if (diff !== 0) {
      finalCounts[5] = Math.max(0, finalCounts[5] + diff);
    }
    
    return [5, 4, 3, 2, 1].map(star => {
      const count = finalCounts[star];
      const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
      return {
        stars: star,
        pct: `${pct}%`,
        count
      };
    });
  };

  const totalReviewsCount = (business?.googleReviewsCount || 0) + (reviews?.length || 0);

  const ratingDistribution = getRatingDistribution(
    business.googleRating,
    business.googleReviewsCount
  );

  return (
    <div className="w-full flex flex-col items-center font-sans bg-[#F8FAFC]">
      {/* Pending Vetting Banner */}
      {business.status && business.status !== 'Approved' && (
        <div className="w-full bg-amber-550 text-white font-extrabold text-xs py-3.5 px-4 text-center sticky top-[76px] z-30 shadow flex items-center justify-center gap-2">
          <AlertCircle className="h-4.5 w-4.5 animate-pulse" />
          <span>This business profile is currently in "{business.status}" status. It remains private to you until verified by administrators.</span>
        </div>
      )}

      {/* Expiry Warning Header Banner */}
      {isExpired && (isOwner || isAdmin) && (
        <div className="w-full bg-red-600 text-white font-extrabold text-xs py-3.5 px-4 text-center sticky top-[76px] z-30 shadow flex items-center justify-center gap-2">
          <AlertCircle className="h-4.5 w-4.5" />
          <span>Subscription expired. Renew to restore profile visibility and unlock contact buttons.</span>
          <Link to="/add-business?step=subscription" className="bg-white text-red-700 font-bold px-3 py-1 rounded ml-3.5 hover:bg-slate-100 transition-colors uppercase tracking-wide">
            Renew Now
          </Link>
        </div>
      )}

      {/* Premium Header Banner (Matching Image 5) */}
      <section className="w-full relative bg-slate-900 text-white py-14 px-4 border-b border-slate-800/60 overflow-hidden">
        {/* Background Image opacity filter */}
        <div 
          className="absolute inset-0 bg-cover cursor-pointer transition-opacity duration-300 hover:opacity-95" 
          onClick={() => setActivePhotoIndex('cover')}
          title="Click to view full cover photo"
          style={{ 
            backgroundImage: `url('${mainImage}')`,
            backgroundPosition: `center ${business.coverImageOffset ?? 50}%`,
            opacity: 0.85
          }} 
        />
        {/* Sleek dark shadow gradient bottom-up - Increased darkness */}
        <div className="absolute inset-0 bg-slate-950/80 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-950/65" />
        
        {mediaError && (
          <div className="absolute top-4 left-4 right-4 bg-red-600 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl text-center z-30 shadow flex items-center justify-center gap-2 animate-fadeIn">
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <span>{mediaError}</span>
            <button onClick={() => setMediaError('')} className="bg-white/10 hover:bg-white/20 text-white rounded-lg p-1 ml-auto cursor-pointer">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className="relative max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6 z-10">
          <div className="flex flex-col gap-3 w-full">
            {/* Go Back button with Left Arrow */}
            <button 
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white/90 hover:text-white transition-colors w-fit cursor-pointer py-1 mb-1.5 hover:-translate-x-0.5 transition-transform"
            >
              <ArrowLeft className="h-4 w-4" /> Go Back
            </button>
            {/* Breadcrumbs */}
            <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-white/70 uppercase tracking-wider">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <span className="text-white/40">&gt;</span>
              <Link to="/businesses" className="hover:text-white transition-colors">Businesses</Link>
              <span className="text-white/40">&gt;</span>
              <span className="text-white/85 hover:text-emerald-300 transition-colors cursor-pointer">{business.type}</span>
              <span className="text-white/40">&gt;</span>
              <span className="text-white">{business.name}</span>
            </div>
            
            {/* Title Block with Logo and Verified Badge */}
            <div className="flex items-center gap-4 mt-2 flex-wrap text-left">
              {business.logoUrl ? (
                <div 
                  onClick={() => setActivePhotoIndex('logo')}
                  title="Click to view logo"
                  className="h-16 w-16 md:h-20 md:w-20 rounded-2xl border border-white/20 overflow-hidden bg-white shadow-md shrink-0 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-300"
                >
                  <img src={window.getImageUrl(business.logoUrl)} alt={`${business.name} Logo`} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl border border-white/20 overflow-hidden bg-gradient-to-tr from-emerald-500 to-teal-650 shadow-md shrink-0 flex items-center justify-center font-extrabold text-white text-xl uppercase">
                  {business.name ? business.name.charAt(0) : 'B'}
                </div>
              )}
              <div className="flex flex-col gap-1.5 justify-center">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white font-sans">{business.name}</h1>
                  {business.isFoundingMember && (
                    <span className="bg-amber-550 text-white border border-amber-500/30 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm shrink-0">
                      <Sparkles className="h-3.5 w-3.5 text-white fill-current animate-pulse" /> Founding Member
                    </span>
                  )}
                  {((business.googlePlaceId && business.googlePlaceId !== '') || (business.googleBusinessLink && business.googleBusinessLink !== '') || business.googleLinked) ? (
                    <span className="bg-blue-500/10 text-blue-400 border border-blue-400/25 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm shrink-0">
                      <svg className="h-3.5 w-3.5 text-[#1a73e8] shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.8 17 5 19 5a1 1 0 0 1 1 1z" fill="currentColor" />
                        <path d="m9 12 2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg> Google Verified
                    </span>
                  ) : (
                    isOwner && (
                      <button
                        onClick={() => setShowVerifyModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm shrink-0 transition-all cursor-pointer hover:scale-105 active:scale-95 border-none"
                      >
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" /> Verify Now
                      </button>
                    )
                  )}
                  {branches.length > 0 && (
                    <span className="bg-blue-500/10 text-blue-400 border border-blue-400/25 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm shrink-0">
                      {branches.length + 1} Branches
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Website and Social Media links below Business Name */}
            {(business.website || business.facebook || business.instagram) && (
              <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs font-black text-white/90">
                {business.website && !isGovernmentalOrPublic(business) && (
                  <a 
                    href={business.website.startsWith('http') ? business.website : `https://${business.website}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={() => trackClick('website')}
                    className="text-white hover:text-emerald-300 transition-colors flex items-center gap-1.5"
                  >
                    <Globe className="h-4 w-4" />
                    <span>Website</span>
                  </a>
                )}
                {business.facebook && (
                  <a 
                    href={business.facebook.startsWith('http') ? business.facebook : `https://${business.facebook}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={() => trackClick('facebook')}
                    className="text-white hover:text-blue-300 transition-colors flex items-center gap-1.5"
                    title="Facebook Profile"
                  >
                    <Facebook className="h-4 w-4" />
                    <span>Facebook</span>
                  </a>
                )}
                {business.instagram && (
                  <a 
                    href={business.instagram.startsWith('http') ? business.instagram : `https://instagram.com/${business.instagram.replace('@', '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={() => trackClick('instagram')}
                    className="text-white hover:text-pink-350 transition-colors flex items-center gap-1.5"
                    title="Instagram Profile"
                  >
                    <Instagram className="h-4 w-4" />
                    <span>Instagram</span>
                  </a>
                )}
              </div>
            )}

            {/* Premium Rating and Specs Pills */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-white/90 mt-2">
              <div className="flex items-center gap-1 bg-white/10 border border-white/20 px-2.5 py-1 rounded-lg">
                <div className="flex text-amber-400 shrink-0 gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < Math.floor(business.googleRating ?? 0) ? 'fill-current' : 'text-slate-700'}`} />
                  ))}
                </div>
                <span className="font-black text-white ml-1">{(business.googleRating ?? 0).toFixed(1)}</span>
                <span className="text-[10px] text-white/75">({business.googleReviewsCount || 0} Reviews)</span>
              </div>
              <span className="text-white/40">•</span>
              <div className="flex items-center gap-1 bg-white/10 border border-white/20 px-2.5 py-1 rounded-lg text-white/95">
                <Eye className="h-3.5 w-3.5 text-emerald-400" />
                <span className="font-black text-white ml-1">{business.views || 0}</span>
                <span className="text-[10px] text-white/75">Views</span>
              </div>
              <span className="text-white/40">•</span>
              <span className="text-white font-bold bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 rounded-lg">{business.type}</span>
              <span className="text-white/40">•</span>
              <a 
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open Directions in Google Maps"
                onClick={() => trackClick('directions')}
                className="flex items-center gap-1.5 text-white/80 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                <MapPin className="h-4 w-4 text-emerald-450" />
                <span>{business.locality}, Udumalpet, Tamil Nadu - {business.pincode}</span>
              </a>
            </div>
            
            {business.subscriptionStatus === 'active' ? (
              <div className="flex items-center gap-3 mt-3.5 flex-wrap">
                <button 
                  onClick={handleAddToPhonebook}
                  className="h-10 px-5 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-extrabold text-xs rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1.5 cursor-pointer uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Users className="h-4.5 w-4.5 text-slate-900" /> Add to Phonebook
                </button>

                {/* Call Action */}
                <button 
                  onClick={() => handleCall(business.phone)}
                  title="Call Business"
                  className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/25 text-emerald-400 hover:scale-105 active:scale-95 transition-all cursor-pointer rounded-xl flex items-center justify-center shadow-sm"
                >
                  <Phone className="h-4.5 w-4.5" />
                </button>

                {/* Map/Location Action - uses Google Maps directions URL (no API key needed) */}
                <a 
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open Directions in Google Maps"
                  onClick={() => trackClick('directions')}
                  className="h-10 w-10 bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/25 text-rose-400 hover:scale-105 active:scale-95 transition-all cursor-pointer rounded-xl flex items-center justify-center shadow-sm"
                >
                  <MapPin className="h-4.5 w-4.5" />
                </a>

                {/* Email Action */}
                {business.email && (
                  <a 
                    href={`mailto:${business.email}`}
                    title="Send Email"
                    onClick={() => trackClick('email')}
                    className="h-10 w-10 bg-blue-500/10 border border-blue-500/25 hover:bg-blue-500/25 text-blue-400 hover:scale-105 active:scale-95 transition-all cursor-pointer rounded-xl flex items-center justify-center shadow-sm"
                  >
                    <Mail className="h-4.5 w-4.5" />
                  </a>
                )}

                {/* WhatsApp Action */}
                {!isExpired && business.whatsapp && !isGovernmentalOrPublic(business) && (
                  <button 
                    onClick={() => handleWhatsApp(business.whatsapp, business.name)}
                    title="Chat on WhatsApp"
                    className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/25 text-emerald-400 hover:scale-105 active:scale-95 transition-all cursor-pointer rounded-xl flex items-center justify-center shadow-sm"
                  >
                    <MessageSquare className="h-4.5 w-4.5 fill-current" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-3.5 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-xl text-amber-400 font-extrabold text-xs">
                <svg className="h-4 w-4 shrink-0 text-amber-400 fill-none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>{(isOwner || isAdmin) ? "Contact Details Blurred — Subscription Activation Required" : "Contact Details Blurred"}</span>
              </div>
            )}
          </div>

          {/* Banner Action Buttons */}
          <div className="flex items-center gap-3 shrink-0 mt-4 md:mt-0 flex-wrap">
            <button 
              onClick={handleShare}
              className="h-10 px-4 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl flex items-center justify-center gap-2 text-slate-300 hover:text-white transition-all cursor-pointer font-bold text-xs"
            >
              <Share2 className="h-4 w-4" /> Share
            </button>
            <button 
              onClick={handleLikeBusiness}
              disabled={likeLoading}
              className={`h-10 px-4 border rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer font-bold text-xs ${
                isLiked 
                  ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100/60' 
                  : 'bg-white/5 border-white/10 hover:border-white/20 text-slate-300 hover:text-white'
              }`}
            >
              <Heart className={`h-4 w-4 transition-transform ${isLiked ? 'fill-current text-rose-500' : 'text-slate-400'}`} />
              <span>{isLiked ? 'Liked' : 'Like'} ({business && business.likes ? business.likes.length : 0})</span>
            </button>
          </div>
        </div>
      </section>

      {/* Tabs navigation bar */}
      {!isGovernmentalOrPublic(business) && (
        <section className="w-full bg-white border-b border-slate-200/80 sticky top-[76px] z-20 shadow-xs">
          <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex overflow-x-auto gap-8">
            {[
              { id: 'overview', label: 'Overview' },
              ...(isFoodRelated(business?.category, business?.customCategoryName) ? [
                { id: 'menu', label: `Menu${menuItems.length > 0 ? ` (${menuItems.length})` : ''}` }
              ] : []),
              { id: 'services', label: 'Services' },
              { id: 'photos', label: `Photos (${galleryCount})` },
              { id: 'reviews', label: `Reviews (${totalReviewsCount})` },
              { id: 'offers', label: `Offers (${((business?.offers ? business.offers.filter(o => o.active !== false && o.active !== 'false').length : 0) + (business?.promotions ? business.promotions.filter(p => p.active !== false && p.active !== 'false').length : 0))})` },
              { id: 'about', label: 'About' },
              ...((branches.length > 0 || isOwner) ? [{ id: 'branches', label: branches.length > 0 ? `Branches (${branches.length + 1})` : 'Branches' }] : []),
              { id: 'map', label: 'Map & Location' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4.5 text-xs font-black border-b-2 uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
                  activeTab === tab.id 
                    ? 'border-emerald-600 text-emerald-600' 
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Main Grid Content */}
      <section className="max-w-[1440px] w-full px-4 md:px-8 py-10 relative">
        <div 
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full"
          style={{
            filter: business && business.subscriptionStatus !== 'active' && !isGovernmentalOrPublic(business) && !isAdmin && !isOwner ? 'blur(8px) grayscale(20%)' : 'none',
            pointerEvents: business && business.subscriptionStatus !== 'active' && !isGovernmentalOrPublic(business) && !isAdmin && !isOwner ? 'none' : 'auto',
            userSelect: business && business.subscriptionStatus !== 'active' && !isGovernmentalOrPublic(business) && !isAdmin && !isOwner ? 'none' : 'auto',
          }}
        >
        
        {/* Left Column (Overview, gallery, details, reviews) */}
        <div className="lg:col-span-2 flex flex-col gap-10">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-10 animate-fadeIn text-left">
              
              {/* About description */}
              <div className="flex flex-col gap-3.5">
                <div className="flex justify-between items-center">
                  {/* About header with no edit */}
                  <h3 className="text-xl font-extrabold text-slate-800 font-sans">About {business.name}</h3>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed text-justify font-medium">{business.description}</p>
                
                {/* Highlights chip tags - dynamic from business.highlights */}
                {!isGovernmentalOrPublic(business) && (
                  <div className="flex flex-wrap gap-2.5 mt-3">
                    {(Array.isArray(business.highlights) && business.highlights.length > 0
                      ? business.highlights
                      : ['On-time Service', 'Expert Technicians', 'Quality Materials', 'Affordable Pricing']
                    ).map((tag) => (
                      <span key={tag} className="bg-emerald-50/50 border border-emerald-100 text-emerald-700 text-[11px] font-bold py-2 px-4 rounded-xl flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Specifications block (Upgrade from list to exact 2-column gorgeous details grid from Image 5) */}
              <div className="flex flex-col gap-4 border-t border-slate-100 pt-8">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-extrabold text-slate-800 font-sans">
                    {isGovernmentalOrPublic(business) ? 'Office Information' : 'Business Information'}
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 mt-2 p-1 text-slate-700">
                  {!isGovernmentalOrPublic(business) && (
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-slate-100/90 text-slate-500 shrink-0">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Business Type</span>
                        <span className="font-extrabold text-slate-800 text-sm mt-2">{business.type}</span>
                      </div>
                    </div>
                  )}
                            
                  {isGovernmentalOrPublic(business) && (
                    <>
                      {business.website && (
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-xl bg-slate-100/90 text-slate-500 shrink-0">
                            <Globe className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Official Website</span>
                            <a 
                              href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => trackClick('website')}
                              className="font-extrabold text-emerald-600 hover:text-emerald-700 text-sm mt-2 break-all"
                            >
                              {business.website}
                            </a>
                          </div>
                        </div>
                      )}

                      {business.phone && (
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-xl bg-slate-100/90 text-slate-500 shrink-0">
                            <Phone className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Contact Phone</span>
                            <a 
                              href={`tel:${business.phone}`}
                              onClick={() => trackClick('call')}
                              className="font-extrabold text-slate-800 hover:text-emerald-600 text-sm mt-2"
                            >
                              {business.phone}
                            </a>
                          </div>
                        </div>
                      )}

                      {business.email && (
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-xl bg-slate-100/90 text-slate-500 shrink-0">
                            <Mail className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Official Email</span>
                            <a 
                              href={`mailto:${business.email}`}
                              onClick={() => trackClick('email')}
                              className="font-extrabold text-slate-800 hover:text-emerald-600 text-sm mt-2 break-all"
                            >
                              {business.email}
                            </a>
                          </div>
                        </div>
                      )}

                      {(business.address || business.locality) && (
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-xl bg-slate-100/90 text-slate-500 shrink-0">
                            <MapPin className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Office Location</span>
                            <span className="font-extrabold text-slate-800 text-sm mt-2 leading-relaxed">
                              {business.address || `${business.locality}, Udumalpet, Tamil Nadu - ${business.pincode}`}
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {(!isGovernmentalOrPublic(business) || (business.timings && Object.keys(business.timings).length > 0 && Object.values(business.timings).some(v => v && v.trim() !== ''))) && (
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-slate-100/90 text-slate-500 shrink-0">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col w-full max-w-[240px]">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                          {isGovernmentalOrPublic(business) ? 'Office Hours' : 'Working Hours'}
                        </span>
                        <div className="flex flex-col mt-2 font-extrabold text-slate-800 text-sm leading-snug">
                          {business.parentBusinessId && business.workingHours ? (
                            <span>{business.workingHours}</span>
                          ) : (
                            getQuickTimingsDisplay(business.timings)
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* row 2 */}
                  {!isGovernmentalOrPublic(business) && (
                    <div className="flex items-start gap-4 border-t border-slate-100 pt-5 md:border-t-0 md:pt-0">
                      <div className="p-3 rounded-xl bg-slate-100/90 text-slate-500 shrink-0">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Year of Establishment</span>
                        <span className="font-extrabold text-slate-800 text-sm mt-2">{business.yearEstablished || '2012'}</span>
                      </div>
                    </div>
                  )}

                  {!isGovernmentalOrPublic(business) && (
                    <div className="flex items-start gap-4 border-t border-slate-100 pt-5 md:border-t-0 md:pt-0">
                      <div className="p-3 rounded-xl bg-slate-100/90 text-slate-500 shrink-0">
                        <Globe className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Languages Known</span>
                        <span className="font-extrabold text-slate-800 text-sm mt-2">{business.languagesKnown || 'Tamil, English'}</span>
                      </div>
                    </div>
                  )}

                  {/* row 3 */}
                  {!isGovernmentalOrPublic(business) && (
                    <div className="flex items-start gap-4 border-t border-slate-100 pt-5">
                      <div className="p-3 rounded-xl bg-slate-100/90 text-slate-500 shrink-0">
                        <Users className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Employees</span>
                        <span className="font-extrabold text-slate-800 text-sm mt-2">{business.employeeCount || '10 - 20'}</span>
                      </div>
                    </div>
                  )}

                  {!isGovernmentalOrPublic(business) && (
                    <div className="flex items-start gap-4 border-t border-slate-100 pt-5">
                      <div className="p-3 rounded-xl bg-slate-100/90 text-slate-500 shrink-0">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Service Area</span>
                        <span className="font-extrabold text-slate-800 text-sm mt-2 leading-relaxed">
                          {business.serviceArea || 'Udumalpet, Pollachi, Palladam, Madathukulam and nearby areas'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* row 4 - full width */}
                  {!isGovernmentalOrPublic(business) && (
                    <div className="flex items-start gap-4 border-t border-slate-100 pt-5 md:col-span-2">
                      <div className="p-3 rounded-xl bg-slate-100/90 text-slate-500 shrink-0">
                        <Award className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col font-sans">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">GST Number</span>
                        <span className="font-extrabold text-slate-800 text-sm mt-2 tracking-wide">
                          {isExpired ? 'Hidden due to expiry' : business.gstNumber || '33ABCDE1234F1Z5'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Premium collage gallery */}
              {(!isGovernmentalOrPublic(business) || galleryCount > 0 || isOwner) && (
                <div className="flex flex-col gap-4 border-t border-slate-100 pt-8">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-lg font-extrabold text-slate-800 font-sans">Photos & Gallery</h3>
                  </div>
                  
                  {galleryCount === 0 ? (
                    <div className="w-full bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-3.5 mt-2 animate-fadeIn">
                      <div className="h-12 w-12 rounded-2xl bg-emerald-550/10 border border-emerald-550/20 flex items-center justify-center text-emerald-600">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-800 font-extrabold text-sm">No photos uploaded yet</span>
                        <span className="text-xs text-slate-400 font-semibold">Add photos showing your storefront, services, products, or team.</span>
                      </div>
                      {isOwner && (
                        <label className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-colors mt-1 select-none">
                          <Upload className="h-3.5 w-3.5" /> Upload Photos
                          <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
                        </label>
                      )}
                    </div>
                  ) : galleryCount === 1 ? (
                    <div className="grid grid-cols-1 gap-3 mt-2 animate-fadeIn">
                      <div 
                        className="h-80 rounded-[24px] bg-cover bg-center border border-slate-200 shadow-sm relative overflow-hidden group cursor-pointer"
                        onClick={() => { setActivePhotoIndex(0); setActiveTab('photos'); }}
                        style={{ 
                          backgroundImage: `url('${displayGallery[0]}')`,
                          filter: isExpired ? 'blur(4px)' : 'none'
                        }}
                      >
                        <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/10 transition-colors" />
                      </div>
                    </div>
                  ) : galleryCount === 2 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 h-80 animate-fadeIn">
                      {displayGallery.slice(0, 2).map((url, idx) => (
                        <div 
                          key={idx}
                          className="rounded-[24px] bg-cover bg-center border border-slate-200 shadow-sm relative overflow-hidden group cursor-pointer"
                          onClick={() => { setActivePhotoIndex(idx); setActiveTab('photos'); }}
                          style={{ 
                            backgroundImage: `url('${url}')`,
                            filter: isExpired ? 'blur(4px)' : 'none'
                          }}
                        >
                          <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/10 transition-colors" />
                        </div>
                      ))}
                    </div>
                  ) : galleryCount === 3 ? (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-2 h-80 animate-fadeIn">
                      <div 
                        className="md:col-span-3 rounded-[24px] bg-cover bg-center border border-slate-200 shadow-sm relative overflow-hidden group cursor-pointer"
                        onClick={() => { setActivePhotoIndex(0); setActiveTab('photos'); }}
                        style={{ 
                          backgroundImage: `url('${displayGallery[0]}')`,
                          filter: isExpired ? 'blur(4px)' : 'none'
                        }}
                      >
                        <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/10 transition-colors" />
                      </div>
                      <div className="md:col-span-2 grid grid-rows-2 gap-3 h-full">
                        {displayGallery.slice(1, 3).map((url, idx) => (
                          <div 
                            key={idx}
                            className="rounded-[20px] bg-cover bg-center border border-slate-200 shadow-2xs relative overflow-hidden group cursor-pointer"
                            onClick={() => { setActivePhotoIndex(idx + 1); setActiveTab('photos'); }}
                            style={{ 
                              backgroundImage: `url('${url}')`,
                              filter: isExpired ? 'blur(4px)' : 'none'
                            }}
                          >
                            <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/10 transition-colors" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : galleryCount === 4 ? (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-2 h-80 animate-fadeIn">
                      <div 
                        className="md:col-span-3 rounded-[24px] bg-cover bg-center border border-slate-200 shadow-sm relative overflow-hidden group cursor-pointer"
                        onClick={() => setActiveTab('photos')}
                        style={{ 
                          backgroundImage: `url('${displayGallery[0]}')`,
                          filter: isExpired ? 'blur(4px)' : 'none'
                        }}
                      >
                        <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/10 transition-colors" />
                      </div>
                      <div className="md:col-span-2 grid grid-rows-2 gap-3 h-full">
                        <div 
                          className="rounded-[20px] bg-cover bg-center border border-slate-200 shadow-2xs relative overflow-hidden group cursor-pointer"
                          onClick={() => { setActivePhotoIndex(1); setActiveTab('photos'); }}
                          style={{ 
                            backgroundImage: `url('${displayGallery[1]}')`,
                            filter: isExpired ? 'blur(4px)' : 'none'
                          }}
                        >
                          <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/10 transition-colors" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {displayGallery.slice(2, 4).map((url, idx) => (
                            <div 
                              key={idx}
                              className="rounded-[20px] bg-cover bg-center border border-slate-200 shadow-2xs relative overflow-hidden group cursor-pointer"
                              onClick={() => { setActivePhotoIndex(idx + 2); setActiveTab('photos'); }}
                              style={{ 
                                backgroundImage: `url('${url}')`,
                                filter: isExpired ? 'blur(4px)' : 'none'
                              }}
                            >
                              <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/10 transition-colors" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-2 h-80 animate-fadeIn">
                      <div 
                        className="md:col-span-3 rounded-[24px] bg-cover bg-center border border-slate-200 shadow-sm relative overflow-hidden group cursor-pointer"
                        onClick={() => setActiveTab('photos')}
                        style={{ 
                          backgroundImage: `url('${displayGallery[0]}')`,
                          filter: isExpired ? 'blur(4px)' : 'none'
                        }}
                      >
                        <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/10 transition-colors" />
                      </div>
                      <div className="md:col-span-2 grid grid-cols-2 gap-3 h-full">
                        {displayGallery.slice(1, 5).map((url, idx) => {
                          const isLast = idx === 3;
                          const moreCount = galleryCount - 5;
                          return (
                            <div 
                              key={idx}
                              className="rounded-[20px] bg-cover bg-center border border-slate-200 shadow-2xs relative overflow-hidden group cursor-pointer"
                              onClick={() => { setActivePhotoIndex(idx + 1); setActiveTab('photos'); }}
                              style={{ 
                                backgroundImage: `url('${url}')`,
                                filter: isExpired ? 'blur(4px)' : 'none'
                              }}
                            >
                              <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/10 transition-colors" />
                              {isLast && moreCount > 0 && (
                                <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-white text-center select-none animate-fadeIn">
                                  <span className="text-lg font-black tracking-wide">+{moreCount}</span>
                                  <span className="text-[9px] font-black uppercase tracking-wider mt-0.5">More Photos</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Our Services Quick View */}
              {!isGovernmentalOrPublic(business) && (
                <div className="flex flex-col gap-4 border-t border-slate-100 pt-8">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-lg font-extrabold text-slate-800 font-sans">Our Services</h3>
                      <button 
                        onClick={() => setActiveTab('services')}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer flex items-center gap-0.5"
                      >
                        View All Services <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {(Array.isArray(business.services) ? business.services : []).slice(0, 8).map((service, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3 shadow-2xs">
                        <Check className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                        <span className="text-sm font-bold text-slate-700">{service}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customer Reviews Quick View */}
              {!isGovernmentalOrPublic(business) && (
                <div className="flex flex-col gap-6 border-t border-slate-100 pt-8">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-lg font-extrabold text-slate-800 font-sans">Customer Reviews ({allReviews.length})</h3>
                    <button 
                      onClick={() => setActiveTab('reviews')}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer flex items-center gap-0.5"
                    >
                      View All Reviews <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  
                  {/* Rating Card & Top Reviews side by side */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left score card */}
                    <div className="md:col-span-1 bg-slate-50 border border-slate-200/80 rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-2 shadow-2xs h-full min-h-[220px]">
                      <span className="text-5xl font-black text-slate-800">{(business.googleRating ?? 0).toFixed(1)}</span>
                      <div className="flex text-amber-400 gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4.5 w-4.5 ${i < Math.floor(business.googleRating ?? 0) ? 'fill-current' : 'text-slate-200'}`} />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Out of 5 Stars</span>
                    </div>
   
                    {/* Right reviews stream (2 items preview) */}
                    <div className="md:col-span-2 flex flex-col gap-4">
                      {allReviews.slice(0, 2).map((rev, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-2.5 shadow-2xs text-left">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[10px] font-black text-emerald-700 uppercase">
                                {(rev.authorName || 'R').charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-extrabold text-xs text-slate-800 leading-none">{rev.authorName || 'Anonymous'}</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">
                                  {rev.isGoogle ? 'Google Review' : 'UBT Review'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center text-amber-400 gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`h-3 w-3 ${i < rev.rating ? 'fill-current' : 'text-slate-200'}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-[11.5px] text-slate-550 font-medium leading-relaxed mt-0.5 line-clamp-2">{rev.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB: MENU */}
          {activeTab === 'menu' && (
            <div className="flex flex-col gap-6 animate-fadeIn text-left">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-3.5 gap-3">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800 font-sans flex items-center gap-2">
                    <Utensils className="h-5.5 w-5.5 text-emerald-600" />
                    <span>Food Menu</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1">
                    Explore delicious offerings from {business.name} and order directly.
                  </p>
                </div>
              </div>

              {menuLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <RefreshCw className="h-7 w-7 text-emerald-600 animate-spin" />
                  <span className="text-xs font-bold font-sans">Loading menu...</span>
                </div>
              ) : menuItems.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center gap-3 bg-slate-50/50">
                  <Utensils className="h-10 w-10 text-slate-300" />
                  <h4 className="font-extrabold text-slate-700 text-sm">No Menu Items Listed</h4>
                  <p className="text-xs text-slate-450 max-w-sm">
                    This food business hasn't listed any menu items yet. Check back soon or contact them directly.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-8">
                  {/* Group items by category */}
                  {Object.entries(
                    menuItems.reduce((groups, item) => {
                      const cat = item.category || 'General';
                      if (!groups[cat]) groups[cat] = [];
                      groups[cat].push(item);
                      return groups;
                    }, {})
                  ).map(([categoryName, items]) => (
                    <div key={categoryName} className="flex flex-col gap-4">
                      <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                        <h4 className="font-black text-sm text-[#001c41] uppercase tracking-wider">
                          {categoryName}
                        </h4>
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold py-0.5 px-2 rounded-full">
                          {items.length} {items.length === 1 ? 'item' : 'items'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {items.map((item) => {
                          const discountPercent = item.offerPrice 
                            ? Math.round(((item.price - item.offerPrice) / item.price) * 100)
                            : 0;
                          return (
                            <div 
                              key={item._id} 
                              className={`bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between gap-4 shadow-2xs relative transition-all duration-300 ${
                                !item.isAvailable ? 'opacity-65 grayscale-[30%]' : 'hover:border-slate-300 hover:shadow-xs'
                              }`}
                            >
                              <div className="flex flex-col gap-2.5 text-left">
                                <div className="flex justify-between items-start gap-2">
                                  <div className="flex items-center gap-2">
                                    <div className={`h-4.5 w-4.5 border-2 flex items-center justify-center p-0.5 rounded shrink-0 select-none ${item.isVeg ? 'border-emerald-600' : 'border-red-600'}`}>
                                      <div className={`h-2 w-2 rounded-full ${item.isVeg ? 'bg-emerald-600' : 'bg-red-600'}`} />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-wider ${item.isVeg ? 'text-emerald-700' : 'text-red-700'}`}>
                                      {item.isVeg ? 'Veg' : 'Non-Veg'}
                                    </span>
                                  </div>
                                  
                                  <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider select-none ${
                                    item.isAvailable 
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-250/20' 
                                      : 'bg-rose-50 text-rose-700 border border-rose-250/20'
                                  }`}>
                                    {item.isAvailable ? 'Available' : 'Out of Stock'}
                                  </span>
                                </div>

                                <div className="flex flex-col">
                                  <h5 className="font-extrabold text-sm text-[#001c41] leading-snug">{item.name}</h5>
                                  {/* item.description removed */}
                                </div>
                              </div>

                              <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 mt-1">
                                <div className="flex flex-col text-left">
                                  {item.offerPrice ? (
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-base font-extrabold text-slate-800">₹{item.offerPrice}</span>
                                        <span className="text-[9px] bg-rose-50 border border-rose-100 text-rose-600 font-extrabold px-1.5 py-0.5 rounded select-none">
                                          {discountPercent}% OFF
                                        </span>
                                      </div>
                                      <span className="text-[10px] text-slate-400 font-bold line-through">M.R.P: ₹{item.price}</span>
                                    </div>
                                  ) : (
                                    <span className="text-base font-extrabold text-slate-800">₹{item.price}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SERVICES */}
          {activeTab === 'services' && (
            <div className="flex flex-col gap-5 animate-fadeIn text-left">
              <h3 className="text-xl font-extrabold text-slate-800 font-sans border-b border-slate-100 pb-3">Our Complete Services</h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">Wide range of specialized skills, brands, and systems offered by {business.name}.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                {(Array.isArray(business.services) ? business.services : []).map((service, idx) => (
                  <div key={idx} className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center gap-3.5 shadow-sm">
                    <CheckCircle2 className="h-5.5 w-5.5 text-emerald-600 shrink-0" />
                    <span className="text-sm font-bold text-slate-700">{service}</span>
                  </div>
                ))}
              </div>

              {business.brands && Array.isArray(business.brands) && business.brands.length > 0 && (
                <div className="flex flex-col gap-3 mt-6 border-t border-slate-200 pt-6">
                  <span className="text-xs font-black text-slate-450 uppercase tracking-wider">Authorized Brand Partnerships</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {business.brands.map((b, idx) => (
                      <span key={idx} className="bg-white border border-slate-200/70 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 shadow-2xs">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PHOTOS */}
          {activeTab === 'photos' && (
            <div className="flex flex-col gap-6 animate-fadeIn text-left">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-xl font-extrabold text-slate-800 font-sans font-sans">Store & Work Gallery ({galleryCount})</h3>
                {isOwner && (
                  <label className="py-2 px-4 bg-emerald-650 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer uppercase tracking-wider select-none">
                    <Plus className="h-4 w-4" /> Add Photos
                    <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
                  </label>
                )}
              </div>
              
              {galleryCount === 0 ? (
                <div className="w-full bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4 max-w-md mx-auto my-6 animate-fadeIn">
                  <div className="h-14 w-14 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                    <ImageIcon className="h-7 w-7" />
                  </div>
                  <div className="flex flex-col gap-1.5 text-center">
                    <span className="font-extrabold text-slate-800 text-sm">No photos uploaded yet</span>
                    <span className="text-xs text-slate-400 font-semibold leading-relaxed">
                      Showcase your work and business storefront by uploading high-quality photos.
                    </span>
                  </div>
                  {isOwner && (
                    <label className="py-2.5 px-5 bg-emerald-650 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-colors select-none">
                      <Upload className="h-4 w-4" /> Upload Photos
                      <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
                    </label>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
                  {displayGallery.map((url, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setActivePhotoIndex(idx)}
                      className="h-44 rounded-2xl bg-cover bg-center border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow cursor-pointer" 
                      style={{ 
                        backgroundImage: `url('${url}')`,
                        filter: isExpired ? 'blur(4px)' : 'none' 
                      }}
                    >
                      <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/25 transition-colors" />
                      {isOwner && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDeleteGalleryPhoto(url); }}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-md cursor-pointer border border-red-500/25 z-10"
                          title="Delete photo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {isOwner && (
                    <label className="h-44 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-100/30 hover:border-emerald-500 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all select-none">
                      <Plus className="h-6 w-6 text-slate-400" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Add More</span>
                      <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
                    </label>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="flex flex-col gap-6 animate-fadeIn text-left">
              <h3 className="text-xl font-extrabold text-slate-800 font-sans border-b border-slate-100 pb-3">Customer Ratings & Synced Feedback</h3>

              {/* Review Distribution card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-[28px] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xs">
                <div className="text-center flex flex-col gap-1.5 shrink-0 bg-white border border-slate-200 p-6 rounded-2xl shadow-2xs min-w-[150px]">
                  <span className="text-5xl font-black text-slate-800 leading-none">{business.googleRating.toFixed(1)}</span>
                  <div className="flex text-amber-400 gap-0.5 justify-center mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4.5 w-4.5 ${i < Math.floor(business.googleRating) ? 'fill-current' : 'text-slate-200'}`} />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">Out of 5 Stars</span>
                </div>
                
                {/* Distribution bars */}
                <div className="flex-1 flex flex-col gap-2.5 text-xs font-bold text-slate-600 w-full">
                  {ratingDistribution.map((dist) => (
                    <div key={dist.stars} className="flex items-center gap-3">
                      <span className="w-4 text-right text-slate-450">{dist.stars}★</span>
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: dist.pct }} />
                      </div>
                      <span className="w-12 shrink-0 text-slate-400 text-right font-semibold">{dist.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add review form */}
              <form onSubmit={handleReviewSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col gap-4 mt-2">
                <span className="font-extrabold text-sm text-slate-800 border-b border-slate-100 pb-2">Share Your Experience</span>
                
                {reviewSuccess && (
                  <div className="bg-emerald-50 border border-emerald-250 text-[#027244] rounded-xl p-3 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                    <span>Review successfully posted! Updated average rating immediately.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 text-left">
                    <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest">Your Full Name</span>
                    <input
                      type="text"
                      placeholder="e.g. Anand Kumar"
                      value={newReviewAuthor}
                      onChange={(e) => setNewReviewAuthor(e.target.value)}
                      className="py-2.5 px-3 border border-slate-200 rounded-xl shadow-2xs text-xs font-bold text-slate-700 bg-slate-50/20 focus:outline-none focus:border-[#027244] focus:ring-1 focus:ring-emerald-100"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 text-left">
                    <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest">Rating Score</span>
                    <select
                      value={newReviewRating}
                      onChange={(e) => setNewReviewRating(Number(e.target.value))}
                      className="py-2.5 px-3 border border-slate-200 rounded-xl shadow-2xs text-xs font-bold text-slate-700 bg-slate-50/20 focus:outline-none focus:border-[#027244] focus:ring-1 focus:ring-emerald-100 cursor-pointer"
                    >
                      <option value="5">5 Stars (Excellent)</option>
                      <option value="4">4 Stars (Good)</option>
                      <option value="3">3 Stars (Average)</option>
                      <option value="2">2 Stars (Poor)</option>
                      <option value="1">1 Star (Very Bad)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 text-left">
                  <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest">Your Feedback</span>
                  <textarea
                    placeholder="Describe your quick experience with their electrical/local services..."
                    value={newReviewText}
                    onChange={(e) => setNewReviewText(e.target.value)}
                    rows="3"
                    className="py-2.5 px-3 border border-slate-200 rounded-xl shadow-2xs text-xs font-bold text-slate-700 bg-slate-50/20 focus:outline-none focus:border-[#027244] focus:ring-1 focus:ring-emerald-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={reviewSubmitLoading || !newReviewAuthor || !newReviewText}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-6 rounded-xl text-xs transition-colors self-end cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-700/10"
                >
                  {reviewSubmitLoading ? 'Saving...' : 'Post Review'}
                </button>
              </form>

              {/* Reviews List */}
              <div className="flex flex-col gap-4.5 mt-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 flex-wrap gap-2 w-full text-slate-800">
                  <span className="font-black text-sm">Customer Feedback Stream ({allReviews.length})</span>
                  {business.googleReviewsCount > 0 && (
                    <span className="text-[10px] text-slate-400 font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg">
                      Showing {business.googleReviews?.length || 0} synced Google reviews out of {business.googleReviewsCount}
                    </span>
                  )}
                </div>
                {allReviews.map((rev, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-[20px] p-5 shadow-xs flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="h-8.5 w-8.5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xs font-black text-emerald-700 uppercase shadow-2xs">
                          {(rev.authorName || 'R').charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-extrabold text-xs text-slate-800 leading-none">{rev.authorName || 'Anonymous'}</span>
                          <span className={`text-[8.5px] font-bold uppercase tracking-widest mt-1 block ${rev.isGoogle ? 'text-amber-600' : 'text-slate-400'}`}>
                            {rev.isGoogle ? 'Google Review' : 'UBT Review'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center text-amber-400 gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < rev.rating ? 'fill-current' : 'text-slate-200'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-[12px] text-slate-550 font-medium leading-relaxed text-justify mt-1">{rev.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* TAB 5: OFFERS */}
          {activeTab === 'offers' && (
            <div className="flex flex-col gap-6 animate-fadeIn text-left font-sans">
              <h3 className="text-xl font-extrabold text-slate-800 font-sans border-b border-slate-100 pb-3">Active Promotional Offers</h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">Claim special vouchers and deals offered by {business.name}.</p>
              
              {business.offers && business.offers.filter(o => o.active !== false && o.active !== 'false').length > 0 && (
                <div className="flex flex-col gap-5 mt-4">
                  {business.offers.filter(o => o.active !== false && o.active !== 'false').map((campaign, oIdx) => {
                    const gradients = [
                      'from-emerald-500 to-teal-600',
                      'from-blue-500 to-indigo-600',
                      'from-purple-500 to-pink-600',
                      'from-amber-500 to-orange-600'
                    ];
                    const gradient = gradients[oIdx % gradients.length];
                    return (
                      <div key={campaign.id || oIdx} className={`bg-gradient-to-r ${gradient} border border-emerald-500/20 shadow-md rounded-[24px] p-6 text-white flex justify-between items-center relative overflow-hidden`}>
                        <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                        <div className="flex flex-col gap-1 text-left relative z-10">
                          <span className="bg-white/20 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider self-start">Special Offer</span>
                          <h4 className="text-xl font-black mt-2">{campaign.title}</h4>
                          <p className="text-xs text-white/95 font-medium mt-1 leading-relaxed max-w-sm">{campaign.description}</p>
                          {campaign.expiry && (
                            <span className="text-[10px] text-white/70 font-semibold mt-2.5">Expires on: {campaign.expiry}</span>
                          )}
                        </div>
                        <div className="bg-white text-slate-800 font-black text-xs py-3 px-5 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-lg relative z-10 border border-slate-100 select-none">
                          <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider leading-none">Deal</span>
                          <span className="text-sm mt-1 tracking-wide text-slate-800">{campaign.rate || 'Active'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {business.promotions && business.promotions.filter(p => p.active !== false && p.active !== 'false').length > 0 && (
                <div className="flex flex-col gap-4 mt-8 border-t border-slate-100 pt-6">
                  <h4 className="text-base font-extrabold text-[#001c41] font-sans">Business Promotions & Flyers</h4>
                  <p className="text-xs text-slate-455 font-semibold -mt-2">Visual campaigns and promo flyers posted by this business.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                    {business.promotions.filter(p => p.active !== false && p.active !== 'false').map((promo, pIdx) => (
                      <div key={promo.id || pIdx} className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group relative">
                        <div className="h-56 w-full overflow-hidden bg-slate-50 relative select-none">
                          <img 
                            src={window.getImageUrl(promo.image)} 
                            className="w-full h-full object-cover group-hover:scale-103 transition-all" 
                            alt="Promotion Banner" 
                          />
                          {promo.isSponsored && (
                            <span className="absolute top-3 left-3 bg-[#027244] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded shadow-sm">
                              Sponsored
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!business.offers || business.offers.filter(o => o.active !== false && o.active !== 'false').length === 0) &&
               (!business.promotions || business.promotions.filter(p => p.active !== false && p.active !== 'false').length === 0) && (
                <div className="bg-white border border-slate-205 rounded-3xl p-12 text-center text-slate-400 flex flex-col items-center gap-4 shadow-sm max-w-md mx-auto my-6 animate-fadeIn">
                  <div className="h-15 w-15 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center border border-slate-100">
                    <Sparkles className="h-7 w-7 text-emerald-600" />
                  </div>
                  <div className="flex flex-col gap-1.5 text-center items-center">
                    <h4 className="font-extrabold text-slate-800 text-base leading-tight">No active offers or flyers</h4>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                      There are currently no active promotional campaigns, flyers, or discount deals posted by this business. Check back later!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: ABOUT */}
          {activeTab === 'about' && (
            <div className="flex flex-col gap-6 animate-fadeIn text-left font-sans">
              <h3 className="text-xl font-extrabold text-slate-800 font-sans border-b border-slate-100 pb-3">About {business.name}</h3>
              
              <div className="flex flex-col gap-4 text-slate-500 font-medium text-sm leading-relaxed text-justify">
                {business.description ? (
                  <p className="whitespace-pre-wrap">{business.description}</p>
                ) : (
                  <>
                    <p>
                      Founded in {business.yearEstablished || '2012'}, {business.name} has grown to become one of the premier {business.type} choices inside Udumalpet. We provide top-class local solutions to residential housings, retail shopping complexes, and large-scale industrial systems.
                    </p>
                    <p>
                      Our teams hold verified registrations, professional certificates, and are highly vetting by UBT administration to offer maximum safety and quality operations. Our working environment holds standard customer ratings and synced feedback.
                    </p>
                  </>
                )}
              </div>

              {business.brands && Array.isArray(business.brands) && business.brands.length > 0 && (
                <div className="flex flex-col gap-3.5 border-t border-slate-100 pt-6 mt-4">
                  <h4 className="font-extrabold text-sm text-slate-800">Authorized Brand Partners</h4>
                  <div className="flex flex-wrap gap-2.5 mt-1">
                    {business.brands.map((b, i) => (
                      <span key={i} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: BRANCHES */}
          {activeTab === 'branches' && (
            <div className="flex flex-col gap-6 animate-fadeIn text-left font-sans">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800 font-sans">Our Branches</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Select a branch below to view its specific location and contact information.</p>
                </div>
                {isOwner && (
                  <Link
                    to="/dashboard?tab=Branches"
                    className="shrink-0 py-2.5 px-4 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow shadow-emerald-700/20 cursor-pointer"
                  >
                    <Users className="h-3.5 w-3.5" /> Manage Branches
                  </Link>
                )}
              </div>
              {branches.length === 0 && isOwner && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
                  <div className="h-14 w-14 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-700 text-sm">No branches added yet</p>
                    <p className="text-xs text-slate-400 font-semibold mt-1.5 leading-relaxed">Head to your dashboard to add and manage branch locations for this business.</p>
                  </div>
                  <Link
                    to="/dashboard?tab=Branches"
                    className="py-3 px-6 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-emerald-700/20"
                  >
                    Go to Branch Management
                  </Link>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                {/* Left Side: Branch Selector List */}
                <div className="md:col-span-1 flex flex-col gap-2.5">
                  {/* Primary Branch Option */}
                  <button
                    onClick={() => setSelectedBranch(null)}
                    className={`w-full p-4 rounded-2xl border text-left font-bold text-xs flex flex-col gap-1.5 transition-all cursor-pointer ${
                      selectedBranch === null
                        ? 'bg-emerald-50/40 border-emerald-600 text-emerald-850 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-400 text-slate-500'
                    }`}
                  >
                    <span className="font-extrabold text-xs uppercase tracking-wide">
                      {business.parentBusiness ? 'Main Office' : 'Primary Branch'}
                    </span>
                    <span className="text-[11px] leading-tight font-medium text-slate-400">
                      {business.parentBusiness ? business.parentBusiness.locality : (business.locality || 'Main Location')}
                    </span>
                  </button>

                  {/* Additional Branches Options */}
                  {branches.map((branch) => (
                    <button
                      key={branch._id}
                      onClick={() => setSelectedBranch(branch)}
                      className={`w-full p-4 rounded-2xl border text-left font-bold text-xs flex flex-col gap-1.5 transition-all cursor-pointer ${
                        selectedBranch?._id === branch._id
                          ? 'bg-emerald-50/40 border-emerald-600 text-emerald-850 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-400 text-slate-500'
                      }`}
                    >
                      <span className="font-extrabold text-xs leading-snug">{branch.name}</span>
                      <span className="text-[11px] leading-tight font-medium text-slate-400">{(branch.address || '').split(',')[0]}</span>
                    </button>
                  ))}
                </div>

                {/* Right Side: Selected Branch Details Card */}
                <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 flex flex-col gap-5 shadow-xs">
                  <div className="border-b border-slate-100 pb-3 flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-slate-800 text-base leading-snug">
                        {selectedBranch === null 
                          ? (business.parentBusiness ? business.parentBusiness.name : `${business.name} (Primary)`) 
                          : selectedBranch.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 block">
                        {selectedBranch === null ? 'Main Head Office' : 'Branch Office'}
                      </span>
                    </div>
                    {selectedBranch !== null ? (
                      <Link
                        to={`/businesses/${selectedBranch._id}`}
                        className="shrink-0 py-2 px-3.5 bg-emerald-50 hover:bg-emerald-100 text-[#027244] border border-emerald-250 font-extrabold text-[11px] rounded-xl flex items-center gap-1.5 transition-all shadow-3xs cursor-pointer"
                      >
                        View Full Profile <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : (
                      business.parentBusiness && (
                        <Link
                          to={`/businesses/${business.parentBusiness._id}`}
                          className="shrink-0 py-2 px-3.5 bg-emerald-50 hover:bg-emerald-100 text-[#027244] border border-emerald-250 font-extrabold text-[11px] rounded-xl flex items-center gap-1.5 transition-all shadow-3xs cursor-pointer"
                        >
                          View Main Profile <ExternalLink className="h-3 w-3" />
                        </Link>
                      )
                    )}
                  </div>

                  <div className="flex flex-col gap-4 text-xs font-bold text-slate-700">
                    {/* Address */}
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-widest">Branch Address</span>
                        <a 
                          href={
                            selectedBranch === null
                              ? directionsUrl
                              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedBranch.name}, ${selectedBranch.address}`)}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            const id = selectedBranch === null
                              ? (business.parentBusiness ? business.parentBusiness._id : business._id)
                              : selectedBranch._id;
                            trackClick('directions', id);
                          }}
                          className="text-slate-605 font-medium leading-relaxed mt-1 hover:text-emerald-600 transition-colors"
                        >
                          {selectedBranch === null 
                            ? (business.parentBusiness ? business.parentBusiness.address : business.address) 
                            : selectedBranch.address}
                        </a>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-start gap-3 border-t border-slate-100 pt-4">
                      <Phone className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-widest">Contact Number</span>
                        <a 
                          href={`tel:${
                            selectedBranch === null 
                              ? (business.parentBusiness ? business.parentBusiness.phone : business.phone) 
                              : selectedBranch.phone
                          }`}
                          onClick={() => {
                            const id = selectedBranch === null
                              ? (business.parentBusiness ? business.parentBusiness._id : business._id)
                              : selectedBranch._id;
                            trackClick('call', id);
                          }}
                          className="text-slate-800 font-extrabold mt-1 hover:text-emerald-650 transition-colors"
                        >
                          {selectedBranch === null 
                            ? (business.parentBusiness ? business.parentBusiness.phone : business.phone) 
                            : selectedBranch.phone}
                        </a>
                      </div>
                    </div>

                    {/* Timings / Working Hours */}
                    <div className="flex items-start gap-3 border-t border-slate-100 pt-4">
                      <Clock className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-widest">Working Hours</span>
                        <span className="text-slate-605 font-medium leading-relaxed mt-1">
                          {selectedBranch === null
                            ? (business.parentBusiness 
                              ? getTimingsSummaryString(business.parentBusiness.timings)
                              : getTimingsSummaryString(business.timings))
                            : (selectedBranch.workingHours || '9:00 AM - 8:00 PM')}
                        </span>
                      </div>
                    </div>

                    {/* Branch Manager Name */}
                    {((selectedBranch === null && (business.branchManagerName || (business.parentBusiness && business.parentBusiness.branchManagerName))) || (selectedBranch !== null && selectedBranch.branchManagerName)) && (
                      <div className="flex items-start gap-3 border-t border-slate-100 pt-4">
                        <Users className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-widest">Branch Manager</span>
                          <span className="text-slate-800 font-extrabold mt-1">
                            {selectedBranch === null 
                              ? (business.parentBusiness ? business.parentBusiness.branchManagerName : business.branchManagerName) 
                              : selectedBranch.branchManagerName}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Google Business Profile Link */}
                    {((selectedBranch !== null && selectedBranch.googleBusinessLink) || (selectedBranch === null && business.parentBusiness && business.parentBusiness.googleBusinessLink)) && (
                      <div className="flex items-start gap-3 border-t border-slate-100 pt-4">
                        <Globe className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-widest">Google Business Link</span>
                          <a 
                            href={selectedBranch === null ? business.parentBusiness.googleBusinessLink : selectedBranch.googleBusinessLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-emerald-700 hover:text-emerald-850 font-extrabold hover:underline mt-1 break-all flex items-center gap-1"
                          >
                            Visit Google Profile <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Get Directions Link (opens Google Maps in browser — no API key required) */}
                  <a
                    href={
                      selectedBranch === null
                        ? directionsUrl
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedBranch.name}, ${selectedBranch.address}`)}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      const id = selectedBranch === null
                        ? (business.parentBusiness ? business.parentBusiness._id : business._id)
                        : selectedBranch._id;
                      trackClick('directions', id);
                    }}
                    className="w-full py-3 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-800/10 cursor-pointer text-center uppercase tracking-wider mt-2"
                  >
                    <MapPin className="h-4 w-4" />
                    <span>Get Directions</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: MAP & LOCATION */}
          {activeTab === 'map' && (
            <div className="flex flex-col gap-4 animate-fadeIn text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xl font-extrabold text-slate-800 font-sans">Map & Directions</h3>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackClick('directions')}
                  className="py-2.5 px-5 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-800/10 uppercase tracking-wider"
                >
                  <MapPin className="h-4 w-4" /> Get Directions
                </a>
              </div>
              {/* OpenStreetMap embed — free, no API key required (unlike Google Maps Embed API) */}
              <div className="h-96 w-full rounded-[28px] border border-slate-200 bg-slate-100 relative overflow-hidden shadow-sm">
                <iframe
                  title="Interactive Business Map"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${(business.coordinates?.lng || 77.2412) - 0.012},${(business.coordinates?.lat || 10.5891) - 0.012},${(business.coordinates?.lng || 77.2412) + 0.012},${(business.coordinates?.lat || 10.5891) + 0.012}&layer=mapnik&marker=${business.coordinates?.lat || 10.5891},${business.coordinates?.lng || 77.2412}`}
                  className="absolute top-0 left-0 w-full h-[calc(100%+28px)] opacity-95 border-0"
                />
                
                {/* Floating Location Details Card */}
                <div className="absolute z-10 bottom-6 left-6 bg-white/95 border border-slate-200 shadow-xl rounded-2xl p-5 max-w-sm text-left text-slate-800 flex flex-col gap-3 animate-fadeIn backdrop-blur-xs">
                  <div className="flex items-start gap-3.5">
                    <MapPin className="h-5.5 w-5.5 text-red-500 shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-black text-sm text-[#001c41]">{business.name}</span>
                      <span className="text-xs text-slate-500 font-semibold leading-relaxed mt-1.5">{business.address}</span>
                    </div>
                  </div>
                  {/* Google Maps directions URL — completely free, no API key needed */}
                  <a 
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackClick('directions')}
                    className="mt-1 py-2 px-4 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-[11px] rounded-xl text-center uppercase tracking-wider transition-colors shadow-sm self-start"
                  >
                    Get Directions
                  </a>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column (Sticky Contact and Enquiry Card - Matching Image 5) */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 flex flex-col gap-6">
            
            {/* Sticky Contact Business Card */}
            <div className="bg-white border border-slate-200 shadow-lg rounded-[28px] p-6 flex flex-col gap-5 text-left">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="font-black text-sm text-[#001c41] uppercase tracking-wider">
                  {isGovernmentalOrPublic(business) ? 'Contact Office' : 'Contact Business'}
                </span>
                <div className="flex items-center gap-2">
                  {((business.googlePlaceId && business.googlePlaceId !== '') || (business.googleBusinessLink && business.googleBusinessLink !== '') || business.googleLinked) ? (
                    <span className="bg-blue-50 text-blue-700 border border-blue-150 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5">
                      ✓ Google Verified
                    </span>
                  ) : (
                    isOwner && (
                      <button
                        onClick={() => setShowVerifyModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 border-none text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-0.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
                      >
                        Verify Now
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Action grid: Call only (to track call leads alone) */}
              <div className="w-full">
                <button
                  onClick={() => handleCall(business.phone)}
                  className="w-full py-3 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-800/10 cursor-pointer"
                >
                  <Phone className="h-4 w-4" />
                  <span>Call Now</span>
                </button>
              </div>

              {/* Enquiry box */}
              {!isGovernmentalOrPublic(business) && (
                <form onSubmit={handleSendEnquiry} className="border-t border-slate-100 pt-5 flex flex-col gap-3.5 mt-2">
                  <span className="font-extrabold text-xs text-slate-700 uppercase tracking-widest">Send Enquiry</span>
                  
                  {enquirySuccess && (
                    <div className="bg-emerald-50 border border-emerald-250 text-[#027244] rounded-xl p-3 text-[10.5px] font-bold flex items-center gap-2 animate-fadeIn">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                      <span>Enquiry successfully sent to owner!</span>
                    </div>
                  )}

                  <input
                    type="text"
                    placeholder="Your Name..."
                    value={enquiryName}
                    onChange={(e) => setEnquiryName(e.target.value)}
                    disabled={isExpired}
                    className="py-2.5 px-3 border border-slate-200 rounded-xl shadow-2xs text-xs font-bold text-slate-700 bg-slate-50/20 focus:outline-none focus:border-[#027244] focus:ring-1 focus:ring-emerald-100 disabled:opacity-50"
                  />
                  
                  <input
                    type="text"
                    placeholder="Your Phone Number..."
                    value={enquiryPhone}
                    onChange={(e) => setEnquiryPhone(e.target.value)}
                    disabled={isExpired}
                    className="py-2.5 px-3 border border-slate-200 rounded-xl shadow-2xs text-xs font-bold text-slate-700 bg-slate-50/20 focus:outline-none focus:border-[#027244] focus:ring-1 focus:ring-emerald-100 disabled:opacity-50"
                  />
                  
                  <textarea
                    placeholder="Enquiry message..."
                    value={enquiryMessage}
                    onChange={(e) => setEnquiryMessage(e.target.value)}
                    rows="2.5"
                    disabled={isExpired}
                    className="py-2.5 px-3 border border-slate-200 rounded-xl shadow-2xs text-xs font-bold text-slate-700 bg-slate-50/20 focus:outline-none focus:border-[#027244] focus:ring-1 focus:ring-emerald-100 disabled:opacity-50"
                  />
                  
                  <button
                    type="submit"
                    disabled={isExpired || !enquiryName || !enquiryPhone || !enquiryMessage}
                    className="py-3 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-800/10 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Send Enquiry</span>
                  </button>
                </form>
              )}
            </div>

            {/* Timings / Business Hours card */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-[24px] p-6 flex flex-col gap-4 text-left">
              <span className="font-extrabold text-sm text-slate-800 border-b border-slate-100 pb-3 flex items-center justify-between gap-1.5 w-full">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-slate-500" /> {isGovernmentalOrPublic(business) ? 'Office Hours' : 'Business Hours'}
                </span>
              </span>
              <div className="flex flex-col gap-3 text-xs font-bold text-slate-600">
                {business.parentBusinessId && business.workingHours ? (
                  <div className="flex justify-between py-2 border-b border-slate-50 last:border-b-0">
                    <span className="text-slate-400 font-semibold">{isGovernmentalOrPublic(business) ? 'Office Hours' : 'Working Hours'}</span>
                    <span className="text-slate-700 font-bold">{business.workingHours}</span>
                  </div>
                ) : (
                  business.timings && typeof business.timings === 'object' && business.timings !== null && !Array.isArray(business.timings) ? (
                    Object.entries(business.timings).map(([day, time]) => (
                      <div key={day} className="flex justify-between border-b border-slate-50 pb-2 last:border-b-0">
                        <span className="text-slate-400 font-semibold">{day}</span>
                        <span className={`flex items-center gap-1 ${String(time || '').toLowerCase().includes('closed') ? 'text-red-500' : 'text-slate-700'}`}>
                          {String(time || 'Closed')} <ChevronRight className="h-3 w-3 text-slate-300" />
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 font-semibold text-center">
                      {typeof business.timings === 'string' ? business.timings : 'No timings configured.'}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Share circular icons */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-[24px] p-6 flex flex-col gap-3.5 text-left">
              <span className="font-extrabold text-sm text-slate-800">Share This Business</span>
              <div className="flex items-center gap-3.5 mt-1 justify-center">
                <button 
                  onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                  className="h-10 w-10 border border-slate-200 hover:border-slate-400 hover:bg-slate-50 rounded-full flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                >
                  <Facebook className="h-4.5 w-4.5" />
                </button>
                <button 
                  onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent('Check out ' + (business?.name || 'this business') + ' on UBT: ' + window.location.href)}`, '_blank')}
                  className="h-10 w-10 border border-slate-200 hover:border-slate-400 hover:bg-slate-50 rounded-full flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                >
                  <MessageSquare className="h-4.5 w-4.5 fill-current text-slate-600" />
                </button>
                <button 
                  onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent('Check out ' + (business?.name || 'this business') + ' on UBT')}`, '_blank')}
                  className="h-10 w-10 border border-slate-200 hover:border-slate-400 hover:bg-slate-50 rounded-full flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                >
                  <Twitter className="h-4.5 w-4.5" />
                </button>
                <button 
                  onClick={handleShare}
                  className="h-10 w-10 border border-slate-200 hover:border-slate-400 hover:bg-slate-50 rounded-full flex items-center justify-center text-slate-600 transition-colors cursor-pointer font-bold text-xs"
                >
                  <Globe className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Owner Lead Ad card */}
            <div className="bg-slate-900 border border-slate-850 rounded-[28px] p-6 text-white text-left flex flex-col gap-4 relative overflow-hidden shadow-lg shadow-slate-950/15">
              <div className="absolute right-0 bottom-0 opacity-[0.06] transform translate-y-3 translate-x-3 pointer-events-none select-none">
                <Globe className="h-32 w-32" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest">Are you a Business Owner?</span>
                <h4 className="font-extrabold text-sm text-white mt-1.5 leading-snug">Get more visibility and new customers by listing your business today.</h4>
              </div>
              <div className="flex flex-col gap-2.5 text-xs text-slate-300 font-semibold mt-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Verified Business Badge</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Reach More Local Customers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Grow Your Business Online</span>
                </div>
              </div>
              <button 
                onClick={() => navigate('/register')}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow transition-all hover:-translate-y-0.5 cursor-pointer mt-2 text-center"
              >
                List Your Business Now
              </button>
            </div>

          </div>
        </div>
      </div>

      {business && business.subscriptionStatus !== 'active' && !isGovernmentalOrPublic(business) && !isAdmin && !isOwner && (
        <div className="absolute inset-0 bg-[#F8FAFC]/55 backdrop-blur-[2px] flex items-center justify-center p-4 z-10 select-none pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-[32px] p-8 max-w-lg w-full text-center shadow-[0_20px_50px_rgba(0,0,0,0.08)] flex flex-col items-center gap-5 hover:scale-[1.01] transition-transform duration-300">
            <div className="h-16 w-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-3xl flex items-center justify-center shadow-inner animate-bounce">
              <svg className="h-8 w-8 text-amber-500 fill-none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Profile Locked</h3>
            
            {isOwner ? (
              <>
                <p className="text-sm font-semibold text-slate-500 leading-relaxed max-w-sm">
                  Your business listing is approved and ready! Activate your subscription now to publish this profile and unlock all premium details for customers.
                </p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-4.5 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs rounded-2xl shadow-md transition-all uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] cursor-pointer mt-2"
                >
                  Activate Your Subscription
                </button>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-slate-500 leading-relaxed max-w-sm">
                  This business profile is hidden from the public directories because their subscription is currently inactive. Please check back later.
                </p>
                <button
                  onClick={() => navigate('/businesses')}
                  className="w-full py-4.5 bg-slate-900 hover:bg-slate-850 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] cursor-pointer mt-2"
                >
                  Explore Other Businesses
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Google My Business Verification Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-md w-full bg-white border border-slate-200 shadow-2xl rounded-[32px] p-6 md:p-8 flex flex-col gap-6 animate-scaleUp text-left relative">
            
            {/* Close button */}
            <button 
              onClick={() => {
                setShowVerifyModal(false);
                setVerifyError('');
                setVerifySuccess('');
                setVerifyPlaceId('');
              }} 
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 h-8 w-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors z-10 border-none"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <div className="flex flex-col gap-2">
              <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-inner">
                <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.8 17 5 19 5a1 1 0 0 1 1 1z" fill="currentColor" />
                  <path d="m9 12 2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-slate-800 tracking-tight mt-2 font-sans">Verify Your Business Listing</h3>
              <p className="text-slate-500 text-xs font-semibold leading-relaxed font-sans">
                Provide your Google Place ID to link your Google Business Profile. We will check that the addresses match and instantly verify your profile.
              </p>
            </div>

            <div className="flex flex-col gap-4 animate-fadeIn">
              <div className="flex flex-col gap-1.5 font-sans">
                <label className="text-xs font-bold text-slate-700 tracking-wide uppercase">Google Place ID</label>
                <input
                  type="text"
                  placeholder="e.g. ChIJnUv03E3NqTsRHR_zk-gs78w"
                  value={verifyPlaceId}
                  onChange={(e) => setVerifyPlaceId(e.target.value)}
                  className="py-3 px-4 bg-white border border-slate-300 rounded-xl shadow-sm text-sm font-semibold w-full focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 text-slate-800"
                />
              </div>

              {verifyError && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 text-xs font-semibold flex items-start gap-2.5 shadow-sm animate-shake">
                  <AlertCircle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
                  <span>{verifyError}</span>
                </div>
              )}

              {verifySuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 text-xs font-semibold flex items-start gap-2.5 shadow-sm animate-fadeIn">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{verifySuccess}</span>
                </div>
              )}

              <button
                type="button"
                disabled={verifyLoading || !verifyPlaceId}
                onClick={handleVerifyGoogleBusiness}
                className="py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-emerald-700/20 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 border-none"
              >
                {verifyLoading ? 'Verifying...' : 'Verify & Link'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Lightbox / Full-screen Image Viewer Modal */}
      {activePhotoIndex !== null && (
        <div 
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-10 select-none animate-fadeIn"
          onClick={() => setActivePhotoIndex(null)}
        >
          {/* Close Button */}
          <button 
            onClick={() => setActivePhotoIndex(null)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md hover:scale-105 z-55"
            title="Close (Esc)"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* Left Arrow Navigation */}
          {typeof activePhotoIndex === 'number' && activePhotoIndex > 0 && (
            <button 
              onClick={(e) => { e.stopPropagation(); setActivePhotoIndex(idx => idx - 1); }}
              className="absolute left-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md hover:scale-105 z-55"
              title="Previous (Left Arrow)"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 rotate-180" />
            </button>
          )}

          {/* Right Arrow Navigation */}
          {typeof activePhotoIndex === 'number' && activePhotoIndex < displayGallery.length - 1 && (
            <button 
              onClick={(e) => { e.stopPropagation(); setActivePhotoIndex(idx => idx + 1); }}
              className="absolute right-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md hover:scale-105 z-55"
              title="Next (Right Arrow)"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          )}

          {/* Image Container */}
          <div 
            className="relative max-w-full max-h-[85vh] flex flex-col items-center gap-4 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={
                activePhotoIndex === 'logo'
                  ? window.getImageUrl(business.logoUrl)
                  : activePhotoIndex === 'cover'
                    ? mainImage
                    : displayGallery[activePhotoIndex]
              } 
              alt={
                activePhotoIndex === 'logo'
                  ? 'Logo'
                  : activePhotoIndex === 'cover'
                    ? 'Cover image'
                    : `Gallery view ${activePhotoIndex + 1}`
              }
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            />
            {/* Image counter indicator */}
            {typeof activePhotoIndex === 'number' && (
              <div className="px-4 py-1.5 bg-black/60 border border-white/15 rounded-full text-white text-xs font-extrabold font-mono tracking-wider shadow-sm">
                {activePhotoIndex + 1} / {displayGallery.length}
              </div>
            )}
            {activePhotoIndex === 'logo' && (
              <div className="px-4 py-1.5 bg-black/60 border border-white/15 rounded-full text-white text-xs font-extrabold tracking-wider shadow-sm">
                Business Logo
              </div>
            )}
            {activePhotoIndex === 'cover' && (
              <div className="px-4 py-1.5 bg-black/60 border border-white/15 rounded-full text-white text-xs font-extrabold tracking-wider shadow-sm">
                Cover Photo
              </div>
            )}
          </div>
        </div>
      )}
    </section>
    </div>
  );
}
