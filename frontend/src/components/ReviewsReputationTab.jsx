import React from 'react';
import { Star, Search, MessageSquare, Trash2 } from 'lucide-react';

const renderStars = (rating, sizeClass = "h-3.5 w-3.5", emptyColor = "text-slate-200") => {
  const stars = [];
  const r = rating ?? 0;
  for (let i = 0; i < 5; i++) {
    const starVal = i + 1;
    let fillPct = 0;
    if (r >= starVal) {
      fillPct = 100;
    } else if (r > starVal - 1) {
      fillPct = Math.round((r - (starVal - 1)) * 100);
    }
    
    if (fillPct === 100) {
      stars.push(<Star key={i} className={`${sizeClass} fill-amber-400 text-amber-400`} />);
    } else if (fillPct === 0) {
      stars.push(<Star key={i} className={`${sizeClass} ${emptyColor}`} />);
    } else {
      stars.push(
        <div key={i} className="relative inline-block shrink-0">
          <Star className={`${sizeClass} ${emptyColor}`} />
          <div 
            className="absolute inset-0 overflow-hidden text-amber-400"
            style={{ width: `${fillPct}%` }}
          >
            <Star className={`${sizeClass} fill-amber-400 text-amber-400`} />
          </div>
        </div>
      );
    }
  }
  return stars;
};

