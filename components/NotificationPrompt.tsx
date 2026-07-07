'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { useOneSignal } from '@/lib/hooks/useOneSignal';

const DISMISSED_KEY = 'katiwatch-notif-dismissed';
const PROMPT_DELAY_MS = 8000;

export default function NotificationPrompt() {
  const { permission, isInitialized, promptForNotifications } = useOneSignal();
  const [visible, setVisible] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (permission === 'granted' || permission === 'denied' || permission === 'unsupported') return;
    if (permission === 'loading' || !isInitialized) return;
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (raw && Date.now() - parseInt(raw, 10) < 14 * 24 * 60 * 60 * 1000) return;
    const timer = setTimeout(() => setVisible(true), PROMPT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [permission, isInitialized]);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
  };

  const handleEnable = async () => {
    setRequesting(true);
    try { await promptForNotifications(); }
    finally { setRequesting(false); setVisible(false); }
  };

  if (!visible) return null;

  return (
    <div
      id="notification-prompt"
      className="fixed top-4 right-4 left-4 lg:left-auto lg:max-w-xs z-50"
      role="dialog"
      aria-label="Enable notifications"
    >
      <div className="bg-[#1c1c1c] border border-gray-700 shadow-xl">
        <div className="h-[3px] bg-[#E50914]" />

        <div className="p-4">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3 pr-6 mb-4">
            <div className="w-9 h-9 bg-[#E50914] flex items-center justify-center flex-shrink-0">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Stay in the loop</p>
              <p className="text-gray-400 text-xs mt-0.5 leading-snug">
                Get notified when new movies &amp; series drop.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2 text-sm text-gray-400 border border-gray-700 hover:text-white hover:border-gray-500 transition-colors flex items-center justify-center gap-1.5"
            >
              <BellOff className="w-3.5 h-3.5" />
              No thanks
            </button>
            <button
              id="enable-notifications-btn"
              onClick={handleEnable}
              disabled={requesting}
              className="flex-1 py-2 bg-[#E50914] hover:bg-[#c8000f] disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Bell className="w-3.5 h-3.5" />
              {requesting ? 'Enabling...' : 'Enable'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
