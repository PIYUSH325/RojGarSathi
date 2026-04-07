import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import WorkerSidebar from '../components/WorkerSidebar';
import './WorkerDashboard.css';

// --- MOCK DATA DEFINITION ---
const mockWorkerData = {
    userId: 'worker-2d7c-e4f8-1b2a',
    jobsFound: 12,
    applicationsSent: 5,
    timesHired: 3,
    avgRating: 4.5,
    isVerified: true,
    lastActivity: '2h',
    availability: true
};

const StatCard = ({ title, value, subtitle, link = '#' }) => {
    return (
        <Link to={link} className="worker-dashboard-stat-link text-decoration-none">
            <div className="worker-dashboard-stat-card h-100">
                <p className="worker-dashboard-stat-title mb-2">{title}</p>
                <h3 className="worker-dashboard-stat-value mb-1">{value}</h3>
                {subtitle ? <small className="worker-dashboard-stat-subtitle">{subtitle}</small> : null}
            </div>
        </Link>
    );
};

const DashboardViewContent = ({ workerData, profileCompletion, handleAvailabilityToggle, userName, t }) => (
    <div className="worker-dashboard-main-card">
        <div className="worker-dashboard-hero mb-4">
            <div>
                <p className="worker-dashboard-kicker mb-2">{t('workerDashboard.kicker')}</p>
                <h2 className="worker-dashboard-title mb-2">{t('workerDashboard.welcomeBack', { name: userName || t('auth.worker') })}</h2>
                <p className="worker-dashboard-subtitle mb-0">
                    {t('workerDashboard.subtitle')}
                </p>
            </div>

            <div className="worker-dashboard-completion-chip">
                <span>{t('workerDashboard.profileCompletion')}</span>
                <strong>{profileCompletion}%</strong>
            </div>
        </div>

        <div className="worker-dashboard-meta mb-4">
            <div>
                <p className="mb-1 text-muted small">{t('workerDashboard.lastActivity')}</p>
                <p className="mb-0 fw-semibold">{t('workerDashboard.lastActivityValue')}</p>
            </div>
            <div>
                <p className="mb-1 text-muted small">{t('workerDashboard.accountVerification')}</p>
                <p className="mb-0 fw-semibold">
                    {workerData.isVerified ? t('workerDashboard.verified') : t('workerDashboard.pendingVerification')}
                </p>
            </div>
            <div className="worker-dashboard-switch-wrap">
                <label className="worker-dashboard-switch-label" htmlFor="availabilitySwitch">
                    {workerData.availability ? t('workerDashboard.availableForHire') : t('workerDashboard.currentlyInactive')}
                </label>
                <div className="form-check form-switch mb-0">
                    <input
                        className="form-check-input worker-dashboard-switch"
                        type="checkbox"
                        role="switch"
                        id="availabilitySwitch"
                        checked={workerData.availability}
                        onChange={handleAvailabilityToggle}
                    />
                </div>
            </div>
        </div>

        <div className="row g-3 mb-4">
            <div className="col-md-4">
                <StatCard
                    title={t('workerDashboard.jobsFound')}
                    value={workerData.jobsFound}
                    subtitle={t('workerDashboard.newMatchesThisWeek')}
                    link="/jobs"
                />
            </div>
            <div className="col-md-4">
                <StatCard
                    title={t('workerDashboard.applicationsSent')}
                    value={workerData.applicationsSent}
                    subtitle={t('workerDashboard.trackAllSubmissions')}
                    link="/worker/applications"
                />
            </div>
            <div className="col-md-4">
                <StatCard
                    title={t('workerDashboard.timesHired')}
                    value={workerData.timesHired}
                    subtitle={t('workerDashboard.avgRating', { rating: workerData.avgRating })}
                    link="/worker/profile"
                />
            </div>
        </div>

        <div className="worker-dashboard-cta d-flex flex-wrap gap-2">
            <Link to="/worker/profile" className="btn worker-dashboard-btn-primary rounded-pill px-4 py-2">
                {t('workerDashboard.updateProfile')}
            </Link>
            <Link to="/jobs" className="btn worker-dashboard-btn-outline rounded-pill px-4 py-2">
                {t('workerDashboard.browseJobs')}
            </Link>
        </div>
    </div>
);


const WorkerDashboard = () => {
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const [workerData, setWorkerData] = useState(mockWorkerData);

    const profileCompletion = 75;

    const handleAvailabilityToggle = () => {
        setWorkerData(prev => ({ ...prev, availability: !prev.availability }));
    };

    return (
        <div className="worker-dashboard-page container-fluid py-4">
            <div className="row g-4">
                <div className="col-lg-3 d-none d-lg-block">
                    <WorkerSidebar userId={user?.id} logout={logout} />
                </div>

                <div className="col-lg-9">
                    <DashboardViewContent
                        workerData={workerData}
                        profileCompletion={profileCompletion}
                        handleAvailabilityToggle={handleAvailabilityToggle}
                        userName={user?.name}
                        t={t}
                    />
                </div>
            </div>
        </div>
    );
};

export default WorkerDashboard;
