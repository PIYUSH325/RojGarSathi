import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import EmployerSidebar from '../components/EmployerSidebar';
import { getPhotoUrl } from '../utils/photoUrl';
import { useTranslation } from 'react-i18next';

const EmployerSettings = () => {
    const { t } = useTranslation();
    const { user, authFetch, updateProfilePhoto, profilePhoto, apiBase } = useAuth();
    const [settings, setSettings] = useState({
        companyName: '',
        companyDescription: '',
        contactEmail: '',
        contactPhone: '',
        website: '',
        address: '',
        notifications: {
            newApplications: true,
            applicationUpdates: true,
            weeklyReports: false,
        }
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState('');

    useEffect(() => {
        setPhotoPreview(getPhotoUrl(profilePhoto || user?.profilePhoto, apiBase));
    }, [profilePhoto, user, apiBase]);

    const fetchSettings = useCallback(async () => {
        try {
            setLoading(true);
            const response = await authFetch('user/profile');
            const data = await response.json();

            if (response.ok) {
                setSettings({
                    companyName: data.user.companyName || '',
                    companyDescription: data.user.companyDescription || '',
                    contactEmail: data.user.contactEmail || data.user.email || '',
                    contactPhone: data.user.contactPhone || '',
                    website: data.user.website || '',
                    address: data.user.address || '',
                    notifications: data.user.notifications || {
                        newApplications: true,
                        applicationUpdates: true,
                        weeklyReports: false,
                    }
                });
            }
        } catch (err) {
            console.error('Failed to fetch settings:', err);
        } finally {
            setLoading(false);
        }
    }, [authFetch]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleSettingChange = (field, value) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setSettings(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setSettings(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handlePhotoUpload = async () => {
        if (!photoFile) return;
        setError('');
        setSuccess('');
        setUploadingPhoto(true);

        try {
            const ok = await updateProfilePhoto(photoFile);
            if (ok) {
                setPhotoFile(null);
                setSuccess(t('employerSettings.photoUploaded'));
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(t('employerSettings.photoUploadFailed'));
            }
        } catch (err) {
            setError(t('employerSettings.photoUploadFailed'));
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSaving(true);

        try {
            const response = await authFetch('user/profile', {
                method: 'PUT',
                body: JSON.stringify(settings),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(t('employerSettings.saved'));
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(data.msg || t('employerSettings.saveFailed'));
            }
        } catch (err) {
            setError(t('employerSettings.saveFailed'));
            console.error('Failed to save settings:', err);
        } finally {
            setSaving(false);
        }
    };

    const indigoColor = '#4f46e5';

    if (loading) {
        return (
            <div className="container-fluid d-flex p-0">
                <EmployerSidebar userId={user?._id || t('admin.common.loading')} />
                <div className="flex-grow-1 p-5 bg-light d-flex align-items-center justify-content-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">{t('admin.common.loading')}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid d-flex p-0">
            <EmployerSidebar userId={user?._id || t('admin.common.loading')} />

            <div className="flex-grow-1 p-5 bg-light">
                <h1 className="fw-bold text-dark mb-4">{t('employerSettings.title')}</h1>

                {error && <div className="alert alert-danger" role="alert"><i className="bi bi-x-octagon-fill me-2"></i>{error}</div>}
                {success && <div className="alert alert-success" role="alert"><i className="bi bi-check-circle-fill me-2"></i>{success}</div>}

                <div className="row">
                    <div className="col-lg-8">
                        <div className="card mb-4 shadow-sm border-0 rounded-4">
                            <div className="card-header bg-white border-bottom-0 pt-4 px-4">
                                <h5 className="fw-bold mb-0" style={{ color: indigoColor }}>
                                    <i className="bi bi-person-circle me-2"></i>{t('employerSettings.profilePhoto')}
                                </h5>
                            </div>
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center gap-4 flex-wrap">
                                    <img
                                        src={photoPreview || 'https://via.placeholder.com/96'}
                                        alt={t('employerSettings.profileAlt')}
                                        className="rounded-circle shadow-sm"
                                        style={{ width: '96px', height: '96px', objectFit: 'cover' }}
                                    />
                                    <div className="flex-grow-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="form-control mb-3"
                                            onChange={handlePhotoChange}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-primary rounded-pill px-4"
                                            onClick={handlePhotoUpload}
                                            disabled={!photoFile || uploadingPhoto}
                                        >
                                            {uploadingPhoto ? t('employerSettings.uploading') : t('employerSettings.uploadPhoto')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {/* Employer Information */}
                            <div className="card mb-4 shadow-sm border-0 rounded-4">
                                <div className="card-header bg-white border-bottom-0 pt-4 px-4">
                                    <h5 className="fw-bold mb-0" style={{ color: indigoColor }}>
                                        <i className="bi bi-building me-2"></i>{t('employerSettings.employerInformation')}
                                    </h5>
                                </div>
                                <div className="card-body p-4">
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label htmlFor="companyName" className="form-label fw-semibold">{t('employerSettings.employerName')}</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="companyName"
                                                value={settings.companyName}
                                                onChange={(e) => handleSettingChange('companyName', e.target.value)}
                                                placeholder={t('employerSettings.employerNamePlaceholder')}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label htmlFor="contactEmail" className="form-label fw-semibold">{t('employerSettings.contactEmail')}</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                id="contactEmail"
                                                value={settings.contactEmail}
                                                onChange={(e) => handleSettingChange('contactEmail', e.target.value)}
                                                placeholder={t('employerSettings.contactEmailPlaceholder')}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label htmlFor="contactPhone" className="form-label fw-semibold">{t('employerSettings.contactPhone')}</label>
                                            <input
                                                type="tel"
                                                className="form-control"
                                                id="contactPhone"
                                                value={settings.contactPhone}
                                                onChange={(e) => handleSettingChange('contactPhone', e.target.value)}
                                                placeholder={t('employerSettings.contactPhonePlaceholder')}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label htmlFor="website" className="form-label fw-semibold">{t('employerSettings.website')}</label>
                                            <input
                                                type="url"
                                                className="form-control"
                                                id="website"
                                                value={settings.website}
                                                onChange={(e) => handleSettingChange('website', e.target.value)}
                                                placeholder={t('employerSettings.websitePlaceholder')}
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label htmlFor="address" className="form-label fw-semibold">{t('employerSettings.address')}</label>
                                            <textarea
                                                className="form-control"
                                                id="address"
                                                rows="3"
                                                value={settings.address}
                                                onChange={(e) => handleSettingChange('address', e.target.value)}
                                                placeholder={t('employerSettings.addressPlaceholder')}
                                            ></textarea>
                                        </div>
                                        <div className="col-12">
                                            <label htmlFor="companyDescription" className="form-label fw-semibold">{t('employerSettings.employerDescription')}</label>
                                            <textarea
                                                className="form-control"
                                                id="companyDescription"
                                                rows="4"
                                                value={settings.companyDescription}
                                                onChange={(e) => handleSettingChange('companyDescription', e.target.value)}
                                                placeholder={t('employerSettings.employerDescriptionPlaceholder')}
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notification Preferences */}
                            <div className="card mb-4 shadow-sm border-0 rounded-4">
                                <div className="card-header bg-white border-bottom-0 pt-4 px-4">
                                    <h5 className="fw-bold mb-0" style={{ color: indigoColor }}>
                                        <i className="bi bi-bell me-2"></i>{t('employerSettings.notificationPreferences')}
                                    </h5>
                                </div>
                                <div className="card-body p-4">
                                    <div className="row g-3">
                                        <div className="col-12">
                                            <div className="form-check form-switch">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="newApplications"
                                                    checked={settings.notifications.newApplications}
                                                    onChange={(e) => handleSettingChange('notifications.newApplications', e.target.checked)}
                                                />
                                                <label className="form-check-label fw-semibold" htmlFor="newApplications">
                                                    {t('employerSettings.newJobApplications')}
                                                </label>
                                                <small className="form-text text-muted d-block">
                                                    {t('employerSettings.newJobApplicationsHint')}
                                                </small>
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <div className="form-check form-switch">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="applicationUpdates"
                                                    checked={settings.notifications.applicationUpdates}
                                                    onChange={(e) => handleSettingChange('notifications.applicationUpdates', e.target.checked)}
                                                />
                                                <label className="form-check-label fw-semibold" htmlFor="applicationUpdates">
                                                    {t('employerSettings.applicationStatusUpdates')}
                                                </label>
                                                <small className="form-text text-muted d-block">
                                                    {t('employerSettings.applicationStatusUpdatesHint')}
                                                </small>
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <div className="form-check form-switch">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="weeklyReports"
                                                    checked={settings.notifications.weeklyReports}
                                                    onChange={(e) => handleSettingChange('notifications.weeklyReports', e.target.checked)}
                                                />
                                                <label className="form-check-label fw-semibold" htmlFor="weeklyReports">
                                                    {t('employerSettings.weeklyReports')}
                                                </label>
                                                <small className="form-text text-muted d-block">
                                                    {t('employerSettings.weeklyReportsHint')}
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Save Button */}
                            <div className="d-flex justify-content-end">
                                <button
                                    type="submit"
                                    className="btn text-white rounded-pill px-5 fw-bold shadow-sm"
                                    style={{ backgroundColor: indigoColor, borderColor: indigoColor }}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            {t('employerSettings.saving')}
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-circle me-2"></i> {t('employerSettings.saveSettings')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Sidebar Info */}
                    <div className="col-lg-4">
                        <div className="card shadow-sm border-0 rounded-4">
                            <div className="card-body p-4">
                                <h6 className="fw-bold mb-3" style={{ color: indigoColor }}>
                                    <i className="bi bi-info-circle me-2"></i>{t('employerSettings.helpTips')}
                                </h6>
                                <ul className="list-unstyled small mb-0">
                                    <li className="mb-2">
                                        <i className="bi bi-check-circle text-success me-2"></i>
                                        {t('employerSettings.tip1')}
                                    </li>
                                    <li className="mb-2">
                                        <i className="bi bi-check-circle text-success me-2"></i>
                                        {t('employerSettings.tip2')}
                                    </li>
                                    <li className="mb-2">
                                        <i className="bi bi-check-circle text-success me-2"></i>
                                        {t('employerSettings.tip3')}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployerSettings;
