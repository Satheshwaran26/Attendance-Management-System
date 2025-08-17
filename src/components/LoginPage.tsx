import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, isLoggedIn } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/admin/dashboard');
    }
  }, [isLoggedIn, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simple admin validation (in production, this should be server-side)
    if (username === 'admin' && password === 'adminsih') {
      // Use auth context to login
      login(username);
      
      // Redirect to admin dashboard
      navigate('/admin/dashboard');
    } else {
      setError('Invalid username or password');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-gray-200 to-gray-300 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="relative max-w-md w-full space-y-8 z-10">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center shadow-2xl mb-6">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 font-['Manrope'] tracking-tight">
            Welcome Back
          </h2>
          <p className="mt-3 text-lg text-gray-600 font-['Manrope']">
            Sign in to your attendance system
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 backdrop-blur-sm">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 font-['Manrope'] mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="appearance-none relative block w-full px-4 py-4 pl-12 border-2 border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-gray-100 focus:border-gray-800 transition-all duration-200 text-base font-['Manrope'] shadow-sm"
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 font-['Manrope'] mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none relative block w-full px-4 py-4 pl-12 pr-12 border-2 border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-gray-100 focus:border-gray-800 transition-all duration-200 text-base font-['Manrope'] shadow-sm"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-50 rounded-r-xl transition-colors duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-5 w-5 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 font-bold text-xs">!</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 font-['Manrope']">
                      {error}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-4 px-6 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-200 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-['Manrope'] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Signing in...
                  </div>
                ) : (
                  <>
                    <Lock className="h-5 w-5 mr-2" />
                    Sign in
                  </>
                )}
              </button>
            </div>


          </form>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500 font-['Manrope']">
            Secure attendance management system
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
