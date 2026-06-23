import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ShieldCheck, Lock, AlertCircle, Loader, Eye, EyeOff, ArrowLeft
} from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. The reset token is missing from the URL.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('Cannot reset password: Reset token is missing.');
      return;
    }
    if (!password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage('Password has been successfully updated! Redirecting to login page...');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(data.message || 'Failed to reset password. The link might be invalid or expired.');
      }
    } catch (err) {
      setError('Server connection failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center bg-[#F8FAFC] pt-6 pb-12 px-4 md:px-8 font-sans min-h-screen justify-center">
      
      {/* Back to Login Link */}
      <div className="max-w-md w-full flex justify-start mb-6">
        <Link 
          to="/login" 
          className="flex items-center gap-2 text-xs font-extrabold text-[#001c41] hover:text-[#027244] transition-all bg-white py-2.5 px-4 rounded-xl border border-slate-200 shadow-sm hover:shadow group"
        >
          <ArrowLeft className="h-4 w-4 text-slate-400 group-hover:text-[#027244] transition-colors" />
          <span>Back to Login</span>
        </Link>
      </div>

      {/* Main card */}
      <div className="max-w-md w-full bg-white border border-slate-200 shadow-xl rounded-[2.5rem] overflow-hidden p-6 sm:p-10 flex flex-col justify-center">
        <div className="w-full flex flex-col gap-6">
          
          {/* Header */}
          <div>
            <h3 className="text-2xl font-black text-[#001c41] tracking-tight">
              Reset Your Password
            </h3>
            <p className="text-xs text-slate-500 font-semibold mt-1.5 leading-relaxed">
              Please enter and confirm your new secure password below to regain access to your account.
            </p>
          </div>

          {/* Error / Success Alerts */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-650 rounded-xl p-3 text-xs font-semibold flex items-start gap-2 animate-shake">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 rounded-xl p-3 text-xs font-semibold flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-[#027244] mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {(!successMessage || !error.includes('URL')) && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">New Password <span className="text-red-500">*</span></label>
                <div className="relative flex items-center">
                  <Lock className="h-4.5 w-4.5 text-slate-400 absolute left-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={!token || !!successMessage}
                    className="w-full py-2.5 pl-10 pr-10 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#027244] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Confirm New Password <span className="text-red-500">*</span></label>
                <div className="relative flex items-center">
                  <Lock className="h-4.5 w-4.5 text-slate-400 absolute left-3" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={!token || !!successMessage}
                    className="w-full py-2.5 pl-10 pr-10 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#027244] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-none"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !token || !!successMessage}
                className="bg-[#027244] hover:bg-[#005934] text-white font-black text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 mt-2"
              >
                {loading && <Loader className="h-4 w-4 animate-spin" />}
                <span>Update Password</span>
              </button>
            </form>
          )}

          {successMessage && (
            <div className="flex flex-col gap-2 mt-2">
              <Link
                to="/login"
                className="bg-[#027244] hover:bg-[#005934] text-white font-black text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-center"
              >
                <span>Go to Login Immediately</span>
              </Link>
            </div>
          )}

        </div>
      </div>
      
    </div>
  );
}
