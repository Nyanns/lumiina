import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { FollowProvider } from './context/FollowContext';
import { BookmarkProvider } from './context/BookmarkContext';

// Route-level code splitting for maximum loading speed & minimal initial bundle
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const ArtworksDiscoveryPage = lazy(() => import('./pages/ArtworksDiscoveryPage').then(m => ({ default: m.ArtworksDiscoveryPage })));
const ArtworkDetailPage = lazy(() => import('./pages/ArtworkDetailPage').then(m => ({ default: m.ArtworkDetailPage })));
const UploadPage = lazy(() => import('./pages/UploadPage').then(m => ({ default: m.UploadPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const LegalInfoPage = lazy(() => import('./pages/LegalInfoPage').then(m => ({ default: m.LegalInfoPage })));

// Ultra-lightweight page loading fallback (zero layout shift, fast transition)
const PageLoadingFallback = () => (
  <div className="flex-1 min-h-[50vh] flex items-center justify-center p-8">
    <div className="flex flex-col items-center gap-2.5">
      <div className="w-6 h-6 border-2 border-[#0096fa] border-t-transparent rounded-full animate-spin" />
      <span className="text-[11px] font-medium text-slate-400">Loading...</span>
    </div>
  </div>
);

export default function App() {
  const location = useLocation();

  // Hide global browsing Navbar on dedicated auth pages, upload studio, legal docs, and artwork viewer for a focused workspace
  const hideGlobalNavbar = 
    ['/login', '/register', '/forgot-password', '/upload', '/about', '/guidelines', '/terms', '/privacy'].includes(location.pathname) ||
    location.pathname.startsWith('/artworks/');

  return (
    <FollowProvider>
      <BookmarkProvider>
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-sky-100 selection:text-sky-900">
          {!hideGlobalNavbar && <Navbar />}

          <div className="flex-1 flex flex-col">
            <Suspense fallback={<PageLoadingFallback />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/explore" element={<ArtworksDiscoveryPage />} />
                <Route path="/trending" element={<ArtworksDiscoveryPage defaultTab="trending" />} />
                <Route path="/recommended" element={<ArtworksDiscoveryPage defaultTab="recommended" />} />
                <Route path="/artworks/trending" element={<ArtworksDiscoveryPage defaultTab="trending" />} />
                <Route path="/artworks/recommended" element={<ArtworksDiscoveryPage defaultTab="recommended" />} />
                <Route path="/artworks/:id" element={<ArtworkDetailPage />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/profile/:id" element={<ProfilePage />} />
                <Route path="/about" element={<LegalInfoPage defaultTab="about" />} />
                <Route path="/guidelines" element={<LegalInfoPage defaultTab="guidelines" />} />
                <Route path="/terms" element={<LegalInfoPage defaultTab="terms" />} />
                <Route path="/privacy" element={<LegalInfoPage defaultTab="privacy" />} />
                {/* Fallback route */}
                <Route path="*" element={<HomePage />} />
              </Routes>
            </Suspense>
          </div>
        </div>
      </BookmarkProvider>
    </FollowProvider>
  );
}
