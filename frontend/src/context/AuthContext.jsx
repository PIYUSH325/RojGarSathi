import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Create the Context
const AuthContext = createContext();

// Custom Hook to use the auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Utility function to get the working API base URL

const normalizeApiBase = (base) => {
    const clean = (base || '').replace(/\/+$/, '');
    if (clean.endsWith('/api/v1')) return clean;
    if (clean.endsWith('/api')) return `${clean}/v1`;
    return `${clean}/api/v1`;
};

// Note: `apiBase` will be detected on app startup and exposed via state



// 3. Auth Provider Component
export const AuthProvider = ({ children }) => {
    // Restore auth state from storage so refresh does not log the user out
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
        try {
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (error) {
            console.error('Failed to parse stored user:', error);
            return null;
        }
    });
    const [token, setToken] = useState(() =>
        localStorage.getItem('token') || sessionStorage.getItem('token') || null
    );
    const [isLoading, setIsLoading] = useState(false);
    const [isAppLoading, setIsAppLoading] = useState(true); // New state for initial app loading
    const [authError, setAuthError] = useState(null);
    const [appliedJobs, setAppliedJobs] = useState(JSON.parse(localStorage.getItem('appliedJobs') || '[]'));
    const [profilePhoto, setProfilePhoto] = useState(localStorage.getItem('profilePhoto') || '');
    const [resume, setResume] = useState(localStorage.getItem('resume') || '');
    const [notifications, setNotifications] = useState([]);
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

    // Detected API base URL (runtime) — other contexts will read from this via context
    const [apiBase, setApiBase] = useState(process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1');

    const getApiBaseUrl = useCallback(async () => {
        if (apiBase) {
            return normalizeApiBase(apiBase);
        }

        const envBase = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';
        return normalizeApiBase(envBase);
    }, [apiBase]);

    const isLoggedIn = !!user;

    // --- Utility: Logout Function (Wrapped in useCallback) ---
    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        setAuthError(null);
        setAppliedJobs([]);
        setProfilePhoto('');
        setResume('');
        setNotifications([]);
        setUnreadNotificationsCount(0);
        // Clear both storages on explicit logout
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('appliedJobs');
        localStorage.removeItem('profilePhoto');
        localStorage.removeItem('resume');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
        console.log("Logged out successfully.");
        // Optionally redirect user after logout here
        // e.g., navigate('/login');
    }, []);

    // --- Utility: Persist user state ---
    const persistUser = (userData, userToken, rememberMe) => {
        const storage = rememberMe ? localStorage : sessionStorage;
        // Clear the other storage to avoid conflicts
        (rememberMe ? sessionStorage : localStorage).removeItem('user');
        (rememberMe ? sessionStorage : localStorage).removeItem('token');

        storage.setItem('user', JSON.stringify(userData));
        storage.setItem('token', userToken);
    };

    // --- Utility: Token-Aware Fetch Wrapper (authFetch) ---
