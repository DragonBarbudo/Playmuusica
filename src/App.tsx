import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PlayerProvider } from './contexts/PlayerContext';
import { Login } from './pages/Login';
import { Subscribe } from './pages/Subscribe';
import { Library } from './pages/Library';
import { AudioPlayer } from './components/player/AudioPlayer';

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Subscription required route wrapper
const SubscriptionRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { hasActiveSubscription, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Cargando...</div>
      </div>
    );
  }

  if (!hasActiveSubscription) {
    return <Navigate to="/subscribe" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/subscribe"
        element={
          <ProtectedRoute>
            <Subscribe />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <SubscriptionRoute>
              <Library />
            </SubscriptionRoute>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PlayerProvider>
          <div className="app">
            <AppRoutes />
            <AudioPlayer />
          </div>
        </PlayerProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
