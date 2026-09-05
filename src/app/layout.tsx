import type { Metadata, Viewport } from 'next';
import './globals.css';

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
    <html lang="en" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
