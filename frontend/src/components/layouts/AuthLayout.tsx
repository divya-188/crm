import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Branding */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl shadow-glow mb-4">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">WhatsCRM</h1>
          <p className="text-neutral-600">WhatsApp CRM & Marketing Platform</p>
        </div>

        {/* Auth Form Container */}
        <div className="bg-white rounded-2xl shadow-soft p-8 animate-slide-up">
          <Outlet />
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-neutral-500">
          <p>© 2024 WhatsCRM. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};
