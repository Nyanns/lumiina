import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { ArtworkDetailPage } from './pages/ArtworkDetailPage';
import { UploadPage } from './pages/UploadPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ProfilePage } from './pages/ProfilePage';

export default function App() {
  const location = useLocation();

  // Hide global browsing Navbar on dedicated auth pages, upload studio, and artwork viewer for a focused gallery workspace
  const hideGlobalNavbar = 
    ['/login', '/register', '/forgot-password', '/upload'].includes(location.pathname) ||
    location.pathname.startsWith('/artworks/');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-sky-100 selection:text-sky-900">
      {!hideGlobalNavbar && <Navbar />}

      <div className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<HomePage />} />
          <Route path="/artworks/:id" element={<ArtworkDetailPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          {/* Fallback route */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </div>
    </div>
  );
}
