import { useState, useEffect } from 'react';
import { 
  Heart, MapPin, Phone, MessageSquare, AlertCircle, CheckCircle, RefreshCw, Sparkles, Filter, ShieldCheck, HeartHandshake, UserPlus
} from 'lucide-react';

const STANDARD_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const LOCAL_MOCK_DONORS = [
  { _id: 'local_1', name: 'Ramesh Kumar', bloodGroup: 'O+', location: 'Gandhi Nagar', contactNum: '+91 94430 11111', createdAt: new Date() },
  { _id: 'local_2', name: 'Priya Dharshini', bloodGroup: 'A+', location: 'Palani Road', contactNum: '+91 94430 22222', createdAt: new Date() },
  { _id: 'local_3', name: 'Suresh Ananth', bloodGroup: 'B+', location: 'Dharapuram Road', contactNum: '+91 94430 33333', createdAt: new Date() },
  { _id: 'local_4', name: 'Mano Ranjith', bloodGroup: 'AB+', location: 'Eripalayam', contactNum: '+91 94430 44444', createdAt: new Date() },
  { _id: 'local_5', name: 'Kousalya Devi', bloodGroup: 'O-', location: 'Udumalpet Town', contactNum: '+91 94430 55555', createdAt: new Date() },
  { _id: 'local_6', name: 'Deepak Raj', bloodGroup: 'A-', location: 'Pollachi Road', contactNum: '+91 94430 66666', createdAt: new Date() }
];

