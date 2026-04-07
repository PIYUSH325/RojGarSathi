 import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css';
import { useTranslation } from 'react-i18next';

const AdminBackup = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, token, isLoggedIn } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!isLoggedIn || !user || user.role !== 'admin') {
            navigate('/login');
            return;
        }
    }, [isLoggedIn, user, navigate]);

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    const handleCreateBackup = async () => {
        if (!token) {
            setMessage(t('admin.backup.mustLogin'));
            return;
        }
        
        setLoading(true);
        setMessage('');
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/admin/backup`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Create a blob from the response and trigger download
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                setMessage(t('admin.backup.downloadSuccess'));
            } else {
                const errorData = await response.json();
                setMessage(errorData.msg || t('admin.backup.createFailed'));
            }
        } catch (err) {
            console.error('Backup failed:', err);
            setMessage(t('admin.backup.networkError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-dashboard">
            <AdminSidebar />
            <div className="admin-content">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="h3 mb-0">
                        <i className="bi bi-database me-2"></i>
                        {t('admin.sidebar.databaseManagement')}
                    </h1>
                </div>

                <div className="backup-management">
                    <h2>{t('admin.backup.title')}</h2>

                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">{t('admin.backup.createTitle')}</h5>
                            <p className="card-text">
                                {t('admin.backup.description')}
                            </p>
                            <button
                                className="btn btn-primary"
                                onClick={handleCreateBackup}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        {t('admin.backup.creating')}
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-download me-1"></i>
                                        {t('admin.backup.createButton')}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {message && (
                        <div className={`alert mt-3 ${message === t('admin.backup.downloadSuccess') ? 'alert-success' : 'alert-danger'}`} role="alert">
                            {message}
                        </div>
                    )}

                    <div className="card mt-4">
                        <div className="card-body">
                            <h5 className="card-title">{t('admin.backup.infoTitle')}</h5>
                            <ul className="list-unstyled">
                                <li><strong>{t('admin.backup.formatLabel')}</strong> {t('admin.backup.formatValue')}</li>
                                <li><strong>{t('admin.backup.includesLabel')}</strong> {t('admin.backup.includesValue')}</li>
                                <li><strong>{t('admin.backup.timestampLabel')}</strong> {t('admin.backup.timestampValue')}</li>
                                <li><strong>{t('admin.backup.downloadLabel')}</strong> {t('admin.backup.downloadValue')}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminBackup;
