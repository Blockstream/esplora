(function() {
    let scrollInterval;
    
    function initInfiniteScroll() {
        
        if (scrollInterval) {
            clearInterval(scrollInterval);
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

            originalLogos.forEach(logo => {
                const clone = logo.cloneNode(true);
                track.appendChild(clone);
            });

            let position = 0;
            const speed = 1;
            
            function animate() {
                position += speed;
                const trackWidth = track.scrollWidth / 2;
                
                if (position >= trackWidth) {
                    position = 0;
                }
                
                track.style.transform = `translateX(-${position}px)`;
                requestAnimationFrame(animate);
            }

            requestAnimationFrame(animate);
        }

        setupScroll();

        window.addEventListener('resize', () => {
            setupScroll();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initInfiniteScroll);
    } else {
        initInfiniteScroll();
    }

    window.initInfiniteScroll = initInfiniteScroll;
})();