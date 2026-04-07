import React from 'react';
import { NavLink } from 'react-router-dom';
import './WorkerSidebar.css';
import { useTranslation } from 'react-i18next';

const WorkerSidebar = ({ userId, logout }) => {
  const { t } = useTranslation();
  const navItems = [
    { name: t('workerSidebar.dashboard'), path: '/worker/dashboard', icon: 'Dashboard', description: t('workerSidebar.dashboardDesc') },
    { name: t('workerSidebar.browseJobs'), path: '/jobs', icon: 'Jobs', description: t('workerSidebar.browseJobsDesc') },
    { name: t('workerSidebar.myApplications'), path: '/worker/applications', icon: 'Applications', description: t('workerSidebar.myApplicationsDesc') },
    { name: t('header.myProfile'), path: '/worker/profile', icon: 'Profile', description: t('workerSidebar.myProfileDesc') },
    { name: t('workerSidebar.verificationDocs'), path: '/worker/documents', icon: 'Documents', description: t('workerSidebar.verificationDocsDesc') },
  ];
  
  // --- Icon Components (using Lucide-React equivalent SVGs) ---

  const safeDisplay = (value) => {
    if (value == null) return t('admin.common.na');
    if (typeof value === 'string' || typeof value === 'number') return value.toString();
    return '—';
  };

  const Icon = ({ name, className = 'worker-sidebar-icon', color = 'currentColor' }) => {
    const icons = {
      Dashboard: <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/></svg>,
      Jobs: <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>,
      Applications: <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>,
      Profile: <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
      Documents: <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>,
    };
    return icons[name] || icons.Dashboard;
  };

  return (
    <aside className="worker-sidebar h-100">
      <div className="worker-sidebar-panel p-4 h-100 d-flex flex-column">
        <div className="worker-sidebar-top mb-4 pb-3">
          <p className="worker-sidebar-kicker mb-1">{t('workerSidebar.workerZone')}</p>
          <h5 className="fw-bold mb-2">{t('workerSidebar.portalTitle')}</h5>
          <small className="text-muted">{t('workerSidebar.workerId')} <span className="fw-semibold text-dark">{safeDisplay(userId)}</span></small>
        </div>

        <ul className="list-unstyled mb-4 worker-sidebar-nav">
          {navItems.map((item) => (
            <li key={item.name} className="mb-2">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `worker-sidebar-link d-flex align-items-center p-3 rounded-3 text-decoration-none ${isActive ? 'active' : ''}`
                }
              >
                <span className="worker-sidebar-icon-wrap me-3">
                  <Icon name={item.icon} />
                </span>
                <div>
                  <div className="fw-semibold worker-sidebar-link-title">{item.name}</div>
                  <small className="worker-sidebar-link-desc d-block">{item.description}</small>
                </div>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="worker-sidebar-bottom mt-auto pt-3">
          <button onClick={logout} className="btn worker-signout-btn w-100 rounded-pill py-2 fw-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" className="me-2" style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            {t('header.logout')}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default WorkerSidebar;
