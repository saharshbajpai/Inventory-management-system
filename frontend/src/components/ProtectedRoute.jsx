import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token, loading } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading security context...</p>
      </div>
    );
  }

  // If not logged in, redirect to login page
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role is specified and current user role is not allowed, redirect to home
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Show toast message to the user warning them about forbidden access
    setTimeout(() => {
      showToast('You do not have permission to view that page.', 'warning');
    }, 50);
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
