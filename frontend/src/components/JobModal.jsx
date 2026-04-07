import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const JobModal = ({ isOpen, onClose, job, onSave, loading }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        city: '',
        pincode: '',
        salary: 0,
        status: 'open',
        requirements: [],
        employer: user?.userId || '',
        postedBy: user?.userId || ''
    });

    // Set employer and postedBy whenever user changes
    useEffect(() => {
        if (user && user.userId) {
            setFormData(prev => ({
                ...prev,
                employer: user.userId,
                postedBy: user.userId
            }));
        }
    }, [user]);

    useEffect(() => {
        if (job) {
            setFormData({
                title: job.title || '',
                description: job.description || '',
                category: job.category || '',
                city: job.city || '',
                pincode: job.pincode || '',
                salary: job.salary || 0,
                status: job.status || 'open',
                requirements: job.requirements || [],
                employer: job.employer || user?._id || ''
            });
        } else {
            setFormData(prev => ({
                ...prev,
                title: '',
                description: '',
                category: '',
                city: '',
                pincode: '',
                salary: 0,
                status: 'open',
                requirements: [],
                employer: user?._id || ''
            }));
        }
    }, [job, isOpen, user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'salary' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Ensure employer and postedBy are set to the current user's ID
        const updatedData = {
            ...formData,
            employer: user.userId,
            postedBy: user.userId
        };
        onSave(updatedData);
    };

    if (!isOpen) return null;

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            {job ? t('admin.jobModal.editJob') : t('admin.jobModal.addNewJob')}
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">{t('admin.jobModal.jobTitle')} *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">{t('admin.jobs.category')} *</label>
                                    <select
                                        className="form-select"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">{t('admin.jobModal.selectCategory')}</option>
                                        <option value="Construction">{t('admin.jobModal.categories.construction')}</option>
                                        <option value="Logistics">{t('admin.jobModal.categories.logistics')}</option>
                                        <option value="Housekeeping">{t('admin.jobModal.categories.housekeeping')}</option>
                                        <option value="Maintenance">{t('admin.jobModal.categories.maintenance')}</option>
                                        <option value="Retail">{t('admin.jobModal.categories.retail')}</option>
                                        <option value="Security">{t('admin.jobModal.categories.security')}</option>
                                        <option value="Hospitality">{t('admin.jobModal.categories.hospitality')}</option>
                                        <option value="Office/BPO">{t('admin.jobModal.categories.officeBpo')}</option>
                                        <option value="Warehouse">{t('admin.jobModal.categories.warehouse')}</option>
                                        <option value="Automotive">{t('admin.jobModal.categories.automotive')}</option>
                                        <option value="Healthcare">{t('admin.jobModal.categories.healthcare')}</option>
                                        <option value="Services">{t('admin.jobModal.categories.services')}</option>
                                        <option value="Factory Work">{t('admin.jobModal.categories.factoryWork')}</option>
                                        <option value="Admin">{t('auth.admin')}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">{t('admin.jobModal.description')} *</label>
                                <textarea
                                    className="form-control"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="4"
                                    required
                                />
                            </div>

                            <div className="row">
                                <div className="col-md-4 mb-3">
                                    <label className="form-label">{t('admin.jobModal.city')} *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label className="form-label">{t('admin.jobModal.pincode')}</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="pincode"
                                        value={formData.pincode}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label className="form-label">{t('admin.jobModal.salary')}</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="salary"
                                        value={formData.salary}
                                        onChange={handleChange}
                                        min="0"
                                        step="1000"
                                    />
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">{t('jobs.requirements')} *</label>
                                <textarea
                                    className="form-control"
                                    name="requirements"
                                    value={formData.requirements.join('\n')}
                                    onChange={(e) => {
                                        const reqs = e.target.value.split('\n').filter(req => req.trim());
                                        setFormData(prev => ({
                                            ...prev,
                                            requirements: reqs
                                        }));
                                    }}
                                    rows="4"
                                    placeholder={t('admin.jobModal.requirementsPlaceholder')}
                                    required
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">{t('admin.common.status')}</label>
                                <select
                                    className="form-select"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                >
                                    <option value="open">{t('jobs.active')}</option>
                                    <option value="closed">{t('jobs.closed')}</option>
                                    <option value="reviewing">{t('jobs.reviewing')}</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                {t('admin.common.cancel')}
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        {t('admin.jobModal.saving')}
                                    </>
                                ) : (
                                    job ? t('admin.jobModal.updateJob') : t('admin.jobModal.createJob')
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default JobModal;
