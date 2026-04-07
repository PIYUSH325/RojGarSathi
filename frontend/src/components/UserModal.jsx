import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const UserModal = ({ isOpen, onClose, user, onSave, loading }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'worker',
        phone: '',
        city: '',
        pincode: '',
        skills: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                password: '',
                role: user.role || 'worker',
                phone: user.phone || '',
                city: user.city || '',
                pincode: user.pincode || '',
                skills: user.skills ? user.skills.join(', ') : ''
            });
        } else {
            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'worker',
                phone: '',
                city: '',
                pincode: '',
                skills: ''
            });
        }
    }, [user, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const submitData = {
            ...formData,
            skills: formData.skills ? formData.skills.split(',').map(skill => skill.trim()) : []
        };

        // Remove password if empty (for updates)
        if (!submitData.password) {
            delete submitData.password;
        }

        onSave(submitData);
    };

    if (!isOpen) return null;

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            {user ? t('admin.userModal.editUser') : t('admin.userModal.addNewUser')}
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">{t('admin.common.name')} *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">{t('admin.common.email')} *</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            {!user && (
                                <div className="mb-3">
                                    <label className="form-label">{t('auth.password')} *</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required={!user}
                                        minLength="6"
                                    />
                                </div>
                            )}

                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">{t('admin.common.role')}</label>
                                    <select
                                        className="form-select"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                    >
                                        <option value="worker">{t('auth.worker')}</option>
                                        <option value="employer">{t('auth.employer')}</option>
                                        <option value="admin">{t('auth.admin')}</option>
                                    </select>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">{t('auth.phone')}</label>
                                    <input
                                        type="tel"
                                        className="form-control"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">{t('admin.userModal.city')}</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">{t('admin.userModal.pincode')}</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="pincode"
                                        value={formData.pincode}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">{t('admin.userModal.skills')}</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="skills"
                                    value={formData.skills}
                                    onChange={handleChange}
                                    placeholder={t('admin.userModal.skillsPlaceholder')}
                                />
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
                                        {t('admin.userModal.saving')}
                                    </>
                                ) : (
                                    user ? t('admin.userModal.updateUser') : t('admin.userModal.createUser')
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UserModal;
