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
  const { isAuthenticated } = useTrips();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const PublicRoute = () => {
  const { isAuthenticated } = useTrips();
  return !isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes (Login) */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<Onboarding />} />
        
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/add-trip" element={<AddTrip />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>
        
        {/* TripDetails outside layout */}
        <Route path="/trip/:id" element={<TripDetails />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <TripProvider>
      <Router>
        <AppRoutes />
      </Router>
    </TripProvider>
  );
};

export default App;