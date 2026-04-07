import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import '../pages/AdminDashboard.css';
import { useTranslation } from 'react-i18next';

const AdminSidebar = () => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        {
            path: '/admin',
            icon: 'bi-house-door',
            label: t('admin.sidebar.welcome')
        },
        {
            path: '/admin/users',
            icon: 'bi-people',
            label: t('admin.sidebar.userManagement')
        },
        {
            path: '/admin/jobs',
            icon: 'bi-briefcase',
            label: t('admin.sidebar.contentManagement')
        },
        {
            path: '/admin/reports',
            icon: 'bi-graph-up',
            label: t('admin.sidebar.reportsAnalytics')
        },
        {
            path: '/admin/settings',
            icon: 'bi-gear',
            label: t('admin.sidebar.siteSettings')
        },
        {
            path: '/admin/backup',
            icon: 'bi-database',
            label: t('admin.sidebar.databaseManagement')
        }
    ];

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    return (
        <>
            <button
                className="btn admin-sidebar-toggle d-lg-none position-fixed"
                onClick={toggleSidebar}
            >
                <i className="bi bi-list"></i>
            </button>

            {isOpen && (
                <div
                    className="admin-sidebar-overlay d-lg-none"
                    onClick={toggleSidebar}
                />
            )}

            <div
                className={`admin-sidebar ${isOpen ? 'open' : ''}`}
            >
                <div className="admin-sidebar-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 admin-sidebar-title">
                        <i className="bi bi-shield-lock me-2"></i>
                        {t('admin.sidebar.brand')}
                    </h5>
                    <button
                        className="btn btn-sm admin-btn-outline d-lg-none"
                        onClick={toggleSidebar}
                    >
                        <i className="bi bi-x"></i>
                    </button>
                </div>

                <nav className="admin-sidebar-nav py-3 flex-grow-1">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
                            onClick={() => {
                                setIsOpen(false);
                            }}
                        >
                            <i className={`bi ${item.icon} me-2`}></i>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="admin-sidebar-footnote">
                    <small>{t('admin.sidebar.footnote')}</small>
                </div>
            </div>
        </>
    );
};

export default AdminSidebar;
