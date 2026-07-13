import React, { useState } from 'react';
import { Mail, MessageSquare, X } from 'lucide-react';

const getDisplayName = (name) => {
  if (name === 'Customer (Call)') return 'Someone clicked Call';
  if (name === 'Customer (WhatsApp)') return 'Someone clicked WhatsApp Chat';
  if (name === 'Customer (Website)') return 'Someone clicked Website Link';
  if (name === 'Customer (Facebook)') return 'Someone clicked Facebook Page';
  if (name === 'Customer (Instagram)') return 'Someone clicked Instagram Profile';
  if (name === 'Customer (Email)') return 'Someone clicked Email Draft';
  if (name === 'Customer (Map Directions)') return 'Someone clicked Map Directions';
  if (name === 'Customer (Saved Contact)') return 'Someone saved Contact Card';
  return name;
};

export default function LeadsEnquiriesTab({
  business,
  leadsList = [],
  setLeadsList,
  selectedLeadIdx,
  setSelectedLeadIdx,
  leadFilter,
  setLeadFilter,
  leadReplyText,
  setLeadReplyText,
  handleUpdateLeadStatus,
  token
}) {
  const [leftFilter, setLeftFilter] = useState('All');
  const [rightFilter, setRightFilter] = useState('All');
  const [activeDetailLead, setActiveDetailLead] = useState(null);

  const clickLeads = (leadsList || []).filter(l => l.name && l.name.startsWith('Customer ('));
  const enquiryLeads = (leadsList || []).filter(l => l.name && !l.name.startsWith('Customer ('));

  return (
    <div className="flex flex-col gap-6 text-left animate-fadeIn">
      
      {/* Header card with UBT premium soft gradient */}
      <div className="bg-gradient-to-r from-white via-white to-emerald-50/15 border border-slate-200 shadow-xs rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col">
          <h3 className="font-extrabold text-[#001c41] text-base md:text-lg tracking-tight font-sans">Customer Leads & Enquiries Inbox</h3>
          <span className="text-[11px] text-slate-450 font-semibold mt-1">Aggregate direct customer inquiries, receive phone callback requests, and initiate instant WhatsApp replies</span>
        </div>
        <div className="bg-emerald-55/15 text-[#027244] border border-emerald-100 px-3.5 py-1.5 rounded-2xl text-[11px] font-black uppercase inline-flex items-center gap-1.5 shrink-0 select-none shadow-xs font-sans">
          <Mail className="h-3.5 w-3.5" /> {(leadsList || []).filter(l => l.status !== 'Rectified').length} Active Leads & Enquiries
        </div>
      </div>

      {/* Main Split Layout: Leads (Left) vs Enquiries (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
        
        {/* Left Column: Leads (col-span-6) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 shadow-sm rounded-3xl flex flex-col overflow-hidden max-h-[600px]">
          <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
            <div className="flex flex-col text-left">
              <span className="text-[10.5px] font-extrabold text-slate-800 uppercase tracking-wider font-sans">Leads (Profile Touchpoints)</span>
              <span className="text-[9px] text-slate-450 font-bold mt-0.5">Automated click actions on contact and map options</span>
            </div>
            
            {/* Filters */}
            <div className="flex gap-1.5">
              {['All', 'Responded'].map((filter) => (
                <button
                  key={`left-${filter}`}
                  onClick={() => setLeftFilter(filter)}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer btn-active-press ${leftFilter === filter ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Scrolling stream */}
          <div className="flex-grow overflow-y-auto divide-y divide-slate-100">
            {clickLeads.length > 0 ? (
              clickLeads
                .filter(l => leftFilter === 'All' || l.status === 'Responded' || l.responded)
                .map((lead) => (
                  <button
                    key={lead._id || lead.name}
                    onClick={() => setActiveDetailLead(lead)}
                    className="w-full p-4 flex items-center gap-3.5 text-left border-l-4 border-l-transparent transition-all hover:bg-slate-50/70 cursor-pointer"
                  >
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-extrabold text-xs shadow-xs shrink-0 select-none uppercase ${lead.color || 'bg-slate-105 text-slate-600'}`}>
                      {lead.initial || 'C'}
                    </div>
                    <div className="flex-grow flex flex-col overflow-hidden">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-slate-800 truncate leading-snug">{getDisplayName(lead.name)}</span>
                        <span className="text-[9px] font-semibold text-slate-400 shrink-0">{lead.time}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">{lead.message}</span>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-100/60 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide leading-none">
                          Profile Touchpoint
                        </span>
                        {lead.status === 'Rectified' ? (
                          <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide leading-none">✓ Rectified</span>
                        ) : (lead.status === 'Responded' || lead.responded) ? (
                          <span className="bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide leading-none">✓ Responded</span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                ))
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-slate-450 gap-1.5 font-semibold">
                <span className="text-xs">No profile touchpoint clicks registered yet.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Enquiries (col-span-6) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 shadow-sm rounded-3xl flex flex-col overflow-hidden max-h-[600px]">
          <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
            <div className="flex flex-col text-left">
              <span className="text-[10.5px] font-extrabold text-slate-800 uppercase tracking-wider font-sans">Enquiries (Customer Queries)</span>
              <span className="text-[9px] text-slate-450 font-bold mt-0.5">Direct messages submitted via customer contact forms</span>
            </div>
            
            {/* Filters */}
            <div className="flex gap-1.5">
              {['All', 'Responded'].map((filter) => (
                <button
                  key={`right-${filter}`}
                  onClick={() => setRightFilter(filter)}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer btn-active-press ${rightFilter === filter ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Scrolling stream */}
          <div className="flex-grow overflow-y-auto divide-y divide-slate-100">
            {enquiryLeads.length > 0 ? (
              enquiryLeads
                .filter(l => rightFilter === 'All' || l.status === 'Responded' || l.responded)
                .map((lead) => (
                  <button
                    key={lead._id || lead.name}
                    onClick={() => setActiveDetailLead(lead)}
                    className="w-full p-4 flex items-center gap-3.5 text-left border-l-4 border-l-transparent transition-all hover:bg-slate-50/70 cursor-pointer"
                  >
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-extrabold text-xs shadow-xs shrink-0 select-none uppercase ${lead.color || 'bg-slate-105 text-slate-600'}`}>
                      {lead.initial || 'Q'}
                    </div>
                    <div className="flex-grow flex flex-col overflow-hidden">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-slate-800 truncate leading-snug">{lead.name}</span>
                        <span className="text-[9px] font-semibold text-slate-400 shrink-0">{lead.time}</span>
                      </div>
                      <span className="text-[10px] text-slate-550 font-bold truncate mt-0.5">Category: {lead.category}</span>
                      <span className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">{lead.message || 'No custom message.'}</span>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="bg-blue-50 text-blue-600 border border-blue-100/60 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide leading-none">
                          General Query
                        </span>
                        {lead.status === 'Rectified' ? (
                          <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide leading-none">✓ Rectified</span>
                        ) : (lead.status === 'Responded' || lead.responded) ? (
                          <span className="bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide leading-none">✓ Responded</span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                ))
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-slate-450 gap-1.5 font-semibold">
                <span className="text-xs">No direct customer enquiries received yet.</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Detail Modal Overlay */}
      {activeDetailLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 shadow-2xl rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col animate-scaleUp">
            
            {/* Modal Header */}
            <div className="p-6 bg-slate-50/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-150">
              <div className="flex items-center gap-3.5">
                <div className={`h-11 w-11 rounded-full flex items-center justify-center font-extrabold text-sm shadow-xs shrink-0 select-none uppercase ${activeDetailLead.color || 'bg-slate-100 text-slate-600'}`}>
                  {activeDetailLead.initial || 'Q'}
                </div>
                <div className="flex flex-col text-left font-sans">
                  <h4 className="font-extrabold text-slate-800 text-sm md:text-base leading-snug">{getDisplayName(activeDetailLead.name)}</h4>
                  <span className="text-[10px] text-slate-450 font-semibold mt-0.5">Enquiry Category: {activeDetailLead.category || 'General Service'}</span>
                  <span className="text-[9.5px] text-slate-450 font-bold mt-0.5">
                    Received via {
                      activeDetailLead.name === 'Customer (Call)' ? 'Profile Phone Call' :
                      activeDetailLead.name === 'Customer (WhatsApp)' ? 'Profile WhatsApp Chat' :
                      activeDetailLead.name === 'Customer (Website)' ? 'Profile Website Link' :
                      activeDetailLead.name === 'Customer (Facebook)' ? 'Profile Facebook Page' :
                      activeDetailLead.name === 'Customer (Instagram)' ? 'Profile Instagram Page' :
                      activeDetailLead.name === 'Customer (Email)' ? 'Profile Email Draft' :
                      activeDetailLead.name === 'Customer (Map Directions)' ? 'Profile Map Directions' :
                      activeDetailLead.name === 'Customer (Saved Contact)' ? 'Contact Card Download' :
                      'Enquiry Form'
                    } • {activeDetailLead.time || 'Recently'}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setActiveDetailLead(null)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-lg p-1.5 hover:bg-slate-100 rounded-full transition-all leading-none cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex-grow flex flex-col gap-5 text-left">
              <div className="flex flex-col gap-1.5">
                <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Customer Message</span>
                <div className="bg-[#F8FAFC] border border-slate-200/60 p-4.5 rounded-2xl mt-1.5 relative overflow-hidden shadow-3xs">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#027244]" />
                  <p className="text-slate-600 text-xs font-semibold leading-relaxed font-sans">
                    {activeDetailLead.message ? (
                      `"${activeDetailLead.message}"`
                    ) : (
                      `"Hello! I saw your shop profile on Udumalpet Business Tour. I am looking to get service support for ${activeDetailLead.category || 'your products/services'}. Please reach out to me immediately. My details are verified."`
                    )}
                  </p>
                </div>
              </div>

              {/* Callback details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-slate-200 p-3.5 rounded-2xl flex flex-col gap-0.5 text-left bg-slate-50/30">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Mobile Number</span>
                  <span className="text-xs font-extrabold text-slate-800">{activeDetailLead.phone || 'N/A'}</span>
                </div>
                
                <div className="border border-slate-200 p-3.5 rounded-2xl flex flex-col gap-0.5 text-left bg-slate-50/30">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Status Tracker</span>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    {activeDetailLead.status === 'Rectified' ? (
                      <span className="text-xs font-extrabold text-emerald-600 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Rectified
                      </span>
                    ) : activeDetailLead.status === 'Responded' || activeDetailLead.responded ? (
                      <span className="text-xs font-extrabold text-blue-500 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" /> Responded
                      </span>
                    ) : (
                      <span className="text-xs font-extrabold text-rose-500 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" /> Pending Response
                      </span>
                    )}
                    
                    <select
                      value={activeDetailLead.status || 'Pending'}
                      onChange={async (e) => {
                        const originalIdx = leadsList.findIndex(l => l._id === activeDetailLead._id);
                        await handleUpdateLeadStatus(activeDetailLead._id, e.target.value, originalIdx);
                        setActiveDetailLead(prev => ({ ...prev, status: e.target.value }));
                      }}
                      className="text-[9px] font-black uppercase text-slate-500 border border-slate-200 rounded-lg px-1.5 py-0.5 bg-white cursor-pointer focus:outline-none"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Responded">Responded</option>
                      <option value="Rectified">Rectified</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50/80 border-t border-slate-150 flex justify-end gap-2.5">
              {activeDetailLead.status !== 'Rectified' && (
                <button
                  onClick={async () => {
                    const originalIdx = leadsList.findIndex(l => l._id === activeDetailLead._id);
                    await handleUpdateLeadStatus(activeDetailLead._id, 'Rectified', originalIdx);
                    setActiveDetailLead(null);
                  }}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-705 border border-blue-200 font-extrabold text-[10.5px] py-2 px-3.5 rounded-xl shadow-xs transition-all shrink-0 flex items-center gap-1 cursor-pointer btn-active-press"
                >
                  ✓ Mark Rectified
                </button>
              )}
              
              <a 
                href={`https://wa.me/${activeDetailLead.phone ? activeDetailLead.phone.replace(/[^0-9]/g, '') : ''}?text=${encodeURIComponent(`Hello! I saw your enquiry on Udumalpet Business Tour. I would like to connect and assist you.`)}`} 
                target="_blank" 
                rel="noreferrer"
                onClick={() => {
                  if (activeDetailLead.status === 'Pending') {
                    const originalIdx = leadsList.findIndex(l => l._id === activeDetailLead._id);
                    handleUpdateLeadStatus(activeDetailLead._id, 'Responded', originalIdx);
                  }
                  setActiveDetailLead(null);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10.5px] py-2 px-3.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer btn-active-press"
              >
                <MessageSquare className="h-3.5 w-3.5 fill-current" /> WhatsApp Contact
              </a>
              
              <button 
                onClick={() => setActiveDetailLead(null)}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-extrabold text-[10.5px] py-2 px-4 rounded-xl shadow-xs transition-all cursor-pointer btn-active-press"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
