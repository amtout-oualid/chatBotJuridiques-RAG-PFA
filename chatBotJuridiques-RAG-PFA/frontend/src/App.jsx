import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  SignIn,
  SignUp,
  useAuth,
  useUser,
} from '@clerk/clerk-react';
import { setTokenGetter } from './api/axiosInstance';
import { authService } from './services/authService';

import LandingPage from './pages/LandingPage';
import MainLayout from './layouts/MainLayout';
import ChatPage from './pages/ChatPage';
import DatabasePage from './pages/DatabasePage';
import EditorPage from './pages/EditorPage';
import LawyersPage from './pages/LawyersPage';

import './App.css';

import { ModelProvider } from './context/ModelContext';

function AuthSync() {
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    setTokenGetter(getToken);
  }, [getToken]);

  useEffect(() => {
    if (isLoaded && user) {
      authService
        .syncUser({
          email: user.primaryEmailAddress?.emailAddress || '',
          nom: user.lastName || '',
          prenom: user.firstName || '',
          role: 'client',
        })
        .catch(() => {});
    }
  }, [isLoaded, user]);

  return null;
}

function ProtectedRoute({ children }) {
  return (
    <>
      <SignedIn>
        <AuthSync />
        {children}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

export default function App() {
  return (
    <ModelProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/sign-in/*"
          element={
            <div className="auth-page">
              <SignIn routing="path" path="/sign-in" afterSignInUrl="/chat" />
            </div>
          }
        />
        <Route
          path="/sign-up/*"
          element={
            <div className="auth-page">
              <SignUp routing="path" path="/sign-up" afterSignUpUrl="/chat" />
            </div>
          }
        />

        {/* Protected — Chat (newfront shell, no MainLayout) */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:sessionId"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />

        {/* Protected — Database (newfront shell, no MainLayout) */}
        <Route
          path="/database"
          element={
            <ProtectedRoute>
              <DatabasePage />
            </ProtectedRoute>
          }
        />

        {/* Protected — Editor (newfront shell, no MainLayout) */}
        <Route
          path="/editor"
          element={
            <ProtectedRoute>
              <EditorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editor/:documentId"
          element={
            <ProtectedRoute>
              <EditorPage />
            </ProtectedRoute>
          }
        />

        {/* Protected — MainLayout shell */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/lawyers" element={<LawyersPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ModelProvider>
  );
}
