import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLingo, useLingoLocale, setLingoLocale } from "lingo.dev/react/client";
import { LANGUAGES } from '../lingo/dictionary';
import { Mail, Lock, Loader2, Github, BookOpen, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomCursor from '../components/CustomCursor';

export default function Signup() {
    const navigate = useNavigate();
    const { user, signUp, signInWithGoogle, signInWithGithub } = useAuth();
    const { dictionary } = useLingo();
    const locale = useLingoLocale();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const [cursorX, setCursorX] = useState(0);
    const [cursorY, setCursorY] = useState(0);
    const [cursorVisible, setCursorVisible] = useState(false);

    const t = (key) => dictionary?.[key] || key;

    useEffect(() => {
        if (user) navigate('/dashboard');
    }, [user, navigate]);

    useEffect(() => {
        let lastUpdateTime = 0;
        const throttleDelay = 50;

        const handleMouseMove = (e) => {
            const now = Date.now();
            if (now - lastUpdateTime > throttleDelay) {
                setCursorX(e.clientX);
                setCursorY(e.clientY);
                setCursorVisible(true);
                lastUpdateTime = now;
            }
        };

        const handleMouseLeave = () => {
            setCursorVisible(false);
        };

        document.addEventListener('mousemove', handleMouseMove, { passive: true });
        document.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await signUp(email, password);
            if (error) throw error;
            if (data?.user && !data?.session) {
                alert('Signup successful! Please check your email to confirm your account.');
                navigate('/login');
                return;
            }
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOAuth = async (provider) => {
        setLoading(true);
        setError(null);
        try {
            const { error } = provider === 'google'
                ? await signInWithGoogle()
                : await signInWithGithub();
            if (error) throw error;
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <>
            <CustomCursor x={cursorX} y={cursorY} isVisible={cursorVisible} />
            <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col selection:bg-indigo-100 selection:text-indigo-700">
            <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-8 py-5 flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg transition-all duration-500 group-hover:bg-indigo-600">
                            <BookOpen className="text-white" size={22} />
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 transition-all duration-500 uppercase">{t("app.name")}</h1>
                    </Link>
                    <div className="flex items-center gap-4">
                        <select
                            value={locale || 'en'}
                            onChange={(e) => setLingoLocale(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer hover:bg-slate-100"
                        >
                            {LANGUAGES.map(l => (
                                <option key={l.code} value={l.code}>{l.nativeName}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </nav>

            <div className="flex-1 flex items-center justify-center p-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="w-full max-w-md relative"
                >
                    <Link to="/" className="inline-flex items-center gap-3 text-slate-500 hover:text-indigo-600 mb-10 transition-all group font-black uppercase tracking-widest text-[10px]">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span>{t("editor.back")}</span>
                    </Link>

                    <div className="bg-white border border-slate-200 rounded-[2rem] p-10 md:p-12 shadow-2xl shadow-slate-200/40 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600"></div>

                        <h2 className="text-3xl font-extrabold mb-2 text-slate-900 tracking-tight">{t("nav.signup")}</h2>
                        <p className="text-slate-500 font-medium mb-10 text-sm">{t("auth.signupSubtitle")}</p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">{t("auth.emailLabel")}</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600/50 bg-white transition-all font-semibold text-slate-900 placeholder:text-slate-300"
                                        placeholder="name@example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">{t("auth.passwordLabel")}</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600/50 bg-white transition-all font-semibold text-slate-900 placeholder:text-slate-300"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">{t("auth.confirmPasswordLabel")}</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600/50 bg-white transition-all font-semibold text-slate-900 placeholder:text-slate-400"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-red-600 text-[11px] font-bold bg-red-50 p-4 rounded-xl border border-red-100 uppercase tracking-wider text-center"
                                >
                                    {error}
                                </motion.p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:translate-y-0"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <span className="uppercase tracking-widest text-xs">{t("nav.signup")}</span>}
                            </button>
                        </form>

                        <div className="relative my-10">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-100"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px]">
                                <span className="px-5 bg-white text-slate-400 font-bold uppercase tracking-[0.2em]">{t("auth.joinMovement")}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <motion.button
                                whileHover={{ scale: 1.02, y: -1 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleOAuth('google')}
                                disabled={loading}
                                className="flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-bold py-3.5 rounded-xl transition-all border border-slate-200 hover:border-slate-300 shadow-sm disabled:opacity-50 text-[10px] uppercase tracking-widest"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Google
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02, y: -1 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleOAuth('github')}
                                disabled={loading}
                                className="flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all border border-slate-900 shadow-md disabled:opacity-50 text-[10px] uppercase tracking-widest"
                            >
                                <Github size={16} />
                                GitHub
                            </motion.button>
                        </div>

                        <div className="mt-10 text-center">
                            <p className="text-slate-500 font-medium text-sm">
                                {t("auth.alreadyHaveAccount")}{' '}
                                <Link to="/login" className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors ml-1">
                                    {t("nav.login")}
                                </Link>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            <footer className="py-10 text-center relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">{t("footer.rights").replace('{{year}}', new Date().getFullYear())}</p>
            </footer>
            </div>
        </>
    );
}