const authFetch = useCallback(async (endpoint, options = {}) => {
        const defaultHeaders = {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
        };

        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            // Use relative path to leverage CRA proxy http://localhost:5000
            const fullUrl = `/api/v1/${endpoint}`;
            console.log('📡 AuthFetch (proxy):', config.method || 'GET', fullUrl);
            
            const response = await fetch(fullUrl, {
                ...config,
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            console.log('📊 Response Status:', response.status, response.statusText);

            // Check for unauthorized status and trigger logout
            if (response.status === 401) {
                console.error("Token expired or unauthorized. Logging out...");
                logout();
                throw new Error("Unauthorized access. Please log in again.");
            }

            // For non-2xx status codes, parse error message
            if (!response.ok) {
                console.warn(`⚠️ Response not OK (${response.status}):`, response.statusText);
                try {
                    const errorData = await response.json();
                    throw new Error(errorData.msg || `HTTP ${response.status}: ${response.statusText}`);
                } catch (parseErr) {
                    // If response is not JSON, use status text
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            }

            // Return response object for further handling (e.g., parsing JSON)
            console.log('✓ Fetch successful');
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            
            // Handle specific error types
            if (error.name === 'AbortError') {
                console.error("❌ Authenticated Fetch Timeout: Request took too long");
                throw new Error('Request timeout');
            } else {
                console.error("❌ Authenticated Fetch Error:", error.message || error);
            }
            
            throw error; // Re-throw the error for the calling component to handle
        }
    }, [token, logout, apiBase]);


    // --- Core Authentication Handlers ---



    const handleRegisterResponse = async (response) => {
        const data = await response.json();

        if (response.ok) {
            setAuthError(null);
            // We don't set user/token here. Registration is separate from login.
            return data; // Return success data
        } else {
            // Handle backend validation errors (e.g., email already exists)
            const errorMessage = data.msg || "Registration failed. Please try again.";
            setAuthError(errorMessage);
            return Promise.reject(errorMessage);
        }
    };

    const login = async (email, password, role, rememberMe = false) => {
        setIsLoading(true);
        setAuthError(null);

        try {
            // Ensure we have a valid API base (use detected apiBase or probe if missing)
            let base = apiBase;
            if (!base) {
                base = await getApiBaseUrl();
                setApiBase(base);
            }

            const response = await fetch(`${base}/auth/login`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email, password, role }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.msg || 'Login failed');
            }

            setUser(data.user);
            setToken(data.token);
            persistUser(data.user, data.token, rememberMe);
            setAppliedJobs([]); // Reset on new login
            setProfilePhoto(data.user.profilePhoto || '');
            setResume(data.user.resume || '');
            setUser(prev => ({ ...prev, city: data.user.city, pincode: data.user.pincode, skills: data.user.skills }));
            return data;
        } catch (error) {
            console.error('Login error:', error);
            setAuthError(error.message || 'Network error or server unreachable.');
            return Promise.reject(error);
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (name, email, phone, password, role) => {
        setIsLoading(true);
        setAuthError(null);
        try {
            const base = apiBase || (await getApiBaseUrl());
            if (!apiBase) setApiBase(base);
            const response = await fetch(`${base}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phone, password, role }),
            });
            return await handleRegisterResponse(response); // Use the new handler
        } catch (error) {
            console.error("Register API Error:", error);
            setAuthError("Network error or server unreachable.");
        } finally {
            setIsLoading(false);
        }
    };

    const forgotPassword = async (email) => {
        setIsLoading(true);
        setAuthError(null);
        try {
            const detected = apiBase || (await getApiBaseUrl());
            const base = normalizeApiBase(detected);
            if (!apiBase) setApiBase(base);
            const { data } = await axios.post(`${base}/auth/forgot-password`, { email });
            return data;
        } catch (error) {
            const message = error.response?.data?.msg || error.message || 'Failed to send reset link';
            setAuthError(message);
            return Promise.reject(error);
        } finally {
            setIsLoading(false);
        }
    };

    const resetPassword = async (token, password) => {
        setIsLoading(true);
        setAuthError(null);
        try {
            const detected = apiBase || (await getApiBaseUrl());
            const base = normalizeApiBase(detected);
            if (!apiBase) setApiBase(base);
            const { data } = await axios.post(`${base}/auth/reset-password/${token}`, { password });
            return data;
        } catch (error) {
            const message = error.response?.data?.msg || error.message || 'Failed to reset password';
            setAuthError(message);
            return Promise.reject(error);
        } finally {
            setIsLoading(false);
        }
    };
    
    // --- Effect: Initial Auth Check on Mount ---
    // Check server connection and set API_BASE_URL
    const checkAuthStatus = useCallback(async () => {
        try {
            const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
            const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');

            if (storedUser && storedToken) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                    setToken(storedToken);
                    setProfilePhoto(parsedUser.profilePhoto || localStorage.getItem('profilePhoto') || '');
                    setResume(parsedUser.resume || localStorage.getItem('resume') || '');
                } catch (parseError) {
                    console.error('Failed to restore auth from storage:', parseError);
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    sessionStorage.removeItem('user');
                    sessionStorage.removeItem('token');
                }
            }
            // No longer need dynamic base URL detection - using proxy
        } catch (err) {
            console.error('Auth check error:', err);
        }
        setIsAppLoading(false);
    }, []);

    // This useEffect should only run ONCE on initial app load.
    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]);

    // --- Effect: Listen for Socket Auth Errors ---
    useEffect(() => {
        const handleSocketAuthError = () => {
            console.error("Socket auth error detected. Logging out...");
            logout(); // Clears local storage and resets state
        };
        window.addEventListener('socket_auth_error', handleSocketAuthError);
        return () => window.removeEventListener('socket_auth_error', handleSocketAuthError);
    }, [logout]);

    // Persist appliedJobs, profilePhoto, resume to localStorage when changed
    useEffect(() => {
        if (user) {
            localStorage.setItem('appliedJobs', JSON.stringify(appliedJobs));
            localStorage.setItem('profilePhoto', profilePhoto || '');
            localStorage.setItem('resume', resume || '');
        }
    }, [appliedJobs, profilePhoto, resume, user]);

    // Apply to job function (now uses API)
    const applyJob = async (jobId, jobData, coverLetter = '') => {
        if (!isLoggedIn || !user) {
            setAuthError('Please log in to apply for jobs.');
            return false;
        }

        try {
            const response = await authFetch('applications', {
                method: 'POST',
                body: JSON.stringify({ jobId, coverLetter }),
            });

            const data = await response.json();

            if (response.ok) {
                // Update local state with the new application
                setAppliedJobs(prev => [...prev, data.application]);
                setUser(prev => ({ ...prev, appliedJobs: [...(prev.appliedJobs || []), data.application] }));
                return true;
            } else {
                setAuthError(data.msg || 'Failed to apply for job.');
                return false;
            }
        } catch (error) {
            setAuthError(error.message);
            return false;
        }
    };

    // Undo apply function (now uses API)
    const undoApply = async (applicationId) => {
        if (!user || !token) {
            setAuthError('Please log in to withdraw application.');
            return false;
        }

        try {
            const base = apiBase || (await getApiBaseUrl());
            if (!apiBase) setApiBase(base);
            const response = await fetch(`${base}/applications/${applicationId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                setAppliedJobs(prev => prev.filter(app => app._id !== applicationId));
                setUser(prev => ({
                    ...prev,
                    appliedJobs: (prev.appliedJobs || []).filter(app => app._id !== applicationId)
                }));
                return true;
            }

            setAuthError(data.msg || 'Failed to withdraw application');
            return false;
        } catch (error) {
            console.error('Error withdrawing application:', error);
            setAuthError('Network error while withdrawing application');
            return false;
        }
    };

// Get user's applications
    const getApplications = useCallback(async () => {
        if (!isLoggedIn || !user) {
            return [];
        }

        try {
            const response = await authFetch('applications');
            const data = await response.json();
            setAppliedJobs(data.applications);
            return data.applications;
        } catch (error) {
            setAuthError(error.message);
            return [];
        }
    }, [isLoggedIn, user, authFetch]);

// Fetch full profile
    const fetchProfile = useCallback(async () => {
        if (!isLoggedIn || !user) return null;
        try {
            const response = await authFetch('user/profile');
            const data = await response.json();
            const sanitizedUser = {
              ...data.user,
              name: typeof data.user.name === 'string' ? data.user.name : '',
              id: typeof data.user.id === 'string' ? data.user.id : data.user._id || '',
              city: typeof data.user.city === 'string' ? data.user.city : '',
              pincode: typeof data.user.pincode === 'string' ? data.user.pincode : '',
              salaryRange: typeof data.user.salaryRange === 'string' ? data.user.salaryRange : '',
              skills: Array.isArray(data.user.skills) ? data.user.skills : [],
              experience: Array.isArray(data.user.experience) ? data.user.experience : []
            };
            setUser(sanitizedUser);
            persistUser(sanitizedUser, token, true); // Update localStorage
            return data.user;
        } catch (error) {
            setAuthError(error.message);
            return null;
        }
    }, [isLoggedIn, user, authFetch, token]);

    // Update profile information (enhanced)
    const updateProfile = async (profileData) => {
        if (!isLoggedIn || !user) {
            setAuthError('Please log in to update profile.');
            return false;
        }

        try {
            const response = await authFetch('user/profile', {
                method: 'PUT',
                body: JSON.stringify(profileData),
            });

            const data = await response.json();
            const sanitizedUser = {
              ...data.user,
              name: typeof data.user.name === 'string' ? data.user.name : '',
              id: typeof data.user.id === 'string' ? data.user.id : data.user._id || '',
              city: typeof data.user.city === 'string' ? data.user.city : '',
              pincode: typeof data.user.pincode === 'string' ? data.user.pincode : '',
              salaryRange: typeof data.user.salaryRange === 'string' ? data.user.salaryRange : '',
              skills: Array.isArray(data.user.skills) ? data.user.skills : [],
              experience: Array.isArray(data.user.experience) ? data.user.experience : []
            };
            setUser(sanitizedUser);
            persistUser(sanitizedUser, token, true);
            return true;
        } catch (error) {
            setAuthError(error.message);
            return false;
        }
    };

// Fetch full profile\n    const fetchProfile = useCallback(async () => {\n        if (!isLoggedIn || !user) return null;\n        try {\n            const response = await authFetch('user/profile');\n            const data = await response.json();\n            setUser(data.user);\n            persistUser(data.user, token, true); // Update localStorage\n            return data.user;\n        } catch (error) {\n            setAuthError(error.message);\n            return null;\n        }\n    }, [isLoggedIn, user, authFetch, token]);\n\n    // Update profile information (enhanced)\n    const updateProfile = async (profileData) => {\n        if (!isLoggedIn || !user) {\n            setAuthError('Please log in to update profile.');\n            return false;\n        }\n\n        try {\n            const response = await authFetch('user/profile', {\n                method: 'PUT',\n                body: JSON.stringify(profileData),\n            });\n\n            const data = await response.json();\n            setUser(data.user);\n            persistUser(data.user, token, true);\n            return true;\n        } catch (error) {\n            setAuthError(error.message);\n            return false;\n        }\n    };

    // Update profile photo (now uses API)
    const updateProfilePhoto = async (photoFile) => {
        if (!isLoggedIn || !user) {
            setAuthError('Please log in to upload photo.');
            return false;
        }

        const formData = new FormData();
        formData.append('photo', photoFile);

        try {
            const base = apiBase || (await getApiBaseUrl());
            if (!apiBase) setApiBase(base);
            const response = await fetch(`${base}/user/upload-photo`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.msg || 'Upload failed');
            }

            setProfilePhoto(data.user.profilePhoto);
            setUser(prev => ({ ...prev, profilePhoto: data.user.profilePhoto }));
            return true;
        } catch (error) {
            setAuthError(error.message);
            return false;
        }
    };

    // Update resume (now uses API)
    const updateResume = async (resumeFile) => {
        if (!isLoggedIn || !user) {
            setAuthError('Please log in to upload resume.');
            return false;
        }

        const formData = new FormData();
        formData.append('resume', resumeFile);

        try {
            const base = apiBase || (await getApiBaseUrl());
            if (!apiBase) setApiBase(base);
            const response = await fetch(`${base}/user/upload-resume`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.msg || 'Upload failed');
            }

            setResume(data.user.resume);
            setUser(prev => ({ ...prev, resume: data.user.resume }));
            return true;
        } catch (error) {
            setAuthError(error.message);
            return false;
        }
    };

    // Get user's notifications
    const getNotifications = useCallback(async () => {
        if (!isLoggedIn || !user) {
            return [];
        }

        try {
            const response = await authFetch('notifications');
            const data = await response.json();
            setNotifications(data.notifications);
            setUnreadNotificationsCount(data.unreadCount);
            return data.notifications;
        } catch (error) {
            setAuthError(error.message);
            return [];
        }
    }, [isLoggedIn, user, authFetch]);

    // Mark notification as read
    const markNotificationRead = async (notificationId) => {
        if (!isLoggedIn || !user) {
            return false;
        }

        try {
            const response = await authFetch(`notifications/${notificationId}/read`, {
                method: 'PUT',
            });

            const data = await response.json();

            if (response.ok) {
                // Update local state
                setNotifications(prev =>
                    prev.map(notif =>
                        notif._id === notificationId ? { ...notif, isRead: true } : notif
                    )
                );
                setUnreadNotificationsCount(prev => Math.max(0, prev - 1));
                return true;
            } else {
                setAuthError(data.msg || 'Failed to mark notification as read.');
                return false;
            }
        } catch (error) {
            setAuthError(error.message);
            return false;
        }
    };

    // Mark all notifications as read
    const markAllNotificationsRead = async () => {
        if (!isLoggedIn || !user) {
            return false;
        }

        try {
            const response = await authFetch('notifications/mark-all-read', {
                method: 'PUT',
            });

            if (response.ok) {
                // Update local state
                setNotifications(prev =>
                    prev.map(notif => ({ ...notif, isRead: true }))
                );
                setUnreadNotificationsCount(0);
                return true;
            } else {
                const data = await response.json();
                setAuthError(data.msg || 'Failed to mark all notifications as read.');
                return false;
            }
        } catch (error) {
            setAuthError(error.message);
            return false;
        }
    };

    // Context Value
    // Create the context value object with all the functions and state
    const value = {
        user,
        token,
        apiBase,
        isLoading,
        isAppLoading,
        authError,
        isLoggedIn: !!user,
        appliedJobs,
        profilePhoto,
        resume,
        notifications,
        unreadNotificationsCount,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        authFetch,
        applyJob,
        undoApply,
        getApplications,
        fetchProfile,
        updateProfile,
        updateProfilePhoto,
        updateResume,
        getNotifications,
        markNotificationRead,
        markAllNotificationsRead,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Export the AuthProvider and useAuth hook
