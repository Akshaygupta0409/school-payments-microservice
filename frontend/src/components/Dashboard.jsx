import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../App';
import NeonGridBackground from './NeonGridBackground';

// Custom Dropdown Component
const CustomDropdown = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (Array.isArray(value)) {
      setSelected(value);
    }
  }, [value]);

  const handleOptionClick = (option) => {
    let newSelected;
    if (selected.includes(option)) {
      newSelected = selected.filter(item => item !== option);
    } else {
      newSelected = [...selected, option];
    }
    setSelected(newSelected);
    onChange({ target: { name: 'status', value: newSelected } });
  };

  return (
    <div className="relative">
      <div 
        className="appearance-none flex justify-between items-center w-full px-3 py-2 border border-black-border bg-black-grid/50 rounded-md shadow-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-black-hover focus:border-black-hover transition-all duration-300 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1">
          {selected.length > 0 ? (
            selected.map(option => (
              <span key={option} className="px-2 py-0.5 bg-black-hover text-gray-300 rounded-full text-xs">
                {option}
              </span>
            ))
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <svg className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-black-grid border border-black-border rounded-md shadow-lg">
          {options.map(option => (
            <div 
              key={option.value} 
              className={`px-3 py-2 hover:bg-black-hover/50 cursor-pointer ${selected.includes(option.value) ? 'bg-black-hover/30' : ''}`}
              onClick={() => handleOptionClick(option.value)}
            >
              <div className="flex items-center">
                <div className={`w-4 h-4 mr-2 border border-gray-400 rounded-sm flex items-center justify-center ${selected.includes(option.value) ? 'bg-black-hover border-gray-300' : ''}`}>
                  {selected.includes(option.value) && (
                    <svg className="w-3 h-3 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                  )}
                </div>
                <span className="text-gray-300">{option.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: [],
    school_ids: [],
    start_date: '',
    end_date: '',
    page: 1,
    page_size: 10
  });
  const [sortConfig, setSortConfig] = useState({ 
    key: 'created_at', 
    direction: 'desc' 
  });
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [pagination, setPagination] = useState({
    total: 0,
    total_pages: 0
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { handleLogout } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();

  // Status options
  const statusOptions = [
    { value: 'Success', label: 'Success' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Failed', label: 'Failed' }
  ];

  // Load filters from URL params on initial load
  useEffect(() => {
    const urlParams = Object.fromEntries(searchParams.entries());
    
    const newFilters = { ...filters };
    
    if (urlParams.status) {
      newFilters.status = urlParams.status.split(',');
    }
    
    if (urlParams.school_ids) {
      newFilters.school_ids = urlParams.school_ids.split(',');
    }
    
    if (urlParams.start_date) {
      newFilters.start_date = urlParams.start_date;
    }
    
    if (urlParams.end_date) {
      newFilters.end_date = urlParams.end_date;
    }
    
    if (urlParams.page) {
      newFilters.page = parseInt(urlParams.page);
    }
    
    if (urlParams.sort_by) {
      setSortConfig({
        key: urlParams.sort_by,
        direction: urlParams.sort_direction || 'desc'
      });
    }
    
    setFilters(newFilters);

    // Check for payment error message from localStorage
    const paymentErrorMessage = localStorage.getItem('paymentErrorMessage');
    if (paymentErrorMessage) {
      setNotification({
        type: 'error',
        message: paymentErrorMessage
      });
      setShowNotification(true);
      localStorage.removeItem('paymentErrorMessage');
    }
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.status.length > 0) {
      params.set('status', filters.status.join(','));
    }
    
    if (filters.school_ids.length > 0) {
      params.set('school_ids', filters.school_ids.join(','));
    }
    
    if (filters.start_date) {
      params.set('start_date', filters.start_date);
    }
    
    if (filters.end_date) {
      params.set('end_date', filters.end_date);
    }
    
    if (filters.page > 1) {
      params.set('page', filters.page.toString());
    }
    
    if (sortConfig.key !== 'created_at' || sortConfig.direction !== 'desc') {
      params.set('sort_by', sortConfig.key);
      params.set('sort_direction', sortConfig.direction);
    }
    
    setSearchParams(params);
  }, [filters, sortConfig, setSearchParams]);

  // Handle payment callback notification
  useEffect(() => {
    if (location.state?.paymentProcessed) {
      const { orderId, status } = location.state;
      let notificationType = 'info';
      let notificationMessage = `Payment processed. Status: ${status}`;
      
      // Set notification type and message based on status
      if (status === 'SUCCESS') {
        notificationType = 'success';
        notificationMessage = 'Payment completed successfully!';
      } else if (status === 'FAILED') {
        notificationType = 'error';
        notificationMessage = location.state.statusMessage || 'Payment failed. Please try again.';
      } else if (status === 'CANCELLED') {
        notificationType = 'warning';
        notificationMessage = 'Payment was cancelled.';
      }
      
      // Show notification
      setNotification({
        type: notificationType,
        message: notificationMessage
      });
      setShowNotification(true);
      
      // Auto-hide notification after 5 seconds
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 5000);
      
      // Clear location state to prevent showing notification on refresh
      window.history.replaceState({}, document.title);
      
      // Refresh transactions to show the latest status
      fetchTransactions();
      
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Fetch transactions with filters
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        
        // Prepare API parameters
        const params = {
          page: filters.page,
          page_size: filters.page_size,
          sort_by: sortConfig.key,
          sort_direction: sortConfig.direction
        };
        
        // Add filters if they exist
        if (filters.status.length > 0) {
          params.status = filters.status;
        }
        
        if (filters.school_ids.length > 0) {
          params.school_ids = filters.school_ids;
        }
        
        if (filters.start_date) {
          params.start_date = filters.start_date;
        }
        
        if (filters.end_date) {
          params.end_date = filters.end_date;
        }
        
        // Make API call with authorization header
        const response = await axios.get('/api/transactions', { 
          params,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        // Update state with response data
        setTransactions(response.data.transactions || []);
        setPagination(response.data.pagination || { total: 0, total_pages: 0 });
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch transactions');
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [filters, sortConfig]);

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

  // Handle sorting
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: [],
      school_ids: [],
      start_date: '',
      end_date: '',
      page: 1,
      page_size: 10
    });
    setSortConfig({
      key: 'created_at',
      direction: 'desc'
    });
  };

  return (
    <div className="relative min-h-screen bg-dark-bg flex items-center justify-center px-4 py-12 overflow-hidden">
      <NeonGridBackground />
      
      <div className="relative z-10 w-full max-w-6xl bg-black-grid/60 backdrop-blur-lg rounded-2xl shadow-2xl border border-black-border p-8 space-y-6 transition-transform transform hover:shadow-black-hover/30 duration-300">
        {/* Notification */}
        {showNotification && (
          <div className={`fixed top-4 right-4 max-w-md p-4 rounded-lg shadow-lg border z-50 transition-all transform duration-300 ${showNotification ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'} ${
            notification.type === 'success' ? 'bg-green-600/20 border-green-500/30 text-green-400' :
            notification.type === 'error' ? 'bg-red-600/20 border-red-500/30 text-red-400' :
            notification.type === 'warning' ? 'bg-yellow-600/20 border-yellow-500/30 text-yellow-400' :
            'bg-blue-600/20 border-blue-500/30 text-blue-400'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === 'success' && (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {notification.type === 'error' && (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                {notification.type === 'warning' && (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                {notification.type === 'info' && (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => setShowNotification(false)}
                    className="inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-black-hover"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <div className="animate-pulse-slow">
            <h2 className="text-3xl font-extrabold text-gray-200">
              Transactions Dashboard
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              View and manage your payment transactions
            </p>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/create-payment')}
              className="px-4 py-2 bg-black-border hover:bg-black-hover text-white rounded-md transition-all duration-300 border border-transparent hover:border-black-hover/50 group"
            >
              <span className="group-hover:text-gray-200 transition-colors">Create New Payment</span>
            </button>
            <button
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="mt-8 bg-black-grid/30 p-4 rounded-lg border border-black-border/50">
          <h3 className="text-lg font-medium text-gray-300 mb-3">Filter Transactions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
              <CustomDropdown 
                options={statusOptions}
                value={filters.status}
                onChange={handleFilterChange}
                placeholder="Select Status"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">School IDs</label>
              <input
                type="text"
                name="school_ids"
                placeholder="comma-separated IDs"
                value={filters.school_ids.join(',')}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  school_ids: e.target.value.split(',').filter(id => id.trim()),
                  page: 1 // Reset to first page when filters change
                }))}
                className="appearance-none block w-full px-3 py-2 border border-black-border bg-black-grid/50 rounded-md shadow-sm placeholder-gray-500 text-gray-200 focus:outline-none focus:ring-2 focus:ring-black-hover focus:border-black-hover transition-all duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">From Date</label>
              <input
                type="date"
                name="start_date"
                value={filters.start_date}
                onChange={handleFilterChange}
                className="appearance-none block w-full px-3 py-2 border border-black-border bg-black-grid/50 rounded-md shadow-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-black-hover focus:border-black-hover transition-all duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">To Date</label>
              <input
                type="date"
                name="end_date"
                value={filters.end_date}
                onChange={handleFilterChange}
                className="appearance-none block w-full px-3 py-2 border border-black-border bg-black-grid/50 rounded-md shadow-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-black-hover focus:border-black-hover transition-all duration-300"
              />
            </div>
          </div>
        </div>

        {/* State Display */}
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-300"></div>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-800/30 text-red-200 p-4 rounded-lg">
            {error}
          </div>
        ) : (
          <div>
            {/* Transactions Table */}
            <div className="overflow-x-auto mt-6 rounded-lg border border-black-border/50">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-black-grid/70">
                    {[
                      { key: 'collect_id', label: 'Collect ID' },
                      { key: 'school_id', label: 'School ID' },
                      { key: 'gateway', label: 'Gateway' },
                      { key: 'order_amount', label: 'Order Amount' },
                      { key: 'transaction_amount', label: 'Transaction Amount' },
                      { key: 'status', label: 'Status' },
                      { key: 'custom_order_id', label: 'Custom Order ID' },
                      { key: 'created_at', label: 'Date' }
                    ].map(({ key, label }) => (
                      <th 
                        key={key} 
                        onClick={() => handleSort(key)}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-black-border cursor-pointer hover:bg-black-hover/10"
                      >
                        <div className="flex items-center">
                          {label} 
                          {sortConfig.key === key && (
                            <svg 
                              className={`ml-1 w-4 h-4 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.length > 0 ? transactions.map((transaction) => (
                    <tr 
                      key={transaction.collect_id || transaction.custom_order_id} 
                      className="hover:bg-black-hover/10 transition-all duration-300 border-b border-black-border"
                    >
                      <td className="px-4 py-3 text-gray-300">{transaction.collect_id}</td>
                      <td className="px-4 py-3 text-gray-300">{transaction.school_id}</td>
                      <td className="px-4 py-3 text-gray-300">{transaction.gateway}</td>
                      <td className="px-4 py-3 text-gray-300">₹{transaction.order_amount}</td>
                      <td className="px-4 py-3 text-gray-300">₹{transaction.transaction_amount}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(transaction.status.toLowerCase())}`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{transaction.custom_order_id}</td>
                      <td className="px-4 py-3 text-gray-300">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td 
                        colSpan={8} 
                        className="text-center py-8 text-gray-500 bg-black-grid/30"
                      >
                        <div className="flex flex-col items-center">
                          <svg className="w-12 h-12 text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2z" />
                          </svg>
                          <p>No transactions found</p>
                          <button 
                            onClick={clearFilters}
                            className="mt-3 text-sm text-gray-400 hover:text-gray-300 underline transition-colors"
                          >
                            Clear filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <div className="text-gray-400 text-sm">
                {transactions.length > 0 ? (
                  <span>Showing {(filters.page - 1) * filters.page_size + 1} to {Math.min(filters.page * filters.page_size, pagination.total || transactions.length)} of {pagination.total || transactions.length} entries</span>
                ) : (
                  <span>No results</span>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={filters.page === 1 || transactions.length === 0}
                  className="px-3 py-1 border border-black-border bg-black-grid/50 rounded text-gray-300 disabled:opacity-50 hover:bg-black-hover/30 transition-all duration-300"
                >
                  Previous
                </button>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={filters.page >= (pagination.total_pages || 1)}
                  className="px-3 py-1 border border-black-border bg-black-grid/50 rounded text-gray-300 disabled:opacity-50 hover:bg-black-hover/30 transition-all duration-300"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
