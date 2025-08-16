import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Users,
  Clock,
  LayoutDashboard, 
  Plus,
  BarChart3,
  Settings
} from 'lucide-react';
import CheckInOutPage from './CheckInOutPage';
import UserManagementPage from './UserManagementPage';
import AttendanceMarkingPage from './AttendanceMarkingPage';
import CheckoutDataPage from './CheckoutDataPage';

const AdminDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<string>('dashboard');

  useEffect(() => {
    const section = searchParams.get('section');
    if (section) {
      setActiveSection(section);
    }
  }, [searchParams]);

  const renderSection = () => {
    switch (activeSection) {
      case 'checkinout':
        return <CheckInOutPage />;
      case 'users':
        return <UserManagementPage />;
      case 'attendance':
        return <AttendanceMarkingPage />;
      case 'checkoutdata':
        return <CheckoutDataPage />;
      default:
        return <DashboardOverview />;
    }
  };

  const DashboardOverview: React.FC = () => (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Bootcamp Portal</h1>
          <p className="text-gray-600">Manage your bootcamp attendance system efficiently</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm font-medium">Total Students</p>
            <p className="text-3xl font-bold text-gray-900">1,247</p>
            <p className="text-green-600 text-sm">+12% from last month</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center border border-green-100">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm font-medium">Present Today</p>
            <p className="text-3xl font-bold text-gray-900">1,189</p>
            <p className="text-green-600 text-sm">95.3% attendance</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-yellow-50 rounded-xl flex items-center justify-center border border-yellow-100">
                <BarChart3 className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm font-medium">Reports Generated</p>
            <p className="text-3xl font-bold text-gray-900">156</p>
            <p className="text-purple-600 text-sm">This month</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setActiveSection('checkinout')}
                className="p-4 bg-blue-50 rounded-xl border border-blue-200 hover:bg-blue-100 transition-all text-left"
              >
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <p className="font-semibold text-blue-900">Attendance Status</p>
                <p className="text-sm text-blue-700">Check-in/out students</p>
              </button>
              
              <button
                onClick={() => setActiveSection('users')}
                className="p-4 bg-green-50 rounded-xl border border-green-200 hover:bg-green-100 transition-all text-left"
              >
                <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                  <Plus className="h-5 w-5 text-green-600" />
                </div>
                <p className="font-semibold text-green-900">Student Directory</p>
                <p className="text-sm text-green-700">Manage student records</p>
              </button>
              
              <button
                onClick={() => setActiveSection('attendance')}
                className="p-4 bg-yellow-50 rounded-xl border border-yellow-200 hover:bg-yellow-100 transition-all text-left"
              >
                <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center mb-2">
                  <BarChart3 className="h-5 w-5 text-yellow-600" />
                </div>
                <p className="font-semibold text-yellow-900">Mark Present</p>
                <p className="text-sm text-yellow-700">Record student attendance</p>
              </button>
              
              <button
                onClick={() => setActiveSection('checkoutdata')}
                className="p-4 bg-purple-50 rounded-xl border border-purple-200 hover:bg-purple-100 transition-all text-left"
              >
                <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <p className="font-semibold text-purple-900">Checkout Data</p>
                <p className="text-sm text-purple-700">Session history & analytics</p>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Student checked in</p>
                  <p className="text-xs text-gray-500">ID: 23127046 - 2 minutes ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">New student enrolled</p>
                  <p className="text-xs text-gray-500">Rahul Kumar - 15 minutes ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Attendance report</p>
                  <p className="text-xs text-gray-500">Monthly summary - 1 hour ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Portal Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-800">QR Scanner Ready</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-800">Database Connected</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-800">Portal Services Active</span>
            </div>
          </div>
        </div>
        </div>
      </div>
    );

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Top Header - Fixed */}
      <div className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
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
                onClick={() => setActiveSection('dashboard')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  activeSection === 'dashboard'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center border ${
                  activeSection === 'dashboard' 
                    ? 'bg-blue-100 border-blue-200' 
                    : 'bg-gray-100 border-gray-200'
                }`}>
                  <LayoutDashboard className={`h-5 w-5 ${
                    activeSection === 'dashboard' ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-sm">Overview</span>
                  <p className="text-xs text-gray-500">Portal statistics</p>
                </div>
                {activeSection === 'dashboard' && (
                  <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                )}
              </button>

              <button
                onClick={() => setActiveSection('checkinout')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  activeSection === 'checkinout' 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center border ${
                  activeSection === 'checkinout' 
                    ? 'bg-blue-100 border-blue-200' 
                    : 'bg-gray-100 border-gray-200'
                }`}>
                  <Users className={`h-5 w-5 ${
                    activeSection === 'checkinout' ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-sm">Check-in/Out</span>
                  <p className="text-xs text-gray-500">Manage attendance status</p>
                </div>
                {activeSection === 'checkinout' && (
                  <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                )}
              </button>

              <button
                onClick={() => setActiveSection('users')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  activeSection === 'users' 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center border ${
                  activeSection === 'users' 
                    ? 'bg-blue-100 border-blue-200' 
                    : 'bg-gray-100 border-gray-200'
                }`}>
                  <Users className={`h-5 w-5 ${
                    activeSection === 'users' ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-sm">User Management</span>
                  <p className="text-xs text-gray-500">Manage students & users</p>
                </div>
                {activeSection === 'users' && (
                  <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                )}
              </button>

              <button
                onClick={() => setActiveSection('attendance')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  activeSection === 'attendance'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center border ${
                  activeSection === 'attendance' 
                    ? 'bg-blue-100 border-blue-200' 
                    : 'bg-gray-100 border-gray-200'
                }`}>
                  <BarChart3 className={`h-5 w-5 ${
                    activeSection === 'attendance' ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-sm">Attendance Marking</span>
                  <p className="text-xs text-gray-500">Mark & manage attendance</p>
                </div>
                {activeSection === 'attendance' && (
                  <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                )}
              </button>

              <button
                onClick={() => setActiveSection('checkoutdata')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  activeSection === 'checkoutdata'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center border ${
                  activeSection === 'checkoutdata' 
                    ? 'bg-blue-100 border-blue-200' 
                    : 'bg-gray-100 border-gray-200'
                }`}>
                  <BarChart3 className={`h-5 w-5 ${
                    activeSection === 'checkoutdata' ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-sm">Checkout Data</span>
                  <p className="text-xs text-gray-500">Session history & analytics</p>
                </div>
                {activeSection === 'checkoutdata' && (
                  <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                )}
              </button>
        </div>

            {/* Admin Profile Section */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center border border-blue-200">
                  <span className="text-blue-600 font-bold text-sm">A</span>
                      </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Portal Admin</p>
                  <p className="text-xs text-gray-600">Bootcamp Manager</p>
                  </div>
                </div>
                  </div>
                </div>
              </div>

        {/* Main Content - Scrollable Container */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
