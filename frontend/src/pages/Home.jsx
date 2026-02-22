import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLingo, useLingoLocale, setLingoLocale } from "lingo.dev/react/client";
import { LANGUAGES } from '../lingo/dictionary';
import { Globe, PenTool, MessageSquare, Languages, ArrowRight, BookOpen, Zap, ChevronRight, Volume2, Square, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import PremiumBackground from '../components/PremiumBackground';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
    const navigate = useNavigate();
    const { dictionary } = useLingo();
    const locale = useLingoLocale();
    const { user } = useAuth();
    const [langOpen, setLangOpen] = useState(false);
    const langRef = useRef(null);
    const scrollyRef = useRef(null);
    const newsSectionRef = useRef(null);
    const videoRef = useRef(null);
    const video3Ref = useRef(null);
    const video4Ref = useRef(null);


    const [speakingPostId, setSpeakingPostId] = useState(null);
    const [bookmarkedCards, setBookmarkedCards] = useState(() => {
        const saved = localStorage.getItem('spotlightBookmarks');
        return saved ? JSON.parse(saved) : [];
    });

    const t = (key) => dictionary?.[key] || key;

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleSpeech = (post) => {
        if (speakingPostId === post.id) {
            window.speechSynthesis.cancel();
            setSpeakingPostId(null);
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(`${post.title}. ${post.snippet || post.content}`);
        utterance.lang = locale === 'en' ? 'en-US' : locale;
        utterance.onend = () => setSpeakingPostId(null);
        utterance.onerror = () => setSpeakingPostId(null);

        setSpeakingPostId(post.id);
        window.speechSynthesis.speak(utterance);
    };

    const handleShare = async (card) => {
        const shareData = {
            title: card.title,
            text: card.snippet,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Error sharing:', err);
                }
            }
        } else {
            const text = `${card.title}\n${card.snippet}\n${window.location.href}`;
            navigator.clipboard.writeText(text).then(() => {
                alert('Shared content copied to clipboard!');
            }).catch(() => {
                alert('Unable to share. Please try again.');
            });
        }
    };

    const handleBookmark = (card) => {
        setBookmarkedCards((prev) => {
            const isBookmarked = prev.includes(card.id);
            const updated = isBookmarked ? prev.filter(id => id !== card.id) : [...prev, card.id];
            localStorage.setItem('spotlightBookmarks', JSON.stringify(updated));
            return updated;
        });
    };

    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.4,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 0.9,
            smoothTouch: false,
            touchMultiplier: 2,
            infinite: false,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        // Sync Lenis with ScrollTrigger
        lenis.on('scroll', ScrollTrigger.update);

        // ========== SCROLLYTELLING: Master Timeline (scrub: true, frame-by-frame scroll control) ==========
        const scrollyEl = scrollyRef.current;
        if (!scrollyEl) return;

        const scene1Img = scrollyEl.querySelector('.scene-1-img');
        const scene1Text = scrollyEl.querySelector('.scene-1-text');
        const scene1Overlay = scrollyEl.querySelector('.scene-1-overlay');
        const scene2Container = scrollyEl.querySelector('.scene-2-container');
        const scene2Video = scrollyEl.querySelector('.scene-2-video');
        const scene2Overlay = scrollyEl.querySelector('.scene-2-overlay');
        const scene2Text = scrollyEl.querySelector('.scene-2-text');
        const scene3Img = scrollyEl.querySelector('.scene-3-img');
        const scene3Text = scrollyEl.querySelector('.scene-3-text');
        const scene4Visual = scrollyEl.querySelector('.scene-4-visual');
        const scene4Text = scrollyEl.querySelector('.scene-4-text');
        const scene5Img = scrollyEl.querySelector('.scene-5-img');
        const scene5Text = scrollyEl.querySelector('.scene-5-text');
        const scene6Img = scrollyEl.querySelector('.scene-6-img');
        const scene6Text = scrollyEl.querySelector('.scene-6-text');

        const masterTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: "#scrollytelling",
                start: "top top",
                end: "bottom bottom",
                scrub: 1.5,
                pin: true,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                id: "scrolly-master"
            }
        });

        // SCENE 1 (0–20%): First image full-screen, text fades in, image zooms 1→1.05
        masterTimeline
            .fromTo(scene1Text, { opacity: 0 }, { opacity: 1, duration: 2, ease: "power2.out" }, 0)
            .to(scene1Img, { scale: 1.05, duration: 2, ease: "none" }, 0);

        // SCENE 2 (20–40%): First image darkens/fades, video appears behind, video scrubs with scroll
        masterTimeline
            .to(scene1Overlay, { opacity: 0.9, duration: 2, ease: "power2.inOut" }, 2)
            .to(scene1Img, { opacity: 0.4, duration: 2, ease: "power2.inOut" }, 2)
            .to(scene1Text, { opacity: 0, duration: 1.5, ease: "power2.in" }, 2)
            .fromTo(scene2Container, { opacity: 0 }, { opacity: 1, duration: 1.5, ease: "none" }, 2.5)
            .fromTo(scene2Video, { opacity: 0 }, { opacity: 1, duration: 1.5, ease: "none" }, 2.5)
            .fromTo(scene2Text, { opacity: 0 }, { opacity: 1, duration: 1.5, ease: "power2.out" }, 2.5)
            .to(scene2Overlay, { opacity: 0.6, duration: 1.5, ease: "none" }, 2.5);

        // Video scrub: playback tied to scroll progress - plays only while scrolling (3 blog videos)
        const addVideoScrub = (videoEl, startTime, duration) => {
            if (!videoEl) return;
            const scrub = () => {
                masterTimeline.to(videoEl, {
                    currentTime: videoEl.duration,
                    ease: "none",
                    duration
                }, startTime);
            };
            if (videoEl.readyState >= 1) scrub();
            else videoEl.addEventListener('loadedmetadata', scrub);
        };
        addVideoScrub(scrollyEl.querySelector('.scene-2-video'), 2.5, 2);
        addVideoScrub(scrollyEl.querySelector('.scene-3-video'), 5, 2.5);
        addVideoScrub(scrollyEl.querySelector('.scene-4-video'), 8.5, 2.5);

        // SCENE 3 (40–60%): Overlap transitions - no blank gaps (no y shift to avoid white strip at image bottom)
        masterTimeline
            .fromTo(scene3Img, { opacity: 0, y: 80 }, { opacity: 1, y: 0, duration: 2, ease: "power2.out" }, 4.2)
            .fromTo(scene3Text, { opacity: 0 }, { opacity: 1, duration: 1.5, ease: "power2.out" }, 4.7)
            .to(scene2Video, { opacity: 0, duration: 1.5, ease: "power2.inOut" }, 4.5)
            .to(scene2Text, { opacity: 0, duration: 1.5, ease: "power2.in" }, 4.5)
            .to(scene2Container, { opacity: 0, duration: 1.5, ease: "none" }, 4.5)
            .to(scene2Overlay, { opacity: 0, duration: 1, ease: "none" }, 4.5)
            .to(scene1Img, { opacity: 0, duration: 1, ease: "none" }, 4.5)
            .to(scene3Img, { scale: 1.03, duration: 2, ease: "none" }, 5.5);

        // SCENE 4 (60–80%): Third visual layer reveal, previous scales down and fades
        masterTimeline
            .to(scene3Img, { scale: 0.95, opacity: 0.5, duration: 2, ease: "power2.inOut" }, 8)
            .to(scene3Text, { opacity: 0, duration: 1, ease: "power2.in" }, 8)
            .fromTo(scene4Visual, { opacity: 0, scale: 0.98 }, { opacity: 1, scale: 1, duration: 2.5, ease: "power2.out" }, 8.5)
            .fromTo(scene4Text, { opacity: 0 }, { opacity: 1, duration: 1.5, ease: "power2.out" }, 9.5);

        // SCENE 5 (80–100%): Overlap - scene 5 in before scene 4 fully out
        masterTimeline
            .fromTo(scene5Img, { opacity: 0 }, { opacity: 1, duration: 1.5, ease: "power2.out" }, 10.8)
            .fromTo(scene5Text, { opacity: 0 }, { opacity: 1, duration: 1, ease: "power2.out" }, 11.3)
            .to(scene4Visual, { opacity: 0, duration: 2, ease: "power2.inOut" }, 11)
            .to(scene4Text, { opacity: 0, duration: 1.5, ease: "power2.in" }, 11)
            .to(scene4Text, { opacity: 0, duration: 1.5, ease: "power2.in" }, 11);

        // SCENE 6: Blog-themed dark image above Spotlight – fills lower scroll space
        masterTimeline
            .to(scene5Img, { opacity: 0, duration: 1.5, ease: "power2.inOut" }, 12)
            .to(scene5Text, { opacity: 0, duration: 1, ease: "power2.in" }, 12)
            .fromTo(scene6Img, { opacity: 0, scale: 0.98 }, { opacity: 1, scale: 1, duration: 2, ease: "power2.out" }, 12.5)
            .fromTo(scene6Text, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: "power2.out" }, 13);

        // Spotlight Stories: pin section and scroll-driven horizontal cards (scroll until last card then unfix)
        const spotlightPin = document.getElementById('spotlight-pin-wrapper');
        const newsCardsTrack = document.querySelector('.news-cards-track');
        const spotlightCardsSection = document.getElementById('spotlight-cards-section');
        if (spotlightPin && newsCardsTrack && spotlightCardsSection) {
            gsap.set(newsCardsTrack, { x: 0 });
            const getMaxScroll = () => {
                const trackWidth = newsCardsTrack.scrollWidth;
                const sectionWidth = spotlightCardsSection.clientWidth;
                return Math.max(0, trackWidth - sectionWidth);
            };
            const spotlightTl = gsap.timeline({
                scrollTrigger: {
                    trigger: spotlightPin,
                    start: 'top top',
                    end: () => `+=${window.innerHeight * 1.6}`,
                    pin: true,
                    scrub: 1,
                    invalidateOnRefresh: true,
                    id: 'spotlight-pin'
                }
            });
            spotlightTl.to(newsCardsTrack, {
                x: () => -getMaxScroll(),
                ease: 'none'
            }, 0);
        }

        // Features section reveal-up
        const sections = gsap.utils.toArray('.reveal-up');
        sections.forEach((section) => {
            gsap.fromTo(section,
                { opacity: 0, y: 50 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: section,
                        start: "top 80%",
                        end: "top 20%",
                        scrub: false,
                        toggleActions: "play none none reverse"
                    }
                }
            );
        });

        const parallaxImages = gsap.utils.toArray('.parallax-img');
        parallaxImages.forEach((img) => {
            gsap.to(img, {
                y: -150,
                scale: 1.15,
                ease: "none",
                scrollTrigger: {
                    trigger: img,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1
                }
            });
        });

        // News cards: subtle mouse-shake (fun but not annoying)
        let newsShakeHandler = null;
        const newsSectionEl = newsSectionRef.current;
        if (newsSectionEl) {
            let newsPosHistory = [];
            let newsLastShake = 0;
            newsShakeHandler = (e) => {
                const now = Date.now();
                newsPosHistory.push({ x: e.clientX, y: e.clientY, t: now });
                if (newsPosHistory.length > 8) newsPosHistory.shift();
                if (newsPosHistory.length < 3 || now - newsLastShake < 1500) return;
                const recent = newsPosHistory.slice(-3);
                let vel = 0;
                for (let i = 1; i < recent.length; i++) {
                    const dt = (recent[i].t - recent[i - 1].t) / 1000 || 0.001;
                    vel += Math.sqrt(Math.pow((recent[i].x - recent[i - 1].x) / dt, 2) + Math.pow((recent[i].y - recent[i - 1].y) / dt, 2));
                }
                if (vel / (recent.length - 1) > 180) {
                    newsLastShake = now;
                    const cards = newsSectionEl.querySelectorAll('.news-card');
                    gsap.fromTo(cards, { rotation: -0.5 }, { rotation: 0.5, duration: 0.05, repeat: 2, yoyo: true, stagger: 0.015, ease: "power2.inOut", onComplete: () => gsap.set(cards, { clearProps: "rotation" }) });
                }
            };
            newsSectionEl.addEventListener('mousemove', newsShakeHandler, { passive: true });
        }

        const handleClickOutside = (e) => {
            if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            if (newsSectionEl && newsShakeHandler) newsSectionEl.removeEventListener('mousemove', newsShakeHandler);
            if (typeof lenis.off === 'function') lenis.off('scroll', ScrollTrigger.update);
            lenis.destroy();
            ScrollTrigger.getAll().forEach(trigger => trigger.kill());
        };
    }, []);

    // Spotlight cards: horizontal position is driven by GSAP pin + scrub in main useEffect (no scrollLeft)
    useEffect(() => {
        const newsCardsTrack = document.querySelector('.news-cards-track');
        const cardItems = document.querySelectorAll('.card-scroll-item');
        if (!newsCardsTrack || cardItems.length === 0) return;

        const updateCardOpacity = () => {
            const viewportCenter = window.innerWidth / 2;
            const distances = [];

            cardItems.forEach((item, idx) => {
                const itemRect = item.getBoundingClientRect();
                const itemCenter = itemRect.left + itemRect.width / 2;
                const distance = Math.abs(itemCenter - viewportCenter);
                distances.push({ item, distance, idx });
            });

            distances.sort((a, b) => a.distance - b.distance);

            cardItems.forEach((item) => {
                item.classList.remove('active', 'center-dark', 'side-fade');
            });

            for (let i = 0; i < distances.length; i++) {
                if (i < 3) {
                    distances[i].item.classList.add('center-dark');
                } else {
                    distances[i].item.classList.add('side-fade');
                }
            }
        };

        const observer = new ResizeObserver(updateCardOpacity);
        observer.observe(newsCardsTrack);
        const interval = setInterval(updateCardOpacity, 120);
        return () => { observer.disconnect(); clearInterval(interval); };
    }, []);

    useEffect(() => {
        const cursor = document.querySelector('.custom-cursor');
        const scrollytelling = document.getElementById('scrollytelling');
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
            const colors = isShake || (!isTrail && !scrollytelling?.contains(document.elementFromPoint(x, y))) ? blueColors : goldenColors;

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

            const isInScrolly = scrollytelling && scrollytelling.contains(e.target);
            const spotlightSection = document.getElementById('spotlight-cards-section');
            const spotlightRect = spotlightSection?.getBoundingClientRect();
            const isSpotlightOrBelow = spotlightRect && spotlightRect.top <= (window.innerHeight * 0.9);

            if (isInScrolly) {
                cursor.style.opacity = '0';
                for (let i = 0; i < 2; i++) {
                    createSparkle(e.clientX, e.clientY);
                }
            } else if (isSpotlightOrBelow) {
                cursor.style.left = e.clientX + 'px';
                cursor.style.top = e.clientY + 'px';
                cursor.style.opacity = '1';
                cursor.style.transform = 'translate(-10%, -10%)';

                const parent = cursor.parentElement;
                if (parent) parent.classList.add('has-custom-cursor');

                // Shake detection (velocity threshold)
                if (velocity > 1.5) {
                    for (let i = 0; i < 3; i++) {
                        createSparkle(e.clientX, e.clientY, false, true);
                    }
                } else if (Math.random() > 0.8) {
                    createSparkle(e.clientX, e.clientY, true);
                }
            } else {
                cursor.style.opacity = '0';
                const parent = cursor.parentElement;
                if (parent) parent.classList.remove('has-custom-cursor');
            }

            lastX = e.clientX;
            lastY = e.clientY;
            lastTime = now;
        };

        const cards = document.querySelectorAll('.card, .card-read-more, .card-icon-share, .card-icon-bookmark, a');

        const handleCardEnter = () => {
            if (!scrollytelling || !scrollytelling.contains(document.activeElement)) {
                cursor.classList.add('hovering');
            }
        };

        const handleCardLeave = () => {
            cursor.classList.remove('hovering');
        };

        document.addEventListener('mousemove', handleMouseMove);
        cards.forEach(card => {
            card.addEventListener('mouseenter', handleCardEnter);
            card.addEventListener('mouseleave', handleCardLeave);
        });

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            cards.forEach(card => {
                card.removeEventListener('mouseenter', handleCardEnter);
                card.removeEventListener('mouseleave', handleCardLeave);
            });
        };
    }, []);

    const handleGetStarted = () => {
        if (user) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };

    return (
        <PremiumBackground showCursor={false}>
            <div className="custom-cursor"></div>
            <div className="min-h-screen text-slate-900 font-sans selection:bg-indigo-50 selection:text-indigo-900 overflow-x-hidden">
                {/* Navigation */}
                <motion.nav
                    className="fixed top-0 left-0 right-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md transition-colors"
                >
                    <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ y: -2 }}
                            className="flex items-center gap-2 cursor-pointer group"
                            onClick={() => navigate('/')}
                        >
                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg transition-all duration-500 group-hover:bg-indigo-600">
                                <BookOpen className="text-white" size={22} />
                            </div>
                            <span className="text-2xl font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors duration-500 uppercase">
                                {t("app.name")}
                            </span>
                        </motion.div>

                        <div className="flex items-center gap-4">
                            <div className="relative" ref={langRef}>
                                <button
                                    onClick={() => setLangOpen(!langOpen)}
                                    className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition-all hover:border-indigo-200"
                                >
                                    <Globe size={16} className="text-indigo-500" />
                                    {LANGUAGES.find(l => l.code === locale)?.nativeName || 'English'}
                                </button>
                                <AnimatePresence>
                                    {langOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-indigo-100/50 overflow-hidden z-50 p-1"
                                        >
                                            {LANGUAGES.map(lang => (
                                                <button
                                                    key={lang.code}
                                                    onClick={() => { setLingoLocale(lang.code); setLangOpen(false); }}
                                                    className={`w-full text-left px-4 py-3 text-sm font-medium rounded-xl transition-all flex items-center justify-between ${locale === lang.code ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                                                >
                                                    <span>{lang.nativeName}</span>
                                                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{lang.code}</span>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {user ? (
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all hover:shadow-xl hover:shadow-indigo-200 hover:-translate-y-0.5"
                                >
                                    {t("nav.dashboard")}
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="text-slate-600 hover:text-indigo-600 px-4 py-2 font-bold transition-all"
                                    >
                                        {t("nav.login")}
                                    </button>
                                    <button
                                        onClick={() => navigate('/signup')}
                                        className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold transition-all hover:shadow-xl hover:shadow-slate-200 hover:-translate-y-0.5"
                                    >
                                        {t("nav.signup")}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.nav>

                {/* ========== SCROLLYTELLING: Full-scroll experience from top to above footer ========== */}
                {/* Scrollytelling: height trimmed to remove vacant lower space; same pin + scroll experience */}
                <section id="scrollytelling" ref={scrollyRef} className="relative h-[360vh] md:h-[420vh] bg-[#fafaf8] overflow-hidden scrollytelling-container">
                    {/* Custom circle cursor removed as requested */}
                    {/* Sticky viewport: pinned during scroll */}
                    <div className="sticky top-0 left-0 w-full h-screen flex items-center justify-center overflow-hidden bg-[#fafaf8]">
                        {/* Off-white background */}
                        <div className="absolute inset-0 z-0 bg-[#fafaf8]" />

                        {/* Scroll hint - fades after 3s to signal scroll-driven experience */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 animate-fade-out-delayed pointer-events-none">
                            <span className="text-white/70 text-sm font-bold uppercase tracking-[0.3em]">{t("home.scroll.hint")}</span>
                            <div className="w-6 h-10 rounded-full border-2 border-white/50 flex justify-center pt-2">
                                <div className="w-1 h-2 rounded-full bg-white/60 animate-bounce" />
                            </div>
                        </div>

                        {/* SCENE 1: First full-screen image (writing desk) */}
                        <div className="scene-1-img absolute inset-0 w-full h-full overflow-hidden z-10">
                            <img
                                src="https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=2070&auto=format&fit=crop"
                                alt="Creative workspace"
                                className="w-full h-full object-cover"
                                style={{ filter: 'saturate(0.7) contrast(1.1)' }}
                            />
                            <div className="scene-1-overlay absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
                        </div>

                        {/* SCENE 1 TEXT: Hero title, subtitle, CTA (existing home page text) */}
                        <div className="scene-1-text absolute inset-0 z-20 flex flex-col items-center justify-center px-8 text-center">
                            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-2.5 mb-8">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90">{t("home.scroll.trusted")}</span>
                            </div>
                            <h2 className="text-5xl md:text-8xl font-black mb-8 tracking-[-0.04em] leading-[0.95] text-white drop-shadow-2xl">
                                {t("hero.title")}
                            </h2>
                            <p className="text-xl md:text-2xl text-white/90 mb-12 leading-relaxed font-bold max-w-3xl mx-auto drop-shadow-lg">
                                {t("hero.subtitle")}
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                                <button
                                    onClick={handleGetStarted}
                                    className="group flex items-center gap-4 bg-white text-slate-900 px-12 py-6 rounded-[2rem] font-black text-xl transition-all shadow-2xl hover:bg-slate-100"
                                >
                                    <PenTool size={24} />
                                    {t("hero.cta")}
                                    <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button
                                    onClick={() => navigate('/blog')}
                                    className="flex items-center gap-4 bg-white/20 backdrop-blur-sm text-white border border-white/40 px-12 py-6 rounded-[2rem] font-black text-xl transition-all hover:bg-white/30"
                                >
                                    <BookOpen size={24} />
                                    {t("home.scroll.explore")}
                                </button>
                            </div>
                        </div>

                        {/* SCENE 2: Image + video (typing/laptop) - image ensures no blank screen */}
                        <div className="scene-2-container absolute inset-0 z-[5] overflow-hidden opacity-0">
                            <img
                                src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop"
                                alt="Laptop workspace"
                                className="absolute inset-0 w-full h-full object-cover"
                                style={{ filter: 'saturate(0.6) contrast(1.1)' }}
                            />
                            <video
                                ref={videoRef}
                                className="scene-2-video absolute inset-0 w-full h-full object-cover opacity-0"
                                src="https://assets.mixkit.co/videos/preview/mixkit-hands-typing-on-laptop-4373-large.mp4"
                                muted
                                playsInline
                                preload="auto"
                                style={{ filter: 'saturate(0.6) contrast(1.1)' }}
                            />
                            <div className="scene-2-overlay absolute inset-0 bg-black/50 opacity-0" />
                        </div>
                        <div className="scene-2-text absolute inset-0 z-20 flex flex-col items-center justify-center px-8 text-center opacity-0 pointer-events-none">
                            <h3 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight drop-shadow-2xl">
                                Create. Translate. <span className="text-white/90">Inspire.</span>
                            </h3>
                            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto font-bold">
                                {t("app.name")} empowers creators to write brilliant content and reach audiences in 100+ languages instantly.
                            </p>
                        </div>

                        {/* SCENE 3: Image + video (writing/notebook) - "Write. Share. Reach readers" */}
                        <div className="scene-3-img absolute inset-0 w-full h-full overflow-hidden z-10 opacity-0">
                            <img
                                src="https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=2073&auto=format&fit=crop"
                                alt="Writing in notebook"
                                className="absolute inset-0 w-full h-full object-cover"
                                style={{ filter: 'saturate(0.6) contrast(1.1)' }}
                            />
                            <video
                                ref={video3Ref}
                                className="scene-3-video absolute inset-0 w-full h-full object-cover"
                                src="https://assets.mixkit.co/videos/preview/mixkit-woman-writing-on-notebook-100316-large.mp4"
                                muted
                                playsInline
                                preload="auto"
                                style={{ filter: 'saturate(0.6) contrast(1.1)' }}
                            />
                            <div className="absolute inset-0 bg-black/35" />
                        </div>
                        <div className="scene-3-text absolute inset-0 z-20 flex flex-col items-center justify-center px-8 text-center opacity-0 pointer-events-none">
                            <h3 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight drop-shadow-2xl">
                                Write. Share. <span className="text-white/90">Reach readers everywhere.</span>
                            </h3>
                            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto font-bold">
                                Your stories deserve a global audience. Publish once, read in any language.
                            </p>
                        </div>

                        {/* SCENE 4: Image + video (reading/publishing) - "{t("app.name")} transformed our reach" */}
                        <div className="scene-4-visual absolute inset-0 w-full h-full overflow-hidden z-10 opacity-0">
                            <img
                                src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2128&auto=format&fit=crop"
                                alt="Books and reading"
                                className="absolute inset-0 w-full h-full object-cover"
                                style={{ filter: 'saturate(0.6) contrast(1.1)' }}
                            />
                            <video
                                ref={video4Ref}
                                className="scene-4-video absolute inset-0 w-full h-full object-cover"
                                src="https://assets.mixkit.co/videos/preview/mixkit-person-reading-a-book-4172-large.mp4"
                                muted
                                playsInline
                                preload="auto"
                                style={{ filter: 'saturate(0.6) contrast(1.1)' }}
                            />
                            <div className="absolute inset-0 bg-black/40" />
                        </div>
                        <div className="scene-4-text absolute inset-0 z-20 flex flex-col items-center justify-center px-8 text-center opacity-0 pointer-events-none">
                            <h3 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight drop-shadow-2xl italic">
                                "{t("app.name")} transformed our reach overnight."
                            </h3>
                            <p className="text-lg text-white/80 max-w-2xl mx-auto font-bold">
                                We went from a local startup to a borderless brand.
                            </p>
                        </div>

                        {/* SCENE 5: Final image (typing hands) */}
                        <div className="scene-5-img absolute inset-0 w-full h-full overflow-hidden z-10 opacity-0">
                            <img
                                src="https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?q=80&w=2070&auto=format&fit=crop"
                                alt="Typing hands"
                                className="w-full h-full object-cover"
                                style={{ filter: 'saturate(0.7) contrast(1.1)' }}
                            />
                            <div className="absolute inset-0 bg-black/45" />
                        </div>
                        <div className="scene-5-text absolute inset-0 z-20 flex flex-col items-center justify-center px-8 text-center opacity-0">
                            <h3 className="text-4xl md:text-7xl font-black text-white mb-6 tracking-tighter drop-shadow-2xl">
                                Ready to write <span className="text-white/90">the future?</span>
                            </h3>
                            <p className="text-lg text-white/80 max-w-2xl mx-auto font-bold mb-16">
                                Join a new generation of creators building borderless communities.
                            </p>
                            <button
                                onClick={handleGetStarted}
                                className="bg-white text-slate-900 px-12 py-6 rounded-[2rem] font-black text-xl shadow-2xl hover:bg-slate-100 transition-all"
                            >
                                Get Started Free
                            </button>
                        </div>

                        {/* SCENE 6: Blog-themed dark image – above Spotlight, fills lower scroll */}
                        <div className="scene-6-img absolute inset-0 w-full h-full overflow-hidden z-10 opacity-0">
                            <img
                                src="https://images.unsplash.com/photo-1512820790803-83ca734da794?q=90&w=2070&auto=format&fit=crop"
                                alt="Blog and reading"
                                className="w-full h-full object-cover"
                                style={{ filter: 'saturate(0.5) contrast(1.15) brightness(0.7)' }}
                            />
                            <div className="absolute inset-0 bg-black/55" />
                        </div>
                        <div className="scene-6-text absolute inset-0 z-20 flex flex-col items-center justify-center px-8 text-center opacity-0 pointer-events-none">
                            <h3 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight drop-shadow-2xl">
                                Your blog. <span className="text-white/90">Every language.</span>
                            </h3>
                            <p className="text-lg text-white/85 max-w-2xl mx-auto font-bold">
                                Start writing and reach the world with {t("app.name")}.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Spotlight Stories - Horizontal Scrolling Cards (pin + scroll-driven horizontal) */}
                <section ref={newsSectionRef} className="news-highlight-section relative pt-6 pb-16 bg-white" style={{ marginTop: 'calc(-44rem - 210vh)', overflow: 'visible' }}>
                    <div id="spotlight-pin-wrapper" className="min-h-screen flex flex-col" style={{ overflow: 'visible' }}>
                        <div className="max-w-7xl mx-auto px-8 flex-shrink-0">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                className="text-center -mb-8 relative z-10"
                            >
                                <div className="inline-block">
                                    <h3 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-600 to-slate-900 pb-2">
                                        ✨ Spotlight Stories
                                    </h3>
                                </div>
                                <p className="text-slate-600 mt-1 font-medium text-sm">Discover inspiring content and trending topics</p>
                            </motion.div>
                        </div>
                        <div className="relative py-12 flex items-center justify-center flex-1" id="spotlight-cards-section" style={{ overflow: 'visible', width: '100%' }}>
                            <div className="news-cards-track flex gap-8 px-8 flex-shrink-0" style={{ willChange: 'transform', width: 'max-content', minWidth: '100%' }}>
                                {[
                                    { id: 'news-1', circleImg: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=85&w=400&auto=format&fit=crop", title: "Ajit Pawar Plane Crash Tragedy — Probe Intensifies", snippet: "On January 28, 2026, a Learjet 45 aircraft crashed near Baramati, killing him and four others. Investigation underway." },
                                    { id: 'news-2', circleImg: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=85&w=400&auto=format&fit=crop", title: "Rishi Sunak's Humorous Moment at AI Summit", snippet: "UK PM delivers lighthearted comment about keeping up with tech at India AI Impact Summit. The playful remark goes viral." },
                                    { id: 'news-3', circleImg: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?q=85&w=400&auto=format&fit=crop", title: "Nihilist Penguin Meme Takes Over Internet", snippet: "A lone penguin becomes internet sensation, inspiring creative reinterpretations. One of 2026's most enduring viral trends." },
                                    { id: 'news-4', circleImg: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?q=85&w=400&auto=format&fit=crop", title: "Rat Viral Video: Pani Puri Safety Concerns", snippet: "Shocking video shows rat in masala water at golgappa stall, sparking nationwide outrage and food safety reviews." },
                                    { id: 'news-5', circleImg: "https://images.unsplash.com/photo-1519741497674-611481863552?q=85&w=400&auto=format&fit=crop", title: "Shahid Kapoor Stars at Opulent Haldiram Wedding", snippet: "Luxury wedding in Nagpur becomes trending sensation with celebrity appearances and extravagant décor." },
                                    { id: 'news-6', circleImg: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=85&w=400&auto=format&fit=crop", title: "Rajkummar Rao's Changed Look Sparks Fan Reactions", snippet: "Bollywood actor's altered appearance ignites speculation. Fans share memes and theories about upcoming film roles." },
                                    { id: 'news-7', circleImg: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=85&w=400&auto=format&fit=crop", title: "Gukesh Makes Chess History as World Champion", snippet: "Teenage grandmaster claims World Championship, defeating top competitors. Live streams break viewership records." },
                                    { id: 'news-8', circleImg: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=85&w=400&auto=format&fit=crop", title: "20 Emerging Tech Trends Shaping 2026", snippet: "From AI-driven innovation to blockchain advancements, 2026 promises transformative changes across industries." },
                                    { id: 'news-9', circleImg: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?q=85&w=400&auto=format&fit=crop", title: "India Army Hosts High-Altitude Drone Competition", snippet: "Drone innovation competition in Himalayas challenges engineers. Attracts international attention for defense tech." }
                                ].map((card, idx) => (
                                    <div
                                        key={idx}
                                        className="card-scroll-item flex-shrink-0 w-[300px] flex items-center justify-center perspective"
                                    >
                                        <motion.div
                                            className="card group w-full"
                                            initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.6, ease: "easeOut" }}
                                        >
                                            <div className="card-image-circle">
                                                <img
                                                    src={card.circleImg}
                                                    alt={card.title}
                                                />
                                            </div>
                                            <h3 className="card-title">{card.title}</h3>
                                            <p className="card-description">{card.snippet}</p>
                                            <div className="card-actions">
                                                <button onClick={() => navigate('/blog')} className="card-read-more">Read More</button>
                                                <div className="card-icons">
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleSpeech(card);
                                                        }}
                                                        className={`card-icon-speaker ${speakingPostId === card.id ? 'active' : ''}`}
                                                        title="Listen"
                                                    >
                                                        {speakingPostId === card.id ? <Square size={16} fill="currentColor" /> : <Volume2 size={18} />}
                                                    </button>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleShare(card);
                                                        }} 
                                                        className="card-icon-share" 
                                                        title="Share"
                                                    >
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="18" cy="5" r="3"></circle>
                                                            <circle cx="6" cy="12" r="3"></circle>
                                                            <circle cx="18" cy="19" r="3"></circle>
                                                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                                                        </svg>
                                                    </button>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleBookmark(card);
                                                        }} 
                                                        className={`card-icon-bookmark ${bookmarkedCards.includes(card.id) ? 'bookmarked' : ''}`} 
                                                        title="Bookmark"
                                                    >
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill={bookmarkedCards.includes(card.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="bg-slate-50 py-40 relative overflow-hidden reveal-up">
                    <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #e2e8f0 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                    <div className="max-w-7xl mx-auto px-8 relative">
                        <div className="text-center mb-24">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                className="inline-block px-5 py-2 bg-indigo-100 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-6"
                            >
                                {t("home.features.badge")}
                            </motion.div>
                            <motion.h3
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                className="text-5xl md:text-7xl font-black tracking-tight leading-[1] text-slate-900"
                            >
                                {t("home.features.title")} <br />
                                <span className="text-indigo-600">{t("home.features.titleAccent")}</span>
                            </motion.h3>
                        </div>

                        {/* Floating Accent 1 - Ink Bottle / Pen */}
                        <div className="absolute -left-10 top-1/2 w-40 h-40 opacity-20 pointer-events-none parallax-img select-none">
                            <img
                                src="https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?q=80&w=1962&auto=format&fit=crop"
                                alt="Ink detail"
                                className="w-full h-full object-contain rotate-12"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            {[
                                {
                                    icon: <Languages size={32} />,
                                    title: t("home.feature1.title"),
                                    desc: t("home.feature1.desc")
                                },
                                {
                                    icon: <Zap size={32} />,
                                    title: t("home.feature2.title"),
                                    desc: t("home.feature2.desc")
                                },
                                {
                                    icon: <MessageSquare size={32} />,
                                    title: t("home.feature3.title"),
                                    desc: t("home.feature3.desc")
                                }
                            ].map((feature, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: i * 0.1 }}
                                    className="group relative bg-white/50 backdrop-blur-sm p-12 rounded-[3rem] border border-slate-100 hover:border-indigo-100/50 hover:shadow-[0_20px_50px_rgba(0,0,0,0.04)] transition-all flex flex-col items-start text-left overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative z-10 w-full">
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600 mb-10 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                            {feature.icon}
                                        </div>
                                        <h4 className="text-2xl font-black mb-6 text-slate-900 transition-all tracking-tight leading-tight uppercase">{feature.title}</h4>
                                        <p className="text-slate-600 text-lg leading-relaxed font-medium transition-colors">{feature.desc}</p>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Testimonial Section */}
                <section className="py-48 bg-white overflow-hidden">
                    <div className="max-w-6xl mx-auto px-8 text-center relative">
                        <div className="absolute -top-24 left-1/2 -translate-x-1/2 text-slate-100/50 font-black text-[20rem] select-none -z-10 leading-none">
                            "
                        </div>
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.02 }}
                            className="relative z-10 cursor-default"
                        >
                            <h3 className="text-4xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight mb-16 italic">
                                "{t("app.name")} transformed our reach overnight. We went from a local startup to a <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-8">borderless brand</span> without hiring a single translator."
                            </h3>
                            <div className="flex flex-col items-center">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-2xl mb-6 group-hover:scale-110 transition-transform flex items-center justify-center border-4 border-white">
                                    <User size={48} className="text-white" />
                                </div>
                                <p className="text-xl font-black tracking-tighter text-slate-900 italic">Shlok Jadhav</p>
                                <p className="text-sm font-black text-slate-600 uppercase tracking-[0.15em] mt-2">Product Lead</p>
                                <p className="text-sm font-semibold text-slate-500 leading-relaxed tracking-wide mt-1">Where Technology Meets Human Experience</p>
                            </div>
                        </motion.div>

                        {/* Floating Accent 2 - Typewriter Key / Paper */}
                        <div className="absolute -right-20 bottom-0 w-60 h-60 opacity-10 pointer-events-none parallax-img select-none" style={{ transform: 'rotate(-5deg)' }}>
                            <img
                                src="https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=2070&auto=format&fit=crop"
                                alt="Paper detail"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="max-w-7xl mx-auto px-8 pb-40">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="bg-slate-900 rounded-[3rem] p-16 md:p-32 text-center relative overflow-hidden shadow-2xl shadow-indigo-100 transition-all duration-1000 group"
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.1),transparent)] transition-transform duration-1000 group-hover:scale-110" />
                        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full" />

                        <div className="relative z-10">
                            <h3 className="text-5xl md:text-8xl font-black text-white mb-10 tracking-tighter leading-none">
                                {t("home.cta.title")} <br />
                                <span className="text-indigo-100 drop-shadow-lg">{t("home.cta.titleAccent")}</span>
                            </h3>
                            <p className="text-white/90 mb-16 text-2xl max-w-3xl mx-auto font-black leading-relaxed">
                                {t("home.cta.desc")}
                            </p>
                            <div className="flex flex-wrap justify-center gap-6">
                                <motion.button
                                    whileHover={{ scale: 1.05, y: -5, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleGetStarted}
                                    className="bg-white text-indigo-900 px-12 py-6 rounded-[2.5rem] font-black text-xl shadow-2xl active:scale-95 transition-all"
                                >
                                    {t("home.cta.button")}
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05, y: -5, backgroundColor: "rgba(255,255,255,0.1)" }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate('/blog')}
                                    className="bg-indigo-700/50 backdrop-blur-md text-white border border-white/40 px-12 py-6 rounded-[2.5rem] font-black text-xl active:scale-95 transition-all"
                                >
                                    {t("home.cta.readBlog")}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* Footer */}
                <footer className="bg-slate-900 pt-32 pb-16 text-white relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[150px] rounded-full pointer-events-none" />

                    <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-start gap-20 relative z-10">
                        <div className="max-w-md">
                            <motion.div
                                className="flex items-center gap-3 mb-8 group cursor-pointer w-fit"
                                onClick={() => navigate('/')}
                            >
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-900 shadow-xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                    <BookOpen size={24} />
                                </div>
                                <span className="text-4xl font-black tracking-tight text-white uppercase group-hover:text-indigo-400 transition-all duration-500">{t("app.name")}</span>
                            </motion.div>
                            <p className="text-slate-300 text-lg font-black leading-relaxed mb-10">
                                {t("footer.text")}
                            </p>
                            <div className="flex gap-4">
                                {[1, 2, 3, 4].map(i => (
                                    <motion.div
                                        key={i}
                                        whileHover={{ y: -5, borderColor: "#6366f1" }}
                                        className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 hover:bg-slate-700/50 transition-all cursor-pointer flex items-center justify-center group"
                                    >
                                        <div className="w-5 h-5 bg-slate-500 rounded-lg group-hover:bg-gradient-premium transition-all" />
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-16 md:gap-32 w-full lg:w-auto">
                            <div className="flex flex-col gap-8">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">{t("home.footer.product")}</span>
                                <div className="flex flex-col gap-5 text-slate-300 font-black">
                                    <span className="hover:text-white hover:translate-x-2 cursor-pointer transition-all w-fit">AI Writing</span>
                                    <span className="hover:text-white hover:translate-x-2 cursor-pointer transition-all w-fit">Translations</span>
                                    <span className="hover:text-white hover:translate-x-2 cursor-pointer transition-all w-fit">Analytics</span>
                                    <span className="hover:text-white hover:translate-x-2 cursor-pointer transition-all w-fit">API Access</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-8">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">{t("home.footer.company")}</span>
                                <div className="flex flex-col gap-5 text-slate-300 font-black">
                                    <span className="hover:text-white hover:translate-x-2 cursor-pointer transition-all w-fit">About Us</span>
                                    <span className="hover:text-white hover:translate-x-2 cursor-pointer transition-all w-fit">Careers</span>
                                    <span className="hover:text-white hover:translate-x-2 cursor-pointer transition-all w-fit">Contact</span>
                                    <span className="hover:text-white hover:translate-x-2 cursor-pointer transition-all w-fit">Brand Kit</span>
                                </div>
                            </div>
                            <div className="hidden lg:flex flex-col gap-8">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">{t("home.footer.legal")}</span>
                                <div className="flex flex-col gap-5 text-slate-300 font-black">
                                    <span className="hover:text-white hover:translate-x-2 cursor-pointer transition-all w-fit">Privacy Policy</span>
                                    <span className="hover:text-white hover:translate-x-2 cursor-pointer transition-all w-fit">Terms of Service</span>
                                    <span className="hover:text-white hover:translate-x-2 cursor-pointer transition-all w-fit">Cookie Policy</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto px-8 mt-32 pt-16 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-slate-400">{t("home.footer.allSystems")}</span>
                        </div>
                        <div className="flex gap-8">
                            <span className="hover:text-indigo-400 transition-colors cursor-pointer">Lingo.dev</span>
                            <span className="hover:text-indigo-400 transition-colors cursor-pointer">Supabase</span>
                            <span className="hover:text-indigo-400 transition-colors cursor-pointer">PostgreSQL</span>
                        </div>
                        <span className="text-slate-600">{t("footer.rights").replace('{{year}}', new Date().getFullYear())}</span>
                    </div>
                </footer>
            </div>
        </PremiumBackground>
    );
}
