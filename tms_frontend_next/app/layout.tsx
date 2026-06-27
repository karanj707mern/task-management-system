import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Providers } from './providers';

export const metadata = {
  title: 'TMS - Task Management System',
  description: 'Manage your tasks efficiently with our modern task management platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          <AuthProvider>
            {children}
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
