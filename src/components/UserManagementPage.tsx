import React, { useState, useEffect } from 'react';
import { 
  Users,
  Plus,
  Search,
  Edit,
  Download,
  UserPlus,
  Database
} from 'lucide-react';
import type { Student } from '../types';

const API_BASE = 'http://localhost:5000/api';


const UserManagementPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');



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
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/students`);
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const data = await response.json();
      
      // Transform database data to match our Student interface
      const transformedStudents = data.map((student: any) => ({
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
      }));
      
      setStudents(transformedStudents);
      setFilteredStudents(transformedStudents);
      setDbStatus('connected');
    } catch (error) {
      console.error('Error loading students:', error);
      // Fallback to empty array if API fails
      setStudents([]);
      setFilteredStudents([]);
      setDbStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, filterYear]);

  const filterStudents = () => {
    let filtered = students;

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.registerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.aadharNumber.includes(searchTerm) ||
        student.phoneNumber.includes(searchTerm)
      );
    }

    // Filter by year
    if (filterYear !== 'all') {
      filtered = filtered.filter(student => student.classYear === filterYear);
    }

    setFilteredStudents(filtered);
  };

  const handleAddStudent = async (studentData: Omit<Student, 'id' | 'createdAt'>) => {
    try {
      const response = await fetch(`${API_BASE}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: studentData.name,
          register_number: studentData.registerNumber,
          class_year: studentData.classYear,
          aadhar_number: studentData.aadharNumber,
          phone_number: studentData.phoneNumber,
          email: studentData.email,
          department: studentData.department
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add student');
      }

      const newStudent = await response.json();
      
      // Transform the response to match our interface
      const transformedStudent: Student = {
        id: newStudent.id.toString(),
        name: newStudent.name,
        registerNumber: newStudent.register_number,
        classYear: newStudent.class_year,
        aadharNumber: newStudent.aadhar_number ? 
          (typeof newStudent.aadhar_number === 'number' ? 
            (newStudent.aadhar_number as number).toLocaleString('fullwide', { useGrouping: false }) : 
            newStudent.aadhar_number.toString()
          ) : '',
        phoneNumber: newStudent.phone_number,
        email: newStudent.email || '',
        department: newStudent.department || 'BCA',
        isActive: newStudent.is_active,
        createdAt: new Date(newStudent.created_at)
      };

      setStudents([...students, transformedStudent]);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding student:', error);
      alert('Failed to add student. Please try again.');
    }
  };

  const handleEditStudent = async (studentData: Student) => {
    try {
      const response = await fetch(`${API_BASE}/students/${studentData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: studentData.name,
          register_number: studentData.registerNumber,
          class_year: studentData.classYear,
          aadhar_number: studentData.aadharNumber,
          phone_number: studentData.phoneNumber,
          email: studentData.email,
          department: studentData.department,
          is_active: studentData.isActive
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update student');
      }

      const updatedStudent = await response.json();
      
      // Transform the response to match our interface
      const transformedStudent: Student = {
        id: updatedStudent.id.toString(),
        name: updatedStudent.name,
        registerNumber: updatedStudent.register_number,
        classYear: updatedStudent.class_year,
        aadharNumber: updatedStudent.aadhar_number ? 
          (typeof updatedStudent.aadhar_number === 'number' ? 
            (updatedStudent.aadhar_number as number).toLocaleString('fullwide', { useGrouping: false }) : 
            updatedStudent.aadhar_number.toString()
          ) : '',
        phoneNumber: updatedStudent.phone_number,
        email: updatedStudent.email || '',
        department: updatedStudent.department || 'BCA',
        isActive: updatedStudent.is_active,
        createdAt: new Date(updatedStudent.created_at)
      };

      setStudents(students.map(student => 
        student.id === studentData.id ? transformedStudent : student
      ));
      setShowEditModal(false);
      setEditingStudent(null);
    } catch (error) {
      console.error('Error updating student:', error);
      alert('Failed to update student. Please try again.');
    }
  };



  const exportToCSV = () => {
    // Debug: Log the data being exported
    console.log('Exporting students:', filteredStudents);
    
    // Validate data before export
    const validStudents = filteredStudents.filter(student => {
      const isValid = student.name && student.registerNumber && student.aadharNumber && student.phoneNumber;
      if (!isValid) {
        console.warn('Invalid student data:', student);
      }
      return isValid;
    });
    
    console.log('Valid students for export:', validStudents);
    
    const csvContent = [
      'Name,Register Number,Class Year,Phone Number,Department,Created Date',
      ...validStudents.map(student => {
        const row = `"${student.name || ''}","${student.registerNumber || ''}","${student.classYear || ''}","${student.phoneNumber || ''}","${student.department || ''}","${student.createdAt ? student.createdAt.toLocaleDateString() : ''}"`;
        console.log('CSV Row:', row);
        return row;
      })
    ].join('\n');
    
    console.log('Full CSV Content:', csvContent);
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStats = () => {
    const total = students.length;
    const active = students.filter(student => student.isActive).length;
    
    return { total, active };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200 border-t-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600">Preparing student data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600">Manage students and their information</p>
          
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm font-medium">Total Students</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center border border-green-100">
                <UserPlus className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm font-medium">Active Students</p>
            <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-purple-50 rounded-xl flex items-center justify-center border border-purple-100">
                <Database className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm font-medium">Total Records</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
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
                  placeholder="Search by name, register number, aadhar, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Filter by Year */}
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="all">All Years</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>

            <div className="flex space-x-3">
              {/* Refresh Data */}
              <button
                onClick={loadStudents}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all flex items-center space-x-2"
              >
                <Database className="h-4 w-4" />
                <span>Refresh</span>
              </button>

              {/* Export CSV */}
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-all flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </button>

              {/* Add Student */}
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Student</span>
              </button>
            </div>
          </div>
        </div>

        {/* Students Table */}
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
                    Class Year
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Aadhar Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Contact Info
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                          <span className="text-blue-600 font-bold text-sm">{student.name.charAt(0)}</span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-semibold text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.department || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {student.registerNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.classYear}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {student.aadharNumber ? 
                        (typeof student.aadharNumber === 'number' ? 
                          (student.aadharNumber as number).toLocaleString('fullwide', { useGrouping: false }) : 
                          student.aadharNumber.toString()
                        ) : ''
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>{student.phoneNumber}</div>
                        <div className="text-gray-500">{student.email || 'No email'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.department || 'BCA'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setEditingStudent(student);
                          setShowEditModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1 rounded-lg transition-all flex items-center space-x-1"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                      No students found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <AddEditStudentModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddStudent}
          mode="add"
        />
      )}

      {/* Edit Student Modal */}
      {showEditModal && editingStudent && (
        <AddEditStudentModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingStudent(null);
          }}
          onSubmit={handleEditStudent}
          mode="edit"
          student={editingStudent}
        />
      )}
    </div>
  );
};

interface AddEditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (student: Student) => void;
  mode: 'add' | 'edit';
  student?: Student;
}

const AddEditStudentModal: React.FC<AddEditStudentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  student
}) => {
  const [formData, setFormData] = useState({
    name: student?.name || '',
    registerNumber: student?.registerNumber || '',
    classYear: student?.classYear || '1st Year',
    aadharNumber: student?.aadharNumber || '',
    phoneNumber: student?.phoneNumber || '',
    email: student?.email || '',
    department: student?.department || '',
    isActive: student?.isActive ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'edit' && student) {
      onSubmit({ ...student, ...formData });
    } else {
      // Create a new student with generated id and createdAt
      const newStudent: Student = {
        ...formData,
        id: Date.now().toString(),
        createdAt: new Date()
      };
      onSubmit(newStudent);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {mode === 'add' ? 'Add New Student' : 'Edit Student'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Register Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.registerNumber}
                  onChange={(e) => setFormData({ ...formData, registerNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Year *
                </label>
                <select
                  required
                  value={formData.classYear}
                  onChange={(e) => setFormData({ ...formData, classYear: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aadhar Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.aadharNumber}
                  onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1234-5678-9012"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Active Student</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all"
              >
                {mode === 'add' ? 'Add Student' : 'Update Student'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;
