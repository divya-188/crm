
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { router } from './routes';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './lib/query-client';
import { useBranding } from './hooks/useBranding';
import { useSettingsSync } from './hooks/useSettingsSync';

function AppContent() {
  // Initialize branding on app load
  useBranding();
  
  // Enable real-time settings synchronization
  useSettingsSync();

  return (
    <>
      <RouterProvider router={router} />
      <Toaster 
        position="top-right"
        containerStyle={{
          top: 20,
          right: 20,
          zIndex: 999999,
        }}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
            padding: '16px 20px',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            fontSize: '15px',
            fontWeight: '600',
            zIndex: 999999,
            minWidth: '280px',
          },
          success: {
            style: {
              background: '#3b82f6', // success-500 (Blue)
              color: '#fff',
              zIndex: 999999,
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#3b82f6',
            },
          },
          error: {
            style: {
              background: '#f43f5e', // danger-500 (Rose)
              color: '#fff',
              zIndex: 999999,
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#f43f5e',
            },
          },
        }}
      />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
