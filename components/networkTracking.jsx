'use client';

import { useEffect, useState, useCallback } from 'react';

const STATUS_CONFIG = {
  checking: {
    label: 'Checking...',
    color: '#6b7280',
    icon: '⏳',
    ariaLabel: 'Network status is being checked',
  },
  fast: {
    label: 'Fast',
    color: '#16a34a',
    icon: '🚀',
    ariaLabel: 'Network connection is fast',
  },
  medium: {
    label: 'Moderate',
    color: '#f97316',
    icon: '⏱️',
    ariaLabel: 'Network connection is moderate',
  },
  slow: {
    label: 'Slow',
    color: '#dc2626',
    icon: '🐢',
    ariaLabel: 'Network connection is slow',
  },
  offline: {
    label: 'Offline',
    color: '#991b1b',
    icon: '🚫',
    ariaLabel: 'No network connection',
  },
};

export function NetworkTracking() {
  const [status, setStatus] = useState('checking');
  const [lastChecked, setLastChecked] = useState(null);

  const testNetworkSpeed = useCallback(async () => {
    try {
      const start = performance.now();
      await fetch('https://cloudflare.com/cdn-cgi/trace', {
        cache: 'no-store',
        mode: 'no-cors',
      });
      const duration = performance.now() - start;

      if (duration < 100) setStatus('fast');
      else if (duration < 300) setStatus('medium');
      else setStatus('slow');

      setLastChecked(new Date());
    } catch {
      setStatus('offline');
      setLastChecked(new Date());
    }
  }, []);

  useEffect(() => {
    testNetworkSpeed();

    const interval = setInterval(testNetworkSpeed, 10000);

    window.addEventListener('online', testNetworkSpeed);
    window.addEventListener('offline', () => setStatus('offline'));

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', testNetworkSpeed);
      window.removeEventListener('offline', () => setStatus('offline'));
    };
  }, [testNetworkSpeed]);

  const { label, color, icon, ariaLabel } = STATUS_CONFIG[status] || STATUS_CONFIG.checking;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '4px 12px',
        borderRadius: '999px',
        backgroundColor: '#f3f4f6',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
        fontFamily: 'Arial, sans-serif',
      }}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <span style={{ fontWeight: '600', color }}>{label}</span>
      {lastChecked && (
        <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px' }}>
          Last checked: {lastChecked.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}