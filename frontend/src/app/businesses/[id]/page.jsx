import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, Phone, Mail, Clock, ShieldCheck, HeartHandshake, Star, Share2, Heart, Award, 
  ArrowLeft, Send, CheckCircle2, MessageSquare, AlertCircle, RefreshCw, Calendar, Globe, 
  Briefcase, Users, ChevronRight, Check, X, Facebook, Twitter
} from 'lucide-react';

export default function BusinessDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview'); // overview | services | photos | reviews | offers | about | map
  const [business, setBusiness] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  // Write review form states
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState('');
  const [reviewSubmitLoading, setReviewSubmitLoading] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Send enquiry form states
  const [enquiryName, setEnquiryName] = useState('');
  const [enquiryMessage, setEnquiryMessage] = useState('Hello, I am interested in your services and would like to receive details.');
  const [enquirySuccess, setEnquirySuccess] = useState(false);

  useEffect(() => {
    fetchBusinessDetails();
  }, [params.id]);

  const fetchBusinessDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/businesses/${params.id}`);
      const data = await res.json();
      if (data.success) {
        setBusiness(data.data);
        setReviews(data.data.reviews || []);
      } else {
        throw new Error('Business details not found.');
      }
    } catch (err) {
      console.warn('API error or mock ID request, falling back to gorgeous mock business details.', err);
      
      // Offline fallback: Match the correct mock business details based on the ID
      const mockBizList = {
        biz_1: {
          _id: 'biz_1',
          name: 'R.K. Electricals',
          category: 'Services',
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
        biz_2: {
          _id: 'biz_2',
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
          website: '',
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
        biz_3: {
          _id: 'biz_3',
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
        biz_4: {
          _id: 'biz_4',
          name: 'Sri Murugan Stores',
          category: 'Shops',
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
        biz_5: {
          _id: 'biz_5',
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

      const targetId = params.id === 'UBT-10024' ? 'biz_4' : params.id;
      const mockDetails = mockBizList[targetId];
      if (mockDetails) {
        setBusiness(mockDetails);
        setReviews(mockDetails.googleReviews || []);
      } else {
        setError('Business details not found.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPhonebook = () => {
    if (!business) return;

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
      const res = await fetch(`http://localhost:5000/api/reviews/${params.id}`, {
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

  const handleSendEnquiry = (e) => {
    e.preventDefault();
    if (!enquiryName) return;
    setEnquirySuccess(true);
    setTimeout(() => {
      setEnquirySuccess(false);
      setEnquiryName('');
    }, 3000);
  };

  const handleCall = (phone) => {
    window.open(`tel:${phone}`);
  };

  const handleWhatsApp = (whatsapp, name) => {
    const cleanNum = whatsapp.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanNum}?text=Hello%20${encodeURIComponent(name)},%20I%20saw%2520your%20listing%20on%20UBT.`);
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
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              window.close();
            }
          }}
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
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  window.close();
                }
              }} 
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
    currentUser._id === business.ownerId || 
    currentUser.id === business.ownerId || 
    currentUser._id === business.owner || 
    currentUser.id === business.owner
  );
  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin');
  const galleryCount = business.galleryUrls?.length || 0;
  const mainImage = business.coverImageUrl || "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80";
  const displayGallery = business.galleryUrls && business.galleryUrls.length > 0
    ? business.galleryUrls
    : [
        'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&q=80',
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&q=80',
        'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=500&q=80',
        'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&q=80',
      ];
  const remainingCount = Math.max(0, galleryCount - 4);

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
      {isExpired && (
        <div className="w-full bg-red-600 text-white font-extrabold text-xs py-3.5 px-4 text-center sticky top-[76px] z-30 shadow flex items-center justify-center gap-2">
          <AlertCircle className="h-4.5 w-4.5" />
          <span>Subscription expired. Renew to restore profile visibility and unlock contact buttons.</span>
          <Link to="/add-business?step=subscription" className="bg-white text-red-700 font-bold px-3 py-1 rounded ml-3.5 hover:bg-slate-100 transition-colors uppercase tracking-wide">
            Renew Now
          </Link>
        </div>
      )}

      {/* Premium Header Banner (Matching Image 5) */}
      <section className="w-full relative bg-[#090D1C] text-white py-14 px-4 border-b border-slate-800/60 overflow-hidden">
        {/* Background Image opacity filter */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-[0.08]" 
          style={{ backgroundImage: `url('${mainImage}')` }} 
        />
        {/* Sleek Blue ambient light overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6 z-10">
          <div className="flex flex-col gap-3">
            {/* Go Back button with Left Arrow */}
            <button 
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  window.close();
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-emerald-400 transition-colors w-fit cursor-pointer py-1 mb-1.5 hover:-translate-x-0.5 transition-transform"
            >
              <ArrowLeft className="h-4 w-4" /> Go Back
            </button>
            {/* Breadcrumbs */}
            <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
              <Link to="/" className="hover:text-emerald-400 transition-colors">Home</Link>
              <span className="text-slate-600">&gt;</span>
              <Link to="/businesses" className="hover:text-emerald-400 transition-colors">Businesses</Link>
              <span className="text-slate-600">&gt;</span>
              <span className="text-emerald-450 hover:text-emerald-400 transition-colors cursor-pointer">{business.type}</span>
              <span className="text-slate-600">&gt;</span>
              <span className="text-slate-200">{business.name}</span>
            </div>
            
            {/* Title Block with Verified Badge */}
            <div className="flex flex-wrap items-center gap-3.5 mt-2">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white font-sans">{business.name}</h1>
              {business.isAddressVerified && (
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-400/25 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm shrink-0">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified Business
                </span>
              )}
            </div>

            {/* Premium Rating and Specs Pills */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300 mt-2">
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                <div className="flex text-amber-400 shrink-0 gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < Math.floor(business.googleRating) ? 'fill-current' : 'text-slate-700'}`} />
                  ))}
                </div>
                <span className="font-black text-white ml-1">{business.googleRating.toFixed(1)}</span>
                <span className="text-[10px] text-slate-400">({business.googleReviewsCount} Reviews)</span>
              </div>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-450 font-bold bg-emerald-500/5 border border-emerald-500/15 px-2.5 py-1 rounded-lg">{business.type}</span>
              <span className="text-slate-600">•</span>
              <div className="flex items-center gap-1.5 text-slate-350">
                <MapPin className="h-4 w-4 text-emerald-500" />
                <span>{business.locality}, Udumalpet, Tamil Nadu - {business.pincode}</span>
              </div>
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

                {/* Map/Location Action */}
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.name + ', ' + business.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Google Maps Location"
                  className="h-10 w-10 bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/25 text-rose-400 hover:scale-105 active:scale-95 transition-all cursor-pointer rounded-xl flex items-center justify-center shadow-sm"
                >
                  <MapPin className="h-4.5 w-4.5" />
                </a>

                {/* Email Action */}
                {business.email && (
                  <a 
                    href={`mailto:${business.email}`}
                    title="Send Email"
                    className="h-10 w-10 bg-blue-500/10 border border-blue-500/25 hover:bg-blue-500/25 text-blue-400 hover:scale-105 active:scale-95 transition-all cursor-pointer rounded-xl flex items-center justify-center shadow-sm"
                  >
                    <Mail className="h-4.5 w-4.5" />
                  </a>
                )}

                {/* WhatsApp Action */}
                {!isExpired && business.whatsapp && (
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
                <span>Contact Details Blurred — Subscription Activation Required</span>
              </div>
            )}
          </div>

          {/* Banner Action Buttons */}
          <div className="flex items-center gap-3 shrink-0 mt-4 md:mt-0">
            <button className="h-10 px-4 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl flex items-center justify-center gap-2 text-slate-300 hover:text-white transition-all cursor-pointer font-bold text-xs">
              <Share2 className="h-4 w-4" /> Share
            </button>
            <button className="h-10 px-4 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl flex items-center justify-center gap-2 text-slate-300 hover:text-white transition-all cursor-pointer font-bold text-xs">
              <Heart className="h-4 w-4 text-rose-500" /> Save
            </button>
          </div>
        </div>
      </section>

      {/* Tabs navigation bar */}
      <section className="w-full bg-white border-b border-slate-200/80 sticky top-[76px] z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex overflow-x-auto gap-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'services', label: 'Services' },
            { id: 'photos', label: `Photos (${galleryCount})` },
            { id: 'reviews', label: `Reviews (${reviews.length})` },
            { id: 'offers', label: 'Offers (3)' },
            { id: 'about', label: 'About' },
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

      {/* Main Grid Content */}
      <section className="max-w-7xl w-full px-4 md:px-8 py-10 relative">
        <div 
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full"
          style={{
            filter: business && business.subscriptionStatus !== 'active' && !isAdmin ? 'blur(8px) grayscale(20%)' : 'none',
            pointerEvents: business && business.subscriptionStatus !== 'active' && !isAdmin ? 'none' : 'auto',
            userSelect: business && business.subscriptionStatus !== 'active' && !isAdmin ? 'none' : 'auto',
          }}
        >
        
        {/* Left Column (Overview, gallery, details, reviews) */}
        <div className="lg:col-span-2 flex flex-col gap-10">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-10 animate-fadeIn text-left">
              
              {/* About description */}
              <div className="flex flex-col gap-3.5">
                <h3 className="text-xl font-extrabold text-slate-800 font-sans">About {business.name}</h3>
                <p className="text-sm text-slate-500 leading-relaxed text-justify font-medium">{business.description}</p>
                
                {/* Highlights chip tags */}
                <div className="flex flex-wrap gap-2.5 mt-3">
                  {['On-time Service', 'Expert Technicians', 'Quality Materials', 'Affordable Pricing'].map((tag) => (
                    <span key={tag} className="bg-emerald-50/50 border border-emerald-100 text-emerald-700 text-[11px] font-bold py-2 px-4 rounded-xl flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Specifications block (Upgrade from list to exact 2-column gorgeous details grid from Image 5) */}
              <div className="flex flex-col gap-4 border-t border-slate-100 pt-8">
                <h3 className="text-lg font-extrabold text-slate-800 font-sans border-b border-slate-100 pb-3">Business Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 mt-2 p-1 text-slate-700">
                  {/* row 1 */}
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-slate-100/90 text-slate-500 shrink-0">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Business Type</span>
                      <span className="font-extrabold text-slate-800 text-sm mt-2">{business.type}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-slate-100/90 text-slate-500 shrink-0">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Working Hours</span>
                      <div className="flex flex-col mt-2 font-extrabold text-slate-800 text-sm leading-snug">
                        <span>Mon - Sat: {business.timings?.Monday || '9:00 AM - 8:00 PM'}</span>
                        {business.timings?.Sunday && <span>Sun: {business.timings.Sunday}</span>}
                      </div>
                    </div>
                  </div>

                  {/* row 2 */}
                  <div className="flex items-start gap-4 border-t border-slate-100 pt-5 md:border-t-0 md:pt-0">
                    <div className="p-3 rounded-xl bg-slate-100/90 text-slate-500 shrink-0">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Year of Establishment</span>
                      <span className="font-extrabold text-slate-800 text-sm mt-2">{business.yearEstablished || '2012'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 border-t border-slate-100 pt-5 md:border-t-0 md:pt-0">
                    <div className="p-3 rounded-xl bg-slate-100/90 text-slate-500 shrink-0">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Languages Known</span>
                      <span className="font-extrabold text-slate-800 text-sm mt-2">{business.languagesKnown || 'Tamil, English'}</span>
                    </div>
                  </div>

                  {/* row 3 */}
                  <div className="flex items-start gap-4 border-t border-slate-100 pt-5">
                    <div className="p-3 rounded-xl bg-slate-100/90 text-slate-500 shrink-0">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Employees</span>
                      <span className="font-extrabold text-slate-800 text-sm mt-2">{business.employeeCount || '10 - 20'}</span>
                    </div>
                  </div>

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

                  {/* row 4 - full width */}
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
                </div>
              </div>

              {/* Premium collage gallery */}
              <div className="flex flex-col gap-4 border-t border-slate-100 pt-8">
                <h3 className="text-lg font-extrabold text-slate-800 font-sans border-b border-slate-100 pb-3">Photos & Gallery</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-2">
                  {/* Left Large Image (takes 3 columns) */}
                  <div 
                    className="md:col-span-3 h-80 rounded-[24px] bg-cover bg-center border border-slate-200 shadow-sm relative overflow-hidden group cursor-pointer"
                    onClick={() => setActiveTab('photos')}
                    style={{ 
                      backgroundImage: `url('${mainImage}')`,
                      filter: isExpired ? 'blur(4px)' : 'none'
                    }}
                  >
                    <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/10 transition-colors" />
                  </div>
                  
                  {/* Right 2x2 Grid Collage (takes 2 columns) */}
                  <div className="md:col-span-2 grid grid-cols-2 gap-3 h-80">
                    {[...Array(4)].map((_, i) => {
                      const imgUrl = displayGallery[i] || mainImage;
                      const isLast = i === 3;
                      
                      return (
                        <div 
                          key={i}
                          onClick={() => setActiveTab('photos')}
                          className="rounded-[20px] bg-cover bg-center border border-slate-200 shadow-2xs relative overflow-hidden group cursor-pointer"
                          style={{ 
                            backgroundImage: `url('${imgUrl}')`,
                            filter: isExpired ? 'blur(4px)' : 'none'
                          }}
                        >
                          <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/10 transition-colors" />
                          {isLast && remainingCount > 0 && (
                            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-white text-center select-none animate-fadeIn">
                              <span className="text-lg font-black tracking-wide">+{remainingCount}</span>
                              <span className="text-[9px] font-black uppercase tracking-wider mt-0.5">More Photos</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Our Services Quick View */}
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
                  {business.services.slice(0, 8).map((service, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3 shadow-2xs">
                      <Check className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                      <span className="text-sm font-bold text-slate-700">{service}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Reviews Quick View */}
              <div className="flex flex-col gap-6 border-t border-slate-100 pt-8">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-extrabold text-slate-800 font-sans">Customer Reviews ({reviews.length})</h3>
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
                    <span className="text-5xl font-black text-slate-800">{business.googleRating.toFixed(1)}</span>
                    <div className="flex text-amber-400 gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4.5 w-4.5 fill-current" />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Out of 5 Stars</span>
                  </div>

                  {/* Right reviews stream (2 items preview) */}
                  <div className="md:col-span-2 flex flex-col gap-4">
                    {reviews.slice(0, 2).map((rev, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-2.5 shadow-2xs text-left">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[10px] font-black text-emerald-700 uppercase">
                              {rev.authorName.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-extrabold text-xs text-slate-800 leading-none">{rev.authorName}</span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">Verified Customer</span>
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

            </div>
          )}

          {/* TAB 2: SERVICES */}
          {activeTab === 'services' && (
            <div className="flex flex-col gap-5 animate-fadeIn text-left">
              <h3 className="text-xl font-extrabold text-slate-800 font-sans border-b border-slate-100 pb-3">Our Complete Services</h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">Wide range of specialized skills, brands, and systems offered by {business.name}.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                {business.services.map((service, idx) => (
                  <div key={idx} className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center gap-3.5 shadow-sm">
                    <CheckCircle2 className="h-5.5 w-5.5 text-emerald-600 shrink-0" />
                    <span className="text-sm font-bold text-slate-700">{service}</span>
                  </div>
                ))}
              </div>

              {business.brands && business.brands.length > 0 && (
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
              <h3 className="text-xl font-extrabold text-slate-800 font-sans border-b border-slate-100 pb-3">Store & Work Gallery ({galleryCount})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                {displayGallery.map((url, idx) => (
                  <div 
                    key={idx} 
                    className="h-44 rounded-2xl bg-cover bg-center border border-slate-200 shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-md transition-shadow" 
                    style={{ 
                      backgroundImage: `url('${url}')`,
                      filter: isExpired ? 'blur(4px)' : 'none' 
                    }}
                  >
                    <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/15 transition-colors" />
                  </div>
                ))}
              </div>
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
                  {[
                    { stars: 5, pct: '74%', count: 62 },
                    { stars: 4, pct: '19%', count: 16 },
                    { stars: 3, pct: '5%', count: 4 },
                    { stars: 2, pct: '1%', count: 1 },
                    { stars: 1, pct: '1%', count: 1 }
                  ].map((dist) => (
                    <div key={dist.stars} className="flex items-center gap-3">
                      <span className="w-4 text-right text-slate-450">{dist.stars}★</span>
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-450" style={{ width: dist.pct }} />
                      </div>
                      <span className="w-12 text-slate-400 text-right font-semibold">{dist.count} ({dist.pct})</span>
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
                <span className="font-black text-sm text-slate-800 border-b border-slate-100 pb-2">Customer Feedback Stream ({reviews.length})</span>
                {reviews.map((rev, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-[20px] p-5 shadow-xs flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="h-8.5 w-8.5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xs font-black text-emerald-700 uppercase shadow-2xs">
                          {rev.authorName.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-extrabold text-xs text-slate-800 leading-none">{rev.authorName}</span>
                          <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">Verified Customer</span>
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
              
              <div className="flex flex-col gap-5 mt-4">
                {/* Offer 1 */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 border border-emerald-500/20 shadow-md rounded-[24px] p-6 text-white flex justify-between items-center relative overflow-hidden">
                  <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                  <div className="flex flex-col gap-1 text-left relative z-10">
                    <span className="bg-white/20 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider self-start">Welcome Deal</span>
                    <h4 className="text-xl font-black mt-2">Flat 10% Off on First Call</h4>
                    <p className="text-xs text-emerald-100 font-medium mt-1 leading-relaxed max-w-sm">Get immediate discount on your first home wiring installation or electrical repair booking.</p>
                  </div>
                  <div className="bg-white text-emerald-800 font-black text-xs py-3 px-5 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-lg relative z-10 border border-emerald-100 select-none">
                    <span className="text-[10px] text-emerald-600 font-black uppercase tracking-wider leading-none">Code</span>
                    <span className="text-sm mt-1 tracking-wide">FIRST10</span>
                  </div>
                </div>

                {/* Offer 2 */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 border border-blue-500/20 shadow-md rounded-[24px] p-6 text-white flex justify-between items-center relative overflow-hidden">
                  <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                  <div className="flex flex-col gap-1 text-left relative z-10">
                    <span className="bg-white/20 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider self-start">Special Package</span>
                    <h4 className="text-xl font-black mt-2">Free Electrical Checkup</h4>
                    <p className="text-xs text-blue-100 font-medium mt-1 leading-relaxed max-w-sm">Book inverter repairs or CCTV setup above ₹2,500 and receive free home safety inspections.</p>
                  </div>
                  <div className="bg-white text-blue-800 font-black text-xs py-3 px-5 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-lg relative z-10 border border-blue-100 select-none">
                    <span className="text-[10px] text-blue-600 font-black uppercase tracking-wider leading-none">Code</span>
                    <span className="text-sm mt-1 tracking-wide">SAFETY</span>
                  </div>
                </div>

                {/* Offer 3 */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 border border-purple-500/20 shadow-md rounded-[24px] p-6 text-white flex justify-between items-center relative overflow-hidden">
                  <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                  <div className="flex flex-col gap-1 text-left relative z-10">
                    <span className="bg-white/20 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider self-start">Community Discount</span>
                    <h4 className="text-xl font-black mt-2">₹200 Off for Residents</h4>
                    <p className="text-xs text-purple-100 font-medium mt-1 leading-relaxed max-w-sm">Applicable strictly inside Udumalpet municipality limits on any service call.</p>
                  </div>
                  <div className="bg-white text-purple-800 font-black text-xs py-3 px-5 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-lg relative z-10 border border-purple-100 select-none">
                    <span className="text-[10px] text-purple-650 font-black uppercase tracking-wider leading-none">Code</span>
                    <span className="text-sm mt-1 tracking-wide">UDT200</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ABOUT */}
          {activeTab === 'about' && (
            <div className="flex flex-col gap-6 animate-fadeIn text-left font-sans">
              <h3 className="text-xl font-extrabold text-slate-800 font-sans border-b border-slate-100 pb-3">About {business.name}</h3>
              
              <div className="flex flex-col gap-4 text-slate-500 font-medium text-sm leading-relaxed text-justify">
                <p>
                  Founded in {business.yearEstablished || '2012'}, {business.name} has grown to become one of the premier {business.type} choices inside Udumalpet. We provide top-class local solutions to residential housings, retail shopping complexes, and large-scale industrial systems.
                </p>
                <p>
                  Our teams hold verified registrations, professional certificates, and are highly vetting by UBT administration to offer maximum safety and quality operations. Our working environment holds standard customer ratings and synced feedback.
                </p>
              </div>

              {business.brands && business.brands.length > 0 && (
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

          {/* TAB 7: MAP & LOCATION */}
          {activeTab === 'map' && (
            <div className="flex flex-col gap-4 animate-fadeIn text-left">
              <h3 className="text-xl font-extrabold text-slate-800 font-sans border-b border-slate-100 pb-3">Map & Directions</h3>
              <div className="h-96 w-full rounded-[28px] border border-slate-200 bg-slate-100 flex items-center justify-center text-xs text-slate-400 relative overflow-hidden shadow-sm select-none">
                {/* Embedded Map Thumbnail */}
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-80"
                  style={{ backgroundImage: `url('https://maps.googleapis.com/maps/api/staticmap?center=${business.coordinates?.lat || 10.5891},${business.coordinates?.lng || 77.2412}&zoom=15&size=800x400&markers=color:red%7C${business.coordinates?.lat || 10.5891},${business.coordinates?.lng || 77.2412}&key=')` }}
                />
                <div className="absolute inset-0 bg-slate-950/10" />
                <div className="absolute z-10 bottom-6 left-6 bg-white/95 border border-slate-200 shadow-xl rounded-2xl p-5 max-w-sm text-left text-slate-800 flex items-start gap-3.5 animate-fadeIn">
                  <MapPin className="h-5.5 w-5.5 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-black text-sm text-[#001c41]">{business.name}</span>
                    <span className="text-xs text-slate-500 font-semibold leading-relaxed mt-1.5">{business.address}</span>
                  </div>
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
                <span className="font-black text-sm text-[#001c41] uppercase tracking-wider">Contact Business</span>
                {business.isAddressVerified && (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5">
                    ✓ Verified
                  </span>
                )}
              </div>

              {/* Action grid: Call and WhatsApp */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleCall(business.phone)}
                  className="py-3 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-800/10 cursor-pointer"
                >
                  <Phone className="h-4 w-4" />
                  <span>Call Now</span>
                </button>
                
                {!isExpired ? (
                  <button
                    onClick={() => handleWhatsApp(business.whatsapp, business.name)}
                    className="py-3 border border-[#027244] hover:bg-emerald-50/50 text-[#027244] font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-white"
                  >
                    <MessageSquare className="h-4 w-4 fill-current" />
                    <span>WhatsApp</span>
                  </button>
                ) : (
                  <span className="py-3 bg-slate-100 border border-slate-200 text-slate-400 font-extrabold text-[10px] rounded-xl flex items-center justify-center select-none text-center leading-none">
                    WhatsApp Hidden
                  </span>
                )}
              </div>

              {/* Add to Phonebook option */}
              <button
                onClick={handleAddToPhonebook}
                className="w-full py-2.5 bg-blue-50 hover:bg-blue-100/70 border border-blue-150 text-blue-700 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Users className="h-4 w-4 text-blue-700" />
                <span>Add to Phonebook</span>
              </button>

              {/* Business Contact Parameters (With Website Included!) */}
              <div className="flex flex-col gap-4 text-xs font-bold text-slate-700">
                <div className="flex items-start gap-3">
                  <Phone className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-widest">Phone</span>
                    <span className="text-slate-800 font-extrabold mt-1">{isExpired ? 'Hidden due to expiry' : business.phone}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-slate-100 pt-4">
                  <Mail className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-widest">Email Address</span>
                    <span className="text-slate-800 font-extrabold mt-1">{isExpired ? 'Hidden due to expiry' : business.email || 'N/A'}</span>
                  </div>
                </div>

                {business.website && (
                  <div className="flex items-start gap-3 border-t border-slate-100 pt-4">
                    <Globe className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-widest">Website</span>
                      <a 
                        href={`https://${business.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-emerald-700 hover:text-emerald-800 font-extrabold hover:underline mt-1 break-all"
                      >
                        {business.website}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 border-t border-slate-100 pt-4">
                  <MapPin className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5 text-left">
                    <span className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-widest">Location Address</span>
                    <span className="text-slate-600 font-medium leading-relaxed mt-1">{business.address}</span>
                  </div>
                </div>
              </div>

              {/* Enquiry box */}
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
                  disabled={isExpired || !enquiryName}
                  className="py-3 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-800/10 cursor-pointer disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Enquiry</span>
                </button>
              </form>
            </div>

            {/* Timings / Business Hours card */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-[24px] p-6 flex flex-col gap-4 text-left">
              <span className="font-extrabold text-sm text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-500" /> Business Hours
              </span>
              <div className="flex flex-col gap-3 text-xs font-bold text-slate-600">
                {Object.entries(business.timings || {}).map(([day, time]) => (
                  <div key={day} className="flex justify-between border-b border-slate-50 pb-2 last:border-b-0">
                    <span className="text-slate-400 font-semibold">{day}</span>
                    <span className={`flex items-center gap-1 ${time.toLowerCase().includes('closed') ? 'text-red-500' : 'text-slate-700'}`}>
                      {time} <ChevronRight className="h-3 w-3 text-slate-300" />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Share circular icons */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-[24px] p-6 flex flex-col gap-3.5 text-left">
              <span className="font-extrabold text-sm text-slate-800">Share This Business</span>
              <div className="flex items-center gap-3.5 mt-1 justify-center">
                <button className="h-10 w-10 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 rounded-full flex items-center justify-center text-slate-600 transition-colors cursor-pointer">
                  <Facebook className="h-4.5 w-4.5" />
                </button>
                <button className="h-10 w-10 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 rounded-full flex items-center justify-center text-slate-600 transition-colors cursor-pointer">
                  <MessageSquare className="h-4.5 w-4.5 fill-current text-slate-600" />
                </button>
                <button className="h-10 w-10 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 rounded-full flex items-center justify-center text-slate-600 transition-colors cursor-pointer">
                  <Twitter className="h-4.5 w-4.5" />
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Business profile link copied to clipboard!");
                  }}
                  className="h-10 w-10 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 rounded-full flex items-center justify-center text-slate-600 transition-colors cursor-pointer font-bold text-xs"
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
                <span className="text-amber-450 text-[10px] font-black uppercase tracking-widest">Are you a Business Owner?</span>
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

      {business && business.subscriptionStatus !== 'active' && !isAdmin && (
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
    </section>
    </div>
  );
}
