
document.addEventListener('DOMContentLoaded', function () {
    const track = document.querySelector('.screenshot-track');
    if (!track) return;

    const leftArrow = document.querySelector('.carousel-arrow.left');
    const rightArrow = document.querySelector('.carousel-arrow.right');

    const scrollAmount = 320;

    if (leftArrow) {
        leftArrow.addEventListener('click', () => {
            track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });
    }

    if (rightArrow) {
        rightArrow.addEventListener('click', () => {
            track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });
    }

    const handleScroll = () => {
    };

    track.addEventListener('scroll', handleScroll);

    track.addEventListener('click', (e) => {
        const img = e.target.closest('img');
        if (!img) return;

        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s;
            cursor: zoom-out;
        `;

        const largeImg = document.createElement('img');
        largeImg.src = img.src;
        largeImg.style.cssText = `
            max-width: 95%;
            max-height: 95%;
            object-fit: contain;
            transform: scale(0.9);
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        `;

        overlay.appendChild(largeImg);
        document.body.appendChild(overlay);

        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            largeImg.style.transform = 'scale(1)';
        });

        overlay.addEventListener('click', () => {
            overlay.style.opacity = '0';
            largeImg.style.transform = 'scale(0.9)';
            setTimeout(() => overlay.remove(), 300);
        });
    });
});