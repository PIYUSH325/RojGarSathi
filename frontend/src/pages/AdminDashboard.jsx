import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import { Link } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { useTranslation } from 'react-i18next';

const AdminDashboard = () => {
    const { t } = useTranslation();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/v1/admin/dashboard', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(t('admin.errors.fetchStats'));
            }
            const data = await response.json();
            setStats(data.stats);
        } catch (err) {
            setError(t('admin.errors.loadDashboard'));
            console.error('Dashboard error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-dashboard">
            <AdminSidebar />
            <div className="admin-content">
                {loading && (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">{t('admin.common.loading')}</span>
                        </div>
                    </div>
                )}
                {error && (
                    <div className="alert alert-danger" role="alert">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {error}
                    </div>
                )}

                {!loading && !error && (
                    <div className="admin-page">
                        <div className="admin-page-header">
                            <div>
                                <h1 className="admin-page-title">{t('admin.dashboard.title')}</h1>
                                <p className="admin-page-subtitle">{t('admin.dashboard.subtitle')}</p>
                            </div>
                        </div>

                        <div className="admin-panel-card admin-hero-card">
                            <div>
                                <h2 className="admin-section-title">{t('admin.dashboard.commandCenterTitle')}</h2>
                                <p className="admin-page-subtitle mb-0">
                                    {t('admin.dashboard.commandCenterSubtitle')}
                                </p>
                            </div>
                            <div className="admin-stat-grid mb-0">
                                <div className="admin-stat-card">
                                    <h6>{t('admin.common.users')}</h6>
                                    <h3>{stats?.totalUsers || 0}</h3>
                                </div>
                                <div className="admin-stat-card">
                                    <h6>{t('admin.common.jobs')}</h6>
                                    <h3>{stats?.totalJobs || 0}</h3>
                                </div>
                                <div className="admin-stat-card">
                                    <h6>{t('admin.common.applications')}</h6>
                                    <h3>{stats?.totalApplications || 0}</h3>
                                </div>
                            </div>
                        </div>

                        <div className="admin-panel-card mb-3">
                            <h2 className="admin-section-title">{t('admin.dashboard.focusedActions')}</h2>
                            <div className="admin-link-grid">
                                <Link to="/admin/users" className="admin-link-card"><i className="bi bi-people me-2"></i>{t('admin.sidebar.userManagement')}</Link>
                                <Link to="/admin/jobs" className="admin-link-card"><i className="bi bi-briefcase me-2"></i>{t('admin.sidebar.contentManagement')}</Link>
                                <Link to="/admin/reports" className="admin-link-card"><i className="bi bi-graph-up me-2"></i>{t('admin.sidebar.reportsAnalytics')}</Link>
                                <Link to="/admin/settings" className="admin-link-card"><i className="bi bi-gear me-2"></i>{t('admin.sidebar.siteSettings')}</Link>
                                <Link to="/admin/backup" className="admin-link-card"><i className="bi bi-database me-2"></i>{t('admin.sidebar.databaseManagement')}</Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
