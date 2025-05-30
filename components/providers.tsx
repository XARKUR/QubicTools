"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from "sonner";
import { WebVitalsReporter } from "@/components/web-vitals-reporter";
import { I18nProvider } from './i18n/i18n-provider'
import { QubicDataProvider } from "@/providers/qubic-data-provider";
import { SidebarProvider } from "@/components/ui/sidebar";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <I18nProvider>
        <QubicDataProvider>
          <SidebarProvider>
            {children}
            <Toaster />
            <Analytics />
            <WebVitalsReporter />
          </SidebarProvider>
        </QubicDataProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
