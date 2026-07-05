"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/AuthProvider";
import { X, Mail, Lock, Chrome } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { signIn, signUp, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error } = isLogin ? await signIn(email, password) : await signUp(email, password);
      if (error) setError(error.message);
      else { onClose(); setEmail(""); setPassword(""); }
    } catch { setError("An unexpected error occurred"); }
    finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      const { error } = await signInWithGoogle();
      if (error) setError(error.message);
      else onClose();
    } catch { setError("An unexpected error occurred"); }
    finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-[1000] p-4" onClick={onClose}>
      <div className="bg-[#1a1a1a] rounded-2xl p-8 max-w-sm w-full border border-gray-800 shadow-2xl relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-1 text-center">{isLogin ? "Sign In" : "Create Account"}</h2>
        <p className="text-gray-500 text-xs text-center mb-6">to continue watching</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <Input
              type="email" placeholder="Email address" value={email}
              onChange={e => setEmail(e.target.value)} required
              className="pl-10 bg-white/5 border-gray-700 text-white placeholder-gray-500 focus:border-[#E50914] focus:ring-0 rounded-lg h-11"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <Input
              type="password" placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)} required
              className="pl-10 bg-white/5 border-gray-700 text-white placeholder-gray-500 focus:border-[#E50914] focus:ring-0 rounded-lg h-11"
            />
          </div>

          {error && <p className="text-[#E50914] text-xs text-center">{error}</p>}

          <button
            type="submit" disabled={loading}
            className="w-full bg-[#E50914] hover:bg-[#b80710] disabled:opacity-60 text-white font-bold py-3 rounded-lg transition-colors mt-1"
          >
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-gray-600 text-xs">or</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        <button
          onClick={handleGoogle} disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-white/5 border border-gray-700 hover:bg-white/10 text-gray-300 hover:text-white font-medium py-3 rounded-lg transition-colors text-sm"
        >
          <Chrome className="w-4 h-4" /> Continue with Google
        </button>

        <div className="mt-5 text-center space-y-2">
          {isLogin && (
            <button
              type="button"
              onClick={() => { onClose(); window.location.href = "/forgot-password"; }}
              className="text-gray-500 hover:text-[#E50914] text-xs transition-colors"
            >
              Forgot password?
            </button>
          )}
          <p className="text-gray-500 text-xs">
            {isLogin ? "New to Katiwatch? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-white hover:text-[#E50914] font-semibold transition-colors">
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
