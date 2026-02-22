import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PenTool, BookOpen, LogIn, LogOut, User, Sparkles, Loader2, Clock, ArrowRight, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLingo, useLingoLocale } from "lingo.dev/react/client";
import { supabase } from '../lib/supabase';
import { translateContent } from '../lib/lingo';
import AuthModal from '../components/AuthModal';
import LanguageSelector from '../components/LanguageSelector';
import PremiumBackground from '../components/PremiumBackground';

const stripHtmlTags = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
};

export default function BlogLanding() {
    const navigate = useNavigate();
    const { dictionary } = useLingo();
    const locale = useLingoLocale();
    const { user, signOut } = useAuth();

    const t = (key) => dictionary?.[key] || key;

    const [posts, setPosts] = useState([]);
    const [translatedPosts, setTranslatedPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        const fetchPosts = async () => {
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching posts:', error);
            } else {
                console.log("Fetched posts:", data);
                setPosts(data);
                setTranslatedPosts(data); // Initialize with original data
            }
            setLoading(false);
        };
        fetchPosts();
    }, []);

    const handleWriteClick = () => {
        if (!user) {
            setIsAuthModalOpen(true);
        } else {
            navigate('/editor');
        }
    };

    // Translation Logic
    useEffect(() => {
        const translateAllPosts = async () => {
            if (posts.length === 0) return;

            // If target matches source or default, arguably we could skip, 
            // but we need to check per post because each post might have a different base_lang.
            // Actually, we can just map through everything.

            const newTranslatedPosts = await Promise.all(
                posts.map(async (post) => {
                    // Optimization: if lang matches, return original
                    if (post.base_lang === locale) return post;

                    // Otherwise translate title and content
                    // We can batch this if the SDK supports it, but for now we do individual
                    // or we reuse the `translateContent` helper which takes an object.

                    try {
                        // Translate title
                        const translatedTitle = await translateContent(post.title, post.base_lang, locale);
                        // Translate content (preview) - maybe only translate first X characters for performance?
                        // For now, translate whole content to be safe and accurate.
                        const translatedContent = await translateContent(post.content, post.base_lang, locale);

                        return {
                            ...post,
                            title: translatedTitle,
                            content: translatedContent
                        };
                    } catch (err) {
                        console.error("Translation failed for post", post.id, err);
                        return post; // Fallback to original
                    }
                })
            );
            setTranslatedPosts(newTranslatedPosts);
        };

        translateAllPosts();
    }, [posts, locale]);

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-8 py-5 flex justify-between items-center">
                    <motion.div
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => navigate('/')}
                        whileHover={{ scale: 1.05 }}
                    >
                        <div className="w-12 h-12 bg-slate-900 rounded-[1.25rem] flex items-center justify-center shadow-lg transition-all duration-500 group-hover:bg-indigo-600">
                            <BookOpen className="text-white" size={24} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight transition-all duration-500">
                            {t("app.name")}
                        </h1>
                    </motion.div>

                    <div className="flex items-center gap-6">
                        <LanguageSelector
                            currentLocale={locale}
                            className="w-48"
                        />

                        {user ? (
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleWriteClick}
                                    className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-7 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-slate-200 hover:-translate-y-1 active:scale-95"
                                >
                                    <PenTool size={18} />
                                    {t("nav.write")}
                                </button>
                                <div className="flex items-center gap-4 bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100">
                                    <div className="w-9 h-9 bg-white shadow-sm border border-slate-100 rounded-xl flex items-center justify-center">
                                        <User size={18} className="text-indigo-600" />
                                    </div>
                                    <span className="text-sm font-black text-slate-700 hidden md:block">{user.email?.split('@')[0]}</span>
                                    <button
                                        onClick={signOut}
                                        className="text-slate-400 hover:text-red-600 transition-colors"
                                        title="Sign Out"
                                    >
                                        <LogOut size={18} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setIsAuthModalOpen(true)}
                                    className="px-6 py-3 text-sm font-black text-slate-500 hover:text-slate-900 transition-all uppercase tracking-widest"
                                >
                                    {t("nav.login")}
                                </button>
                                <button
                                    onClick={handleWriteClick}
                                    className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-100 hover:-translate-y-1 active:scale-95"
                                >
                                    <PenTool size={18} />
                                    {t("ui.createFirst")}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

            <header className="py-20 text-center relative overflow-hidden z-10">
                <PremiumBackground />
                <div className="max-w-5xl mx-auto px-8">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12 flex flex-col items-center gap-6"
                    >
                        <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-200">
                            <BookOpen className="text-white" size={48} />
                        </div>
                        <div>
                            <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight mb-2">
                                Blog
                            </h1>
                            <p className="text-sm md:text-base text-indigo-600 font-black uppercase tracking-[0.15em]">
                                {t("app.name")}
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-8"
                    >
                        <Sparkles size={12} fill="currentColor" className="animate-pulse" />
                        {t("landing.badge")}
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-5xl md:text-7xl font-black mb-8 tracking-tighter leading-[1.1] text-slate-900"
                    >
                        Write Once.<br/>
                        <span className="bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
                            Read in Any Language
                        </span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-lg md:text-xl text-slate-600 mb-6 leading-relaxed font-semibold max-w-3xl mx-auto"
                    >
                        {t("hero.subtitle")}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-3xl p-8 md:p-10 max-w-2xl mx-auto mb-12"
                    >
                        <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-3">
                            <Globe size={20} className="text-indigo-600" />
                            About Our Platform
                        </h3>
                        <p className="text-slate-700 font-semibold leading-relaxed mb-4">
                            Welcome to our AI-Powered Multilingual Blog Platform! We break down language barriers to help you reach a global audience. Share your ideas, stories, and knowledge once, and let our advanced AI automatically translate your content into multiple languages in real-time.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-indigo-200">
                            <div className="text-center">
                                <div className="text-2xl font-black text-indigo-600 mb-1">∞</div>
                                <p className="text-xs font-black text-slate-600 uppercase tracking-wider">Global Reach</p>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-black text-indigo-600 mb-1">⚡</div>
                                <p className="text-xs font-black text-slate-600 uppercase tracking-wider">Real-Time AI</p>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-black text-indigo-600 mb-1">🌏</div>
                                <p className="text-xs font-black text-slate-600 uppercase tracking-wider">Multi-Language</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-8 pb-32">
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {loading ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-32 gap-6 bg-slate-50/50 rounded-[3rem] border border-slate-100">
                            <div className="relative">
                                <Loader2 className="animate-spin text-indigo-600" size={48} />
                                <div className="absolute inset-0 blur-xl bg-indigo-400/20 animate-pulse"></div>
                            </div>
                            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] animate-pulse">{t("ui.loading")}</p>
                        </div>
                    ) : translatedPosts.length > 0 ? (
                        translatedPosts.map((post, i) => (
                            <motion.article
                                key={post.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="group relative overflow-hidden bg-white p-10 rounded-[2.5rem] cursor-pointer transition-all hover:-translate-y-2 border border-slate-100 hover:border-indigo-200 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] flex flex-col h-full"
                                onClick={() => navigate(`/post/${post.id}`)}
                            >
                                <div className="flex-1 relative z-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-indigo-100">
                                            {post.base_lang}
                                        </span>
                                        <div className="flex items-center gap-2 text-slate-600 font-black text-[10px] uppercase tracking-widest">
                                            <Clock size={12} className="text-indigo-500" />
                                            {new Date(post.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <h3 className="text-3xl font-black mb-6 text-slate-900 group-hover:text-indigo-600 transition-all duration-300 tracking-tight leading-tight">
                                        {post.title}
                                    </h3>
                                    <p className="text-slate-600 line-clamp-4 leading-relaxed font-black mb-8">
                                        {stripHtmlTags(post.content)}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                                    <div className="flex items-center gap-3 text-indigo-600 font-black text-xs uppercase tracking-widest group-hover:gap-5 transition-all">
                                        <span>{t("post.readMore")}</span>
                                        <ArrowRight size={18} />
                                    </div>
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-indigo-400 group-hover:bg-indigo-50 transition-all border border-transparent group-hover:border-indigo-100">
                                        <BookOpen size={20} />
                                    </div>
                                </div>
                            </motion.article>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-32 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                            <div className="w-20 h-20 bg-white shadow-sm border border-slate-100 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                                <BookOpen className="text-slate-200" size={40} />
                            </div>
                            <p className="text-3xl font-black text-slate-900 mb-4">{t("ui.empty")}</p>
                            <p className="text-slate-400 font-bold mb-10">{t("landing.emptySubtitle")}</p>
                            <button
                                onClick={() => navigate('/editor')}
                                className="bg-slate-900 hover:bg-slate-800 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-slate-200 hover:-translate-y-1 active:scale-95"
                            >
                                {t("ui.createFirst")}
                            </button>
                        </div>
                    )}
                </section>
            </main>

            <footer className="bg-slate-50 py-24 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-8 text-center">
                    <div className="flex items-center justify-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
                            <Globe size={20} className="text-slate-400" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t("app.name")}</h2>
                    </div>
                    <p className="text-slate-400 font-bold max-w-md mx-auto mb-10 text-sm leading-relaxed">
                        {t("footer.text")}
                    </p>
                    <div className="flex justify-center flex-wrap gap-6 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
                        <span className="hover:text-indigo-600 transition-colors cursor-pointer">Powered by Lingo.dev</span>
                        <span className="text-slate-200">•</span>
                        <span className="hover:text-indigo-600 transition-colors cursor-pointer">Supabase</span>
                        <span className="text-slate-200">•</span>
                        <span className="hover:text-indigo-600 transition-colors cursor-pointer">Artificial Intelligence</span>
                    </div>
                    <div className="mt-16 text-[10px] font-bold text-slate-400">
                        {t("landing.rights").replace('{{year}}', new Date().getFullYear())}
                    </div>
                </div>
            </footer>
        </div>
    );
}
