import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import EmployerSidebar from '../components/EmployerSidebar';

// --- 2. Stat Card Component ---
const StatCard = ({ title, count, iconClass, colorClass }) => (
    <div className="col-lg-4 col-md-6">
        <div className={`card ${colorClass} text-white shadow-lg border-0 rounded-4 h-100 transform-scale-on-hover`}>
            <div className="card-body d-flex align-items-center justify-content-between p-4">
                <div>
                    <h2 className="card-title display-4 fw-bold mb-0">{count}</h2>
                    <p className="card-text text-uppercase fw-light small opacity-75">{title}</p>
                </div>
                <i className={`${iconClass} display-4 opacity-50`}></i>
            </div>
        </div>
    </div>
);

// --- 3. Job Post Form Component (Extracted and enhanced) ---
const JobPostForm = ({ updateRecentJobs, updateStats, authFetch, navigate, t }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        city: '',
        pincode: '',
        salary: '',
        isFeatured: false,
    });
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormSuccess('');
        setIsSubmitting(true);

        // Basic validation
        if (!formData.title || !formData.description || !formData.category || !formData.city || !formData.pincode) {
            setFormError(t('employerPostJob.requiredFields'));
            setIsSubmitting(false);
            return;
        }

        // Validate salary if provided
        const salaryNumber = formData.salary ? Number(formData.salary) : null;
        if (formData.salary && isNaN(salaryNumber)) {
            setFormError(t('employerPostJob.salaryInvalid'));
            setIsSubmitting(false);
            return;
        }

        try {
            // Use the authFetch wrapper (MOCK: this call simulates success)
            const response = await authFetch('jobs', {
                method: 'POST',
                body: JSON.stringify({ ...formData, salary: salaryNumber }),
            });

            const data = await response.json();

            if (response.ok) {
                setFormSuccess(t('employerDashboard.postedSuccessRedirect'));
                
                // Update parent component state
                updateRecentJobs((prev) => [{ id: data.job._id, title: data.job.title, status: 'open', applications: 0, date: t('employerDashboard.justNow') }, ...prev]);
                updateStats((prev) => ({ ...prev, jobsPosted: prev.jobsPosted + 1, activeJobs: prev.activeJobs + 1 }));
                
                // Reset form after a short delay and navigate
                setTimeout(() => {
                    setFormData({ title: '', description: '', category: '', city: '', pincode: '', salary: '', isFeatured: false });
                    setFormSuccess('');
                    navigate('/employer/jobs');
                }, 1500);

            } else {
                setFormError(data.msg || t('employerPostJob.postFailedServer'));
            }
        } catch (error) {
            // Error handling from authFetch (e.g., Network, 401 Unauthorized)
            setFormError(error.message || t('employerPostJob.postFailedUnexpected'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const indigoColor = '#4f46e5';

    return (
        <div className="card p-5 shadow-lg border-0 rounded-4">
            <h3 className="mb-4 fw-bold d-flex align-items-center" style={{ color: indigoColor }}>
                <i className="bi bi-bullhorn me-2"></i> {t('employerPostJob.title')}
            </h3>
            <p className="text-muted mb-4">{t('employerPostJob.subtitle')}</p>
            
            {formError && <div className="alert alert-danger" role="alert"><i className="bi bi-x-octagon-fill me-2"></i> {formError}</div>}
            {formSuccess && <div className="alert alert-success" role="alert"><i className="bi bi-check-circle-fill me-2"></i> {formSuccess}</div>}
            
            <form onSubmit={handleSubmit}>
                <div className="row g-3">
                    <div className="col-md-8">
                        <label htmlFor="title" className="form-label fw-semibold">{t('employerPostJob.jobTitle')} *</label>
                        <input type="text" className="form-control" id="title" name="title" value={formData.title} onChange={handleChange} placeholder={t('employerPostJob.jobTitlePlaceholder')} required disabled={isSubmitting} />
                    </div>
                    <div className="col-md-4">
                        <label htmlFor="category" className="form-label fw-semibold">{t('jobs.category')} *</label>
                        <input type="text" className="form-control" id="category" name="category" value={formData.category} onChange={handleChange} placeholder={t('employerPostJob.categoryPlaceholder')} required disabled={isSubmitting} />
                    </div>
                </div>

                <div className="mb-3 mt-3">
                    <label htmlFor="description" className="form-label fw-semibold">{t('employerPostJob.jobDescription')} *</label>
                    <textarea className="form-control" id="description" name="description" rows="5" value={formData.description} onChange={handleChange} placeholder={t('employerPostJob.descriptionPlaceholder')} required disabled={isSubmitting}></textarea>
                </div>
                
                <div className="row g-3 mb-4">
                    <div className="col-md-4">
                        <label htmlFor="city" className="form-label fw-semibold">{t('employerPostJob.city')} *</label>
                        <input type="text" className="form-control" id="city" name="city" value={formData.city} onChange={handleChange} required placeholder={t('employerPostJob.cityPlaceholder')} disabled={isSubmitting} />
                    </div>
                    <div className="col-md-4">
                        <label htmlFor="pincode" className="form-label fw-semibold">{t('employerPostJob.pincode')} *</label>
                        <input type="text" className="form-control" id="pincode" name="pincode" value={formData.pincode} onChange={handleChange} required placeholder={t('employerPostJob.pincodePlaceholder')} disabled={isSubmitting} />
                    </div>
                    <div className="col-md-4">
                        <label htmlFor="salary" className="form-label fw-semibold">{t('employerPostJob.monthlySalary')}</label>
                        <input type="number" className="form-control" id="salary" name="salary" value={formData.salary} onChange={handleChange} placeholder={t('employerPostJob.salaryPlaceholder')} disabled={isSubmitting} />
                    </div>
                </div>

                <div className="form-check mb-4">
                    <input className="form-check-input" type="checkbox" id="isFeatured" name="isFeatured" checked={formData.isFeatured} onChange={handleChange} disabled={isSubmitting} />
                    <label className="form-check-label fw-semibold" htmlFor="isFeatured">
                        {t('employerPostJob.featureLabel')}
                    </label>
                </div>

                <button type="submit" className="btn btn-lg text-white rounded-pill px-5 fw-bold shadow-sm" 
                        style={{ backgroundColor: indigoColor, borderColor: indigoColor }} disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            {t('employerPostJob.posting')}
                        </>
                    ) : (
                        <><i className="bi bi-arrow-up-circle-fill me-2"></i> {t('employerPostJob.publishNow')}</>
                    )}
                </button>
            </form>
        </div>
    );
};


