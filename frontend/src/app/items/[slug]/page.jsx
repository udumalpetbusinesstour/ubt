import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Phone, MessageSquare, Share2, MapPin, Clock, Folder, 
  Tag, ShieldCheck, HeartHandshake, RefreshCw, AlertCircle, Info 
} from 'lucide-react';

const getApiUrl = () => {
  let localApiUrl = 'http://localhost:5000';
  if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    localApiUrl = `${window.location.protocol}//${window.location.hostname}:5000`;
  }
  return (typeof import_meta_env !== 'undefined' ? import_meta_env.VITE_API_URL : null) || localApiUrl;
};

const resolveImageUrl = (url) => {
  if (typeof window !== 'undefined' && window.getImageUrl) return window.getImageUrl(url);
  if (!url) return '';
  if (url.startsWith('data:image')) return url;
  const backendBase = getApiUrl().replace(/\/$/, '');
  let cleanUrl = url;
  if (cleanUrl.startsWith('http://localhost:5000')) {
    const replaced = cleanUrl.replace('http://localhost:5000', backendBase);
    return replaced.includes('/uploads/') ? replaced.replace('/uploads/', '/api/uploads/') : replaced;
  }
  if (cleanUrl.startsWith('/uploads') || cleanUrl.startsWith('uploads')) {
    const formattedUrl = cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
    return `${backendBase}/api${formattedUrl}`;
  }
  return cleanUrl;
};

