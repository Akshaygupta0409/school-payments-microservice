import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NeonGridBackground from './NeonGridBackground';

export default function Register() {
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [animationClass, setAnimationClass] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Add initial animation
    setAnimationClass('opacity-0 translate-y-4');
    const timer = setTimeout(() => {
      setAnimationClass('opacity-100 translate-y-0');
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Basic password validation
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      // Remove confirmPassword before sending to backend
      const { confirmPassword, ...submitForm } = form;
      
      await axios.post('/api/users/register', submitForm);
      
      // Redirect to login after successful registration
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-dark-bg flex items-center justify-center px-4 py-12 overflow-hidden">
      <NeonGridBackground />
      
      <div 
        className={`relative z-10 max-w-md w-full bg-black-grid/60 backdrop-blur-lg rounded-2xl shadow-2xl border border-black-border p-8 space-y-6 transition-all duration-500 ease-in-out transform ${animationClass}`}
      >
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-200 animate-pulse">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Register for School Payments
          </p>
        </div>
        
        {error && (
          <div className="bg-black-hover border border-black-border text-gray-400 p-3 rounded-lg animate-shake">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-400">
              Full Name
            </label>
            <div className="mt-1">
              <input
                id="name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                className="appearance-none block w-full px-3 py-2 border border-black-border bg-black-grid/50 rounded-md shadow-sm placeholder-gray-500 text-gray-200 focus:outline-none focus:ring-2 focus:ring-black-hover focus:border-black-hover transition-all duration-300"
                placeholder="Enter your full name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-400">
              Email address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
                className="appearance-none block w-full px-3 py-2 border border-black-border bg-black-grid/50 rounded-md shadow-sm placeholder-gray-500 text-gray-200 focus:outline-none focus:ring-2 focus:ring-black-hover focus:border-black-hover transition-all duration-300"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-400">
              Password
            </label>
            <div className="mt-1 relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={form.password}
                onChange={handleChange}
                className="appearance-none block w-full px-3 py-2 border border-black-border bg-black-grid/50 rounded-md shadow-sm placeholder-gray-500 text-gray-200 focus:outline-none focus:ring-2 focus:ring-black-hover focus:border-black-hover pr-10 transition-all duration-300"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-all duration-300"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400">
              Confirm Password
            </label>
            <div className="mt-1 relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={form.confirmPassword}
                onChange={handleChange}
                className="appearance-none block w-full px-3 py-2 border border-black-border bg-black-grid/50 rounded-md shadow-sm placeholder-gray-500 text-gray-200 focus:outline-none focus:ring-2 focus:ring-black-hover focus:border-black-hover pr-10 transition-all duration-300"
                placeholder="Confirm Password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-all duration-300"
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                ${isLoading 
                  ? 'bg-black-hover cursor-not-allowed' 
                  : 'bg-black-border hover:bg-black-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black-grid'
                } transition-all duration-300 ease-in-out`}
            >
              {isLoading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </div>

      {/* Login Link at the bottom of the window */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center z-20">
        <div className="bg-black-grid/60 backdrop-blur-lg rounded-full px-6 py-3 border border-black-border shadow-lg">
          <p className="text-sm text-gray-500 flex items-center space-x-2">
            <span>Already have an account?</span>
            <button
              onClick={() => navigate('/login')}
              className="text-gray-200 hover:underline focus:outline-none transition-all duration-300"
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
