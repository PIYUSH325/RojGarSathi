import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SearchBar = () => {
    const { t } = useTranslation();
    // Define the indigo-600 background and text styling
    const indigoColor = '#4f46e5'; // Tailwind indigo-600
    const heroStyle = {
        padding: '120px 0', // Increased padding for a grander feel
        color: 'white',
        minHeight: '450px', // Ensure a good minimum height
        position: 'relative',
        overflow: 'hidden',
    };

    // State for image slideshow
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [shuffledImages, setShuffledImages] = useState([]);

    // Array of background images featuring Indian workers and laborers
    const backgroundImages = [
        'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&h=600&fit=crop', // Indian plumber working
        'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=1200&h=600&fit=crop', // Construction laborers
        'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=1200&h=600&fit=crop', // Electrician/plumber
        'https://images.unsplash.com/photo-1503387837-b154d5074bd2?w=1200&h=600&fit=crop', // Construction workers
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=600&fit=crop', // Delivery driver
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1200&h=600&fit=crop', // Cleaning service worker
        'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=1200&h=600&fit=crop', // Security guard
        'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200&h=600&fit=crop', // Warehouse worker
        'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=600&fit=crop', // Construction team
        'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1200&h=600&fit=crop', // Indian construction worker
        'https://images.unsplash.com/photo-1598300042200-8e8e543b6e5c?w=1200&h=600&fit=crop', // Plumber technician
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=600&fit=crop', // Delivery person
        'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&h=600&fit=crop', // Construction site workers
        'https://images.unsplash.com/photo-1605379399642-870262d3d051?w=1200&h=600&fit=crop', // Indian factory workers
        'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1200&h=600&fit=crop', // Indian laborers working
    ];

    // Shuffle function
    const shuffleArray = (array) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], [shuffled[j]]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    // Initialize shuffled images on component mount
    useEffect(() => {
        setShuffledImages(shuffleArray(backgroundImages));
    }, []); // shuffleArray is stable

    // Auto-slide effect with reshuffling every cycle - start immediately
    useEffect(() => {
        if (shuffledImages.length === 0) return;

        const interval = setInterval(() => {
            setCurrentImageIndex((prevIndex) => {
                const nextIndex = prevIndex + 1;
                if (nextIndex >= shuffledImages.length) {
                    // Reshuffle when reaching the end and start over
                    setShuffledImages(shuffleArray(backgroundImages));
                    return 0;
                }
                return nextIndex;
            });
        }, 2000); // Change image every 2 seconds for faster slideshow

        return () => clearInterval(interval);
    }, [shuffledImages.length]); // Fixed exhaustive-deps
    
    // State to manage search inputs (for demonstration)
    const [keyword, setKeyword] = useState('');
    const [category, setCategory] = useState('');
    const [location, setLocation] = useState('');
    
    // Popular job categories for quick search links
    const popularCategories = [
        { name: t('searchBar.categories.driver'), icon: 'bi-truck' },
        { name: t('searchBar.categories.cleaner'), icon: 'bi-broom' },
        { name: t('searchBar.categories.security'), icon: 'bi-shield-lock' },
        { name: t('searchBar.categories.sales'), icon: 'bi-tag' },
        { name: t('searchBar.categories.delivery'), icon: 'bi-box' },
    ];
    
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        // Navigate to jobs page with search parameters
        const searchParams = new URLSearchParams();
        if (keyword) searchParams.append('keyword', keyword);
        if (category) searchParams.append('category', category);
        if (location) searchParams.append('city', location);
        window.location.href = `/jobs?${searchParams.toString()}`;
    };

    const handleNearMe = () => {
        // Here you would implement geolocation logic
        alert(t('searchBar.fetchingNearMe'));
        // Example: navigator.geolocation.getCurrentPosition(position => console.log(position));
    };

    return (
        <div style={heroStyle} className="text-center shadow-lg">
            {/* Background Image Slideshow */}
            {shuffledImages.map((image, index) => (
                <div
                    key={index}
                    className="hero-background-slideshow"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundImage: `url(${image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        zIndex: 0,
                        opacity: index === currentImageIndex ? 1 : 0,
                        transition: 'opacity 1s ease-in-out',
                    }}
                ></div>
            ))}

            {/* Overlay for better text readability */}
            <div
                className="hero-overlay"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(79, 70, 229, 0.7)', // Indigo overlay with transparency
                    zIndex: 1,
                }}
            ></div>

            <div className="container position-relative z-1">
                {/* --- Hero Text --- */}
                <h1 className="display-3 fw-bolder mb-3">
                    {t('searchBar.heroTitlePrefix')} <span className="text-warning">{t('searchBar.heroTitleHighlight')}</span>
                </h1>
                <p className="lead fw-light mb-5 px-lg-5">
                    {t('searchBar.heroSubtitle')}
                </p>
                
                {/* --- Search Form --- */}
                <form onSubmit={handleSearchSubmit} className="row justify-content-center">
                    <div className="col-xl-9 col-lg-10">
                        <div className="input-group input-group-lg bg-white rounded-4 shadow-lg p-2 border-0">
                            
                            {/* Search Keyword */}
                            <span className="input-group-text bg-transparent border-0 text-muted d-none d-sm-flex">
                                <i className="bi bi-search fs-5"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control border-0 bg-transparent"
                                placeholder={t('searchBar.keywordPlaceholder')}
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                            />
                            
                            {/* Location Separator */}
                            <span className="input-group-text bg-transparent border-start border-end d-none d-lg-flex text-muted">
                                <i className="bi bi-geo-alt fs-5"></i>
                            </span>

                            {/* Category Input */}
                            <select
                                className="form-control border-0 bg-transparent"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                style={{ flex: '0 0 120px' }}
                            >
                                <option value="">{t('searchBar.categoryPlaceholder')}</option>
                                <option value="Driver">{t('searchBar.categories.driver')}</option>
                                <option value="Cleaner">{t('searchBar.categories.cleaner')}</option>
                                <option value="Security">{t('searchBar.categories.security')}</option>
                                <option value="Sales">{t('searchBar.categories.sales')}</option>
                                <option value="Delivery">{t('searchBar.categories.delivery')}</option>
                                <option value="Construction">{t('searchBar.categories.construction')}</option>
                                <option value="Manufacturing">{t('searchBar.categories.manufacturing')}</option>
                                <option value="Retail">{t('searchBar.categories.retail')}</option>
                                <option value="Logistics">{t('searchBar.categories.logistics')}</option>
                            </select>

                            {/* Location Separator */}
                            <span className="input-group-text bg-transparent border-start border-end d-none d-lg-flex text-muted">
                                <i className="bi bi-geo-alt fs-5"></i>
                            </span>

                            {/* Location Input */}
                            <input
                                type="text"
                                className="form-control border-0 bg-transparent"
                                placeholder={t('searchBar.locationPlaceholder')}
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                style={{ flex: '0 0 160px' }} // Fixed width for consistent look
                            />
                            
                            {/* Action Buttons */}
                            <button className="btn btn-primary text-white fw-bold px-4 rounded-4 me-2" 
                                    type="submit" 
                                    style={{ backgroundColor: indigoColor, borderColor: indigoColor }}>
                                {t('searchBar.search')}
                            </button>
                            
                            <button className="btn btn-warning text-dark fw-bold px-4 rounded-4" 
                                    type="button"
                                    onClick={handleNearMe}>
                                <i className="bi bi-pin-map-fill me-1"></i> {t('searchBar.nearMe')}
                            </button>
                        </div>
                    </div>
                </form>

                {/* --- Popular Categories --- */}
                <div className="mt-4 pt-4">
                    <span className="fw-semibold me-3 d-block d-md-inline-block mb-2 mb-md-0">{t('searchBar.popularSearches')}</span>
                    {popularCategories.map((item) => (
                        <Link
                            key={item.name}
                            to={`/jobs?keyword=${item.name}`}
                            className="btn btn-sm btn-outline-light rounded-pill fw-semibold me-2 mb-2 hero-link"
                        >
                            <i className={`bi ${item.icon} me-1`}></i> {item.name}
                        </Link>
                    ))}
                </div>
            </div>
            
            {/* --- Decorative Element (Subtle Background Pattern) --- */}
            <div className="hero-decoration-wave"></div>

            {/* --- Custom CSS for Animation and Styling --- */}
            <style>{`
                .hero-background-slideshow {
                    transition: background-image 1s ease-in-out;
                }
                .hero-decoration-wave {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: 50%;
                    background: linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.0) 100%);
                    clip-path: ellipse(120% 60% at 50% 100%);
                    z-index: 2;
                }
                .hero-link:hover {
                    background-color: white;
                    color: ${indigoColor} !important;
                }
                /* Use !important for background/border to override default bootstrap primary styling on button */
                .btn-warning {
                    --bs-btn-bg: #facc15; /* Tailwind Amber 400 */
                    --bs-btn-border-color: #facc15;
                }
            `}</style>
        </div>
    );
};

export default SearchBar;