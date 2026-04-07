import React, { useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getAvatarUrl } from '../utils/photoUrl';
import NotificationDropdown from './NotificationDropdown';
import ContactForm from './ContactForm';
import LanguageSwitcher from './LanguageSwitcher';

const Header = () => {
    const { t } = useTranslation();

    // Contact form modal state
    const [showContactForm, setShowContactForm] = useState(false);

    // Use real authentication state
    const { user, isLoggedIn, logout, profilePhoto, appliedJobs, apiBase } = useAuth();
    const { isDarkMode, toggleDarkMode } = useTheme();
    const isAuthenticated = isLoggedIn;
    const isJobSeeker = user?.role === 'worker';
    const isJobProvider = user?.role === 'employer';
    const isAdmin = user?.role === 'admin';
    const appliedJobsList = useMemo(() => (Array.isArray(appliedJobs) ? appliedJobs : []), [appliedJobs]);

    // Custom Tailwind-to-Bootstrap styles
    const indigo600 = { color: '#4f46e5' };
    const amber500Bg = { backgroundColor: '#f59e0b', color: '#fff' };

    // Determine the main Call-to-Action button based on the user's state
    const PrimaryCta = () => {
        const location = useLocation();

        if (isAuthenticated) {
            // Logged in: Show Profile/Dashboard link or Logout button
            let profilePath = isJobSeeker ? '/worker/profile' : isAdmin ? '/admin/dashboard' : '/profile';
            let profileLabel = isJobSeeker ? t('header.myProfile') : isAdmin ? t('header.adminDashboard') : t('header.profile');

            const currentProfilePhoto = profilePhoto || user?.profilePhoto;
            const profileImgSrc = getAvatarUrl(currentProfilePhoto, 36, apiBase);

            return (
                <>
                    {!isAdmin && !isJobProvider && (
                        <li className="nav-item d-lg-none">
                            <NavLink className="nav-link mx-2 text-primary fw-bold" to={profilePath}>{profileLabel}</NavLink>
                        </li>
                    )}
                    {!isAdmin && !isJobProvider && (
                        <li className="nav-item ms-lg-3">
                            <Link to={profilePath} className="btn btn-outline-primary d-none d-lg-block rounded-pill me-2 px-4 fw-bold d-flex align-items-center">
                                {currentProfilePhoto ? (
                                    <img
                                        src={profileImgSrc}
                                        alt={t('header.profile')}
                                        className="rounded-circle me-2"
                                        style={{ width: '30px', height: '30px', objectFit: 'cover' }}
                                        onError={(e) => {
                                            console.error('Profile image failed to load:', profileImgSrc);
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <i className="bi bi-person-circle me-2"></i>
                                )}
                                {profileLabel}
                            </Link>
                        </li>
                    )}
                    <li className="nav-item">
                        <button
                            onClick={logout}
                            className="btn btn-danger btn-sm rounded-pill px-4"
                        >
                            <i className="bi bi-box-arrow-right"></i> {t('header.logout')}
                        </button>
                    </li>
                </>
            );
        }

        // Not logged in: Show dual CTAs (Login and Post Job)
        return (
            <>
                {/* Secondary CTA (Post Job for Employers) - Prominent only on desktop, hidden on login page and home page */}
                {location.pathname !== '/login' && location.pathname !== '/' && (
                    <li className="nav-item me-2 d-none d-lg-block">
                        <Link to="/employer/post-job" className="btn btn-outline-dark rounded-pill px-3 fw-semibold">
                             <i className="bi bi-building me-2"></i> {t('header.forEmployers')}
                        </Link>
                    </li>
                )}
                {/* Primary CTA (Login/Sign Up) */}
                <li className="nav-item ms-lg-2">
                    <Link to="/login" className="btn btn-primary rounded-pill px-4 fw-semibold" style={{ backgroundColor: indigo600.color, borderColor: indigo600.color }}>
                        <i className="bi bi-person-fill me-1"></i> {t('header.loginSignup')}
                    </Link>
                </li>
            </>
        );
    };

    return (
        <>
            {/* --- Top Live Updates Banner --- */}
            <div 
                className="position-fixed top-0 start-0 w-100 py-2 small fw-semibold" 
                style={{ zIndex: 1050, ...amber500Bg }}
            >
                <div className="d-flex align-items-center container-fluid container-lg">
                    <span className="badge bg-dark rounded-pill me-2 py-1 px-2">
                        <i className="bi bi-bullhorn"></i> {t('common.live')}
                    </span>
                    {/* Replaced <marquee> with a CSS-based animation for smoother performance and modern compatibility */}
                    <div className="text-scroll-container">
                        <p className="text-scroll-content mb-0">{t('header.liveUpdate')}</p>
                    </div>
                </div>
            </div>
            
            {/* --- Main Navigation Bar --- */}
            {/* The main navbar is fixed-top and has margin-top to clear the banner */}
            <nav
                className={`navbar navbar-expand-lg shadow-sm fixed-top ${isDarkMode ? 'navbar-dark' : 'navbar-light'} ${isDarkMode ? 'bg-dark' : 'bg-white'}`}
                style={{
                    zIndex: 1040,
                    marginTop: '38px',
                    paddingBlock: '0.9rem',
                    backgroundColor: isDarkMode ? '#111827' : '#ffffff',
                    borderBottom: isDarkMode ? '1px solid #334155' : '1px solid #e9ecef'
                }}
            >
                <div className="container-fluid" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Link className="navbar-brand fw-bolder fs-4" to="/" style={{ color: isDarkMode ? '#818cf8' : indigo600.color }}>
                        <i className="bi bi-briefcase-fill me-2"></i>
                        <span style={{ color: isDarkMode ? '#f8fafc' : '#212529' }}>Rojgar</span>
                        <span style={{ color: isDarkMode ? '#cbd5e1' : 'inherit' }}>Sathi</span>
                    </Link>
                    
                    <button className="navbar-toggler border-0 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label={t('header.toggleNavigation')}>
                        <i className="bi bi-list fs-3" style={{ color: isDarkMode ? '#f8fafc' : indigo600.color }}></i>
                    </button>
                    
                    <div className="collapse navbar-collapse justify-content-between w-100" id="navbarNav">
                        <ul className="navbar-nav align-items-center w-100 justify-content-around" style={{ gap: '0.5rem' }}>
                            {/* General Nav Links */}
                            {!isAdmin && (
                                <>
                                    <li className="nav-item">
                                        <NavLink className="nav-link mx-2 fw-semibold nav-link-custom" to="/">{t('common.home')}</NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink className="nav-link mx-2 fw-semibold nav-link-custom" to="/jobs">{t('common.findJobs')}</NavLink>
                                    </li>
                                </>
                            )}
                            {isJobSeeker && (
                                <li className="nav-item dropdown">
                                    <button className="nav-link mx-2 fw-semibold nav-link-custom dropdown-toggle border-0 bg-transparent" id="applicationsDropdown" data-bs-toggle="dropdown" aria-expanded="false" type="button">
                                        {t('header.myApplications')}
                                        {appliedJobsList.length > 0 && (
                                            <span className="badge bg-danger ms-1" style={{ fontSize: '0.7em' }}>
                                                {appliedJobsList.length}
                                            </span>
                                        )}
                                    </button>
                                    <ul className="dropdown-menu" aria-labelledby="applicationsDropdown">
                                        {appliedJobsList.length > 0 ? (
                                            <>
{appliedJobsList.slice(0, 5).map((app, index) => {
                                                    if (!app) return null;
                                                    const jobTitle = app.job?.title || app.title || t('header.untitledJob');
                                                    const jobCity = app.job?.city || app.city || t('header.locationUnavailable');

                                                    return (
                                                        <li key={app._id || app.id || index}>
                                                            <Link className="dropdown-item" to="/worker/applications">
                                                                <strong>{jobTitle}</strong> - {jobCity}
                                                            </Link>
                                                        </li>
                                                    );
                                                }).filter(Boolean)}
                                                {appliedJobsList.length > 5 && (
                                                    <li><hr className="dropdown-divider" /></li>
                                                )}
                                                <li>
                                                    <Link className="dropdown-item fw-bold" to="/worker/applications">
                                                        {t('header.viewAllApplications')} ({appliedJobsList.length})
                                                    </Link>
                                                </li>
                                            </>
                                        ) : (
                                            <li>
                                                <span className="dropdown-item text-muted">{t('header.noApplications')}</span>
                                            </li>
                                        )}
                                    </ul>
                                </li>
                            )}
                            {isJobProvider && (
                                <li className="nav-item">
                                    <NavLink className="nav-link mx-2 fw-semibold nav-link-custom" to="/employer/dashboard">{t('header.employerCenter')}</NavLink>
                                </li>
                            )}
                            {isAdmin && (
                                <>
                                    <li className="nav-item">
                                        <NavLink className="nav-link mx-2 fw-semibold nav-link-custom" to="/admin">{t('header.welcome')}</NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink className="nav-link mx-2 fw-semibold nav-link-custom" to="/admin/users">{t('header.dashboard')}</NavLink>
                                    </li>
                                </>
                            )}
                            <li className="nav-item">
                                <NavLink className="nav-link mx-2 fw-semibold nav-link-custom" to="/about">{t('common.aboutUs')}</NavLink>
                            </li>
                            <li className="nav-item">
                                <button
                                    className="btn btn-link nav-link mx-2 fw-semibold nav-link-custom"
                                    onClick={() => setShowContactForm(true)}
                                    style={{ textDecoration: 'none', color: isDarkMode ? '#f8fafc' : '#333' }}
                                >
                                    <i className="bi bi-envelope me-1"></i>{t('common.contactUs')}
                                </button>
                            </li>

                            <li className="nav-item ms-2">
                                <LanguageSwitcher />
                            </li>

                            {/* Theme Toggle */}
                            <li className="nav-item ms-2">
                                <button
                                    onClick={toggleDarkMode}
                                    className="btn btn-outline-secondary rounded-pill d-flex align-items-center gap-2 px-3"
                                    title={isDarkMode ? t('header.themeLightTitle') : t('header.themeDarkTitle')}
                                >
                                    {isDarkMode ? (
                                        <>
                                            <i className="bi bi-sun-fill"></i>
                                            <span className="d-none d-md-inline">{t('common.light')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-moon-fill"></i>
                                            <span className="d-none d-md-inline">{t('common.dark')}</span>
                                        </>
                                    )}
                                </button>
                            </li>

                            {/* Message Icon */}
                            {isAuthenticated && (
                                <li className="nav-item ms-2">
                                    <Link 
                                        to="/messages" 
                                        className="btn btn-outline-primary rounded-pill d-flex align-items-center gap-2 px-3"
                                        title={t('common.messages')}
                                    >
                                        <i className="bi bi-chat-dots"></i>
                                        <span className="d-none d-md-inline">{t('common.messages')}</span>
                                    </Link>
                                </li>
                            )}
                            {/* Authentication and CTA Buttons */}
                            {isAuthenticated && <NotificationDropdown />}
                            <PrimaryCta />
                        </ul>
                    </div>
                </div>
            </nav>

            {/* --- Custom CSS for Animation and Styling --- */}
            <style>{`
                .nav-link-custom {
                    color: ${isDarkMode ? '#f8fafc' : '#333'} !important;
                    padding: 0.5rem 1rem;
                    position: relative;
                }
                .nav-link-custom:hover {
                    color: ${isDarkMode ? '#a5b4fc' : indigo600.color} !important;
                }
                .nav-link.active.nav-link-custom {
                    color: ${isDarkMode ? '#a5b4fc' : indigo600.color} !important;
                    border-bottom: 3px solid ${isDarkMode ? '#818cf8' : indigo600.color};
                    padding-bottom: 0.35rem;
                }

                .navbar .dropdown-menu {
                    background-color: ${isDarkMode ? '#111827' : '#ffffff'};
                    border: 1px solid ${isDarkMode ? '#334155' : '#dee2e6'};
                }

                .navbar .dropdown-item {
                    color: ${isDarkMode ? '#f8fafc' : '#212529'};
                }

                .navbar .dropdown-item:hover,
                .navbar .dropdown-item:focus {
                    background-color: ${isDarkMode ? '#1f2937' : '#f8f9fa'};
                    color: ${isDarkMode ? '#ffffff' : '#212529'};
                }
                
                /* Custom CSS for Marquee replacement */
                .text-scroll-container {
                    overflow: hidden;
                    white-space: nowrap;
                    flex: 1;
                    min-width: 0;
                    margin-left: 0.5rem;
                }
                .text-scroll-content {
                    display: inline-block;
                    animation: marquee 15s linear infinite;
                }
                @keyframes marquee {
                    0% { transform: translate(100%, 0); }
                    100% { transform: translate(-100%, 0); }
                }

                @media (max-width: 991.98px) {
                    .nav-link.active.nav-link-custom {
                        border-left: 4px solid ${isDarkMode ? '#818cf8' : indigo600.color};
                        border-bottom: none;
                        padding-left: 0.8rem;
                        background-color: ${isDarkMode ? '#1f2937' : '#f8f9fa'};
                    }
                }
            `}</style>

            {/* Contact Form Modal */}
            <ContactForm show={showContactForm} handleClose={() => setShowContactForm(false)} />
        </>
    );
};

export default Header;
