import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const ContactModal = ({ isOpen, onClose, contact, onSave, loading }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        status: 'unread',
        adminReply: ''
    });

    useEffect(() => {
        if (contact) {
            setFormData({
                status: contact.status || 'unread',
                adminReply: contact.adminReply || ''
            });
        } else {
            setFormData({
                status: 'unread',
                adminReply: ''
            });
        }
    }, [contact, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{t('admin.contactModal.title')}</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            {contact && (
                                <>
                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">{t('admin.common.name')}</label>
                                            <p className="mb-0">{contact.name}</p>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">{t('admin.common.email')}</label>
                                            <p className="mb-0">{contact.email}</p>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold">{t('admin.contacts.subject')}</label>
                                        <p className="mb-0">{contact.subject || t('admin.contacts.generalInquiry')}</p>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold">{t('admin.contactModal.message')}</label>
                                        <div className="border rounded p-3 bg-light">
                                            {contact.message}
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold">{t('admin.contactModal.submitted')}</label>
                                        <p className="mb-0">{new Date(contact.createdAt).toLocaleString()}</p>
                                    </div>

                                    <hr />

                                    <div className="mb-3">
                                        <label className="form-label">{t('admin.common.status')}</label>
                                        <select
                                            className="form-select"
                                            name="status"
                                            value={formData.status}
                                            onChange={handleChange}
                                        >
                                            <option value="unread">{t('admin.contactModal.statusUnread')}</option>
                                            <option value="read">{t('admin.contactModal.statusRead')}</option>
                                            <option value="replied">{t('admin.contactModal.statusReplied')}</option>
                                            <option value="closed">{t('admin.contactModal.statusClosed')}</option>
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">{t('admin.contactModal.adminReply')}</label>
                                        <textarea
                                            className="form-control"
                                            name="adminReply"
                                            value={formData.adminReply}
                                            onChange={handleChange}
                                            rows="4"
                                            placeholder={t('admin.contactModal.replyPlaceholder')}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                {t('admin.common.cancel')}
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        {t('admin.contactModal.saving')}
                                    </>
                                ) : (
                                    t('admin.contactModal.saveChanges')
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ContactModal;
