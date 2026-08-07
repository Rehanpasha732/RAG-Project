import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'Cortex — Chat With Your Documents',
  description: 'Cortex turns your documents into a private, searchable knowledge base you can chat with.',
  keywords: ['document', 'RAG', 'chat', 'PDF', 'DOCX', 'knowledge base'],
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#12181f',
                color: '#e6edf3',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
              },
              success: {
                iconTheme: { primary: '#14b8a6', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#fff' },
              },
            }}
          />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
