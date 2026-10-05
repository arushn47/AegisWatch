'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '../lib/pwa';

/**
 * Registers the service worker as early as possible so the app is installable
 * and can display notifications. Renders nothing.
 */
export const ServiceWorkerRegistrar: React.FC = () => {
  useEffect(() => {
    void registerServiceWorker();
  }, []);

  return null;
};