export default function ReviewsReputationTab({
  business,
  token,
  overallReviewsCount,
  overallAvgRating,
  localReviewsCount,
  localAvgRating,
  googleReviewsCountVal,
  googleAvgRatingVal,
  reputationLevel,
  responseRate,
  reviewFilter,
  setReviewFilter,
  reviewSourceFilter,
  setReviewSourceFilter,
  reviewSearch,
  setReviewSearch,
  localReviews,
  setLocalReviews,
  reviewResponses,
  setReviewResponses,
  replyingReviewId,
  setReplyingReviewId,
  reviewReplyText,
  setReviewReplyText,
  copyReviewLink,
  onLinkGoogleClick,
  onBusinessUpdate
}) {
  return (
    <div className="flex flex-col gap-6 text-left animate-fadeIn">
      
      {/* Header card with subtle gradient background */}
      <div className="bg-gradient-to-r from-white via-white to-emerald-50/15 border border-slate-200 shadow-xs rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col">
          <h3 className="font-extrabold text-[#001c41] text-base md:text-lg tracking-tight font-sans">Reviews & Reputation Management</h3>
          <span className="text-[11px] text-slate-455 font-semibold mt-1">Audit local platform feedback, monitor rating metrics, and reply to customers</span>
        </div>
        <button 
          onClick={copyReviewLink}
          className="bg-[#027244] hover:bg-[#005934] text-white font-extrabold text-xs py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-emerald-700/10 shrink-0 flex items-center gap-2 cursor-pointer border border-emerald-700/10 btn-active-press"
        >
          <Star className="h-4.5 w-4.5 fill-current" /> Get More Reviews
        </button>
      </div>

      {/* Stats overview cards grid using card-premium class */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Aggregate rating card */}
        <div className="card-premium p-6 rounded-3xl flex items-center gap-4.5 bg-white">
          <div className="h-14 w-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center font-extrabold text-[#001c41] text-2xl shadow-inner uppercase shrink-0">
            {localReviewsCount > 0 ? localAvgRating.toFixed(1) : '0.0'}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Overall Rating</span>
            <div className="flex items-center text-amber-400 gap-0.5 mt-1">
              {renderStars(localAvgRating, 'h-3.5 w-3.5', 'text-slate-200 fill-none')}
            </div>
            <span className="text-[10.5px] text-slate-450 font-bold mt-1">Based on {localReviewsCount} platform reviews</span>
          </div>
        </div>

        {/* Review Volume / Target goal progress card */}
        <div className="card-premium p-6 rounded-3xl flex flex-col justify-center text-left gap-1 bg-white">
          <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-500">
            <span>Total Reviews Received</span>
            <span className="text-slate-800 font-extrabold">{localReviewsCount}</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${localReviewsCount > 0 ? Math.min(100, (localReviewsCount / 50) * 100) : 0}%` }} />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold mt-1">
            <span>Target: 50 reviews</span>
            <span>{localReviewsCount >= 50 ? 'Goal Met!' : `${50 - localReviewsCount} to target`}</span>
          </div>
        </div>

        {/* Rating breakdown metrics */}
        <div className="card-premium p-6 rounded-3xl flex flex-col justify-center gap-1.5 bg-white text-left">
          <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-400">
            <span className="uppercase tracking-wider">Reputation Level</span>
            <span className="bg-emerald-55/15 text-[#027244] border border-emerald-100 px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase">
              {reputationLevel}
            </span>
          </div>
          <p className="text-slate-550 text-[10.5px] font-semibold leading-relaxed mt-1">
            {localReviewsCount > 0 ? (
              <>
                Your response rate is <strong>{responseRate}%</strong> on platform reviews. Maintaining active customer replies boosts search ranking placement!
              </>
            ) : (
              <>
                No reviews yet. Share your review link with customers to start collecting feedback!
              </>
            )}
          </p>
        </div>
      </div>

      {/* Reviews Table/Feed List with filters */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden flex flex-col">
        
        {/* Header Filter Actions */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-55/40">
          <div className="flex flex-wrap items-center gap-2">
            {/* Rating filters */}
            <select 
              value={reviewFilter} 
              onChange={(e) => setReviewFilter(e.target.value)}
              className="border border-slate-200 bg-white rounded-xl py-2 px-3 text-xs font-bold text-slate-600 focus:outline-emerald-600 focus:ring-1 focus:ring-emerald-100 cursor-pointer"
            >
              <option value="All">All Ratings</option>
              <option value="5">5 Stars only</option>
              <option value="4">4 Stars & Above</option>
              <option value="3">3 Stars & Below</option>
            </select>
          </div>

          {/* Search reviews bar */}
          <div className="w-full sm:w-68 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search review text..."
              value={reviewSearch}
              onChange={(e) => setReviewSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-emerald-600 font-semibold"
            />
          </div>
        </div>

        {/* Reviews Stream Container */}
        <div className="flex flex-col divide-y divide-slate-100 p-6">
          {(() => {
            const allReviewsList = (localReviews || []).map(r => ({ ...r, source: 'local', isGoogle: false }));
            
            // Remove duplicate reviews if any
            const uniqueReviews = Array.from(
              new Map(allReviewsList.map(item => [item.id || `${item.authorName}-${item.text}`, item])).values()
            );
            
            // Sort reviews by date descending
            uniqueReviews.sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt) : (a.time ? new Date(a.time) : new Date(0));
              const dateB = b.createdAt ? new Date(b.createdAt) : (b.time ? new Date(b.time) : new Date(0));
              return dateB - dateA;
            });

            const filteredReviews = uniqueReviews.filter(r => {
              if (reviewFilter !== 'All') {
                const stars = Number(reviewFilter);
                if (stars === 5 && r.rating !== 5) return false;
                if (stars === 4 && r.rating < 4) return false;
                if (stars === 3 && r.rating > 3) return false;
              }
              if (reviewSearch && 
                  !r.text.toLowerCase().includes(reviewSearch.toLowerCase()) && 
                  !r.authorName.toLowerCase().includes(reviewSearch.toLowerCase())) return false;
              return true;
            });

            if (filteredReviews.length === 0) {
              return (
                <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                  No matching reviews found.
                </div>
              );
            }

            return filteredReviews.map((rev) => {
              const ownerResponse = reviewResponses[rev.id] || rev.replyText;
              return (
                <div key={rev.id} className="py-5.5 first:pt-0 last:pb-0 flex flex-col md:flex-row gap-4 justify-between items-start text-left hover:bg-slate-50/20 px-2 rounded-2xl transition-colors">
                  <div className="flex-grow flex gap-3.5">
                    <div className="h-10.5 w-10.5 rounded-full bg-emerald-50 border border-emerald-150/60 flex items-center justify-center text-emerald-800 font-extrabold text-sm shadow-xs uppercase select-none shrink-0">
                      {(rev.authorName || 'R').charAt(0)}
                    </div>
                    
                    <div className="flex flex-col gap-1.5 w-full">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-800 text-sm leading-tight">{rev.authorName}</span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : rev.time}
                        </span>
                        
                        <span className="bg-emerald-55/15 text-[#027244] border border-emerald-100 px-1.5 py-0.5 rounded text-[8px] font-black uppercase flex items-center gap-0.5 select-none leading-none">
                          UBT Local
                        </span>
                      </div>

                      {/* Stars rating */}
                      <div className="flex items-center text-amber-400 gap-0.5">
                        {[...Array(Math.round(Number(rev.rating) || 5))].map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-current" />
                        ))}
                        {[...Array(5 - Math.round(Number(rev.rating) || 5))].map((_, i) => (
                          <Star key={i} className="h-3 w-3 text-slate-150" />
                        ))}
                      </div>

                      <p className="text-slate-655 text-xs font-semibold leading-relaxed mt-1">
                        "${rev.text}"
                      </p>

                      {/* Show administrative responses if exists */}
                      {ownerResponse && (
                        <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-2xl mt-3 ml-2 flex gap-3 animate-fadeIn">
                          <div className="h-6.5 w-6.5 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[9.5px] font-black shrink-0 shadow-2xs">
                            R
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="text-[10px] font-extrabold text-[#001c41]">Owner Response</span>
                            <p className="text-slate-500 text-[11px] font-semibold mt-1 leading-relaxed">
                              {ownerResponse}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Response textbox if active */}
                      {replyingReviewId === rev.id && (
                        <div className="flex flex-col gap-2.5 mt-3 ml-2 w-full max-w-lg animate-fadeIn">
                          <textarea
                            placeholder="Type your reply to the customer..."
                            value={reviewReplyText}
                            onChange={(e) => setReviewReplyText(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl p-3 text-xs bg-slate-50 focus:outline-emerald-600 font-semibold"
                            rows={3}
                          />
                          <div className="flex gap-2 justify-start">
                            <button
                              onClick={async () => {
                                if (reviewReplyText.trim()) {
                                  const activeToken = token || localStorage.getItem('ubt_token');
                                  try {
                                    const res = await fetch(`http://localhost:5000/api/reviews/${rev.id}/reply`, {
                                      method: 'PUT',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        Authorization: `Bearer ${activeToken}`
                                      },
                                      body: JSON.stringify({ replyText: reviewReplyText })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      setReviewResponses({ ...reviewResponses, [rev.id]: reviewReplyText });
                                      setLocalReviews(prev => prev.map(r => r.id === rev.id ? { ...r, replyText: reviewReplyText, replied: true } : r));
                                    } else {
                                      alert(data.message || 'Failed to submit reply');
                                    }
                                  } catch (err) {
                                    console.error('Error replying to review:', err);
                                    alert('Error connecting to backend server');
                                  }
                                  setReviewReplyText('');
                                  setReplyingReviewId(null);
                                }
                              }}
                              className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10.5px] rounded-xl shadow-xs cursor-pointer btn-active-press"
                            >
                              Submit Reply
                            </button>
                            <button
                              onClick={() => setReplyingReviewId(null)}
                              className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-550 font-extrabold text-[10.5px] rounded-xl cursor-pointer btn-active-press"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Moderation actions */}
                  <div className="flex flex-row md:flex-col gap-1.5 shrink-0 self-end md:self-start mt-3 md:mt-0 pl-14 md:pl-0">
                    {!ownerResponse && replyingReviewId !== rev.id && (
                      <button 
                        onClick={() => setReplyingReviewId(rev.id)}
                        className="py-1.5 px-3 border border-slate-200 text-slate-600 font-extrabold text-[10.5px] rounded-lg hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1.5 hover:border-emerald-600 hover:text-emerald-700"
                      >
                        <MessageSquare className="h-3.5 w-3.5" /> Reply
                      </button>
                    )}
                    
                    <button 
                      onClick={async () => {
                        const activeToken = token || localStorage.getItem('ubt_token');
                        if (await confirm('Are you sure you want to flag this review as spam?')) {
                          try {
                            const res = await fetch(`http://localhost:5000/api/reviews/${rev.id}/moderate`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${activeToken}`
                              },
                              body: JSON.stringify({ action: 'spam' })
                            });
                            const data = await res.json();
                            if (data.success) {
                              const updated = localReviews.filter(r => r.id !== rev.id);
                              setLocalReviews(updated);
                            } else {
                              alert(data.message || 'Failed to flag review');
                            }
                          } catch (err) {
                            console.error('Error flagging review:', err);
                            alert('Error connecting to backend server');
                          }
                        }
                      }}
                      className="py-1.5 px-3 border border-red-100 text-red-500 font-extrabold text-[10.5px] rounded-lg hover:bg-red-50 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Spam
                    </button>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
}
