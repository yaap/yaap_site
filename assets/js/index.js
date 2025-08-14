document.addEventListener('DOMContentLoaded', function () {
    const carousel = document.querySelector('.screenshot-carousel');
    const slides = carousel.querySelectorAll('.screenshot-slide');
    const leftBtn = carousel.querySelector('.carousel-arrow.left');
    const rightBtn = carousel.querySelector('.carousel-arrow.right');
    let current = 0;

    function showSlide(idx) {
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === idx);
        });
    }

    // Initial
    showSlide(current);

    // Navigation
    function nextSlide() {
        current = (current + 1) % slides.length;
        showSlide(current);
    }
    function prevSlide() {
        current = (current - 1 + slides.length) % slides.length;
        showSlide(current);
    }

    rightBtn.addEventListener('click', nextSlide);
    leftBtn.addEventListener('click', prevSlide);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') prevSlide();
        else if (e.key === 'ArrowRight') nextSlide();
    });

    // Swipe Support — listen on carousel container
    let startX = 0, startY = 0, isMoving = false;
    carousel.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) return; // ignore multi-touch
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isMoving = true;
    });
    carousel.addEventListener('touchend', (e) => {
        if (!isMoving) return;
        let endX = e.changedTouches[0].clientX;
        let diffX = startX - endX;
        let diffY = Math.abs(startY - e.changedTouches[0].clientY);
        if (Math.abs(diffX) > 50 && diffY < 50) {
            if (diffX > 0) nextSlide();
            else prevSlide();
        }
        isMoving = false;
    });

    // Zoom on click
    carousel.addEventListener('click', (e) => {
        const slide = e.target.closest('.screenshot-slide');
        if (!slide) return;

        const overlay = document.createElement('div');
        overlay.className = 'zoom-overlay';

        const img = slide.querySelector('img').cloneNode(true);
        img.className = 'zoom-image';
        overlay.appendChild(img);
        document.body.appendChild(overlay);

        // Close on click
        overlay.addEventListener('click', () => overlay.remove());

        // Pinch-to-zoom
        let initialDistance = 0;
        let currentScale = 1;
        overlay.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                initialDistance = getDistance(e.touches[0], e.touches[1]);
            }
        });
        overlay.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                let newDistance = getDistance(e.touches[0], e.touches[1]);
                let scaleChange = newDistance / initialDistance;
                currentScale = Math.min(Math.max(1, scaleChange), 3);
                img.style.transform = `scale(${currentScale})`;
            }
        });

        function getDistance(t1, t2) {
            let dx = t1.clientX - t2.clientX;
            let dy = t1.clientY - t2.clientY;
            return Math.sqrt(dx * dx + dy * dy);
        }
    });
});