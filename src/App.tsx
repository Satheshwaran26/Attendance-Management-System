import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';

import CheckInOutPage from './components/CheckInOutPage';

// Main App Component
const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/checkinout" element={<CheckInOutPage />} />
  

        {/* Default Route */}
        <Route path="/" element={<AdminDashboard />} />

        {/* Catch all route */}
        <Route path="*" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
};

export default App;
