import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import EmployerSidebar from '../components/EmployerSidebar';

const EmployerPostJob = () => {
    const { t } = useTranslation();
    const { user, authFetch } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        city: '',
        pincode: '',
        salary: '',
        isFeatured: false,
    });
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormSuccess('');
        setIsSubmitting(true);

        // Basic validation
        if (!formData.title || !formData.description || !formData.category || !formData.city || !formData.pincode) {
            setFormError(t('employerPostJob.requiredFields'));
            setIsSubmitting(false);
            return;
        }

        // Validate salary if provided
        const salaryNumber = formData.salary ? Number(formData.salary) : null;
        if (formData.salary && isNaN(salaryNumber)) {
            setFormError(t('employerPostJob.salaryInvalid'));
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await authFetch('jobs', {
                method: 'POST',
                body: JSON.stringify({ ...formData, salary: salaryNumber }),
            });

            const data = await response.json();

            if (response.ok) {
                setFormSuccess(t('employerPostJob.postedSuccess'));
                // Redirect to My Jobs page after a short delay
                setTimeout(() => {
                    navigate('/employer/jobs');
                }, 2000);
            } else {
                setFormError(data.msg || t('employerPostJob.postFailedServer'));
            }
        } catch (error) {
            setFormError(error.message || t('employerPostJob.postFailedUnexpected'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const indigoColor = '#4f46e5';

    return (
        <div className="container-fluid d-flex p-0">
            <EmployerSidebar userId={user?._id || t('admin.common.loading')} />

            <div className="flex-grow-1 p-5 bg-light">
                <div className="row">
                    <div className="col-lg-8 mx-auto">
                        <div className="card p-5 shadow-lg border-0 rounded-4">
                            <h1 className="mb-4 fw-bold d-flex align-items-center" style={{ color: indigoColor }}>
                                <i className="bi bi-bullhorn me-3"></i> {t('employerPostJob.title')}
                            </h1>
                            <p className="text-muted mb-4">{t('employerPostJob.subtitle')}</p>

                            {formError && <div className="alert alert-danger" role="alert"><i className="bi bi-x-octagon-fill me-2"></i> {formError}</div>}
                            {formSuccess && <div className="alert alert-success" role="alert"><i className="bi bi-check-circle-fill me-2"></i> {formSuccess}</div>}

                            <form onSubmit={handleSubmit}>
                                <div className="row g-3">
                                    <div className="col-md-8">
                                        <label htmlFor="title" className="form-label fw-semibold">{t('employerPostJob.jobTitle')} *</label>
                                        <input type="text" className="form-control" id="title" name="title" value={formData.title} onChange={handleChange} placeholder={t('employerPostJob.jobTitlePlaceholder')} required disabled={isSubmitting} />
                                    </div>
                    <div className="col-md-4">
                        <label htmlFor="category" className="form-label fw-semibold">{t('jobs.category')} *</label>
                        <input type="text" className="form-control" id="category" name="category" value={formData.category} onChange={handleChange} placeholder={t('employerPostJob.categoryPlaceholder')} required disabled={isSubmitting} />
                    </div>
                                </div>

                                <div className="mb-3 mt-3">
                                    <label htmlFor="description" className="form-label fw-semibold">{t('employerPostJob.jobDescription')} *</label>
                                    <textarea className="form-control" id="description" name="description" rows="5" value={formData.description} onChange={handleChange} placeholder={t('employerPostJob.descriptionPlaceholder')} required disabled={isSubmitting}></textarea>
                                </div>

                                <div className="row g-3 mb-4">
                                    <div className="col-md-4">
                                        <label htmlFor="city" className="form-label fw-semibold">{t('employerPostJob.city')} *</label>
                                        <input type="text" className="form-control" id="city" name="city" value={formData.city} onChange={handleChange} required placeholder={t('employerPostJob.cityPlaceholder')} disabled={isSubmitting} />
                                    </div>
                                    <div className="col-md-4">
                                        <label htmlFor="pincode" className="form-label fw-semibold">{t('employerPostJob.pincode')} *</label>
                                        <input type="text" className="form-control" id="pincode" name="pincode" value={formData.pincode} onChange={handleChange} required placeholder={t('employerPostJob.pincodePlaceholder')} disabled={isSubmitting} />
                                    </div>
                                    <div className="col-md-4">
                                        <label htmlFor="salary" className="form-label fw-semibold">{t('employerPostJob.monthlySalary')}</label>
                                        <input type="number" className="form-control" id="salary" name="salary" value={formData.salary} onChange={handleChange} placeholder={t('employerPostJob.salaryPlaceholder')} disabled={isSubmitting} />
                                    </div>
                                </div>

                                <div className="form-check mb-4">
                                    <input className="form-check-input" type="checkbox" id="isFeatured" name="isFeatured" checked={formData.isFeatured} onChange={handleChange} disabled={isSubmitting} />
                                    <label className="form-check-label fw-semibold" htmlFor="isFeatured">
                                        {t('employerPostJob.featureLabel')}
                                    </label>
                                </div>

                                <button type="submit" className="btn btn-lg text-white rounded-pill px-5 fw-bold shadow-sm"
                                        style={{ backgroundColor: indigoColor, borderColor: indigoColor }} disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            {t('employerPostJob.posting')}
                                        </>
                                    ) : (
                                        <><i className="bi bi-arrow-up-circle-fill me-2"></i> {t('employerPostJob.publishNow')}</>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployerPostJob;
