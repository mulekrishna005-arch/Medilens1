import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1
};

export const metadata: Metadata = {
  title: 'MedLens — AI-Powered Clinical Information Intelligence & Patient Intake',
  description: 'Transform fragmented medical records, laboratory reports, and patient intake into a structured, traceable, and human-reviewable clinical record.',
  keywords: ['clinical intelligence', 'medical report parser', 'patient intake', 'lab results', 'healthcare AI', 'longitudinal medical records'],
  authors: [{ name: 'MedLens Clinical Intelligence' }]
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" className={`${plusJakartaSans.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
