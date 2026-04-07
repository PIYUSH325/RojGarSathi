import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import UserModal from '../components/UserModal';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css';
import { useTranslation } from 'react-i18next';

const API_BASE_URL = "http://localhost:5000/api/v1";

const AdminUsers = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, token, isLoggedIn } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const itemsPerPage = 10;

    useEffect(() => {
        if (!isLoggedIn || !user || user.role !== 'admin') {
            navigate('/login');
            return;
        }
    }, [isLoggedIn, user, navigate]);
    const fetchUsers = useCallback(async () => {
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
            
            let url = `${API_BASE_URL}/admin/users?page=${currentPage}&limit=${itemsPerPage}`;
            if (searchTerm) {
                url += `&search=${searchTerm}`;
            }
            const response = await fetch(url, { headers });
            const data = await response.json();
            if (response.ok) {
                setUsers(data.users || []);
                setTotalPages(data.pagination?.totalPages || 1);
            } else {
                setError(data.msg || t('admin.users.fetchFailed'));
            }
        } catch (err) {
            setError(t('admin.users.fetchFailed'));
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchTerm, token, isLoggedIn, navigate]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleUserAction = async (action, userId, userData = null) => {
        try {
            setModalLoading(true);
            setError(null);
            
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
                case 'create':
                    response = await fetch(`${API_BASE_URL}/admin/users`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(userData)
                    });
                    successMessage = t('admin.users.created');
                    break;
                case 'update':
                    response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
                        method: 'PUT',
                        headers,
                        body: JSON.stringify(userData)
                    });
                    successMessage = t('admin.users.updated');
                    break;
                case 'delete':
                    response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
                        method: 'DELETE',
                        headers
                    });
                    successMessage = t('admin.users.deleted');
                    break;
                case 'block':
                case 'unblock':
                    response = await fetch(`${API_BASE_URL}/admin/users/${userId}/block`, {
                        method: 'PUT',
                        headers
                    });
                    successMessage = action === 'block' ? t('admin.users.blocked') : t('admin.users.unblocked');
                    break;
                default:
                    throw new Error(`Unknown action: ${action}`);
            }

            const data = await response.json();

            if (response.ok) {
                fetchUsers();
                setShowUserModal(false);
                setSelectedUser(null);
                setShowDeleteConfirm(false);
                setUserToDelete(null);
                alert(successMessage);
            } else {
                setError(data.msg || t('admin.common.actionFailed'));
                alert(data.msg || t('admin.common.actionFailed'));
            }
        } catch (err) {
            console.error('User action failed:', err);
            setError(err.message || t('admin.common.actionFailed'));
            alert(err.message || t('admin.common.actionFailedRetry'));
        } finally {
            setModalLoading(false);
        }
    };

    const handleSaveUser = (userData) => {
        if (selectedUser) {
            handleUserAction('update', selectedUser._id, userData);
        } else {
            handleUserAction('create', null, userData);
        }
    };

    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        if (userToDelete) {
            handleUserAction('delete', userToDelete._id);
        }
    };

    return (
        <div className="admin-dashboard">
            <AdminSidebar />
            <div className="admin-content">
                <div className="admin-page">
                    <div className="admin-page-header">
                        <div>
                            <h1 className="admin-page-title"><i className="bi bi-people me-2"></i>{t('admin.users.title')}</h1>
                            <p className="admin-page-subtitle">{t('admin.users.subtitle')}</p>
                        </div>
                        <div className="admin-toolbar">
                            <input
                                type="text"
                                className="form-control admin-form-control"
                                placeholder={t('admin.users.searchPlaceholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button
                                className="btn admin-btn-primary"
                                onClick={() => {
                                    setSelectedUser(null);
                                    setShowUserModal(true);
                                }}
                            >
                                <i className="bi bi-plus-lg me-1"></i>
                                {t('admin.users.addUser')}
                            </button>
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

                    {!loading && !error && (
                        <div className="admin-panel-card">
                            <h2 className="admin-section-title">{t('admin.users.allUsers')}</h2>
                            <div className="admin-data-table-wrap">
                                <table className="admin-data-table">
                                    <thead>
                                        <tr>
                                            <th>{t('admin.common.name')}</th>
                                            <th>{t('admin.common.email')}</th>
                                            <th>{t('admin.common.role')}</th>
                                            <th>{t('admin.common.status')}</th>
                                            <th>{t('admin.common.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((u) => (
                                            <tr key={u._id}>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="admin-avatar-circle me-3">
                                                            {u.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="fw-semibold">{u.name}</div>
                                                            <small className="text-muted">{t('admin.users.idPrefix')} {u._id.slice(-6)}</small>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{u.email}</td>
                                                <td>
                                                    <span className={`admin-badge ${u.role === 'admin' ? 'admin-badge-danger' : 'admin-badge-soft'}`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`admin-badge ${u.isBlocked ? 'admin-badge-danger' : 'admin-badge-success'}`}>
                                                        {u.isBlocked ? t('admin.users.blockedStatus') : t('admin.users.activeStatus')}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="btn-group" role="group">
                                                        <button
                                                            className="btn btn-sm admin-btn-outline"
                                                            onClick={() => {
                                                                setSelectedUser(u);
                                                                setShowUserModal(true);
                                                            }}
                                                        >
                                                            <i className="bi bi-pencil"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm admin-btn-outline"
                                                            onClick={() => handleUserAction(u.isBlocked ? 'unblock' : 'block', u._id)}
                                                        >
                                                            <i className={`bi bi-${u.isBlocked ? 'unlock' : 'lock'}`}></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm admin-btn-danger"
                                                            onClick={() => handleDeleteClick(u)}
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="d-flex justify-content-end mt-3">
                                <nav>
                                    <ul className="pagination mb-0">
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

                {/* User Modal */}
                <UserModal
                    isOpen={showUserModal}
                    onClose={() => {
                        setShowUserModal(false);
                        setSelectedUser(null);
                    }}
                    user={selectedUser}
                    onSave={handleSaveUser}
                    loading={modalLoading}
                />

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
                                    <p>{t('admin.users.deletePrompt', { name: userToDelete?.name })}</p>
                                    <p className="text-danger">{t('admin.common.cannotUndo')}</p>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                                        {t('admin.common.cancel')}
                                    </button>
                                    <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={modalLoading}>
                                        {modalLoading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                {t('admin.common.deleting')}
                                            </>
                                        ) : (
                                            t('admin.users.deleteUser')
                                        )}
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

export default AdminUsers;
