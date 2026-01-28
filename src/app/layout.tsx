import { ClerkProvider }  from '@clerk/nextjs';
import { ThemeProvider }  from '@/components/providers/theme-provider';
import './globals.css';
import type { Metadata }  from 'next';
import { Inter }          from 'next/font/google';
import { ToastContainer } from '@/components/ui/toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Tutorial Center Management',
  description: 'Manage students, attendance, and grades',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <ToastContainer />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
