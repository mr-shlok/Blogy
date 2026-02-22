import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { LANGUAGES } from '../lingo/dictionary';
import { setLingoLocale, useLingoLocale, useLingo } from 'lingo.dev/react/client';

export default function LanguageSelector({ currentLocale, onChange, className = "", position = "bottom" }) {
    const { dictionary } = useLingo();
    const t = (key) => dictionary?.[key] || key;
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const lingoLocale = useLingoLocale();

    // Use passed-in currentLocale if provided, otherwise fall back to the lingo locale
    const effectiveLocale = currentLocale || lingoLocale || 'en';
    const activeLang = LANGUAGES.find(l => l.code === effectiveLocale) || LANGUAGES[0];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (code) => {
        // Update lingo locale globally so all t() keys re-render
        setLingoLocale(code);
        // Also call the parent's onChange if provided
        if (onChange) onChange(code);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-3 bg-white border border-slate-100 rounded-2xl px-5 py-3 hover:border-indigo-200 transition-all shadow-sm hover:shadow-md group active:scale-95"
            >
                <div className="flex items-center gap-3">
                    <Globe size={18} className="text-indigo-500 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-black text-slate-900 tracking-tight">{activeLang.nativeName}</span>
                </div>
                <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: position === 'bottom' ? 20 : -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: position === 'bottom' ? 20 : -20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                        className={`absolute ${position === 'bottom' ? 'top-full mt-4' : 'bottom-full mb-4'} left-0 w-full min-w-[240px] bg-white border border-slate-100 rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] z-[100] py-4 overflow-hidden overflow-y-auto max-h-80 custom-scrollbar`}
                    >
                        <style dangerouslySetInnerHTML={{
                            __html: `
                            .custom-scrollbar::-webkit-scrollbar {
                                width: 5px;
                            }
                            .custom-scrollbar::-webkit-scrollbar-track {
                                background: transparent;
                            }
                            .custom-scrollbar::-webkit-scrollbar-thumb {
                                background: #f1f5f9;
                                border-radius: 10px;
                            }
                            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                                background: #e2e8f0;
                            }
                        ` }} />
                        <div className="px-4 mb-3">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-2">{t("ui.selectLanguage")}</p>
                        </div>
                        {LANGUAGES.map((lang, i) => (
                            <motion.button
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.03 }}
                                key={lang.code}
                                type="button"
                                onClick={() => handleSelect(lang.code)}
                                className={`w-full flex items-center justify-between px-6 py-3.5 text-sm transition-all hover:bg-slate-50 group ${effectiveLocale === lang.code ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-900'
                                    }`}
                            >
                                <div className="flex flex-col items-start text-left">
                                    <span className={`font-black tracking-tight ${effectiveLocale === lang.code ? 'text-indigo-600' : 'text-slate-700'}`}>{lang.nativeName}</span>
                                    <span className="text-[10px] font-black opacity-50 uppercase tracking-[0.1em]">{lang.name}</span>
                                </div>
                                {effectiveLocale === lang.code && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="bg-indigo-600 p-1 rounded-full shadow-lg shadow-indigo-100"
                                    >
                                        <Check size={10} strokeWidth={4} className="text-white" />
                                    </motion.div>
                                )}
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
