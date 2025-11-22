// MBT Landing Page JavaScript

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
    setupSmoothScrolling();
    setupAnimations();
    loadLiveData();
});

// Initialize composition chart
function initializeCharts() {
    const ctx = document.getElementById('compositionChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Gold (BGT)', 'Silver (BST)', 'Platinum (BPT)'],
            datasets: [{
                data: [50, 30, 20],
                backgroundColor: [
                    '#ffd700',  // Gold
                    '#c0c0c0',  // Silver
                    '#e5e4e2'   // Platinum
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed + '%';
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

// Setup smooth scrolling
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Setup scroll animations
function setupAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.feature-card, .step-card, .price-card, .pricing-card').forEach(el => {
        observer.observe(el);
    });
}

// Start investment flow
function startInvestment() {
    // Check if user is logged in
    const token = localStorage.getItem('mbt_token');
    if (!token) {
        // Redirect to login/signup
        window.location.href = 'dashboard.html#login';
        return;
    }
    
    // Open investment modal or redirect to trading page
    window.location.href = 'dashboard.html#invest';
}

// Start SIP with specific amount
function startSIP(amount) {
    const token = localStorage.getItem('mbt_token');
    if (!token) {
        window.location.href = 'dashboard.html#login';
        return;
    }
    
    // Store SIP amount in localStorage and redirect to dashboard
    localStorage.setItem('mbt_sip_amount', amount);
    window.location.href = 'dashboard.html#sip';
}

// Scroll to section
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Load live market data
async function loadLiveData() {
    try {
        // Simulate API call for live data
        const response = await fetch('/api/mbt/nav');
        const data = await response.json();
        
        if (data.success) {
            updateMarketData(data.data.nav);
        }
    } catch (error) {
        console.log('Using simulated market data');
        // Use default values if API is not available
        updateMarketData(5847);
    }
}

// Update market data display
function updateMarketData(nav) {
    const navElement = document.querySelector('.price-card.bg-primary .price');
    if (navElement) {
        navElement.textContent = `₹${nav.toLocaleString()}`;
    }
}

// Simulate live price updates
function startPriceUpdates() {
    setInterval(() => {
        // Simulate small price movements
        const navElement = document.querySelector('.price-card.bg-primary .price');
        if (navElement) {
            const currentNav = parseFloat(navElement.textContent.replace(/[₹,]/g, ''));
            const change = (Math.random() - 0.5) * 50; // ±25 change
            const newNav = Math.max(currentNav + change, 5000); // Minimum floor
            
            navElement.textContent = `₹${Math.round(newNav).toLocaleString()}`;
            
            // Update change indicator
            const changeElement = document.querySelector('.price-card.bg-primary .change');
            if (changeElement) {
                const changePercent = ((newNav - currentNav) / currentNav * 100).toFixed(2);
                changeElement.textContent = `${changePercent > 0 ? '+' : ''}${changePercent}%`;
                changeElement.className = `change ${changePercent > 0 ? 'positive' : 'negative'}`;
            }
        }
        
        // Update individual metal prices
        updateMetalPrice('BGT', 5800, 100);   // Gold
        updateMetalPrice('BST', 75, 2);       // Silver
        updateMetalPrice('BPT', 3200, 80);    // Platinum
        
    }, 5000); // Update every 5 seconds
}

// Update individual metal prices
function updateMetalPrice(symbol, basePrice, volatility) {
    const priceElement = document.querySelector(`h5:contains('${symbol}')`).closest('.price-card').querySelector('.price');
    if (priceElement) {
        const change = (Math.random() - 0.5) * volatility;
        const newPrice = Math.max(basePrice + change, basePrice * 0.95); // 5% floor
        
        priceElement.textContent = `₹${Math.round(newPrice)}/g`;
        
        // Update change indicator
        const changeElement = priceElement.parentNode.querySelector('.change');
        const changePercent = ((newPrice - basePrice) / basePrice * 100).toFixed(2);
        changeElement.textContent = `${changePercent > 0 ? '+' : ''}${changePercent}%`;
        changeElement.className = `change ${changePercent > 0 ? 'positive' : 'negative'}`;
    }
}

// Start price updates when page loads
startPriceUpdates();

// Newsletter signup
function subscribeNewsletter() {
    const email = document.getElementById('newsletter-email').value;
    if (!email || !isValidEmail(email)) {
        alert('Please enter a valid email address');
        return;
    }
    
    // Simulate newsletter subscription
    alert('Thank you for subscribing to our newsletter!');
    document.getElementById('newsletter-email').value = '';
}

// Email validation
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Contact form submission
function submitContactForm() {
    const formData = {
        name: document.getElementById('contact-name').value,
        email: document.getElementById('contact-email').value,
        message: document.getElementById('contact-message').value
    };
    
    if (!formData.name || !formData.email || !formData.message) {
        alert('Please fill in all fields');
        return;
    }
    
    if (!isValidEmail(formData.email)) {
        alert('Please enter a valid email address');
        return;
    }
    
    // Simulate form submission
    alert('Thank you for your message. We will get back to you soon!');
    document.getElementById('contact-form').reset();
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

function formatPercentage(value) {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

// Share functionality
function sharePlatform() {
    if (navigator.share) {
        navigator.share({
            title: 'MBT - Metal Basket Tokens',
            text: 'Invest in diversified precious metals with automated rebalancing',
            url: window.location.href
        });
    } else {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert('Link copied to clipboard!');
        });
    }
}

// Analytics tracking (placeholder)
function trackEvent(eventName, properties = {}) {
    // In production, this would send data to analytics service
    console.log('Event tracked:', eventName, properties);
}

// Track page views
trackEvent('page_view', {
    page: 'landing',
    timestamp: new Date().toISOString()
});

// Add event listeners for tracking
document.addEventListener('click', function(e) {
    if (e.target.matches('[onclick*="start"]')) {
        trackEvent('cta_click', {
            action: e.target.textContent.trim(),
            location: 'landing_page'
        });
    }
});

// Preload critical resources
function preloadResources() {
    const criticalImages = [
        // Add any critical image URLs here
    ];
    
    criticalImages.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
    });
}

// Initialize preloading
preloadResources();

// Add loading state management
window.addEventListener('load', function() {
    document.body.classList.add('loaded');
    
    // Hide loading spinner if exists
    const loader = document.querySelector('.loader');
    if (loader) {
        loader.style.display = 'none';
    }
});

// Error handling
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
    // In production, send to error tracking service
});

// Performance monitoring
if ('performance' in window) {
    window.addEventListener('load', function() {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
        }, 0);
    });
}