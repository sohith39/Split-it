import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { TripProvider, useTrips } from './context/TripContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import AddTrip from './pages/AddTrip';
import History from './pages/History';
import TripDetails from './pages/TripDetails';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Friends from './pages/Friends';
import Notifications from './pages/Notifications';

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useTrips();
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="w-8 h-8 border-4 border-brand-pink border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const PublicRoute = () => {
  const { isAuthenticated, isLoading } = useTrips();
  if (isLoading) return null;
  return !isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

const App: React.FC = () => {
  return (
    <TripProvider>
      <div className="flex-1 flex flex-col h-screen w-full max-w-md mx-auto bg-white dark:bg-black shadow-2xl overflow-hidden relative transition-colors duration-200 border-x border-neutral-100 dark:border-neutral-900">
        <Router>
          <Routes>
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/onboarding" element={<Onboarding />} />
              <Route element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="/add-trip" element={<AddTrip />} />
                <Route path="/history" element={<History />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/friends" element={<Friends />} />
                <Route path="/notifications" element={<Notifications />} />
              </Route>
              <Route path="/trip/:id" element={<TripDetails />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </div>
    </TripProvider>
  );
};

export default App;