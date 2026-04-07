import React from 'react';
import { Link } from 'react-router-dom';
import './AdminDashboard.css';
import AdminSidebar from '../components/AdminSidebar';
import { useTranslation } from 'react-i18next';

const AdminWelcome = () => {
    const { t } = useTranslation();
    return (
        <div className="admin-dashboard">
            <AdminSidebar />
            <div className="admin-content">
                <div className="admin-page">
                    <div className="admin-page-header">
                        <div>
                            <h1 className="admin-page-title">{t('admin.welcome.title')}</h1>
                            <p className="admin-page-subtitle">{t('admin.welcome.subtitle')}</p>
                        </div>
                    </div>

                    <div className="admin-panel-card admin-hero-card">
                        <div>
                            <h2 className="admin-section-title">{t('admin.welcome.controlCenter')}</h2>
                            <p className="admin-page-subtitle mb-0">
                                {t('admin.welcome.controlCenterSubtitle')}
                            </p>
                        </div>
                        <div className="admin-stat-grid mb-0">
                            <div className="admin-stat-card">
                                <h6>{t('admin.welcome.security')}</h6>
                                <h3>{t('admin.common.active')}</h3>
                            </div>
                            <div className="admin-stat-card">
                                <h6>{t('admin.welcome.monitoring')}</h6>
                                <h3>{t('admin.common.live')}</h3>
                            </div>
                            <div className="admin-stat-card">
                                <h6>{t('admin.welcome.backups')}</h6>
                                <h3>{t('admin.common.ready')}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="admin-panel-card">
                        <h2 className="admin-section-title">{t('admin.welcome.quickActions')}</h2>
                        <div className="admin-link-grid">
                            <Link to="/admin/users" className="admin-link-card">
                                <i className="bi bi-people me-2"></i>{t('admin.welcome.manageUsers')}
                            </Link>
                            <Link to="/admin/jobs" className="admin-link-card">
                                <i className="bi bi-briefcase me-2"></i>{t('admin.welcome.manageJobs')}
                            </Link>
                            <Link to="/admin/reports" className="admin-link-card">
                                <i className="bi bi-bar-chart me-2"></i>{t('admin.welcome.viewReports')}
                            </Link>
                            <Link to="/admin/backup" className="admin-link-card">
                                <i className="bi bi-database me-2"></i>{t('admin.welcome.backupData')}
                            </Link>
                            <Link to="/admin/settings" className="admin-link-card">
                                <i className="bi bi-gear me-2"></i>{t('admin.sidebar.siteSettings')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminWelcome;
