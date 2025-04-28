import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NeonGridBackground from './NeonGridBackground';

export default function Login({ setIsAuthenticated }) {
  const [form, setForm] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    
    try {
      const response = await axios.post('/api/auth/login', form);
      
      // Store the token
      localStorage.setItem('token', response.data.token);
      
      // Update authentication state
      setIsAuthenticated(true);
      
      // Navigate to payments page
      navigate('/payments');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-dark-bg flex items-center justify-center px-4 py-12 overflow-hidden">
      <NeonGridBackground />
      
      <div 
        className={`relative z-10 max-w-md w-full bg-gray-900/50 backdrop-blur-lg rounded-2xl shadow-2xl border border-black-border p-8 space-y-6 transition-all duration-500 ease-in-out transform ${animationClass}`}
      >
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-200 animate-pulse">
            School Payments
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Sign in to your account
          </p>
        </div>
        
        {error && (
          <div className="bg-black-hover border border-black-border text-gray-400 p-3 rounded-lg animate-shake">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
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
                autoComplete="current-password"
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
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                ${isLoading 
                  ? 'bg-black-hover cursor-not-allowed' 
                  : 'bg-black-border hover:bg-black-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black-grid'
                } transition-all duration-300 ease-in-out`}
            >
              {isLoading ? 'Signing In...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>

      {/* Register Link at the bottom of the window */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center z-20">
        <div className="bg-black-grid/60 backdrop-blur-lg rounded-full px-6 py-3 border border-black-border shadow-lg">
          <p className="text-sm text-gray-500 flex items-center space-x-2">
            <span>Don't have an account?</span>
            <button
              onClick={() => navigate('/register')}
              className="text-gray-200 hover:underline focus:outline-none transition-all duration-300"
            >
              Register
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
