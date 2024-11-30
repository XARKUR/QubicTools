"use client";

import { CLSMetric, FCPMetric, FIDMetric, LCPMetric, TTFBMetric } from 'web-vitals';

const vitalsUrl = 'https://vitals.vercel-analytics.com/v1/vitals';

interface NetworkInformation {
  effectiveType: string;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
}

function getConnectionSpeed() {
  const nav = navigator as NavigatorWithConnection;
  return nav.connection?.effectiveType || '';
}

export function sendToAnalytics(metric: CLSMetric | FCPMetric | FIDMetric | LCPMetric | TTFBMetric) {
  // Only send analytics in production
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  // Check if we have a valid analytics ID
  const analyticsId = process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID;
  if (!analyticsId) {
    return;
  }

  const body = {
    dsn: analyticsId,
    id: metric.id,
    page: window.location.pathname,
    href: window.location.href,
    event_name: metric.name,
    value: metric.value.toString(),
    speed: getConnectionSpeed(),
  };

  try {
    const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });
    const url = vitalsUrl + '?' + new URLSearchParams({
      dsn: analyticsId,
    }).toString();

    // Use `navigator.sendBeacon()` if available, falling back to `fetch()`
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, {
        body: blob,
        method: 'POST',
        credentials: 'omit',
        keepalive: true,
      }).catch(() => {
        // Ignore errors
      });
    }
  } catch (err) {
    console.error('Error sending web vitals:', err);
  }
}
