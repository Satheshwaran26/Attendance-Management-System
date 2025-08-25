import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Download,
  Search,
  Clock,
  UserCheck,
  RefreshCw,
  FileText,
  CalendarDays,
  Users
} from 'lucide-react';
import { standardizeDepartmentName } from '../utils/departmentMapping';

interface SessionRecord {
  id: string;
  studentId: string;
  studentName: string;
  registerNumber: string;
  department: string;
  date: string;
  checkInTime: string;
  checkOutTime: string;
  session: 'session1' | 'session2';
  sessionDuration: string;
  notes?: string;
}

interface DaySessionData {
  date: string;
  session1: SessionRecord[];
  session2: SessionRecord[];
  session1Count: number;
  session2Count: number;
  totalStudents: number;
}

const SessionDataPage: React.FC = () => {
  const [sessionData, setSessionData] = useState<DaySessionData[]>([]);
  const [filteredData, setFilteredData] = useState<DaySessionData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSession, setSelectedSession] = useState<'all' | 'session1' | 'session2'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<{date: string, session: 'session1' | 'session2' | 'both', count: number} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const API_BASE = process.env.NODE_ENV === 'production'
    ? 'https://attendance-v2-jius.onrender.com'
    : 'http://localhost:5000/api';

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

    // Check database status every 30 seconds
    const dbStatusInterval = setInterval(checkDatabaseStatus, 30000);

    // Listen for attendance updates from other components
    const handleAttendanceUpdate = (event: any) => {
      console.log('Attendance update detected in SessionDataPage, refreshing data...', event.detail);
      loadData();
    };
    
    // Listen for session data updates (when checkout all is done)
    const handleSessionDataUpdate = (event: any) => {
      console.log('Session data update detected:', event.detail);
      if (event.detail.action === 'checkoutAll') {
        console.log(`Refreshing data after ${event.detail.session} checkout all`);
        // Refresh data to show new session information
        loadData();
      }
    };
    
    // Listen for re-registration events
    const handleStudentReRegistration = (event: any) => {
      console.log('Student re-registration detected:', event.detail);
      if (event.detail.action === 'alreadyPresent') {
        console.log(`Student ${event.detail.studentName} attempted re-registration, preserving existing session data`);
        // Don't refresh data - preserve existing session information
        // This ensures re-registration doesn't affect historical session data
      } else if (event.detail.action === 'reRegisterPresent') {
        console.log(`Student ${event.detail.studentName} successfully re-registered, refreshing data to show new record`);
        // Refresh data to show the new re-registration record
        loadData();
      }
    };
    
    // Listen for individual student additions to session data
    const handleStudentAddedToSession = (event: any) => {
      console.log('Student added to session data:', event.detail);
      if (event.detail.action === 'individualCheckout') {
        // Add the student to the appropriate session data
        const { studentName, registerNumber, session, checkInTime, checkOutTime, notes } = event.detail;
        
        // Calculate session duration
        const duration = new Date(checkOutTime).getTime() - new Date(checkInTime).getTime();
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        const sessionDuration = `${hours}h ${minutes}m`;
        
        // Get the date from check-in time
        const date = new Date(checkInTime).toISOString().split('T')[0];
        
        // Find or create the day data
        setSessionData(prev => {
          const existingDay = prev.find(day => day.date === date);
          
          if (existingDay) {
            // Update existing day
            const updatedDay = { ...existingDay };
            if (session === 'session1') {
              updatedDay.session1.push({
                id: Date.now().toString(), // Generate temporary ID
                studentId: event.detail.studentId,
                studentName,
                registerNumber,
                department: standardizeDepartmentName(event.detail.department || 'Unknown'),
                date,
                checkInTime: new Date(checkInTime).toLocaleString(),
                checkOutTime: new Date(checkOutTime).toLocaleString(),
                session,
                sessionDuration,
                notes
              });
              updatedDay.session1Count++;
            } else {
              updatedDay.session2.push({
                id: Date.now().toString(), // Generate temporary ID
                studentId: event.detail.studentId,
                studentName,
                registerNumber,
                department: standardizeDepartmentName(event.detail.department || 'Unknown'),
                date,
                checkInTime: new Date(checkInTime).toLocaleString(),
                checkOutTime: new Date(checkOutTime).toLocaleString(),
                session,
                sessionDuration,
                notes
              });
              updatedDay.session2Count++;
            }
            
            // Update total students count
            const uniqueStudents = new Set([
              ...updatedDay.session1.map(s => s.studentId),
              ...updatedDay.session2.map(s => s.studentId)
            ]);
            updatedDay.totalStudents = uniqueStudents.size;
            
            return prev.map(day => day.date === date ? updatedDay : day);
          } else {
            // Create new day
            const newDay: DaySessionData = {
              date,
              session1: [],
              session2: [],
              session1Count: 0,
              session2Count: 0,
              totalStudents: 1
            };
            
            if (session === 'session1') {
              newDay.session1.push({
                id: Date.now().toString(),
                studentId: event.detail.studentId,
                studentName,
                registerNumber,
                department: standardizeDepartmentName(event.detail.department || 'Unknown'),
                date,
                checkInTime: new Date(checkInTime).toLocaleString(),
                checkOutTime: new Date(checkOutTime).toLocaleString(),
                session,
                sessionDuration,
                notes
              });
              newDay.session1Count = 1;
            } else {
              newDay.session2.push({
                id: Date.now().toString(),
                studentId: event.detail.studentId,
                studentName,
                registerNumber,
                department: standardizeDepartmentName(event.detail.department || 'Unknown'),
                date,
                checkInTime: new Date(checkInTime).toLocaleString(),
                checkOutTime: new Date(checkOutTime).toLocaleString(),
                session,
                sessionDuration,
                notes
              });
              newDay.session2Count = 1;
            }
            
            return [newDay, ...prev];
          }
        });
      }
    };
    
    window.addEventListener('attendanceUpdated', handleAttendanceUpdate);
    window.addEventListener('sessionDataUpdated', handleSessionDataUpdate);
    window.addEventListener('studentAlreadyPresent', handleStudentReRegistration);
    window.addEventListener('studentAddedToSession', handleStudentAddedToSession);
    
    return () => {
      clearInterval(dbStatusInterval);
      window.removeEventListener('attendanceUpdated', handleAttendanceUpdate);
      window.removeEventListener('sessionDataUpdated', handleSessionDataUpdate);
      window.removeEventListener('studentAlreadyPresent', handleStudentReRegistration);
      window.removeEventListener('studentAddedToSession', handleStudentAddedToSession);
    };
  }, []);

  useEffect(() => {
    filterData();
  }, [sessionData, searchTerm, selectedDate, selectedSession]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      console.log('Loading session data from database...');
      
      // Add cache-busting parameter
      const timestamp = new Date().getTime();
      
      // Load students and attendance records from database
      const [studentsResponse, attendanceResponse] = await Promise.all([
        fetch(`${API_BASE}/students?t=${timestamp}`),
        fetch(`${API_BASE}/attendance?t=${timestamp}`)
      ]);

      if (!studentsResponse.ok || !attendanceResponse.ok) {
        throw new Error('Failed to fetch data from database');
      }

      const students = await studentsResponse.json();
      const attendance = await attendanceResponse.json();

      console.log('Students loaded from database:', students.length);
      console.log('Attendance records loaded from database:', attendance.length);
      
      // Transform and organize data by day and session
      const dayMap = new Map<string, DaySessionData>();

      // Process database attendance records
      attendance.forEach((record: any) => {
        console.log('Processing database attendance record:', record);
        
        const student = students.find((s: any) => s.id.toString() === record.student_id.toString());
        if (!student) {
          console.warn(`Student not found for attendance record ${record.id}:`, record);
          return;
        }

        // Only include records that have been checked out (completed sessions)
        if (!record.check_out_time) {
          console.log(`Skipping record ${record.id} - no checkout time (still present)`);
          return;
        }

        const date = new Date(record.check_in_time).toISOString().split('T')[0]; // Use check_in_time for accurate date
        const checkInTime = record.check_in_time ? new Date(record.check_in_time) : new Date(record.date);
        const checkOutTime = new Date(record.check_out_time);
        const sessionType = record.session || 'session1';
        
        console.log(`Record ${record.id}: Date=${date}, Session=${sessionType}, CheckIn=${checkInTime}, CheckOut=${checkOutTime}`);

        // Calculate session duration
        const duration = checkOutTime.getTime() - checkInTime.getTime();
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        const sessionDuration = `${hours}h ${minutes}m`;

        const sessionRecord: SessionRecord = {
          id: record.id.toString(),
          studentId: student.id.toString(),
          studentName: student.name,
          registerNumber: student.register_number,
          department: standardizeDepartmentName(student.department || 'Unknown'),
          date: date,
          checkInTime: checkInTime.toLocaleString(),
          checkOutTime: checkOutTime.toLocaleString(),
          session: sessionType,
          sessionDuration
        };

        if (!dayMap.has(date)) {
          dayMap.set(date, {
            date,
            session1: [],
            session2: [],
            session1Count: 0,
            session2Count: 0,
            totalStudents: 0
          });
        }

        const dayData = dayMap.get(date)!;
        
        // Add to appropriate session (accumulate, never replace or remove existing data)
        if (sessionType === 'session2') {
          // Always add to session2 (never remove existing session2 data)
          // This allows students to appear in both sessions
          dayData.session2.push(sessionRecord);
          dayData.session2Count++;
          console.log(`Student ${sessionRecord.studentName} added to Session 2 (may also be in Session 1)`);
        } else {
          // Session 1 - always add (re-registration creates new records)
          dayData.session1.push(sessionRecord);
          dayData.session1Count++;
          console.log(`Student ${sessionRecord.studentName} added to Session 1`);
        }
        
        // Update total count (count unique students across both sessions)
        const uniqueStudents = new Set([
          ...dayData.session1.map(s => s.studentId),
          ...dayData.session2.map(s => s.studentId)
        ]);
        dayData.totalStudents = uniqueStudents.size;
      });

      // Convert to array and sort by date (newest first)
      const sortedData = Array.from(dayMap.values()).sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      console.log('Organized session data by day from database:', sortedData.length, 'days');
      console.log('Total completed sessions:', sortedData.reduce((sum, day) => sum + day.totalStudents, 0));
      setSessionData(sortedData);
    } catch (error) {
      console.error('Error loading session data from database:', error);
      setSessionData([]);
      setDbStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Functions
  const handleDeleteSession = (date: string, session: 'session1' | 'session2', count: number) => {
    setSessionToDelete({ date, session, count });
    setShowDeleteModal(true);
    setDeleteError('');
  };

  const handleDeleteBothSessions = (date: string) => {
    console.log('Delete both sessions called with date:', date);
    console.log('Date type:', typeof date);
    console.log('Date value:', date);
    setSessionToDelete({ date, session: 'both', count: 0 });
    setShowDeleteModal(true);
    setDeleteError('');
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    
    setIsDeleting(true);
    setDeleteError('');
    
    try {
      let response;
      
      if (sessionToDelete.session === 'both') {
        // Delete both sessions for the date
        console.log('Attempting to delete both sessions for date:', sessionToDelete.date);
        
        response = await fetch(`${API_BASE}/attendance/delete-date`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            date: sessionToDelete.date
          }),
        });
      } else {
        // Delete specific session
        const requestBody = {
          date: sessionToDelete.date,
          session: sessionToDelete.session
        };
        
        console.log('Attempting to delete session with data:', requestBody);
        console.log('API URL:', `${API_BASE}/attendance/delete-session`);
        
        response = await fetch(`${API_BASE}/attendance/delete-session`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
      }

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('Success response:', responseData);
        
        // Success - remove the session(s) from local state
        setSessionData(prev => prev.map(dayData => {
          if (dayData.date === sessionToDelete.date) {
            if (sessionToDelete.session === 'both') {
              // Remove both sessions
              return {
                ...dayData,
                session1: [],
                session2: [],
                session1Count: 0,
                session2Count: 0,
                totalStudents: 0
              };
            } else if (sessionToDelete.session === 'session1') {
              return {
                ...dayData,
                session1: [],
                session1Count: 0,
                totalStudents: dayData.session2.length
              };
            } else {
              return {
                ...dayData,
                session2: [],
                session2Count: 0,
                totalStudents: dayData.session1.length
              };
            }
          }
          return dayData;
        }));
        
        // Close modal and reset
        setShowDeleteModal(false);
        setSessionToDelete(null);
        
        // Show success message
        if (sessionToDelete.session === 'both') {
          alert(`Successfully deleted both sessions for ${new Date(sessionToDelete.date).toLocaleDateString()}`);
        } else {
          alert(`Successfully deleted ${sessionToDelete.session === 'session1' ? 'Session 1 (Morning)' : 'Session 2 (Afternoon)'} for ${new Date(sessionToDelete.date).toLocaleDateString()}`);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setDeleteError(`Failed to delete session: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSessionToDelete(null);
    setDeleteError('');
  };

  const filterData = () => {
    let filtered = sessionData;

    // Filter by date
    if (selectedDate) {
      filtered = filtered.filter(day => day.date === selectedDate);
    }

    // Filter by session
    if (selectedSession !== 'all') {
      filtered = filtered.map(day => ({
        ...day,
        session1: selectedSession === 'session1' ? day.session1 : [],
        session2: selectedSession === 'session2' ? day.session2 : [],
        session1Count: selectedSession === 'session1' ? day.session1Count : 0,
        session2Count: selectedSession === 'session2' ? day.session2Count : 0,
        totalStudents: selectedSession === 'session1' ? day.session1Count : day.session2Count
      })).filter(day => day.totalStudents > 0);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.map(day => ({
        ...day,
        session1: day.session1.filter(session =>
          session.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          session.registerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          session.department.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        session2: day.session2.filter(session =>
          session.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          session.registerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          session.department.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(day => day.session1.length > 0 || day.session2.length > 0);
    }

    setFilteredData(filtered);
  };

  const exportToCSV = () => {
    const csvContent = [
      'Date,Session,Student Name,Register Number,Department,Check-in Time,Check-out Time,Session Duration',
      ...filteredData.flatMap(day => [
        ...day.session1.map(session =>
          `${day.date},Session 1,"${session.studentName}",${session.registerNumber},"${session.department}","${session.checkInTime}","${session.checkOutTime}","${session.sessionDuration}"`
        ),
        ...day.session2.map(session =>
          `${day.date},Session 2,"${session.studentName}",${session.registerNumber},"${session.department}","${session.checkInTime}","${session.checkOutTime}","${session.sessionDuration}"`
        )
      ])
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadSessionCSV = (date: string, session: 'session1' | 'session2', records: SessionRecord[]) => {
    if (records.length === 0) {
      alert(`No records available for ${session === 'session1' ? 'Session 1 (Morning)' : 'Session 2 (Afternoon)'} on ${date}`);
      return;
    }

    const sessionName = session === 'session1' ? 'Session_1_Morning' : 'Session_2_Afternoon';
    const csvContent = [
      'Date,Session,Student Name,Register Number,Department,Check-in Time,Check-out Time,Session Duration',
      ...records.map(sessionRecord =>
        `${date},${session === 'session1' ? 'Session 1 (Morning)' : 'Session 2 (Afternoon)'},"${sessionRecord.studentName}",${sessionRecord.registerNumber},"${sessionRecord.department}","${sessionRecord.checkInTime}","${sessionRecord.checkOutTime}","${sessionRecord.sessionDuration}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sessionName}_${date}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStats = () => {
    const totalDays = filteredData.length;
    const totalSessions = filteredData.reduce((sum, day) => sum + day.session1.length + day.session2.length, 0);
    const session1Total = filteredData.reduce((sum, day) => sum + day.session1.length, 0);
    const session2Total = filteredData.reduce((sum, day) => sum + day.session2.length, 0);

    return { totalDays, totalSessions, session1Total, session2Total };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200 border-t-blue-600 mx-auto mb-6"></div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600">Preparing session data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Session Data & Checkout History</h1>
              <p className="text-gray-600">View completed sessions and checkout history for both Session 1 and Session 2</p>
            </div>
          </div>

          {/* Database Connection Status */}
          <div className="mt-4 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${dbStatus === 'connected' ? 'bg-green-500' :
                  dbStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>
              <span className={`text-sm font-medium ${dbStatus === 'connected' ? 'text-green-600' :
                  dbStatus === 'disconnected' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                Database: {dbStatus === 'connected' ? 'Connected' :
                  dbStatus === 'disconnected' ? 'Disconnected' : 'Checking...'}
              </span>
            </div>

            {/* Retry Connection Button */}
            {dbStatus === 'disconnected' && (
              <button
                onClick={() => {
                  setDbStatus('checking');
                  checkDatabaseStatus();
                  loadData();
                }}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-all flex items-center space-x-1"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Retry Connection</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                <CalendarDays className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm font-medium">Total Days</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalDays}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center border border-green-100">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm font-medium">Total Sessions</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalSessions}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-yellow-50 rounded-xl flex items-center justify-center border border-yellow-100">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm font-medium">Session 1</p>
            <p className="text-3xl font-bold text-gray-900">{stats.session1Total}</p>
            <p className="text-xs text-gray-400 mt-1">Morning</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-purple-50 rounded-xl flex items-center justify-center border border-purple-100">
                <UserCheck className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm font-medium">Session 2</p>
            <p className="text-3xl font-bold text-gray-900">{stats.session2Total}</p>
            <p className="text-xs text-gray-400 mt-1">Afternoon</p>
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
                  placeholder="Search by name, register number, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Date Filter */}
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />

              {/* Session Filter */}
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value as 'all' | 'session1' | 'session2')}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="all">All Sessions</option>
                <option value="session1">Session 1 (Morning)</option>
                <option value="session2">Session 2 (Afternoon)</option>
              </select>
            </div>

            <div className="flex space-x-3">
              {/* Refresh Button */}
              <button
                onClick={loadData}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>

              {/* Export Button */}
              <button
                onClick={exportToCSV}
                disabled={filteredData.length === 0}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl font-medium transition-all flex items-center space-x-2 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Data Display */}
        {filteredData.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Session Data Found</h3>
            <p className="text-gray-600">
              {selectedDate ? `No session data found for ${selectedDate}` : 'No completed sessions available'}
            </p>
            
          </div>
        ) : (
          <div className="space-y-6">
            {filteredData.map((day) => (
              <div key={day.date} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {new Date(day.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Total Students: {day.totalStudents} • Session 1: {day.session1Count} • Session 2: {day.session2Count}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDeleteBothSessions(day.date)}
                        className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl text-sm font-medium transition-all flex items-center space-x-2"
                      >
                        <span>🗑️</span>
                        <span>Delete Both Sessions</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sessions Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Register Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Check-in Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Check-out Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Session Duration
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {/* Session 1 Students */}
                      {day.session1.length > 0 && (
                        <>
                          <tr className="bg-blue-50">
                            <td colSpan={6} className="px-6 py-3">
                              <div className="flex items-center space-x-2">
                                <div className="h-6 w-6 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <span className="text-blue-600 font-bold text-xs">1</span>
                                </div>
                                <span className="text-sm font-semibold text-blue-800">Session 1 (Morning)</span>
                                <span className="text-xs text-blue-600">({day.session1.length} students)</span>
                                <button
                                  onClick={() => downloadSessionCSV(day.date, 'session1', day.session1)}
                                  className="ml-2 px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg text-xs font-medium transition-all flex items-center space-x-1"
                                >
                                  <Download className="h-3 w-3" />
                                  <span>Export</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteSession(day.date, 'session1', day.session1.length)}
                                  className="ml-2 px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-xs font-medium transition-all flex items-center space-x-1"
                                >
                                  <span>🗑️</span>
                                  <span>Delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                          {day.session1.map((session) => (
                            <tr key={`session1-${session.id}`} className="hover:bg-blue-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                                    <span className="text-blue-600 font-bold text-sm">{session.studentName.charAt(0)}</span>
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-sm font-semibold text-gray-900">{session.studentName}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                                {session.registerNumber}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {session.department}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {session.checkInTime}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {session.checkOutTime}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {session.sessionDuration}
                              </td>
                            </tr>
                          ))}
                        </>
                      )}

                      {/* Session 2 Students */}
                      {day.session2.length > 0 && (
                        <>
                          <tr className="bg-green-50">
                            <td colSpan={6} className="px-6 py-3">
                              <div className="flex items-center space-x-2">
                                <div className="h-6 w-6 bg-green-100 rounded-lg flex items-center justify-center">
                                  <span className="text-green-600 font-bold text-xs">2</span>
                                </div>
                                <span className="text-green-800 font-semibold text-sm">Session 2 (Afternoon)</span>
                                <span className="text-xs text-green-600">({day.session2.length} students)</span>
                                <button
                                  onClick={() => downloadSessionCSV(day.date, 'session2', day.session2)}
                                  className="ml-2 px-2 py-1 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg text-xs font-medium transition-all flex items-center space-x-1"
                                >
                                  <Download className="h-3 w-3" />
                                  <span>Export</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteSession(day.date, 'session2', day.session2.length)}
                                  className="ml-2 px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-xs font-medium transition-all flex items-center space-x-1"
                                >
                                  <span>🗑️</span>
                                  <span>Delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                          {day.session2.map((session) => (
                            <tr key={`session2-${session.id}`} className="hover:bg-green-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 bg-green-50 rounded-xl flex items-center justify-center border border-green-100">
                                    <span className="text-green-600 font-bold text-sm">{session.studentName.charAt(0)}</span>
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-sm font-semibold text-gray-900">{session.studentName}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                                {session.registerNumber}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {session.department}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {session.checkInTime}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {session.checkOutTime}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {session.sessionDuration}
                              </td>
                            </tr>
                          ))}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && sessionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 bg-red-50 rounded-2xl mb-4 border border-red-100">
                  <span className="text-3xl">🗑️</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Delete Session Data
                </h2>
                <p className="text-gray-600">
                  Are you sure you want to delete all attendance records for <strong>{sessionToDelete.session === 'session1' ? 'Session 1 (Morning)' : sessionToDelete.session === 'session2' ? 'Session 2 (Afternoon)' : 'both sessions'}</strong> on <strong>{new Date(sessionToDelete.date).toLocaleDateString()}</strong>?
                </p>
                <div className="mt-3 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                  <div><strong>Date:</strong> {new Date(sessionToDelete.date).toLocaleDateString()}</div>
                  <div><strong>Session:</strong> {sessionToDelete.session === 'session1' ? 'Session 1 (Morning)' : sessionToDelete.session === 'session2' ? 'Session 2 (Afternoon)' : 'Both Sessions'}</div>
                  <div><strong>Records to Delete:</strong> {sessionToDelete.count}</div>
                </div>
              </div>

              {deleteError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{deleteError}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={confirmDeleteSession}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-xl font-medium transition-all flex items-center justify-center space-x-2 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <span>🗑️</span>
                      <span>Delete Session</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={cancelDelete}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionDataPage;
