import React from 'react';
import { Mail, MessageSquare } from 'lucide-react';

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

      {/* Main List-Detail Inbox Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
        
        {/* Left Panel: Leads Inbox List (col-span-5) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 shadow-sm rounded-3xl flex flex-col overflow-hidden max-h-[600px]">
          <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
            <span className="text-[10.5px] font-extrabold text-slate-550 uppercase tracking-wider">Inbox Stream</span>
            
            {/* Inbox Filters */}
            <div className="flex gap-1.5">
              {['All', 'Urgent', 'Responded'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setLeadFilter(filter)}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer btn-active-press ${leadFilter === filter ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Leads stream scrolling list */}
          <div className="flex-grow overflow-y-auto divide-y divide-slate-100">
            {leadsList
              .filter(l => {
                if (leadFilter === 'Urgent' && l.name !== 'Suresh Kumar' && l.name !== 'Kavin Prakash') return false;
                if (leadFilter === 'Responded' && !l.responded) return false;
                return true;
              })
              .map((lead) => {
                const originalIdx = leadsList.findIndex(l => l._id ? l._id === lead._id : l.name === lead.name);
                const isSelected = selectedLeadIdx === originalIdx;
                const isClickLog = lead.name.startsWith('Customer (');
                
                return (
                  <button
                    key={lead.name}
                    onClick={() => setSelectedLeadIdx(originalIdx)}
                    className={`w-full p-4 flex items-center gap-3.5 text-left border-l-4 transition-all hover:bg-slate-50/70 border-r-0 border-y-0 cursor-pointer ${isSelected ? 'bg-emerald-55/5 border-l-[#027244] border-r-0 border-y-0 shadow-2xs' : 'border-l-transparent'}`}
                  >
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-extrabold text-xs shadow-xs shrink-0 select-none uppercase ${lead.color || 'bg-slate-100 text-slate-600'}`}>
                      {lead.initial}
                    </div>
                    
                    <div className="flex-grow flex flex-col overflow-hidden">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-slate-800 truncate leading-snug">{lead.name}</span>
                        <span className="text-[9px] font-semibold text-slate-400 shrink-0">{lead.time}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">
                        {isClickLog ? lead.message : lead.category}
                      </span>
                      
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {isClickLog ? (
                          <span className="bg-emerald-50 text-emerald-600 border border-emerald-100/60 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide leading-none">
                            Profile Touchpoint
                          </span>
                        ) : lead.name === 'Suresh Kumar' || lead.name === 'Kavin Prakash' ? (
                          <span className="bg-rose-50 text-rose-600 border border-rose-100/60 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide leading-none">
                            Urgent Callback
                          </span>
                        ) : (
                          <span className="bg-blue-50 text-blue-600 border border-blue-100/60 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide leading-none">
                            General Query
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>

        </div>

        {/* Right Panel: Lead Full Detail View (col-span-7) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 shadow-sm rounded-3xl flex flex-col overflow-hidden min-h-[400px]">
          
          {selectedLeadIdx !== null && leadsList[selectedLeadIdx] ? (
            (() => {
              const activeLead = leadsList[selectedLeadIdx];
              return (
                <div className="flex flex-col h-full divide-y divide-slate-100">
                  
                  {/* Lead Profile Header */}
                  <div className="p-6 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center font-extrabold text-sm shadow-xs shrink-0 select-none uppercase ${activeLead.color}`}>
                        {activeLead.initial}
                      </div>
                      <div className="flex flex-col text-left font-sans">
                        <h4 className="font-extrabold text-slate-800 text-sm md:text-base leading-snug">{activeLead.name}</h4>
                        <span className="text-[10px] text-slate-450 font-semibold mt-0.5">Enquiry Category: {activeLead.category}</span>
                        <span className="text-[9.5px] text-slate-400 font-bold mt-0.5">Received via Website Link • {activeLead.time}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Direct Contact WhatsApp with spring Tactile press */}
                      <a 
                        href={`https://wa.me/${activeLead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${activeLead.name}! I saw your enquiry about "${activeLead.category}" on Udumalpet Business Tour. I would like to connect and assist you.`)}`} 
                        target="_blank" 
                        rel="noreferrer"
                        onClick={() => {
                          if (activeLead.status === 'Pending') {
                            handleUpdateLeadStatus(activeLead._id, 'Responded', selectedLeadIdx);
                          }
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10.5px] py-2.5 px-4 rounded-xl shadow-md hover:shadow-emerald-700/10 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer btn-active-press border border-emerald-700/10"
                      >
                        <MessageSquare className="h-3.5 w-3.5 fill-current" /> WhatsApp Contact
                      </a>

                      {activeLead.status !== 'Rectified' && (
                        <button
                          onClick={() => handleUpdateLeadStatus(activeLead._id, 'Rectified', selectedLeadIdx)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-705 border border-blue-200 font-extrabold text-[10.5px] py-2.5 px-4 rounded-xl shadow-xs transition-all shrink-0 flex items-center gap-1 cursor-pointer btn-active-press"
                        >
                          ✓ Mark Rectified
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Enquiry Text Details */}
                  <div className="p-6 flex-grow flex flex-col gap-5 text-left">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Customer Message</span>
                      <div className="bg-[#F8FAFC] border border-slate-200/60 p-4.5 rounded-2xl mt-1.5 relative overflow-hidden shadow-3xs">
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#027244]" />
                        <p className="text-slate-600 text-xs font-semibold leading-relaxed font-sans">
                          {activeLead.message ? (
                            `"${activeLead.message}"`
                          ) : (
                            <>
                              "Hello! I saw your shop profile on Udumalpet Business Tour. I am looking to get service support for <strong>{activeLead.category}</strong>. Please reach out to me callback immediately or text back on WhatsApp. My details are verified."
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Callback details grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="border border-slate-200 p-3.5 rounded-2xl flex flex-col gap-0.5 text-left bg-slate-50/30">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Mobile Number</span>
                        <span className="text-xs font-extrabold text-slate-800">{activeLead.phone}</span>
                      </div>
                      <div className="border border-slate-200 p-3.5 rounded-2xl flex flex-col gap-0.5 text-left bg-slate-50/30">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Status Tracker</span>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          {activeLead.status === 'Rectified' ? (
                            <span className="text-xs font-extrabold text-emerald-600 flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Rectified
                            </span>
                          ) : activeLead.status === 'Responded' || activeLead.responded ? (
                            <span className="text-xs font-extrabold text-blue-500 flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" /> Responded
                            </span>
                          ) : (
                            <span className="text-xs font-extrabold text-rose-500 flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" /> Pending Response
                            </span>
                          )}
                          
                          <select
                            value={activeLead.status || 'Pending'}
                            onChange={async (e) => {
                              await handleUpdateLeadStatus(activeLead._id, e.target.value, selectedLeadIdx);
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

                    {/* Show simulated replies if exists */}
                    {activeLead.reply && (
                      <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-4 mt-2 animate-fadeIn">
                        <span className="text-[9.5px] font-extrabold text-[#027244] uppercase tracking-widest leading-none">Your Reply</span>
                        <div className="bg-emerald-50/30 border border-emerald-100 p-4 rounded-2xl mt-1 flex gap-2.5">
                          <div className="h-6 w-6 rounded-full bg-[#027244] text-white flex items-center justify-center text-[9px] font-black shrink-0 shadow-2xs">
                            R
                          </div>
                          <p className="text-slate-600 text-xs font-semibold leading-normal">
                            {activeLead.reply}
                          </p>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Quick reply action box with premium button tactile feedback */}
                  {!activeLead.reply && (
                    <div className="p-6 bg-slate-50/40 flex flex-col gap-3">
                      <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest leading-none text-left">Quick Response Box</span>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          placeholder="Type your response email or text..."
                          value={leadReplyText}
                          onChange={(e) => setLeadReplyText(e.target.value)}
                          className="flex-grow border border-slate-200 rounded-xl px-4 py-3 text-xs bg-white focus:outline-emerald-600 font-semibold shadow-3xs"
                        />
                        <button
                          onClick={async () => {
                            if (!leadReplyText.trim()) return;
                            if (activeLead._id) {
                              const activeToken = token || localStorage.getItem('ubt_token');
                              try {
                                const res = await fetch(`http://localhost:5000/api/leads/${activeLead._id}/reply`, {
                                  method: 'PUT',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${activeToken}`
                                  },
                                  body: JSON.stringify({ reply: leadReplyText })
                                });
                                const data = await res.json();
                                if (data.success) {
                                  const updatedList = [...leadsList];
                                  updatedList[selectedLeadIdx] = {
                                    ...activeLead,
                                    reply: leadReplyText,
                                    responded: true
                                  };
                                  setLeadsList(updatedList);
                                  setLeadReplyText('');
                                  return;
                                }
                              } catch (err) {
                                console.warn('Failed to reply via API, applying offline fallback updates', err);
                              }
                            }
                            
                            // Offline fallback update
                            const updatedList = [...leadsList];
                            updatedList[selectedLeadIdx] = {
                              ...activeLead,
                              reply: leadReplyText,
                              responded: true
                            };
                            setLeadsList(updatedList);
                            setLeadReplyText('');
                          }}
                          className="py-3 px-5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer transition-all border border-slate-800 btn-active-press w-full sm:w-auto shrink-0"
                        >
                          Submit
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })()
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2 font-semibold">
              <Mail className="h-8 w-8 text-slate-300 animate-pulse" />
              <span className="text-xs">No lead selected</span>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
