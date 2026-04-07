import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
// Assuming you are using Bootstrap and Bootstrap Icons (bi bi-*)

// --- Custom Components for better UX ---

// 1. Job Card Component
const JobCard = ({ job, t }) => {
  // Use optional chaining in case properties are missing
  const { title, companyName, location, description } = job;

  const normalizeKey = (value = '') =>
    String(value)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_');

  const localizeDynamic = (value, namespace) => {
    if (!value) return value;
    const normalized = normalizeKey(value);

    // Handle common user typos (e.g., plumberr -> plumber)
    const aliasMap = {
      plumberr: 'plumber'
    };

    const key = aliasMap[normalized] || normalized;
    return t(`featuredJobs.dynamic.${namespace}.${key}`, { defaultValue: value });
  };

  const localizedTitle = title ? localizeDynamic(title, 'titles') : t('featuredJobs.jobTitleMissing');
  const localizedDescription = description ? localizeDynamic(description, 'descriptions') : t('featuredJobs.noDescriptionProvided');

  // Helper to truncate description (shorter for home page)
  const truncatedDescription = localizedDescription.length > 60
    ? `${localizedDescription.substring(0, 60)}...`
    : localizedDescription;

  return (
    <div className="col-lg-4 col-md-6 mb-4">
      <div className="card h-100 shadow-lg border-0 rounded-4 overflow-hidden transform-on-hover">
        <div className="card-body p-4 d-flex flex-column">

          {/* Logo/Header Section */}
          <div className="d-flex align-items-start mb-3 border-bottom pb-3">
            <div
              className="bg-light p-3 rounded-3 me-3 flex-shrink-0"
              style={{ width: '55px', height: '55px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {/* Placeholder for Company Logo/Icon */}
              <i className="bi bi-building-fill fs-4 text-primary"></i>
            </div>
            <div>
              <h5 className="card-title text-dark mb-1 fw-bold fs-5 text-truncate">{localizedTitle}</h5>
              <p className="card-subtitle text-muted small">{companyName || t('featuredJobs.confidentialCompany')}</p>
            </div>
          </div>

          {/* Job Details Section */}
          <p className="card-text text-secondary mb-3 flex-grow-1">{truncatedDescription}</p>

          {/* Footer/Action Section */}
          <div className="d-flex justify-content-between align-items-center mt-auto pt-3 border-top">
            <p className="mb-0 small text-dark fw-semibold">
              <i className="bi bi-geo-alt-fill me-1 text-danger"></i> {location || t('featuredJobs.remoteUnknown')}
            </p>
            <a href="/jobs" className="btn btn-sm btn-outline-primary rounded-pill fw-semibold">
              {t('featuredJobs.viewDetails')} <i className="bi bi-arrow-right"></i>
            </a>
          </div>

        </div>
      </div>
    </div>
  );
};

// 2. Skeleton Loader Component
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

// --- Main FeaturedJobs Component ---
const FeaturedJobs = () => {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Simulate a slightly longer fetch time for better UX testing
    const fetchJobs = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/v1/jobs');
        const data = await response.json();
        
        // Use an array of sample job objects if the API returns an error for a better demo
        const jobsArray = response.ok ? (data.jobs || []) : [];

        // Add dummy data for a better visual representation if the API is empty or failing
        if (jobsArray.length === 0 && !response.ok) {
            setError(t('featuredJobs.failedToLoadApi'));
            setJobs([
                { _id: '1', title: 'Senior UX Designer', companyName: 'Innovatech Solutions', location: 'San Francisco, CA', salary: 120000, type: 'Full-time', description: 'Lead the design efforts for our flagship product, focusing on user-centered principles and engaging interfaces.' },
                { _id: '2', title: 'Full Stack Developer', companyName: 'WebCrafters Inc.', location: 'Remote', salary: 110000, type: 'Remote', description: 'Build and maintain scalable web applications using React, Node.js, and PostgreSQL. Must have 5+ years of experience.' },
                { _id: '3', title: 'Marketing Specialist', companyName: 'GrowthHack Agency', location: 'New York, NY', salary: 75000, type: 'Contract', description: 'Develop and execute digital marketing campaigns across social media and email channels. Analyze performance metrics.' },
            ]);
        } else {
             setJobs(jobsArray);
        }
      } catch (err) {
        setError(t('featuredJobs.networkError'));
      } finally {
        setTimeout(() => setLoading(false), 1000); // Wait 1 second to show skeleton loader
      }
    };

    fetchJobs();
  }, []);

  // --- Render Logic ---

  if (loading) {
    return (
      <div className="container py-5">
        <h2 className="text-center mb-5 fw-bold text-dark">{t('featuredJobs.titleLoading')}</h2>
        <div className="row g-4 justify-content-center">
          {Array(3).fill(0).map((_, index) => <SkeletonCard key={index} />)}
        </div>
        <div className="text-center mt-4 text-muted small">{t('featuredJobs.loadingMessage')}</div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h2 className="text-center mb-5 fw-bold text-dark">{t('featuredJobs.title')}</h2>
      
      {error && (
        <div className="alert alert-warning text-center small mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
        </div>
      )}

      <div className="row g-4 justify-content-center">
        {jobs.length > 0 ? (
          jobs.slice(0, 3).map((job) => <JobCard key={job._id} job={job} t={t} />)
        ) : (
          <div className="col-12 text-center py-5">
            <i className="bi bi-x-octagon-fill text-danger display-4 mb-3"></i>
            <p className="lead">{t('featuredJobs.noneAvailable')}</p>
            <p className="text-muted">{t('featuredJobs.checkBackSoon')}</p>
          </div>
        )}
      </div>

      {/* --- Custom CSS for Animation --- */}
      <style>{`
        .animate-pulse {
          animation: pulse 1.5s infinite ease-in-out;
        }
        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 0.9; }
          100% { opacity: 0.5; }
        }
        .bg-light-gray {
          background-color: #f2f2f2;
        }
        .transform-on-hover:hover {
          transform: translateY(-5px);
          box-shadow: 0 1rem 3rem rgba(0,0,0,.175)!important;
          transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
        }
        .transform-on-hover {
          transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
        }
        .bg-primary-subtle { background-color: #cfe2ff !important; }
        .text-primary { color: #0d6efd !important; }
        .bg-success-subtle { background-color: #d1e7dd !important; }
        .text-success { color: #198754 !important; }
      `}</style>
    </div>
  );
};

export default FeaturedJobs;