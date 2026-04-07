import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

// Define the core color used across the components
const INDIGO_COLOR = '#4f46e5'; // Indigo 600

// --- 1. Utility Components ---

// Skeletal Loader Card
const SkeletonCard = () => (
    <div className="col-lg-4 col-md-6 mb-4">
      <div className="card h-100 shadow-sm border-0 rounded-4 animate-pulse">
        <div className="card-body p-4">
          <div className="d-flex align-items-start mb-3 border-bottom pb-3">
            <div className="bg-light-gray rounded-3 me-3 flex-shrink-0" style={{ width: '55px', height: '55px' }}></div>
            <div>
              <div className="bg-light-gray rounded mb-1" style={{ height: '24px', width: '150px' }}></div>
              <div className="bg-light-gray rounded" style={{ height: '14px', width: '100px' }}></div>
            </div>
          </div>
          <div className="bg-light-gray rounded mb-2" style={{ height: '16px' }}></div>
          <div className="bg-light-gray rounded mb-4" style={{ height: '16px', width: '80%' }}></div>
          <div className="d-flex gap-2 mb-3">
            <div className="bg-light-gray rounded-pill" style={{ height: '20px', width: '80px' }}></div>
            <div className="bg-light-gray rounded-pill" style={{ height: '20px', width: '100px' }}></div>
          </div>
          <div className="d-flex justify-content-between pt-3 border-top">
            <div className="bg-light-gray rounded" style={{ height: '18px', width: '100px' }}></div>
            <div className="bg-light-gray rounded-pill" style={{ height: '35px', width: '100px' }}></div>
          </div>
        </div>
      </div>
    </div>
);

