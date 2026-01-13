document.addEventListener('DOMContentLoaded', function () {
    const carousel = document.querySelector('.screenshot-carousel');
    const slides = carousel.querySelectorAll('.screenshot-slide');
    const leftBtn = carousel.querySelector('.carousel-arrow.left');
    const rightBtn = carousel.querySelector('.carousel-arrow.right');
    let current = 0;

    function showSlide(idx) {
        slides.forEach(slide => slide.classList.remove('active', 'prev', 'next'));
        slides[idx].classList.add('active');
        slides[(idx - 1 + slides.length) % slides.length].classList.add('prev');
        slides[(idx + 1) % slides.length].classList.add('next');
    }
    showSlide(current);

    function nextSlide() { current = (current + 1) % slides.length; showSlide(current); }
    function prevSlide() { current = (current - 1 + slides.length) % slides.length; showSlide(current); }

    rightBtn.addEventListener('click', nextSlide);
    leftBtn.addEventListener('click', prevSlide);

    let isZoomActive = false;
    document.addEventListener('keydown', (e) => {
        if (!isZoomActive) {
            if (e.key === 'ArrowLeft') prevSlide();
            else if (e.key === 'ArrowRight') nextSlide();
        }
    });

    let startX = 0, startY = 0, isMoving = false;
    carousel.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1 || isZoomActive) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isMoving = true;
    });

    carousel.addEventListener('touchend', (e) => {
        if (!isMoving || isZoomActive) return;
        let endX = e.changedTouches[0].clientX;
        let diffX = startX - endX;
        let diffY = Math.abs(startY - e.changedTouches[0].clientY);
        if (Math.abs(diffX) > 50 && diffY < 50) {
            if (diffX > 0) nextSlide();
            else prevSlide();
        }
        isMoving = false;
    });

    carousel.addEventListener('click', (e) => {
        const slide = e.target.closest('.screenshot-slide');
        if (!slide) return;

        const overlay = document.createElement('div');
        overlay.className = 'zoom-overlay';
        const img = slide.querySelector('img').cloneNode(true);
        img.className = 'zoom-image';
        overlay.appendChild(img);
        document.body.appendChild(overlay);

        isZoomActive = true;

        overlay.addEventListener('click', (ev) => { 
            if (ev.target === overlay) {
                overlay.remove();
                isZoomActive = false;
            }
        });

        let scale = 1, translateX = 0, translateY = 0;
        let lastX = 0, lastY = 0, isDragging = false, initialDistance = 0;
        let startSwipeX = 0, startSwipeY = 0, isSwipeDetection = false;

        function updateZoomedImage() {
            const newSlide = slides[current];
            const newImg = newSlide.querySelector('img');
            img.src = newImg.src;
            img.alt = newImg.alt;
            scale = 1;
            translateX = 0;
            translateY = 0;
            img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        }

        overlay.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                initialDistance = getDistance(e.touches[0], e.touches[1]);
                isSwipeDetection = false;
            } else if (e.touches.length === 1) {
                if (scale > 1) {
                    isDragging = true;
                    lastX = e.touches[0].clientX;
                    lastY = e.touches[0].clientY;
                } else {
                    isSwipeDetection = true;
                    startSwipeX = e.touches[0].clientX;
                    startSwipeY = e.touches[0].clientY;
                }
            }
        });

        overlay.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                let newDistance = getDistance(e.touches[0], e.touches[1]);
                scale = Math.min(Math.max(1, (newDistance / initialDistance) * scale), 3);
                img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
            } else if (e.touches.length === 1 && isDragging && scale > 1) {
                e.preventDefault();
                let deltaX = e.touches[0].clientX - lastX;
                let deltaY = e.touches[0].clientY - lastY;

                translateX += deltaX;
                translateY += deltaY;
                img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;

                lastX = e.touches[0].clientX;
                lastY = e.touches[0].clientY;
            }
        }, { passive: false });

        overlay.addEventListener('touchend', (e) => {
            if (isSwipeDetection && scale <= 1) {
                // Handle swipe navigation when not zoomed in - stay in zoom overlay
                let endSwipeX = e.changedTouches[0].clientX;
                let endSwipeY = e.changedTouches[0].clientY;
                let diffX = startSwipeX - endSwipeX;
                let diffY = Math.abs(startSwipeY - endSwipeY);

                if (Math.abs(diffX) > 50 && diffY < 50) {
                    if (diffX > 0) {
                        nextSlide();
                    } else {
                        prevSlide();
                    }
                    updateZoomedImage();
                    return;
                }
            }

            isDragging = false;
            isSwipeDetection = false;
        });

        function overlayKeyHandler(e) {
            if (e.key === 'Escape') {
                overlay.remove();
                isZoomActive = false;
                document.removeEventListener('keydown', overlayKeyHandler);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                if (scale > 1) {
                    e.preventDefault();
                    const panAmount = 50;
                    if (e.key === 'ArrowLeft') {
                        translateX += panAmount;
                    } else {
                        translateX -= panAmount;
                    }
                    img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
                } else {
                    e.preventDefault();
                    if (e.key === 'ArrowLeft') {
                        prevSlide();
                    } else {
                        nextSlide();
                    }
                    updateZoomedImage();
                }
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                if (scale > 1) {
                    e.preventDefault();
                    const panAmount = 50;
                    if (e.key === 'ArrowUp') {
                        translateY += panAmount;
                    } else {
                        translateY -= panAmount;
                    }
                    img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
                }
            } else if (e.key === '+' || e.key === '=') {
                // Zoom in with keyboard
                e.preventDefault();
                scale = Math.min(scale * 1.2, 3);
                img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
            } else if (e.key === '-') {
                // Zoom out with keyboard
                e.preventDefault();
                scale = Math.max(scale / 1.2, 1);
                if (scale === 1) {
                    translateX = 0;
                    translateY = 0;
                }
                img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
            }
        }

        document.addEventListener('keydown', overlayKeyHandler);

        function getDistance(t1, t2) {
            let dx = t1.clientX - t2.clientX;
            let dy = t1.clientY - t2.clientY;
            return Math.sqrt(dx * dx + dy * dy);
        }
    });
});