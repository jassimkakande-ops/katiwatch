'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { useInstallPrompt } from '@/lib/hooks/useInstallPrompt';

const DISMISS_KEY = 'katiwatch-install-dismissed';

export default function InstallAppBanner() {
  const { installState, isIOS, canInstall, isStandalone, promptInstall, dismiss } = useInstallPrompt();
  const [visible, setVisible] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || isStandalone) return;
    const raw = localStorage.getItem(DISMISS_KEY);
    if (raw && Date.now() - parseInt(raw, 10) < 7 * 24 * 60 * 60 * 1000) return;
    const timer = setTimeout(() => { if (canInstall || isIOS) setVisible(true); }, 3000);
    return () => clearTimeout(timer);
  }, [canInstall, isIOS, isStandalone]);

  const handleDismiss = () => {
    setVisible(false);
    setShowIOSGuide(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    dismiss();
  };

  const handleInstall = async () => {
    if (isIOS) { setShowIOSGuide(true); return; }
    await promptInstall();
    if (installState === 'installed') setVisible(false);
  };

  if (!visible || isStandalone) return null;

  return (
    <>
      {/* Main banner */}
      <div className="fixed bottom-20 lg:bottom-6 left-4 right-4 lg:left-auto lg:right-6 lg:max-w-xs z-50">
        <div className="bg-[#1c1c1c] border border-gray-700 shadow-xl">
          {/* Top red bar */}
          <div className="h-[3px] bg-[#E50914]" />

          <div className="p-4">
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 pr-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpeg" alt="Katiwatch" className="w-10 h-10 object-cover flex-shrink-0" />
              <div>
                <p className="text-white font-bold text-sm">katiwatch</p>
                <p className="text-gray-400 text-xs mt-0.5">
                  {isIOS ? 'Add to home screen for the best experience' : 'Install for faster access & offline support'}
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleDismiss}
                className="flex-1 py-2 text-sm text-gray-400 border border-gray-700 hover:text-white hover:border-gray-500 transition-colors"
              >
                Not now
              </button>
              <button
                id="pwa-install-btn"
                onClick={handleInstall}
                className="flex-1 py-2 bg-[#E50914] hover:bg-[#c8000f] text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
              >
                {isIOS ? <Smartphone className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                {isIOS ? 'How to install' : 'Install'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* iOS guide */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center p-4 bg-black/80"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="w-full max-w-sm bg-[#1c1c1c] border border-gray-700 mb-20 lg:mb-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="h-[3px] bg-[#E50914]" />
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-bold">Add to Home Screen</h3>
                <button onClick={() => setShowIOSGuide(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {[
                  { step: 1, emoji: '⬆️', text: 'Tap the Share button at the bottom of Safari' },
                  { step: 2, emoji: '➕', text: 'Scroll down and tap "Add to Home Screen"' },
                  { step: 3, emoji: '✅', text: 'Tap "Add" in the top-right corner to confirm' },
                ].map(({ step, emoji, text }) => (
                  <div key={step} className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-[#E50914] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {step}
                    </div>
                    <p className="text-gray-300 text-sm leading-snug">{emoji} {text}</p>
                  </div>
                ))}
              </div>

              <p className="text-gray-600 text-xs text-center mt-4">Safari on iOS only</p>

              <button
                onClick={() => { setShowIOSGuide(false); handleDismiss(); }}
                className="w-full mt-4 py-3 bg-[#E50914] hover:bg-[#c8000f] text-white font-bold text-sm transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
