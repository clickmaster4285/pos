// app/login/page.jsx
'use client';
import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLoginMutation, useGoogleLoginMutation } from '@/features/authApi';
import { AuthContext } from '@/components/auth/SecureAuthProvider';
import { Eye, EyeOff, Loader2, AlertCircle, Sparkles, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from 'framer-motion';

const GoogleLogo = ({ className }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <path d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.39 30.31 0 24 0 14.62 0 6.51 5.53 2.37 13.84l7.91 6.14C11.75 14.11 17.43 9.5 24 9.5z" fill="#EA4335"/>
    <path d="M46.65 24.54c0-1.61-.14-3.23-.42-4.81H24v9.1h12.66c-.54 2.91-2.19 5.37-4.53 7.01l7.28 5.65c4.26-3.92 6.74-9.69 6.74-16.95z" fill="#4285F4"/>
    <path d="M12.28 28.99c-1.11-3.25-1.11-6.73 0-9.98l-7.91-6.14C1.34 17.11 0 20.68 0 24.5c0 3.82 1.34 7.39 3.37 10.63l7.91-6.14z" fill="#FBBC05"/>
    <path d="M24 48c6.48 0 11.93-2.14 15.89-5.8l-7.28-5.65c-2.08 1.39-4.73 2.21-7.61 2.21-6.57 0-12.15-4.43-14.12-10.39l-7.91 6.14C6.51 42.47 14.62 48 24 48z" fill="#34A853"/>
  </svg>
);

export default function SignInPage() {
  const router = useRouter();
  const authContext = useContext(AuthContext);

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const [googleLogin, { isLoading: googleLoading }] = useGoogleLoginMutation();

useEffect(() => {
  const script = document.createElement("script");
  script.src = "https://accounts.google.com/gsi/client";
  script.async = true;
  script.defer = true;
  script.onload = () => {
    console.log("Google OAuth script loaded");
  };
  document.body.appendChild(script);
  return () => {
    if (document.body.contains(script)) document.body.removeChild(script);
  };
}, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login({ email, password }).unwrap();
    } catch (err) {
      setError(err?.data?.message || 'An error occurred. Please try again.');
    }
  };

const handleGoogleLogin = async () => {
  try {
    if (!window.google?.accounts?.oauth2) {
      setError("Google OAuth SDK not loaded yet.");
      return;
    }

    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      ux_mode: 'popup', // Opens the Google account chooser popup window
      callback: async (response) => {
        try {
          const result = await googleLogin(response.code).unwrap();
console.log("Google login result:", result);
          if (result.onboarding) {
            const gu = encodeURIComponent(JSON.stringify(result.user));
            router.push(`/sign-up?step=1&googleUser=${gu}`);
          } else{
            console.log("Logging in existing user with Google ID:", result);
            await login({ email:result.data.user.email, googleId: result.data.user.googleId }).unwrap();
          }
        } catch (err) {
          setError(err?.data?.message || "Google login failed");
        }
      },
    }); 

    // This opens the account chooser when the button is clicked
    client.requestCode();
  } catch (err) {
    console.error(err);
    setError("Failed to initialize Google login");
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div animate={{ x: [0, 100, 0], y: [0, -50, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-200/40 to-cyan-200/40 rounded-full blur-3xl" />
        <motion.div animate={{ x: [0, -80, 0], y: [0, 60, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 2 }} className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-purple-200/30 to-pink-200/30 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <motion.div className="text-center mb-8">
          <motion.div whileHover={{ scale: 1.05, rotateY: 180 }} className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-600 shadow-2xl shadow-blue-500/40 mb-6 relative">
            <Shield className="w-10 h-10 text-white" />
            <Sparkles className="w-5 h-5 text-yellow-300 absolute -top-2 -right-2" />
          </motion.div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-4">Welcome Back</h1>
          <p className="text-gray-600 text-lg">Sign in to access your dashboard</p>
        </motion.div>

        <motion.div className="p-8 backdrop-blur-2xl bg-white/80 border border-white/50 shadow-2xl shadow-black/10 rounded-3xl">
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50/80 backdrop-blur-sm">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-gray-700">Email</label>
              <motion.input whileFocus={{ scale: 1.02 }} id="email" type="email" placeholder="admin@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} className="w-full h-12 px-4 bg-white/50 border border-gray-200 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</label>
                <Link href="/forgot-password">
                  <motion.span whileHover={{ scale: 1.05 }} className="text-sm bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold cursor-pointer">Forgot password?</motion.span>
                </Link>
              </div>
              <div className="relative">
                <motion.input whileFocus={{ scale: 1.02 }} id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} className="w-full h-12 px-4 pr-12 bg-white/50 border border-gray-200 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50" />
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </motion.button>
              </div>
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={isLoading} className="w-full h-12 font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25 transition-all duration-200 rounded-xl text-white relative overflow-hidden group">
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </>
              )}
            </motion.button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white/80 px-3 text-gray-500 font-medium">Or</span>
              </div>
            </div>

            <motion.button type="button" onClick={handleGoogleLogin} disabled={googleLoading} className="w-full h-12 flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50">
              {googleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <GoogleLogo className="w-5 h-5" />
              )}
              Continue with Google
            </motion.button>

            <div className="text-center text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <Link href="/sign-up">
                <motion.span whileHover={{ scale: 1.05 }} className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold cursor-pointer">Create account</motion.span>
              </Link>
            </div>
          </form>
        </motion.div>

        <motion.p className="text-center text-xs text-gray-500 mt-8">
          By signing in, you agree to our{" "}
          <a href="#" className="underline hover:text-gray-700 font-medium">Terms of Service</a>{" "}
          and{" "}
          <a href="#" className="underline hover:text-gray-700 font-medium">Privacy Policy</a>
        </motion.p>
      </motion.div>
    </div>
  );
}