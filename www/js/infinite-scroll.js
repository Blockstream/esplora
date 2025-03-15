(function() {
    let animationFrame;
    
    function initInfiniteScroll() {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }

        function setupScroll() {
            if (window.innerWidth > 820) {
                return;
            }

            const track = document.querySelector('.logos-track');
            if (!track) {
                setTimeout(setupScroll, 100);
                return;
            }

            const originalLogos = Array.from(track.children);
            const originalWidth = track.scrollWidth;

            while (track.scrollWidth < originalWidth * 3) {
                originalLogos.forEach(logo => {
                    const clone = logo.cloneNode(true);
                    track.appendChild(clone);
                });
            }

            let position = 0;
            const speed = 0.5;
            
            function animate() {
                position += speed;
                const resetPoint = originalWidth;
                
                if (position >= resetPoint) {
                    position = 0;
                    track.style.transition = 'none';
                    track.style.transform = `translateX(0)`;
                    track.offsetHeight;
                    track.style.transition = 'transform 0.1s linear';
                }
                
                track.style.transform = `translateX(-${position}px)`;
                animationFrame = requestAnimationFrame(animate);
            }

            track.style.transition = 'none';
            track.style.transform = 'translateX(0)';
            track.offsetHeight; // Force reflow
            track.style.transition = 'transform 0.1s linear';

            animationFrame = requestAnimationFrame(animate);
        }

        setupScroll();

        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(setupScroll, 150);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initInfiniteScroll);
    } else {
        initInfiniteScroll();
    }

    window.initInfiniteScroll = initInfiniteScroll;
})();