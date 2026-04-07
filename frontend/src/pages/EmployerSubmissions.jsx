import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployerSidebar from '../components/EmployerSidebar';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css';
import { useTranslation } from 'react-i18next';

const API_BASE_URL = "http://localhost:5000/api/v1";

const EmployerSubmissions = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, token, isLoggedIn } = useAuth();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('all');
    const [expandedCards, setExpandedCards] = useState(new Set());
    const itemsPerPage = 10;

    useEffect(() => {
        if (!isLoggedIn || !user || user.role !== 'employer') {
            navigate('/login');
            return;
        }
    }, [isLoggedIn, user, navigate]);



    const fetchApplications = useCallback(async () => {
        if (!token || !isLoggedIn) {
            navigate('/login');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            let url = `${API_BASE_URL}/applications/employer?page=${currentPage}&limit=${itemsPerPage}`;
            if (searchTerm) {
                url += `&search=${searchTerm}`;
            }
            const response = await fetch(url, { headers });
            const data = await response.json();
            if (response.ok) {
                let filteredApplications = data.applications || [];
                if (statusFilter !== 'all') {
                    filteredApplications = filteredApplications.filter(app => app.status === statusFilter);
                }
                setApplications(filteredApplications);
                setTotalPages(Math.ceil((data.count || 0) / itemsPerPage));
            } else {
                setError(data.msg || t('employerSubmissions.fetchFailed'));
            }
        } catch (err) {
            setError(t('employerSubmissions.fetchFailed'));
            console.error('Failed to fetch applications:', err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchTerm, statusFilter, token, isLoggedIn, navigate, t]);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    const handleApplicationAction = async (action, applicationId) => {
        try {
            if (!token || !isLoggedIn) {
                navigate('/login');
                throw new Error(t('admin.users.mustLogin'));
            }

            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            let response;
            let successMessage = '';

            switch (action) {
                case 'accept':
                    response = await fetch(`${API_BASE_URL}/applications/${applicationId}/status`, {
                        method: 'PUT',
                        headers,
                        body: JSON.stringify({ status: 'accepted' })
                    });
                    successMessage = t('employerSubmissions.accepted');
                    break;
                case 'reject':
                    response = await fetch(`${API_BASE_URL}/applications/${applicationId}/status`, {
                        method: 'PUT',
                        headers,
                        body: JSON.stringify({ status: 'rejected' })
                    });
                    successMessage = t('employerSubmissions.rejected');
                    break;
                case 'review':
                    response = await fetch(`${API_BASE_URL}/applications/${applicationId}/status`, {
                        method: 'PUT',
                        headers,
                        body: JSON.stringify({ status: 'reviewed' })
                    });
                    successMessage = t('employerSubmissions.reviewed');
                    break;
                default:
                    throw new Error(`Unknown action: ${action}`);
            }

            const data = await response.json();

            if (response.ok) {
                fetchApplications();
                alert(successMessage);
            } else {
                alert(data.msg || t('admin.common.actionFailed'));
            }
        } catch (err) {
            console.error('Application action failed:', err);
            alert(t('admin.common.actionFailedRetry'));
        }
    };

    const toggleCardExpansion = (applicationId) => {
        const newExpanded = new Set(expandedCards);
        if (newExpanded.has(applicationId)) {
            newExpanded.delete(applicationId);
        } else {
            newExpanded.add(applicationId);
        }
        setExpandedCards(newExpanded);
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'accepted': return 'bg-success';
            case 'rejected': return 'bg-danger';
            case 'reviewed': return 'bg-warning';
            default: return 'bg-secondary';
        }
    };

    return (
        <div className="admin-dashboard">
            <EmployerSidebar userId={user?._id} />
            <div className="admin-content">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="h3 mb-0">
                        <i className="bi bi-file-earmark-text me-2"></i>
                        {t('employerSubmissions.title')}
                    </h1>
                    <div className="d-flex gap-2">
                        <select
                            className="form-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ width: '150px' }}
                        >
                            <option value="all">{t('employerSubmissions.allStatus')}</option>
                            <option value="applied">{t('employerSubmissions.applied')}</option>
                            <option value="reviewed">{t('employerSubmissions.reviewedStatus')}</option>
                            <option value="accepted">{t('employerSubmissions.acceptedStatus')}</option>
                            <option value="rejected">{t('employerSubmissions.rejectedStatus')}</option>
                        </select>
                        <input
                            type="text"
                            className="form-control"
                            placeholder={t('employerSubmissions.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '250px' }}
                        />
                    </div>
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

                {!loading && !error && applications.length === 0 && (
                    <div className="text-center py-5">
                        <p className="text-muted">{t('employerSubmissions.noneFound')}</p>
                    </div>
                )}

                {!loading && !error && applications.length > 0 && (
                    <div className="applications-review">
                        {applications.map(app => (
                            <div key={app._id} className="card mb-3 shadow-sm">
                                <div className="card-header bg-light">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div className="d-flex align-items-center">
                                            {app.user?.profilePhoto ? (
                                                <img
                                                    src={`http://localhost:5000/uploads/${app.user.profilePhoto}`}
                                                    alt={t('employerSubmissions.profileAlt')}
                                                    className="rounded-circle me-3"
                                                    style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div className="avatar-circle bg-info text-white me-3 d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px', borderRadius: '50%' }}>
                                                    {app.user?.name?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                            )}
                                            <div>
                                                <h5 className="mb-0">{app.user?.name || t('admin.common.na')}</h5>
                                                <small className="text-muted">{app.user?.email || t('admin.common.na')}</small>
                                            </div>
                                        </div>
                                        <div className="text-end">
                                            <span className={`badge ${getStatusBadgeClass(app.status)} mb-2`}>
                                                {app.status}
                                            </span>
                                            <br />
                                            <small className="text-muted">
                                                {t('employerSubmissions.appliedOn')} {new Date(app.appliedDate).toLocaleDateString()}
                                            </small>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-body">
                                    <div className="row">
                                        <div className="col-md-8">
                                            <h6 className="card-title">{app.job?.title || t('admin.common.na')}</h6>
                                            <p className="card-text text-muted mb-2">
                                                <i className="bi bi-geo-alt me-1"></i>
                                                {app.job?.city || t('admin.common.na')}, {app.job?.pincode || t('admin.common.na')} •
                                                <i className="bi bi-tag ms-2 me-1"></i>
                                                {app.job?.category || t('admin.common.na')} •
                                                <i className="bi bi-currency-dollar ms-2 me-1"></i>
                                                ₹{app.job?.salary || t('admin.common.na')}
                                            </p>

                                            {app.coverLetter && (
                                                <div className="mb-3">
                                                    <h6><i className="bi bi-chat-quote me-2"></i>{t('employerSubmissions.coverLetter')}</h6>
                                                    <p className="text-muted">{app.coverLetter}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="col-md-4">
                                            <div className="d-flex flex-column gap-2">
                                                <button
                                                    className="btn btn-outline-success btn-sm"
                                                    onClick={() => handleApplicationAction('accept', app._id)}
                                                    disabled={app.status === 'accepted'}
                                                >
                                                    <i className="bi bi-check-lg me-1"></i>{t('employerSubmissions.accept')}
                                                </button>
                                                <button
                                                    className="btn btn-outline-warning btn-sm"
                                                    onClick={() => handleApplicationAction('review', app._id)}
                                                    disabled={app.status === 'reviewed' || app.status === 'accepted' || app.status === 'rejected'}
                                                >
                                                    <i className="bi bi-eye me-1"></i>{t('employerSubmissions.markReviewed')}
                                                </button>
                                                <button
                                                    className="btn btn-outline-danger btn-sm"
                                                    onClick={() => handleApplicationAction('reject', app._id)}
                                                    disabled={app.status === 'rejected'}
                                                >
                                                    <i className="bi bi-x-lg me-1"></i>{t('employerSubmissions.reject')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        className="btn btn-link p-0 mt-3"
                                        onClick={() => toggleCardExpansion(app._id)}
                                    >
                                        <i className={`bi ${expandedCards.has(app._id) ? 'bi-chevron-up' : 'bi-chevron-down'} me-1`}></i>
                                        {expandedCards.has(app._id) ? t('employerSubmissions.showLess') : t('employerSubmissions.viewFullDetails')}
                                    </button>

                                    {expandedCards.has(app._id) && (
                                        <div className="mt-3 pt-3 border-top">
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <h6>{t('employerSubmissions.applicantDetails')}</h6>
                                                    <ul className="list-unstyled">
                                                        <li><strong>{t('admin.common.name')}:</strong> {app.user?.name || t('admin.common.na')}</li>
                                                        <li><strong>{t('admin.common.email')}:</strong> {app.user?.email || t('admin.common.na')}</li>
                                                        <li><strong>{t('auth.phone')}:</strong> {app.user?.contactPhone || t('admin.common.na')}</li>
                                                        <li><strong>{t('jobs.location')}:</strong> {app.user?.city || t('admin.common.na')}, {app.user?.pincode || t('admin.common.na')}</li>
                                                        {app.user?.skills && app.user.skills.length > 0 && (
                                                            <li><strong>{t('employerSubmissions.skills')}:</strong> {app.user.skills.join(', ')}</li>
                                                        )}
                                                    </ul>
                                                </div>
                                                <div className="col-md-6">
                                                    <h6>{t('employerSubmissions.documents')}</h6>
                                                    <div className="d-flex flex-column gap-2">
                                                        {app.user?.resume && (
                                                            <a
                                                                href={`http://localhost:5000/uploads/${app.user.resume}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="btn btn-outline-primary btn-sm"
                                                            >
                                                                <i className="bi bi-file-earmark-pdf me-1"></i>{t('employerSubmissions.viewResume')}
                                                            </a>
                                                        )}
                                                        {app.user?.profilePhoto && (
                                                            <a
                                                                href={`http://localhost:5000/uploads/${app.user.profilePhoto}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="btn btn-outline-secondary btn-sm"
                                                            >
                                                                <i className="bi bi-image me-1"></i>{t('employerSubmissions.viewProfilePhoto')}
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        <div className="d-flex justify-content-end mt-3">
                            <nav>
                                <ul className="pagination">
                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>
                                            {t('admin.common.previous')}
                                        </button>
                                    </li>
                                    <li className="page-item disabled">
                                        <span className="page-link">{t('admin.common.pageOf', { current: currentPage, total: totalPages })}</span>
                                    </li>
                                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>
                                            {t('admin.common.next')}
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployerSubmissions;
