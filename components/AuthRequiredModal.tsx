"use client";

import { Button } from "@/components/ui/button";
import { Lock, Play, Download, Clock, X } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useRouter } from "next/navigation";
import { setRedirectCookie } from "@/lib/utils";
import { useState, useEffect } from "react";
import { getUserSubscriptionStatus } from "@/lib/subscriptions";

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: "play" | "download";
  requirePremium?: boolean;
  customMessage?: string;
}

export default function AuthRequiredModal({ isOpen, onClose, action, requirePremium = false, customMessage }: AuthRequiredModalProps) {
  const { user, loading, isPremium } = useAuth();
  const router = useRouter();
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);

  useEffect(() => {
    if (user?.id && requirePremium) getUserSubscriptionStatus(user.id).then(setSubscriptionStatus);
  }, [user?.id, requirePremium]);

  useEffect(() => {
    if (isOpen && !loading && user && (!requirePremium || isPremium)) onClose();
  }, [isOpen, loading, user, requirePremium, isPremium, onClose]);

  if (!isOpen) return null;

  const handleLogin = () => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname + window.location.search;
      setRedirectCookie(path);
      router.push(`/signin?redirect=${encodeURIComponent(path)}`);
    }
    onClose();
  };

  const handleUpgrade = () => { router.push("/payment"); onClose(); };

  if (loading) {
    return (
      <NetflixModal onClose={onClose}>
        <div className="flex flex-col items-center py-8">
          <span className="inline-flex items-center justify-center font-bold tracking-widest text-2xl text-[#E50914]">
  <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
  <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
  <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
</span>
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </NetflixModal>
    );
  }

  if (!user) {
    return (
      <NetflixModal onClose={onClose}>
        <div className="w-14 h-14 bg-[#E50914]/10 border border-[#E50914]/30 rounded-full flex items-center justify-center mx-auto mb-5">
          {action === "play" ? <Play className="w-6 h-6 text-[#E50914]" /> : <Download className="w-6 h-6 text-[#E50914]" />}
        </div>
        <h2 className="text-xl font-bold text-white mb-2 text-center">Sign In to Continue</h2>
        <p className="text-gray-400 text-sm text-center mb-6 leading-relaxed">
          {customMessage || `Sign in or create a free account to ${action === "play" ? "watch" : "download"} this content.`}
        </p>
        <div className="bg-white/5 rounded-xl p-4 mb-6 text-sm text-gray-400 space-y-1.5">
          <p className="text-white font-semibold mb-2 flex items-center gap-2"><Lock className="w-4 h-4 text-[#E50914]" /> Free account includes:</p>
          <p>• Access to all free content</p>
          <p>• HD streaming quality</p>
          <p>• Ad-free experience</p>
        </div>
        <button onClick={handleLogin} className="w-full bg-[#E50914] hover:bg-[#b80710] text-white font-bold py-3 rounded-lg mb-3 transition-colors">
          Sign In / Create Account
        </button>
        <button onClick={onClose} className="w-full text-gray-400 hover:text-white text-sm py-2 transition-colors">Cancel</button>
      </NetflixModal>
    );
  }

  if (requirePremium && !isPremium) {
    const isExpired = subscriptionStatus?.isExpired;
    return (
      <NetflixModal onClose={onClose}>
        <div className="w-14 h-14 bg-yellow-500/10 border border-yellow-500/30 rounded-full flex items-center justify-center mx-auto mb-5">
          {isExpired ? <Clock className="w-6 h-6 text-yellow-400" /> : <span className="text-yellow-400 text-2xl">★</span>}
        </div>
        <h2 className="text-xl font-bold text-white mb-2 text-center">
          {isExpired ? "Subscription Expired" : "Premium Content"}
        </h2>
        <p className="text-gray-400 text-sm text-center mb-6 leading-relaxed">
          {customMessage || (isExpired
            ? `Your subscription expired on ${new Date(subscriptionStatus.expiryDate).toLocaleDateString()}. Renew to keep watching.`
            : `This content requires a premium subscription to ${action === "play" ? "watch" : "download"}.`)}
        </p>
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 mb-6 text-sm text-gray-400 space-y-1.5">
          <p className="text-white font-semibold mb-2 flex items-center gap-2"><span className="text-yellow-400">★</span> Premium includes:</p>
          <p>• All premium movies &amp; series</p>
          <p>• HD &amp; 4K streaming</p>
          <p>• Unlimited downloads</p>
          <p>• Ad-free experience</p>
        </div>
        <button onClick={handleUpgrade} className="w-full bg-[#E50914] hover:bg-[#b80710] text-white font-bold py-3 rounded-lg mb-3 transition-colors">
          {isExpired ? "Renew Subscription" : "Get Premium"}
        </button>
        <button onClick={onClose} className="w-full text-gray-400 hover:text-white text-sm py-2 transition-colors">Cancel</button>
      </NetflixModal>
    );
  }

  return null;
}

function NetflixModal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1000] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1a1a1a] rounded-2xl p-8 max-w-sm w-full border border-gray-800 shadow-2xl relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>
  );
}

export function useAuthCheck() {
  const { user, loading, isPremium } = useAuth();
  const checkAuth = (requirePremium = false) => {
    if (loading) return { allowed: false, reason: "loading" };
    if (!user) return { allowed: false, reason: "auth_required" };
    if (requirePremium && !isPremium) return { allowed: false, reason: "premium_required" };
    return { allowed: true, reason: null };
  };
  return { user, loading, isPremium, checkAuth };
}
