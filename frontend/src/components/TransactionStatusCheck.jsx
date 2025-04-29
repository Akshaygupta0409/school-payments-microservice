import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import NeonGridBackground from './NeonGridBackground';

export default function TransactionStatusCheck() {
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [animationClass, setAnimationClass] = useState('opacity-0 translate-y-4');
  
  const navigate = useNavigate();
  const { handleLogout } = useContext(AuthContext);

  // Apply initial animation
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationClass('opacity-100 translate-y-0');
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
<<<<<<< HEAD
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post('/api/payments/check-status', 
        { orderId },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // Handle different possible response structures
      if (response.data) {
        setResult({
          status: response.data.status || 'Unknown',
          order_id: response.data.order_id || response.data.custom_order_id || orderId,
          collect_id: response.data.collect_id || 'N/A',
          order_amount: response.data.order_amount || 'N/A',
          transaction_amount: response.data.transaction_amount || 'N/A',
          payment_mode: response.data.payment_mode || 'N/A',
          payment_time: response.data.payment_time || null,
          error_message: response.data.error_message || 'No additional error details',
          payment_message: response.data.payment_message || 'No payment message available'
        });
      } else {
        throw new Error('Unable to retrieve transaction status');
      }
    } catch (err) {
      // More comprehensive error handling
      const errorMessage = err.response?.data?.message || 
                           err.response?.data?.error || 
                           err.message || 
                           'Failed to check transaction status';
      
      // Set result with error details
      setResult({
        status: 'Failed',
        order_id: orderId,
        error_message: errorMessage,
        payment_message: 'Transaction status check encountered an issue'
      });

      // Log the full error for debugging
      console.error('Transaction status check error:', err);
=======
    if (!orderId.trim()) {
      setError('Please enter an Order ID');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);

      const response = await axios.get(`/api/payments/transaction-status/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setResult(response.data);
    } catch (err) {
      console.error('Error checking transaction status:', err);
      setError(err.response?.data?.message || 'Failed to check transaction status. Please try again.');
>>>>>>> 272ee2693445b70699169ced8c99b1e27478756c
    } finally {
      setLoading(false);
    }
  };

  // Get status color based on status
  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-600/20 text-gray-400';
    
    const normalizedStatus = typeof status === 'string' ? status.toLowerCase() : '';
    
    switch (normalizedStatus) {
      case 'success':
        return 'bg-green-600/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30';
      case 'failed':
        return 'bg-red-600/20 text-red-400 border-red-500/30';
      case 'cancelled':
        return 'bg-orange-600/20 text-orange-400 border-orange-500/30';
      default:
        return 'bg-gray-600/20 text-gray-400';
    }
  };

  return (
    <div className="relative min-h-screen bg-dark-bg flex items-center justify-center px-4 py-12 overflow-hidden">
      <NeonGridBackground />
      
      <div 
        className={`relative z-10 max-w-xl w-full bg-black-grid/60 backdrop-blur-lg rounded-2xl shadow-2xl border border-black-border p-8 space-y-6 transition-all duration-500 ease-in-out transform ${animationClass}`}
      >
        <div className="flex justify-between items-center">
          <div className="text-center flex-grow">
            <h2 className="text-3xl font-extrabold text-gray-200 animate-pulse">
              Check Transaction Status
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Enter a transaction ID to check its current status
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
          <div className="bg-black-hover border border-red-500/30 text-red-400 p-3 rounded-lg animate-shake">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="orderId" className="block text-sm font-medium text-gray-400">
              Order ID / Transaction ID
            </label>
            <input
              id="orderId"
              name="orderId"
              type="text"
              required
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-black-border bg-black-grid/50 rounded-md shadow-sm placeholder-gray-500 text-gray-200 focus:outline-none focus:ring-2 focus:ring-black-hover focus:border-black-hover transition-all duration-300"
              placeholder="Enter order ID or transaction ID"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                ${loading 
                  ? 'bg-black-hover cursor-not-allowed' 
                  : 'bg-black-border hover:bg-black-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black-grid'
                } transition-all duration-300 ease-in-out`}
            >
              {loading ? 'Checking...' : 'Check Status'}
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
            onClick={() => navigate('/create-payment')}
            className="text-gray-400 hover:text-gray-300 underline transition-colors text-sm"
          >
            Create New Payment
          </button>
        </div>

        {/* Result display */}
        {result && (
          <div className="mt-6 border border-black-border/50 rounded-lg overflow-hidden">
            <div className="bg-black-grid/30 px-4 py-3 border-b border-black-border/50">
              <h3 className="text-lg font-medium text-gray-300">Transaction Details</h3>
            </div>
            <div className="p-4 space-y-4">
              {/* Status */}
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(result.status)}`}>
                  {result.status || 'Unknown'}
                </span>
              </div>
              
              {/* Order Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Order ID</div>
<<<<<<< HEAD
                  <div className="text-gray-300 truncate">{result.order_id || 'N/A'}</div>
=======
                  <div className="text-gray-300 truncate">{result.custom_order_id || result.order_id || 'N/A'}</div>
>>>>>>> 272ee2693445b70699169ced8c99b1e27478756c
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Collection ID</div>
                  <div className="text-gray-300 truncate">{result.collect_id || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Amount</div>
                  <div className="text-gray-300">u20b9{result.order_amount || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Transaction Amount</div>
                  <div className="text-gray-300">u20b9{result.transaction_amount || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Payment Mode</div>
                  <div className="text-gray-300">{result.payment_mode || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Payment Time</div>
                  <div className="text-gray-300">{result.payment_time ? new Date(result.payment_time).toLocaleString() : 'N/A'}</div>
                </div>
              </div>
              
              {/* Additional Info */}
              {result.error_message && (
                <div className="mt-4 bg-red-900/10 border border-red-800/20 rounded p-3">
                  <div className="text-xs text-gray-500 mb-1">Error Message</div>
                  <div className="text-red-400">{result.error_message}</div>
                </div>
              )}
              
              {result.payment_message && (
                <div className="mt-4 bg-gray-900/10 border border-gray-800/20 rounded p-3">
                  <div className="text-xs text-gray-500 mb-1">Payment Message</div>
                  <div className="text-gray-300">{result.payment_message}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
