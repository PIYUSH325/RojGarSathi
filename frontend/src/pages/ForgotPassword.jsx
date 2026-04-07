import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const INDIGO_COLOR = '#4f46e5';

const ForgotPassword = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [emailError, setEmailError] = useState('');
    const { forgotPassword, isLoading } = useAuth();

    const validateEmail = (value) => {
        if (!value) return t('passwordReset.emailRequired');
        if (!/\S+@\S+\.\S+/.test(value)) return t('passwordReset.emailInvalid');
        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        const validationError = validateEmail(email.trim());
        setEmailError(validationError);
        if (validationError) return;

        try {
            const data = await forgotPassword(email.trim().toLowerCase());
            setMessage(data.msg);
        } catch (err) {
            setError(err.response?.data?.msg || err.message || t('passwordReset.sendFailed'));
        }
    };

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-5">
                    <div className="card shadow-lg border-0 rounded-4">
                        <div className="card-header text-white text-center rounded-top-4 py-3" style={{ backgroundColor: INDIGO_COLOR }}>
                            <h2 className="mb-0 fw-bold">{t('passwordReset.forgotTitle')}</h2>
                            <p className="mb-0 small">{t('passwordReset.forgotSubtitle')}</p>
                        </div>
                        <div className="card-body p-4">
                            {message && <div className="alert alert-success">{message}</div>}
                            {error && <div className="alert alert-danger">{error}</div>}
                            
                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label htmlFor="email" className="form-label">{t('auth.email')}</label>
                                    <input
                                        type="email"
                                        className="form-control rounded-pill"
                                        id="email"
                                        placeholder={t('passwordReset.emailPlaceholder')}
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (emailError) setEmailError('');
                                        }}
                                        required
                                        disabled={isLoading}
                                    />
                                    {emailError && <div className="text-danger small mt-2">{emailError}</div>}
                                </div>
                                <button
                                    type="submit"
                                    className="btn w-100 py-2 fw-bold rounded-pill text-white"
                                    disabled={isLoading}
                                    style={{ backgroundColor: INDIGO_COLOR }}
                                >
                                    {isLoading ? t('passwordReset.sending') : t('passwordReset.sendLink')}
                                </button>
                            </form>
                        </div>
                        <div className="card-footer text-center bg-light rounded-bottom-4 p-3">
                            <p className="mb-0 small">
                                {t('passwordReset.rememberPassword')} <Link to="/login" className="fw-bold" style={{ color: INDIGO_COLOR }}>{t('passwordReset.loginHere')}</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;