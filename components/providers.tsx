"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from "sonner";
import { WebVitalsReporter } from "@/components/web-vitals-reporter";
import { I18nProvider } from './i18n/i18n-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <I18nProvider>
        {children}
        <Toaster />
        <Analytics />
        <WebVitalsReporter />
      </I18nProvider>
    </ThemeProvider>
  );
}