export default function ItemDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState('');
  const [shareSuccess, setShareSuccess] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      setError('');
      try {
        const backendBase = getApiUrl();
        const res = await fetch(`${backendBase}/api/catalog/landing/${slug}`);
        const data = await res.json();
        if (data.success) {
          setItem(data.data);
          setActiveImage(data.data.imageUrl || '');
          document.title = `${data.data.name} for sale in Udumalpet | Udumalpet Business Tour`;
        } else {
          setError(data.message || 'Failed to load catalog item.');
        }
      } catch (err) {
        setError('Failed to connect to the server.');
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchItem();
  }, [slug]);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${item?.name} for sale in Udumalpet`, url: shareUrl });
      } catch (_) {}
    } else {
      navigator.clipboard.writeText(shareUrl);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2200);
    }
  };

  const handleWhatsAppContact = () => {
    if (!item) return;
    const business = item.businessId || {};
    const phone = business.whatsapp || business.phone || '';
    if (!phone) { alert('Seller contact number not available.'); return; }
    const clean = phone.replace(/[^0-9]/g, '');
    const formatted = clean.startsWith('91') ? clean : `91${clean}`;
    const text = encodeURIComponent(`Hi! I'm interested in "${item.name}" listed on Udumalpet Business Tour. Please share more details. Link: ${window.location.href}`);
    window.open(`https://wa.me/${formatted}?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen py-28 flex flex-col items-center justify-center gap-3 bg-slate-50">
        <RefreshCw className="h-9 w-9 text-emerald-600 animate-spin" />
        <span className="text-sm font-bold text-slate-500">Loading item details...</span>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-[70vh] py-20 flex flex-col items-center justify-center text-center p-4">
        <AlertCircle className="h-14 w-14 text-rose-500 mb-4" />
        <h3 className="text-xl font-black text-slate-800">Item Not Found</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-2 leading-relaxed">
          {error || 'The listing you are looking for is no longer available.'}
        </p>
        <button
          onClick={() => navigate('/businesses')}
          className="mt-6 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow cursor-pointer transition-colors"
        >
          Explore Other Listings
        </button>
      </div>
    );
  }

  const business = item.businessId || {};
  const discountPercent = item.offerPrice
    ? Math.round(((item.price - item.offerPrice) / item.price) * 100)
    : 0;
  const allImages = [item.imageUrl, ...(item.galleryUrls || [])].filter(Boolean);
  const displayPrice = item.offerPrice || item.price;

  return (
    <div className="bg-[#f8fafc] min-h-screen pt-20 pb-16" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col gap-6">

        {/* Header Nav */}
        <div className="flex items-center justify-between">
          <button
            id="item-back-button"
            onClick={() => business._id ? navigate(`/businesses/${business._id}`) : navigate(-1)}
            className="flex items-center gap-2 text-xs font-black text-slate-600 hover:text-emerald-700 bg-white border border-slate-200 py-2.5 px-4 rounded-xl shadow-sm cursor-pointer transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {business.name || 'Store'}
          </button>
          <button
            id="item-share-button"
            onClick={handleShare}
            className="flex items-center gap-2 text-xs font-black text-slate-600 hover:text-emerald-700 bg-white border border-slate-200 py-2.5 px-4 rounded-xl shadow-sm cursor-pointer transition-all"
          >
            <Share2 className="h-4 w-4" />
            {shareSuccess ? 'Link Copied!' : 'Share'}
          </button>
        </div>

        {/* Main card */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ── Images (left 7 cols) ── */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Hero Image */}
            <div className="w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center relative group"
              style={{ aspectRatio: '4/3' }}
            >
              {activeImage ? (
                <img
                  src={resolveImageUrl(activeImage)}
                  alt={item.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="flex flex-col items-center text-slate-300 gap-2 p-8">
                  <Folder className="h-16 w-16" />
                  <span className="text-xs font-bold">No preview available</span>
                </div>
              )}
              {/* Badges overlay */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <span className="bg-emerald-600 text-white text-[9px] font-extrabold uppercase tracking-wide py-1 px-2.5 rounded-full shadow">
                  {item.category || 'General'}
                </span>
                {discountPercent > 0 && (
                  <span className="bg-rose-600 text-white text-[9px] font-extrabold uppercase tracking-wide py-1 px-2.5 rounded-full shadow">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail strip */}
            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto py-1">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    id={`thumb-img-${i}`}
                    onClick={() => setActiveImage(img)}
                    className={`h-16 w-16 md:h-20 md:w-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      activeImage === img
                        ? 'border-emerald-600 ring-2 ring-emerald-400/30 scale-95'
                        : 'border-slate-200 hover:border-slate-350'
                    }`}
                  >
                    <img src={resolveImageUrl(img)} alt={`thumb ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Details (right 5 cols) ── */}
          <div className="lg:col-span-5 flex flex-col gap-5 justify-between text-left">
            <div className="flex flex-col gap-4">

              {/* Availability + category */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-slate-400" />
                  {item.category || 'General'}
                </span>
                <span className={`px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wide border ${
                  item.isAvailable
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {item.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-black text-[#001c41] leading-tight tracking-tight">
                {item.name}
              </h1>
              <p className="text-xs text-slate-400 font-semibold">
                Listed in Udumalpet · {business.name}
              </p>

              {/* Price block */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selling Price</span>
                <div className="flex items-end gap-3 mt-1">
                  {item.offerPrice ? (
                    <>
                      <span className="text-3xl font-black text-emerald-700">₹{item.offerPrice}</span>
                      <span className="text-xs text-slate-400 font-bold line-through mb-1">₹{item.price}</span>
                    </>
                  ) : (
                    <span className="text-3xl font-black text-slate-800">
                      {item.price > 0 ? `₹${item.price}` : 'Price on Request'}
                    </span>
                  )}
                </div>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-3 border border-slate-100 bg-slate-50/40 rounded-xl p-3 text-[10.5px] font-semibold text-slate-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  Verified Listing
                </div>
                <div className="flex items-center gap-2">
                  <HeartHandshake className="h-4 w-4 text-emerald-600 shrink-0" />
                  Direct Deal
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3">
              <button
                id="item-whatsapp-button"
                onClick={handleWhatsAppContact}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95"
              >
                <MessageSquare className="h-4 w-4" />
                Contact via WhatsApp
              </button>
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  id="item-phone-link"
                  className="w-full py-3.5 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-emerald-700 bg-white hover:bg-slate-50 rounded-2xl font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
                >
                  <Phone className="h-3.5 w-3.5" />
                  Call Seller · {business.phone}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom row: Specs + Seller Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Specs card */}
          <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col gap-4 text-left">
            <h4 className="font-extrabold text-sm text-[#001c41] flex items-center gap-2 pb-3 border-b border-slate-100">
              <Info className="h-4 w-4 text-emerald-600" />
              Specifications & Details
            </h4>

            {item.dynamicFields && Object.keys(item.dynamicFields).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(item.dynamicFields).map(([k, v], i) => {
                  if (v === undefined || v === null || v === '') return null;
                  return (
                    <div key={i} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex flex-col gap-0.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{k}</span>
                      <span className="text-slate-800 font-extrabold text-xs mt-0.5">
                        {typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-semibold italic py-2">No specifications listed.</p>
            )}

            {item.description && (
              <div className="mt-2 pt-4 border-t border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Description</span>
                <p className="text-xs font-semibold text-slate-600 leading-relaxed mt-2.5 whitespace-pre-line bg-slate-50 p-4 border border-slate-100 rounded-2xl">
                  {item.description}
                </p>
              </div>
            )}
          </div>

          {/* Seller card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col gap-5 text-left">
            <h4 className="font-extrabold text-sm text-[#001c41] pb-3 border-b border-slate-100">Seller Info</h4>

            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={business.logoUrl ? resolveImageUrl(business.logoUrl) : '/default_business_cover.png'}
                  alt={business.name}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-slate-800 text-xs leading-snug truncate">{business.name}</p>
                <p className="text-[10px] text-slate-400 font-bold truncate mt-0.5">{business.category || 'Local Business'}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 text-[11px] font-semibold text-slate-600 border-t border-slate-100 pt-4">
              {business.address && (
                <span className="flex gap-2">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="leading-normal">{business.address}</span>
                </span>
              )}
              <span className="flex gap-2">
                <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                <span>9:00 AM – 8:00 PM</span>
              </span>
            </div>

            <button
              id="view-business-profile-btn"
              onClick={() => business._id && navigate(`/businesses/${business._id}`)}
              className="w-full py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              View Full Business Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
