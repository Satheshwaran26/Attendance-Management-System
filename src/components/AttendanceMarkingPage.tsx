import React, { useState, useEffect } from 'react';
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

  const API_BASE = process.env.NODE_ENV === 'production' 
    ? 'https://attendance-management-system-z2cc.onrender.com/api' 
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
  }, []);

  // Auto-focus the input field when component mounts
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const checkExistingAttendance = async (studentId: string, date: string) => {
    try {
      console.log('Checking existing attendance for student:', studentId, 'on date:', date);
      const response = await fetch(`${API_BASE}/attendance/check?student_id=${studentId}&date=${date}`);
      console.log('Check attendance response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Check attendance response data:', data);
        
        if (data.exists) {
          if (data.isCheckedOut) {
            // Student was checked out, can be marked present again
            return { exists: true, canMarkPresent: true, isCheckedOut: true };
          } else {
            // Student is already present and not checked out
            return { exists: true, canMarkPresent: false, isCheckedOut: false };
          }
        } else {
          // No attendance record exists
          return { exists: false, canMarkPresent: true, isCheckedOut: false };
        }
      }
      console.log('Check attendance response not ok');
      return { exists: false, canMarkPresent: true, isCheckedOut: false };
    } catch (error) {
      console.error('Error checking existing attendance:', error);
      return { exists: false, canMarkPresent: true, isCheckedOut: false };
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim() || isLoading) {
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
          department: student.department || 'BCA',
          isActive: student.is_active,
          createdAt: new Date(student.created_at)
        };
        
        console.log('Transformed student:', transformedStudent);
        setSelectedStudent(transformedStudent);
        
        // Check if attendance already exists for today
        const existingAttendance = await checkExistingAttendance(transformedStudent.id, selectedDate);
        console.log('Existing attendance check:', existingAttendance);
        
        if (existingAttendance.exists && !existingAttendance.canMarkPresent) {
          // Student is already present and not checked out
          setAttendanceStatus('present');
          setSuccessMessage('Already Present');
          
          // Dispatch event to notify CheckIn/Out page that student is already present
          const event = new CustomEvent('studentAlreadyPresent', {
            detail: { 
              action: 'alreadyPresent',
              studentId: transformedStudent.id, 
              studentName: transformedStudent.name,
              registerNumber: transformedStudent.registerNumber,
              timestamp: new Date().toISOString(),
              date: selectedDate
            }
          });
          window.dispatchEvent(event);
          
          // IMPORTANT: Don't call handleMarkAttendance() - preserve existing data
          return;
        } else if (existingAttendance.exists && existingAttendance.isCheckedOut) {
          // Student was checked out, can be marked present again (re-registration)
          setAttendanceStatus(null);
          setSuccessMessage(`✅ ${transformedStudent.name} was checked out earlier. Re-registering for new session...`);
          
          // For re-registration, create a NEW attendance record, don't update existing
          await handleReRegistration(transformedStudent);
        } else {
          // No attendance record exists, can mark as present (first time)
          setAttendanceStatus(null);
          setSuccessMessage(`${transformedStudent.name} - Present`);
          
          // Automatically mark as present immediately
          await handleMarkAttendance();
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

  const handleMarkAttendance = async () => {
    if (!selectedStudent) return;

    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      console.log('Marking attendance for student:', selectedStudent.id, 'on date:', selectedDate);
      
      // Check again if attendance already exists
      const existingAttendance = await checkExistingAttendance(selectedStudent.id, selectedDate);
      console.log('Double-check existing attendance:', existingAttendance);
      
      if (existingAttendance.exists && !existingAttendance.canMarkPresent) {
        setAttendanceStatus('present');
        setSuccessMessage(`${selectedStudent.name} is already registered for today!`);
        return;
      }

      const attendanceData = {
        student_id: selectedStudent.id,
        date: selectedDate,
        status: 'present',
        check_in_time: new Date().toISOString(),
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
        if (errorData.error && errorData.error.includes('already present')) {
          setAttendanceStatus('present');
          setSuccessMessage('Already Present');
          return;
        }
        
        // Throw a clean error message
        const errorMsg = errorData.error || response.statusText || 'Unknown error';
        throw new Error(errorMsg);
      }

      const result = await response.json();
      console.log('Attendance marked successfully:', result);

      setAttendanceStatus('present');
      setSuccessMessage(`${selectedStudent.name} - Present`);
      setShowSuccessFlash(true);
      setTimeout(() => {
        setShowSuccessFlash(false);
        setSuccessMessage('');
      }, 2000);
      
      // Auto-focus the input field for next entry
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
      
      // Dispatch custom event to notify other components
      const event = new CustomEvent('attendanceUpdated', {
        detail: { 
          action: 'markPresent',
          studentId: selectedStudent.id, 
          studentName: selectedStudent.name,
          registerNumber: selectedStudent.registerNumber,
          timestamp: new Date().toISOString(),
          date: selectedDate
        }
      });
      console.log('Dispatching attendanceUpdated event:', event.detail);
      window.dispatchEvent(event);
      
      // Also dispatch a specific event for CheckIn/Out page
      const checkInEvent = new CustomEvent('studentCheckedIn', {
        detail: {
          studentId: selectedStudent.id,
          studentName: selectedStudent.name,
          registerNumber: selectedStudent.registerNumber,
          checkInTime: new Date().toISOString(),
          date: selectedDate
        }
      });
      window.dispatchEvent(checkInEvent);
      
      // Clear the search term after successful marking
      setSearchTerm('');
      setSelectedStudent(null);
      setAttendanceStatus(null);
      
    } catch (error) {
      console.error('Error marking attendance:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setErrorMessage(`Failed to mark attendance: ${errorMessage}`);
    }
  };

  const handleReRegistration = async (student: Student) => {
    if (!student) return;

    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      console.log('Handling re-registration for student:', student.id, 'on date:', selectedDate);
      
      // Create a new attendance record for re-registration
      const reRegistrationData = {
        student_id: student.id,
        date: selectedDate,
        status: 'present',
        check_in_time: new Date().toISOString(),
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
        
        const errorMsg = errorData.error || response.statusText || 'Unknown error';
        throw new Error(errorMsg);
      }

      const result = await response.json();
      console.log('Re-registration marked successfully:', result);

      setAttendanceStatus('present');
      setSuccessMessage(`${student.name} - Present`);
      setShowSuccessFlash(true);
      setTimeout(() => {
        setShowSuccessFlash(false);
        setSuccessMessage('');
      }, 2000);
      
      // Auto-focus the input field for next entry
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
      
      // Dispatch custom event to notify other components
      const event = new CustomEvent('attendanceUpdated', {
        detail: { 
          action: 'reRegisterPresent',
          studentId: student.id, 
          studentName: student.name,
          registerNumber: student.registerNumber,
          timestamp: new Date().toISOString(),
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
          checkInTime: new Date().toISOString(),
          date: selectedDate
        }
      });
      window.dispatchEvent(checkInEvent);
      
      // Clear the search term after successful re-registration
      setSearchTerm('');
      setSelectedStudent(null);
      setAttendanceStatus(null);
      
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
                     <p className="text-gray-600">Enter register number and press Enter to automatically mark attendance as present</p>
          
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
                     <h3 className="text-lg font-semibold text-gray-900 mb-4">Enter Register Number & Press Enter</h3>
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Enter register number (e.g., 23127046) and press Enter"
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
                  <p className="text-gray-600">{selectedStudent.classYear} • {selectedStudent.department}</p>
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
                 Attendance will be automatically marked as present and a confirmation popup will appear.
               </p>
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default AttendanceMarkingPage;
