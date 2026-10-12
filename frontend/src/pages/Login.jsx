import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, PawPrint, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { DEMO_CREDENTIALS } from '../mock/mockData';
import { loginUser } from '../services/authService';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.username.trim()) errs.username = 'Username is required';
    if (!form.password.trim()) errs.password = 'Password is required';
    else if (form.password.length < 4) errs.password = 'Password must be at least 4 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await loginUser({
        username: form.username.trim(),
        password: form.password,
      });

      const { token, user } = res.data;
      sessionStorage.setItem('auth_token', token || 'token');
      sessionStorage.setItem('user', JSON.stringify(user || { name: form.username }));

      toast.success(`Welcome back, ${user?.name || form.username}!`);
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Login failed';
      toast.error(msg);
      setErrors({ password: msg });
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setForm({ username: DEMO_CREDENTIALS.username, password: DEMO_CREDENTIALS.password });
    setErrors({});
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side — hero */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-navy-950 via-navy-900 to-teal-900 items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        
        <div className="relative text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-teal-500/20 flex items-center justify-center backdrop-blur-sm border border-teal-400/20">
            <PawPrint className="w-10 h-10 text-teal-300" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Animal<span className="text-teal-400">Watch</span>
          </h1>
          <p className="text-navy-300 text-lg leading-relaxed">
            IoT-Based Animal Behavioural Monitoring System with Machine Learning
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <p className="text-2xl font-bold text-teal-300">12</p>
              <p className="text-xs text-navy-400 mt-1">Animals</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <p className="text-2xl font-bold text-teal-300">10</p>
              <p className="text-xs text-navy-400 mt-1">IoT Devices</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <p className="text-2xl font-bold text-teal-300">24/7</p>
              <p className="text-xs text-navy-400 mt-1">Monitoring</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-gray-50">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-navy-900">
              Animal<span className="text-teal-600">Watch</span>
            </h1>
          </div>

          <div className="card p-8">
            <h2 className="text-2xl font-bold text-navy-900 mb-1">Welcome back</h2>
            <p className="text-sm text-gray-500 mb-6">Sign in to your monitoring dashboard</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div>
                <label htmlFor="username" className="label">Username</label>
                <input
                  id="username"
                  type="text"
                  value={form.username}
                  onChange={(e) => { setForm({ ...form, username: e.target.value }); setErrors({ ...errors, username: undefined }); }}
                  className={`input-field ${errors.username ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="Enter username"
                  autoComplete="username"
                />
                {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="label">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: undefined }); }}
                    className={`input-field pr-10 ${errors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
                    placeholder="Enter password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>

              {/* Remember me */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-2.5"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in…
                  </span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* Quick login helper */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <button
                onClick={fillDemo}
                className="btn-secondary w-full justify-center text-sm"
              >
                Quick Login
              </button>
              <p className="text-xs text-gray-400 mt-3 text-center">
                Default: <code className="bg-gray-100 px-1.5 py-0.5 rounded">admin</code> / <code className="bg-gray-100 px-1.5 py-0.5 rounded">demo123</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
