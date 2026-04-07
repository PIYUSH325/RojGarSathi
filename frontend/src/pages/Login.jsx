import React, { useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext'; // Import the real useAuth

// Define the core color used across the components
const INDIGO_COLOR = '#4f46e5'; 


const Login = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('worker'); // default role
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    // Removed 'user' from destructuring to fix the 'no-unused-vars' warning
    const { login, authError, isLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Determine where to redirect after login
    const from = location.state?.from?.pathname || null;

    const validateField = (name, value) => {
        let error = '';
        if (name === 'email') {
            if (!value) {
                error = `${t('auth.email')} is required.`;
            } else if (!/\S+@\S+\.\S+/.test(value)) {
                error = `${t('auth.email')} is invalid.`;
            }
        }
        if (name === 'password') {
            if (!value) {
                error = `${t('auth.password')} is required.`;
            } else if (value.length < 6) {
                error = `${t('auth.password')} must be at least 6 characters.`;
            }
        }
        setFormErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formErrors.email || formErrors.password) return;

        try {
            const data = await login(email, password, role, rememberMe);
            if (data && data.user) {
                if (role === 'worker') {
                    navigate('/', { replace: true });
                } else if (role === 'employer') {
                    navigate('/employer/dashboard', { replace: true });
                } else if (role === 'admin') {
                    navigate('/admin', { replace: true });
                } else {
                    navigate('/', { replace: true }); // Fallback
                }
            }
        } catch (error) {
            // Error handling is managed by the mock context
            console.error("Login process caught error:", error);
        }
    };

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-5">
                    <div className="card shadow-lg border-0 rounded-4">
                        <div className="card-header text-white text-center rounded-top-4 py-3" 
                             style={{ backgroundColor: INDIGO_COLOR }}>
                            <h2 className="mb-0 fw-bold">{t('auth.loginTitle')}</h2>
                            <p className="mb-0 small">{t('auth.loginSubtitle')}</p>
                        </div>
                        <div className="card-body p-4">
                            {authError && (
                                <div className="alert alert-danger" role="alert">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i> {authError}
                                </div>
                            )}
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label htmlFor="email" className="form-label">{t('auth.email')}</label>
                                    <input 
                                        type="email" 
                                        className="form-control rounded-pill" 
                                        id="email" 
                                        placeholder={t('auth.email')}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onBlur={(e) => validateField('email', e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                    {formErrors.email && <div className="text-danger small mt-1">{formErrors.email}</div>}
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="role" className="form-label">{t('auth.role')}</label>
                                    <select 
                                        id="role" 
                                        className="form-select rounded-pill"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    >
                                        <option value="worker">{t('auth.worker')}</option>
                                        <option value="employer">{t('auth.employer')}</option>
                                        <option value="admin">{t('auth.admin')}</option>
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="password" className="form-label">{t('auth.password')}</label>
                                    <div className="input-group">
                                        <input 
                                            type={showPassword ? "text" : "password"} 
                                            className="form-control" 
                                            id="password" 
                                            placeholder={t('auth.password')}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            onBlur={(e) => validateField('password', e.target.value)}
                                            required
                                            disabled={isLoading}
                                            style={{ borderTopLeftRadius: '50rem', borderBottomLeftRadius: '50rem' }}
                                        />
                                        <button className="btn btn-outline-secondary" type="button" onClick={() => setShowPassword(!showPassword)} style={{ borderTopRightRadius: '50rem', borderBottomRightRadius: '50rem' }}>
                                            <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                        </button>
                                    </div>
                                    {formErrors.password && <div className="text-danger small mt-1">{formErrors.password}</div>}
                                </div>
                                <div className="form-check mb-4">
                                    <input className="form-check-input" type="checkbox" id="rememberMe" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                                    <label className="form-check-label" htmlFor="rememberMe">
                                        Remember Me
                                    </label>
                                </div>
                                
                                <button 
                                    type="submit" 
                                    className="btn w-100 py-2 fw-bold rounded-pill"
                                    disabled={isLoading}
                                    style={{ backgroundColor: INDIGO_COLOR, color: 'white' }}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            {t('auth.loggingIn')}
                                        </>
                                    ) : (
                                        t('auth.login')
                                    )}
                                </button>
                            </form>
                        </div>
                        <div className="card-footer text-center bg-light rounded-bottom-4 p-3">
                            <p className="mb-1 small">
                                {t('auth.dontHaveAccount')} <Link to="/register" className="text-primary fw-bold">{t('auth.registerHere')}</Link>
                            </p>
                            <p className="mb-0 small">
                                <Link to="/forgot-password" className="text-muted">{t('auth.forgotPassword')}</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            {/* Custom CSS for Link styling and hover effect */}
            <style>{`
                .text-primary { color: ${INDIGO_COLOR} !important; }
                .btn:hover {
                    background-color: #6366f1 !important; 
                }
                .form-control.rounded-pill, .form-select.rounded-pill {
                    border-radius: 50rem !important;
                }
            `}</style>
        </div>
    );
};

export default Login;
