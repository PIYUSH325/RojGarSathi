import React, { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import './AdminDashboard.css';
import { useTranslation } from 'react-i18next';

const AdminNotifications = () => {
    const { t } = useTranslation();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/v1/admin/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setNotifications(data.notifications || []);
        } catch (err) {
            setError(t('admin.notifications.fetchFailed'));
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationAction = async (action, notificationId) => {
        try {
            const token = localStorage.getItem('token');
            if (action === 'markRead') {
                await fetch(`/api/v1/admin/notifications/${notificationId}/read`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
            fetchNotifications();
        } catch (err) {
            console.error('Notification action failed:', err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            const token = localStorage.getItem('token');
            // Mark all unread notifications as read
            const unreadNotifications = notifications.filter(n => !n.isRead);
            await Promise.all(
                unreadNotifications.map(notification =>
                    fetch(`/api/v1/admin/notifications/${notification._id}/read`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    })
                )
            );
            fetchNotifications();
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    return (
        <div className="admin-dashboard">
            <AdminSidebar />
            <div className="admin-content">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="h3 mb-0">
                        <i className="bi bi-bell me-2"></i>
                        {t('admin.notifications.title')}
                    </h1>
                    <button className="btn btn-outline-primary" onClick={handleMarkAllRead}>
                        <i className="bi bi-check-all me-1"></i>
                        {t('admin.notifications.markAllRead')}
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

                {!loading && !error && (
                    <div className="notifications-management">
                        <h2>{t('admin.notifications.systemNotifications')}</h2>
                        {notifications.length === 0 ? (
                            <div className="text-center py-5">
                                <i className="bi bi-bell-slash display-4 text-muted mb-3"></i>
                                <h5 className="text-muted">{t('admin.notifications.none')}</h5>
                            </div>
                        ) : (
                            <div className="notification-list">
                                {notifications.map(notification => (
                                    <div key={notification._id} className={`notification-item ${!notification.isRead ? 'unread' : ''}`}>
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div className="flex-grow-1">
                                                <p className="mb-1">{notification.message}</p>
                                                <small className="text-muted">
                                                    {new Date(notification.createdAt).toLocaleString()}
                                                </small>
                                            </div>
                                            <div className="d-flex gap-2">
                                                {!notification.isRead && (
                                                    <span className="badge bg-primary rounded-pill">{t('admin.common.new')}</span>
                                                )}
                                                <button
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => handleNotificationAction('markRead', notification._id)}
                                                >
                                                    <i className="bi bi-check-lg"></i>
                                                </button>
                                            </div>
                                        </div>
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

export default AdminNotifications;
