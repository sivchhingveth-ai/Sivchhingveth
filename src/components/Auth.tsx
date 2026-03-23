import React, { useState } from 'react';
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvex } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';

export const Auth: React.FC = () => {
  const { signIn } = useAuthActions();
  const convex = useConvex();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  // Load remembered email and password
  React.useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    const savedPassword = localStorage.getItem('remembered_password');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
    if (savedPassword) {
      try {
        setPassword(atob(savedPassword));
      } catch (e) {
        // Handle old or invalid encoded passwords gracefully
        console.error('Could not decode saved password');
      }
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      
      // Pre-flight check for duplicates during Sign Up
      if (isSignUp) {
        const exists = await convex.query(api.users.checkEmailExists, { email: normalizedEmail });
        if (exists) {
           setError('An account with this email already exists. Try signing in instead.');
           setLoading(false);
           return;
        }
      }

      const formData = new FormData();
      formData.set("email", normalizedEmail);
      formData.set("password", password);
      formData.set("flow", isSignUp ? "signUp" : "signIn");

      if (!isSignUp) {
        if (rememberMe) {
          localStorage.setItem('remembered_email', email);
          if (password) {
            localStorage.setItem('remembered_password', btoa(password));
          }
        } else {
          localStorage.removeItem('remembered_email');
          localStorage.removeItem('remembered_password');
        }
      }

      await signIn("password", formData);

      if (isSignUp) {
        setMessage('Account created successfully!');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      const msg = err?.message || String(err);
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials')) {
        setError('Invalid email or password. Please try again.');
      } else if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exist')) {
        setError('An account with this email already exists. Try signing in instead.');
      } else if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network')) {
        setError('Connection Error: Could not reach the server. Please check your internet connection.');
      } else {
        setError(msg || 'An error occurred during authentication');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-black p-4 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#1d9bf0]/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="w-full max-w-md relative z-10">
            <div className="bg-[#16181c] border border-[#2f3336] rounded-3xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-[#eff3f4] mb-2 uppercase tracking-tight">
                        {isSignUp ? 'Create Account' : 'Welcome Back'}
                    </h1>
                    <p className="text-[#71767b] font-bold">
                        {isSignUp ? 'Join the habit tracking revolution' : 'Sign in to continue your progress'}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="text-[14px] font-bold text-[#eff3f4] mb-1.5 block">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71767b]" />
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-black border border-[#2f3336] pl-12 pr-4 py-3 rounded-xl text-[#eff3f4] text-base focus:border-[#1d9bf0] outline-none transition-all placeholder-[#71767b]"
                                placeholder="name@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="text-[14px] font-bold text-[#eff3f4]">Password</label>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71767b]" />
                            <input 
                                type={showPassword ? "text" : "password"} 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black border border-[#2f3336] pl-12 pr-12 py-3 rounded-xl text-[#eff3f4] text-base focus:border-[#1d9bf0] outline-none transition-all placeholder-[#71767b]"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#71767b] hover:text-[#eff3f4] transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {!isSignUp && (
                      <div className="flex items-center justify-between py-1">
                          <label className="flex items-center gap-2 cursor-pointer group">
                              <div className="relative flex items-center">
                                  <input 
                                      type="checkbox" 
                                      checked={rememberMe}
                                      onChange={(e) => setRememberMe(e.target.checked)}
                                      className="peer sr-only"
                                  />
                                  <div className="w-5 h-5 border-2 border-[#2f3336] rounded-md peer-checked:bg-[#1d9bf0] peer-checked:border-[#1d9bf0] transition-all" />
                                  <CheckIcon className="absolute w-3.5 h-3.5 text-white left-[3px] opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={4} />
                              </div>
                              <span className="text-[13px] font-bold text-[#71767b] group-hover:text-[#eff3f4] transition-colors">Remember Me</span>
                          </label>
                      </div>
                    )}

                    {error && (
                        <div className="text-red-500 text-sm font-bold bg-red-500/10 p-4 rounded-xl border border-red-500/20 space-y-2">
                            <p>{error}</p>
                        </div>
                    )}

                    {message && (
                        <p className="text-[#00ba7c] text-sm font-bold bg-[#00ba7c]/10 p-3 rounded-lg border border-[#00ba7c]/20">
                            {message}
                        </p>
                    )}

                    <button 
                        disabled={loading}
                        className="x-button-primary w-full py-4 text-[17px] mt-2 group"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                <span>{isSignUp ? 'Sign Up' : 'Sign In'}</span>
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </div>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center space-y-4">
                    <button 
                        onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null); }}
                        className="text-[#1d9bf0] font-bold hover:underline transition-all block w-full"
                    >
                        {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                    </button>
                    
                    <div className="flex items-center gap-4 py-2">
                        <div className="flex-1 h-px bg-[#2f3336]" />
                        <span className="text-[10px] font-black text-[#71767b] uppercase tracking-widest">or</span>
                        <div className="flex-1 h-px bg-[#2f3336]" />
                    </div>

                    <button 
                        onClick={() => {
                            import('../utils/localData').then(m => {
                                m.setGuestMode(true);
                                window.location.reload();
                            });
                        }}
                        className="text-[#eff3f4] text-sm font-bold bg-white/5 border border-white/10 w-full py-3 rounded-xl hover:bg-white/10 transition-all"
                    >
                        Continue as Guest (Local Only)
                    </button>
                </div>
            </div>

            <p className="text-center mt-8 text-[#71767b] text-sm">
                Securely synced with Convex
            </p>
        </div>
    </div>
  );
};

const CheckIcon = ({ className, strokeWidth }: { className?: string, strokeWidth?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth || 2} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
