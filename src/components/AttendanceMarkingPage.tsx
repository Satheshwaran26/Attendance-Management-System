import React, { useState, useEffect } from 'react';
import { standardizeDepartmentName } from '../utils/departmentMapping';
import { 
  Search,
  CheckCircle,

  AlertCircle
} from 'lucide-react';
import type { Student } from '../types';

const AttendanceMarkingPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [attendanceStatus, setAttendanceStatus] = useState<'present' | null>(null);
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [recentlyProcessed, setRecentlyProcessed] = useState<Set<string>>(new Set());

  const API_BASE = process.env.NODE_ENV === 'production' 
    ? 'https://attendance-management-system-z2cc.onrender.com/api' 
    : 'http://localhost:5000/api';

  // Helper function to get current local time in correct format
  const getCurrentLocalTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    // Return in ISO format but with local time
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
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
  }, []);

  // Auto-focus the input field when component mounts
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
    
    // Clear any existing state to prevent duplicate issues
    setSelectedStudent(null);
    setAttendanceStatus(null);
    setErrorMessage('');
    setSuccessMessage('');
    setSearchTerm('');
    
    // Clear recently processed set every 5 minutes to allow legitimate re-registrations
    const cleanupInterval = setInterval(() => {
      setRecentlyProcessed(new Set());
      console.log('Cleared recently processed register numbers');
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(cleanupInterval);
  }, []);

  const checkExistingAttendance = async (studentId: string, date: string) => {
    try {
      console.log('Checking existing attendance for student:', studentId, 'on date:', date);
      
      // First, let's check if there's already an attendance record for this student on this date
      const response = await fetch(`${API_BASE}/attendance/check?student_id=${studentId}&date=${date}`);
      console.log('Check attendance response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Check attendance response data:', data);
        
        if (data.exists) {
          // Check if the student is already present (has check-in time but no check-out time)
          if (data.attendance && data.attendance.check_in_time && !data.attendance.check_out_time) {
            // Student is already present and not checked out
            console.log('Student is already present and not checked out');
            return { exists: true, canMarkPresent: false, isCheckedOut: false, attendance: data.attendance };
          } else if (data.attendance && data.attendance.check_out_time) {
            // Student was checked out, can be marked present again (re-registration)
            console.log('Student was checked out, can be marked present again');
            return { exists: true, canMarkPresent: true, isCheckedOut: true, attendance: data.attendance };
          } else {
            // Student has some attendance record but unclear status
            console.log('Student has unclear attendance status');
            return { exists: true, canMarkPresent: false, isCheckedOut: false, attendance: data.attendance };
          }
        } else {
          // No attendance record exists
          console.log('No attendance record exists');
          return { exists: false, canMarkPresent: true, isCheckedOut: false, attendance: null };
        }
      }
      
      console.log('Check attendance response not ok');
      return { exists: false, canMarkPresent: true, isCheckedOut: false, attendance: null };
    } catch (error) {
      console.error('Error checking existing attendance:', error);
      return { exists: false, canMarkPresent: true, isCheckedOut: false, attendance: null };
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim() || isLoading) {
      return;
    }

    // Check if this register number was recently processed
    const registerKey = `${searchTerm.trim()}-${selectedDate}`;
    if (recentlyProcessed.has(registerKey)) {
      setErrorMessage('This register number was recently processed. Please wait a moment before trying again.');
      return;
    }

    setSelectedStudent(null);
    setAttendanceStatus(null);
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);
    
    try {
      console.log('Searching for register number:', searchTerm.trim());
      // Use the search endpoint with query parameter 'q' instead of 'register_number'
      const response = await fetch(`${API_BASE}/students/search?q=${encodeURIComponent(searchTerm.trim())}`);
      console.log('Search response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Search response data:', data);
      
      if (data && data.length > 0) {
        // Find the student with exact register number match
        const student = data.find((s: any) => s.register_number === searchTerm.trim());
        
        if (!student) {
          setSelectedStudent(null);
          setAttendanceStatus(null);
          setErrorMessage('Please enter a valid register number. Student not found.');
          return;
        }
        
        console.log('Found student:', student);
        
        const transformedStudent: Student = {
          id: student.id.toString(),
          name: student.name,
          registerNumber: student.register_number,
          classYear: student.class_year,
          aadharNumber: student.aadhar_number ? 
            (typeof student.aadhar_number === 'number' ? 
              (student.aadhar_number as number).toLocaleString('fullwide', { useGrouping: false }) : 
              student.aadhar_number.toString()
            ) : '',
          phoneNumber: student.phone_number,
          email: student.email || '',
          department: standardizeDepartmentName(student.department || 'BCA'),
          isActive: student.is_active,
          createdAt: new Date(student.created_at)
        };
        
        console.log('Transformed student:', transformedStudent);
        
        // Check if attendance already exists for today
        const existingAttendance = await checkExistingAttendance(transformedStudent.id, selectedDate);
        console.log('Existing attendance check:', existingAttendance);
        
        if (existingAttendance.exists && !existingAttendance.canMarkPresent) {
          // Student is already present and not checked out
          setSelectedStudent(transformedStudent);
          setAttendanceStatus('present');
          setSuccessMessage('Already Present');
          
          // Add to recently processed to prevent duplicate submissions
          setRecentlyProcessed(prev => new Set([...prev, registerKey]));
          
          // Dispatch event to notify CheckIn/Out page that student is already present
          const event = new CustomEvent('studentAlreadyPresent', {
            detail: { 
              action: 'alreadyPresent',
              studentId: transformedStudent.id, 
              studentName: transformedStudent.name,
              registerNumber: transformedStudent.registerNumber,
              timestamp: getCurrentLocalTime(),
              date: selectedDate
            }
          });
          window.dispatchEvent(event);
          
          // Clear the form after showing already present message
          setTimeout(() => {
            setSearchTerm('');
            setSelectedStudent(null);
            setAttendanceStatus(null);
            setSuccessMessage('');
            if (searchInputRef.current) {
              searchInputRef.current.focus();
            }
          }, 2000);
          
        } else if (existingAttendance.exists && existingAttendance.isCheckedOut) {
          // Student was checked out, can be marked present again (re-registration)
          await handleReRegistrationDirect(transformedStudent);
        } else {
          // No attendance record exists, can mark as present (first time)
          await handleMarkAttendanceDirect(transformedStudent);
        }
      } else {
        console.log('No students found in response');
        setSelectedStudent(null);
        setAttendanceStatus(null);
        setErrorMessage('Please enter a valid register number. Student not found.');
      }
    } catch (error) {
      console.error('Error searching student:', error);
      setSelectedStudent(null);
      setAttendanceStatus(null);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage(`Error: ${errorMessage}. Please enter a valid register number.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAttendanceDirect = async (student: Student) => {
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      console.log('Marking attendance for student:', student.id, 'on date:', selectedDate);
      
      // Double-check if attendance already exists before marking
      const doubleCheck = await checkExistingAttendance(student.id, selectedDate);
      if (doubleCheck.exists && !doubleCheck.canMarkPresent) {
        console.log('Double-check: Student is already present, cannot mark again');
        setSelectedStudent(student);
        setAttendanceStatus('present');
        setSuccessMessage('Already Present - Cannot mark attendance twice');
        
        // Clear the form after showing already present message
        setTimeout(() => {
          setSearchTerm('');
          setSelectedStudent(null);
          setAttendanceStatus(null);
          setSuccessMessage('');
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }, 2000);
        return;
      }
      
      const attendanceData = {
        student_id: student.id,
        date: selectedDate,
        status: 'present',
        check_in_time: getCurrentLocalTime(),
        notes: 'Marked present'
      };

      console.log('Sending attendance data:', attendanceData);

      const response = await fetch(`${API_BASE}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attendanceData),
      });

      console.log('Attendance response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Attendance error response:', errorData);
        
        // Check if it's a duplicate error
        if (errorData.error && (
          errorData.error.includes('already present') || 
          errorData.error.includes('duplicate') ||
          errorData.error.includes('already exists')
        )) {
          console.log('Duplicate attendance detected, updating UI');
          setSelectedStudent(student);
          setAttendanceStatus('present');
          setSuccessMessage('Already Present - Attendance was already recorded');
          
          // Clear the form after showing already present message
          setTimeout(() => {
            setSearchTerm('');
            setSelectedStudent(null);
            setAttendanceStatus(null);
            setSuccessMessage('');
            if (searchInputRef.current) {
              searchInputRef.current.focus();
            }
          }, 2000);
          return;
        }
        
        // Throw a clean error message
        const errorMsg = errorData.error || response.statusText || 'Unknown error';
        throw new Error(errorMsg);
      }

      const result = await response.json();
      console.log('Attendance marked successfully:', result);

      // Add to recently processed to prevent duplicate submissions
      const registerKey = `${student.registerNumber}-${selectedDate}`;
      setRecentlyProcessed(prev => new Set([...prev, registerKey]));

      setSelectedStudent(student);
      setAttendanceStatus('present');
      setSuccessMessage(`${student.name} - Present`);
      setShowSuccessFlash(true);
      
      // Dispatch custom event to notify other components
      const event = new CustomEvent('attendanceUpdated', {
        detail: { 
          action: 'markPresent',
          studentId: student.id, 
          studentName: student.name,
          registerNumber: student.registerNumber,
          timestamp: getCurrentLocalTime(),
          date: selectedDate
        }
      });
      console.log('Dispatching attendanceUpdated event:', event.detail);
      window.dispatchEvent(event);
      
      // Also dispatch a specific event for CheckIn/Out page
      const checkInEvent = new CustomEvent('studentCheckedIn', {
        detail: {
          studentId: student.id,
          studentName: student.name,
          registerNumber: student.registerNumber,
          checkInTime: getCurrentLocalTime(),
          date: selectedDate
        }
      });
      window.dispatchEvent(checkInEvent);
      
      // Clear the form and auto-focus for next entry after 2 seconds
      setTimeout(() => {
        setShowSuccessFlash(false);
        setSuccessMessage('');
        setSearchTerm('');
        setSelectedStudent(null);
        setAttendanceStatus(null);
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error marking attendance:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setErrorMessage(`Failed to mark attendance: ${errorMessage}`);
    }
  };

  const handleReRegistrationDirect = async (student: Student) => {
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      console.log('Handling re-registration for student:', student.id, 'on date:', selectedDate);
      
      // Double-check if attendance already exists before re-registering
      const doubleCheck = await checkExistingAttendance(student.id, selectedDate);
      if (doubleCheck.exists && !doubleCheck.canMarkPresent) {
        console.log('Double-check: Student is already present, cannot re-register');
        setSelectedStudent(student);
        setAttendanceStatus('present');
        setSuccessMessage('Already Present - Cannot re-register while present');
        
        // Clear the form after showing already present message
        setTimeout(() => {
          setSearchTerm('');
          setSelectedStudent(null);
          setAttendanceStatus(null);
          setSuccessMessage('');
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }, 2000);
        return;
      }
      
      // Create a new attendance record for re-registration
      const reRegistrationData = {
        student_id: student.id,
        date: selectedDate,
        status: 'present',
        check_in_time: getCurrentLocalTime(),
        notes: 'Re-registered for new session'
      };

      console.log('Sending re-registration data:', reRegistrationData);

      const response = await fetch(`${API_BASE}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reRegistrationData),
      });

      console.log('Re-registration response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Re-registration error response:', errorData);
        
        // Check if it's a duplicate error
        if (errorData.error && (
          errorData.error.includes('already present') || 
          errorData.error.includes('duplicate') ||
          errorData.error.includes('already exists')
        )) {
          console.log('Duplicate re-registration detected, updating UI');
          setSelectedStudent(student);
          setAttendanceStatus('present');
          setSuccessMessage('Already Present - Re-registration was already recorded');
          
          // Clear the form after showing already present message
          setTimeout(() => {
            setSearchTerm('');
            setSelectedStudent(null);
            setAttendanceStatus(null);
            setSuccessMessage('');
            if (searchInputRef.current) {
              searchInputRef.current.focus();
            }
          }, 2000);
          return;
        }
        
        const errorMsg = errorData.error || response.statusText || 'Unknown error';
        throw new Error(errorMsg);
      }

      const result = await response.json();
      console.log('Re-registration marked successfully:', result);

      // Add to recently processed to prevent duplicate submissions
      const registerKey = `${student.registerNumber}-${selectedDate}`;
      setRecentlyProcessed(prev => new Set([...prev, registerKey]));

      setSelectedStudent(student);
      setAttendanceStatus('present');
      setSuccessMessage(`${student.name} - Present (Re-registered)`);
      setShowSuccessFlash(true);
      
      // Dispatch custom event to notify other components
      const event = new CustomEvent('attendanceUpdated', {
        detail: { 
          action: 'reRegisterPresent',
          studentId: student.id, 
          studentName: student.name,
          registerNumber: student.registerNumber,
          timestamp: getCurrentLocalTime(),
          date: selectedDate
        }
      });
      console.log('Dispatching reRegisterAttendanceUpdated event:', event.detail);
      window.dispatchEvent(event);
      
      // Also dispatch a specific event for CheckIn/Out page
      const checkInEvent = new CustomEvent('studentCheckedIn', {
        detail: {
          studentId: student.id,
          studentName: student.name,
          registerNumber: student.registerNumber,
          checkInTime: getCurrentLocalTime(),
          date: selectedDate
        }
      });
      window.dispatchEvent(checkInEvent);
      
      // Clear the form and auto-focus for next entry after 2 seconds
      setTimeout(() => {
        setShowSuccessFlash(false);
        setSuccessMessage('');
        setSearchTerm('');
        setSelectedStudent(null);
        setAttendanceStatus(null);
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error handling re-registration:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setErrorMessage(`Failed to re-register attendance: ${errorMessage}`);
    }
  };


  // Add debounce for Enter key to prevent double submissions
  const handleKeyPress = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault(); // Prevent any default Enter behavior
      console.log('Enter pressed - searching student and marking attendance...');
      await handleSearch();
    }
  };

  if (isLoading && !selectedStudent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200 border-t-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Searching...</h2>
          <p className="text-gray-600">Looking for student...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendance Marking</h1>
          <p className="text-gray-600">Enter register number and press Enter to mark attendance as present in one step</p>
          
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
        </div>

        {/* Search Section */}
        <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 transition-all duration-200 ${showSuccessFlash ? 'bg-green-50' : ''}`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Enter Register Number & Press Enter to Mark Attendance</h3>
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Enter register number (e.g., 231270XX) and press Enter"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
                autoFocus
              />
            </div>
            <div className="flex space-x-3">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl font-medium transition-all flex items-center space-x-2"
              >
                <Search className="h-4 w-4" />
                <span>{isLoading ? 'Searching...' : 'Search'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-700 font-medium">{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-700 font-medium">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Student Info and Attendance Actions */}
        {selectedStudent && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                  <span className="text-blue-600 font-bold text-xl">{selectedStudent.name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedStudent.name}</h3>
                  <p className="text-gray-600">Register Number: {selectedStudent.registerNumber}</p>
                  <p className="text-gray-600">{selectedStudent.classYear} • {selectedStudent.department ? standardizeDepartmentName(selectedStudent.department) : 'Unknown'}</p>
                  <p className="text-gray-600">Phone: {selectedStudent.phoneNumber}</p>
                  {selectedStudent.email && <p className="text-gray-600">Email: {selectedStudent.email}</p>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Date: {new Date(selectedDate).toLocaleDateString()}</p>
                <p className="text-sm text-gray-500">Time: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>

            {/* Current Status */}
            {attendanceStatus && (
              <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-900">
                    Current Status: Present
                  </span>
                </div>
              </div>
            )}

                         {/* Attendance Actions - Removed since attendance is marked automatically */}

                         {/* Marking indicator removed since attendance is automatic */}
          </div>
        )}

        {/* Instructions */}
        {!selectedStudent && !errorMessage && !successMessage && (
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
            <div className="text-center">
              <Search className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Ready to Mark Attendance</h3>
              <p className="text-blue-700">
                Enter a student's register number above and press Enter. 
                Attendance will be marked as present immediately in one step.
              </p>
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default AttendanceMarkingPage;
