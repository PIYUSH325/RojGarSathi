import React, { useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import './AdminDashboard.css';
import { useTranslation } from 'react-i18next';

const AdminSettings = () => {
    const { t } = useTranslation();
    const [settings, setSettings] = useState({
        siteName: 'RojgarSathi',
        siteDescription: 'Connecting Talent with Opportunity',
        contactEmail: 'admin@rojgarsathi.com',
        maintenanceMode: false,
        allowRegistration: true,
        emailNotifications: true
    });

    const handleSettingChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSaveSettings = async () => {
        try {
            const token = localStorage.getItem('token');
            // This would typically save to backend
            console.log('Saving settings:', settings);
            alert(t('admin.settings.saved'));
        } catch (err) {
            console.error('Failed to save settings:', err);
            alert(t('admin.settings.saveFailed'));
        }
    };

    return (
        <div className="admin-dashboard">
            <AdminSidebar />
            <div className="admin-content">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="h3 mb-0">
                        <i className="bi bi-gear me-2"></i>
                        {t('admin.sidebar.siteSettings')}
                    </h1>
                    <button className="btn btn-primary" onClick={handleSaveSettings}>
                        <i className="bi bi-save me-1"></i>
                        {t('admin.settings.saveChanges')}
                    </button>
                </div>

                <div className="settings-management">
                    <h2>{t('admin.settings.generalSettings')}</h2>

                    <div className="mb-4">
                        <label className="form-label">{t('admin.settings.siteName')}</label>
                        <input
                            type="text"
                            className="form-control"
                            value={settings.siteName}
                            onChange={(e) => handleSettingChange('siteName', e.target.value)}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="form-label">{t('admin.settings.siteDescription')}</label>
                        <textarea
                            className="form-control"
                            rows="3"
                            value={settings.siteDescription}
                            onChange={(e) => handleSettingChange('siteDescription', e.target.value)}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="form-label">{t('admin.settings.contactEmail')}</label>
                        <input
                            type="email"
                            className="form-control"
                            value={settings.contactEmail}
                            onChange={(e) => handleSettingChange('contactEmail', e.target.value)}
                        />
                    </div>

                    <h2 className="mt-5">{t('admin.settings.systemSettings')}</h2>

                    <div className="form-check mb-3">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="maintenanceMode"
                            checked={settings.maintenanceMode}
                            onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="maintenanceMode">
                            {t('admin.settings.maintenanceMode')}
                        </label>
                    </div>

                    <div className="form-check mb-3">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="allowRegistration"
                            checked={settings.allowRegistration}
                            onChange={(e) => handleSettingChange('allowRegistration', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="allowRegistration">
                            {t('admin.settings.allowRegistration')}
                        </label>
                    </div>

                    <div className="form-check mb-3">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="emailNotifications"
                            checked={settings.emailNotifications}
                            onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="emailNotifications">
                            {t('admin.settings.enableEmailNotifications')}
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
