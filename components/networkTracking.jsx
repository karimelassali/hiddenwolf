'use client';

import { useEffect, useState, useCallback } from 'react';

const STATUS_CONFIG = {
  checking: {
    color: '#64748b',
    bgColor: 'rgba(100, 116, 139, 0.2)',
    borderColor: '#64748b',
    bars: 0,
    ariaLabel: 'Network status is being checked',
  },
  fast: {
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
    bars: 4,
    ariaLabel: 'Network connection is excellent',
  },
  medium: {
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#f59e0b',
    bars: 3,
    ariaLabel: 'Network connection is good',
  },
  slow: {
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
    bars: 1,
    ariaLabel: 'Network connection is poor',
  },
  offline: {
    color: '#dc2626',
    bgColor: 'rgba(220, 38, 38, 0.2)',
    borderColor: '#dc2626',
    bars: 0,
    ariaLabel: 'No network connection',
  },
};

export function NetworkTracking() {
  const [status, setStatus] = useState('checking');
  const [lastChecked, setLastChecked] = useState(null);
  const [ping, setPing] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const testNetworkSpeed = useCallback(async () => {
    setIsAnimating(true);
    try {
      const start = performance.now();
      await fetch('https://cloudflare.com/cdn-cgi/trace', {
        cache: 'no-store',
        mode: 'no-cors',
      });
      const duration = performance.now() - start;
      setPing(Math.round(duration));

      if (duration < 100) setStatus('fast');
      else if (duration < 300) setStatus('medium');
      else setStatus('slow');

      setLastChecked(new Date());
    } catch {
      setStatus('offline');
      setPing(0);
      setLastChecked(new Date());
    } finally {
      setTimeout(() => setIsAnimating(false), 500);
    }
  }, []);

  useEffect(() => {
    testNetworkSpeed();

    const interval = setInterval(testNetworkSpeed, 20000);

    window.addEventListener('online', testNetworkSpeed);
    window.addEventListener('offline', () => setStatus('offline'));

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', testNetworkSpeed);
      window.removeEventListener('offline', () => setStatus('offline'));
    };
  }, [testNetworkSpeed]);

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.checking;

  const WifiIcon = ({ status, color }) => {
    if (status === 'offline') {
      return (
        <div style={{ position: 'relative', width: '16px', height: '12px' }}>
          <svg viewBox="0 0 16 12" style={{ width: '100%', height: '100%' }}>
            <path
              d="M8 0C5.8 0 3.7 0.8 2 2.2L3.5 3.8C4.8 2.7 6.4 2.1 8 2.1s3.2 0.6 4.5 1.7L14 2.2C12.3 0.8 10.2 0 8 0z"
              fill={color}
              opacity="0.3"
            />
            <path
              d="M8 3.5C6.8 3.5 5.6 3.9 4.7 4.6L6.2 6.2C6.7 5.8 7.3 5.6 8 5.6s1.3 0.2 1.8 0.6L11.3 4.6C10.4 3.9 9.2 3.5 8 3.5z"
              fill={color}
              opacity="0.3"
            />
            <path
              d="M8 7C7.4 7 6.9 7.2 6.5 7.5L8 9L9.5 7.5C9.1 7.2 8.6 7 8 7z"
              fill={color}
              opacity="0.3"
            />
            <line x1="2" y1="2" x2="14" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      );
    }

    if (status === 'medium') {
      return (
        <div style={{ position: 'relative', width: '16px', height: '12px' }}>
          <svg viewBox="0 0 16 12" style={{ width: '100%', height: '100%' }}>
            <path
              d="M8 0C5.8 0 3.7 0.8 2 2.2L3.5 3.8C4.8 2.7 6.4 2.1 8 2.1s3.2 0.6 4.5 1.7L14 2.2C12.3 0.8 10.2 0 8 0z"
              fill={color}
              opacity="0.3"
            />
            <path
              d="M8 3.5C6.8 3.5 5.6 3.9 4.7 4.6L6.2 6.2C6.7 5.8 7.3 5.6 8 5.6s1.3 0.2 1.8 0.6L11.3 4.6C10.4 3.9 9.2 3.5 8 3.5z"
              fill={color}
            />
            <circle cx="8" cy="9" r="1.5" fill={color} />
          </svg>
        </div>
      );
    }

    if (status === 'fast') {
      return (
        <div style={{ position: 'relative', width: '16px', height: '12px' }}>
          <svg viewBox="0 0 16 12" style={{ width: '100%', height: '100%' }}>
            <path
              d="M8 0C5.8 0 3.7 0.8 2 2.2L3.5 3.8C4.8 2.7 6.4 2.1 8 2.1s3.2 0.6 4.5 1.7L14 2.2C12.3 0.8 10.2 0 8 0z"
              fill={color}
            />
            <path
              d="M8 3.5C6.8 3.5 5.6 3.9 4.7 4.6L6.2 6.2C6.7 5.8 7.3 5.6 8 5.6s1.3 0.2 1.8 0.6L11.3 4.6C10.4 3.9 9.2 3.5 8 3.5z"
              fill={color}
            />
            <circle cx="8" cy="9" r="1.5" fill={color} />
          </svg>
        </div>
      );
    }

    // checking or slow state
    return (
      <div style={{ position: 'relative', width: '16px', height: '12px' }}>
        <svg viewBox="0 0 16 12" style={{ width: '100%', height: '100%' }}>
          <path
            d="M8 0C5.8 0 3.7 0.8 2 2.2L3.5 3.8C4.8 2.7 6.4 2.1 8 2.1s3.2 0.6 4.5 1.7L14 2.2C12.3 0.8 10.2 0 8 0z"
            fill={color}
            opacity="0.5"
          />
          <circle cx="8" cy="9" r="1.5" fill={color} />
        </svg>
      </div>
    );
  };

  const PulseRing = ({ color, isActive }) => (
    <div
      style={{
        position: 'absolute',
        top: '-2px',
        left: '-2px',
        right: '-2px',
        bottom: '-2px',
        borderRadius: '12px',
        border: `2px solid ${color}`,
        opacity: isActive ? 0.6 : 0,
        animation: isActive ? 'pulse 2s infinite' : 'none',
      }}
    />
  );

  return (
    <>
      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 0.3; }
          100% { transform: scale(1.2); opacity: 0; }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 5px ${config.color}33; }
          50% { box-shadow: 0 0 20px ${config.color}66, 0 0 30px ${config.color}33; }
        }
        
        .network-indicator {
          position: relative;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(20, 20, 30, 0.95) 100%);
          border: 1px solid ${config.borderColor};
          animation: ${status !== 'offline' ? 'glow 3s ease-in-out infinite' : 'none'};
        }
        
        .network-indicator::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: ${config.bgColor};
          border-radius: 8px;
          z-index: 0;
        }
        
        .network-content {
          position: relative;
          z-index: 1;
        }
      `}</style>
      
      <div
        className="network-indicator"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 8px',
          borderRadius: '6px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '10px',
          fontWeight: '600',
          letterSpacing: '0.3px',
          textTransform: 'uppercase',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isAnimating ? 'scale(1.03)' : 'scale(1)',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={testNetworkSpeed}
        role="status"
        aria-live="polite"
        aria-label={config.ariaLabel}
        title="Click to refresh network status"
      >
        <PulseRing color={config.color} isActive={status === 'fast'} />
        
        <div className="network-content" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* WiFi Icon */}
          <WifiIcon status={status} color={config.color} />

          {/* Ping Display */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              padding: '1px 4px',
              borderRadius: '3px',
              fontSize: '9px',
              color: '#ffffff',
              fontWeight: '600',
              border: `1px solid ${config.color}33`,
            }}
          >
            {status === 'checking' ? '...' : status === 'offline' ? 'X' : `${ping}ms`}
          </div>

          {/* Connection Quality Dot */}
          {status === 'offline' && (
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: config.color,
                boxShadow: `0 0 6px ${config.color}`,
              }}
            />
          )}
        </div>
        </div>
      </>
  );
}