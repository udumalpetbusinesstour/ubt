import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!email || !token) {
      setStatus('error');
      setMessage('Invalid verification link. The verification token or email is missing.');
      return;
    }

    const performVerification = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/auth/verify-email-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp: token }),
        });
        
        const data = await res.json();
        
        if (data.success) {
          const userToken = data.token || (data.data && data.data.token);
          const userData = data.user || (data.data && data.data.user);

          if (userToken && userData) {
            localStorage.setItem('ubt_token', userToken);
            localStorage.setItem('ubt_user', JSON.stringify(userData));
            
            setStatus('success');
            setMessage('Your email address has been successfully verified!');
            
            // Auto redirect countdown
            const interval = setInterval(() => {
              setCountdown((prev) => {
                if (prev <= 1) {
                  clearInterval(interval);
                  if (userData.role === 'partner') {
                    navigate('/partner-register');
                  } else {
                    navigate('/add-business');
                  }
                }
                return prev - 1;
              });
            }, 1000);
            
            return () => clearInterval(interval);
          } else {
            setStatus('error');
            setMessage('Verification succeeded, but session token is missing. Please log in manually.');
          }
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification link is invalid or has expired.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Network error. Unable to contact the verification server. Please try again.');
      }
    };

    performVerification();
  }, [email, token, navigate]);

  return (
    <div className="w-full flex flex-col items-center bg-[#F8FAFC] py-16 px-4 md:px-8 font-sans min-h-[85vh] justify-center animate-fadeIn">
      <div className="max-w-md w-full bg-white border border-slate-200/80 shadow-2xl rounded-[2.5rem] p-8 sm:p-10 flex flex-col justify-center text-center items-center gap-6 relative">
        
        {/* Verification in Progress */}
        {status === 'verifying' && (
          <div className="flex flex-col items-center gap-4 py-8 animate-pulse">
            <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-inner">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight mt-2">
              Verifying Your Email
            </h3>
            <p className="text-xs text-slate-505 font-semibold max-w-xs leading-relaxed">
              Please wait while we check your credentials and activate your account...
            </p>
          </div>
        )}

        {/* Verification Success */}
        {status === 'success' && (
          <div className="flex flex-col items-center gap-4 py-4 animate-scaleUp">
            <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-650 flex items-center justify-center border border-emerald-200 shadow">
              <CheckCircle2 className="h-9 w-9 animate-bounce text-emerald-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-850 tracking-tight mt-2">
              Verification Successful!
            </h3>
            <p className="text-xs text-slate-500 font-semibold px-4 leading-relaxed animate-fadeIn">
              {message}
            </p>
            
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mt-2 text-xs font-semibold text-emerald-850 w-full max-w-sm">
              Redirecting you to dashboard in <span className="font-black text-emerald-650 text-sm">{countdown}</span> seconds...
            </div>

            <button
              onClick={() => {
                const user = JSON.parse(localStorage.getItem('ubt_user') || '{}');
                if (user.role === 'partner') {
                  navigate('/partner-register');
                } else {
                  navigate('/add-business');
                }
              }}
              className="mt-4 w-full max-w-xs py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-700/20 cursor-pointer flex items-center justify-center gap-1.5 transition-all group"
            >
              <span>Go to Dashboard Now</span>
              <ArrowRight className="h-4 w-4 text-white group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* Verification Error */}
        {status === 'error' && (
          <div className="flex flex-col items-center gap-4 py-4 animate-fadeIn">
            <div className="h-16 w-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100 shadow-inner animate-shake">
              <XCircle className="h-9 w-9 text-rose-500" />
            </div>
            <h3 className="text-xl font-black text-slate-805 tracking-tight mt-2">
              Verification Failed
            </h3>
            <p className="text-xs text-slate-450 font-semibold max-w-sm leading-relaxed px-2">
              {message}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full mt-4 justify-center">
              <Link
                to="/register"
                className="py-3 px-5 border border-slate-250 hover:bg-slate-50 text-slate-650 font-extrabold text-xs rounded-xl transition-all cursor-pointer bg-white text-center flex items-center justify-center"
              >
                Go to Sign Up
              </Link>
              <Link
                to="/login"
                className="py-3 px-6 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl transition-all shadow cursor-pointer text-center flex items-center justify-center"
              >
                Log In Manually
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