// --- 4. Main Employer Dashboard Component ---
const EmployerDashboard = () => {
    const { t } = useTranslation();
    const { user, isLoggedIn, authFetch } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        jobsPosted: 0,
        activeJobs: 0,
        applicationsReceived: 0,
        newApplications: 0,
    });

    const [recentJobs, setRecentJobs] = useState([]);
    const [loadingRecentJobs, setLoadingRecentJobs] = useState(true);
    const [errorRecentJobs, setErrorRecentJobs] = useState('');
    const [loadingStats, setLoadingStats] = useState(true);
    const [errorStats, setErrorStats] = useState('');

    // Function to fetch stats from backend - memoized to prevent re-creation
    const fetchStats = useCallback(async () => {
        try {
            setLoadingStats(true);
            setErrorStats('');
            const response = await authFetch('analytics/employer');
            const data = await response.json();
            if (response.ok) {
                const analytics = data.analytics;
                setStats({
                    jobsPosted: analytics.totalJobs,
                    activeJobs: analytics.activeJobs,
                    applicationsReceived: analytics.totalApplications,
                    newApplications: analytics.newApplications,
                });
            } else {
                setErrorStats(data.msg || t('employerDashboard.fetchStatsFailed'));
            }
        } catch (err) {
            setErrorStats(t('employerDashboard.fetchStatsFailed'));
            console.error('Failed to fetch stats:', err);
        } finally {
            setLoadingStats(false);
        }
    }, [authFetch, t]);

    // Function to fetch recent jobs - memoized to prevent re-creation
    const fetchRecentJobs = useCallback(async () => {
        try {
            setLoadingRecentJobs(true);
            setErrorRecentJobs('');
            const response = await authFetch('jobs/employer?page=1&limit=5');
            const data = await response.json();
            if (response.ok) {
                setRecentJobs(data.jobs || []);
            } else {
                setErrorRecentJobs(data.msg || t('employerDashboard.fetchRecentJobsFailed'));
            }
        } catch (err) {
            setErrorRecentJobs(t('employerDashboard.fetchRecentJobsFailed'));
            console.error('Failed to fetch recent jobs:', err);
        } finally {
            setLoadingRecentJobs(false);
        }
    }, [authFetch, t]);

    // Fetch stats and recent jobs on mount
    useEffect(() => {
        if (user) {
            fetchStats();
            fetchRecentJobs();
        }
    }, [user, fetchStats, fetchRecentJobs]); // fetchStats and fetchRecentJobs are now memoized, so safe to include

    // Set up polling for real-time updates every 30 seconds
    useEffect(() => {
        if (!user) return;

        const interval = setInterval(() => {
            fetchStats();
            fetchRecentJobs();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [user, fetchStats, fetchRecentJobs]); // fetchStats and fetchRecentJobs are now memoized, so safe to include
    
    const indigoColor = '#4f46e5';

    return (
        <div className="container-fluid d-flex p-0">
            <EmployerSidebar userId={user?._id || t('admin.common.loading')} />

            {/* Main Content Area */}
            <div className="flex-grow-1 p-5 bg-light">
                <h1 className="mb-2 fw-bolder text-dark">
                    {t('employerDashboard.hello')}, <span style={{ color: indigoColor }}>{user?.name || t('auth.employer')}</span>!
                </h1>
                <p className="lead text-muted mb-5">{t('employerDashboard.subtitle')}</p>

                {/* --- Stats Cards --- */}
                <div className="row g-4 mb-5">
                    <StatCard 
                        title={t('employerDashboard.jobsPosted')} 
                        count={stats.jobsPosted} 
                        iconClass="bi bi-briefcase-fill" 
                        colorClass="bg-primary" 
                    />
                    <StatCard 
                        title={t('employerDashboard.activeListings')} 
                        count={stats.activeJobs} 
                        iconClass="bi bi-megaphone-fill" 
                        colorClass="bg-success" 
                    />
                    <StatCard 
                        title={t('employerDashboard.newApplications')} 
                        count={stats.newApplications} 
                        iconClass="bi bi-file-earmark-check-fill" 
                        colorClass="bg-warning text-dark" 
                    />
                </div>

                <div className="row g-5">
                    {/* Column 1: Job Posting Form */}
                    <div className="col-lg-7">
                        <JobPostForm
                            updateRecentJobs={setRecentJobs}
                            updateStats={setStats}
                            authFetch={authFetch}
                            navigate={navigate}
                            t={t}
                        />
                    </div>
                    
                    {/* Column 2: Recent Activity */}
                    <div className="col-lg-5">
                        <div className="card p-4 shadow-lg border-0 rounded-4 h-100">
                            <h3 className="mb-4 fw-bold">{t('employerDashboard.recentActivity')}</h3>
                            <ul className="list-group list-group-flush">
                                {loadingRecentJobs ? (
                                    <li className="list-group-item text-center py-3">
                                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                                            <span className="visually-hidden">{t('admin.common.loading')}</span>
                                        </div>
                                    </li>
                                ) : errorRecentJobs ? (
                                    <li className="list-group-item text-center py-3 text-danger">
                                        <i className="bi bi-exclamation-triangle me-2"></i>
                                        {errorRecentJobs}
                                    </li>
                                ) : recentJobs.length === 0 ? (
                                    <li className="list-group-item text-center py-3 text-muted">
                                        {t('employerDashboard.noJobsPosted')}
                                    </li>
                                ) : (
                                    recentJobs.map((job) => (
                                        <li key={job._id} className="list-group-item d-flex justify-content-between align-items-center py-3">
                                            <div className="flex-grow-1">
                                                <div className="fw-semibold text-truncate">{job.title}</div>
                                                <small className="text-muted">{t('employerDashboard.postedOn', { date: new Date(job.createdAt).toLocaleDateString() })}</small>
                                            </div>
                                            <div className="text-end">
                                                {job.status === 'open' ? (
                                                    <span className="badge bg-success rounded-pill me-2">
                                                        {t('employerDashboard.appsCount', { count: job.applicationCount || 0 })}
                                                    </span>
                                                ) : (
                                                    <span className="badge bg-secondary rounded-pill me-2">
                                                        {t('jobs.closed')}
                                                    </span>
                                                )}
                                                <Link to={`/employer/jobs/${job._id}`} className="text-decoration-none" style={{ color: indigoColor }}>
                                                    {t('common.view')} <i className="bi bi-arrow-right"></i>
                                                </Link>
                                            </div>
                                        </li>
                                    ))
                                )}
                            </ul>
                            <div className="mt-4 text-center">
                                <Link to="/employer/jobs" className="btn btn-outline-secondary btn-sm rounded-pill">
                                    {t('employerDashboard.seeAllPostedJobs')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Custom CSS */}
            <style>{`
                .transform-scale-on-hover:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.15) !important;
                    transition: all 0.3s ease-in-out;
                }
                .transform-scale-on-hover {
                    transition: all 0.3s ease-in-out;
                }
                .bg-primary { background-color: ${indigoColor} !important; }
            `}</style>
        </div>
    );
};

export default EmployerDashboard;
