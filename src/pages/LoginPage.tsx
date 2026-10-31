import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { useCustomerAuth } from "../context/CustomerAuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading } = useCustomerAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preserve previous page or redirect location
  const from = location.state?.from || new URLSearchParams(location.search).get("redirect") || "/";

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await login(email.trim(), password);
    setSubmitting(false);

    if (res.success) {
      navigate(from, { replace: true });
    } else {
      setError(res.message || "Invalid email or password. Please try again.");
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gray-50/60">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 sm:p-10">
          {/* Logo & Headline */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center justify-center mb-4" title="PLUXPC Home">
              <img
                src="/pluxpc-logo.png"
                alt="PLUXPC logo"
                className="h-9 w-auto max-w-[170px] object-contain mx-auto"
              />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Customer Login</h1>
            <p className="text-xs text-gray-500 mt-1">
              Sign in to access your shopping cart, orders, and saved items.
            </p>
          </div>

          {/* Feedback banner */}
          {location.state?.message && !error && (
            <div className="mb-6 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="flex-shrink-0 text-amber-600" />
              <span>{location.state.message}</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@domain.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gray-950 hover:bg-gray-800 text-white text-sm font-bold shadow-md transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Registration Link */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-600">
              New to PLUXPC?{" "}
              <Link
                to={`/register${from !== "/" ? `?redirect=${encodeURIComponent(from)}` : ""}`}
                state={{ from }}
                className="font-bold text-volt-red hover:underline"
              >
                Create an Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

