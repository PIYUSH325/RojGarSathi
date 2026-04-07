import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const EmployerSidebar = ({ userId }) => {
  const { t } = useTranslation();
  const { user, isLoggedIn, authFetch } = useAuth();
  const [applicationCount, setApplicationCount] = useState(0);
  const [countLoading, setCountLoading] = useState(false);

  const navItems = [
    { name: t('employerSidebar.dashboard'), path: '/employer/dashboard', icon: 'bi bi-grid-fill', description: t('employerSidebar.dashboardDesc') },
    { name: t('employerSidebar.myJobs'), path: '/employer/jobs', icon: 'bi bi-briefcase-fill', description: t('employerSidebar.myJobsDesc') },
    { name: t('employerSidebar.submissions'), path: '/employer/submissions', icon: 'bi bi-people-fill', description: t('employerSidebar.submissionsDesc') },
    { name: t('common.messages'), path: '/messages', icon: 'bi bi-chat-dots-fill', description: t('employerSidebar.messagesDesc') },

    { name: t('employerSidebar.employerProfile'), path: '/employer/settings', icon: 'bi bi-building-fill', description: t('employerSidebar.employerProfileDesc') },
    { name: t('employerSidebar.analytics'), path: '/employer/analytics', icon: 'bi bi-graph-up', description: t('employerSidebar.analyticsDesc') },
  ];

  const primaryNav = navItems.slice(0, 4);
  const secondaryNav = navItems.slice(4);

  // A custom class for the 'active' state to use a more subtle, yet distinct, background color and bold text.
  const activeClass = 'bg-primary-subtle text-primary fw-bold';
  // Custom class for inactive state to ensure good color and hover effect
  const inactiveClass = 'text-dark hover-bg-gray';

  useEffect(() => {
    const fetchApplicationCount = async () => {
      if (!isLoggedIn || user?.role !== 'employer') return;

      try {
        setCountLoading(true);
        const response = await authFetch('applications/employer?page=1&limit=1');
        const data = await response.json();
        setApplicationCount(data.count || 0);
      } catch (error) {
        console.error('Error fetching application count:', error);
      } finally {
        setCountLoading(false);
      }
    };

    fetchApplicationCount();
  }, [isLoggedIn, user, authFetch]);

  return (
    <div className="bg-white border-end p-4 shadow-sm h-100 d-flex flex-column professional-sidebar" style={{ minWidth: '280px' }}>
      
      {/* --- Header Section --- */}
      <div className="text-start mb-4 pb-3">
        <h5 className="fw-bolder text-dark mb-1">{t('employerSidebar.header')}</h5>
        <small className="text-muted">{t('employerSidebar.accountId')} <span className="fw-semibold text-secondary-emphasis">{userId || t('admin.common.na')}</span></small>
      </div>

      <hr className="my-2" /> {/* Subtle separator */}

      {/* --- Primary Navigation (Recruitment Focus) --- */}
      <h6 className="text-uppercase text-secondary small mb-3 mt-3 px-3 fw-semibold">{t('employerSidebar.recruitmentFlow')}</h6>
      <ul className="nav nav-pills flex-column mb-4">
        {primaryNav.map((item) => (
          <li className="nav-item mb-2" key={item.name}>
            <NavLink
              to={item.path}
              end
              className={({ isActive }) =>
                `nav-link py-3 px-3 rounded-3 transition-all-ease d-flex align-items-center ${isActive ? activeClass : inactiveClass}`
              }
            >
              <i className={`${item.icon} me-3 fs-5 nav-icon-fixed-width`}></i>
              <div className="d-flex justify-content-between align-items-center w-100">
                <div>
                  <div className="fw-semibold d-flex align-items-center">
                    {item.name}
                    {item.name === t('employerSidebar.submissions') && applicationCount > 0 && (
                      <span className="badge bg-danger ms-2">{applicationCount}</span>
                    )}
                  </div>
                  {/* Description remains for primary navigation for clarity */}
                  <small className="d-block text-truncate text-secondary">{item.description}</small>
                </div>
              </div>
            </NavLink>
          </li>
        ))}
      </ul>
      
      {/* --- Secondary Navigation (Account Management) --- */}
      <h6 className="text-uppercase text-secondary small mb-3 mt-3 px-3 fw-semibold">{t('employerSidebar.management')}</h6>
      <ul className="nav nav-pills flex-column flex-grow-1">
        {secondaryNav.map((item) => (
          <li className="nav-item mb-2" key={item.name}>
            <NavLink
              to={item.path}
              end
              className={({ isActive }) =>
                `nav-link py-2 px-3 rounded-3 transition-all-ease d-flex align-items-center ${isActive ? activeClass : inactiveClass}`
              }
            >
              <i className={`${item.icon} me-3 fs-6 nav-icon-fixed-width`}></i> 
              <span className="fw-normal">{item.name}</span>
            </NavLink>
          </li>
        ))}
      </ul>


      
      {/* --- Custom Styles --- */}
      <style>{`
        /* General Transitions */
        .transition-all-ease {
          transition: all 0.2s ease-in-out;
        }

        /* Hover State for Inactive Links */
        .hover-bg-gray:hover {
          background-color: var(--bs-gray-200); /* A very light gray hover */
          color: var(--bs-primary) !important; /* Highlight text slightly */
        }

        /* Active State Adjustments */
        .nav-link.bg-primary-subtle {
            border-left: 5px solid var(--bs-primary); /* Add a strong visual cue on the left */
        }

        /* Icon Spacing */
        .nav-icon-fixed-width {
            min-width: 25px; 
            text-align: center;
        }
        
        /* Ensures description text has good contrast */
        .nav-link.bg-primary-subtle .text-secondary {
            color: var(--bs-primary-text-emphasis) !important;
        }

      `}</style>
    </div>
  );
};

export default EmployerSidebar;