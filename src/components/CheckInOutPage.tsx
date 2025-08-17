import React, { useState, useEffect } from 'react';
import type { AttendanceRecord } from '../types';
import { 
  Search,
  CheckCircle,
  LogOut,
  Users,
  Clock,
  Lock,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';

const CheckInOutPage: React.FC = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'checked-in' | 'checked-out'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showCheckoutAllModal, setShowCheckoutAllModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedSession, setSelectedSession] = useState<'session1' | 'session2'>('session1');
  const [showIndividualCheckoutModal, setShowIndividualCheckoutModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<AttendanceRecord | null>(null);
  const [individualSession, setIndividualSession] = useState<'session1' | 'session2'>('session1');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [isIndividualCheckoutProcessing, setIsIndividualCheckoutProcessing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [isPasswordVerifying, setIsPasswordVerifying] = useState(false);

  const API_BASE = 'http://localhost:5000/api';

  // Password verification function
  const verifyPassword = async () => {
    if (!password.trim()) {
      setPasswordError('Password is required');
      return false;
    }

    setIsPasswordVerifying(true);
    setPasswordError('');

    try {
      // Simple password check - you can modify this to use a more secure method
      if (password === 'admin123') { // Change this to your desired password
        setShowPasswordModal(false);
        setPassword('');
        setPasswordError('');
        handlePasswordVerified(); // Call this function when password is verified
        return true;
      } else {
        setPasswordError('Incorrect password');
        return false;
      }
    } catch (error) {
      setPasswordError('Password verification failed');
      return false;
    } finally {
      setIsPasswordVerifying(false);
    }
  };

  const checkDatabaseStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/health`);
      if (response.ok) {
        setDbStatus('connected');
      } else {
        setDbStatus('disconnected');
      }
    } catch (error) {
      setDbStatus('disconnected');
    }
  };

  useEffect(() => {
    checkDatabaseStatus();
    loadData();
    
    // Listen for attendance updates from other components
    const handleAttendanceUpdate = (event: any) => {
      console.log('Attendance update detected, refreshing data...', event.detail);
      // Clear any existing data and reload fresh
      setAttendanceRecords([]);
      setFilteredRecords([]);
      loadData();
    };
    
    // Listen for new students being marked present
    const handleStudentCheckedIn = (event: any) => {
      console.log('New student checked in:', event.detail);
      // Immediately add the new student to the list
      const newStudent = {
        id: event.detail.studentId,
        userId: event.detail.registerNumber,
        userName: event.detail.studentName,
        timestamp: new Date(event.detail.checkInTime),
        checkoutTime: undefined,
        checkedOut: false,
        qrCodeId: event.detail.studentId
      };
      
      setAttendanceRecords(prev => {
        // Check if student already exists
        const exists = prev.some(s => s.id === newStudent.id);
        if (!exists) {
          return [...prev, newStudent];
        }
        return prev;
      });
    };
    
    // Listen for students who are already present (re-registration attempt)
    const handleStudentAlreadyPresent = (event: any) => {
      console.log('Student already present (re-registration attempt):', event.detail);
      // Don't add to list since they're already there
      // Just ensure they remain visible on the CheckIn/Out page
    };
    
    // Listen for page visibility changes to refresh data when tab becomes active
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible, refreshing data...');
        loadData();
      }
    };
    
    window.addEventListener('attendanceUpdated', handleAttendanceUpdate);
    window.addEventListener('studentCheckedIn', handleStudentCheckedIn);
    window.addEventListener('studentAlreadyPresent', handleStudentAlreadyPresent);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set up periodic refresh every 30 seconds to keep data current
    const intervalId = setInterval(() => {
      console.log('Periodic refresh - checking for new data...');
      loadData();
    }, 30000); // 30 seconds
    
    return () => {
      window.removeEventListener('attendanceUpdated', handleAttendanceUpdate);
      window.removeEventListener('studentCheckedIn', handleStudentCheckedIn);
      window.removeEventListener('studentAlreadyPresent', handleStudentAlreadyPresent);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    filterRecords();
  }, [attendanceRecords, searchTerm, filterStatus]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      console.log('Loading fresh attendance data...');
      
      // Add cache-busting parameter to ensure fresh data
      const timestamp = new Date().getTime();
      
      // Load students and attendance records with fresh data
      const [studentsResponse, attendanceResponse] = await Promise.all([
        fetch(`${API_BASE}/students?t=${timestamp}`),
        fetch(`${API_BASE}/attendance?t=${timestamp}`)
      ]);

      if (!studentsResponse.ok || !attendanceResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const students = await studentsResponse.json();
      const attendance = await attendanceResponse.json();

      console.log('Fresh students loaded:', students.length);
      console.log('Fresh attendance records loaded:', attendance.length);

      // Transform attendance records to match our interface
      const transformedRecords: AttendanceRecord[] = attendance.map((record: any) => {
        const student = students.find((s: any) => s.id.toString() === record.student_id.toString());
        if (!student) return null;

        return {
          id: record.id.toString(),
          userId: student.register_number,
          userName: student.name,
          timestamp: new Date(record.check_in_time || record.date),
          checkoutTime: record.check_out_time ? new Date(record.check_out_time) : undefined,
          checkedOut: !!record.check_out_time,
          qrCodeId: record.id.toString()
        };
      }).filter(Boolean);

      console.log('Fresh transformed records:', transformedRecords.length);
      console.log('Transformed records details:', transformedRecords);
      
      // Only show students who are currently present (not checked out)
      const presentRecords = transformedRecords.filter(record => !record.checkedOut);
      console.log('Present students:', presentRecords.length);
      console.log('Present students details:', presentRecords);
      
      setAttendanceRecords(presentRecords);
    } catch (error) {
      console.error('Error loading data:', error);
      setAttendanceRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = attendanceRecords;

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(record =>
        record.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.userId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    switch (filterStatus) {
      case 'checked-in':
        filtered = filtered.filter(record => !record.checkedOut);
        break;
      case 'checked-out':
        filtered = filtered.filter(record => record.checkedOut);
        break;
      default:
        // Show only present students (not checked out) by default
        filtered = filtered.filter(record => !record.checkedOut);
        break;
    }

    setFilteredRecords(filtered);
  };

  const handleCheckout = async (recordId: string) => {
    try {
      // Clear any existing messages
      setSuccessMessage('');
      setPasswordError('');
      
      // Find the record to checkout
      const record = attendanceRecords.find(r => r.id === recordId);
      if (!record) return;

      // Update the record in the backend
      const response = await fetch(`${API_BASE}/attendance/${recordId}/checkout`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          check_out_time: new Date().toISOString(),
          session: 'session1' // Default to session1 for individual checkouts
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Checkout error response:', errorData);
        throw new Error(errorData.error || 'Failed to checkout user');
      }

      // Remove the student from the list immediately
      const remainingRecords = attendanceRecords.filter(r => r.id !== recordId);
      setAttendanceRecords(remainingRecords);
      
      // Show success message
      setSuccessMessage(`Successfully checked out ${record.userName}!`);
      
      // Dispatch event to notify other components (like SessionDataPage)
      window.dispatchEvent(new CustomEvent('attendanceUpdated', { 
        detail: { 
          action: 'checkout', 
          studentId: record.id, 
          studentName: record.userName,
          timestamp: new Date().toISOString()
        } 
      }));
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
      // Reload data to ensure consistency
      await loadData();
    } catch (error) {
      console.error('Error checking out user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setPasswordError(`Failed to checkout: ${errorMessage}`);
    }
  };

  const handleIndividualCheckout = (recordId: string) => {
    const student = attendanceRecords.find(record => record.id === recordId);
    if (student) {
      setSelectedStudent(student);
      setIndividualSession('session1');
      setCheckoutNotes('');
      setShowPasswordModal(true); // Show password modal first
    }
  };

  const handlePasswordVerified = () => {
    setShowIndividualCheckoutModal(true); // Show individual checkout modal after password verification
  };

  const handleCheckoutAll = async () => {
    if (adminPassword !== 'admin123') {
      setPasswordError('Invalid password');
      return;
    }

    if (!selectedSession) {
      setPasswordError('Please select a session (Session 1 or Session 2)');
      return;
    }

    setIsProcessing(true);
    try {
      // Clear any existing messages
      setSuccessMessage('');
      setPasswordError('');
      
      // Get all records that are currently checked in (not checked out)
      const recordsToCheckout = attendanceRecords.filter(record => !record.checkedOut);
      
      if (recordsToCheckout.length === 0) {
        setPasswordError('No students to checkout.');
        return;
      }

      // First try batch checkout
      try {
        const batchResponse = await fetch(`${API_BASE}/attendance/batch-checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            records: recordsToCheckout.map(record => ({
              id: record.id,
              student_id: record.userId,
              check_out_time: new Date().toISOString(),
              session: selectedSession
            }))
          }),
        });

        if (batchResponse.ok) {
          // All records were checked out successfully
          const successCount = recordsToCheckout.length;
          const successfulCheckouts = recordsToCheckout.map(record => ({
            id: record.id,
            name: record.userName,
            registerNumber: record.userId,
            checkInTime: record.timestamp.toISOString(),
            checkOutTime: new Date().toISOString(),
            session: selectedSession
          }));

          setAttendanceRecords(prev => prev.filter(record => 
            !recordsToCheckout.some(r => r.id === record.id)
          ));
          
          setSuccessMessage(`Successfully checked out ${successCount} students for ${
            selectedSession === 'session1' ? 'Session 1 (Morning)' : 'Session 2 (Afternoon)'
          }`);

          // Dispatch event to notify other components (like SessionDataPage)
          window.dispatchEvent(new CustomEvent('attendanceUpdated', { 
            detail: { 
              action: 'checkoutAll', 
              count: successCount, 
              session: selectedSession,
              timestamp: new Date().toISOString(),
              students: successfulCheckouts,
              date: new Date().toISOString().split('T')[0]
            } 
          }));
          
          // Also dispatch a specific event for Session Data page
          const sessionDataEvent = new CustomEvent('sessionDataUpdated', {
            detail: {
              action: 'checkoutAll',
              session: selectedSession,
              students: successfulCheckouts.map(sc => ({
                id: sc.id,
                studentId: sc.registerNumber,
                studentName: sc.name,
                checkInTime: sc.checkInTime,
                checkOutTime: sc.checkOutTime,
                session: sc.session,
                date: new Date().toISOString().split('T')[0]
              }))
            }
          });
          window.dispatchEvent(sessionDataEvent);

          setShowCheckoutAllModal(false);
          setAdminPassword('');
          
          await loadData();
          return;
        }
      } catch (error) {
        console.error('Batch checkout failed, falling back to individual checkouts:', error);
      }

      // If batch checkout fails, fall back to individual checkouts
      let successCount = 0;
      const successfulCheckouts: Array<{
        id: string;
        name: string;
        registerNumber: string;
        checkInTime: string;
        checkOutTime: string;
        session: string;
      }> = [];
      const failedCheckouts: AttendanceRecord[] = [];

      for (const record of recordsToCheckout) {
        try {
          const response = await fetch(`${API_BASE}/attendance/${record.id}/checkout`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              student_id: record.userId,
              check_out_time: new Date().toISOString(),
              session: selectedSession
            }),
          });

          if (response.ok) {
            successCount++;
            successfulCheckouts.push({
              id: record.id,
              name: record.userName,
              registerNumber: record.userId,
              checkInTime: record.timestamp.toISOString(),
              checkOutTime: new Date().toISOString(),
              session: selectedSession
            });
          } else {
            failedCheckouts.push(record);
            const errorData = await response.json().catch(() => ({}));
            console.error(`Failed to checkout ${record.userName}:`, errorData);
          }
        } catch (error) {
          failedCheckouts.push(record);
          console.error(`Error checking out ${record.userName}:`, error);
        }
      }

      // Update UI based on results
      if (successCount > 0) {
        // Remove checked-out students from the list immediately
        setAttendanceRecords(prev => prev.filter(record => 
          !successfulCheckouts.some(sc => sc.id === record.id)
        ));
        
        // Show success message
        const message = `Successfully checked out ${successCount} students for ${
          selectedSession === 'session1' ? 'Session 1 (Morning)' : 'Session 2 (Afternoon)'
        }${failedCheckouts.length > 0 ? ` (${failedCheckouts.length} failed)` : ''}`;
        setSuccessMessage(message);

        // Notify other components
        window.dispatchEvent(new CustomEvent('attendanceUpdated', {
          detail: {
            action: 'checkoutAll',
            count: successCount,
            session: selectedSession,
            timestamp: new Date().toISOString(),
            students: successfulCheckouts
          }
        }));

        // Close modal and clear form
        setShowCheckoutAllModal(false);
        setAdminPassword('');

        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
        
        // Refresh data to ensure consistency
        await loadData();
      } else {
        setPasswordError(`Failed to checkout any students. ${failedCheckouts.length} attempts failed. Please try again.`);
      }
    } catch (error: any) {
      console.error('Error during checkout:', error);
      setPasswordError('Failed to checkout students. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };



  const getStats = () => {
    const total = attendanceRecords.filter(record => !record.checkedOut).length; // Only count present students
    const checkedIn = attendanceRecords.filter(record => !record.checkedOut).length;
    const checkedOut = attendanceRecords.filter(record => record.checkedOut).length;
    
    return { total, checkedIn, checkedOut };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200 border-t-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600">Preparing check-in/out data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Main Content Area - No Scroll */}
      <div className="flex flex-1 min-h-0">
        {/* Main Content - Scrollable Container */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="p-8">
              <div className="max-w-7xl mx-auto">
                {/* Header with Database Status */}
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Check-in/Check-out Management</h1>
                  <p className="text-gray-600">Monitor present students and manage check-outs. Data refreshes automatically.</p>
                  
                  {/* Database Connection Status */}
                  <div className="mt-4 flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      dbStatus === 'connected' ? 'bg-green-500' : 
                      dbStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}></div>
                    <span className={`text-sm font-medium ${
                      dbStatus === 'connected' ? 'text-green-600' : 
                      dbStatus === 'disconnected' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      Database: {dbStatus === 'connected' ? 'Connected' : 
                                 dbStatus === 'disconnected' ? 'Disconnected' : 'Checking...'}
                    </span>
                  </div>

                  {/* Success Message */}
                  {successMessage && (
                    <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-green-700 font-medium">{successMessage}</span>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {passwordError && (
                    <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200">
                      <div className="flex items-center space-x-2">
                        <div className="h-5 w-5 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-red-600 font-bold text-xs">!</span>
                        </div>
                        <span className="text-red-700 font-medium">{passwordError}</span>
                      </div>
                    </div>
                  )}

                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">Present Students</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center border border-green-100">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">Present Today</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.checkedIn}</p>
                  </div>
                  
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-12 w-12 bg-purple-50 rounded-xl flex items-center justify-center border border-purple-100">
                        <LogOut className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">Checked Out</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.checkedOut}</p>
                  </div>
                </div>

                {/* Controls */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search by name or register number..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>

                      {/* Filter */}
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as 'all' | 'checked-in' | 'checked-out')}
                        className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="all">Present Students</option>
                        <option value="checked-in">Present Today</option>
                        <option value="checked-out">Checked Out</option>
                      </select>
                    </div>

                    <div className="flex space-x-3">
                      {/* Refresh Button */}
                      <button
                        onClick={() => {
                          console.log('Manual refresh from controls triggered');
                          loadData();
                        }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all flex items-center space-x-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span>Refresh Data</span>
                      </button>

                      {/* Checkout All Button */}
                      <button
                        onClick={() => setShowCheckoutAllModal(true)}
                        disabled={stats.checkedIn === 0}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-xl font-medium transition-all flex items-center space-x-2 disabled:cursor-not-allowed"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Checkout All</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Records Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Student
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Register Number
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Check-in Time
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Check-out Time
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredRecords.map((record) => (
                          <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                                  <span className="text-blue-600 font-bold text-sm">{record.userName.charAt(0)}</span>
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-semibold text-gray-900">{record.userName}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                              {record.userId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {record.timestamp.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {record.checkoutTime ? record.checkoutTime.toLocaleString() : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                record.checkedOut 
                                  ? 'bg-green-100 text-green-800 border border-green-200' 
                                  : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                              }`}>
                                {record.checkedOut ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Checked Out
                                  </>
                                ) : (
                                  <>
                                    <Clock className="h-3 w-3 mr-1" />
                                    Present
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {!record.checkedOut && (
                                <button
                                  onClick={() => handleIndividualCheckout(record.id)}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded-lg transition-all flex items-center space-x-1"
                                >
                                  <LogOut className="h-4 w-4" />
                                  <span>Checkout</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {filteredRecords.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                              No records found matching your criteria
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout All Modal */}
      {showCheckoutAllModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 bg-red-50 rounded-2xl mb-4 border border-red-100">
                  <Lock className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Checkout All Users
                </h2>
                <p className="text-gray-600">
                  This action will checkout all currently present users. Please enter the admin password to confirm.
                </p>
              </div>

                             <div className="space-y-4">
                {/* Session Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Session *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedSession('session1')}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        selectedSession === 'session1'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-lg font-semibold">Session 1</div>
                        <div className="text-sm opacity-75">Morning</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedSession('session2')}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        selectedSession === 'session2'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-lg font-semibold">Session 2</div>
                        <div className="text-sm opacity-75">Afternoon</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Password *
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => {
                        setAdminPassword(e.target.value);
                        setPasswordError('');
                      }}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all pr-12"
                      placeholder="Enter admin password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="mt-1 text-sm text-red-600">{passwordError}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Demo password: admin123
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCheckoutAllModal(false);
                    setAdminPassword('');
                    setPasswordError('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCheckoutAll}
                  disabled={!adminPassword.trim() || !selectedSession || isProcessing}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-xl font-medium transition-all disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4" />
                      <span>Checkout All</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Verification Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 bg-blue-50 rounded-2xl mb-4 border border-blue-100">
                  <Lock className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Password Verification
                </h2>
                <p className="text-gray-600">
                  Please enter the admin password to confirm this action.
                </p>
              </div>

              <div className="space-y-4">
                {/* Password Input */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Password *
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                      placeholder="Enter admin password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="mt-1 text-sm text-red-600">{passwordError}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Demo password: admin123
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPassword('');
                    setPasswordError('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={verifyPassword}
                  disabled={isPasswordVerifying}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl font-medium transition-all disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isPasswordVerifying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      <span>Verify Password</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Individual Checkout Modal */}
      {showIndividualCheckoutModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 bg-red-50 rounded-2xl mb-4 border border-red-100">
                  <Lock className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Individual Checkout for {selectedStudent.userName}
                </h2>
                <p className="text-gray-600">
                  Please enter the admin password to confirm this individual checkout.
                </p>
              </div>

              <div className="space-y-4">
                {/* Session Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Session *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setIndividualSession('session1')}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        individualSession === 'session1'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-lg font-semibold">Session 1</div>
                        <div className="text-sm opacity-75">Morning</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIndividualSession('session2')}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        individualSession === 'session2'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-lg font-semibold">Session 2</div>
                        <div className="text-sm opacity-75">Afternoon</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Checkout Notes */}
                <div>
                  <label htmlFor="checkoutNotes" className="block text-sm font-medium text-gray-700 mb-2">
                    Checkout Notes (Optional)
                  </label>
                  <textarea
                    id="checkoutNotes"
                    value={checkoutNotes}
                    onChange={(e) => setCheckoutNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Add any notes for the checkout..."
                  />
                </div>

                {/* Password Input */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Password *
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                      placeholder="Enter admin password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="mt-1 text-sm text-red-600">{passwordError}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Demo password: admin123
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowIndividualCheckoutModal(false);
                    setSelectedStudent(null);
                    setPassword('');
                    setPasswordError('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (await verifyPassword()) {
                      setIsIndividualCheckoutProcessing(true);
                      try {
                        const response = await fetch(`${API_BASE}/attendance/${selectedStudent.id}/checkout`, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            check_out_time: new Date().toISOString(),
                            session: individualSession,
                            notes: checkoutNotes
                          }),
                        });

                        if (response.ok) {
                          const updatedRecord = {
                            ...selectedStudent,
                            checkedOut: true,
                            checkoutTime: new Date(),
                            notes: checkoutNotes
                          };
                          setAttendanceRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
                          setSuccessMessage(`Successfully checked out ${updatedRecord.userName}!`);
                          
                          // Dispatch event to add student to session data
                          window.dispatchEvent(new CustomEvent('studentAddedToSession', { 
                            detail: { 
                              action: 'individualCheckout', 
                              studentId: updatedRecord.id, 
                              studentName: updatedRecord.userName,
                              registerNumber: updatedRecord.userId,
                              session: individualSession,
                              checkInTime: updatedRecord.timestamp.toISOString(),
                              checkOutTime: new Date().toISOString(),
                              notes: checkoutNotes,
                              timestamp: new Date().toISOString()
                            } 
                          }));
                          
                          // Also dispatch the regular attendance update event
                          window.dispatchEvent(new CustomEvent('attendanceUpdated', { 
                            detail: { 
                              action: 'checkout', 
                              studentId: updatedRecord.id, 
                              studentName: updatedRecord.userName,
                              timestamp: new Date().toISOString()
                            } 
                          }));
                          
                          setShowIndividualCheckoutModal(false);
                          setSelectedStudent(null);
                          setPassword('');
                          setPasswordError('');
                          setCheckoutNotes('');
                        } else {
                          const errorData = await response.json().catch(() => ({}));
                          console.error('Individual checkout error response:', errorData);
                          throw new Error(errorData.error || 'Failed to checkout user');
                        }
                      } catch (error) {
                        console.error('Error during individual checkout:', error);
                        setPasswordError(`Failed to checkout: ${error instanceof Error ? error.message : 'Unknown error'}`);
                      } finally {
                        setIsIndividualCheckoutProcessing(false);
                      }
                    }
                  }}
                  disabled={!password.trim() || isIndividualCheckoutProcessing}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-xl font-medium transition-all disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isIndividualCheckoutProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4" />
                      <span>Checkout</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckInOutPage;
