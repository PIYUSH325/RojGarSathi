import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployerSidebar from '../components/EmployerSidebar';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css';
import { useTranslation } from 'react-i18next';

const EmployerAnalytics = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, isLoggedIn, authFetch } = useAuth();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAnalytics = useCallback(async () => {
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await authFetch('analytics/employer');
            const data = await response.json();
            setAnalytics(data.analytics);
        } catch (err) {
            setError(t('employerAnalytics.fetchFailed'));
            console.error('Failed to fetch analytics:', err);
        } finally {
            setLoading(false);
        }
    }, [isLoggedIn, navigate, authFetch, t]);

    useEffect(() => {
        if (!isLoggedIn || !user || user.role !== 'employer') {
            navigate('/login');
            return;
        }
        fetchAnalytics();
    }, [isLoggedIn, user, navigate, fetchAnalytics]);

    const StatCard = ({ title, value, icon, color, subtitle }) => (
        <div className="col-lg-3 col-md-6 mb-4">
            <div className={`card ${color} text-white shadow-lg border-0 rounded-4 h-100`}>
                <div className="card-body d-flex align-items-center justify-content-between p-4">
                    <div>
                        <h3 className="card-title display-6 fw-bold mb-1">{value}</h3>
                        <p className="card-text text-uppercase fw-light small opacity-75 mb-1">{title}</p>
                        {subtitle && <small className="opacity-75">{subtitle}</small>}
                    </div>
                    <i className={`${icon} display-4 opacity-50`}></i>
                </div>
            </div>
        </div>
    );

    const ChartPlaceholder = ({ title, description }) => (
        <div className="card shadow-lg border-0 rounded-4 mb-4">
            <div className="card-body p-4">
                <h5 className="card-title fw-bold mb-3">{title}</h5>
                <div className="text-center py-5">
                    <i className="bi bi-bar-chart-line display-1 text-muted mb-3"></i>
                    <p className="text-muted">{description}</p>
                    <small className="text-muted">{t('employerAnalytics.chartComingSoon')}</small>
                </div>
            </div>
        </div>
    );

    return (
        <div className="admin-dashboard">
            <EmployerSidebar userId={user?._id} />
            <div className="admin-content">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="h3 mb-0">
                        <i className="bi bi-graph-up me-2"></i>
                        {t('employerAnalytics.title')}
                    </h1>
                    <button
                        className="btn btn-outline-primary"
                        onClick={fetchAnalytics}
                        disabled={loading}
                    >
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        {t('employerAnalytics.refresh')}
                    </button>
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

                {!loading && !error && analytics && (
                    <>
                        {/* Stats Cards */}
                        <div className="row mb-5">
                            <StatCard
                                title={t('employerAnalytics.totalJobs')}
                                value={analytics.totalJobs || 0}
                                icon="bi bi-briefcase-fill"
                                color="bg-primary"
                                subtitle={t('employerAnalytics.allTime')}
                            />
                            <StatCard
                                title={t('employerAnalytics.activeJobs')}
                                value={analytics.activeJobs || 0}
                                icon="bi bi-megaphone-fill"
                                color="bg-success"
                                subtitle={t('employerAnalytics.currentlyOpen')}
                            />
                            <StatCard
                                title={t('employerAnalytics.totalApplications')}
                                value={analytics.totalApplications || 0}
                                icon="bi bi-people-fill"
                                color="bg-info"
                                subtitle={t('employerAnalytics.allApplications')}
                            />
                            <StatCard
                                title={t('employerAnalytics.newApplications')}
                                value={analytics.newApplications || 0}
                                icon="bi bi-file-earmark-check-fill"
                                color="bg-warning text-dark"
                                subtitle={t('employerAnalytics.thisMonth')}
                            />
                        </div>

                        {/* Charts Section */}
                        <div className="row">
                            <div className="col-lg-6">
                                <ChartPlaceholder
                                    title={t('employerAnalytics.applicationsOverTime')}
                                    description={t('employerAnalytics.applicationsOverTimeDesc')}
                                />
                            </div>
                            <div className="col-lg-6">
                                <ChartPlaceholder
                                    title={t('employerAnalytics.jobPerformance')}
                                    description={t('employerAnalytics.jobPerformanceDesc')}
                                />
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-lg-6">
                                <ChartPlaceholder
                                    title={t('employerAnalytics.statusDistribution')}
                                    description={t('employerAnalytics.statusDistributionDesc')}
                                />
                            </div>
                            <div className="col-lg-6">
                                <ChartPlaceholder
                                    title={t('employerAnalytics.topCategories')}
                                    description={t('employerAnalytics.topCategoriesDesc')}
                                />
                            </div>
                        </div>

                        {/* Recent Activity Summary */}
                        <div className="card shadow-lg border-0 rounded-4">
                            <div className="card-body p-4">
                                <h5 className="card-title fw-bold mb-3">{t('employerAnalytics.recentSummary')}</h5>
                                <div className="row text-center">
                                    <div className="col-md-3">
                                        <div className="p-3">
                                            <h4 className="text-primary fw-bold">{analytics.jobsThisMonth || 0}</h4>
                                            <small className="text-muted">{t('employerAnalytics.jobsPostedThisMonth')}</small>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="p-3">
                                            <h4 className="text-success fw-bold">{analytics.applicationsThisMonth || 0}</h4>
                                            <small className="text-muted">{t('employerAnalytics.applicationsThisMonth')}</small>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="p-3">
                                            <h4 className="text-info fw-bold">{analytics.acceptedApplications || 0}</h4>
                                            <small className="text-muted">{t('employerAnalytics.applicationsAccepted')}</small>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="p-3">
                                            <h4 className="text-warning fw-bold">{analytics.responseRate || 0}%</h4>
                                            <small className="text-muted">{t('employerAnalytics.responseRate')}</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {!loading && !error && !analytics && (
                    <div className="text-center py-5">
                        <p className="text-muted">{t('employerAnalytics.noData')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployerAnalytics;
