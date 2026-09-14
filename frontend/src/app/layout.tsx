import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'tutorNow',
  description: 'Plataforma de asesorias academicas entre pares',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-bg-primary text-text-main antialiased">
        {children}
      </body>
    </html>
  );
}
