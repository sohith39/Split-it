import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { TripProvider } from './context/TripContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import AddTrip from './pages/AddTrip';
import History from './pages/History';
import TripDetails from './pages/TripDetails';
import Settings from './pages/Settings';

const App: React.FC = () => {
  return (
    <TripProvider>
      <Router>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/add-trip" element={<AddTrip />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          {/* TripDetails is outside the main layout (hides bottom nav) for more immersive feel */}
          <Route path="/trip/:id" element={<TripDetails />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </TripProvider>
  );
};

export default App;