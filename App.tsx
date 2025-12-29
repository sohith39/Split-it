import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { TripProvider, useTrips } from './context/TripContext';
import Layout from './components/Layout';
import Home from './old-pages/Home';
import AddTrip from './old-pages/AddTrip';
import History from './old-pages/History';
import TripDetails from './old-pages/TripDetails';
import Settings from './legacy-pages/Settings';
import Login from './old-pages/Login';
import Onboarding from './old-pages/Onboarding';
import Friends from './old-pages/Friends';
import Notifications from './old-pages/Notifications';

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