const JobCard = ({ job, isExpanded, onToggleExpand, isApplied, onApply, onUndoApply, isLoggedIn, userRole }) => {
  const { t } = useTranslation();
    // Ensure all required fields exist for display
    const { title, description, category, city, pincode, salary, _id, status, requirements = [], postedBy = 'Employer' } = job;
    const navigate = useNavigate();
    
    // Formatting helpers
  const formatSalary = (s) => (s ? `₹${Number(s).toLocaleString()}` : t('jobs.negotiable'));
  const truncatedDescription = description ? `${description.substring(0, 100)}...` : t('jobs.noDescription');
  const fullDescription = description || t('jobs.noDescription');
    const jobStatus = status || 'open';
    
    let statusClass;
    let statusText;
    if (jobStatus.toLowerCase() === 'open') {
        statusClass = 'bg-success';
        statusText = t('jobs.active');
    } else if (jobStatus.toLowerCase() === 'closed') {
        statusClass = 'bg-danger';
        statusText = t('jobs.closed');
    } else {
        statusClass = 'bg-warning text-dark';
        statusText = t('jobs.reviewing');
    }

    const handleApply = () => {
        if (!isLoggedIn) {
          alert(t('jobs.pleaseLoginToApply'));
            return;
        }
        if (isApplied) {
          alert(t('jobs.alreadyApplied'));
            return;
        }
        onApply(job._id, job);
    };

    return (
      <div className="col-md-6 col-lg-4 mb-4">
        <div className={`card h-auto shadow-lg border-0 rounded-4 overflow-hidden transform-on-hover ${isExpanded ? 'expanded-card' : ''}`}>
          <div className="card-body p-4 d-flex flex-column">
            
            <div className="d-flex justify-content-between align-items-start mb-3">
                {/* Title and Category */}
                <div>
                    <h5 className="card-title text-dark mb-1 fw-bold fs-5 text-truncate" style={{ color: INDIGO_COLOR }}>{title || 'Job Title Missing'}</h5>
                    <p className="card-subtitle text-muted small">{category || t('jobs.generalLabour')}</p>
                </div>
                {/* Status Badge */}
                <span className={`badge ${statusClass} text-uppercase ms-3`}>
                    {statusText}
                </span>
            </div>
            
            {/* Description and Details */}
            <p className="card-text text-secondary mb-3 flex-grow-1">{isExpanded ? fullDescription : truncatedDescription}</p>
 
            {!isExpanded ? (
              <div className="d-flex flex-wrap gap-2 small mb-3">
                <span className="badge bg-light text-dark border border-secondary">
                  <i className="bi bi-cash-stack me-1"></i> {formatSalary(salary)}
                </span>
                <span className="badge bg-light text-dark border border-secondary">
                  <i className="bi bi-geo-alt-fill me-1 text-danger"></i> {city || t('jobs.remote')}, {pincode}
                </span>
              </div>
            ) : (
              <>
                {/* Full Details when Expanded */}
                <div className="mb-4">
                  <h6 className="fw-bold mb-2" style={{ color: INDIGO_COLOR }}>{t('jobs.requirements')}</h6>
                  <ul className="list-unstyled small text-secondary">
                    {requirements.length > 0 ? (
                      requirements.map((req, idx) => (
                        <li key={idx} className="mb-1">
                          <i className="bi bi-check-circle-fill text-success me-2"></i>{req}
                        </li>
                      ))
                    ) : (
                      <li>{t('jobs.noRequirements')}</li>
                    )}
                  </ul>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="bg-light p-3 rounded-3">
                      <small className="text-muted">{t('jobs.salary')}</small>
                      <p className="mb-0 fw-semibold text-success">{formatSalary(salary)} / month</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="bg-light p-3 rounded-3">
                      <small className="text-muted">{t('jobs.location')}</small>
                      <p className="mb-0">{city}, {pincode}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="bg-light p-3 rounded-3">
                      <small className="text-muted">{t('jobs.postedBy')}</small>
                      <p className="mb-0 fw-semibold">{postedBy}</p>
                    </div>
                  </div>
                </div>

                {/* Apply Button when Expanded - Not shown for employers */}
                {userRole !== 'employer' && (
                  <div className="text-center">
                    {isApplied ? (
                      <div className="d-flex gap-2 justify-content-center flex-wrap">
                        <button
                          className="btn btn-warning text-dark rounded-pill px-4 fw-bold"
                          disabled
                        >
                          <i className="bi bi-check-circle-fill me-2"></i> {t('jobs.applied')}
                        </button>
                        <button
                          onClick={() => onUndoApply(job._id)}
                          className="btn btn-outline-danger rounded-pill px-4 fw-bold"
                        >
                          <i className="bi bi-x-circle me-2"></i> {t('jobs.undoApply')}
                        </button>
                        {isLoggedIn && (
                          <button
                            onClick={() => navigate(`/chat/${_id}`)}
                            className="btn btn-info text-white rounded-pill px-4 fw-bold"
                          >
                            <i className="bi bi-chat-dots me-2"></i> {t('jobs.chat')}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="d-flex gap-2 justify-content-center flex-wrap">
                        <button
                          onClick={handleApply}
                          className="btn btn-primary text-white rounded-pill px-5 fw-bold"
                          disabled={jobStatus !== 'open'}
                        >
                          <i className="bi bi-briefcase-fill me-2"></i> {t('jobs.applyNow')}
                        </button>
                        {isLoggedIn && (
                          <button
                            onClick={() => navigate(`/chat/${_id}`)}
                            className="btn btn-info text-white rounded-pill px-4 fw-bold"
                          >
                            <i className="bi bi-chat-dots me-2"></i> {t('jobs.chat')}
                          </button>
                        )}
                      </div>
                    )}
                    {!isLoggedIn && (
                      <p className="mt-3 small text-muted">
                        <Link to="/login">{t('jobs.login')}</Link> {t('jobs.toApply')}
                      </p>
                    )}
                  </div>
                )}
                {userRole === 'employer' && (
                  <div className="text-center">
                    {isLoggedIn && (
                      <button
                        onClick={() => navigate(`/chat/${_id}`)}
                        className="btn btn-info text-white rounded-pill px-4 fw-bold"
                      >
                        <i className="bi bi-chat-dots me-2"></i> {t('jobs.chat')}
                      </button>
                    )}
                    <p className="mt-3 small text-muted">
                      <i className="bi bi-info-circle me-2"></i> {t('jobs.employersViewOnly')}
                    </p>
                  </div>
                )}
              </>
            )}
 
            {/* Action Button */}
            {!isExpanded && (
              <div className="mt-auto pt-3 border-top text-center">
                <button 
                  onClick={onToggleExpand}
                  className="btn btn-sm text-white rounded-pill px-4 fw-semibold w-100"
                  style={{ backgroundColor: INDIGO_COLOR, borderColor: INDIGO_COLOR }}
                >
                  {t('jobs.viewDetails')} <i className="bi bi-arrow-down"></i>
                </button>
              </div>
            )}
            {isExpanded && (
              <div className="mt-3 pt-3 border-top text-center">
                <button 
                  onClick={onToggleExpand}
                  className="btn btn-sm btn-outline-secondary rounded-pill px-4 fw-semibold w-100"
                >
                  {t('jobs.hideDetails')} <i className="bi bi-arrow-up"></i>
                </button>
              </div>
            )}
            
          </div>
        </div>
      </div>
    );
};

// --- 2. Main Jobs Component ---
const Jobs = () => {
  const { t } = useTranslation();
  const { user, applyJob, undoApply, appliedJobs, isLoggedIn, getApplications, authFetch } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        keyword: '', // New input for general search
        category: '',
        city: '',
        pincode: '',
        sort: 'newest', // Add sort option
    });
    const [expandedJobs, setExpandedJobs] = useState(new Set());

    const isJobApplied = (jobId) => appliedJobs.some(app => app.job === jobId);

    const toggleExpand = (jobId) => {
        setExpandedJobs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(jobId)) {
                newSet.delete(jobId);
            } else {
                newSet.add(jobId);
            }
            return newSet;
        });
    };

    const handleApply = async (jobId, jobData) => {
        const success = await applyJob(jobId, jobData);
        if (success) {
          alert(t('jobs.applicationSubmitted'));
            // No need to reload, state is updated
        } else {
          alert(t('jobs.applyFailed'));
        }
    };

    // Fetch applied jobs on component mount to ensure state is up to date
    useEffect(() => {
        if (isLoggedIn) {
            getApplications();
        }
    }, [isLoggedIn, getApplications]);

    const handleUndoApply = async (jobId) => {
        if (!window.confirm(t('jobs.confirmWithdraw'))) {
            return;
        }
        // Find the application ID from appliedJobs
        const application = appliedJobs.find(app => app.job === jobId);
        if (application) {
            const success = await undoApply(application._id);
            if (success) {
              alert(t('jobs.withdrawSuccess'));
            } else {
                alert(t('jobs.withdrawFailed'));
            }
        } else {
              alert(t('jobs.applicationNotFound'));
        }
    };

    // Real API fetch logic with backend filtering and sorting
    const fetchJobs = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            // Build query parameters
            const params = new URLSearchParams();
            if (filters.keyword) params.append('keyword', filters.keyword);
            if (filters.category) params.append('category', filters.category);
            if (filters.city) params.append('city', filters.city);
            if (filters.pincode) params.append('pincode', filters.pincode);

            // Map sort options to backend sort parameters
            let sortParam = '';
            if (filters.sort === 'newest') sortParam = '-createdAt';
            else if (filters.sort === 'oldest') sortParam = 'createdAt';
            else if (filters.sort === 'salary-high') sortParam = '-salary';
            else if (filters.sort === 'salary-low') sortParam = 'salary';

            if (sortParam) params.append('sort', sortParam);

            const response = await authFetch(`jobs?${params.toString()}`);
            if (!response.ok) {
                throw new Error('Failed to fetch jobs');
            }
            const data = await response.json();
            setJobs(data.jobs || []);
        } catch (err) {
              setError(t('jobs.loadFailed'));
            console.error('Jobs fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [filters, authFetch]);

    // Initialize filters from URL parameters on component mount
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const keyword = urlParams.get('keyword') || '';
        const category = urlParams.get('category') || '';
        const city = urlParams.get('city') || '';

        setFilters(prev => ({
            ...prev,
            keyword,
            category,
            city
        }));
    }, []);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleResetFilters = () => {
        setFilters({ keyword: '', category: '', city: '', pincode: '', sort: 'newest' });
    };

    // --- Render Logic ---

    if (error) {
        return (
            <div className="container py-5 text-center">
              <h1 className="fw-bold mb-4">{t('jobs.listingsTitle')}</h1>
                <div className="alert alert-danger mx-auto" style={{ maxWidth: '600px' }}>
                    <i className="bi bi-x-circle-fill me-2"></i> {error}
                </div>
            </div>
        );
    }

    return (
        <div className="container py-5">
            <h1 className="fw-bolder mb-2 text-center" style={{ color: INDIGO_COLOR }}>
              <i className="bi bi -search me-2"></i> {t('jobs.title')}
            </h1>
            <p className="lead text-muted text-center mb-5">
                {jobs.length} {t('jobs.activeListings')} {loading ? '...' : t('jobs.available')}
            </p>

            {/* --- Advanced Filter Bar --- */}
            <div className="bg-white p-4 shadow-lg rounded-4 mb-5">
                <form className="row g-3 align-items-end">

                    {/* Keyword Search */}
                    <div className="col-lg-4 col-md-6">
                        <label className="form-label small fw-semibold text-muted">{t('jobs.keywordLabel')}</label>
                        <input
                            type="text"
                            className="form-control rounded-pill"
                            placeholder={t('jobs.keywordPlaceholder')}
                            name="keyword"
                            value={filters.keyword}
                            onChange={handleFilterChange}
                        />
                    </div>

                    {/* Category Filter (can be a select in a real app) */}
                    <div className="col-lg-2 col-md-6">
                        <label className="form-label small fw-semibold text-muted">{t('jobs.category')}</label>
                        <input
                            type="text"
                            className="form-control rounded-pill"
                            placeholder={t('jobs.categoryPlaceholder')}
                            name="category"
                            value={filters.category}
                            onChange={handleFilterChange}
                        />
                    </div>

                    {/* Location Filter */}
                    <div className="col-lg-2 col-md-6">
                        <label className="form-label small fw-semibold text-muted">{t('jobs.cityPincode')}</label>
                        <input
                            type="text"
                            className="form-control rounded-pill"
                            placeholder={t('jobs.cityPincodePlaceholder')}
                            name="city"
                            value={filters.city}
                            onChange={handleFilterChange}
                        />
                    </div>

                    {/* Sort Filter */}
                    <div className="col-lg-2 col-md-6">
                        <label className="form-label small fw-semibold text-muted">{t('jobs.sortBy')}</label>
                        <select
                            className="form-select rounded-pill"
                            name="sort"
                            value={filters.sort}
                            onChange={handleFilterChange}
                        >
                            <option value="newest">{t('jobs.newestFirst')}</option>
                            <option value="oldest">{t('jobs.oldestFirst')}</option>
                            <option value="salary-high">{t('jobs.salaryHighToLow')}</option>
                            <option value="salary-low">{t('jobs.salaryLowToHigh')}</option>
                        </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="col-lg-2 col-md-6 d-flex justify-content-end">
                        <button
                            type="button"
                            className="btn btn-outline-danger w-100 rounded-pill"
                            onClick={handleResetFilters}
                            disabled={loading}
                        >
                             <i className="bi bi-x-circle me-1"></i> {t('jobs.reset')}
                        </button>
                    </div>
                </form>
            </div>


            {/* --- Jobs List --- */}
            <div className="row g-4">
                {loading ? (
                    // Show 6 skeleton cards while loading
                    Array(6).fill(0).map((_, index) => <SkeletonCard key={index} />)
                ) : jobs.length > 0 ? (
                    jobs.map((job) => (
                        <JobCard
                            key={job._id}
                            job={job}
                            isExpanded={expandedJobs.has(job._id)}
                            onToggleExpand={() => toggleExpand(job._id)}
                            isApplied={isJobApplied(job._id)}
                            onApply={handleApply}
                            onUndoApply={handleUndoApply}
                            isLoggedIn={isLoggedIn}
                            userRole={user?.role}
                        />
                    ))
                ) : (
                    <div className="col-12 text-center py-5">
                        <i className="bi bi-box-seam-fill text-secondary display-4 mb-3"></i>
                        <h4 className="fw-semibold">{t('jobs.noJobsFound')}</h4>
                        <p className="text-muted">{t('jobs.adjustFilters')}</p>
                        <button className="btn btn-outline-secondary rounded-pill mt-3" onClick={handleResetFilters}>
                          {t('jobs.clearSearch')}
                        </button>
                    </div>
                )}
            </div>

            {/* Custom CSS for Animations and Styling */}
            <style>{`
                .animate-pulse { animation: pulse 1.5s infinite ease-in-out; }
                @keyframes pulse {
                    0% { opacity: 0.5; }
                    50% { opacity: 0.9; }
                    100% { opacity: 0.5; }
                }
                .bg-light-gray { background-color: #f2f2f2; }
                .transform-on-hover:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 1rem 3rem rgba(0,0,0,.175)!important;
                    transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
                }
                .transform-on-hover { transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out; }
                .form-control.rounded-pill { padding-left: 1.5rem; padding-right: 1.5rem; }
            `}</style>
        </div>
    );
};

export default Jobs;
