import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext'; // Import the real useAuth

// Define the core application colors for visual consistency
const INDIGO_COLOR = '#4f46e5'; // Primary/Employer
const GREEN_COLOR = '#198754'; // Success/Worker


const Register = () => {
    const { t } = useTranslation();
    const [role, setRole] = useState('worker'); // 'worker' or 'employer'
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const { register, isLoading, authError } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            // Client-side validation is fine, but the context will handle API errors.
            // For simplicity, we can rely on the context's error state.
            // Let's assume the context can set this error, or we can have a local error state.
            // For now, let's just return. The backend will also catch this.
            alert(`${t('auth.password')} mismatch.`); // Simple feedback
            return;
        }

        try {
            const data = await register(
                formData.name,
                formData.email,
                formData.phone,
                formData.password,
                role
            );
            if (data) { // If registration is successful, data will be returned.
                navigate('/login');
            }
        } catch (err) {
            console.error("Registration failed:", err);
        }
    };

    // Simple role selection component using Bootstrap pills with dynamic colors
    const RoleSelector = () => (
        <ul className="nav nav-pills nav-fill mb-4 p-1 bg-light rounded-pill border">
            <li className="nav-item">
                <button
                    className={`nav-link rounded-pill fw-bold ${role === 'worker' ? 'active shadow text-white' : 'text-dark'}`}
                    style={role === 'worker' ? { backgroundColor: GREEN_COLOR } : {}}
                    onClick={() => setRole('worker')}
                    type="button"
                    disabled={isLoading}
                >
                    <i className="bi bi-person-fill me-2"></i> {t('auth.registerWorker')}
                </button>
            </li>
            <li className="nav-item">
                <button
                    className={`nav-link rounded-pill fw-bold ${role === 'employer' ? 'active shadow text-white' : 'text-dark'}`}
                    style={role === 'employer' ? { backgroundColor: INDIGO_COLOR } : {}}
                    onClick={() => setRole('employer')}
                    type="button"
                    disabled={isLoading}
                >
                    <i className="bi bi-building-fill me-2"></i> {t('auth.registerEmployer')}
                </button>
            </li>
        </ul>
    );

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-md-8 col-lg-7">
                    <div className="card shadow-lg border-0 rounded-4">
                        <div className="card-header bg-white text-center rounded-top-4 py-3">
                            <h2 className="mb-0 fw-bold text-dark">{t('auth.registerTitle')}</h2>
                            <p className="mb-0 small text-muted">{t('auth.registerSubtitle')}</p>
                        </div>
                        <div className="card-body p-4">
                            <RoleSelector />

                            {authError && (
                                <div className="alert alert-danger" role="alert">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i> {authError}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                {/* Name and Phone */}
                                <div className="row mb-3">
                                    <div className="col-md-6 mb-3 mb-md-0">
                                        <label htmlFor="name" className="form-label">{t('auth.fullName')}</label>
                                        <input type="text" className="form-control rounded-pill" id="name" name="name" onChange={handleChange} required disabled={isLoading} />
                                    </div>
                                    <div className="col-md-6">
                                        <label htmlFor="phone" className="form-label">{t('auth.phone')}</label>
                                        <input type="tel" className="form-control rounded-pill" id="phone" name="phone" onChange={handleChange} required disabled={isLoading} />
                                    </div>
                                </div>
                                
                                {/* Email */}
                                <div className="mb-3">
                                    <label htmlFor="email" className="form-label">{t('auth.email')}</label>
                                    <input type="email" className="form-control rounded-pill" id="email" name="email" onChange={handleChange} required disabled={isLoading} />
                                    <div className="form-text">
                                        {t('auth.emailHint')}
                                    </div>
                                </div>

                                {/* Passwords */}
                                <div className="row mb-4">
                                    <div className="col-md-6 mb-3 mb-md-0">
                                        <label htmlFor="password" className="form-label">{t('auth.password')}</label>
                                        <input type="password" className="form-control rounded-pill" id="password" name="password" onChange={handleChange} minLength="6" required disabled={isLoading} />
                                    </div>
                                    <div className="col-md-6">
                                        <label htmlFor="confirmPassword" className="form-label">{t('auth.confirmPassword')}</label>
                                        <input type="password" className="form-control rounded-pill" id="confirmPassword" name="confirmPassword" onChange={handleChange} minLength="6" required disabled={isLoading} />
                                    </div>
                                </div>
                                
                                <button 
                                    type="submit" 
                                    className={`btn w-100 py-2 fw-bold rounded-pill`}
                                    style={{ 
                                        backgroundColor: role === 'worker' ? GREEN_COLOR : INDIGO_COLOR, 
                                        color: 'white' 
                                    }}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            {t('auth.registering')}
                                        </>
                                    ) : (
                                        `${t('auth.createAccountAs')} ${role === 'worker' ? t('auth.worker') : t('auth.employer')}`
                                    )}
                                </button>
                            </form>
                        </div>
                        <div className="card-footer text-center bg-light rounded-bottom-4 p-3">
                            {t('auth.alreadyHaveAccount')} <Link to="/login" className="text-primary fw-bold">{t('auth.login')}</Link>
                        </div>
                    </div>
                </div>
            </div>
            {/* Custom CSS for input styling */}
            <style>{`
                .form-control.rounded-pill { border-radius: 50rem !important; }
                .text-primary { color: ${INDIGO_COLOR} !important; }
                .nav-link.active.shadow { box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important; }
            `}</style>
        </div>
    );
};

export default Register;
