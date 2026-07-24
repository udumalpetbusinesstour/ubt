import { Link } from 'react-router-dom';
import { Facebook, Instagram, Phone, Mail, Clock, MapPin, Gift } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-[#001c41] text-slate-300 pt-16 pb-8 border-t border-slate-800 z-10 font-sans">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

        {/* Column 1: Logo and Description */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center select-none group py-1">
            <img src="/logo-dark.png" alt="Udumalpet Business Tour" className="h-13 w-auto object-contain" />
          </div>
          <p className="text-xs text-slate-450 leading-relaxed max-w-sm font-semibold">
            A trusted local platform to discover, connect and grow with verified businesses in and around Udumalpet.
          </p>
          <div className="flex items-center gap-3 mt-1">
            <a href="https://www.facebook.com/profile.php?fb_profile_edit_entry_point=%7B%22click_point%22%3A%22edit_profile_button%22%2C%22feature%22%3A%22profile_header%22%7D&id=61590472206771&sk=about" target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-full border border-slate-700 hover:border-emerald-500 flex items-center justify-center hover:bg-[#027244] hover:text-white transition-all text-slate-400">
              <Facebook className="h-4 w-4" />
            </a>
            <a href="https://www.instagram.com/udumalpet.co.in/" target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-full border border-slate-700 hover:border-emerald-500 flex items-center justify-center hover:bg-[#027244] hover:text-white transition-all text-slate-400">
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div className="flex flex-col gap-4">
          <h4 className="text-white font-bold text-sm uppercase tracking-wider">Quick Links</h4>
          <ul className="flex flex-col gap-2.5 text-xs font-semibold text-slate-400">
            <li><Link to="/" className="hover:text-emerald-500 transition-colors">Home</Link></li>
            <li><Link to="/about" className="hover:text-emerald-500 transition-colors">About Us</Link></li>
            <li><Link to="/businesses" className="hover:text-emerald-500 transition-colors">Businesses</Link></li>
            <li><Link to="/categories" className="hover:text-emerald-500 transition-colors">Categories</Link></li>
            <li><Link to="/events" className="hover:text-emerald-500 transition-colors">Events</Link></li>
            <li><Link to="/blogs" className="hover:text-emerald-500 transition-colors">Blog</Link></li>
            <li><Link to="/businesses?focus=contact" className="hover:text-emerald-500 transition-colors">Contact Us</Link></li>
            <li><Link to="/blood-donors" className="hover:text-rose-400 text-rose-500 font-extrabold transition-colors flex items-center gap-1">🩸 Blood Donors at Udumalpet</Link></li>
          </ul>
        </div>

        {/* Column 3: For Businesses */}
        <div className="flex flex-col gap-4">
          <h4 className="text-white font-bold text-sm uppercase tracking-wider">For Businesses</h4>
          <ul className="flex flex-col gap-2.5 text-xs font-semibold text-slate-400">
            <li><Link to="/add-business" className="hover:text-emerald-500 transition-colors">List Your Business</Link></li>
            <li><Link to="/login?from=business" className="hover:text-emerald-500 transition-colors">Business Login</Link></li>
            <li><Link to="/choose-plan" className="hover:text-emerald-500 transition-colors">Subscription Plans</Link></li>
            <li>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-referral-modal'))}
                className="hover:text-emerald-500 transition-colors animate-shake cursor-pointer text-left inline-flex items-center gap-1.5 text-emerald-400 font-extrabold"
              >
                <Gift className="h-3.5 w-3.5 text-emerald-450 shrink-0" /> Refer other business
              </button>
            </li>
            <li><Link to="/#how-it-works" className="hover:text-emerald-500 transition-colors">How It Works</Link></li>
             <li><Link to="/business-guidelines" className="hover:text-emerald-500 transition-colors">Business Guidelines</Link></li>
          </ul>
        </div>

        {/* Column 4: Support */}
        <div className="flex flex-col gap-4">
          <h4 className="text-white font-bold text-sm uppercase tracking-wider">Support</h4>
          <ul className="flex flex-col gap-2.5 text-xs font-semibold text-slate-400">
            <li><Link to="/businesses?focus=contact" className="hover:text-emerald-500 transition-colors">Help Center</Link></li>
            <li><Link to="/#faq" className="hover:text-emerald-500 transition-colors">FAQs</Link></li>
            <li><Link to="/terms-of-service" className="hover:text-emerald-500 transition-colors">Terms & Conditions</Link></li>
            <li><Link to="/privacy-policy" className="hover:text-emerald-500 transition-colors">Privacy Policy</Link></li>
            <li><Link to="/refund-policy" className="hover:text-emerald-500 transition-colors">Refund Policy</Link></li>
          </ul>
        </div>

        {/* Column 5: Contact Us */}
        <div className="flex flex-col gap-4">
          <h4 className="text-white font-bold text-sm uppercase tracking-wider">Contact Us</h4>
          <ul className="flex flex-col gap-3.5 text-xs font-semibold text-slate-400">
            <li className="flex items-start gap-2.5">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Udumalpet, Tamil Nadu - 642126')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2.5 hover:text-emerald-500 transition-colors cursor-pointer group"
                title="View on Google Maps"
              >
                <MapPin className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5 group-hover:text-emerald-400" />
                <span className="leading-relaxed group-hover:underline">Udumalpet, Tamil Nadu - 642126</span>
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5 text-emerald-500 shrink-0">
                <path d="M12.012 2C6.485 2 2 6.485 2 12.012c0 1.767.46 3.427 1.267 4.887L2 22l5.244-1.282A9.954 9.954 0 0 0 12.012 22c5.527 0 10.012-4.485 10.012-10.012S17.539 2 12.012 2zm0 1.844c4.507 0 8.168 3.661 8.168 8.168s-3.661 8.168-8.168 8.168c-1.637 0-3.155-.483-4.433-1.314l-.317-.207-3.078.753.766-2.997-.227-.358a8.115 8.115 0 0 1-1.314-4.433c0-4.507 3.661-8.168 8.168-8.168zm-3.486 3.19c-.191 0-.398.043-.565.177-.167.134-.64.624-.64 1.523 0 .899.654 1.767.747 1.888.093.12 1.258 1.996 3.109 2.709.44.17.785.272 1.054.353.443.138.847.118 1.164.07.354-.053 1.09-.446 1.243-.854.153-.408.153-.76.108-.832-.046-.073-.167-.114-.354-.207-.187-.093-1.09-.538-1.258-.6-.167-.06-.29-.093-.413.093-.122.187-.474.6-.581.72-.107.12-.214.134-.401.04-.187-.093-.79-.292-1.503-.927-.554-.495-.929-1.107-1.037-1.293-.108-.187-.012-.288.08-.38l.267-.311c.093-.108.12-.187.18-.311.06-.12.03-.227-.015-.32-.045-.093-.413-1.002-.565-1.371-.148-.358-.3-.31-.413-.316-.108-.005-.231-.005-.353-.005z" />
              </svg>
              <a href="https://wa.me/918925728260" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-500 transition-colors">+91 89257 28260</a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
              <a href="mailto:info@udumalpet.business" className="hover:text-emerald-500 transition-colors break-all">info@udumalpet.business</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 mt-12 pt-6 border-t border-slate-800/80 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-semibold">
        <span>© 2025 Udumalpet Business Tour. All rights reserved.</span>
        <span>Made with <span className="text-red-500">❤️</span> for Udumalpet</span>
      </div>
    </footer>
  );
}
