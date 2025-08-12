import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mockAttendanceService, mockQRService, mockAnnouncementService } from '../services/mockData';
import type { AttendanceRecord, QRCode, Announcement, User } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { 
  LayoutDashboard, 
  QrCode, 
  Users, 
  Calendar, 
  Bell, 
  LogOut, 
  Plus,
  Download,
  Eye,
  Trash2,
  Settings,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Activity,
  Shield,
  Crown,
  Sparkles,
  Zap,
  Target,
  Award,
  Star,
  ArrowUpRight,
  ChevronRight
} from 'lucide-react';
import QRCodeGenerator from './QRCodeGenerator.js';
import AnnouncementForm from './AnnouncementForm.js';

const AdminDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'dashboard' | 'qr' | 'users' | 'attendance' | 'announcements'>('dashboard');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [records, codes, announcementsData, usersData] = await Promise.all([
        mockAttendanceService.getAttendanceRecords(),
        mockQRService.getQRCodes(),
        mockAnnouncementService.getAnnouncements(),
        mockAttendanceService.getUsers()
      ]);
      setAttendanceRecords(records);
      setQrCodes(codes);
      setAnnouncements(announcementsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const exportAttendanceData = () => {
    const csvContent = [
      'Date,User,Time,QR Code ID',
      ...attendanceRecords.map(record => 
        `${record.timestamp.toLocaleDateString()},${record.userName},${record.timestamp.toLocaleTimeString()},${record.qrCodeId}`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getTodayAttendance = () => {
    const today = new Date().toDateString();
    return attendanceRecords.filter(record => 
      record.timestamp.toDateString() === today
    ).length;
  };

  const getActiveQRCodes = () => {
    return qrCodes.filter(qr => qr.isActive).length;
  };

  const getTotalUsers = () => {
    return users.filter(user => !user.isAdmin).length;
  };

  const getWeeklyGrowth = () => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekAttendance = attendanceRecords.filter(record => 
      new Date(record.timestamp) > lastWeek
    ).length;
    const thisWeekAttendance = getTodayAttendance();
    return thisWeekAttendance > lastWeekAttendance ? '+12%' : '-5%';
  };

  const renderDashboardSection = () => (
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
                <h1 className="text-3xl font-bold text-gray-900">Welcome back, Admin</h1>
                <p className="text-gray-600 text-lg">Here's what's happening with your attendance system</p>
              </div>
            </div>
          </div>
          <div className="hidden lg:flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <span className="font-medium text-blue-700">System Active</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <TrendingUp className="h-5 w-5 text-blue-400" />
          </div>
          <p className="text-gray-500 text-sm font-medium">Total Users</p>
          <p className="text-3xl font-bold text-gray-900">{getTotalUsers()}</p>
          <div className="flex items-center mt-2 text-blue-600 text-sm">
            <ArrowUpRight className="h-4 w-4 mr-1" />
            <span>Active members</span>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center border border-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <Activity className="h-5 w-5 text-green-400" />
          </div>
          <p className="text-gray-500 text-sm font-medium">Today's Attendance</p>
          <p className="text-3xl font-bold text-gray-900">{getTodayAttendance()}</p>
          <div className="flex items-center mt-2 text-green-600 text-sm">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span>{getWeeklyGrowth()}</span>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-purple-50 rounded-xl flex items-center justify-center border border-purple-100">
              <QrCode className="h-6 w-6 text-purple-600" />
            </div>
            <Zap className="h-5 w-5 text-purple-400" />
          </div>
          <p className="text-gray-500 text-sm font-medium">Active QR Codes</p>
          <p className="text-3xl font-bold text-gray-900">{getActiveQRCodes()}</p>
          <div className="flex items-center mt-2 text-purple-600 text-sm">
            <Target className="h-4 w-4 mr-1" />
            <span>Ready to scan</span>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-orange-50 rounded-xl flex items-center justify-center border border-orange-100">
              <Bell className="h-6 w-6 text-orange-600" />
            </div>
            <Star className="h-5 w-5 text-orange-400" />
          </div>
          <p className="text-gray-500 text-sm font-medium">Announcements</p>
          <p className="text-3xl font-bold text-gray-900">{announcements.length}</p>
          <div className="flex items-center mt-2 text-orange-600 text-sm">
            <Award className="h-4 w-4 mr-1" />
            <span>Active posts</span>
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
              onClick={() => setShowQRGenerator(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-4 font-semibold transition-all flex items-center justify-center space-x-3"
            >
              <Plus className="h-5 w-5" />
              <span>Generate New QR Code</span>
            </button>
            <button
              onClick={() => setShowAnnouncementForm(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl p-4 font-semibold transition-all flex items-center justify-center space-x-3"
            >
              <Bell className="h-5 w-5" />
              <span>Create Announcement</span>
            </button>
            <button
              onClick={exportAttendanceData}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white rounded-xl p-4 font-semibold transition-all flex items-center justify-center space-x-3"
            >
              <Download className="h-5 w-5" />
              <span>Export Data</span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Activity className="h-6 w-6 mr-3 text-green-600" />
            Recent Activity
          </h3>
          <div className="space-y-4">
            {attendanceRecords.slice(0, 5).map((record) => (
              <div key={record.id} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-all">
                <div className="h-10 w-10 bg-green-100 rounded-xl flex items-center justify-center border border-green-200">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{record.userName}</p>
                  <p className="text-sm text-gray-600">
                    {record.timestamp.toLocaleDateString()} at {record.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Shield className="h-6 w-6 mr-3 text-blue-600" />
          System Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="h-3 w-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">QR Scanner</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="h-3 w-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">Database</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="h-3 w-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">API Services</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderQRSection = () => (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
              <QrCode className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">QR Code Management</h2>
              <p className="text-gray-600">Generate and manage attendance QR codes</p>
            </div>
          </div>
          <button
            onClick={() => setShowQRGenerator(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Generate New QR</span>
          </button>
        </div>
      </div>

      {/* Main QR Code Display */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {qrCodes.length > 0 ? (
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Current Active QR Code</h3>
            
            {/* Large QR Code Display */}
            <div className="flex justify-center mb-8">
              <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 shadow-sm">
                <QRCodeSVG
                  value={qrCodes[0].code}
                  size={320}
                  level="M"
                  includeMargin={true}
                />
              </div>
            </div>

            {/* QR Code Information */}
            <div className="max-w-2xl mx-auto bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="text-center">
                  <p className="text-blue-600 font-semibold mb-2">QR Code</p>
                  <p className="font-mono text-gray-800 bg-white p-3 rounded-xl border border-gray-200">
                    {qrCodes[0].code}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-blue-600 font-semibold mb-2">Status</p>
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                    Active
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-blue-600 font-semibold mb-2">Created</p>
                  <p className="text-gray-800">
                    {qrCodes[0].createdAt.toLocaleDateString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-blue-600 font-semibold mb-2">Scanned by</p>
                  <p className="text-gray-800 font-bold text-lg">
                    {qrCodes[0].scannedBy?.length || 0} users
                  </p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center justify-center">
                <Target className="h-5 w-5 mr-2" />
                Instructions for Users
              </h4>
              <p className="text-blue-800 text-center">
                Users can scan this QR code using their mobile device's camera or any QR code scanner app to mark their attendance.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="mx-auto flex items-center justify-center h-32 w-32 rounded-full bg-blue-50 border border-blue-100 mb-6">
              <QrCode className="h-16 w-16 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No QR Code Available</h3>
            <p className="text-gray-600 mb-8 text-lg">
              Generate a new QR code to start tracking attendance.
            </p>
            <button
              onClick={() => setShowQRGenerator(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-all"
            >
              <Plus className="h-5 w-5 mr-2 inline" />
              Generate First QR Code
            </button>
          </div>
        )}
      </div>

      {/* Recent QR Codes History */}
      {qrCodes.length > 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Clock className="h-6 w-6 mr-3 text-purple-600" />
            Recent QR Codes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {qrCodes.slice(1, 4).map((qr) => (
              <div key={qr.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-sm text-gray-600 bg-white px-2 py-1 rounded-lg border border-gray-200">
                    {qr.code.substring(0, 8)}...
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    qr.isActive 
                      ? 'bg-green-100 text-green-800 border-green-200' 
                      : 'bg-red-100 text-red-800 border-red-200'
                  }`}>
                    {qr.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>Created: {qr.createdAt.toLocaleDateString()}</p>
                  <p>Scanned by: {qr.scannedBy?.length || 0} users</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderUsersSection = () => (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center border border-green-100">
            <Users className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
            <p className="text-gray-600">Manage system users and their information</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Registered Users</h3>
          <p className="text-gray-600">Total: {users.filter(user => !user.isAdmin).length} users</p>
        </div>
        <div className="overflow-y-auto max-h-96">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.filter(user => !user.isAdmin).map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                        <span className="text-blue-600 font-bold text-lg">{user.name.charAt(0)}</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-800 mr-4 transition-colors">Edit</button>
                    <button className="text-red-600 hover:text-red-800 transition-colors">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAttendanceSection = () => (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-purple-50 rounded-xl flex items-center justify-center border border-purple-100">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Attendance Records</h2>
              <p className="text-gray-600">Track and manage user attendance</p>
            </div>
          </div>
          <button
            onClick={exportAttendanceData}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2"
          >
            <Download className="h-5 w-5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Attendance History</h3>
          <p className="text-gray-600">Total records: {attendanceRecords.length}</p>
        </div>
        <div className="overflow-y-auto max-h-96">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Time</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">QR Code</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.timestamp.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-green-50 rounded-xl flex items-center justify-center border border-green-100">
                        <span className="text-green-600 font-bold text-sm">{record.userName.charAt(0)}</span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-semibold text-gray-900">{record.userName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.timestamp.toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.qrCodeId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAnnouncementsSection = () => (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-orange-50 rounded-xl flex items-center justify-center border border-orange-100">
              <Bell className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Announcements</h2>
              <p className="text-gray-600">Create and manage system announcements</p>
            </div>
          </div>
          <button
            onClick={() => setShowAnnouncementForm(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>New Announcement</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {announcements.map((announcement) => (
          <div key={announcement.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-semibold text-gray-900 text-lg">{announcement.title}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                announcement.isActive 
                  ? 'bg-green-100 text-green-800 border-green-200' 
                  : 'bg-red-100 text-red-800 border-red-200'
              }`}>
                {announcement.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-gray-600 mb-4">{announcement.message}</p>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Created: {announcement.createdAt.toLocaleDateString()}</span>
              <div className="flex space-x-2">
                <button className="text-blue-600 hover:text-blue-800 transition-colors">Edit</button>
                <button className="text-red-600 hover:text-red-800 transition-colors">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboardSection();
      case 'qr':
        return renderQRSection();
      case 'users':
        return renderUsersSection();
      case 'attendance':
        return renderAttendanceSection();
      case 'announcements':
        return renderAnnouncementsSection();
      default:
        return renderDashboardSection();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200 border-t-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Dashboard</h2>
          <p className="text-gray-600">Preparing your admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Top Header - Fixed */}
      <div className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                <Crown className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
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

      {/* Main Content Area - No Scroll */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar Navigation - Fixed */}
        <div className="w-64 bg-white shadow-sm border-r border-gray-200 flex-shrink-0">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                <Crown className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
                <p className="text-sm text-gray-600">Attendance System</p>
              </div>
            </div>
          </div>

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
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  activeSection === 'dashboard' 
                    ? 'bg-blue-100 border border-blue-200' 
                    : 'bg-gray-100 border border-gray-200'
                }`}>
                  <LayoutDashboard className={`h-5 w-5 ${
                    activeSection === 'dashboard' ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-sm">Dashboard</span>
                  <p className={`text-xs ${
                    activeSection === 'dashboard' ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    Overview & stats
                  </p>
                </div>
                {activeSection === 'dashboard' && (
                  <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                )}
              </button>

              <button
                onClick={() => setActiveSection('qr')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  activeSection === 'qr'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  activeSection === 'qr' 
                    ? 'bg-blue-100 border border-blue-200' 
                    : 'bg-gray-100 border border-gray-200'
                }`}>
                  <QrCode className={`h-5 w-5 ${
                    activeSection === 'qr' ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-sm">QR Codes</span>
                  <p className={`text-xs ${
                    activeSection === 'qr' ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    Generate & manage
                  </p>
                </div>
                {activeSection === 'qr' && (
                  <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                )}
              </button>

              <button
                onClick={() => setActiveSection('users')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  activeSection === 'users'
                    ? 'bg-green-50 text-green-700 border border-green-200 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  activeSection === 'users' 
                    ? 'bg-green-100 border border-green-200' 
                    : 'bg-gray-100 border border-gray-200'
                }`}>
                  <Users className={`h-5 w-5 ${
                    activeSection === 'users' ? 'text-green-600' : 'text-gray-500'
                  }`} />
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-sm">Users</span>
                  <p className={`text-xs ${
                    activeSection === 'users' ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    Manage members
                  </p>
                </div>
                {activeSection === 'users' && (
                  <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                )}
              </button>

              <button
                onClick={() => setActiveSection('attendance')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  activeSection === 'attendance'
                    ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  activeSection === 'attendance' 
                    ? 'bg-purple-100 border border-purple-200' 
                    : 'bg-gray-100 border border-gray-200'
                }`}>
                  <Calendar className={`h-5 w-5 ${
                    activeSection === 'attendance' ? 'text-purple-600' : 'text-gray-500'
                  }`} />
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-sm">Attendance</span>
                  <p className={`text-xs ${
                    activeSection === 'attendance' ? 'text-purple-600' : 'text-gray-500'
                  }`}>
                    Records & reports
                  </p>
                </div>
                {activeSection === 'attendance' && (
                  <div className="h-2 w-2 bg-purple-600 rounded-full"></div>
                )}
              </button>

              <button
                onClick={() => setActiveSection('announcements')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  activeSection === 'announcements'
                    ? 'bg-orange-50 text-orange-700 border border-orange-200 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  activeSection === 'announcements' 
                    ? 'bg-orange-100 border border-orange-200' 
                    : 'bg-gray-100 border border-gray-200'
                }`}>
                  <Bell className={`h-5 w-5 ${
                    activeSection === 'announcements' ? 'text-orange-600' : 'text-gray-500'
                  }`} />
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-sm">Announcements</span>
                  <p className={`text-xs ${
                    activeSection === 'announcements' ? 'text-orange-600' : 'text-gray-500'
                  }`}>
                    Create & manage
                  </p>
                </div>
                {activeSection === 'announcements' && (
                  <div className="h-2 w-2 bg-orange-600 rounded-full"></div>
                )}
              </button>
            </div>

            {/* Quick Stats */}
            <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick Stats</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Active Users</span>
                  <span className="font-semibold text-blue-600">{getTotalUsers()}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Today's Attendance</span>
                  <span className="font-semibold text-green-600">{getTodayAttendance()}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Active QR Codes</span>
                  <span className="font-semibold text-purple-600">{getActiveQRCodes()}</span>
                </div>
              </div>
            </div>

            {/* User Profile Section */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center border border-blue-200">
                  <span className="text-blue-600 font-bold text-sm">{user?.name?.charAt(0) || 'A'}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{user?.name || 'Admin'}</p>
                  <p className="text-xs text-gray-600">Administrator</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="h-8 w-8 bg-white hover:bg-blue-100 rounded-lg flex items-center justify-center transition-all border border-blue-200"
                >
                  <LogOut className="h-4 w-4 text-blue-600" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Scrollable Container */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="p-8">
              <div className="max-w-7xl mx-auto">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showQRGenerator && (
        <QRCodeGenerator
          onClose={() => setShowQRGenerator(false)}
          onGenerated={(qr: QRCode) => {
            setShowQRGenerator(false);
            loadData();
          }}
        />
      )}

      {showAnnouncementForm && (
        <AnnouncementForm
          onClose={() => setShowAnnouncementForm(false)}
          onCreate={(announcement: Announcement) => {
            setShowAnnouncementForm(false);
            loadData();
          }}
          users={users}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
