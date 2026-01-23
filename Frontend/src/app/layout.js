// src/app/layout.js
import { Geist, Geist_Mono } from 'next/font/google';
import '@/styles/global.css';
import { ToastContainer } from '@/components/notify/ToastContainer';
import StoreProvider from '@/store/provider';
import SecureAuthProvider from '@/components/auth/SecureAuthProvider';
import SocketProvider from '@/components/realtime/SocketProvider';
import { Toaster } from 'sonner';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'Alpha AutoMotive',
  description: 'Social media management platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased `}>
        <StoreProvider>
          <SecureAuthProvider>
            {/* <SocketProvider> */}
              <main>{children}</main>
              <ToastContainer />
            {/* </SocketProvider> */}
          </SecureAuthProvider>
        </StoreProvider>
      </body>
    </html>
  );
}