import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Crown, 
  LayoutDashboard,
  Users,
  GraduationCap,
  Building,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Stats {
  total: number;
  byDepartment: { [key: string]: number };
  byYear: { [key: number]: number };
}

const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://attendance-v2-jius.onrender.com'
  : 'http://localhost:5000/api';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ total: 0, byDepartment: {}, byYear: {} });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<Array<{type: string, message: string, time: string}>>([]);

  useEffect(() => {
    fetchStats();
    generateRecentActivity();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      console.log('Fetching stats from:', `${API_BASE}/students/stats`);
      
      const response = await fetch(`${API_BASE}/students/stats`);
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Stats data received:', data);
        setStats(data);
      } else {
        const errorText = await response.text();
        console.error('Response not ok. Status:', response.status, 'Error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set some default stats to prevent 0 values
      setStats({
        total: 0,
        byDepartment: {},
        byYear: {}
      });
    } finally {
      setLoading(false);
    }
  };

  const generateRecentActivity = () => {
    const activities = [
      { type: 'success', message: 'Database connection established', time: 'Just now' },
      { type: 'info', message: 'Student statistics loaded', time: '2 min ago' },
      { type: 'success', message: 'All departments configured', time: '5 min ago' }
    ];
    setRecentActivity(activities);
  };

  const navigateToSection = (section: string) => {
    navigate(`/${section}`);
  };

  const getTopDepartments = () => {
    return Object.entries(stats.byDepartment)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([dept, count]) => ({ name: dept, count }));
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'info':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'warning':
        return <TrendingUp className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
    
      <div className="max- mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
             
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Welcome to Bootcamp Attendance Portal</h1>
                <p className="text-gray-600 text-lg">Manage your multi-department student attendance system</p>
              </div>
            </div>
            
            {/* Manual Refresh Button */}
            <button
              onClick={fetchStats}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all flex items-center space-x-2"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Refresh Stats</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Students</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                <p className="text-xs text-gray-500">Across all departments</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center border border-green-100">
                <Building className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Departments</p>
                <p className="text-2xl font-bold text-green-900">{Object.keys(stats.byDepartment).length}</p>
                <p className="text-xs text-gray-500">Active departments</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-purple-50 rounded-xl flex items-center justify-center border border-purple-100">
                <GraduationCap className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-purple-600 font-medium">Class Years</p>
                <p className="text-2xl font-bold text-purple-900">{Object.keys(stats.byYear).length}</p>
                <p className="text-xs text-gray-500">Academic levels</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-orange-50 rounded-xl flex items-center justify-center border border-orange-100">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-orange-600 font-medium">Largest Dept</p>
                <p className="text-lg font-bold text-orange-900">
                  {Object.entries(stats.byDepartment).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
                </p>
                <p className="text-xs text-gray-500">Most students</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <button
            onClick={() => navigateToSection('checkin')}
            className="bg-white hover:bg-blue-50 border border-blue-200 hover:border-blue-300 rounded-2xl p-6 text-left transition-all hover:shadow-lg group"
              >
            <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100 group-hover:bg-blue-100 transition-colors mb-4">
              <Plus className="h-6 w-6 text-blue-600" />
                </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Check-in/Out</h3>
            <p className="text-sm text-gray-600">Mark student attendance and manage sessions</p>
              </button>
              
              <button
            onClick={() => navigateToSection('users')}
            className="bg-white hover:bg-green-50 border border-green-200 hover:border-green-300 rounded-2xl p-6 text-left transition-all hover:shadow-lg group"
              >
            <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center border border-green-100 group-hover:bg-green-100 transition-colors mb-4">
              <Users className="h-6 w-6 text-green-600" />
                </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">User Management</h3>
            <p className="text-sm text-gray-600">View, add, and manage all students</p>
              </button>
              
              <button
            onClick={() => navigateToSection('attendance')}
            className="bg-white hover:bg-purple-50 border border-purple-200 hover:border-purple-300 rounded-2xl p-6 text-left transition-all hover:shadow-lg group"
              >
            <div className="h-12 w-12 bg-purple-50 rounded-xl flex items-center justify-center border border-purple-100 group-hover:bg-purple-100 transition-colors mb-4">
              <Crown className="h-6 w-6 text-purple-600" />
                </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Attendance Marking</h3>
            <p className="text-sm text-gray-600">Mark daily attendance for students</p>
              </button>
              
              <button
            onClick={() => navigateToSection('session-data')}
            className="bg-white hover:bg-orange-50 border border-orange-200 hover:border-orange-300 rounded-2xl p-6 text-left transition-all hover:shadow-lg group"
          >
            <div className="h-12 w-12 bg-orange-50 rounded-xl flex items-center justify-center border border-orange-100 group-hover:bg-orange-100 transition-colors mb-4">
              <LayoutDashboard className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Session Data</h3>
            <p className="text-sm text-gray-600">View session statistics and reports</p>
          </button>
              </div>
              
        {/* Department Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-gray-600" />
            Department Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {getTopDepartments().map((dept, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                <p className="text-sm text-gray-600 font-medium mb-2 line-clamp-2">{dept.name}</p>
                <p className="text-xl font-bold text-gray-900">{dept.count}</p>
                <p className="text-xs text-gray-500">students</p>
              </div>
            ))}
                </div>
          {Object.keys(stats.byDepartment).length > 6 && (
            <div className="text-center mt-4">
              <p className="text-sm text-gray-500">
                +{Object.keys(stats.byDepartment).length - 6} more departments
              </p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-600" />
            Recent Activity
          </h2>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className={`flex items-center gap-3 p-4 rounded-xl border ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
                <span className="text-sm text-gray-700 flex-1">{activity.message}</span>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            ))}
            <div className="text-center pt-4">
              <button 
                onClick={generateRecentActivity}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Refresh Activity
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
