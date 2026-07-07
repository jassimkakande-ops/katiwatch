'use client';

import { useState, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: typeof window.OneSignal) => void>;
    OneSignal?: {
      init: (options: Record<string, unknown>) => Promise<void>;
      Notifications: {
        permission: boolean;
        permissionNative: NotificationPermission;
        requestPermission: () => Promise<void>;
        addEventListener: (event: string, handler: (...args: unknown[]) => void) => void;
      };
      User: {
        addAlias: (label: string, id: string) => void;
      };
    };
  }
}

export type NotifPermission = 'default' | 'granted' | 'denied' | 'loading' | 'unsupported';

interface UseOneSignalReturn {
  permission: NotifPermission;
  isSubscribed: boolean;
  isInitialized: boolean;
  promptForNotifications: () => Promise<void>;
  linkUserId: (userId: string) => void;
}

export function useOneSignal(): UseOneSignalReturn {
  const [permission, setPermission] = useState<NotifPermission>('loading');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) { setPermission('unsupported'); return; }
    if (!appId) { setPermission('unsupported'); return; }

    window.OneSignalDeferred = window.OneSignalDeferred || [];

    if (!document.getElementById('onesignal-sdk')) {
      const script = document.createElement('script');
      script.id = 'onesignal-sdk';
      script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
      script.async = true;
      document.head.appendChild(script);
    }

    window.OneSignalDeferred.push(async (OneSignal) => {
      if (!OneSignal) return;
      try {
        await OneSignal.init({
          appId,
          allowLocalhostAsSecureOrigin: true,
          notifyButton: { enable: false },
          welcomeNotification: {
            disable: false,
            title: 'katiwatch',
            message: "Welcome! You'll now get notified about new movies and series.",
          },
        });

        setIsInitialized(true);

        const nativePerm = OneSignal.Notifications.permissionNative;
        const subscribed = OneSignal.Notifications.permission;
        setIsSubscribed(subscribed);
        setPermission(nativePerm === 'denied' ? 'denied' : subscribed ? 'granted' : 'default');

        OneSignal.Notifications.addEventListener('permissionChange', (granted: unknown) => {
          const isGranted = Boolean(granted);
          setIsSubscribed(isGranted);
          setPermission(isGranted ? 'granted' : 'default');
        });
      } catch (err) {
        console.error('[OneSignal] Init error:', err);
        setPermission('default');
      }
    });
  }, [appId]);

  const promptForNotifications = useCallback(async () => {
    if (typeof window === 'undefined' || !window.OneSignal) return;
    try {
      await window.OneSignal.Notifications.requestPermission();
    } catch (err) {
      console.error('[OneSignal] Prompt error:', err);
    }
  }, []);

  const linkUserId = useCallback((userId: string) => {
    if (typeof window === 'undefined' || !window.OneSignal) return;
    try {
      window.OneSignal.User.addAlias('external_id', userId);
    } catch (err) {
      console.error('[OneSignal] Link user error:', err);
    }
  }, []);

  return { permission, isSubscribed, isInitialized, promptForNotifications, linkUserId };
}
