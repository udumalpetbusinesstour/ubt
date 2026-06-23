import { useState, useEffect } from 'react';
import { 
  Heart, MapPin, Phone, MessageSquare, AlertCircle, CheckCircle, RefreshCw, Search, Trash2, Edit3, Plus, X, UserPlus, Filter
} from 'lucide-react';

const STANDARD_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function BloodDonorsTab() {
  const [donors, setDonors] = useState([]);
  const [filteredDonors, setFilteredDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Edit / Add Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [customBloodGroupName, setCustomBloodGroupName] = useState('');
  const [contactNum, setContactNum] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
      console.warn('Backend offline or error. Using local storage blood donors.', err);
      const stored = localStorage.getItem('ubt_local_donors');
      if (stored) {
        try {
          setDonors(JSON.parse(stored));
        } catch (e) {
          setDonors([]);
        }
      } else {
        // Fallback to default mock donors if local storage is also empty
        const defaultMocks = [
          { _id: 'local_1', name: 'Ramesh Kumar', bloodGroup: 'O+', location: 'Gandhi Nagar', contactNum: '+91 94430 11111', createdAt: new Date() },
          { _id: 'local_2', name: 'Priya Dharshini', bloodGroup: 'A+', location: 'Palani Road', contactNum: '+91 94430 22222', createdAt: new Date() },
          { _id: 'local_3', name: 'Suresh Ananth', bloodGroup: 'B+', location: 'Dharapuram Road', contactNum: '+91 94430 33333', createdAt: new Date() },
          { _id: 'local_4', name: 'Mano Ranjith', bloodGroup: 'AB+', location: 'Eripalayam', contactNum: '+91 94430 44444', createdAt: new Date() },
          { _id: 'local_5', name: 'Kousalya Devi', bloodGroup: 'O-', location: 'Udumalpet Town', contactNum: '+91 94430 55555', createdAt: new Date() },
          { _id: 'local_6', name: 'Deepak Raj', bloodGroup: 'A-', location: 'Pollachi Road', contactNum: '+91 94430 66666', createdAt: new Date() }
        ];
        setDonors(defaultMocks);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, []);

  useEffect(() => {
    if (!showModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  // Compute unique blood groups dynamically
  const uniqueCustom = Array.from(
    new Set(
      donors
        .map(d => (d.bloodGroup || '').toUpperCase().trim())
        .filter(g => g && !STANDARD_BLOOD_GROUPS.includes(g))
    )
  );

  const filterGroups = ['All', ...STANDARD_BLOOD_GROUPS, ...uniqueCustom];
  const dropdownGroups = [...STANDARD_BLOOD_GROUPS, ...uniqueCustom, 'Others'];

  // Handle Search and Filter logic
  useEffect(() => {
    let result = donors;

    if (activeFilter !== 'All') {
      result = result.filter(d => d.bloodGroup.toUpperCase() === activeFilter.toUpperCase());
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => 
        (d.name || '').toLowerCase().includes(q) || 
        (d.location || '').toLowerCase().includes(q) || 
        (d.contactNum || '').toLowerCase().includes(q)
      );
    }

    setFilteredDonors(result);
  }, [donors, activeFilter, searchQuery]);

  // Open modal in Add mode
  const handleOpenAdd = () => {
    setModalMode('add');
    setEditingId(null);
    setName('');
    setLocation('');
    setBloodGroup('O+');
    setCustomBloodGroupName('');
    setContactNum('');
    setModalError('');
    setShowModal(true);
  };

  // Open modal in Edit mode
  const handleOpenEdit = (donor) => {
    setModalMode('edit');
    setEditingId(donor._id);
    setName(donor.name);
    setLocation(donor.location);
    setContactNum(donor.contactNum);
    setModalError('');

    const bgUpper = donor.bloodGroup.toUpperCase();
    if (STANDARD_BLOOD_GROUPS.includes(bgUpper) || uniqueCustom.includes(bgUpper)) {
      setBloodGroup(bgUpper);
      setCustomBloodGroupName('');
    } else {
      setBloodGroup('Others');
      setCustomBloodGroupName(bgUpper);
    }
    setShowModal(true);
  };

  // Handle Add/Edit Form Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !location.trim() || !contactNum.trim()) {
      setModalError('Please fill in all standard fields.');
      return;
    }

    const selectedGroup = bloodGroup === 'Others' ? customBloodGroupName.trim() : bloodGroup;
    if (!selectedGroup) {
      setModalError('Please specify the custom blood group.');
      return;
    }

    setSubmitting(true);
    setModalError('');

    const payload = {
      name: name.trim(),
      location: location.trim(),
      bloodGroup: selectedGroup.toUpperCase(),
      contactNum: contactNum.trim()
    };

    const token = localStorage.getItem('ubt_token');
    
    try {
      let res;
      if (modalMode === 'add') {
        res = await fetch('http://localhost:5000/api/blood-donors', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`http://localhost:5000/api/blood-donors/${editingId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (data.success && data.data) {
        if (modalMode === 'add') {
          setDonors(prev => [data.data, ...prev]);
          triggerFeedbackAlert('Donor registered successfully!');
        } else {
          setDonors(prev => prev.map(d => d._id === editingId ? data.data : d));
          triggerFeedbackAlert('Donor details updated successfully!');
        }
        setShowModal(false);
      } else {
        throw new Error(data.message || 'Operation failed.');
      }
    } catch (err) {
      console.warn('API error during moderation. Applying local fallback.', err);
      // Fallback local updates
      if (modalMode === 'add') {
        const localNew = {
          _id: 'local_reg_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
          ...payload,
          createdAt: new Date()
        };
        const updated = [localNew, ...donors];
        setDonors(updated);
        localStorage.setItem('ubt_local_donors', JSON.stringify(updated));
        triggerFeedbackAlert('Donor registered successfully (Offline Mode)!');
      } else {
        const updated = donors.map(d => d._id === editingId ? { ...d, ...payload } : d);
        setDonors(updated);
        localStorage.setItem('ubt_local_donors', JSON.stringify(updated));
        triggerFeedbackAlert('Donor updated successfully (Offline Mode)!');
      }
      setShowModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Donor
  const handleDelete = async (donorId) => {
    if (!window.confirm('Are you sure you want to permanently remove this donor from the directory?')) return;
    
    const token = localStorage.getItem('ubt_token');
    try {
      const res = await fetch(`http://localhost:5000/api/blood-donors/${donorId}`, {
        method: 'DELETE',
        headers: { 
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setDonors(prev => prev.filter(d => d._id !== donorId));
        triggerFeedbackAlert('Donor removed successfully!');
      } else {
        throw new Error(data.message || 'Deletion failed.');
      }
    } catch (err) {
      console.warn('API error during delete. Applying local fallback.', err);
      const updated = donors.filter(d => d._id !== donorId);
      setDonors(updated);
      localStorage.setItem('ubt_local_donors', JSON.stringify(updated));
      triggerFeedbackAlert('Donor removed successfully (Offline Mode)!');
    }
  };

  const triggerFeedbackAlert = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="flex flex-col gap-6 text-left animate-fadeIn">
      
      {/* 1. Header Banner Console */}
      <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col">
          <h3 className="font-extrabold text-[#001c41] text-base md:text-lg tracking-tight font-sans">Blood Donors Vetting Console</h3>
          <span className="text-[11px] text-slate-450 font-semibold mt-1">Audit blood donors registrations, edit information, add new records manually, and manage listing statuses</span>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-2.5 px-4.5 rounded-2xl shadow-md hover:shadow-rose-700/10 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer font-sans"
        >
          <UserPlus className="h-4.5 w-4.5 shrink-0" /> Add Donor Record
        </button>
      </div>

      {/* Feedbacks */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 text-[#027244] border border-emerald-250/20 text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-2 animate-fadeIn shadow-2xs font-sans">
          <CheckCircle className="h-4.5 w-4.5 shrink-0 animate-bounce" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2. Controls Toolbar */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 flex flex-col md:flex-row gap-4.5 justify-between items-start md:items-center font-sans">
        
        {/* Search */}
        <div className="w-full md:max-w-md border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2 bg-slate-50/50">
          <Search className="h-4.5 w-4.5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by donor name, location, or contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs font-semibold focus:outline-none placeholder-slate-400 text-slate-700"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] font-black uppercase text-slate-400 mr-1 flex items-center gap-1"><Filter className="h-3 w-3" /> Filters:</span>
          {filterGroups.map(g => (
            <button
              key={g}
              onClick={() => setActiveFilter(g)}
              className={`py-1 px-3.5 text-[10.5px] font-bold rounded-lg cursor-pointer transition-all border ${
                activeFilter === g
                  ? 'bg-rose-50 border-rose-200 text-rose-600 font-extrabold shadow-3xs'
                  : 'bg-white border-slate-200 text-slate-550 hover:bg-slate-50'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Listings Grid */}
      {loading ? (
        <div className="py-24 bg-white border border-slate-200 shadow-xs rounded-[28px] flex flex-col items-center justify-center gap-3 text-slate-400">
          <RefreshCw className="h-8 w-8 text-rose-500 animate-spin" />
          <span className="text-xs font-bold font-sans">Loading donors registry...</span>
        </div>
      ) : (
        <div className="flex flex-col gap-4 font-sans">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDonors.map(donor => (
              <div 
                key={donor._id}
                className="bg-white border border-slate-200 hover:border-slate-400 hover:shadow-md rounded-3xl p-5 shadow-3xs transition-all flex flex-col justify-between gap-4.5 text-left group"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Badge */}
                    <div className="h-10.5 w-10.5 rounded-xl bg-gradient-to-tr from-rose-500 to-red-650 flex items-center justify-center shrink-0 border border-rose-400/25">
                      <span className="text-white text-[11px] font-black select-none tracking-tight">{donor.bloodGroup}</span>
                    </div>
                    
                    {/* Info */}
                    <div className="flex flex-col min-w-0">
                      <h4 className="font-extrabold text-[#001c41] text-sm truncate leading-snug group-hover:text-rose-600 transition-colors">{donor.name}</h4>
                      <span className="text-[10px] text-slate-400 font-semibold mt-0.5 flex items-center gap-0.5 truncate"><MapPin className="h-3 w-3 shrink-0" /> {donor.location}</span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(donor)}
                      title="Edit donor info"
                      className="h-7.5 w-7.5 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-450 hover:text-blue-600 cursor-pointer shadow-3xs hover:border-blue-150 transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(donor._id)}
                      title="Remove donor"
                      className="h-7.5 w-7.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 flex items-center justify-center border border-rose-500/10 cursor-pointer transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Footer Info details */}
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-500">
                  <div className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{donor.contactNum}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span>Registered: {new Date(donor.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredDonors.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-[28px] p-20 text-center text-slate-455 flex flex-col items-center gap-3 w-full shadow-3xs">
              <Heart className="h-10 w-10 text-slate-250 shrink-0" />
              <span className="text-sm font-bold text-slate-800 font-sans">No Records Found</span>
              <p className="text-xs text-slate-450 font-semibold leading-relaxed max-w-xs">
                No blood donors matched the query or filter active. Try typing another term or refresh listings.
              </p>
            </div>
          )}

        </div>
      )}

      {/* 4. Edit/Add Modal Panel */}
      {showModal && (
        <div 
          onClick={() => setShowModal(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded-3xl overflow-hidden animate-zoomIn text-left font-sans flex flex-col justify-between max-h-[90vh]"
          >
            
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center shrink-0">
              <h3 className="font-extrabold text-sm text-[#001c41] uppercase tracking-wide">
                {modalMode === 'edit' ? 'Modify Donor Registry' : 'Add New Donor Record'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="h-8.5 w-8.5 rounded-xl hover:bg-slate-200/80 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Fields Body */}
            <form onSubmit={handleFormSubmit} className="flex-grow overflow-y-auto p-6 flex flex-col gap-4 text-xs font-semibold text-slate-655">
              {modalError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200/20 text-xs font-semibold rounded-xl text-center flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
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
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Gandhi Nagar, Udumalpet"
                  disabled={submitting}
                  required
                  className="w-full border border-slate-200/70 p-3 px-4 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-rose-500 bg-slate-50/20"
                />
              </div>

              {/* Blood Group */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Blood Group</label>
                <select 
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  disabled={submitting}
                  className="w-full border border-slate-200/70 p-3 px-4 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-rose-500 bg-slate-50/20 cursor-pointer"
                >
                  {dropdownGroups.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Custom Blood Group Text Input (if 'Others' selected) */}
              {bloodGroup === 'Others' && (
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
                  value={contactNum}
                  onChange={(e) => setContactNum(e.target.value)}
                  placeholder="e.g. +91 94430 12345"
                  disabled={submitting}
                  required
                  className="w-full border border-slate-200/70 p-3 px-4 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-rose-500 bg-slate-50/20"
                />
              </div>

              {/* Modal Footer Controls */}
              <div className="flex justify-end gap-3.5 border-t border-slate-100 pt-5 mt-3 select-none">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowModal(false)}
                  className="py-2.5 px-5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-655 font-extrabold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2.5 px-5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  {submitting ? (
                    <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    <span>Save Record</span>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
