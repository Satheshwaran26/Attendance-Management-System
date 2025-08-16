import React, { useState, useEffect } from 'react';
import { 
  Calendar,
  Download,
  Search,
  Clock,
  UserCheck,
  LogOut,
  RefreshCw,
  FileText,
  CalendarDays,
  Users,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface AttendanceSession {
  id: string;
  studentId: string;
  studentName: string;
  registerNumber: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  status: 'present' | 'checked-out';
  sessionDuration?: string;
}

interface DayData {
  date: string;
  session1: AttendanceSession[];
  session2: AttendanceSession[];
  totalStudents: number;
  presentCount: number;
  checkedOutCount: number;
  session1Count: number;
  session2Count: number;
}

const CheckoutDataPage: React.FC = () => {
  const [attendanceData, setAttendanceData] = useState<DayData[]>([]);
  const [filteredData, setFilteredData] = useState<DayData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const API_BASE = 'http://localhost:5000/api';

  const checkDatabaseStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/health`);
      if (response.ok) {
        const data = await response.json();
        setDbStatus(data.database === 'Connected' ? 'connected' : 'disconnected');
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
    
    return () => clearInterval(dbStatusInterval);
  }, []);

  useEffect(() => {
    filterData();
  }, [attendanceData, searchTerm, selectedDate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      console.log('Loading checkout data...');
      
      // Add cache-busting parameter
      const timestamp = new Date().getTime();
      
      // Load students and attendance records
      const [studentsResponse, attendanceResponse] = await Promise.all([
        fetch(`${API_BASE}/students?t=${timestamp}`),
        fetch(`${API_BASE}/attendance?t=${timestamp}`)
      ]);

      if (!studentsResponse.ok || !attendanceResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const students = await studentsResponse.json();
      const attendance = await attendanceResponse.json();

      console.log('Students loaded:', students.length);
      console.log('Students data:', students);
      console.log('Attendance records loaded:', attendance.length);
      console.log('Attendance data:', attendance);

      // Transform and organize data by day
      const dayMap = new Map<string, DayData>();

      attendance.forEach((record: any) => {
        const student = students.find((s: any) => s.id.toString() === record.student_id.toString());
        if (!student) {
          console.warn(`Student not found for attendance record ${record.id}:`, record);
          return;
        }

        const date = new Date(record.date).toISOString().split('T')[0];
        const checkInTime = record.check_in_time ? new Date(record.check_in_time) : new Date(record.date);
        const checkOutTime = record.check_out_time ? new Date(record.check_out_time) : undefined;
        const sessionType = record.session || 'session1'; // Default to session1 if not specified

        // Calculate session duration if checked out
        let sessionDuration = '';
        if (checkOutTime) {
          const duration = checkOutTime.getTime() - checkInTime.getTime();
          const hours = Math.floor(duration / (1000 * 60 * 60));
          const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
          sessionDuration = `${hours}h ${minutes}m`;
        }

        const attendanceSession: AttendanceSession = {
          id: record.id.toString(),
          studentId: student.id.toString(),
          studentName: student.name,
          registerNumber: student.register_number,
          date: date,
          checkInTime: checkInTime.toLocaleString(),
          checkOutTime: checkOutTime?.toLocaleString(),
          status: checkOutTime ? 'checked-out' : 'present',
          sessionDuration
        };

        if (!dayMap.has(date)) {
          dayMap.set(date, {
            date,
            session1: [],
            session2: [],
            totalStudents: 0,
            presentCount: 0,
            checkedOutCount: 0,
            session1Count: 0,
            session2Count: 0
          });
        }

        const dayData = dayMap.get(date)!;
        
        // Add to appropriate session
        if (sessionType === 'session2') {
          dayData.session2.push(attendanceSession);
          dayData.session2Count++;
        } else {
          dayData.session1.push(attendanceSession);
          dayData.session1Count++;
        }
        
        dayData.totalStudents++;
        
        if (attendanceSession.status === 'checked-out') {
          dayData.checkedOutCount++;
        } else {
          dayData.presentCount++;
        }
      });

      // Convert to array and sort by date (newest first)
      const sortedData = Array.from(dayMap.values()).sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      console.log('Organized data by day:', sortedData.length, 'days');
      console.log('Final organized data:', sortedData);
      setAttendanceData(sortedData);
    } catch (error) {
      console.error('Error loading data:', error);
      
      // Check if it's a database connection error
      if (error instanceof Error && error.message.includes('fetch failed')) {
        setDbStatus('disconnected');
      }
      
      setAttendanceData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterData = () => {
    let filtered = attendanceData;

    // Filter by date
    if (selectedDate) {
      filtered = filtered.filter(day => day.date === selectedDate);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.map(day => ({
        ...day,
        session1: day.session1.filter(session =>
          session.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          session.registerNumber.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        session2: day.session2.filter(session =>
          session.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          session.registerNumber.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(day => day.session1.length > 0 || day.session2.length > 0);
    }

    setFilteredData(filtered);
  };

  const exportToCSV = () => {
    const csvContent = [
      'Date,Session,Student Name,Register Number,Check-in Time,Check-out Time,Status,Session Duration',
      ...filteredData.flatMap(day => [
        ...day.session1.map(session =>
          `${day.date},Session 1,"${session.studentName}",${session.registerNumber},"${session.checkInTime}","${session.checkOutTime || ''}",${session.status},"${session.sessionDuration || ''}"`
        ),
        ...day.session2.map(session =>
          `${day.date},Session 2,"${session.studentName}",${session.registerNumber},"${session.checkInTime}","${session.checkOutTime || ''}",${session.status},"${session.sessionDuration || ''}"`
        )
      ])
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checkout_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDeleteAllData = async () => {
    setIsDeleting(true);
    try {
      console.log('Deleting all attendance data...');
      
      // Delete all attendance records
      const response = await fetch(`${API_BASE}/attendance/all`, {
        method: 'DELETE',
      });

      if (response.ok) {
        console.log('All attendance data deleted successfully');
        // Clear local state
        setAttendanceData([]);
        setFilteredData([]);
        // Close modal
        setShowDeleteModal(false);
        // Show success message (you can add a toast notification here)
        alert('All attendance data has been deleted successfully!');
      } else {
        throw new Error('Failed to delete all data');
      }
    } catch (error) {
      console.error('Error deleting all data:', error);
      alert('Error deleting data. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteModal = () => {
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
  };

  const getStats = () => {
    const totalDays = filteredData.length;
    const totalSessions = filteredData.reduce((sum, day) => sum + day.session1.length + day.session2.length, 0);
    const totalCheckedOut = filteredData.reduce((sum, day) => sum + day.checkedOutCount, 0);
    const totalPresent = filteredData.reduce((sum, day) => sum + day.presentCount, 0);

    return { totalDays, totalSessions, totalCheckedOut, totalPresent };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200 border-t-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600">Preparing checkout data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout Data & Session History</h1>
              <p className="text-gray-600">View historical attendance data with multiple sessions per day</p>
            </div>
            
            {/* Delete All Data Button */}
            <button
              onClick={openDeleteModal}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all flex items-center space-x-2 shadow-sm hover:shadow-md"
            >
              <Trash2 className="h-5 w-5" />
              <span>Delete All Data</span>
            </button>
          </div>
          
          {/* Database Connection Status */}
          <div className="mt-4 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
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
              <div className="h-12 w-12 bg-purple-50 rounded-xl flex items-center justify-center border border-purple-100">
                <LogOut className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm font-medium">Checked Out</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalCheckedOut}</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-yellow-50 rounded-xl flex items-center justify-center border border-yellow-100">
                <UserCheck className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm font-medium">Currently Present</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalPresent}</p>
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

              {/* Date Filter */}
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Found</h3>
            <p className="text-gray-600">
              {selectedDate ? `No attendance data found for ${selectedDate}` : 'No attendance data available'}
            </p>
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>Debug Info:</strong> Total days: {attendanceData.length} | 
                Total students: {attendanceData.reduce((sum, day) => sum + day.totalStudents, 0)} | 
                Session 1: {attendanceData.reduce((sum, day) => sum + day.session1Count, 0)} | 
                Session 2: {attendanceData.reduce((sum, day) => sum + day.session2Count, 0)}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredData.map((day) => (
              <div key={day.date} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Day Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                        <Calendar className="h-5 w-5 text-blue-600" />
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
                          Session 1: {day.session1Count} • Session 2: {day.session2Count} • {day.checkedOutCount} checked out • {day.presentCount} present
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Date: {day.date}</p>
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
                          Check-in Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Check-out Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Status
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
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {session.checkInTime}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {session.checkOutTime || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  session.status === 'checked-out' 
                                    ? 'bg-green-100 text-green-800 border border-green-200' 
                                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                }`}>
                                  {session.status === 'checked-out' ? (
                                    <>
                                      <LogOut className="h-3 w-3 mr-1" />
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
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {session.sessionDuration || '-'}
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
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {session.checkInTime}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {session.checkOutTime || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  session.status === 'checked-out' 
                                    ? 'bg-green-100 text-green-800 border border-green-200' 
                                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                }`}>
                                  {session.status === 'checked-out' ? (
                                    <>
                                      <LogOut className="h-3 w-3 mr-1" />
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
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {session.sessionDuration || '-'}
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

       {/* Delete All Data Confirmation Modal */}
       {showDeleteModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
             <div className="flex items-center space-x-3 mb-4">
               <div className="h-10 w-10 bg-red-50 rounded-xl flex items-center justify-center border border-red-100">
                 <AlertTriangle className="h-5 w-5 text-red-600" />
               </div>
               <div>
                 <h3 className="text-lg font-semibold text-gray-900">Delete All Attendance Data</h3>
                 <p className="text-sm text-red-600 font-medium">⚠️ This action cannot be undone!</p>
               </div>
             </div>
             
             <div className="mb-6">
               <p className="text-gray-700 mb-3">
                 Are you absolutely sure you want to delete <strong>ALL</strong> attendance data?
               </p>
               <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                 <p className="text-sm text-red-800 font-medium">This will permanently delete:</p>
                 <ul className="text-sm text-red-700 mt-2 space-y-1">
                   <li>• All check-in records</li>
                   <li>• All check-out records</li>
                   <li>• All session history</li>
                   <li>• All attendance analytics</li>
                 </ul>
                 <p className="text-sm text-red-800 font-medium mt-3">
                   Total records to be deleted: <span className="font-bold">{attendanceData.reduce((sum, day) => sum + day.session1.length + day.session2.length, 0)}</span>
                 </p>
               </div>
             </div>

             <div className="flex space-x-3">
               <button
                 onClick={closeDeleteModal}
                 disabled={isDeleting}
                 className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 Cancel
               </button>
               <button
                 onClick={handleDeleteAllData}
                 disabled={isDeleting}
                 className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
               >
                 {isDeleting ? (
                   <>
                     <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                     <span>Deleting...</span>
                   </>
                 ) : (
                   <>
                     <Trash2 className="h-4 w-4" />
                     <span>Delete All Data</span>
                   </>
                 )}
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };

export default CheckoutDataPage;
