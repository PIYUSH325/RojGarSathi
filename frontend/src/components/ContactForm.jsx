import React, { useState } from 'react';
import axios from 'axios';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

const ContactForm = ({ show, handleClose }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await axios.post('http://localhost:5000/api/v1/contacts', formData);
            setSuccess(t('contactForm.success'));
            setFormData({
                name: '',
                email: '',
                subject: '',
                message: ''
            });
            // Close modal after 2 seconds
            setTimeout(() => {
                handleClose();
                setSuccess('');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.msg || t('contactForm.error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>{t('contactForm.title')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>{t('contactForm.nameLabel')}</Form.Label>
                        <Form.Control
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder={t('contactForm.namePlaceholder')}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>{t('contactForm.emailLabel')}</Form.Label>
                        <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder={t('contactForm.emailPlaceholder')}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>{t('contactForm.subjectLabel')}</Form.Label>
                        <Form.Control
                            type="text"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            required
                            placeholder={t('contactForm.subjectPlaceholder')}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>{t('contactForm.messageLabel')}</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={4}
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            required
                            placeholder={t('contactForm.messagePlaceholder')}
                        />
                    </Form.Group>

                    <div className="d-flex justify-content-end gap-2">
                        <Button variant="secondary" onClick={handleClose}>
                            {t('contactForm.cancel')}
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        role="status"
                                        aria-hidden="true"
                                        className="me-2"
                                    />
                                    {t('contactForm.sending')}
                                </>
                            ) : (
                                t('contactForm.send')
                            )}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default ContactForm;
