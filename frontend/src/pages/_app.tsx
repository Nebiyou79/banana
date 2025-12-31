// src/pages/_app.tsx
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from 'next-themes'; // Add this
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/Toaster';
import ErrorBoundary from '@/components/ErrorBoundary';
import '@/styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      // You can handle query errors in individual hooks or with ErrorBoundary
    },
    mutations: {
      // Prevent mutation errors from crashing the app
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {/* Wrap with ThemeProvider - this is the only change needed */}
        <ThemeProvider
          attribute="class" // Use class-based theming
          defaultTheme="light" // Default to light theme
          enableSystem={false} // Disable system preference detection (optional)
          disableTransitionOnChange={false} // Keep transitions smooth
        >
          <AuthProvider>
            <Component {...pageProps} />
            <Toaster />
            <ReactQueryDevtools initialIsOpen={false} />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}