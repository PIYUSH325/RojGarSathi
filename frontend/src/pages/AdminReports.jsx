import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import './AdminDashboard.css';
import { useTranslation } from 'react-i18next';

// Use an environment-configurable API base URL. Falls back to localhost:5000 for dev.
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AdminReports = () => {
    const { t } = useTranslation();
    const [reports, setReports] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reportType, setReportType] = useState('users');

    const fetchReports = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/v1/admin/reports?type=${reportType}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.msg || t('admin.reports.fetchFailed'));
            }

            setReports(data.report);
        } catch (err) {
            setError(t('admin.reports.fetchFailed'));
            console.error('Failed to fetch reports:', err);
        } finally {
            setLoading(false);
        }
    }, [reportType]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    return (
        <div className="admin-dashboard">
            <AdminSidebar />
            <div className="admin-content">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="h3 mb-0">
                        <i className="bi bi-graph-up me-2"></i>
                        {t('admin.sidebar.reportsAnalytics')}
                    </h1>
                    <select
                        className="form-select"
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        style={{ width: '200px' }}
                    >
                        <option value="users">{t('admin.reports.userReports')}</option>
                        <option value="jobs">{t('admin.reports.jobReports')}</option>
                        <option value="applications">{t('admin.reports.applicationReports')}</option>
                    </select>
                </div>

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

                {!loading && !error && reports && (
                    <div className="reports-management">
                        <h2>{t('admin.reports.analyticsTitle', { type: reportType.charAt(0).toUpperCase() + reportType.slice(1) })}</h2>

                        {reportType === 'users' && (
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <h3>{t('admin.reports.totalUsers')}</h3>
                                    <p>{reports.totalUsers || 0}</p>
                                </div>
                                {reports.usersByRole && reports.usersByRole.map(role => (
                                    <div key={role._id} className="stat-card">
                                        <h3>{t('admin.reports.roleUsers', { role: role._id })}</h3>
                                        <p>{role.count}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {reportType === 'jobs' && (
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <h3>{t('admin.reports.totalJobs')}</h3>
                                    <p>{reports.totalJobs || 0}</p>
                                </div>
                                {reports.jobsByCategory && reports.jobsByCategory.map(cat => (
                                    <div key={cat._id} className="stat-card">
                                        <h3>{t('admin.reports.categoryJobs', { category: cat._id })}</h3>
                                        <p>{cat.count}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {reportType === 'applications' && (
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <h3>{t('admin.reports.totalApplications')}</h3>
                                    <p>{reports.totalApplications || 0}</p>
                                </div>
                                {reports.applicationsByStatus && reports.applicationsByStatus.map(status => (
                                    <div key={status._id} className="stat-card">
                                        <h3>{t('admin.reports.statusApplications', { status: status._id })}</h3>
                                        <p>{status.count}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminReports;
