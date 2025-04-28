import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import Dashboard from './components/Dashboard.jsx';
import CreatePayment from './components/CreatePayment.jsx';
import TransactionStatusCheck from './components/TransactionStatusCheck.jsx';

// Global auth context
const AuthContext = React.createContext({
  isAuthenticated: false,
  handleLogout: () => {}
});

// Logout Component
const Logout = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Prevent multiple logout attempts
    if (!isLoggingOut) return;
    
    const performLogout = async () => {
      try {
        // Optional: Call backend logout endpoint if exists
        await axios.post('/api/auth/logout', {}, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        // Clear authentication token and user data
        localStorage.removeItem('token');
        
        // Set logout complete
        setIsLoggingOut(false);
        
        // Redirect to login page
        navigate('/login', { replace: true });
      }
    };

    performLogout();
  }, [navigate, isLoggingOut]);

  return <div className="flex items-center justify-center min-h-screen bg-dark-bg">
    <div className="text-gray-300">{isLoggingOut ? 'Logging out...' : 'Redirecting to login...'}</div>
  </div>;
};

// Callback Component to handle payment redirect
const PaymentCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [processingStatus, setProcessingStatus] = useState('Processing your payment...');
  const [statusDetails, setStatusDetails] = useState({
    status: '',
    orderId: '',
    message: ''
  });

  useEffect(() => {
    // Parse query parameters
    const searchParams = new URLSearchParams(location.search);
    const orderId = searchParams.get('orderId');
    const status = searchParams.get('status');
    const collectRequestId = searchParams.get('EdvironCollectRequestId');
    const errorMessage = searchParams.get('error') || searchParams.get('errorMessage');

    // Log the callback details (optional, for debugging)
    console.log('Payment Callback Details:', { orderId, status, collectRequestId, errorMessage });

    // Detect payment failure from URL or error message
    const isPaymentFailed = 
      status?.toUpperCase() === 'FAILED' || 
      status?.toUpperCase() === 'FAILURE' || 
      status?.toLowerCase().includes('fail') ||
      errorMessage || 
      location.pathname.includes('payment-failed') ||
      document.title.includes('Failed');

    // Set status details for UI feedback
    let statusMessage = '';
    let statusClass = '';
    let finalStatus = status;
    
    if (isPaymentFailed) {
      finalStatus = 'FAILED';
      statusMessage = errorMessage || 'Your payment failed. Please try again.';
      statusClass = 'text-red-400';
    } else if (status) {
      switch(status.toUpperCase()) {
        case 'SUCCESS':
          statusMessage = 'Your payment was successful!';
          statusClass = 'text-green-400';
          break;
        case 'FAILED':
          statusMessage = 'Your payment failed. Please try again.';
          statusClass = 'text-red-400';
          break;
        case 'CANCELLED':
          statusMessage = 'Your payment was cancelled.';
          statusClass = 'text-yellow-400';
          break;
        default:
          statusMessage = 'Payment status: ' + status;
          statusClass = 'text-gray-300';
      }
    }
    
    setStatusDetails({
      status: finalStatus || 'UNKNOWN',
      orderId,
      message: statusMessage,
      class: statusClass
    });
    
    // Update status message for the processing screen
    setProcessingStatus(statusMessage || 'Processing payment...');

    // Check the transaction details from the API after a delay
    const checkTransactionDetails = async () => {
      if (!orderId) return;
      
      try {
        // Call the backend API to get transaction details
        const response = await axios.get(`/api/payments/transaction-status/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        console.log('Transaction details from API:', response.data);
        
        // If the API returns a different status, use that instead
        if (response.data && response.data.status) {
          const apiStatus = response.data.status.toUpperCase();
          if (apiStatus === 'FAILED' || apiStatus === 'CANCELLED') {
            finalStatus = apiStatus;
            setStatusDetails(prev => ({
              ...prev,
              status: apiStatus,
              message: apiStatus === 'FAILED' ? 'Your payment failed. Please try again.' : 'Your payment was cancelled.'
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching transaction details:', error);
        // If we can't get transaction details and no status, assume failed
        if (!status) {
          finalStatus = 'FAILED';
          setStatusDetails(prev => ({
            ...prev,
            status: 'FAILED',
            message: 'Unable to determine payment status. Please check your dashboard.'
          }));
        }
      } finally {
        // Redirect to dashboard with payment state immediately
        navigate('/dashboard', { 
          state: { 
            paymentProcessed: true,
            orderId, 
            status: finalStatus || 'UNKNOWN',
            statusMessage: statusDetails.message
          } 
        });
      }
    };
    
    // Check transaction details immediately
    checkTransactionDetails();

  }, [navigate, location]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-dark-bg px-4">
      <div className="max-w-md w-full bg-black-grid/60 backdrop-blur-lg rounded-2xl shadow-2xl border border-black-border p-8 space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-200">Payment Processing</h2>
        
        {statusDetails.status ? (
          <div className="text-center">
            <div className={`text-xl font-semibold my-4 ${statusDetails.class}`}>
              {statusDetails.message}
            </div>
            
            {statusDetails.orderId && (
              <div className="text-sm text-gray-400 mb-4">
                Order ID: {statusDetails.orderId}
              </div>
            )}
            
            <div className="text-sm text-gray-400 animate-pulse">
              Redirecting to dashboard...
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-300 mb-4"></div>
            <div className="text-gray-300">{processingStatus}</div>
          </div>
        )}
      </div>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    // Check token validity
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  return token ? children : <Navigate to="/login" replace />;
};

// Main App Component
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check authentication on mount and when token changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  // Centralized logout function
  const handleLogout = () => {
    navigate('/logout');
  };

  // Navigation logic
  useEffect(() => {
    const token = localStorage.getItem('token');
    const isAuth = !!token;
    
    // If authenticated, redirect from login/register pages
    if (isAuth) {
      if (location.pathname === '/login' || location.pathname === '/register') {
        navigate('/dashboard');
      }
    } 
    // If not authenticated, redirect to login except on register or logout pages
    else if (location.pathname !== '/register' && 
             location.pathname !== '/logout' && 
             !location.pathname.startsWith('/payment-callback')) {
      navigate('/login');
    }
  }, [location.pathname, navigate]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, handleLogout }}>
      <div className="min-h-screen bg-dark-bg">
        {isAuthenticated && location.pathname !== '/logout' && 
         !location.pathname.startsWith('/payment-callback') && (
          <></>
        )}
        
        <Routes>
          <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/create-payment" 
            element={
              <ProtectedRoute>
                <CreatePayment />
              </ProtectedRoute>
            } 
          />
          
          {/* Transaction Status Check Route */}
          <Route 
            path="/transaction-status" 
            element={
              <ProtectedRoute>
                <TransactionStatusCheck />
              </ProtectedRoute>
            } 
          />
          
          {/* Logout Route */}
          <Route 
            path="/logout" 
            element={<Logout />} 
          />
          
          {/* Payment Callback Route */}
          <Route 
            path="/payment-callback" 
            element={<PaymentCallback />} 
          />
          
          {/* Default Redirect */}
          <Route 
            path="*" 
            element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
          />
        </Routes>
      </div>
    </AuthContext.Provider>
  );
}

// Root component wrapping App with Router
export default function WrappedApp() {
  return (
    <Router>
      <App />
    </Router>
  );
}

// Export context for use in components
export { AuthContext };
