import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Testimonials = ({ testimonials }) => {
    const { t } = useTranslation();

    const normalizeKey = (value = '') =>
        String(value)
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_');

    const localizeRole = (role) => {
        if (!role) return role;
        const normalized = normalizeKey(role);
        return t(`testimonials.dynamic.roles.${normalized}`, { defaultValue: role });
    };

    const localizeQuote = (quote) => {
        if (!quote) return quote;
        const normalized = normalizeKey(quote).slice(0, 80);
        return t(`testimonials.dynamic.quotes.${normalized}`, { defaultValue: quote });
    };
    // Use the passed testimonials prop, or fallback to static ones if not provided
    const displayTestimonials = testimonials || [
        {
            quote: "RojgarSathi helped me find construction work near my home. The daily wage fixing is a lifesaver! I started earning within two days of applying.",
            author: "Ganesh Singh",
            location: "Bengaluru",
            role: "Construction Worker",
            rating: 5,
            icon: "bi-hammer"
        },
        {
            quote: "I found a job as a domestic helper through this app. Now I have a fixed income to support my family. Very secure and trustworthy.",
            author: "Pooja Devi",
            location: "Mumbai",
            role: "Domestic Helper",
            rating: 5,
            icon: "bi-house-heart"
        },
        {
            quote: "Posting jobs here is so easy! I filled my five security guard vacancies in one week. Great reach to local, reliable staff.",
            author: "Rajesh Kumar",
            location: "Delhi",
            role: "Employer - Security Agency Owner",
            rating: 4,
            icon: "bi-shield-check"
        },
    ];

    // Helper function to render star ratings
    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <i 
                    key={i} 
                    className={`bi ${i <= rating ? 'bi-star-fill text-warning' : 'bi-star text-muted-300'}`} 
                    style={{ fontSize: '1rem', margin: '0 1px' }}
                ></i>
            );
        }
        return <div className="d-flex mb-3 justify-content-center justify-content-md-start">{stars}</div>;
    };

    // Define the purple color to match the PostTestimonial component's style
    const purpleColor = '#9333ea'; 

    return (
        <div className="container py-5 bg-light">
            <div className="text-center mb-5">
                <h2 className="display-6 fw-bold text-dark mb-2">{t('testimonials.sectionTitle')}</h2>
                <p className="lead text-muted">{t('testimonials.sectionSubtitle')}</p>
            </div>

            {/* --- Testimonial Cards --- */}
            <div className="row justify-content-center g-4">
                {displayTestimonials.map((item, index) => (
                    <div className="col-lg-4 col-md-6" key={index}>
                        <div 
                            className="card h-100 p-4 shadow-lg border-0 rounded-4 testimonial-card-hover" 
                            style={{ borderTop: `5px solid ${purpleColor}` }} // Subtle color accent
                        >
                            <div className="card-body d-flex flex-column">
                                
                                {/* Rating */}
                                {renderStars(item.rating)}

                                {/* Quote Content */}
                                <blockquote className="blockquote flex-grow-1">
                                    <i className="bi bi-quote fs-4 me-2" style={{ color: purpleColor }}></i>
                                    <p className="fst-italic text-dark mb-4 lh-base">
                                        {localizeQuote(item.message || item.quote)}
                                    </p>
                                </blockquote>

                                {/* Author Footer */}
                                <footer className="blockquote-footer border-top pt-3 mt-auto d-flex align-items-center">
                                    <div 
                                        className="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center me-3 flex-shrink-0"
                                        style={{ width: '40px', height: '40px' }}
                                    >
                                        <i className={`bi ${item.icon || 'bi-person-fill'}`}></i>
                                    </div>
                                    <div>
                                        <div className='fw-bold text-dark mb-0'>{item.name || item.author}</div>
                                        <cite className="text-muted small d-block" title={item.location}>{localizeRole(item.role)} ({item.location})</cite>
                                    </div>
                                </footer>

                            </div>
                        </div>
                    </div>
                ))}
            </div>
            

            
            {/* --- Custom Styles --- */}
            <style>{`
                .testimonial-card-hover:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.1) !important;
                    transition: all 0.3s ease;
                }
                .testimonial-card-hover {
                    transition: all 0.3s ease;
                }
                .text-muted-300 {
                    color: #ced4da;
                }
                .btn:hover {
                    background-color: #a855f7 !important; /* Lighter purple on hover */
                    border-color: #a855f7 !important;
                }
            `}</style>
        </div>
    );
};

export default Testimonials;
