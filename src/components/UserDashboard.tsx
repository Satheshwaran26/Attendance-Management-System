import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mockAnnouncementService, mockAttendanceService } from '../services/mockData';
import type { Announcement, AttendanceRecord } from '../types';
import { 
  QrCode, 
  Bell, 
  User, 
  Calendar, 
  LogOut, 
  Clock,
  CheckCircle,
  AlertCircle,
  Home,
  Scan,
  History,
  Settings,
  ChevronRight,
  Star,
  TrendingUp,
  Award,
  Crown,
  Activity,
  Target,
  Zap
} from 'lucide-react';

const UserDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'scan' | 'history' | 'profile'>('home');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadDashboardData();
  }, [user, navigate]);

  const loadDashboardData = async () => {
    try {
      const [announcementsData, attendanceData] = await Promise.all([
        mockAnnouncementService.getAnnouncements(user?.id),
        mockAttendanceService.getAttendanceRecords()
      ]);

      setAnnouncements(announcementsData);
      
      // Filter attendance records for current user and get recent ones
      const userAttendance = attendanceData
        .filter(record => record.userId === user?.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);

      setRecentAttendance(userAttendance);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleScanQR = () => {
    navigate('/user/scan');
  };

  const getAttendanceStreak = () => {
    if (recentAttendance.length === 0) return 0;
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if there's attendance today or yesterday
    const hasRecentAttendance = recentAttendance.some(record => {
      const recordDate = new Date(record.timestamp);
      return recordDate.toDateString() === today.toDateString() || 
             recordDate.toDateString() === yesterday.toDateString();
    });
    
    return hasRecentAttendance ? 1 : 0;
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200 border-t-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Dashboard</h2>
          <p className="text-gray-600">Preparing your dashboard...</p>
        </div>
      </div>
    );
  }

  const renderHomeTab = () => (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-4">
              <div className="h-14 w-14 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
                <Crown className="h-7 w-7 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
                <p className="text-gray-600 text-lg">Here's your attendance overview</p>
              </div>
            </div>
          </div>
          <div className="hidden lg:flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-xl border border-green-100">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <span className="font-medium text-green-700">Active Member</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
            <TrendingUp className="h-5 w-5 text-blue-400" />
          </div>
          <p className="text-gray-500 text-sm font-medium">Total Attendance</p>
          <p className="text-3xl font-bold text-gray-900">{recentAttendance.length}</p>
          <div className="flex items-center mt-2 text-blue-600 text-sm">
            <span>Your records</span>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center border border-green-100">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
            <Star className="h-5 w-5 text-green-400" />
          </div>
          <p className="text-gray-500 text-sm font-medium">Day Streak</p>
          <p className="text-3xl font-bold text-gray-900">{getAttendanceStreak()}</p>
          <div className="flex items-center mt-2 text-green-600 text-sm">
            <span>Current streak</span>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-purple-50 rounded-xl flex items-center justify-center border border-purple-100">
              <Bell className="h-6 w-6 text-purple-600" />
            </div>
            <Zap className="h-5 w-5 text-purple-400" />
          </div>
          <p className="text-gray-500 text-sm font-medium">Announcements</p>
          <p className="text-3xl font-bold text-gray-900">{announcements.length}</p>
          <div className="flex items-center mt-2 text-purple-600 text-sm">
            <span>Active posts</span>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-orange-50 rounded-xl flex items-center justify-center border border-orange-100">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <Target className="h-5 w-5 text-orange-400" />
          </div>
          <p className="text-gray-500 text-sm font-medium">Today's Date</p>
          <p className="text-3xl font-bold text-gray-900">{new Date().getDate()}</p>
          <div className="flex items-center mt-2 text-orange-600 text-sm">
            <span>Current day</span>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Zap className="h-6 w-6 mr-3 text-blue-600" />
            Quick Actions
          </h3>
          <div className="space-y-4">
            <button
              onClick={handleScanQR}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-4 font-semibold transition-all flex items-center justify-center space-x-3"
            >
              <QrCode className="h-5 w-5" />
              <span>Scan QR Code</span>
            </button>
            <p className="text-center text-xs text-gray-500 mt-3">
              Mark your attendance by scanning the QR code
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Activity className="h-6 w-6 mr-3 text-green-600" />
            Recent Activity
          </h3>
          <div className="space-y-4">
            {recentAttendance.length > 0 ? (
              recentAttendance.slice(0, 3).map((record) => (
                <div key={record.id} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-all">
                  <div className="h-10 w-10 bg-green-100 rounded-xl flex items-center justify-center border border-green-200">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Attendance Marked</p>
                    <p className="text-xs text-gray-600">
                      {new Date(record.timestamp).toLocaleDateString()} at {new Date(record.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Clock className="h-16 w-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No attendance records yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Scan a QR code to mark your first attendance
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Announcements */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Bell className="h-6 w-6 mr-3 text-blue-600" />
          Announcements
        </h3>
        
        {announcements.length > 0 ? (
          <div className="space-y-4">
            {announcements.slice(0, 2).map((announcement) => (
              <div
                key={announcement.id}
                className="p-4 bg-blue-50 rounded-xl border border-blue-200"
              >
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {announcement.title}
                    </h4>
                    <p className="text-sm text-gray-700 mb-3">
                      {announcement.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </span>
                      {announcement.targetUserId && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs border border-blue-200">
                          Personal
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Bell className="h-16 w-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No announcements yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Check back later for updates
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderScanTab = () => (
    <div className="text-center space-y-8 py-8 lg:py-16">
      <div className="bg-blue-50 rounded-full h-32 w-32 lg:h-48 lg:w-48 mx-auto flex items-center justify-center border border-blue-200">
        <QrCode className="h-16 w-16 lg:h-24 lg:w-24 text-blue-600" />
      </div>
      
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-4">Ready to Scan</h2>
        <p className="text-gray-600 text-lg">Access the QR scanner to mark your attendance</p>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-4 justify-center items-center">
        <button
          onClick={handleScanQR}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 py-4 font-semibold shadow-sm hover:shadow-md transition-all text-lg"
        >
          <QrCode className="h-6 w-6 mr-2 inline" />
          Open Scanner
        </button>
        
        <div className="hidden lg:block text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-sm">
          <h3 className="font-semibold text-gray-900 mb-2">How it works</h3>
          <p className="text-sm text-gray-600">
            Point your camera at the QR code displayed by the admin to automatically mark your attendance.
          </p>
        </div>
      </div>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <History className="h-6 w-6 mr-3 text-purple-600" />
          Attendance History
        </h3>
        
        {recentAttendance.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {recentAttendance.map((record) => (
              <div
                key={record.id}
                className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-all"
              >
                <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center border border-green-200">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Attendance Recorded</p>
                  <p className="text-sm text-gray-600">QR: {record.qrCodeId}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(record.timestamp).toLocaleDateString()} at {new Date(record.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No attendance history</p>
            <p className="text-sm text-gray-400 mt-1">
              Your attendance records will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderProfileTab = () => (
    <div className="space-y-8">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="text-center">
          <div className="h-20 w-20 bg-blue-50 rounded-2xl mx-auto mb-4 flex items-center justify-center border border-blue-100">
            <User className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">{user.name}</h2>
          <p className="text-gray-600 text-sm">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* User Info and Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <User className="h-6 w-6 mr-3 text-blue-600" />
            Personal Information
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-gray-600">Full Name</span>
              <span className="font-semibold text-gray-900">{user.name}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-gray-600">Email</span>
              <span className="font-semibold text-gray-900">{user.email}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-gray-600">Phone</span>
              <span className="font-semibold text-gray-900">{user.phone}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <Award className="h-6 w-6 mr-3 text-yellow-500" />
            Your Stats
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
              <p className="text-2xl font-bold text-blue-600">{recentAttendance.length}</p>
              <p className="text-xs text-blue-600 font-medium">Total Attendance</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
              <p className="text-2xl font-bold text-green-600">{getAttendanceStreak()}</p>
              <p className="text-xs text-green-600 font-medium">Day Streak</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats - Desktop Only */}
      <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <TrendingUp className="h-6 w-6 mr-3 text-green-500" />
          Activity Overview
        </h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-3xl font-bold text-blue-600">{recentAttendance.length}</p>
            <p className="text-sm text-blue-600 font-medium">Total Records</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100">
            <p className="text-3xl font-bold text-green-600">{getAttendanceStreak()}</p>
            <p className="text-sm text-green-600 font-medium">Current Streak</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-100">
            <p className="text-3xl font-bold text-orange-600">{announcements.length}</p>
            <p className="text-sm text-orange-600 font-medium">Announcements</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return renderHomeTab();
      case 'scan':
        return renderScanTab();
      case 'history':
        return renderHistoryTab();
      case 'profile':
        return renderProfileTab();
      default:
        return renderHomeTab();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">User Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleScanQR}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all flex items-center space-x-2"
              >
                <QrCode className="h-5 w-5" />
                <span>Scan QR Code</span>
              </button>
              <button
                onClick={handleLogout}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-screen">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white shadow-sm border-r border-gray-200">
          <div className="p-6">
            <div className="space-y-3">
              <button
                onClick={() => setActiveTab('home')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  activeTab === 'home'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  activeTab === 'home' 
                    ? 'bg-blue-100 border border-blue-200' 
                    : 'bg-gray-100 border border-gray-200'
                }`}>
                  <Home className={`h-5 w-5 ${
                    activeTab === 'home' ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-sm">Dashboard</span>
                  <p className={`text-xs ${
                    activeTab === 'home' ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    Overview & stats
                  </p>
                </div>
                {activeTab === 'home' && (
                  <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                )}
              </button>

              <button
                onClick={() => setActiveTab('scan')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  activeTab === 'scan'
                    ? 'bg-green-50 text-green-700 border border-green-200 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  activeTab === 'scan' 
                    ? 'bg-green-100 border border-green-200' 
                    : 'bg-gray-100 border border-gray-200'
                }`}>
                  <Scan className={`h-5 w-5 ${
                    activeTab === 'scan' ? 'text-green-600' : 'text-gray-500'
                  }`} />
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-sm">QR Scanner</span>
                  <p className={`text-xs ${
                    activeTab === 'scan' ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    Mark attendance
                  </p>
                </div>
                {activeTab === 'scan' && (
                  <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                )}
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  activeTab === 'history'
                    ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  activeTab === 'history' 
                    ? 'bg-purple-100 border border-purple-200' 
                    : 'bg-gray-100 border border-gray-200'
                }`}>
                  <History className={`h-5 w-5 ${
                    activeTab === 'history' ? 'text-purple-600' : 'text-gray-500'
                  }`} />
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-sm">Attendance History</span>
                  <p className={`text-xs ${
                    activeTab === 'history' ? 'text-purple-600' : 'text-gray-500'
                  }`}>
                    View records
                  </p>
                </div>
                {activeTab === 'history' && (
                  <div className="h-2 w-2 bg-purple-600 rounded-full"></div>
                )}
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  activeTab === 'profile'
                    ? 'bg-orange-50 text-orange-700 border border-orange-200 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  activeTab === 'profile' 
                    ? 'bg-orange-100 border border-orange-200' 
                    : 'bg-gray-100 border border-gray-200'
                }`}>
                  <Settings className={`h-5 w-5 ${
                    activeTab === 'profile' ? 'text-orange-600' : 'text-gray-500'
                  }`} />
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-sm">Profile</span>
                  <p className={`text-xs ${
                    activeTab === 'profile' ? 'text-orange-600' : 'text-gray-500'
                  }`}>
                    Your info
                  </p>
                </div>
                {activeTab === 'profile' && (
                  <div className="h-2 w-2 bg-orange-600 rounded-full"></div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
