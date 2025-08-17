import React, { useState, useEffect } from 'react';
import { 
  Search,
  SortAsc, 
  SortDesc, 
  Eye, 
  RefreshCw,
  Download,
  Database,
  Crown,
  Users,
  GraduationCap,
  Calendar,
  Plus,
  X,
  CheckCircle
} from 'lucide-react';

interface Student {
  id: number;
  name: string;
  register_number: string;
  class_year: number;
  department: string;
  is_active: boolean;
}

interface Stats {
  total: number;
  byYear: { [key: number]: number };
  byDepartment: { [key: string]: number };
}

interface NewStudent {
  name: string;
  register_number: string;
  class_year: number;
  department: string;
  aadhar_number: string;
  phone_number: string;
  email: string;
}

const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://attendance-management-system-z2cc.onrender.com/api'
  : 'http://localhost:5000/api';

const UserManagementPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState<number | ''>('');
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [sortField, setSortField] = useState<keyof Student>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [stats, setStats] = useState<Stats>({ total: 0, byYear: {}, byDepartment: {} });
  const [dbConnected, setDbConnected] = useState(false);
  
  // Add Student Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState<NewStudent>({
    name: '',
    register_number: '',
    class_year: 1,
    department: '',
    aadhar_number: '',
    phone_number: '',
    email: ''
  });
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [addStudentError, setAddStudentError] = useState<string | null>(null);
  const [addStudentSuccess, setAddStudentSuccess] = useState<string | null>(null);

  // Fetch students from database
  useEffect(() => {
    fetchStudents();
    checkDatabaseConnection();
  }, []);

  // Filter and sort students when any filter changes
  useEffect(() => {
    filterAndSortStudents();
  }, [students, searchTerm, filterYear, filterDepartment, sortField, sortDirection]);

  const checkDatabaseConnection = async () => {
    try {
      const response = await fetch(`${API_BASE}/health`);
      setDbConnected(response.ok);
    } catch (error) {
      setDbConnected(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/students`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
        setError(null);
      } else {
        throw new Error('Failed to fetch students');
      }
    } catch (error) {
      setError('Failed to fetch students from database');
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (students: Student[]) => {
    const byYear: { [key: number]: number } = {};
    const byDepartment: { [key: string]: number } = {};

    students.forEach(student => {
      // Count by year
      byYear[student.class_year] = (byYear[student.class_year] || 0) + 1;
      
      // Count by department
      byDepartment[student.department] = (byDepartment[student.department] || 0) + 1;
    });

    setStats({
      total: students.length,
      byYear,
      byDepartment
    });
  };

  const filterAndSortStudents = () => {
    let filtered = [...students];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.register_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply year filter
    if (filterYear !== '') {
      filtered = filtered.filter(student => student.class_year === filterYear);
    }

    // Apply department filter
    if (filterDepartment) {
      filtered = filtered.filter(student => 
        student.department.toLowerCase().includes(filterDepartment.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

    setFilteredStudents(filtered);
    calculateStats(filtered);
  };

  const handleSort = (field: keyof Student) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Register Number', 'Department'];
    const csvContent = [
      headers.join(','),
      ...filteredStudents.map(student => [
        student.name,
        student.register_number,
        student.department
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${filterDepartment || 'all'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getYearOptions = () => {
    const years = [...new Set(students.map(s => s.class_year))].sort((a, b) => b - a);
    return years;
  };

  const getDepartmentOptions = () => {
    const departments = [...new Set(students.map(s => s.department))].sort();
    return departments;
  };

  const getSortIcon = (field: keyof Student) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />;
  };

  // Add Student Functions
  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.register_number || !newStudent.department) {
      setAddStudentError('Name, register number, and department are required');
      return;
    }

    setIsAddingStudent(true);
    setAddStudentError(null);
    setAddStudentSuccess(null);

    try {
      const response = await fetch(`${API_BASE}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStudent),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to add student');
      }

      const addedStudent = await response.json();
      console.log('Student added successfully:', addedStudent);
      
      setAddStudentSuccess(`Student ${addedStudent.name} added successfully!`);
      
      // Reset form
      setNewStudent({
        name: '',
        register_number: '',
        class_year: 1,
        department: '',
        aadhar_number: '',
        phone_number: '',
        email: ''
      });
      
      // Refresh student list
      await fetchStudents();
      
      // Close modal after delay
      setTimeout(() => {
        setShowAddModal(false);
        setAddStudentSuccess(null);
      }, 2000);
      
    } catch (error) {
      console.error('Error adding student:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setAddStudentError(`Failed to add student: ${errorMessage}`);
    } finally {
      setIsAddingStudent(false);
    }
  };

  const resetAddStudentForm = () => {
    setNewStudent({
      name: '',
      register_number: '',
      class_year: 1,
      department: '',
      aadhar_number: '',
      phone_number: '',
      email: ''
    });
    setAddStudentError(null);
    setAddStudentSuccess(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600">Loading student data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="w-8 h-8 text-gray-700" />
                Student Management
              </h1>
              <p className="text-gray-600 mt-2 text-lg">Manage all department students</p>
            </div>
            
            {/* Database Status */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200">
                <Database className={`w-5 h-5 ${dbConnected ? 'text-green-600' : 'text-red-600'}`} />
                <span className={`text-sm font-medium ${dbConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {dbConnected ? 'Connected' : 'Disconnected'}
            </span>
              </div>
          </div>
        </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Students</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center border border-green-100">
                  <GraduationCap className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Departments</p>
                  <p className="text-2xl font-bold text-green-900">{Object.keys(stats.byDepartment).length}</p>
                </div>
              </div>
          </div>
          
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-purple-50 rounded-xl flex items-center justify-center border border-purple-100">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-medium">Class Years</p>
                  <p className="text-2xl font-bold text-purple-900">{Object.keys(stats.byYear).length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-orange-50 rounded-xl flex items-center justify-center border border-orange-100">
                  <Crown className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-orange-600 font-medium">Largest Dept</p>
                  <p className="text-lg font-bold text-orange-900">
                    {Object.entries(stats.byDepartment).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
                  </p>
          </div>
              </div>
          </div>
        </div>

          {/* Controls Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                    placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

                {/* Year Filter */}
              <select
                value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value ? parseInt(e.target.value) : '')}
                  className="px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">All Years</option>
                  {getYearOptions().map(year => (
                    <option key={year} value={year}>Year {year}</option>
                  ))}
                </select>
              
                {/* Department Filter */}
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">All Departments</option>
                  {getDepartmentOptions().map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
              </select>
            </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
              <button
                  onClick={() => {
                    resetAddStudentForm();
                    setShowAddModal(true);
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all flex items-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add Student</span>
              </button>

              <button
                onClick={exportToCSV}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all flex items-center space-x-2"
              >
                  <Download className="h-5 w-5" />
                <span>Export CSV</span>
              </button>

              <button
                  onClick={fetchStudents}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-all flex items-center space-x-2"
              >
                  <RefreshCw className="h-5 w-5" />
                  <span>Refresh</span>
              </button>
              </div>
            </div>
          </div>

          {/* Department Breakdown */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Department Breakdown</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Object.entries(stats.byDepartment).map(([dept, count]) => (
                <div key={dept} className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-sm text-gray-600 font-medium">{dept}</p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Students ({filteredStudents.length} of {students.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Name
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('register_number')}
                  >
                    <div className="flex items-center gap-2">
                    Register Number
                      {getSortIcon('register_number')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('department')}
                  >
                    <div className="flex items-center gap-2">
                    Department
                      {getSortIcon('department')}
                    </div>
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
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {student.register_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        {student.department || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 px-3 py-1 rounded-lg transition-all flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No students found</p>
                      <p className="text-gray-400">Try adjusting your search or filters</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Add New Student</h2>
            <button
                  onClick={() => setShowAddModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
                  <X className="w-6 h-6" />
            </button>
          </div>

              {/* Success/Error Messages */}
              {addStudentSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-green-800 font-medium">{addStudentSuccess}</p>
                  </div>
                </div>
              )}

              {addStudentError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-800">{addStudentError}</p>
                </div>
              )}

              {/* Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Required Fields */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Information</h3>
                </div>
                
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Register Number *
                </label>
                <input
                  type="text"
                    value={newStudent.register_number}
                    onChange={(e) => setNewStudent({...newStudent, register_number: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter register number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Year *
                </label>
                <select
                    value={newStudent.class_year}
                    onChange={(e) => setNewStudent({...newStudent, class_year: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {[1, 2, 3, 4].map(year => (
                      <option key={year} value={year}>Year {year}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                </label>
                <input
                  type="text"
                    value={newStudent.department}
                    onChange={(e) => setNewStudent({...newStudent, department: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g., BCA, BBA, BSc"
                />
              </div>

                {/* Optional Fields */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Optional Information</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aadhar Number
                </label>
                <input
                    type="text"
                    value={newStudent.aadhar_number}
                    onChange={(e) => setNewStudent({...newStudent, aadhar_number: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter Aadhar number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                </label>
                <input
                    type="tel"
                    value={newStudent.phone_number}
                    onChange={(e) => setNewStudent({...newStudent, phone_number: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter phone number"
                />
              </div>

              <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleAddStudent}
                  disabled={isAddingStudent || !newStudent.name || !newStudent.register_number || !newStudent.department}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl font-medium transition-all flex items-center justify-center space-x-2 disabled:cursor-not-allowed"
                >
                  {isAddingStudent ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span>Add Student</span>
                    </>
                  )}
                </button>
                
              <button
                  onClick={() => setShowAddModal(false)}
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

export default UserManagementPage;
