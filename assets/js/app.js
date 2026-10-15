document.addEventListener('DOMContentLoaded', function () { // Mobile Navigation Toggle
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function () {
            navMenu.classList.toggle('nav__menu--active');
            navToggle.classList.toggle('nav__toggle--active');
        });

        // Close mobile menu when clicking on a nav link
        const navLinks = document.querySelectorAll('.nav__link');
        navLinks.forEach(link => {
            link.addEventListener('click', function () {
                navMenu.classList.remove('nav__menu--active');
                navToggle.classList.remove('nav__toggle--active');
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function (event) {
            if (! navToggle.contains(event.target) && ! navMenu.contains(event.target)) {
                navMenu.classList.remove('nav__menu--active');
                navToggle.classList.remove('nav__toggle--active');
            }
        });
    }

    // Device Filtering
    const filterButtons = document.querySelectorAll('.filter-btn');
    const deviceBrands = document.querySelectorAll('.device-brand');

    filterButtons.forEach(button => {
        button.addEventListener('click', function () {
            const targetBrand = this.getAttribute('data-brand');

            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('filter-btn--active'));
            this.classList.add('filter-btn--active');

            // Filter devices
            deviceBrands.forEach(brand => {
                const brandName = brand.getAttribute('data-brand');
                if (targetBrand === 'all' || brandName === targetBrand) {
                    brand.classList.remove('hidden');
                    // Add fade-in animation
                    brand.style.opacity = '0';
                    brand.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        brand.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                        brand.style.opacity = '1';
                        brand.style.transform = 'translateY(0)';
                    }, 50);
                } else {
                    brand.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    brand.style.opacity = '0';
                    brand.style.transform = 'translateY(-20px)';
                    setTimeout(() => {
                        brand.classList.add('hidden');
                        brand.style.transform = 'translateY(20px)';
                    }, 300);
                }
            });
        });
    });

    // Smooth Scrolling for Navigation Links
    const navigationLinks = document.querySelectorAll('a[href*="#"]');
    navigationLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            const hashIndex = href.indexOf('#');
            if (hashIndex === -1) return;
            const path = href.slice(0, hashIndex);
            // only intercept links to this same page's sections, not other pages
            if (path && path !== '/' && path !== window.location.pathname) return;

            const targetId = href.slice(hashIndex);
            let targetSection;

            // Handle home link specifically
            if (targetId === '#home') {
                targetSection = document.querySelector('.hero');
            } else {
                targetSection = document.querySelector(targetId);
            }

            if (targetSection) {
                e.preventDefault();
                const headerHeight = document.querySelector('.header').offsetHeight;
                let targetPosition;

                // For home/hero section, scroll to very top
                if (targetId === '#home') {
                    targetPosition = 0;
                } else {
                    targetPosition = targetSection.offsetTop - headerHeight - 20;
                }

                window.scrollTo({top: targetPosition, behavior: 'smooth'});
            }
        });
    });

    // Header background once the page has scrolled past the hero
    const header = document.querySelector('.header');

    window.addEventListener('scroll', function () {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        header.classList.toggle('header--scrolled', scrollTop > 50);
    });

    // Fade in grid items as they enter the viewport
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = Array.from(entry.target.parentNode.children).indexOf(entry.target) * 80;
                entry.target.style.transitionDelay = delay + 'ms';
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.community-card, .contribute-card').forEach(element => {
        observer.observe(element);
    });

    // Fade in each section as a whole while scrolling down the page.
    // Targets the static section wrapper, not content that fills in
    // later from an API fetch (device list, team cards) - that content
    // doesn't exist yet when this runs, so observing it directly would
    // never fire.
    const sectionObserver = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                sectionObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('section:not(.hero), .device-page').forEach(element => {
        element.classList.add('fade-in-section');
        sectionObserver.observe(element);
    });

    // Add loading animation for external links
    const externalLinks = document.querySelectorAll('a[target="_blank"]');
    externalLinks.forEach(link => {
        link.addEventListener('click', function (e) { // Add loading state
            const originalText = this.textContent;
            this.style.opacity = '0.7';
            this.style.pointerEvents = 'none';
            // Reset after short delay
            setTimeout(() => {
                this.style.opacity = '1';
                this.style.pointerEvents = 'auto';
            }, 1000);
        });
    });

    // Keyboard navigation support
    document.addEventListener('keydown', function (e) { // ESC key closes mobile menu
        if (e.key === 'Escape') {
            navMenu.classList.remove('nav__menu--active');
            navToggle.classList.remove('nav__toggle--active');
        }

        // Enter or Space on filter buttons
        if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('filter-btn')) {
            e.preventDefault();
            e.target.click();
        }
    });

    // Add focus trap for mobile menu
    const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    function trapFocus(element) {
        const focusableContent = element.querySelectorAll(focusableElements);
        const firstFocusableElement = focusableContent[0];
        const lastFocusableElement = focusableContent[focusableContent.length - 1];

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusableElement) {
                        lastFocusableElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastFocusableElement) {
                        firstFocusableElement.focus();
                        e.preventDefault();
                    }
                }
            }
        });
    }

    // Apply focus trap when mobile menu is active
    navToggle.addEventListener('click', function () {
        if (navMenu.classList.contains('nav__menu--active')) {
            trapFocus(navMenu);
        }
    });

    // Performance optimization: Debounce scroll events
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Apply debounced scroll handler
    const debouncedScrollHandler = debounce(function () { // Any scroll-heavy operations can go here
    }, 16);

    window.addEventListener('scroll', debouncedScrollHandler);

    // // GitHub Stars Live Counter
    // const githubStarsElement = document.querySelector('.stat-card__number[data-stat="github-stars"]');

    // if (githubStarsElement) { // Show loading state
    //     githubStarsElement.textContent = '...';

    //     fetch('https://yaaprom-device-info.idoybh2.workers.dev.com/repos/yaap/manifest').then(response => response.json()).then(data => {
    //         if (data && data.stargazers_count !== undefined) {
    //             githubStarsElement.textContent = data.stargazers_count;
    //         } else {
    //             githubStarsElement.textContent = '23'; // fallback
    //         }
    //     }).catch(() => {
    //         githubStarsElement.textContent = '23'; // fallback
    //     });
    // }

    console.log('Yay! YAAP website loaded successfully!');

});
