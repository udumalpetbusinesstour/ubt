import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as lucideIcons from 'lucide-react';

const renderCategoryIcon = (iconName, className = "h-5.5 w-5.5 sm:h-7 sm:w-7") => {
  const IconComp = lucideIcons[iconName] || lucideIcons.Store;
  return <IconComp className={className} />;
};

const categoryStylesMap = {
  'Agriculture & Farming': { icon: 'Leaf', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  'Agriculture': { icon: 'Leaf', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  'Automotive': { icon: 'Car', bg: 'bg-red-50', text: 'text-red-500' },
  'Automobile Services': { icon: 'Car', bg: 'bg-red-50', text: 'text-red-500' },
  'Baby & Kids Stores': { icon: 'ShoppingBag', bg: 'bg-pink-50', text: 'text-pink-500' },
  'Beauty & Wellness': { icon: 'Sparkles', bg: 'bg-pink-50', text: 'text-pink-500' },
  'Beauty Salons & Spa': { icon: 'Sparkles', bg: 'bg-pink-50', text: 'text-pink-500' },
  'Books & Stationery': { icon: 'BookOpen', bg: 'bg-blue-50', text: 'text-blue-500' },
  'Builders & Contractors': { icon: 'Building', bg: 'bg-indigo-50', text: 'text-indigo-500' },
  'Building Materials': { icon: 'Building', bg: 'bg-slate-50', text: 'text-slate-500' },
  'Business Services': { icon: 'Briefcase', bg: 'bg-emerald-50', text: 'text-emerald-500' },
  'Clothing & Fashion': { icon: 'ShoppingBag', bg: 'bg-amber-50', text: 'text-amber-500' },
  'Education': { icon: 'GraduationCap', bg: 'bg-blue-50', text: 'text-blue-500' },
  'Doctors & Healthcare': { icon: 'Activity', bg: 'bg-red-50', text: 'text-red-500' },
  'Electrical & Solar': { icon: 'Zap', bg: 'bg-amber-50', text: 'text-amber-500' },
  'Electronics & Mobiles': { icon: 'Smartphone', bg: 'bg-emerald-50', text: 'text-emerald-500' },
  'Electronics': { icon: 'Smartphone', bg: 'bg-emerald-50', text: 'text-emerald-500' },
  'Finance & Insurance': { icon: 'Coins', bg: 'bg-blue-50', text: 'text-blue-500' },
  'Furniture & Home Decor': { icon: 'Home', bg: 'bg-teal-50', text: 'text-teal-500' },
  'Grocery & Food Stores': { icon: 'ShoppingBag', bg: 'bg-amber-50', text: 'text-amber-500' },
  'Home Services': { icon: 'Wrench', bg: 'bg-teal-50', text: 'text-teal-500' },
  'Hotels & Lodges': { icon: 'Hotel', bg: 'bg-purple-50', text: 'text-purple-500' },
  'Internet & Telecom': { icon: 'Globe', bg: 'bg-blue-50', text: 'text-blue-500' },
  'IT & Digital Services': { icon: 'Laptop', bg: 'bg-emerald-50', text: 'text-emerald-500' },
  'Jewellery Shops': { icon: 'Gem', bg: 'bg-amber-50', text: 'text-amber-500' },
  'Legal & Document Services': { icon: 'Scale', bg: 'bg-slate-50', text: 'text-slate-500' },
  'Manufacturers & Industries': { icon: 'Factory', bg: 'bg-slate-50', text: 'text-slate-500' },
  'Manufacturing': { icon: 'Factory', bg: 'bg-slate-50', text: 'text-slate-500' },
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
  'Food & Restaurants': { icon: 'Utensils', bg: 'bg-amber-50', text: 'text-amber-500' },
  'Schools & Colleges': { icon: 'GraduationCap', bg: 'bg-blue-50', text: 'text-blue-500' },
  'Security Services': { icon: 'Shield', bg: 'bg-slate-50', text: 'text-slate-500' },
  'Shops & Retail Stores': { icon: 'Store', bg: 'bg-emerald-50', text: 'text-emerald-500' },
  'Sports & Fitness': { icon: 'Dumbbell', bg: 'bg-emerald-50', text: 'text-emerald-500' },
  'Training & Coaching': { icon: 'GraduationCap', bg: 'bg-blue-50', text: 'text-blue-500' },
  'Public Sector': { icon: 'Landmark', bg: 'bg-slate-50', text: 'text-slate-500' },
  'Wedding & Event Services': { icon: 'Sparkles', bg: 'bg-pink-50', text: 'text-pink-500' },
  'Shops': { icon: 'ShoppingBag', bg: 'bg-emerald-50', text: 'text-emerald-500' },
  'Shops & Showrooms': { icon: 'ShoppingBag', bg: 'bg-emerald-50', text: 'text-emerald-500' },
  'Professional Services': { icon: 'Briefcase', bg: 'bg-emerald-50', text: 'text-emerald-500' },
  'Travel & Hospitality': { icon: 'Compass', bg: 'bg-purple-50', text: 'text-purple-500' },
  'Travel & Transport': { icon: 'Compass', bg: 'bg-purple-50', text: 'text-purple-500' },
  'Construction': { icon: 'Wrench', bg: 'bg-orange-50', text: 'text-orange-500' },
  'Events & Entertainment': { icon: 'Sparkles', bg: 'bg-pink-50', text: 'text-pink-500' },
  'Health & Medical': { icon: 'Activity', bg: 'bg-red-50', text: 'text-red-500' },
  'Shopping': { icon: 'ShoppingBag', bg: 'bg-emerald-50', text: 'text-emerald-500' },
  'More': { icon: 'LayoutGrid', bg: 'bg-emerald-50', text: 'text-[#027244]' }
};

const getCategorySlug = (name) => {
  if (!name) return '/businesses';
  if (name === 'More') return '/businesses?focus=categories';
  
  let targetName = name;
  if (name === 'Hotels') targetName = 'Hotels & Lodges';
  if (name === 'Shops') targetName = 'Shopping';
  if (name === 'Services') targetName = 'Home Services';
  if (name === 'Health') targetName = 'Health & Medical';
  if (name === 'Automotive') targetName = 'Automobiles';
  if (name === 'Real Estate') targetName = 'Real Estate & Construction';
  if (name === 'Electronics') targetName = 'Electronics & Appliances';

  const slug = targetName.toLowerCase()
    .replace(/ & /g, '-and-')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `/${slug}-in-udumalpet`;
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
import { 
  Search, MapPin, Grid, Shield, Heart, Phone, Users, Star, ArrowRight, Check, ShieldCheck,
  ChevronLeft, ChevronRight, HelpCircle, Eye, MessageSquare, Play, Sparkles, X, Gift, Rocket,
  Hotel, Store, Wrench, HeartPulse, GraduationCap, Home as HouseIcon, Car, LayoutGrid,
  FileEdit, PhoneCall, Smile, Users2, Tv, Utensils, Building, ShoppingBag, Factory, 
  Briefcase, Compass, Sprout, CreditCard, Dumbbell, Landmark, Laptop, BookOpen, Zap,
  AlertCircle, Smartphone
} from 'lucide-react';

const mockFeatured = [
  {
    _id: 'featured_1',
    name: 'City Hospital',
    category: 'Hospitals',
    locality: 'Udumalpet',
    googleRating: 4.9,
    googleReviewsCount: 340,
    referrals: 28,
    isPremium: true,
    subscriptionStatus: 'active',
    isAddressVerified: true,
    coverImageUrl: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=500&q=80',
    phone: '+91 4252 223456',
    whatsapp: '+91 98425 22345',
    highlights: ['24x7 Service', 'Experienced Doctors', 'Pharmacy'],
  },
  {
    _id: 'featured_2',
    name: 'Sri Murugan Stores',
    category: 'Departmental Stores',
    locality: 'Gandhi Nagar, Udumalpet',
    googleRating: 4.8,
    googleReviewsCount: 290,
    referrals: 24,
    isPremium: true,
    subscriptionStatus: 'active',
    isAddressVerified: true,
    coverImageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80',
    phone: '+91 94430 12345',
    whatsapp: '+91 94430 12345',
    highlights: ['Quality Products', 'Good Service', 'Fair Prices'],
  },
  {
    _id: 'featured_3',
    name: 'Green Valley Hotel',
    category: 'Hotels & Restaurants',
    locality: 'Pollachi Road, Udumalpet',
    googleRating: 4.8,
    googleReviewsCount: 245,
    referrals: 19,
    isPremium: true,
    subscriptionStatus: 'active',
    isAddressVerified: true,
    coverImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80',
    phone: '+91 98945 99999',
    whatsapp: '+91 98945 99999',
    highlights: ['Pure Veg', 'Family Restaurant', 'AC Rooms'],
  },
  {
    _id: 'featured_4',
    name: 'Dhosaikadai.com',
    category: 'Food & Restaurants',
    locality: 'Central Bus Stand, Udumalpet',
    googleRating: 4.7,
    googleReviewsCount: 215,
    referrals: 16,
    isPremium: true,
    subscriptionStatus: 'active',
    isAddressVerified: true,
    coverImageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&q=80',
    phone: '+91 98422 11111',
    whatsapp: '+91 98422 11111',
    highlights: ['Crispy Dosa', 'South Indian Special', 'Quick Delivery'],
  },
  {
    _id: 'featured_5',
    name: 'R.K. Electricals & Hardware',
    category: 'Electrical Services',
    locality: 'Pollachi Road, Udumalpet',
    googleRating: 4.7,
    googleReviewsCount: 180,
    referrals: 14,
    isPremium: true,
    subscriptionStatus: 'active',
    isAddressVerified: true,
    coverImageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&q=80',
    phone: '+91 98945 43100',
    whatsapp: '+91 98945 43100',
    highlights: ['On-time Service', 'Expert Technicians', 'Quality Materials'],
  },
  {
    _id: 'featured_6',
    name: 'Royal Fitness Hub',
    category: 'Sports & Fitness',
    locality: 'Palani Road, Udumalpet',
    googleRating: 4.9,
    googleReviewsCount: 165,
    referrals: 12,
    isPremium: true,
    subscriptionStatus: 'active',
    isAddressVerified: true,
    coverImageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&q=80',
    phone: '+91 97877 88888',
    whatsapp: '+91 97877 88888',
    highlights: ['Modern Gym Equipment', 'Certified Trainers', 'Steam Bath'],
  },
  {
    _id: 'featured_7',
    name: 'Udumalpet Care Dental Clinic',
    category: 'Health & Medical',
    locality: 'Kuttai Thidal, Udumalpet',
    googleRating: 4.8,
    googleReviewsCount: 152,
    referrals: 10,
    isPremium: true,
    subscriptionStatus: 'active',
    isAddressVerified: true,
    coverImageUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=500&q=80',
    phone: '+91 94421 33333',
    whatsapp: '+91 94421 33333',
    highlights: ['Painless Dentistry', 'Laser Dental Care', 'Affordable Care'],
  },
  {
    _id: 'featured_8',
    name: 'Vasanth & Co Electronics',
    category: 'Electronics',
    locality: 'Main Bazaar, Udumalpet',
    googleRating: 4.6,
    googleReviewsCount: 140,
    referrals: 9,
    isPremium: true,
    subscriptionStatus: 'active',
    isAddressVerified: true,
    coverImageUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500&q=80',
    phone: '+91 4252 221144',
    whatsapp: '+91 98428 55555',
    highlights: ['Best Festival Offers', 'Easy EMI Available', 'Free Home Delivery'],
  },
  {
    _id: 'featured_9',
    name: 'Classic Mens Wear',
    category: 'Shopping',
    locality: 'Bus Stand Complex, Udumalpet',
    googleRating: 4.7,
    googleReviewsCount: 135,
    referrals: 7,
    isPremium: true,
    subscriptionStatus: 'active',
    isAddressVerified: true,
    coverImageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&q=80',
    phone: '+91 99443 66666',
    whatsapp: '+91 99443 66666',
    highlights: ['Trending Collections', 'Wedding Suites', 'Custom Tailoring'],
  },
  {
    _id: 'featured_10',
    name: 'Thirumoorthy Resorts',
    category: 'Travel & Hospitality',
    locality: 'Thirumoorthy Dam Road, Udumalpet',
    googleRating: 4.8,
    googleReviewsCount: 128,
    referrals: 5,
    isPremium: true,
    subscriptionStatus: 'active',
    isAddressVerified: true,
    coverImageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&q=80',
    phone: '+91 98422 77777',
    whatsapp: '+91 98422 77777',
    highlights: ['Swimming Pool', 'Mountain View Cottages', 'Campfire & BBQ'],
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [locationTerm, setLocationTerm] = useState('');
  const [categoryTerm, setCategoryTerm] = useState('All Categories');
  const [featuredBusinesses, setFeaturedBusinesses] = useState([]);
  const [topViewedBusinesses, setTopViewedBusinesses] = useState([]);
  const [sponsoredAds, setSponsoredAds] = useState([]);
  const [activeAdIndex, setActiveAdIndex] = useState(0);
  const [activeFaq, setActiveFaq] = useState(null);
  const [dbCategories, setDbCategories] = useState([]);
  const [isGoogleReviewModalOpen, setIsGoogleReviewModalOpen] = useState(false);
  const [googleActiveTab, setGoogleActiveTab] = useState('reviews');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/categories');
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.data)) {
          setDbCategories(data.data);
        }
      } catch (err) {
        console.error('Error fetching categories in Home:', err);
      }
    };
    fetchCategories();
  }, []);

  const getHomeDynamicMainCategories = () => {
    const fallbackHomeCategories = [
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
      'Public Sector',
      'Governmental organisations',
    ];
    const mainCats = new Set(fallbackHomeCategories);
    if (Array.isArray(dbCategories)) {
      dbCategories.forEach(cat => {
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

  const faqScrollRef = useRef(null);
  const categoryScrollRef = useRef(null);
  const featuredScrollRef = useRef(null);
  const testimonialScrollRef = useRef(null);
  const topViewedScrollRef = useRef(null);
  const howItWorksScrollRef = useRef(null);
  const stepsRegisterScrollRef = useRef(null);
  const sponsoredAdsScrollRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      if (featuredScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = featuredScrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 20) {
          featuredScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          featuredScrollRef.current.scrollBy({ left: 330, behavior: 'smooth' });
        }
      }
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (sponsoredAds.length <= 1) return;
    const timer = setInterval(() => {
      if (sponsoredAdsScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = sponsoredAdsScrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 20) {
          sponsoredAdsScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          sponsoredAdsScrollRef.current.scrollBy({ left: clientWidth + 20, behavior: 'smooth' });
        }
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [sponsoredAds]);

  useEffect(() => {
    if (!topViewedBusinesses || topViewedBusinesses.length <= 1) return;
    const timer = setInterval(() => {
      if (topViewedScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = topViewedScrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 20) {
          topViewedScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          topViewedScrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [topViewedBusinesses]);

  // Testimonials state
  const fallbackTestimonials = [];

  const [testimonials, setTestimonials] = useState([]);
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  // Modal and submission state
  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
  const [newTestimonial, setNewTestimonial] = useState({
    authorName: '',
    role: 'Business Owner',
    text: '',
    rating: 5
  });
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [categoriesList, setCategoriesList] = useState([
    { 
      name: 'Hotels', 
      icon: (
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="2" width="16" height="20" rx="2" fill="#E6F2ED" stroke="#027244" strokeWidth="2" />
          <rect x="7" y="5" width="3" height="3" rx="0.5" fill="#001c41" />
          <rect x="14" y="5" width="3" height="3" rx="0.5" fill="#001c41" />
          <rect x="7" y="10" width="3" height="3" rx="0.5" fill="#001c41" />
          <rect x="14" y="10" width="3" height="3" rx="0.5" fill="#001c41" />
          <path d="M9 16h6v6H9v-6z" fill="#027244" />
        </svg>
      ), 
      path: '/businesses?category=Hotels' 
    },
    { 
      name: 'Shops', 
      icon: (
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 9l1-5h16l1 5v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" fill="#E6F2ED" stroke="#027244" strokeWidth="2" />
          <path d="M3 9h18L20 4H4L3 9z" fill="#027244" />
          <path d="M6 9v2m4-2v2m4-2v2m4-2v2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="8" y="14" width="8" height="8" fill="#001c41" rx="1" />
        </svg>
      ), 
      path: '/businesses?category=Shops' 
    },
    { 
      name: 'Services', 
      icon: (
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19.7 4.3a3 3 0 00-4.2 0L12 7.8 7.8 3.6a3 3 0 00-4.2 4.2L7.8 12l-4.2 4.2a3 3 0 104.2 4.2L12 16.2l4.2 4.2a3 3 0 004.2-4.2L16.2 12l4.2-4.2a3 3 0 000-4.2z" fill="#E6F2ED" />
          <path d="M19.7 4.3a3 3 0 00-4.2 0L12 7.8 7.8 3.6a3 3 0 00-4.2 4.2l3.5 3.5-6.4 6.4a2 2 0 102.8 2.8l6.4-6.4 3.5 3.5a3 3 0 004.2-4.2L16.2 12l3.5-3.5a3 3 0 000-4.2z" stroke="#027244" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="3" fill="#001c41" />
        </svg>
      ), 
      path: '/businesses?category=Services' 
    },
    { 
      name: 'Health', 
      icon: (
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#E6F2ED" stroke="#027244" strokeWidth="2" />
          <path d="M12 6v10M7 11h10" stroke="#001c41" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ), 
      path: '/businesses?category=Health' 
    },
    { 
      name: 'Education', 
      icon: (
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 3L1 9l11 6 11-6-11-6z" fill="#027244" />
          <path d="M5 12.5V17c0 1.66 3.13 3 7 3s7-1.34 7-3v-4.5" fill="#E6F2ED" stroke="#027244" strokeWidth="2" />
          <path d="M17 11.5v5.5M12 15v5" stroke="#001c41" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ), 
      path: '/businesses?category=Education' 
    },
    { 
      name: 'Real Estate', 
      icon: (
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 10.5V20a2 2 0 002 2h14a2 2 0 002-2v-9.5" fill="#E6F2ED" stroke="#027244" strokeWidth="2" />
          <path d="M12 3L2 12h3v8h14v-8h3L12 3z" fill="#027244" />
          <rect x="9" y="13" width="6" height="7" fill="#001c41" />
        </svg>
      ), 
      path: '/businesses?category=Real%20Estate' 
    },
    { 
      name: 'Automotive', 
      icon: (
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 8h-1V5a2 2 0 00-2-2H8a2 2 0 00-2 2v3H5a3 3 0 00-3 3v6a2 2 0 002 2h1v2a2 2 0 002 2h1a2 2 0 002-2v-2h8v2a2 2 0 002 2h1a2 2 0 002-2v-2h1a2 2 0 002-2v-6a3 3 0 00-3-3z" fill="#E6F2ED" stroke="#027244" strokeWidth="2" />
          <rect x="5" y="10" width="14" height="4" fill="#001c41" rx="1" />
          <circle cx="6.5" cy="16.5" r="1.5" fill="#fff" />
          <circle cx="17.5" cy="16.5" r="1.5" fill="#fff" />
        </svg>
      ), 
      path: '/businesses?category=Automotive' 
    },
    { 
      name: 'Beauty & Wellness', 
      icon: <Sparkles className="h-7 w-7 text-pink-500" />,
      path: '/businesses?category=Beauty%20%26%20Wellness' 
    },
    { 
      name: 'Electronics', 
      icon: <Tv className="h-7 w-7 text-emerald-500" />,
      path: '/businesses?category=Electronics' 
    },
    { 
      name: 'Home Services', 
      icon: <HouseIcon className="h-7 w-7 text-teal-600" />,
      path: '/businesses?category=Home%20Services' 
    },
    { 
      name: 'More', 
      icon: (
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="7" height="7" rx="1.5" fill="#027244" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" fill="#001c41" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" fill="#001c41" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" fill="#027244" />
        </svg>
      ), 
      path: '/businesses?focus=categories' 
    }
  ]);

  useEffect(() => {
    const fetchFeaturedAndCounts = async () => {
      // 1. Fetch top 10 featured businesses based on Bayesian Average formula
      try {
        const res = await fetch('http://localhost:5000/api/businesses?sort=reviews&limit=15');
        const data = await res.json();
        const rawList = (data.success && data.data && Array.isArray(data.data)) ? data.data : [];
        const listToProcess = rawList.filter(b => !isGovernmentalOrPublic(b) && b.subscriptionStatus === 'active');

        let totalRatingSum = 0;
        let totalRatingCount = 0;
        listToProcess.forEach(b => {
          const r = Number(b.googleRating ?? b.rawGoogleRating ?? b.rating ?? 0);
          if (r > 0) {
            totalRatingSum += r;
            totalRatingCount++;
          }
        });
        const globalAvgC = totalRatingCount > 0 ? (totalRatingSum / totalRatingCount) : 4.0;
        const confidenceWeightM = 50;

        const getBayesianScore = (b) => {
          const R = Number(b.googleRating ?? b.rawGoogleRating ?? b.rating ?? 0);
          const v = Number(b.googleReviewsCount ?? b.rawGoogleReviewsCount ?? b.reviewsCount ?? (b.googleReviews ? b.googleReviews.length : 0) ?? 0);
          if (v === 0 && R === 0) return 0;
          const bayesianTerm = (v / (v + confidenceWeightM)) * R + (confidenceWeightM / (v + confidenceWeightM)) * globalAvgC;
          const volumeBonus = 0.1 * Math.log10(v + 1);
          return bayesianTerm + volumeBonus;
        };

        const sortedByBayesian = [...listToProcess].sort((a, b) => getBayesianScore(b) - getBayesianScore(a));
        setFeaturedBusinesses(sortedByBayesian.slice(0, 10));
      } catch (err) {
        console.warn('Backend server offline, setting empty featured businesses.');
        setFeaturedBusinesses([]);
      }

      // 1b. Fetch top 10 contributor businesses (ranked by referrals)
      try {
        const res = await fetch('http://localhost:5000/api/businesses?sort=referrals&limit=10');
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          const sortedByRef = [...data.data].filter(b => b.subscriptionStatus === 'active' || isGovernmentalOrPublic(b)).sort((a, b) => (b.referrals || 0) - (a.referrals || 0));
          setTopViewedBusinesses(sortedByRef.slice(0, 10));
        } else {
          setTopViewedBusinesses([]);
        }
      } catch (err) {
        console.warn('Backend server offline, running fallback top contributors sync.');
        setTopViewedBusinesses([]);
      }

      // 2. Fetch all businesses to calculate category counts and average ratings dynamically
      try {
        const catRes = await fetch('http://localhost:5000/api/categories');
        const catData = await catRes.json();
        const dbCategories = catData.success ? catData.data : [];

        const getParentCategory = (subName) => {
          if (!subName) return 'Others';
          const dbCat = dbCategories.find(c => c.categoryName.toLowerCase() === subName.toLowerCase());
          if (dbCat && dbCat.parentCategory && dbCat.parentCategory !== 'Others') {
            return dbCat.parentCategory;
          }
          const availableCats = Array.from(
            new Set(dbCategories.map(cat => cat.parentCategory).filter(p => p && p.trim() !== '' && p !== 'Others'))
          );
          if (availableCats.some(p => p.toLowerCase() === subName.toLowerCase())) {
            return subName;
          }
          if (dbCat && !dbCat.parentCategory) {
            return dbCat.categoryName;
          }
          return 'Others';
        };

        const res = await fetch('http://localhost:5000/api/businesses');
        const data = await res.json();
        if (data.success) {
          const counts = {};
          const ratingSums = {};
          const availableCategories = Array.from(
            new Set(dbCategories.map(cat => cat.parentCategory).filter(p => p && p.trim() !== '' && p !== 'Others'))
          );
          availableCategories.forEach(c => {
            counts[c] = 0;
            ratingSums[c] = 0;
          });
          data.data.forEach(biz => {
            const catName = biz.category;
            const parentCat = getParentCategory(catName || '');
            const rat = Number(biz.googleRating || biz.rating || 0);
            
            if (counts[parentCat] !== undefined) {
              counts[parentCat]++;
              ratingSums[parentCat] += rat;
            }
          });
          const avgRatings = {};
          Object.keys(counts).forEach(c => {
            avgRatings[c] = counts[c] > 0 ? (ratingSums[c] / counts[c]) : 0;
          });
          updateDynamicCategories(counts, avgRatings, dbCategories);
        }
      } catch (err) {
        console.warn('API error, using standard fallback category counts.');
        const mockCounts = {
          'Automotive': 125,
          'Beauty & Wellness': 98,
          'Education': 87,
          'Electronics': 112,
          'Food & Restaurants': 156,
          'Health & Medical': 84,
          'Home Services': 142,
          'Real Estate': 76,
          'Shopping': 138,
          'Manufacturing': 64,
          'Professional Services': 118,
          'Travel & Hospitality': 61,
          'Construction': 92,
          'Agriculture': 53,
          'Finance & Insurance': 49,
          'Events & Entertainment': 57,
          'Sports & Fitness': 41,
          'Public Sector': 38
        };
        const mockAvgRatings = {
          'Automotive': 4.6,
          'Beauty & Wellness': 4.8,
          'Education': 4.7,
          'Electronics': 4.5,
          'Food & Restaurants': 4.9,
          'Health & Medical': 4.6,
          'Home Services': 4.7,
          'Real Estate': 4.4,
          'Shopping': 4.6,
          'Manufacturing': 4.3,
          'Professional Services': 4.7,
          'Travel & Hospitality': 4.5,
          'Construction': 4.4,
          'Agriculture': 4.2,
          'Finance & Insurance': 4.3,
          'Events & Entertainment': 4.6,
          'Sports & Fitness': 4.5,
          'Public Sector': 4.1
        };
        updateDynamicCategories(mockCounts, mockAvgRatings, dbCategories);
      }

      // Fetch live approved sponsored ads
      try {
        const adsRes = await fetch('http://localhost:5000/api/businesses/homepage/sponsored-ads');
        const adsData = await adsRes.json();
        if (adsData.success && Array.isArray(adsData.data)) {
          setSponsoredAds(adsData.data);
        } else {
          setSponsoredAds([]);
        }
      } catch (adsErr) {
        console.error('Error fetching homepage sponsored ads:', adsErr);
        setSponsoredAds([]);
      }
    };

    const updateDynamicCategories = (counts, avgRatings = {}, dbCats = []) => {
      let availableCategories = Array.from(
        new Set(dbCats.map(cat => cat.parentCategory).filter(p => p && p.trim() !== '' && p !== 'Others'))
      );

      if (availableCategories.length === 0) {
        availableCategories = [
          'Automotive', 'Beauty & Wellness', 'Education', 'Electronics', 'Food & Restaurants',
          'Health & Medical', 'Home Services', 'Real Estate', 'Shopping', 'Manufacturing',
          'Professional Services', 'Travel & Hospitality', 'Construction', 'Agriculture',
          'Finance & Insurance', 'Events & Entertainment', 'Sports & Fitness', 'Public Sector'
        ];
      }

      const sorted = availableCategories
        .map(name => {
          const styles = categoryStylesMap[name] || { icon: 'Store', bg: 'bg-emerald-50', text: 'text-emerald-500' };
          return {
            name,
            count: counts[name] || 0,
            avgRating: avgRatings[name] || 0,
            icon: renderCategoryIcon(styles.icon, `h-5.5 w-5.5 sm:h-7 sm:w-7 ${styles.text}`),
            bg: styles.bg,
            path: getCategorySlug(name)
          };
        })
        .sort((a, b) => {
          if (b.count !== a.count) {
            return b.count - a.count;
          }
          return b.avgRating - a.avgRating;
        })
        .slice(0, 11);

      // 12th item is More pointing to Explore Categories
      sorted.push({
        name: 'More',
        icon: renderCategoryIcon('LayoutGrid', 'h-5.5 w-5.5 sm:h-7 sm:w-7 text-[#027244]'),
        bg: 'bg-emerald-50',
        path: '/businesses?focus=categories'
      });

      setCategoriesList(sorted);
    };

    const fetchTestimonials = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/testimonials');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setTestimonials(data.data);
        }
      } catch (err) {
        console.warn('Backend server offline, using fallback testimonials.');
      }
    };

    fetchFeaturedAndCounts();
    fetchTestimonials();

    // Check if the URL has ?testimonial=true and the user is logged in
    const params = new URLSearchParams(window.location.search);
    if (params.get('testimonial') === 'true') {
      const token = localStorage.getItem('ubt_token');
      if (token) {
        let loggedInName = '';
        let loggedInRole = 'Viewer';
        try {
          const storedUser = localStorage.getItem('ubt_user');
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            loggedInName = parsed.fullName || parsed.name || '';
            if (parsed.role === 'owner') {
              loggedInRole = 'Business Owner';
            } else if (parsed.role === 'editor' || parsed.role === 'blog_writer') {
              loggedInRole = 'Blog Writer';
            } else if (parsed.role === 'event_manager') {
              loggedInRole = 'Event Manager';
            } else if (parsed.role === 'viewer' || parsed.role === 'user') {
              loggedInRole = 'Visitor / User';
            }
          }
        } catch (e) {
          console.warn('Failed to parse ubt_user details:', e);
        }
        setNewTestimonial({
          authorName: loggedInName,
          role: loggedInRole,
          text: '',
          rating: 5,
        });
        setIsTestimonialModalOpen(true);
        navigate('/', { replace: true });
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (!isTestimonialModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsTestimonialModalOpen(false);
        setSubmitSuccess('');
        setSubmitError('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTestimonialModalOpen]);

  const handlePrevTestimonial = () => {
    if (testimonials.length === 0) return;
    setTestimonialIdx(prev => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const handleNextTestimonial = () => {
    if (testimonials.length === 0) return;
    setTestimonialIdx(prev => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  const handleScrollFaqs = (direction) => {
    if (!faqScrollRef.current) return;
    const scrollAmount = direction === 'left' ? -350 : 350;
    faqScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handleScrollCategories = (direction) => {
    if (!categoryScrollRef.current) return;
    const scrollAmount = direction === 'left' ? -350 : 350;
    categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handleScrollFeatured = (direction) => {
    if (!featuredScrollRef.current) return;
    const scrollAmount = direction === 'left' ? -350 : 350;
    featuredScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handleScrollSponsored = (direction) => {
    if (!sponsoredAdsScrollRef.current) return;
    const clientWidth = sponsoredAdsScrollRef.current.clientWidth;
    const scrollAmount = direction === 'left' ? -(clientWidth + 20) : (clientWidth + 20);
    sponsoredAdsScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handleScrollTopViewed = (direction) => {
    if (!topViewedScrollRef.current) return;
    const scrollAmount = direction === 'left' ? -350 : 350;
    topViewedScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handleScrollTestimonials = (direction) => {
    if (!testimonialScrollRef.current) return;
    const scrollAmount = direction === 'left' ? -360 : 360;
    testimonialScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handleScrollHowItWorks = (direction) => {
    if (!howItWorksScrollRef.current) return;
    const scrollAmount = direction === 'left' ? -250 : 250;
    howItWorksScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handleScrollStepsRegister = (direction) => {
    if (!stepsRegisterScrollRef.current) return;
    const scrollAmount = direction === 'left' ? -250 : 250;
    stepsRegisterScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handleTestimonialSubmit = async (e) => {
    e.preventDefault();
    setSubmitSuccess('');
    setSubmitError('');
    setSubmitting(true);

    if (!newTestimonial.authorName.trim() || !newTestimonial.text.trim()) {
      setSubmitError('Please enter your name and thoughts.');
      setSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('ubt_token');
      const res = await fetch('http://localhost:5000/api/testimonials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTestimonial),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitSuccess('Thank you! Your testimonial has been submitted and is pending administrator verification.');
        setNewTestimonial({
          authorName: '',
          role: 'Business Owner',
          text: '',
          rating: 5,
        });
        setTimeout(() => {
          setIsTestimonialModalOpen(false);
          setSubmitSuccess('');
        }, 3500);
      } else {
        setSubmitError(data.message || 'Failed to submit testimonial.');
      }
    } catch (err) {
      // Mock local queue submission for offline demo
      setSubmitSuccess('Offline Demo Mode: Review sent to Admin approval desk queue!');
      setNewTestimonial({
        authorName: '',
        role: 'Business Owner',
        text: '',
        rating: 5,
      });
      setTimeout(() => {
        setIsTestimonialModalOpen(false);
        setSubmitSuccess('');
      }, 3500);
    } finally {
        setSubmitting(false);
      }
    };

    const handleShareThoughtsClick = () => {
      const token = localStorage.getItem('ubt_token');
      if (!token) {
        navigate('/login?redirect=' + encodeURIComponent('/?testimonial=true'));
        return;
      }

      // Prepopulate name and role
      let loggedInName = '';
      let loggedInRole = 'Viewer';
      try {
        const storedUser = localStorage.getItem('ubt_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          loggedInName = parsed.fullName || parsed.name || '';
          
          if (parsed.role === 'owner') {
            loggedInRole = 'Business Owner';
          } else if (parsed.role === 'editor' || parsed.role === 'blog_writer') {
            loggedInRole = 'Blog Writer';
          } else if (parsed.role === 'event_manager') {
            loggedInRole = 'Event Manager';
          } else if (parsed.role === 'viewer' || parsed.role === 'user') {
            loggedInRole = 'Visitor / User';
          }
        }
      } catch (e) {
        console.warn('Failed to parse ubt_user details:', e);
      }

      setNewTestimonial({
        authorName: loggedInName,
        role: loggedInRole,
        text: '',
        rating: 5,
      });
      setSubmitSuccess('');
      setSubmitError('');
      setIsTestimonialModalOpen(true);
    };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    
    // Smart category override: If they searched for a keyword that doesn't match
    // the currently selected category or its subcategories, reset to global search.
    let targetCat = categoryTerm;
    if (searchTerm.trim() && categoryTerm && categoryTerm !== 'All Categories') {
      const query = searchTerm.toLowerCase();
      const isSubOfCurrent = Array.isArray(dbCategories) && dbCategories.some(cat => 
        cat.categoryName && cat.categoryName.toLowerCase().includes(query) && 
        cat.parentCategory === categoryTerm
      );
      const isCurrentCat = categoryTerm.toLowerCase().includes(query);
      
      if (!isSubOfCurrent && !isCurrentCat) {
        targetCat = 'All Categories';
        setCategoryTerm('All Categories');
      }
    }

    if (!searchTerm.trim() && targetCat && targetCat !== 'All Categories') {
      let slugUrl = getCategorySlug(targetCat);
      if (locationTerm) slugUrl += `?locality=${encodeURIComponent(locationTerm)}`;
      navigate(slugUrl);
      return;
    }
    
    let url = `/businesses?q=${encodeURIComponent(searchTerm)}`;
    if (locationTerm) url += `&locality=${encodeURIComponent(locationTerm)}`;
    if (targetCat && targetCat !== 'All Categories') url += `&category=${encodeURIComponent(targetCat)}`;
    navigate(url);
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
    const cleanNum = whatsapp.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanNum}?text=Hello%20${encodeURIComponent(name)},%20I%20saw%20your%2520listing%20on%20Udumalpet%20Business%20Tour.`);
  };

  // Categories list is now dynamically defined and updated inside the Home component based on business counts.

  return (
    <div className="w-full flex flex-col items-center bg-[#F8FAFC]">
      
      {/* 1. Hero Section (Pixel Perfect Layout with User Uploaded Thirumoorthy Hills BG) */}
      <section className="w-full relative min-h-[500px] sm:min-h-[620px] bg-[#F8FAFC] flex items-center justify-center pt-4 pb-14 sm:pt-6 sm:pb-28 px-4 md:px-8 overflow-hidden z-0">
        
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
          <img 
            src="/thirumoorthy_dam.png" 
            alt="Thirumoorthy Hills Background"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
          />
          {/* Dynamic Gradient Overlay that smoothly blends image to transparent without washing details */}
          <div className="absolute inset-0 z-10 pointer-events-none select-none" style={{ background: "linear-gradient(to right, rgba(248, 250, 252, 0.35) 0%, rgba(248, 250, 252, 0.05) 70%, rgba(248, 250, 252, 0) 100%)" }} />
        </div>

        {/* Hero main body */}
        <div className="relative max-w-[1600px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-20">
          
          {/* Left panel: text & search */}
          <div className="lg:col-span-8 flex flex-col items-start text-left">
            
            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#001c41] tracking-tight leading-tight max-w-2xl font-sans">
              Discover Trusted <br className="hidden sm:inline" />
              Businesses in <br className="hidden sm:inline" />
              <span className="text-[#027244]">Udumalpet</span>
            </h1>
            
            <p className="mt-3 text-sm sm:text-[15px] md:text-[17px] text-slate-500 font-medium max-w-xl leading-relaxed">
              A trusted local platform to discover, connect and grow with verified businesses in and around Udumalpet.
            </p>

            {/* Rich horizontal search bar */}
            <form onSubmit={handleSearchSubmit} className="mt-4 w-full bg-white border border-slate-200/80 rounded-2xl shadow-xl p-2 flex flex-col md:flex-row gap-2 max-w-3xl">
              <div className="flex-1 flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                <Search className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none"
                />
              </div>

              <div className="md:w-48 flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Location"
                  value={locationTerm}
                  onChange={(e) => setLocationTerm(e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none"
                />
              </div>

              <div className="md:w-48 flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 relative">
                <Grid className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                <select
                  value={categoryTerm}
                  onChange={(e) => setCategoryTerm(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="All Categories">All Categories</option>
                  {getHomeDynamicMainCategories().map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="Others">Others</option>
                </select>
              </div>

              <button type="submit" className="bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs py-3 px-8 rounded-xl transition-all shadow-md shrink-0 cursor-pointer">
                Search
              </button>
            </form>

            {/* Popular searches chips */}
            <div className="mt-4 flex flex-wrap items-center gap-3.5 text-xs font-bold">
              <span className="text-[#001c41]">Popular Searches:</span>
              {['Hotels', 'Shops', 'Services', 'Hospitals', 'Schools'].map((chip) => (
                <Link 
                  key={chip} 
                  to={getCategorySlug(chip === 'Hospitals' ? 'Health' : chip === 'Schools' ? 'Education' : chip)}
                  className="bg-white hover:bg-slate-50 border border-slate-200 py-1.5 px-3.5 rounded-lg transition-colors font-bold text-slate-600 shadow-sm hover:border-[#027244]"
                >
                  {chip}
                </Link>
              ))}
            </div>

            {/* Onboarding CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full sm:w-auto">
              <Link 
                to="/register?flow=early_access"
                id="join-early-access-btn"
                className="bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs py-3.5 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Rocket className="h-4.5 w-4.5 animate-pulse" />
                <span>Join Early Access</span>
              </Link>
              <Link 
                to="/register?flow=general"
                id="register-business-btn"
                className="bg-white hover:bg-slate-50 border-2 border-[#027244] text-[#027244] font-extrabold text-xs py-3.5 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Store className="h-4.5 w-4.5" />
                <span>Register Your Business</span>
              </Link>
            </div>

            {/* Shaking Referral Tag */}
            <button 
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-referral-modal'))}
              className="mt-6 bg-amber-400 hover:bg-amber-500 text-slate-900 text-[11px] font-black uppercase tracking-wider px-4 py-2.5 rounded-full shadow-md animate-shake border border-amber-500/20 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Gift className="h-4 w-4 text-[#027244] shrink-0 animate-bounce" />
              Join as Partner to Earn Rewards!
            </button>

          </div>

          {/* Right panel space to keep the layout grid balanced on desktop */}
          <div className="lg:col-span-4 hidden lg:block" />

        </div>

        {/* Wavy bottom divider curves */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-20">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[60px]">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C26.9,8.75,57.05,18.3,90.41,27.35,163.81,47.28,243.68,67.23,321.39,56.44Z" fill="#F8FAFC"></path>
          </svg>
        </div>
      </section>

      {/* 2. Four Trust Indicators Cards (Row as a single unified bar matching mockup) */}
      <section className="mx-auto max-w-[1600px] w-full px-4 md:px-8 z-10 -mt-8">
        <div className="bg-white border border-slate-200/30 rounded-[20px] shadow-none md:shadow-lg py-5 px-6 md:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-slate-100">
          {[
            { icon: <ShieldCheck className="h-5.5 w-5.5 text-[#027244]" />, title: 'Verified Businesses', desc: 'All businesses are manually verified' },
            { icon: <HeartPulse className="h-5.5 w-5.5 text-[#027244]" />, title: 'Quality Service', desc: 'Top quality local businesses' },
            { icon: <Phone className="h-5.5 w-5.5 text-[#027244]" />, title: 'Easy to Connect', desc: 'Call, WhatsApp or Get Directions' },
            { icon: <Users2 className="h-5.5 w-5.5 text-[#027244]" />, title: 'Support Local', desc: 'Grow together with local businesses' }
          ].map((indicator, idx) => (
            <div 
              key={idx} 
              className={`flex items-center gap-4 hover:-translate-y-0.5 transition-all duration-300 ${
                idx === 0 
                  ? 'lg:pr-6' 
                  : idx === 3 
                    ? 'lg:pl-6' 
                    : 'lg:px-6'
              }`}
            >
              <div className="h-11 w-11 rounded-full bg-[#E6F4EA] text-[#027244] flex items-center justify-center shrink-0 select-none">
                {indicator.icon}
              </div>
              <div className="flex flex-col gap-0.5 text-left">
                <span className="font-extrabold text-[#001c41] text-xs md:text-sm leading-tight">{indicator.title}</span>
                <span className="text-[12px] md:text-[13px] text-slate-500 font-medium leading-normal mt-0.5">{indicator.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Top Categories Section (Using premium vector icons) */}
      <section className="mx-auto max-w-[1600px] w-full px-4 md:px-8 py-6 md:py-10 flex flex-col gap-4 md:gap-8">
        <div className="flex flex-col xs:flex-row xs:justify-between xs:items-end gap-2 border-b border-slate-200/80 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#001c41] tracking-tight">Top Categories</h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Explore local businesses by specific industry</p>
          </div>
          <Link to="/businesses?focus=categories" className="text-xs font-bold text-[#027244] hover:text-[#005934] flex items-center gap-1 shrink-0">
            View All Categories <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mx-auto relative max-w-full w-fit">
          {/* Scroll Left Button */}
          <button 
            onClick={() => handleScrollCategories('left')}
            className="absolute left-2 md:left-4 2xl:-left-12 top-1/2 -translate-y-1/2 z-10 h-8 w-8 md:h-10 md:w-10 flex items-center justify-center bg-transparent border-none shadow-none text-[#027244] hover:text-[#005934] cursor-pointer transition-all hover:scale-110 active:scale-90"
            aria-label="Scroll Categories Left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div 
            ref={categoryScrollRef} 
            className="mx-auto flex overflow-x-auto gap-4 pb-4 scrollbar-none snap-x snap-mandatory w-fit max-w-full scroll-smooth px-8 md:px-12 2xl:px-0"
          >
            {categoriesList.map((cat) => (
              <Link 
                key={cat.name} 
                to={cat.name === 'More' ? '/businesses?focus=categories' : `/businesses?category=${encodeURIComponent(cat.name)}`}
                className="card-premium group rounded-2xl py-4.5 px-3 sm:py-6 sm:px-4 flex flex-col items-center justify-center gap-2.5 sm:gap-4 text-center cursor-pointer w-[130px] sm:w-[160px] shrink-0 snap-center sm:snap-start"
              >
                <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full ${cat.bg || 'bg-emerald-50'} flex items-center justify-center select-none transition-transform duration-500 ease-out-expo group-hover:scale-110 shadow-2xs`}>
                  {cat.icon}
                </div>
                <span className="text-xs sm:text-[17px] font-medium text-slate-700 transition-colors duration-300 group-hover:text-[#027244] line-clamp-2 min-h-[2rem] flex items-center justify-center">{cat.name}</span>
              </Link>
            ))}
          </div>

          {/* Scroll Right Button */}
          <button 
            onClick={() => handleScrollCategories('right')}
            className="absolute right-2 md:right-4 2xl:-right-12 top-1/2 -translate-y-1/2 z-10 h-8 w-8 md:h-10 md:w-10 flex items-center justify-center bg-transparent border-none shadow-none text-[#027244] hover:text-[#005934] cursor-pointer transition-all hover:scale-110 active:scale-90"
            aria-label="Scroll Categories Right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* 4. Featured Businesses Section (With side chevrons!) */}
      <section className="mx-auto max-w-[1600px] w-full px-4 md:px-8 py-6 md:py-12 flex flex-col gap-4 md:gap-8 relative">
        <div className="flex flex-col xs:flex-row xs:justify-between xs:items-end gap-2 border-b border-slate-200/80 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#001c41] tracking-tight">Featured Businesses</h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Direct from our premium verified sponsors</p>
          </div>
          <Link to="/businesses?type=Premium" className="text-xs font-bold text-[#027244] hover:text-[#005934] flex items-center gap-1 shrink-0">
            View All Businesses <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mx-auto relative max-w-full w-fit">
          {/* Scroll Left Button */}
          {featuredBusinesses && featuredBusinesses.length > 1 && (
            <button 
              onClick={() => handleScrollFeatured('left')}
              className="absolute left-2 md:left-4 2xl:-left-12 top-1/2 -translate-y-1/2 z-10 h-8 w-8 md:h-10 md:w-10 flex items-center justify-center bg-transparent border-none shadow-none text-[#027244] hover:text-[#005934] cursor-pointer transition-all hover:scale-110 active:scale-90"
              aria-label="Scroll Featured Left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {featuredBusinesses && featuredBusinesses.length > 0 ? (
            <div 
              ref={featuredScrollRef}
              className="mx-auto flex overflow-x-auto gap-5 pb-4 scrollbar-none snap-x snap-mandatory w-full scroll-smooth px-[calc(50vw-140px)] sm:px-[calc(50vw-160px)] md:px-12 2xl:px-0"
            >
              {featuredBusinesses.map((biz) => {
                const isSubscribed = biz.subscriptionStatus === 'active' || isGovernmentalOrPublic(biz);
                return (
                  <div 
                    key={biz._id} 
                    className="card-premium group rounded-2xl overflow-hidden flex flex-col cursor-pointer relative w-[280px] sm:w-[320px] shrink-0 snap-center sm:snap-start"
                    onClick={() => navigate(`/${biz.slug || biz._id}`)}
                  >
                     <div 
                       onClick={(e) => { e.stopPropagation(); navigate(`/${biz.slug || biz._id}`); }}
                       className="w-full aspect-square overflow-hidden relative rounded-t-[15px] bg-slate-50 border-b border-slate-100 cursor-pointer"
                     >
                       <img 
                         src={window.getImageUrl(biz.logoUrl) || window.getImageUrl(biz.coverImageUrl) || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80"} 
                         alt={biz.name}
                         className="h-full w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-106 rounded-t-[15px]"
                         style={{
                           filter: !isSubscribed ? 'blur(6px) grayscale(30%)' : 'none'
                         }}
                       />
                      {isSubscribed && (
                        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1 z-10">
                          {biz.isFoundingMember && (
                            <div className="bg-amber-500 text-white px-1.5 py-0.5 rounded-lg shadow-xs flex items-center gap-0.5 border border-amber-600">
                              <Sparkles className="h-2.5 w-2.5 text-white fill-current" />
                              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider">Founding Member</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div 
                      className={`p-5 flex-grow flex flex-col justify-between gap-3.5 bg-white`}
                    >
                      <div className="flex flex-col gap-1.5 text-left relative z-30">
                        <h4 className="font-extrabold text-sm text-[#001c41] leading-tight transition-colors duration-300 group-hover:text-[#027244]">{biz.name}</h4>
                        <div 
                          className="flex flex-col gap-1.5"
                          style={{
                            filter: !isSubscribed ? 'blur-[4.5px] select-none pointer-events-none' : 'none'
                          }}
                        >
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{biz.category}</span>
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(biz.address ? `${biz.name}, ${biz.address}` : `${biz.name}, ${biz.locality || ''}, Udumalpet`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold mt-1 hover:text-emerald-500 transition-colors cursor-pointer group"
                            title="View on Google Maps"
                          >
                            <MapPin className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-500 shrink-0" />
                            <span className="group-hover:underline">{biz.locality}</span>
                          </a>
                        </div>
                      </div>

                      <div 
                        className="flex justify-between items-center border-t border-slate-100 pt-3 text-xs relative z-30"
                        style={{
                          filter: !isSubscribed ? 'blur-[4.5px] select-none pointer-events-none' : 'none'
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 text-amber-400 fill-current" />
                            <span className="font-bold text-slate-700">{biz.googleRating.toFixed(1)}</span>
                            <span className="text-[10px] font-bold text-slate-400">({biz.googleReviewsCount})</span>
                          </div>

                          {/* Quick call and map location symbols */}
                          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                            <a 
                              href={`tel:${biz.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="h-6 w-6 rounded-full bg-emerald-50 text-[#027244] border border-emerald-100/50 flex items-center justify-center hover:bg-emerald-100 transition-colors cursor-pointer"
                              title={`Call ${biz.name}`}
                            >
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(biz.address ? `${biz.name}, ${biz.address}` : `${biz.name}, ${biz.locality || ''}, Udumalpet`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="h-6 w-6 rounded-full bg-blue-50 text-blue-600 border border-blue-100/50 flex items-center justify-center hover:bg-blue-100 transition-colors cursor-pointer group"
                              title="View on Google Maps"
                            >
                              <MapPin className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                            </a>
                          </div>
                        </div>
                        <Link 
                          to={`/${biz.slug || biz._id}`}
                          className="text-[10px] font-bold text-[#027244] hover:underline flex items-center gap-0.5"
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
                        <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-2.5 flex flex-col items-center gap-1 shadow-lg max-w-[150px]">
                          <svg className="h-4.5 w-4.5 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span className="text-[9px] font-black uppercase tracking-widest text-white select-none">
                            Profile Locked
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="w-full flex flex-col items-center justify-center py-12 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-3xl max-w-xl mx-auto my-2 text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center animate-pulse">
                <AlertCircle className="h-6 w-6" />
              </div>
              <p className="text-base sm:text-lg font-extrabold text-[#001c41] tracking-tight">No listings yet</p>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold max-w-sm leading-relaxed mt-1">
                List yours if you are a business owner!
              </p>
              <Link to="/add-business" className="py-2.5 px-6 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs rounded-xl shadow transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer mt-1">
                Register Your Business
              </Link>
            </div>
          )}

          {/* Scroll Right Button */}
          {featuredBusinesses && featuredBusinesses.length > 1 && (
            <button 
              onClick={() => handleScrollFeatured('right')}
              className="absolute right-2 md:right-4 2xl:-right-12 top-1/2 -translate-y-1/2 z-10 h-8 w-8 md:h-10 md:w-10 flex items-center justify-center bg-transparent border-none shadow-none text-[#027244] hover:text-[#005934] cursor-pointer transition-all hover:scale-110 active:scale-90"
              aria-label="Scroll Featured Right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
  </section>

      {/* 4.5 Sponsored Ads Auto-scrolling Banner Section */}
      <section className="mx-auto max-w-[1600px] w-full px-4 md:px-8 py-6 flex flex-col gap-4">
        <div className="flex flex-col xs:flex-row xs:justify-between xs:items-end gap-2 border-b border-slate-200/80 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#001c41] tracking-tight flex items-center gap-2">
              <Sparkles className="h-5.5 w-5.5 text-amber-500 fill-amber-500/20 animate-pulse shrink-0" />
              Sponsored Ads
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Exclusive flyer promotions from our premium verified sponsors</p>
          </div>
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded shadow-2xs shrink-0 mb-1">Promotions</span>
        </div>

        {sponsoredAds.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-50 to-emerald-50/15 border border-dashed border-slate-300 rounded-[24px] p-8 flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-6 shadow-sm">
            <div className="flex items-center gap-4 flex-col md:flex-row">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-[#027244] flex items-center justify-center border border-emerald-100 shadow-3xs shrink-0">
                <Rocket className="h-6 w-6" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-extrabold text-[#001c41] text-base font-sans tracking-tight">Promote your offers or business here</h3>
                <p className="text-slate-500 text-xs font-semibold leading-relaxed max-w-xl">
                  Get premium visibility by featuring your business or discount flyer right here on our homepage banner. Join our network of premium local sponsors today!
                </p>
              </div>
            </div>
            <button 
              onClick={() => {
                const isLoggedIn = !!localStorage.getItem('ubt_token');
                if (isLoggedIn) {
                  navigate('/dashboard?tab=Offers%20%26%20Promotions&subtab=promotions');
                } else {
                  navigate('/login?redirect=/dashboard?tab=Offers%20%26%20Promotions%26subtab%3Dpromotions');
                }
              }}
              className="bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs py-3.5 px-6 rounded-xl transition-all shadow-md shrink-0 flex items-center gap-2 border border-emerald-700/10 cursor-pointer"
            >
              Promote Now <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="mx-auto relative max-w-full w-fit">
            {/* Scroll Left Button */}
            <button 
              onClick={() => handleScrollSponsored('left')}
              className="absolute left-2 md:left-4 2xl:-left-12 top-1/2 -translate-y-1/2 z-10 h-8 w-8 md:h-10 md:w-10 flex items-center justify-center bg-transparent border-none shadow-none text-[#027244] hover:text-[#005934] cursor-pointer transition-all hover:scale-110 active:scale-90"
              aria-label="Scroll Sponsored Ads Left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div 
              ref={sponsoredAdsScrollRef}
              className="mx-auto flex overflow-x-auto gap-5 pb-4 scrollbar-none snap-x snap-mandatory w-full scroll-smooth px-[calc(50vw-140px)] xs:px-[calc(50vw-160px)] sm:px-[calc(50vw-250px)] md:px-12 2xl:px-0"
            >
              {sponsoredAds.map((ad, idx) => (
                <div 
                  key={idx}
                  onClick={() => navigate(`/${ad.businessSlug || ad.businessId}`)}
                  className="w-[280px] xs:w-[320px] sm:w-[500px] md:w-[600px] lg:w-[750px] shrink-0 snap-center md:snap-start rounded-[20px] md:rounded-[28px] overflow-hidden aspect-[1920/900] bg-slate-900 shadow-md border border-slate-200 cursor-pointer hover:shadow-none md:shadow-lg transition-shadow relative"
                >
                  {/* Poster Background */}
                  <img
                    src={window.getImageUrl(ad.offer.banner)}
                    alt={ad.offer.title}
                    className="absolute inset-0 w-full h-full object-cover select-none"
                  />
                </div>
              ))}
            </div>

            {/* Scroll Right Button */}
            <button 
              onClick={() => handleScrollSponsored('right')}
              className="absolute right-2 md:right-4 2xl:-right-12 top-1/2 -translate-y-1/2 z-10 h-8 w-8 md:h-10 md:w-10 flex items-center justify-center bg-transparent border-none shadow-none text-[#027244] hover:text-[#005934] cursor-pointer transition-all hover:scale-110 active:scale-90"
              aria-label="Scroll Sponsored Ads Right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </section>

      {/* 5. Statistics Sections Band (Exact theme color match) */}
      <section className="w-full bg-[#001c41] text-white py-5 sm:py-8 px-4 border-y border-[#001430]">
        <div className="max-w-[1600px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10 text-center">
          {[
            { value: '500+', label: 'Businesses Listed', icon: <Users2 className="h-5 w-5 text-emerald-400" /> },
            { value: '50+', label: 'Categories Covered', icon: <LayoutGrid className="h-5 w-5 text-emerald-400" /> },
            { value: '10K+', label: 'Happy Customers', icon: <Smile className="h-5 w-5 text-emerald-400" /> },
            { value: '100%', label: 'Local Support & Trust', icon: <Heart className="h-5 w-5 text-emerald-400" fill="currentColor" /> }
          ].map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center gap-0.5 sm:gap-1">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-slate-900/60 flex items-center justify-center mb-1 border border-slate-800 shadow [&>svg]:h-4 [&>svg]:w-4 sm:[&>svg]:h-5 sm:[&>svg]:w-5">
                {stat.icon}
              </div>
              <span className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">{stat.value}</span>
              <span className="text-[9.5px] sm:text-[12px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5 sm:mt-1">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Top 10 Contributors Section (Horizontal scrollable row with manual scroll chevron controls) */}
      {topViewedBusinesses && topViewedBusinesses.length > 0 && (
        <section className="w-full py-6 md:py-12 flex flex-col gap-6 bg-white overflow-hidden border-b border-slate-100">
          <div className="max-w-[1600px] mx-auto w-full px-4 md:px-8 flex flex-col gap-1 text-left">
            <h2 className="text-2xl font-extrabold text-[#001c41] tracking-tight">Top 10 Contributors</h2>
            <p className="text-sm text-slate-500 font-medium">Leading local partners ranked by successful business referrals</p>
          </div>
          
          <div className="max-w-[1600px] mx-auto w-full px-4 md:px-8">
            {(() => {
              const hasTenRealContributors = topViewedBusinesses && 
                topViewedBusinesses.length >= 10 && 
                topViewedBusinesses.every(b => (b.referrals || 0) >= 1);

              if (hasTenRealContributors) {
                return (
                  <div className="mx-auto relative max-w-full w-fit">
                    {/* Scroll Left Button */}
                    <button 
                      onClick={() => handleScrollTopViewed('left')}
                      className="absolute left-2 md:left-4 2xl:-left-12 top-1/2 -translate-y-1/2 z-10 h-8 w-8 md:h-10 md:w-10 flex items-center justify-center bg-transparent border-none shadow-none text-[#027244] hover:text-[#005934] cursor-pointer transition-all hover:scale-110 active:scale-90"
                      aria-label="Scroll Top Contributors Left"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    {/* The scrolling wrapper */}
                    <div 
                      ref={topViewedScrollRef}
                      className="mx-auto flex overflow-x-auto gap-6 pb-4 scrollbar-none snap-x snap-mandatory w-fit max-w-full scroll-smooth px-8 md:px-12 2xl:px-0"
                    >
                        {topViewedBusinesses.map((biz) => {
                          const isSubscribed = biz.subscriptionStatus === 'active' || isGovernmentalOrPublic(biz);
                          return (
                            <div 
                              key={biz._id}
                              onClick={() => navigate(`/${biz.slug || biz._id}`)}
                              className="w-[260px] sm:w-[285px] shrink-0 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex gap-4 text-left snap-center sm:snap-start relative overflow-hidden"
                          >
                            {/* Logo/Image */}
                             {biz.logoUrl ? (
                               <div 
                                 onClick={(e) => { e.stopPropagation(); navigate(`/${biz.slug || biz._id}`); }}
                                 className="h-14 w-14 rounded-xl border border-slate-100 overflow-hidden bg-white shrink-0 flex items-center justify-center p-0.5 cursor-pointer"
                               >
                                 <img 
                                   src={window.getImageUrl(biz.logoUrl)} 
                                   alt={biz.name} 
                                   className="h-full w-full object-contain" 
                                   style={{
                                     filter: !isSubscribed ? 'blur(3px) grayscale(30%)' : 'none'
                                   }}
                                 />
                               </div>
                             ) : (
                               <div 
                                 onClick={(e) => { e.stopPropagation(); navigate(`/${biz.slug || biz._id}`); }}
                                 className="h-14 w-14 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-650 text-white font-extrabold text-lg flex items-center justify-center shrink-0 uppercase select-none cursor-pointer"
                                 style={{
                                   filter: !isSubscribed ? 'blur(3px) grayscale(30%)' : 'none'
                                 }}
                               >
                                 {biz.name ? biz.name.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'B'}
                               </div>
                             )}
                            
                            {/* Content details */}
                            <div className="flex flex-col justify-between overflow-hidden flex-grow">
                              <div className="flex flex-col gap-0.5 relative z-30">
                                <h4 className="font-extrabold text-sm text-[#001c41] truncate" title={biz.name}>{biz.name}</h4>
                                <div 
                                  className="flex flex-col gap-0.5"
                                  style={{
                                    filter: !isSubscribed ? 'blur-[3px] select-none pointer-events-none' : 'none'
                                  }}
                                >
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate">{biz.category}</span>
                                  <div className="flex items-center gap-3 mt-1.5">
                                    <div className="flex items-center gap-0.5 text-xs text-amber-500 font-extrabold">
                                      <Star className="h-3.5 w-3.5 fill-current" />
                                      <span>{(biz.googleRating || 0).toFixed(1)}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/60">
                                      <Users className="h-3.5 w-3.5 text-emerald-600" />
                                      <span>{biz.referrals || biz.referralCount || 0} referrals</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Glassmorphism Lock Overlay for Inactive Subscriptions */}
                            {!isSubscribed && (
                              <div 
                                onClick={(e) => { e.stopPropagation(); navigate(`/${biz.slug || biz._id}`); }}
                                className="absolute inset-0 bg-transparent hover:bg-slate-900/5 z-20 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer p-2 text-center"
                              >
                                <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-2 flex flex-col items-center gap-1 shadow-lg max-w-[140px]">
                                  <svg className="h-4 w-4 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                  <span className="text-[8.5px] font-black uppercase tracking-widest text-white select-none">
                                    Locked
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Scroll Right Button */}
                    <button 
                      onClick={() => handleScrollTopViewed('right')}
                      className="absolute right-2 md:right-4 2xl:-right-12 top-1/2 -translate-y-1/2 z-10 h-8 w-8 md:h-10 md:w-10 flex items-center justify-center bg-transparent border-none shadow-none text-[#027244] hover:text-[#005934] cursor-pointer transition-all hover:scale-110 active:scale-90"
                      aria-label="Scroll Top Viewed Right"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                );
              }

              return (
                <div className="w-full flex items-center justify-center py-12 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-3xl max-w-xl mx-auto my-2">
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center animate-pulse">
                      <Users className="h-6 w-6" />
                    </div>
                    <p className="text-base sm:text-lg font-extrabold text-[#001c41] tracking-tight">Refer others to be in top 10 contributors</p>
                    <p className="text-xs sm:text-sm text-slate-500 font-semibold max-w-sm leading-relaxed mt-1">
                      Help grow our community by inviting trusted business owners to join UBT.
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* 6. How It Works Section (Video Player) */}
      <section id="how-it-works" className="mx-auto max-w-[1600px] w-full px-4 md:px-8 py-8 md:py-16 flex flex-col items-center gap-6 md:gap-8">
        <div className="text-center max-w-xl">
          <h2 className="text-2xl font-extrabold text-[#001c41] tracking-tight">How It Works</h2>
          <p className="text-sm text-slate-500 font-medium mt-2">Watch this video to understand how Udumalpet Business Tour works</p>
        </div>

        <div className="w-full flex justify-center max-w-4xl mt-2 rounded-[28px] overflow-hidden border border-slate-200/65 shadow-2xl bg-slate-900/5 shadow-emerald-950/5">
          <video 
            src="https://dev-cdn.udumalpet.business/howitworks.mp4" 
            autoPlay
            muted
            loop
            controls 
            playsInline
            preload="metadata"
            className="w-full aspect-video object-cover"
          />
        </div>
      </section>



      {/* 8. What People Say Section */}
      <section className="w-full bg-slate-50/50 py-8 md:py-16 border-t border-slate-200/50 relative">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 flex flex-col gap-6 md:gap-10 relative w-full">
          
          <div className="flex flex-col xs:flex-row xs:justify-between xs:items-end gap-2 border-b border-slate-200/80 pb-3">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#001c41] tracking-tight">What People Say</h2>
                <a 
                  href="https://www.google.com/maps/place//data=!4m3!3m2!1s0x50c1e1cd425b733:0x8b8510b51c2abead!12e1?source=g.page.m.ia._&laa=nmx-review-solicitation-ia2"
                  onClick={(e) => {
                    e.preventDefault();
                    const width = 600;
                    const height = 700;
                    const left = (window.screen.width - width) / 2;
                    const top = (window.screen.height - height) / 2;
                    window.open(
                      "https://www.google.com/maps/place//data=!4m3!3m2!1s0x50c1e1cd425b733:0x8b8510b51c2abead!12e1?source=g.page.m.ia._&laa=nmx-review-solicitation-ia2",
                      "GoogleReviewPopup",
                      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`
                    );
                  }}
                  className="inline-flex items-center gap-1 bg-[#4285F4]/10 hover:bg-[#4285F4]/15 text-[#4285F4] px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border border-[#4285F4]/20 hover:scale-102"
                >
                  <Star className="h-3 w-3 fill-current text-[#F4B400] border-none" />
                  <span>See or write a review on Google</span>
                  <ArrowRight className="h-3 w-3" />
                </a>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Real experiences shared by our core community member creators</p>
            </div>
          </div>

          <div className="mx-auto relative max-w-full w-fit">
            {/* Scroll Left Button */}
            {testimonials && testimonials.length > 1 && (
              <button 
                onClick={() => handleScrollTestimonials('left')}
                className="absolute left-2 md:left-4 2xl:-left-12 top-1/2 -translate-y-1/2 z-10 h-8 w-8 md:h-10 md:w-10 flex items-center justify-center bg-transparent border-none shadow-none text-[#027244] hover:text-[#005934] cursor-pointer transition-all hover:scale-110 active:scale-90"
                aria-label="Scroll Testimonials Left"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}

            {testimonials && testimonials.length > 0 && (
              <div 
                ref={testimonialScrollRef}
                className="mx-auto flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden animate-fadeIn scroll-smooth px-8 md:px-12 2xl:px-0 w-fit max-w-full"
              >
                  {testimonials.map((t, idx) => (
                  <div 
                    key={t._id || idx}
                    className="w-[280px] sm:w-[350px] bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-7 flex flex-col justify-between gap-4 shrink-0 snap-center sm:snap-start shadow-2xs hover:shadow-xs transition-all relative"
                  >
                    <div className="flex flex-col gap-3 sm:gap-4">
                      {/* Review stars */}
                      <div className="flex items-center text-amber-400">
                        {[...Array(t.rating || 5)].map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" />
                        ))}
                        {[...Array(5 - (t.rating || 5))].map((_, i) => (
                          <Star key={i + 10} className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-200" />
                        ))}
                      </div>
                      
                      <p className="text-slate-600 font-semibold italic text-xs sm:text-[13px] leading-relaxed">
                        {t.text ? `"${t.text}"` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 mt-1 border-t border-slate-100/70 pt-3 sm:pt-4">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border border-slate-200 bg-[#E6F2ED] text-[#027244] font-black text-[10px] sm:text-xs flex items-center justify-center select-none shadow-2xs uppercase">
                        {(t.authorName || '').slice(0, 2)}
                      </div>
                      <div className="text-left flex flex-col gap-0.5">
                        <span className="font-extrabold text-[11px] sm:text-xs text-slate-800 leading-none">{t.authorName || ''}</span>
                        {t.role && t.role.trim() && (
                          <span className="text-[8px] sm:text-[9px] font-bold text-[#027244] uppercase tracking-wider bg-emerald-50 border border-emerald-100 rounded-sm px-1.5 py-0.5 leading-none inline-block mt-0.5">
                            {t.role.trim()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Scroll Right Button */}
            {testimonials && testimonials.length > 1 && (
              <button 
                onClick={() => handleScrollTestimonials('right')}
                className="absolute right-2 md:right-4 2xl:-right-12 top-1/2 -translate-y-1/2 z-10 h-8 w-8 md:h-10 md:w-10 flex items-center justify-center bg-transparent border-none shadow-none text-[#027244] hover:text-[#005934] cursor-pointer transition-all hover:scale-110 active:scale-90"
                aria-label="Scroll Testimonials Right"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Ask business owners, event managers, blog writers, or visitors to share their thoughts */}
          <div className="flex flex-col items-center gap-3.5 mt-4">
            <span className="text-sm text-slate-500 font-medium">Are you a Business Owner, Event Manager, Blog Writer, or Visitor using UBT?</span>
            <button
              onClick={handleShareThoughtsClick}
              className="bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs py-3 px-8 rounded-xl transition-all shadow-md hover:shadow-none md:shadow-lg flex items-center gap-1.5 cursor-pointer"
            >
              Share Your Thoughts About UBT
            </button>
          </div>
        </div>
      </section>

      {/* How It Works for Businesses Section (Video Player) */}
      <section id="how-it-works-business" className="mx-auto max-w-[1600px] w-full px-4 md:px-8 py-8 md:py-16 flex flex-col items-center gap-6 md:gap-8 border-t border-slate-200/50">
        <div className="text-center max-w-xl">
          <h2 className="text-2xl font-extrabold text-[#001c41] tracking-tight">Steps to Register</h2>
          <p className="text-sm text-slate-500 font-medium mt-2">Watch this video guide to list and verify your business on Udumalpet Business Tour</p>
        </div>

        <div className="w-full flex justify-center max-w-4xl mt-2 rounded-[28px] overflow-hidden border border-slate-200/65 shadow-2xl bg-slate-900/5 shadow-emerald-950/5">
          <video 
            src="https://dev-cdn.udumalpet.business/businessownersteps.mp4" 
            autoPlay
            muted
            loop
            controls 
            playsInline
            preload="metadata"
            className="w-full aspect-video object-cover"
          />
        </div>
      </section>

      {/* 8. FAQ Section */}
      <section id="faq" className="mx-auto max-w-[1600px] w-full px-4 md:px-8 py-8 md:py-16 flex flex-col gap-6 md:gap-12 border-t border-slate-200/50">
        
        {/* Header Block: Image left to FAQ heading */}
        <div className="w-full flex flex-col md:flex-row items-center gap-6 md:gap-10 text-center md:text-left">
          <div className="flex-shrink-0 select-none">
            <img 
              src="/faq_illustration.png" 
              alt="FAQ Illustration" 
              className="max-h-[100px] md:max-h-[140px] w-auto object-contain"
            />
          </div>
          <div className="max-w-xl">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#001c41] tracking-tight">Frequently Asked Questions</h2>
            <p className="text-sm text-slate-500 font-medium mt-2">Find quick answers to common queries about Udumalpet Business Tour</p>
          </div>
        </div>

        {/* FAQs horizontally scrollable wrapper */}
        <div className="mx-auto relative max-w-full w-fit">
          {/* Scroll Left Button */}
          <button 
            onClick={() => handleScrollFaqs('left')}
            aria-label="Scroll FAQs left"
            className="absolute left-2 md:left-4 2xl:-left-12 top-1/2 -translate-y-1/2 z-10 h-8 w-8 md:h-10 md:w-10 flex items-center justify-center bg-transparent border-none shadow-none text-[#027244] hover:text-[#005934] cursor-pointer transition-all hover:scale-110 active:scale-90"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div 
            ref={faqScrollRef}
            className="mx-auto flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth animate-fadeIn w-full px-[calc(50vw-140px)] xs:px-[calc(50vw-160px)] sm:px-[calc(50vw-225px)] md:px-12 2xl:px-0"
          >
          {[
            {
              q: 'How do I register and list my business on UBT?',
              a: 'You can register easily by clicking the "List Your Business" button in the header or footer, creating an owner/merchant account, and filling in your business profile details like name, category, timing, address, and contact numbers.'
            },
            {
              q: 'Is it free to list my business, and what are the premium benefits?',
              a: 'A basic listing is submitted for verification. To unlock premium priority placement, receive direct customer leads via WhatsApp, show gallery media, and post unlimited free events, you can upgrade to our Monthly or Yearly Premium Plans starting at very affordable rates.'
            },
            {
              q: 'How do I get a verified badge for my business listing?',
              a: 'Our administration team audits all listings. Once you provide valid verification details (like address proof or GST registration) and active contact credentials, the team issues the "UDT Verified" badge on your profile, boosting customer trust.'
            },
            {
              q: 'How much does it cost to promote an event on UBT?',
              a: 'For active Premium Business subscribers, listing and promoting local events (sports, expos, temple festivals, meets) is 100% free! For non-subscribers or general accounts, a standard listing charge of ₹99 applies per event.'
            },
            {
              q: 'Can I write blog articles or write reviews for local vendors?',
              a: 'Yes! Anyone registered on UBT can post guiding articles/blogs about tourist attractions or hidden culinary spots in Udumalpet. You can also write star reviews and comments directly on any verified merchant profile.'
            }
          ].map((faq, idx) => (
            <div 
              key={idx} 
              className="w-[280px] xs:w-[320px] sm:w-[450px] md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] shrink-0 snap-center md:snap-start bg-white border border-slate-200/80 rounded-3xl p-7 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-start select-none gap-4"
            >
              <div className="flex items-start gap-3 w-full">
                <span className="h-6 w-6 rounded-full bg-emerald-50 text-[#027244] font-black text-xs flex items-center justify-center shrink-0 mt-0.5 border border-emerald-100">
                  Q
                </span>
                <h3 className="font-extrabold text-[15px] sm:text-base text-slate-800 leading-snug">
                  {faq.q}
                </h3>
              </div>
              <div className="flex items-start gap-3 border-t border-slate-100 pt-4">
                <span className="h-6 w-6 rounded-full bg-slate-50 text-slate-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 border border-slate-100">
                  A
                </span>
                <p className="text-[13.5px] sm:text-sm text-slate-500 leading-relaxed font-medium">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
          </div>

          {/* Scroll Right Button */}
          <button 
            onClick={() => handleScrollFaqs('right')}
            aria-label="Scroll FAQs right"
            className="absolute right-2 md:right-4 2xl:-right-12 top-1/2 -translate-y-1/2 z-10 h-8 w-8 md:h-10 md:w-10 flex items-center justify-center bg-transparent border-none shadow-none text-[#027244] hover:text-[#005934] cursor-pointer transition-all hover:scale-110 active:scale-90"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Testimonials Submission Modal */}
      {isTestimonialModalOpen && (
        <div 
          onClick={() => {
            setIsTestimonialModalOpen(false);
            setSubmitSuccess('');
            setSubmitError('');
          }}
          className="fixed inset-0 bg-[#001c41]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-opacity animate-fadeIn text-left"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative border border-slate-100 flex flex-col gap-5 animate-scaleUp"
          >
            
            {/* Close Button */}
            <button
              onClick={() => {
                setIsTestimonialModalOpen(false);
                setSubmitSuccess('');
                setSubmitError('');
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 h-8 w-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <div className="flex flex-col gap-1 text-left">
              <span className="text-[10px] font-black uppercase text-[#027244] tracking-wider">Community Voice</span>
              <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Share Your Experience</h3>
              <p className="text-xs text-slate-400 font-semibold font-sans">Tell the community how Udumalpet Business Tour (UBT) has helped you!</p>
            </div>

            {submitSuccess && (
              <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs font-semibold p-4 rounded-2xl flex items-center gap-2 shadow-xs">
                <Check className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>{submitSuccess}</span>
              </div>
            )}

            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-650 text-xs font-semibold p-4 rounded-2xl flex items-center gap-2 shadow-xs">
                <span className="h-2 w-2 rounded-full bg-red-650 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {!submitSuccess && (
              <form onSubmit={handleTestimonialSubmit} className="flex flex-col gap-4 text-left">
                {/* Name */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-extrabold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={newTestimonial.authorName}
                    onChange={(e) => setNewTestimonial(prev => ({ ...prev, authorName: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4.5 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#027244] focus:bg-white transition-all shadow-xs"
                  />
                </div>

                {/* Role dropdown */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-extrabold text-slate-700">Your Role</label>
                  <select
                    value={newTestimonial.role}
                    onChange={(e) => setNewTestimonial(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#027244] focus:bg-white transition-all shadow-xs cursor-pointer"
                  >
                    <option value="Business Owner">Business Owner</option>
                    <option value="Event Manager">Event Manager</option>
                    <option value="Blog Writer">Blog Writer</option>
                    <option value="Visitor / User">Visitor / User</option>
                    <option value="Other">Other Community Member</option>
                  </select>
                </div>

                {/* Rating selection (Stars) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold text-slate-700">Rating</label>
                  <div className="flex items-center gap-1.5 select-none">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewTestimonial(prev => ({ ...prev, rating: star }))}
                        className="focus:outline-none"
                      >
                        <Star 
                          className={`h-6.5 w-6.5 transition-colors cursor-pointer ${
                            star <= newTestimonial.rating
                              ? 'text-amber-400 fill-current hover:scale-106'
                              : 'text-slate-200 hover:text-amber-300'
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Thoughts Textarea */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-extrabold text-slate-700">Your Thoughts / Feedback</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Share how this platform has helped your business or improved your experience..."
                    value={newTestimonial.text}
                    onChange={(e) => setNewTestimonial(prev => ({ ...prev, text: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4.5 py-3 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#027244] focus:bg-white transition-all shadow-xs resize-none leading-relaxed"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs py-3 px-8 rounded-xl transition-all shadow-md shadow-emerald-900/10 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {submitting ? 'Submitting Review...' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Google Review iframe Modal */}
      {isGoogleReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full h-[85vh] max-h-[750px] shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-scaleUp">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#4285F4] to-[#34A853] text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-extrabold text-white">
                  <Star className="h-5 w-5 text-amber-300 fill-current" />
                </div>
                <div className="flex flex-col text-left">
                  <h3 className="font-extrabold text-base md:text-lg leading-tight">Google Reviews & Ratings</h3>
                  <span className="text-xs text-white/90 font-medium">Udumalpet Business Tour (UBT)</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsGoogleReviewModalOpen(false)}
                  className="h-9 w-9 rounded-xl bg-black/20 hover:bg-black/30 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body with iframe */}
            <div className="flex-1 w-full bg-slate-100 relative overflow-hidden">
              <iframe
                title="Google Review Embed"
                src="https://maps.google.com/maps?q=Udumalpet+Business+Tour&t=&z=15&ie=UTF8&iwloc=&output=embed"
                className="w-full h-full border-0"
                allowFullScreen=""
                loading="lazy"
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0 text-xs text-slate-600 font-semibold">
              <span>Looking to write an honest review directly on Google Maps?</span>
              <a
                href="https://g.page/r/Ca2-Khy1EIWLEBM/review"
                className="bg-[#4285F4] hover:bg-[#3367D6] text-white px-4 py-2 rounded-xl font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>Write Review on Google</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
