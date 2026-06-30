import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

export default function GlobalModalProvider({ children }) {
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert',
    resolve: null
  });

  useEffect(() => {
    window.alert = (message, title = 'Notification') => {
      return new Promise((resolve) => {
        setModal({
          isOpen: true,
          title,
          message,
          type: 'alert',
          resolve
        });
      });
    };

    window.confirm = (message, title = 'Confirm Action') => {
      return new Promise((resolve) => {
        setModal({
          isOpen: true,
          title,
          message,
          type: 'confirm',
          resolve
        });
      });
    };
  }, []);

  const handleConfirm = () => {
    if (modal.resolve) modal.resolve(true);
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleCancel = () => {
    if (modal.resolve) modal.resolve(false);
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <>
      {children}
      {modal.isOpen && (
        <div 
          onClick={() => {
            if (modal.type === 'alert') handleConfirm();
          }}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn animate-duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded-3xl overflow-hidden animate-zoomIn animate-duration-200 text-left font-sans flex flex-col justify-between"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center shrink-0">
              <h3 className="font-extrabold text-sm text-[#001c41] uppercase tracking-wide flex items-center gap-2">
                {modal.type === 'confirm' ? (
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-blue-500 shrink-0" />
                )}
                {modal.title}
              </h3>
              <button 
                onClick={handleCancel}
                className="h-8.5 w-8.5 rounded-xl hover:bg-slate-200/80 flex items-center justify-center text-slate-450 hover:text-slate-700 transition-colors cursor-pointer border-none bg-transparent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 text-sm text-slate-650 font-semibold leading-relaxed max-h-[60vh] overflow-y-auto">
              {String(modal.message).split('\n').map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>

            {/* Actions */}
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0 select-none">
              {modal.type === 'confirm' && (
                <button
                  onClick={handleCancel}
                  className="py-2.5 px-5 bg-slate-150 hover:bg-slate-200 text-slate-600 font-extrabold text-xs rounded-xl shadow-xs cursor-pointer border-none transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleConfirm}
                className={`py-2.5 px-5 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer border-none transition-colors ${
                  modal.type === 'confirm' ? 'bg-[#027244] hover:bg-emerald-700' : 'bg-[#001c41] hover:bg-slate-800'
                }`}
              >
                {modal.type === 'confirm' ? 'Confirm' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
