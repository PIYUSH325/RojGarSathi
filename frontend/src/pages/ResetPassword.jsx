import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const INDIGO_COLOR = '#4f46e5';

const ResetPassword = () => {
    const { t } = useTranslation();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const { resetPassword, isLoading } = useAuth();
    const { token } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!password || password.length < 6) {
            setError(t('passwordReset.passwordMinLength'));
            return;
        }
        if (password !== confirmPassword) {
            setError(t('passwordReset.passwordsMismatch'));
            return;
        }
        setError('');
        setMessage('');

        try {
            const data = await resetPassword(token, password);
            setMessage(data.msg);
            setTimeout(() => navigate('/login'), 3000); // Redirect to login after 3 seconds
        } catch (err) {
            setError(err.response?.data?.msg || err.message || t('passwordReset.resetFailed'));
        }
    };

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-5">
                    <div className="card shadow-lg border-0 rounded-4">
                        <div className="card-header text-white text-center rounded-top-4 py-3" style={{ backgroundColor: INDIGO_COLOR }}>
                            <h2 className="mb-0 fw-bold">{t('passwordReset.resetTitle')}</h2>
                            <p className="mb-0 small">{t('passwordReset.resetSubtitle')}</p>
                        </div>
                        <div className="card-body p-4">
                            {message && <div className="alert alert-success">{message}</div>}
                            {error && <div className="alert alert-danger">{error}</div>}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label htmlFor="password" className="form-label">{t('passwordReset.newPassword')}</label>
                                    <input
                                        type="password"
                                        className="form-control rounded-pill"
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength="6"
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="confirmPassword" className="form-label">{t('passwordReset.confirmNewPassword')}</label>
                                    <input
                                        type="password"
                                        className="form-control rounded-pill"
                                        id="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="btn w-100 py-2 fw-bold rounded-pill text-white"
                                    disabled={isLoading}
                                    style={{ backgroundColor: INDIGO_COLOR }}
                                >
                                    {isLoading ? t('passwordReset.resetting') : t('passwordReset.resetButton')}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;