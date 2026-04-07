import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

// Define the core color used across the components
const INDIGO_COLOR = '#4f46e5'; // Indigo 600

const JobDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
    const { user, applyJob, undoApply, appliedJobs, isLoggedIn } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isApplied, setIsApplied] = useState(false);

  // Mock jobs data (in real app, fetch from API)
  const MOCK_JOBS = [
    { _id: 'j1', title: 'Experienced Plumber', description: 'Need a reliable plumber for residential work in Bandra. Must have 5 years experience. Full-time position with benefits.', category: 'Construction', city: 'Mumbai', pincode: '400050', salary: 35000, status: 'open', requirements: ['5+ years experience', 'Own tools preferred', 'Valid license'], postedBy: 'ABC Constructions' },
    { _id: 'j2', title: 'Delivery Driver', description: 'Immediate opening for delivery driver with own motorbike. Full-time work, excellent pay. Routes within city limits.', category: 'Logistics', city: 'Delhi', pincode: '110001', salary: 30000, status: 'open', requirements: ['Own vehicle', 'Valid license', 'Smartphone required'], postedBy: 'QuickDeliveries' },
    // Add more mock jobs as needed to match Jobs.jsx
    { _id: 'j3', title: 'Housekeeping Staff', description: 'Part-time housekeeper required for a family home in Chennai. References essential. Flexible hours.', category: 'Housekeeping', city: 'Chennai', pincode: '600004', salary: 15000, status: 'closed', requirements: ['Experience in cleaning', 'References'], postedBy: 'Family Home' },
    { _id: 'j4', title: 'Electrician Assistant', description: 'Entry-level position helping senior electrician. Training provided. Great career start! Work on various sites.', category: 'Construction', city: 'Mumbai', pincode: '400010', salary: 20000, status: 'open', requirements: ['Basic electrical knowledge', 'Willing to learn'], postedBy: 'ElectroWorks' },
    { _id: 'j5', title: 'Retail Store Helper', description: 'Shop helper needed for a busy retail outlet. Shifts available, must be fluent in Hindi. Customer service focus.', category: 'Retail', city: 'Bengaluru', pincode: '560001', salary: 22000, status: 'open', requirements: ['Hindi fluent', 'Customer service'], postedBy: 'RetailMart' },
    // ... (include all from Jobs.jsx MOCK_JOBS for completeness)
  ];

  useEffect(() => {
    // Simulate fetching job details
    setLoading(true);
    setTimeout(() => {
      const foundJob = MOCK_JOBS.find(j => j._id === id);
      if (foundJob) {
        setJob(foundJob);
        // Check if already applied
        setIsApplied(appliedJobs.some(app => app.job._id === id));
        setError('');
      } else {
        setError(t('jobDetails.notFoundError'));
      }
      setLoading(false);
    }, 500);
  }, [id, appliedJobs, t]);

  const handleApply = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (isApplied) {
      alert(t('jobs.alreadyApplied'));
      return;
    }
    if (job) {
      const result = await applyJob(job._id, job);
      if (result) {
        setIsApplied(true);
        alert(t('jobs.applicationSubmitted'));
      } else {
        alert(t('jobs.applyFailed'));
      }
    }
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">{t('admin.common.loading')}</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container py-5 text-center">
        <h2 className="text-danger mb-4">{t('jobDetails.notFoundTitle')}</h2>
        <Link to="/jobs" className="btn btn-primary rounded-pill">{t('jobDetails.backToJobs')}</Link>
      </div>
    );
  }

  const formatSalary = (s) => (s ? `₹${Number(s).toLocaleString()}` : t('jobs.negotiable'));

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <Link to="/jobs" className="btn btn-outline-secondary mb-4 rounded-pill">
            <i className="bi bi-arrow-left me-2"></i> {t('jobDetails.backToJobs')}
          </Link>
          <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
            <div className="card-header bg-primary text-white py-4">
              <h1 className="mb-1 fw-bold">{job.title}</h1>
              <p className="mb-0 opacity-90">{job.category} • {job.city}, {job.pincode}</p>
            </div>
            <div className="card-body p-5">
              {/* Job Description */}
              <section className="mb-5">
                <h3 className="fw-bold mb-3" style={{ color: INDIGO_COLOR }}>{t('jobDetails.jobDescription')}</h3>
                <p className="lead text-secondary fs-6">{job.description}</p>
              </section>

              {/* Requirements */}
              <section className="mb-5">
                <h3 className="fw-bold mb-3" style={{ color: INDIGO_COLOR }}>{t('jobs.requirements')}</h3>
                <ul className="list-group list-group-flush">
                  {job.requirements && job.requirements.map((req, idx) => (
                    <li key={idx} className="list-group-item border-0 px-0 py-2">
                      <i className="bi bi-check-circle-fill text-success me-2"></i> {req}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Details */}
              <section className="row g-4 mb-5">
                <div className="col-md-6">
                  <div className="card border-0 bg-light rounded-3 p-3">
                    <h6 className="fw-bold mb-2" style={{ color: INDIGO_COLOR }}>{t('jobs.salary')}</h6>
                    <p className="mb-0 fs-5 fw-semibold text-success">{formatSalary(job.salary)} {t('jobDetails.perMonth')}</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card border-0 bg-light rounded-3 p-3">
                    <h6 className="fw-bold mb-2" style={{ color: INDIGO_COLOR }}>{t('jobs.location')}</h6>
                    <p className="mb-0 fs-6">{job.city}, {job.pincode}</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card border-0 bg-light rounded-3 p-3">
                    <h6 className="fw-bold mb-2" style={{ color: INDIGO_COLOR }}>{t('admin.common.status')}</h6>
                    <span className={`badge fs-6 ${job.status === 'open' ? 'bg-success' : 'bg-danger'}`}>
                      {job.status === 'open' ? t('jobs.active') : job.status === 'closed' ? t('jobs.closed') : t('jobs.reviewing')}
                    </span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card border-0 bg-light rounded-3 p-3">
                    <h6 className="fw-bold mb-2" style={{ color: INDIGO_COLOR }}>{t('jobs.postedBy')}</h6>
                    <p className="mb-0 fw-semibold">{job.postedBy}</p>
                  </div>
                </div>
              </section>

              {/* Apply Button */}
              <div className="text-center">
                {user?.role === 'employer' ? (
                  <p className="text-muted">{t('jobs.employersViewOnly')}</p>
                ) : isApplied ? (
                  <div className="d-flex gap-2 justify-content-center">
                    <button
                      className="btn btn-warning text-dark rounded-pill px-4 fw-bold"
                      disabled
                      style={{ minWidth: '150px' }}
                    >
                      <i className="bi bi-check-circle-fill me-2"></i> {t('jobs.applied')}
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm(t('jobs.confirmWithdraw'))) {
                          // Find the application ID from appliedJobs
                          const application = appliedJobs.find(app => app.job === job._id);
                          if (application) {
                            const success = await undoApply(application._id);
                            if (success) {
                              setIsApplied(false);
                              alert(t('jobs.withdrawSuccess'));
                            } else {
                              alert(t('jobs.withdrawFailed'));
                            }
                          } else {
                            alert(t('jobs.applicationNotFound'));
                          }
                        }
                      }}
                      className="btn btn-outline-danger rounded-pill px-4 fw-bold"
                      style={{ minWidth: '150px' }}
                    >
                      <i className="bi bi-x-circle me-2"></i> {t('jobs.undoApply')}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleApply}
                    className="btn btn-primary text-white rounded-pill px-5 fw-bold fs-5"
                    disabled={job.status !== 'open'}
                    style={{ minWidth: '200px' }}
                  >
                    <i className="bi bi-briefcase-fill me-2"></i> {t('jobs.applyNow')}
                  </button>
                )}
                {!isLoggedIn && (
                  <p className="mt-3 text-muted">
                    <Link to="/login">{t('jobs.login')}</Link> {t('jobs.toApply')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        .card { transition: box-shadow 0.3s ease; }
        .card:hover { box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15)!important; }
      `}</style>
    </div>
  );
};

export default JobDetails;
