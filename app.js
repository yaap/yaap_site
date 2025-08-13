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
    const navigationLinks = document.querySelectorAll('a[href^="#"]');
    navigationLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            let targetSection;

            // Handle home link specifically
            if (targetId === '#home') {
                targetSection = document.querySelector('.hero');
            } else {
                targetSection = document.querySelector(targetId);
            }

            if (targetSection) {
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

    // Header Background on Scroll
    const header = document.querySelector('.header');
    let lastScrollTop = 0;

    window.addEventListener('scroll', function () {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Add/remove background opacity based on scroll
        if (scrollTop > 50) {
            header.style.background = 'rgba(19, 52, 59, 0.98)';
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.background = 'rgba(19, 52, 59, 0.95)';
            header.style.boxShadow = 'none';
        }

        // Hide/show header on scroll (optional enhancement)
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        } lastScrollTop = scrollTop;
    });

    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';

                // Add staggered animation for grid items
                if (entry.target.classList.contains('feature-card') || entry.target.classList.contains('device-brand') || entry.target.classList.contains('community-card')) {
                    const delay = Array.from(entry.target.parentNode.children).indexOf(entry.target) * 100;
                    entry.target.style.transitionDelay = delay + 'ms';
                }
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.feature-card, .device-brand, .community-card, .contribute-card, .stat-card');
    animateElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });

    // Button ripple effect
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function (e) { // Create ripple element
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.cssText = `
position: absolute;
width: ${size}px;
height: ${size}px;
left: ${x}px;
top: ${y}px;
background: rgba(255, 255, 255, 0.3);
border-radius: 50%;
transform: scale(0);
animation: ripple 0.6s ease-out;
pointer-events: none;
`;

            // Add ripple to button
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);

            // Remove ripple after animation
            setTimeout(() => {
                if (ripple.parentNode) {
                    ripple.parentNode.removeChild(ripple);
                }
            }, 600);
        });
    });

    // Add ripple animation keyframes
    const style = document.createElement('style');
    style.textContent = `
@keyframes ripple {
to {
transform: scale(2);
opacity: 0;
}
}
`;
    document.head.appendChild(style);

    // Hero stats counter animation - Fixed to handle K+ format
    const statNumbers = document.querySelectorAll('.stat-card__number');

    const animateCounter = (element, targetText, duration = 2000) => {
        let targetNumber;
        let suffix = '';

        // Parse different formats
        if (targetText.includes('K+')) {
            targetNumber = parseInt(targetText.replace(/\D/g, '')) * 1000;
            suffix = 'K+';
        } else if (targetText.includes('+')) {
            targetNumber = parseInt(targetText.replace(/\D/g, ''));
            suffix = '+';
        } else {
            targetNumber = parseInt(targetText.replace(/\D/g, ''));
        }

        // If we couldn't parse a number, just set the original text
        if (isNaN(targetNumber)) {
            element.textContent = targetText;
            return;
        }

        const start = 0;
        const increment = targetNumber / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if (current >= targetNumber) { // Set final value based on format
                if (suffix === 'K+') {
                    element.textContent = Math.floor(targetNumber / 1000) + 'K+';
                } else {
                    element.textContent = targetNumber + suffix;
                }
                clearInterval(timer);
            } else { // Update current value based on format
                if (suffix === 'K+') {
                    const displayNumber = Math.floor(current / 1000);
                    element.textContent = displayNumber + 'K+';
                } else {
                    element.textContent = Math.floor(current) + suffix;
                }
            }
        }, 16);
    };

    // Trigger counter animation when hero section is visible
    const heroObserver = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                statNumbers.forEach(stat => {
                    const targetText = stat.textContent;
                    // Set initial value based on format
                    if (targetText.includes('K+')) {
                        stat.textContent = '0K+';
                    } else if (targetText.includes('+')) {
                        stat.textContent = '0+';
                    } else {
                        stat.textContent = '0';
                    }

                    setTimeout(() => {
                        animateCounter(stat, targetText, 1500);
                    }, 500);
                });
                heroObserver.unobserve(entry.target);
            }
        });
    }, {threshold: 0.5});

    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        heroObserver.observe(heroSection);
    }

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

    //     fetch('https://api.github.com/repos/yaap/manifest').then(response => response.json()).then(data => {
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

document.addEventListener('DOMContentLoaded', function() {
  
  function forceReadableText() {
    // Find all dark containers
    const darkContainers = document.querySelectorAll('div, section');
    
    darkContainers.forEach(container => {
      const bgColor = window.getComputedStyle(container).backgroundColor;
      const isDark = bgColor.includes('38, 40, 40') || bgColor.includes('31, 33, 33') || bgColor.includes('19, 52, 59');
      
      if (isDark || container.style.backgroundColor.includes('rgb(38, 40, 40)')) {
        // Force all text elements to be light
        const allTextElements = container.querySelectorAll('p, span, div, li, td, th, label, small');
        allTextElements.forEach(el => {
          el.style.color = '#f5f5f5';
          el.style.setProperty('color', '#f5f5f5', 'important');
        });
        
        // Headers to teal
        const headers = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headers.forEach(h => {
          h.style.color = '#32b8c5';
          h.style.setProperty('color', '#32b8c5', 'important');
        });
        
        // Links to teal
        const links = container.querySelectorAll('a');
        links.forEach(a => {
          a.style.color = '#32b8c5';
          a.style.setProperty('color', '#32b8c5', 'important');
        });
      }
    });
  }
  
  forceReadableText();
  setInterval(forceReadableText, 100);
});
