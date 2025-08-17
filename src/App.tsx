import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './components/LoginPage';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './components/AdminDashboard';
import CheckInOutPage from './components/CheckInOutPage';
import UserManagementPage from './components/UserManagementPage';
import AttendanceMarkingPage from './components/AttendanceMarkingPage';
import SessionDataPage from './components/SessionDataPage';

// Main App Component
const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Admin Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/checkinout" 
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <CheckInOutPage />
                </AdminLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <UserManagementPage />
                </AdminLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/attendance" 
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <AttendanceMarkingPage />
                </AdminLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/sessiondata" 
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <SessionDataPage />
                </AdminLayout>
              </ProtectedRoute>
            } 
          />

          {/* Default Route - Redirect to login if not authenticated */}
          <Route path="/" element={<LoginPage />} />

          {/* Catch all route */}
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
