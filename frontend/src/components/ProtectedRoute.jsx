import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

/**
 * A component to protect routes that require authentication.
 * It checks if a user is logged in and optionally if they have a specific role.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - The component to render if authenticated.
 * @param {string} [props.allowedRole] - The specific role required to access the route.
 */
const ProtectedRoute = ({ children, allowedRole }) => {
    const { t } = useTranslation();
    const { user, isLoggedIn, isAppLoading } = useAuth();
    const location = useLocation();

    // 0. Wait for the initial authentication check to complete
    if (isAppLoading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">{t('protectedRoute.loading')}</span>
                </div>
                <p className="mt-2">{t('protectedRoute.verifyingSession')}</p>
            </div>
        );
    }

    // 1. Check if the user is logged in
    if (!isLoggedIn) {
        // Redirect to login, saving the location they were trying to access.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 2. If a specific role is required, check if the user has that role
    if (allowedRole && user.role !== allowedRole) {
        // If the user is logged in but has the wrong role, send them to a generic access-denied or home page.
        return <Navigate to="/" replace />; // Or a dedicated /unauthorized page
    }

    // 3. If all checks pass, render the requested component
    return children;
};

export default ProtectedRoute;