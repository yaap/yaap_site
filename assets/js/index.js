document.addEventListener('DOMContentLoaded', function () {
    const slides = document.querySelectorAll('.screenshot-slide');
    const leftBtn = document.querySelector('.carousel-arrow.left');
    const rightBtn = document.querySelector('.carousel-arrow.right');
    let current = 0;

    function showSlide(idx) {
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === idx);
        });
    }

    showSlide(current);

    rightBtn.addEventListener('click', () => {
        current = (current + 1) % slides.length;
        showSlide(current);
    });

    leftBtn.addEventListener('click', () => {
        current = (current - 1 + slides.length) % slides.length;
        showSlide(current);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            leftBtn.click();
        } else if (e.key === 'ArrowRight') {
            rightBtn.click();
        }
    });
});
