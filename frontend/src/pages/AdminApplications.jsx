import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css';
import './AdminApplications.css';
import { useTranslation } from 'react-i18next';

const API_BASE_URL = "http://localhost:5000/api/v1";

const AdminApplications = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, token, isLoggedIn } = useAuth();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [applicationToDelete, setApplicationToDelete] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const itemsPerPage = 10;

    useEffect(() => {
        if (!isLoggedIn || !user || user.role !== 'admin') {
            navigate('/login');
            return;
        }
    }, [isLoggedIn, user, navigate]);

    const handleDelete = async (applicationId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/applications/${applicationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'delete' })
            });

            if (response.ok) {
                setApplications(prevApplications => 
                    prevApplications.filter(app => app._id !== applicationId)
                );
                setShowDeleteConfirm(false);
                setApplicationToDelete(null);
            } else {
                setError(t('admin.applications.deleteFailed'));
            }
        } catch (err) {
            setError(t('admin.applications.deleteError'));
            console.error('Error:', err);
        }
    };

    const handleStatusUpdate = async (applicationId, newStatus) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/applications/${applicationId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                const { application } = await response.json();
                setApplications(prevApplications =>
                    prevApplications.map(app =>
                        app._id === applicationId ? { ...app, status: newStatus } : app
                    )
                );
            } else {
                setError(t('admin.applications.statusUpdateFailed'));
            }
        } catch (err) {
            setError(t('admin.applications.statusUpdateError'));
            console.error('Error:', err);
        }
    };

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
            
            let url = `${API_BASE_URL}/admin/applications?page=${currentPage}&limit=${itemsPerPage}`;
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
                setError(data.msg || t('admin.applications.fetchFailed'));
            }
        } catch (err) {
            setError(t('admin.applications.fetchFailed'));
            console.error('Failed to fetch applications:', err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchTerm, token, isLoggedIn, navigate]);

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
                case 'approve':
                    response = await fetch(`${API_BASE_URL}/admin/applications/${applicationId}`, {
                        method: 'PUT',
                        headers,
                        body: JSON.stringify({ status: 'accepted' })
                    });
                    successMessage = t('admin.applications.approved');
                    break;
                case 'reject':
                    response = await fetch(`${API_BASE_URL}/admin/applications/${applicationId}`, {
                        method: 'PUT',
                        headers,
                        body: JSON.stringify({ status: 'rejected' })
                    });
                    successMessage = t('admin.applications.rejected');
                    break;
                case 'delete':
                    response = await fetch(`${API_BASE_URL}/admin/applications/${applicationId}`, {
                        method: 'DELETE',
                        headers
                    });
                    successMessage = t('admin.applications.deleted');
                    break;
                default:
                    throw new Error(`Unknown action: ${action}`);
            }

            const data = await response.json();

            if (response.ok) {
                fetchApplications();
                setShowDeleteConfirm(false);
                setApplicationToDelete(null);
                alert(successMessage);
            } else {
                alert(data.msg || t('admin.common.actionFailed'));
            }
        } catch (err) {
            console.error('Application action failed:', err);
            alert(t('admin.common.actionFailedRetry'));
        }
    };

    const handleDeleteClick = (application) => {
        setApplicationToDelete(application);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        if (applicationToDelete) {
            handleApplicationAction('delete', applicationToDelete._id);
        }
    };

    return (
        <div className="admin-dashboard">
            <AdminSidebar />
            <div className="admin-content">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="h3 mb-0">
                        <i className="bi bi-file-earmark-text me-2"></i>
                        {t('admin.applications.title')}
                    </h1>
                    <div className="d-flex gap-2">
                        <input
                            type="text"
                            className="form-control"
                            placeholder={t('admin.applications.searchPlaceholder')}
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
                        <p className="text-muted">{t('admin.applications.noneFound')}</p>
                    </div>
                )}

                {!loading && !error && applications.length > 0 && (
                    <div className="applications-management">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>{t('admin.applications.jobTitle')}</th>
                                    <th>{t('admin.applications.applicant')}</th>
                                    <th>{t('admin.applications.appliedDate')}</th>
                                    <th>{t('admin.common.status')}</th>
                                    <th>{t('admin.common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.map(app => (
                                    <tr key={app._id}>
                                        <td>
                                            <div>
                                                <div className="fw-semibold">{app.job?.title || t('admin.common.na')}</div>
                                                <small className="text-muted">{app.job?.category || t('admin.common.na')}</small>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <div className="avatar-circle bg-info text-white me-2">
                                                    {app.user?.name?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <div className="fw-semibold">{app.user?.name || t('admin.common.na')}</div>
                                                    <small className="text-muted">{app.user?.email || t('admin.common.na')}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{new Date(app.appliedDate).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`badge ${
                                                app.status === 'accepted' ? 'bg-success' : 
                                                app.status === 'rejected' ? 'bg-danger' : 
                                                'bg-warning'}`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="btn-group" role="group">
                                                <button
                                                    className="btn btn-sm btn-outline-success"
                                                    onClick={() => handleApplicationAction('approve', app._id)}
                                                    disabled={app.status === 'accepted'}
                                                >
                                                    <i className="bi bi-check-lg"></i>
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleApplicationAction('reject', app._id)}
                                                    disabled={app.status === 'rejected'}
                                                >
                                                    <i className="bi bi-x-lg"></i>
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-secondary"
                                                    onClick={() => handleDeleteClick(app)}
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

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

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">{t('admin.common.confirmDelete')}</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowDeleteConfirm(false)}></button>
                                </div>
                                <div className="modal-body">
                                    <p>{t('admin.applications.deletePrompt')}</p>
                                    <p className="text-danger">{t('admin.common.cannotUndo')}</p>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                                        {t('admin.common.cancel')}
                                    </button>
                                    <button type="button" className="btn btn-danger" onClick={confirmDelete}>
                                        {t('admin.applications.deleteApplication')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminApplications;
