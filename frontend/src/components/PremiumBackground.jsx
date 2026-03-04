import React, { useEffect, useRef } from 'react';

const PremiumBackground = ({ children, className = "", contentClassName = "", showCursor = true }) => {
    const cursorRef = useRef(null);
    useCursorEffect(cursorRef, showCursor);
    return (
        <div className={`relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#f3efe7] via-[#e9eef5] to-[#f5f5f5] ${showCursor ? 'has-custom-cursor' : ''} ${className}`}>
            {/* Warm Glow */}
            <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-orange-200 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>

            {/* Blue Glow */}
            <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-blue-200 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>

            {/* Dot Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle,_#000_1px,_transparent_1px)] [background-size:24px_24px]"></div>

            {/* Subtle Scanline Overlay */}
            <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>

            {/* Content */}
            <div className={`relative z-10 ${contentClassName}`}>
                {children}
            </div>

            {showCursor && <div ref={cursorRef} className="custom-cursor" />}
        </div>
    );
};

// Moving cursor logic into its own hook or helper inside the file for cleaner code
const useCursorEffect = (cursorRef, showCursor) => {
    useEffect(() => {
        if (!showCursor) return;
        const cursor = cursorRef.current;
        if (!cursor) return;

        let lastX = 0;
        let lastY = 0;
        let lastTime = Date.now();

        const createSparkle = (x, y, isTrail = false, isShake = false) => {
            const particle = document.createElement('div');
            particle.className = 'sparkle-particle';

            // Larger stars for shake
            const size = isShake ? (Math.random() * 12 + 6) : (isTrail ? (Math.random() * 4 + 2) : (Math.random() * 6 + 4));

            // Palette matches the wand's blue orb
            const blueColors = ['#00FFFF', '#87CEEB', '#00BFFF', '#E0FFFF', '#B0E0E6', '#FFFFFF'];
            const goldenColors = ['#FFD700', '#FFC107', '#FFB300', '#F9A825', '#FFF176', '#FFFFFF'];
            const colors = isShake ? blueColors : goldenColors;

            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];

            // Pointer is at the orb (top-left) - adjust particle spawn a bit
            particle.style.left = (x - size / 2) + 'px';
            particle.style.top = (y - size / 2) + 'px';

            particle.style.zIndex = isTrail ? '9998' : '9997';
            particle.style.boxShadow = `0 0 ${size * 2}px ${colors[0]}, 0 0 ${size * 4}px rgba(255, 255, 255, 0.5)`;

            // Enhanced 5-pointed star clip-path
            particle.style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
            document.body.appendChild(particle);

            let vx = (Math.random() - 0.5) * (isShake ? 12 : 6);
            let vy = (Math.random() - 0.5) * (isShake ? 12 : 6);
            let life = 1;
            let rotation = Math.random() * 360;
            let rotationSpeed = (Math.random() - 0.5) * 15;

            const animate = () => {
                x += vx; y += vy; rotation += rotationSpeed;
                particle.style.transform = `rotate(${rotation}deg) scale(${life})`;
                particle.style.opacity = life;
                particle.style.left = x + 'px'; particle.style.top = y + 'px';
                if (life > 0) {
                    life -= (isShake ? 0.015 : 0.02);
                    requestAnimationFrame(animate);
                } else {
                    particle.remove();
                }
            };
            animate();
        };

        const handleMouseMove = (e) => {
            const now = Date.now();
            const dt = now - lastTime;
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            const velocity = dt > 0 ? Math.sqrt(dx * dx + dy * dy) / dt : 0;

            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
            cursor.style.opacity = '1';
            // Orb alignment: the glowy orb is at the top-left of the image.
            cursor.style.transform = 'translate(-10%, -10%)';

            // Shake detection (velocity threshold)
            if (velocity > 1.5) {
                for (let i = 0; i < 3; i++) {
                    createSparkle(e.clientX, e.clientY, false, true);
                }
            } else if (Math.random() > 0.8) {
                createSparkle(e.clientX, e.clientY, true);
            }

            lastX = e.clientX;
            lastY = e.clientY;
            lastTime = now;
        };

        const handleMouseEnter = () => cursor.classList.add('hovering');
        const handleMouseLeave = () => cursor.classList.remove('hovering');

        document.addEventListener('mousemove', handleMouseMove);

        const attachListeners = () => {
            const targets = document.querySelectorAll('button, a, select, input, textarea, .premium-card, .card, [role="button"]');
            targets.forEach(t => {
                t.addEventListener('mouseenter', handleMouseEnter);
                t.addEventListener('mouseleave', handleMouseLeave);
            });
        };

        attachListeners();
        const interval = setInterval(attachListeners, 2000);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            clearInterval(interval);
        };
    }, [showCursor]);
};

export default PremiumBackground;
