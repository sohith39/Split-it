
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { TripProvider, useTrips } from './context/TripContext.tsx';
import Layout from './components/Layout.tsx';
import Home from './pages/Home.tsx';
import AddTrip from './pages/AddTrip.tsx';
import History from './pages/History.tsx';
import TripDetails from './pages/TripDetails.tsx';
import Settings from './pages/Settings.tsx';
import Login from './pages/Login.tsx';
import Onboarding from './pages/Onboarding.tsx';
import Friends from './pages/Friends.tsx';
import Notifications from './pages/Notifications.tsx';

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
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
      </Route>

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
        
        <Route path="/trip/:id" element={<TripDetails />} />
      </Route>

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
