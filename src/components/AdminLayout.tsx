import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  Calendar,
  LogOut,
  Settings,
  LayoutDashboard,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { username, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigateToSection = (section: string) => {
    navigate(`/admin/${section}`);
  };

  const isActiveRoute = (route: string) => {
    return location.pathname === `/admin/${route}`;
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Top Header - Fixed */}
      <div className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center border border-blue-100 overflow-hidden">
                <img 
                  src="/src/assets/generated-image (1).png" 
                  alt="Bootcamp Portal Logo" 
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Bootcamp Portal</h1>
                <p className="text-gray-600">Student Attendance Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-all flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar Navigation */}
        <div className="w-80 bg-white shadow-sm border-r border-gray-200 flex-shrink-0">
          {/* Sidebar Header */}
         
          
          {/* Navigation Menu */}
          <div className="p-6">
            <div className="space-y-2">
              <button
                onClick={() => navigateToSection('dashboard')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  isActiveRoute('dashboard')
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center border ${
                  isActiveRoute('dashboard')
                    ? 'bg-blue-100 border-blue-200' 
                    : 'bg-gray-100 border-gray-200'
                }`}>
                  <LayoutDashboard className={`h-5 w-5 ${
                    isActiveRoute('dashboard') ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-sm">Overview</span>
                  <p className="text-xs text-gray-500">Portal statistics</p>
                </div>
                {isActiveRoute('dashboard') && (
                  <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                )}
              </button>

              <button
                onClick={() => navigateToSection('checkinout')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  isActiveRoute('checkinout')
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center border ${
                  isActiveRoute('checkinout')
                    ? 'bg-blue-100 border-blue-200' 
                    : 'bg-gray-100 border-gray-200'
                }`}>
                  <Users className={`h-5 w-5 ${
                    isActiveRoute('checkinout') ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-sm">Check-in/Out</span>
                  <p className="text-xs text-gray-500">Manage attendance status</p>
                </div>
                {isActiveRoute('checkinout') && (
                  <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                )}
              </button>

              <button
                onClick={() => navigateToSection('users')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  isActiveRoute('users')
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center border ${
                  isActiveRoute('users')
                    ? 'bg-blue-100 border-blue-200' 
                    : 'bg-gray-100 border-gray-200'
                }`}>
                  <Users className={`h-5 w-5 ${
                    isActiveRoute('users') ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-sm">User Management</span>
                  <p className="text-xs text-gray-500">Manage students & users</p>
                </div>
                {isActiveRoute('users') && (
                  <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                )}
              </button>

                                   <button
                       onClick={() => navigateToSection('attendance')}
                       className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                         isActiveRoute('attendance')
                           ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                           : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                       }`}
                     >
                       <div className={`h-10 w-10 rounded-lg flex items-center justify-center border ${
                         isActiveRoute('attendance')
                           ? 'bg-blue-100 border-blue-200' 
                           : 'bg-gray-100 border-gray-200'
                       }`}>
                         <Calendar className={`h-5 w-5 ${
                           isActiveRoute('attendance') ? 'text-blue-600' : 'text-gray-500'
                         }`} />
                       </div>
                       <div className="flex-1">
                         <span className="font-semibold text-sm">Attendance Marking</span>
                         <p className="text-xs text-gray-500">Mark & manage attendance</p>
                       </div>
                       {isActiveRoute('attendance') && (
                         <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                       )}
                     </button>

                     <button
                       onClick={() => navigateToSection('sessiondata')}
                       className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                         isActiveRoute('sessiondata')
                           ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                           : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                       }`}
                     >
                       <div className={`h-10 w-10 rounded-lg flex items-center justify-center border ${
                         isActiveRoute('sessiondata')
                           ? 'bg-blue-100 border-blue-200' 
                           : 'bg-gray-100 border-gray-200'
                       }`}>
                         <FileText className={`h-5 w-5 ${
                           isActiveRoute('sessiondata') ? 'text-blue-600' : 'text-gray-500'
                         }`} />
                       </div>
                       <div className="flex-1">
                         <span className="font-semibold text-sm">Session Data</span>
                         <p className="text-xs text-gray-500">View checkout history</p>
                       </div>
                       {isActiveRoute('sessiondata') && (
                         <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                       )}
                     </button>
                   </div>

            {/* Admin Profile Section */}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center space-x-3 mb-3">
                <div className="h-10 w-10 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
                  <span className="text-gray-600 font-bold text-sm">{username?.charAt(0).toUpperCase() || 'A'}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{username || 'Portal Admin'}</p>
                  <p className="text-xs text-gray-600">Bootcamp Manager</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content - Scrollable Container */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
