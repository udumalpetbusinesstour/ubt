import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Compass, Info, Check, ShieldCheck, Users, Sparkles, 
  MapPin, Store, Calendar, ArrowRight, Activity, Award 
} from 'lucide-react';

export default function AboutUsView() {
  const pincodes = ['642126', '642154', '642112', '642207', '642128', '642120', '642158'];

  const specialties = [
    {
      title: 'Thirumoorthi Hills',
      label: 'Local Landmark',
      img: '/thirumoorthy_hills.png',
      fallback: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80',
      description: 'Majestic hills, waterfalls, and a peaceful dam at the foothills of the Western Ghats.'
    },
    {
      title: 'Udumalai Thirupathi',
      label: 'Spiritual Site',
      img: '/udumalai_thirupathi.png',
      fallback: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80',
      description: 'A beautiful temple resembling Tirumala Tirupati, attracting thousands of devotees.'
    },
    {
      title: 'Maari Amma Kovil',
      label: 'Historical Temple',
      img: '/maari_amma_kovil.png',
      fallback: 'https://images.unsplash.com/photo-1608958416805-4f7db91df010?w=800&q=80',
      description: 'An ancient temple holding spiritual significance for the entire Udumalpet community.'
    },
    {
      title: 'Coconut Farms',
      label: 'Agricultural Pride',
      img: '/coconut_farms.png',
      fallback: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&q=80',
      description: 'Vast, green coconut plantations forming the backbone of local coir and oil trade.'
    },
    {
      title: 'Amaravathi Dam & Crocodile Park',
      label: 'Eco-Tourism',
      img: '/amaravathi_dam.png',
      fallback: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80',
      description: 'Home to the largest wild breeding crocodile population in India, nested near a scenic reservoir.'
    }
  ];

  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % specialties.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [specialties.length]);

  return (
    <div className="w-full flex flex-col items-center bg-[#F8FAFC] font-sans overflow-hidden">
      
      <section 
        className="w-full relative min-h-[340px] bg-[#001c41] text-white py-16 px-4 md:px-8 border-b border-slate-800 flex flex-col justify-center"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(2,114,68,0.15),transparent_50%)]" />
        
        <div className="relative max-w-[1440px] mx-auto w-full flex flex-col items-center z-10 text-center">
          <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-extrabold uppercase tracking-widest bg-emerald-950/60 border border-emerald-800/60 px-3.5 py-1.5 rounded-full mb-5 shadow-inner">
            <MapPin className="h-3.5 w-3.5" /> Exclusively Udumalpet
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl leading-tight">
            Connecting Udumalpet’s Commerce <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-455 via-teal-255 to-white">
              With the Digital World
            </span>
          </h1>
          
          <p className="text-slate-300 text-xs md:text-base font-semibold mt-4 leading-relaxed max-w-2xl">
            A premium, localized directory and events hub crafted solely to elevate, verify, and spotlight the businesses, cottage industries, agriculture, and festivals of our home region.
          </p>

          <div className="flex items-center gap-2 mt-8 text-xs font-bold text-slate-400 bg-slate-900/40 px-4 py-2 rounded-xl border border-slate-800/40">
            <Link to="/" className="hover:text-emerald-400 transition-colors">Home</Link>
            <span className="text-slate-600">&gt;</span>
            <span className="text-slate-200">About Us</span>
          </div>
        </div>
      </section>

      {/* 2. GEOGRAPHIC / EXCLUSIVELY UDUMALPET SECTION */}
      <section className="max-w-[1440px] w-full px-4 md:px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 flex flex-col gap-5 text-left">
          <div className="inline-flex items-center gap-2 text-xs font-extrabold text-[#027244] uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full self-start">
            <Compass className="h-3.5 w-3.5" /> Geographic Exclusivity
          </div>
          
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-[#001c41] tracking-tight leading-tight">
            Why Only Udumalpet? <br />
            <span className="text-[#027244] font-extrabold">Eliminating the Search Noise.</span>
          </h2>

          <p className="text-slate-600 text-xs md:text-sm leading-relaxed font-semibold">
            Nestled beautifully in the foothills of the Western Ghats, Udumalpet is a unique, self-sustaining hub. From being Tamil Nadu\'s windmill power capital to hosting vast networks of coconut farms and coir processing factories, our local economy is rich and diverse.
          </p>
          
          <p className="text-slate-600 text-xs md:text-sm leading-relaxed font-semibold">
            However, generic search engines and state-wide business portals dilute local searches. When you search for services, you are often flooded with listings from Coimbatore, Pollachi, or Tiruppur. 
          </p>

          <div className="p-5.5 bg-emerald-50/50 border border-emerald-100 rounded-3xl mt-2">
            <h4 className="font-extrabold text-[#001c41] text-xs md:text-sm mb-2.5 flex items-center gap-1.5">
              <Award className="h-4.5 w-4.5 text-[#027244]" /> Vetted Postal Code Boundaries
            </h4>
            <p className="text-slate-500 text-xs leading-relaxed font-semibold mb-3.5">
              We enforce strict locality verification. Only businesses physically located in the following postal codes can be listed:
            </p>
            <div className="flex flex-wrap gap-2">
              {pincodes.map((pin) => (
                <span 
                  key={pin} 
                  className="px-2.5 py-1.5 bg-white border border-emerald-200 text-emerald-800 text-[10px] font-bold rounded-xl shadow-2xs transition-colors hover:bg-emerald-100"
                >
                  📍 {pin}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* SPECIALTIES SLIDESHOW */}
          <div className="relative h-72 select-none rounded-3xl overflow-hidden border border-slate-200 shadow-lg group">
            {specialties.map((slide, idx) => (
              <div 
                key={idx}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  idx === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/30 to-transparent z-10" />
                <img 
                  src={slide.img} 
                  className="w-full h-full object-cover transform scale-100 group-hover:scale-105 transition-transform duration-500" 
                  alt={slide.title} 
                  onError={(e) => {
                    e.target.src = slide.fallback;
                  }}
                />
                <div className="absolute bottom-5 left-5 right-5 z-20 text-white text-left">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-300 bg-emerald-950/70 border border-emerald-800/40 px-2 py-0.5 rounded mb-1.5 inline-block">
                    {slide.label}
                  </span>
                  <h4 className="text-base md:text-lg font-black leading-tight">{slide.title}</h4>
                  <p className="text-slate-300 text-[9.5px] leading-snug font-semibold mt-1">
                    {slide.description}
                  </p>
                </div>
              </div>
            ))}

            {/* Navigation dots */}
            <div className="absolute bottom-5 right-5 z-30 flex gap-1.5">
              {specialties.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === activeSlide ? 'w-4.5 bg-emerald-500' : 'w-1.5 bg-white/40'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs text-left">
              <span className="text-2xl font-black text-[#001c41]">100%</span>
              <h5 className="text-xs font-bold text-slate-800 mt-1">Local Listings</h5>
              <p className="text-slate-500 text-[10px] font-semibold mt-0.5">Strict geographical screening</p>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs text-left">
              <span className="text-2xl font-black text-[#027244]">0%</span>
              <h5 className="text-xs font-bold text-slate-800 mt-1">Middleman Fees</h5>
              <p className="text-slate-500 text-[10px] font-semibold mt-0.5">Direct merchant contacts</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. WHY THIS INITIATIVE? (BRIDGE DIGITAL DIVIDE) */}
      <section className="w-full bg-[#001c41] text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(2,114,68,0.08),transparent_50%)]" />
        
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 relative z-10">
          <div className="text-center flex flex-col items-center gap-4 mb-16">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold text-emerald-300 uppercase tracking-widest bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-full">
              <Info className="h-3.5 w-3.5" /> Our Mission
            </div>
            <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white max-w-2xl">
              Why Was This Initiative Started?
            </h2>
            <p className="text-slate-400 text-xs md:text-sm font-semibold max-w-xl">
              Building a custom digital grid where local business operators don\'t get left behind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-slate-900/60 border border-slate-800/80 p-8 rounded-3xl flex flex-col gap-4 text-left hover:border-emerald-500/30 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
              <div className="h-11 w-11 rounded-2xl bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-900/60 shadow-inner">
                <Store className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-sm md:text-base text-slate-100">Digitizing Micro-Commerce</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                Udumalpet\'s agricultural merchants, coir units, coconut traders, and neighborhood retailers often lack website builders or expensive technical resources. We provide them a robust digital presence instantly and for free.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-900/60 border border-slate-800/80 p-8 rounded-3xl flex flex-col gap-4 text-left hover:border-emerald-500/30 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
              <div className="h-11 w-11 rounded-2xl bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-900/60 shadow-inner">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-sm md:text-base text-slate-100">Direct Commission-Free Commerce</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                Unlike national aggregators that charge merchants booking percentages or listing subscriptions, our platform guarantees direct buyer-to-seller interactions. Customers can tap to dial or message on WhatsApp instantly.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-900/60 border border-slate-800/80 p-8 rounded-3xl flex flex-col gap-4 text-left hover:border-emerald-500/30 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
              <div className="h-11 w-11 rounded-2xl bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-900/60 shadow-inner">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-sm md:text-base text-slate-100">Trust-First Verification</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                Spam profiles, fake numbers, and out-of-town listings pollute consumer directories. Our admins manually cross-examine business locations and verify phone numbers before granting the "Verified" verification badge.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. BENEFITS SECTION */}
      <section className="max-w-[1440px] w-full px-4 md:px-8 py-20 text-left">
        <div className="flex flex-col items-center text-center gap-4 mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-extrabold text-[#027244] uppercase tracking-widest bg-emerald-50 border border-emerald-150 px-3 py-1 rounded-full">
            <Check className="h-3.5 w-3.5" /> Platform Advantages
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-[#001c41] tracking-tight">
            How It Benefits Everyone
          </h2>
          <p className="text-slate-550 text-xs md:text-sm font-semibold max-w-xl">
            A three-way ecosystem benefiting local merchants, visitors, and the wider community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card: For Local Merchants */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6.5 shadow-xs flex flex-col justify-between">
            <div className="flex flex-col gap-4.5">
              <div className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider self-start">
                For Local Merchants
              </div>
              <h3 className="text-base font-extrabold text-[#001c41] leading-tight">Grow Your Local Customer Base</h3>
              <ul className="flex flex-col gap-3 text-xs text-slate-500 font-semibold leading-normal">
                <li className="flex items-start gap-2">
                  <span className="text-[#027244] shrink-0 font-bold">✓</span>
                  <span><strong>Verified Badge:</strong> Higher brand trust.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#027244] shrink-0 font-bold">✓</span>
                  <span><strong>Zero Fees:</strong> Leads directly through phone calls and WhatsApp.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#027244] shrink-0 font-bold">✓</span>
                  <span><strong>Promotional Events:</strong> Promote store launches or seasonal discounts.</span>
                </li>
              </ul>
            </div>
            <Link to="/add-business" className="flex items-center justify-between text-xs font-black text-[#027244] hover:text-[#005934] transition-colors mt-6 pt-4 border-t border-slate-100">
              List Business Now <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Card: For Visitors & Tourists */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6.5 shadow-xs flex flex-col justify-between">
            <div className="flex flex-col gap-4.5">
              <div className="px-3.5 py-1.5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-black uppercase tracking-wider self-start">
                For Visitors & Tourists
              </div>
              <h3 className="text-base font-extrabold text-[#001c41] leading-tight">Authentic Local Insights</h3>
              <ul className="flex flex-col gap-3 text-xs text-slate-500 font-semibold leading-normal">
                <li className="flex items-start gap-2">
                  <span className="text-[#027244] shrink-0 font-bold">✓</span>
                  <span><strong>Trusted Data:</strong> Real locations verified by local admins.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#027244] shrink-0 font-bold">✓</span>
                  <span><strong>Direct Connect:</strong> Skip commissions; book resorts and taxis directly.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#027244] shrink-0 font-bold">✓</span>
                  <span><strong>Explore Attractions:</strong> Combine tour plans with localized directory lists.</span>
                </li>
              </ul>
            </div>
            <Link to="/businesses" className="flex items-center justify-between text-xs font-black text-[#027244] hover:text-[#005934] transition-colors mt-6 pt-4 border-t border-slate-100">
              Browse Directory <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Card: For the Community */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6.5 shadow-xs flex flex-col justify-between">
            <div className="flex flex-col gap-4.5">
              <div className="px-3.5 py-1.5 rounded-full bg-slate-50 text-slate-700 text-[10px] font-black uppercase tracking-wider self-start">
                For the Community
              </div>
              <h3 className="text-base font-extrabold text-[#001c41] leading-tight">Fostering Local Circulation</h3>
              <ul className="flex flex-col gap-3 text-xs text-slate-500 font-semibold leading-normal">
                <li className="flex items-start gap-2">
                  <span className="text-slate-600 shrink-0 font-bold">✓</span>
                  <span><strong>Keep Money Local:</strong> Direct trade preserves economic value within our community.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-600 shrink-0 font-bold">✓</span>
                  <span><strong>Community Calendar:</strong> Events directory keeping residents linked to festivals.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-600 shrink-0 font-bold">✓</span>
                  <span><strong>Shared Knowledge:</strong> General blogs highlighting lifestyle and regional narratives.</span>
                </li>
              </ul>
            </div>
            <Link to="/events" className="flex items-center justify-between text-xs font-black text-slate-700 hover:text-slate-900 transition-colors mt-6 pt-4 border-t border-slate-100">
              Explore Events <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

        </div>
      </section>

      {/* 5. THE BUSINESS TOUR CONCEPT SECTION */}
      <section className="w-full bg-slate-50 py-20 border-y border-slate-200/80 text-left">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="flex flex-col items-start gap-4 mb-16">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold text-[#027244] uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
              <Sparkles className="h-3.5 w-3.5" /> Guided Ecosystem
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-[#001c41] tracking-tight leading-tight">
              Understanding the "Business Tour" Concept
            </h2>
            <p className="text-slate-550 text-xs md:text-sm font-semibold max-w-2xl">
              "Business Tour" isn\'t just a name—it is a digital journey mapping the real-world commercial layers of Udumalpet.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="bg-white border border-slate-200/80 p-8 rounded-3xl flex flex-col gap-4 relative shadow-2xs">
              <span className="absolute right-8 top-6 font-black text-5xl text-slate-100 select-none">01</span>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-[#027244] flex items-center justify-center border border-emerald-100/50">
                <Store className="h-4.5 w-4.5" />
              </div>
              <h4 className="font-extrabold text-[#001c41] text-sm md:text-base mt-2">Agro-Industrial Grid</h4>
              <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                Explore the backbone of Udumalpet. Discover coir mills, coconut farms, wind farms, engineering workshops, and textile manufacturing centers mapping our industrial strength.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-slate-200/80 p-8 rounded-3xl flex flex-col gap-4 relative shadow-2xs">
              <span className="absolute right-8 top-6 font-black text-5xl text-slate-100 select-none">02</span>
              <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100/50">
                <Calendar className="h-4.5 w-4.5" />
              </div>
              <h4 className="font-extrabold text-[#001c41] text-sm md:text-base mt-2">Retail & Dining Tour</h4>
              <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                Navigate the consumer side. Find apparel outlets, grocery markets, jewelers, hotels, pure-veg restaurants, electrical dealers, and medical services mapping our bustling town streets.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-slate-200/80 p-8 rounded-3xl flex flex-col gap-4 relative shadow-2xs">
              <span className="absolute right-8 top-6 font-black text-5xl text-slate-100 select-none">03</span>
              <div className="h-10 w-10 rounded-xl bg-lime-50 text-lime-650 flex items-center justify-center border border-lime-100/50">
                <Activity className="h-4.5 w-4.5" />
              </div>
              <h4 className="font-extrabold text-[#001c41] text-sm md:text-base mt-2">Eco-Tourism & Events</h4>
              <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                Enjoy local leisure. Find resort bookings, tour guides, taxi bookings, and live listings for events like coding meetups, sports tournaments, and temple festivals around Thirumoorthy and Amaravathi.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION (CTA) SECTION */}
      <section className="max-w-[1440px] w-full px-4 md:px-8 py-16">
        <div className="bg-gradient-to-br from-[#001c41] to-[#001128] text-white rounded-3xl p-8 md:p-12 text-left flex flex-col md:flex-row justify-between items-center gap-10 shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(2,114,68,0.1),transparent_50%)]" />
          
          <div className="flex flex-col gap-3.5 relative z-10 max-w-xl">
            <span className="text-[10px] font-extrabold text-emerald-450 uppercase tracking-widest leading-none">Register Today</span>
            <h2 className="text-xl md:text-3xl font-extrabold tracking-tight">Put Your Business on the Digital Map</h2>
            <p className="text-slate-400 text-xs md:text-sm leading-relaxed font-semibold">
              It takes less than 5 minutes to submit your details. Verified badge reviews are processed daily by local coordinators.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3.5 shrink-0 w-full sm:w-auto relative z-10">
            <Link to="/add-business" className="py-3 px-6 bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs rounded-xl shadow-md transition-all text-center">
              Register Business
            </Link>
            <Link to="/events?list=true" className="py-3 px-6 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all text-center border border-slate-700">
              List Local Event
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