export default function BloodDonorsPage() {
  const [donors, setDonors] = useState([]);
  const [filteredDonors, setFilteredDonors] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regLocation, setRegLocation] = useState('');
  const [regBloodGroup, setRegBloodGroup] = useState('O+');
  const [customBloodGroupName, setCustomBloodGroupName] = useState('');
  const [regContact, setRegContact] = useState('');
  
  const [customGroups, setCustomGroups] = useState([]);
  
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Fetch Donors
  const fetchDonors = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/blood-donors');
      const data = await res.json();
      if (data.success && data.data) {
        setDonors(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch blood donors.');
      }
    } catch (err) {
      console.warn('Backend server offline or error. Using local mock donors fallback.', err);
      // Initialize with local mock donors if DB request fails
      const stored = localStorage.getItem('ubt_local_donors');
      if (stored) {
        try {
          setDonors(JSON.parse(stored));
        } catch (e) {
          setDonors(LOCAL_MOCK_DONORS);
        }
      } else {
        setDonors(LOCAL_MOCK_DONORS);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, []);

  // Extract custom groups dynamically from fetched donors
  useEffect(() => {
    const uniqueCustom = Array.from(
      new Set(
        donors
          .map(d => (d.bloodGroup || '').toUpperCase().trim())
          .filter(g => g && !STANDARD_BLOOD_GROUPS.includes(g))
      )
    );
    setCustomGroups(uniqueCustom);
  }, [donors]);

  // Combined lists
  const filterGroups = ['All', ...STANDARD_BLOOD_GROUPS, ...customGroups];
  const dropdownGroups = [...STANDARD_BLOOD_GROUPS, ...customGroups, 'Others'];

  // Filter Donors whenever donors list or active filter changes
  useEffect(() => {
    if (activeFilter === 'All') {
      setFilteredDonors(donors);
    } else {
      setFilteredDonors(donors.filter(d => d.bloodGroup.toUpperCase() === activeFilter.toUpperCase()));
    }
  }, [donors, activeFilter]);

  // Handle Form Submit
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regName.trim() || !regLocation.trim() || !regContact.trim()) {
      setSubmitError('Please fill in all the fields.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    const selectedGroup = regBloodGroup === 'Others' ? customBloodGroupName.trim() : regBloodGroup;
    if (!selectedGroup) {
      setSubmitError('Please specify your custom blood group.');
      setSubmitting(false);
      return;
    }

    const payload = {
      name: regName.trim(),
      location: regLocation.trim(),
      bloodGroup: selectedGroup.toUpperCase(),
      contactNum: regContact.trim()
    };

    try {
      const res = await fetch('http://localhost:5000/api/blood-donors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSubmitSuccess('You have registered successfully! Thank you for your generosity.');
        // Prepend to current list
        setDonors(prev => [data.data, ...prev]);
        // Reset inputs
        setRegName('');
        setRegLocation('');
        setRegContact('');
        setRegBloodGroup('O+');
        setCustomBloodGroupName('');
      } else {
        throw new Error(data.message || 'Failed to register donor.');
      }
    } catch (err) {
      console.warn('Backend offline. Simulating local registration fallback.', err);
      // Simulate registration locally in offline state
      const localNew = {
        _id: 'local_reg_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
        ...payload,
        createdAt: new Date()
      };
      
      const updatedList = [localNew, ...donors];
      setDonors(updatedList);
      localStorage.setItem('ubt_local_donors', JSON.stringify(updatedList));

      setSubmitSuccess('Registered successfully (Offline Mode)! Your details are updated locally.');
      // Reset inputs
      setRegName('');
      setRegLocation('');
      setRegContact('');
      setRegBloodGroup('O+');
      setCustomBloodGroupName('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] pb-24 font-sans text-left">
      
      {/* 1. Header Banner */}
      <div className="w-full bg-gradient-to-r from-red-800 via-rose-900 to-[#001c41] text-white py-16 px-4 md:px-8 shadow-md relative overflow-hidden select-none">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="flex flex-col gap-3.5 max-w-xl text-left">
            <span className="px-3 py-1 bg-white/10 text-rose-350 border border-rose-500/20 text-[10px] font-black uppercase tracking-widest rounded-full w-fit flex items-center gap-1.5 backdrop-blur-xs select-none">
              <Sparkles className="h-3 w-3 animate-pulse" /> Life-Saving Initiative
            </span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              Blood Donors <span className="text-rose-400">Directory</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-300 font-semibold leading-relaxed">
              Find life-saving blood donors instantly in and around Udumalpet. Direct contact information. Register yourself as a volunteer donor to help save a life in emergencies.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Main Grid Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Register Form (lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white border border-slate-200/80 shadow-md rounded-[28px] p-6 flex flex-col gap-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-rose-100/30 to-transparent rounded-bl-full pointer-events-none" />
            
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserPlus className="h-5 w-5 text-rose-500" />
              <h3 className="font-extrabold text-sm text-[#001c41] uppercase tracking-wide">Register as Donor</h3>
            </div>

            {submitSuccess && (
              <div className="p-3 bg-emerald-50 text-[#027244] border border-emerald-200/20 text-xs font-semibold rounded-xl text-center flex items-center gap-2 animate-fadeIn">
                <CheckCircle className="h-4.5 w-4.5 shrink-0" />
                <span>{submitSuccess}</span>
              </div>
            )}

            {submitError && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200/20 text-xs font-semibold rounded-xl text-center flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Anand Kumar"
                  disabled={submitting}
                  required
                  className="w-full border border-slate-200/70 p-3 px-4 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-rose-500 bg-slate-50/20"
                />
              </div>

              {/* Locality */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Locality / Location</label>
                <input 
                  type="text" 
                  value={regLocation}
                  onChange={(e) => setRegLocation(e.target.value)}
                  placeholder="e.g. Gandhi Nagar, Udumalpet"
                  disabled={submitting}
                  required
                  className="w-full border border-slate-200/70 p-3 px-4 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-rose-500 bg-slate-50/20"
                />
              </div>

              {/* Blood Group Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Blood Group</label>
                <select 
                  value={regBloodGroup}
                  onChange={(e) => setRegBloodGroup(e.target.value)}
                  disabled={submitting}
                  className="w-full border border-slate-200/70 p-3 px-4 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-rose-500 bg-slate-50/20 cursor-pointer"
                >
                  {dropdownGroups.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Custom Blood Group Text Input (if 'Other' selected) */}
              {regBloodGroup === 'Others' && (
                <div className="flex flex-col gap-1.5 animate-fadeIn">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Specify Blood Group</label>
                  <input 
                    type="text" 
                    value={customBloodGroupName}
                    onChange={(e) => setCustomBloodGroupName(e.target.value)}
                    placeholder="e.g. Bombay, HH, Rh-null"
                    disabled={submitting}
                    required
                    className="w-full border border-slate-200/70 p-3 px-4 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-rose-500 bg-slate-50/20"
                  />
                </div>
              )}

              {/* Contact Number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Contact Number</label>
                <input 
                  type="text" 
                  value={regContact}
                  onChange={(e) => setRegContact(e.target.value)}
                  placeholder="e.g. +91 94430 12345"
                  disabled={submitting}
                  required
                  className="w-full border border-slate-200/70 p-3 px-4 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-rose-500 bg-slate-50/20"
                />
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-6 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-colors flex items-center justify-center gap-1.5 mt-2"
              >
                {submitting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Heart className="h-4 w-4 shrink-0 fill-current" />
                    <span>Register to Save Lives</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Core Info Guideline */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex items-start gap-3">
            <HeartHandshake className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex flex-col text-xs text-slate-500 font-semibold leading-relaxed">
              <span className="text-slate-800 font-extrabold">Privacy & Safety:</span>
              Your details will be publicly listed on this page so that patients in local hospitals (Udumalpet Government Hospital, private clinics) can contact you directly in emergencies. Only register if you are willing to help and receive calls.
            </div>
          </div>
        </div>

        {/* Right Column: Filters and Directory List (lg:col-span-8) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Blood Group Filters */}
          <div className="bg-white border border-slate-200/80 shadow-sm rounded-[24px] p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <Filter className="h-4 w-4" /> Filter by Blood Group
            </div>
            
            <div className="flex flex-wrap gap-2.5">
              {filterGroups.map((group) => {
                const isActive = activeFilter === group;
                const matchCount = group === 'All' 
                  ? donors.length 
                  : donors.filter(d => d.bloodGroup.toUpperCase() === group.toUpperCase()).length;

                return (
                  <button
                    key={group}
                    onClick={() => setActiveFilter(group)}
                    className={`py-1.5 px-4.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                      isActive 
                        ? 'bg-rose-500 border-rose-500 text-white shadow-md' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{group}</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full select-none ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>{matchCount}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Directory Listings */}
          {loading ? (
            <div className="py-24 bg-white border border-slate-200/60 rounded-[28px] flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="h-8 w-8 text-rose-500 animate-spin" />
              <span className="text-xs font-bold">Retrieving donors directory...</span>
            </div>
          ) : (
            <div className="flex flex-col gap-4.5">
              <div className="flex justify-between items-center px-2">
                <span className="text-xs text-slate-400 font-extrabold uppercase tracking-wide">
                  Showing {filteredDonors.length} {activeFilter !== 'All' ? `${activeFilter} ` : ''}Donors Found
                </span>
                <button 
                  onClick={fetchDonors} 
                  className="text-[10.5px] font-bold text-rose-500 hover:text-rose-700 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" /> Refresh List
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDonors.map((donor) => (
                  <div 
                    key={donor._id}
                    className="bg-white border border-slate-200/80 hover:border-slate-350 hover:shadow-md rounded-[24px] p-5 shadow-2xs transition-all flex justify-between items-center gap-4 group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      
                      {/* Blood Group Badge */}
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-red-650 flex items-center justify-center shrink-0 shadow-sm border border-rose-400/25">
                        <span className="text-white text-xs font-black select-none tracking-tight">{donor.bloodGroup}</span>
                      </div>

                      <div className="flex flex-col gap-1 min-w-0 text-left">
                        <h4 className="font-extrabold text-[#001c41] text-[13.5px] truncate leading-tight flex items-center gap-1.5">
                          {donor.name}
                          {donor.createdAt && (new Date(donor.createdAt).getTime() > Date.now() - 3 * 60 * 60 * 1000) && (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-250 text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-2xs select-none">New</span>
                          )}
                        </h4>
                        
                        <div className="flex items-center gap-1 text-[11px] text-slate-455 font-semibold leading-none">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate">{donor.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Call Button */}
                      <a
                        href={`tel:${donor.contactNum}`}
                        title={`Call ${donor.name}`}
                        className="h-8.5 w-8.5 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center hover:border-rose-300 text-slate-500 hover:text-rose-600 transition-all cursor-pointer shadow-2xs"
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                      {/* WhatsApp Button */}
                      <a
                        href={`https://wa.me/${donor.contactNum.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`WhatsApp ${donor.name}`}
                        className="h-8.5 w-8.5 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center hover:border-emerald-300 text-slate-500 hover:text-emerald-600 transition-all cursor-pointer shadow-2xs"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </a>
                    </div>

                  </div>
                ))}
              </div>

              {filteredDonors.length === 0 && (
                <div className="bg-white border border-slate-200/60 rounded-[28px] p-20 text-center text-slate-400 flex flex-col items-center gap-3 w-full shadow-2xs">
                  <Heart className="h-10 w-10 text-slate-250 shrink-0" />
                  <span className="text-sm font-bold text-slate-800 font-sans">No Donors Found</span>
                  <p className="text-xs text-slate-450 font-semibold leading-relaxed max-w-xs">
                    There are currently no registered donors for blood group <span className="text-rose-500 font-extrabold">{activeFilter}</span>. Check other groups or register yourself to help.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
