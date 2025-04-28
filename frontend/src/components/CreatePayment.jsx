import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import NeonGridBackground from './NeonGridBackground';

export default function CreatePayment() {
  const [formData, setFormData] = useState({
    amount: '',
    studentName: '',
    studentId: '',
    email: '',
    phoneNumber: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [animationClass, setAnimationClass] = useState('');
  const navigate = useNavigate();
  const { handleLogout } = useContext(AuthContext);

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
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Prepare payload for backend
      const payload = {
        amount: parseFloat(formData.amount),
        student_info: {
          name: formData.studentName,
          id: formData.studentId || `temp-${Date.now()}`,
          email: formData.email
        },
        phone_number: formData.phoneNumber // Add phone number to payload
      };

      const response = await axios.post('/api/payments/create-payment', payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Handle successful payment creation
      if (response.data && response.data.redirect_url) {
        // Always redirect to dashboard within 300ms
        setTimeout(() => {
          navigate('/dashboard');
        }, 300);
        
        // Optional: Open payment gateway in a new window
        window.open(response.data.redirect_url, '_blank');
      } else {
        throw new Error('Payment creation failed');
      }
    } catch (err) {
      // Always redirect to dashboard within 300ms, even on error
      setTimeout(() => {
        navigate('/dashboard');
      }, 300);
      
      // Optional: Show error notification on dashboard
      localStorage.setItem('paymentErrorMessage', err.response?.data?.message || 'Failed to create payment');
    }
  };

  return (
    <div className="relative min-h-screen bg-dark-bg flex items-center justify-center px-4 py-12 overflow-hidden">
      <NeonGridBackground />
      
      <div 
        className={`relative z-10 max-w-2xl w-full bg-black-grid/60 backdrop-blur-lg rounded-2xl shadow-2xl border border-black-border p-8 space-y-6 transition-all duration-500 ease-in-out transform ${animationClass}`}
      >
        <div className="flex justify-between items-center">
          <div className="text-center flex-grow">
            <h2 className="text-3xl font-extrabold text-gray-200 animate-pulse">
              Create New Payment
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Initiate a new payment transaction
            </p>
          </div>
          
          <button
            onClick={handleLogout}
            className="text-red-400 hover:text-red-300 transition-colors ml-4"
          >
            Logout
          </button>
        </div>
        
        {error && (
          <div className="bg-black-hover border border-black-border text-gray-400 p-3 rounded-lg animate-shake">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-400">
              Amount (₹)
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              required
              value={formData.amount}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-black-border bg-black-grid/50 rounded-md shadow-sm placeholder-gray-500 text-gray-200 focus:outline-none focus:ring-2 focus:ring-black-hover focus:border-black-hover transition-all duration-300"
              placeholder="Enter payment amount"
            />
          </div>

          <div>
            <label htmlFor="studentName" className="block text-sm font-medium text-gray-400">
              Student Name
            </label>
            <input
              id="studentName"
              name="studentName"
              type="text"
              required
              value={formData.studentName}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-black-border bg-black-grid/50 rounded-md shadow-sm placeholder-gray-500 text-gray-200 focus:outline-none focus:ring-2 focus:ring-black-hover focus:border-black-hover transition-all duration-300"
              placeholder="Enter student name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-gray-400">
                Student ID (Optional)
              </label>
              <input
                id="studentId"
                name="studentId"
                type="text"
                value={formData.studentId}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-black-border bg-black-grid/50 rounded-md shadow-sm placeholder-gray-500 text-gray-200 focus:outline-none focus:ring-2 focus:ring-black-hover focus:border-black-hover transition-all duration-300"
                placeholder="Enter student ID (optional)"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-400">
                Student Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-black-border bg-black-grid/50 rounded-md shadow-sm placeholder-gray-500 text-gray-200 focus:outline-none focus:ring-2 focus:ring-black-hover focus:border-black-hover transition-all duration-300"
                placeholder="Enter student email"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-400">
              Phone Number (for UPI payments)
            </label>
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-black-border bg-black-grid/50 rounded-md shadow-sm placeholder-gray-500 text-gray-200 focus:outline-none focus:ring-2 focus:ring-black-hover focus:border-black-hover transition-all duration-300"
              placeholder="Enter phone number for UPI"
            />
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
              {isLoading ? 'Processing...' : 'Create Payment'}
            </button>
          </div>
        </form>

        {/* Navigation buttons */}
        <div className="flex justify-center space-x-4 pt-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-gray-300 underline transition-colors text-sm"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => navigate('/transaction-status')}
            className="text-gray-400 hover:text-gray-300 underline transition-colors text-sm"
          >
            Check Transaction Status
          </button>
        </div>
      </div>
    </div>
  );
}
