
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const INDIGO_COLOR = '#4f46e5';

// Status mapping for applications
const getApplicationStatus = (status) => {
    switch (status) {
        case 'applied':
            return { text: 'Applied', class: 'bg-info' };
        case 'reviewed':
            return { text: 'Under Review', class: 'bg-warning text-dark' };
        case 'accepted':
            return { text: 'Accepted', class: 'bg-success' };
        case 'rejected':
            return { text: 'Rejected', class: 'bg-danger' };
        default:
            return { text: 'Applied', class: 'bg-info' };
    }
};

// Job Application Card
const ApplicationCard = ({ application, onUndoApply }) => {
    const { jobData, appliedDate, status, _id } = application;
    const daysAgo = Math.floor((new Date() - new Date(appliedDate)) / (1000 * 60 * 60 * 24));
    const statusInfo = getApplicationStatus(status);

    const handleUndo = () => {
        if (window.confirm('Are you sure you want to withdraw this application?')) {
            onUndoApply(_id);
        }
    };

    return (
        <div className="col-md-6 col-lg-4 mb-4">
            <div className="card h-100 shadow-sm border-0 rounded-4">
                <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                        <h6 className="card-title fw-bold text-truncate" style={{ color: INDIGO_COLOR }}>{jobData.title}</h6>
                        <span className={`badge ${statusInfo.class} small`}>{statusInfo.text}</span>
                    </div>
                    <p className="card-text text-muted small mb-3">{jobData.category}</p>
                    <div className="d-flex justify-content-between mb-2">
                        <small className="text-secondary"><i className="bi bi-geo-alt me-1"></i>{jobData.city}, {jobData.pincode}</small>
                        <small className="text-secondary"><i className="bi bi-currency-rupee me-1"></i>{jobData.salary ? `₹${jobData.salary}` : 'Negotiable'}</small>
                    </div>
                    <small className="text-muted">Applied: {daysAgo} days ago</small>
                </div>
                <div className="card-footer bg-light border-0 pt-0">
                    <div className="d-flex gap-2">
                        <Link to={`/jobs/${application.job}`} className="btn btn-sm btn-outline-primary rounded-pill flex-fill">
                            View Job
                        </Link>
                        <button onClick={handleUndo} className="btn btn-sm btn-outline-danger rounded-pill flex-fill">
                            Undo Apply
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main MyApplications Component
const MyApplications = () => {
    const { getApplications, undoApply, authError, isLoading } = useAuth();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchApplications = async () => {
        setLoading(true);
        const apps = await getApplications();
        setApplications(apps);
        setLoading(false);
    };

    useEffect(() => {
        if (getApplications) {
            fetchApplications();
        }
    }, [getApplications]);

    const handleUndoApply = async (applicationId) => {
        const success = await undoApply(applicationId);
        if (success) {
            // Remove the application from the local state immediately
            setApplications(prev => prev.filter(app => app._id !== applicationId));
            // Refresh applications to ensure state is up to date
            fetchApplications();
        }
    };

    if (loading || isLoading) {
        return (
            <div className="container py-5 text-center">
                <h2 className="fw-bold mb-4" style={{ color: INDIGO_COLOR }}>My Applications</h2>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Loading your applications...</p>
            </div>
        );
    }

    return (
        <div className="container py-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold" style={{ color: INDIGO_COLOR }}>
                    <i className="bi bi-file-earmark-text me-2"></i>My Applications ({applications.length})
                </h2>
                <Link to="/jobs" className="btn btn-outline-primary rounded-pill">
                    <i className="bi bi-search me-1"></i>Browse More Jobs
                </Link>
            </div>

            {authError && <div className="alert alert-danger mb-4">{authError}</div>}

            {applications.length > 0 ? (
                <div className="row g-4">
                    {applications.map((app) => (
                        <ApplicationCard key={app._id} application={app} onUndoApply={handleUndoApply} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-5">
                    <i className="bi bi-inbox display-4 text-muted mb-3"></i>
                    <h4 className="fw-semibold text-muted">No Applications Yet</h4>
                    <p className="text-muted">Start applying to jobs to track your progress here.</p>
                    <Link to="/jobs" className="btn btn-primary rounded-pill">
                        <i className="bi bi-search me-1"></i>Find Jobs
                    </Link>
                </div>
            )}

            <style>{`
                .skeleton-pulse {
                    animation: pulse 1.5s ease-in-out infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default MyApplications;
