import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Volume2, Wand2, ArrowRight, X, GripHorizontal,
    Check, Languages, ChevronDown, BookOpen, HelpCircle,
    RefreshCw, AlignLeft, Globe, Cpu, Zap
} from 'lucide-react';
import { useLingo } from 'lingo.dev/react/client';
import { LANGUAGES } from '../lingo/dictionary';

export default function Grammy({ mode = 'viewer', onReplace, baseLang = 'en' }) {
    const { dictionary } = useLingo();
    const t = (key) => dictionary?.[key] || key;
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [selectedText, setSelectedText] = useState('');
    const [loading, setLoading] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    const [targetLang, setTargetLang] = useState(baseLang);
    const [activeTab, setActiveTab] = useState('options'); // 'options', 'translate-select', 'refine-select', 'result', 'explanation'
    const [ipaEnabled, setIpaEnabled] = useState(false);
    const [ipaText, setIpaText] = useState('');


    const widgetRef = useRef(null);

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

    useEffect(() => {
        const handleSelection = (e) => {
            if (widgetRef.current && widgetRef.current.contains(e.target)) return;

            setTimeout(() => {
                let text = '';
                let rect = null;
                const selection = window.getSelection();
                const activeEl = document.activeElement;

                if (selection && selection.toString().trim().length > 1) {
                    text = selection.toString().trim();
                    try {
                        const range = selection.getRangeAt(0);
                        rect = range.getBoundingClientRect();
                    } catch (err) { console.warn('Range capture failed:', err); }
                }

                if (!text && activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT')) {
                    const start = activeEl.selectionStart;
                    const end = activeEl.selectionEnd;
                    if (start !== end && (end - start) > 1) {
                        text = activeEl.value.substring(start, end).trim();
                        rect = activeEl.getBoundingClientRect();
                    }
                }

                if (text && rect) {
                    setPosition({
                        x: Math.min(window.innerWidth - 340, Math.max(20, (rect.left + rect.right) / 2 - 160 + window.scrollX)),
                        y: rect.top + window.scrollY - 180
                    });
                    setSelectedText(text);
                    setIsVisible(true);
                    setAiResult(null);
                    setActiveTab('options');
                    setIpaText('');
                } else {
                    if (!widgetRef.current?.contains(document.activeElement)) {
                        setIsVisible(false);
                    }
                }
            }, 100);
        };

        document.addEventListener('mouseup', handleSelection);
        return () => document.removeEventListener('mouseup', handleSelection);
    }, []);

    const handleClose = (e) => {
        e?.stopPropagation();
        setIsVisible(false);
    };

    const handleRead = () => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(selectedText);
        const VOICE_LOCALE_MAP = {
            en: 'en-US', hi: 'hi-IN', ar: 'ar-SA', fr: 'fr-FR', de: 'de-DE',
            zh: 'zh-CN', ja: 'ja-JP', es: 'es-ES', it: 'it-IT', pt: 'pt-PT', ko: 'ko-KR'
        };
        utterance.lang = VOICE_LOCALE_MAP[targetLang] || targetLang;
        window.speechSynthesis.speak(utterance);
    };

    const fetchIPA = async () => {
        if (ipaText) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/grammy/phonetic`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: selectedText })
            });
            const data = await res.json();
            setIpaText(data.ipa);
        } catch (e) { console.error('IPA failed', e); }
    };

    const handleTranslate = async (code) => {
        setLoading(true);
        setActiveTab('result');
        setTargetLang(code);
        try {
            const response = await fetch(`${BACKEND_URL}/api/grammy/translate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: selectedText, targetLang: code })
            });
            const data = await response.json();
            setAiResult({ type: 'translated', text: data.translatedText, lang: code });
        } catch (error) {
            console.error('Translation failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefine = async (tone) => {
        setLoading(true);
        setActiveTab('result');
        try {
            const response = await fetch(`${BACKEND_URL}/api/grammy/refine`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: selectedText, tone, locale: targetLang })
            });
            const data = await response.json();
            setAiResult({ type: 'refined', text: data.refinedText, tone });
        } catch (error) {
            console.error('Refinement failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExplain = async () => {
        setLoading(true);
        setActiveTab('explanation');
        try {
            const response = await fetch(`${BACKEND_URL}/api/grammy/explain`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: selectedText, locale: targetLang })
            });
            const data = await response.json();
            setAiResult({ type: 'explanation', text: data.explanation });
        } catch (error) {
            console.error('Explain failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (onReplace && aiResult?.text) {
            onReplace(aiResult.text);
            setIsVisible(false);
        }
    };



    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    ref={widgetRef}
                    drag
                    dragMomentum={false}
                    initial={{ opacity: 0, scale: 0.9, y: 10, rotateX: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    style={{ position: 'absolute', left: position.x, top: position.y, zIndex: 1000, perspective: '1000px' }}
                    className="w-[340px] bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] overflow-hidden text-slate-900 cursor-default ring-1 ring-white/50"
                    onMouseUp={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Glassmorphic Header */}
                    <div className="bg-slate-50/80 px-6 py-5 flex items-center justify-between border-b border-slate-100 cursor-move">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200/50">
                                <Zap size={18} fill="currentColor" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">{t("ai.nucleus.selection")}</span>
                                <span className="text-[11px] font-black text-slate-900 tracking-tight">{t("ai.nucleus.suite")}</span>
                            </div>
                        </div>
                        <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-slate-100 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all shadow-sm group">
                            <X size={14} className="group-hover:rotate-90 transition-transform" />
                        </button>
                    </div>

                    <div className="p-7 min-h-[280px] flex flex-col justify-between">
                        {activeTab === 'options' && (
                            <div className="space-y-7 animate-in fade-in slide-in-from-bottom-3 duration-500">
                                <div className="p-5 bg-slate-50/50 rounded-3xl text-sm italic text-slate-600 line-clamp-2 border border-slate-100/50 font-medium leading-relaxed relative overflow-hidden group">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500/20 group-hover:bg-indigo-500 transition-colors" />
                                    "{selectedText}"
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => setActiveTab('translate-select')} className="flex items-center gap-4 p-4 rounded-3xl bg-white border border-slate-100 hover:bg-blue-50 hover:border-blue-100 transition-all group shadow-sm hover:shadow-md">
                                        <div className="w-10 h-10 rounded-2xl bg-blue-100/50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                            <Globe size={20} />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-600">{t("ai.nucleus.translate")}</span>
                                            <span className="text-[11px] font-bold text-slate-900">{t("ai.nucleus.multiLang")}</span>
                                        </div>
                                    </button>

                                    <button onClick={() => setActiveTab('refine-select')} className="flex items-center gap-4 p-4 rounded-3xl bg-white border border-slate-100 hover:bg-purple-50 hover:border-purple-100 transition-all group shadow-sm hover:shadow-md">
                                        <div className="w-10 h-10 rounded-2xl bg-purple-100/50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                            <Wand2 size={20} />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-purple-600">{t("ai.nucleus.refine")}</span>
                                            <span className="text-[11px] font-bold text-slate-900">{t("ai.nucleus.advanced")}</span>
                                        </div>
                                    </button>

                                    <button onClick={handleExplain} className="flex items-center gap-4 p-4 rounded-3xl bg-white border border-slate-100 hover:bg-emerald-50 hover:border-emerald-100 transition-all group shadow-sm hover:shadow-md">
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-100/50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                            <HelpCircle size={20} />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-emerald-600">{t("ai.nucleus.explain")}</span>
                                            <span className="text-[11px] font-bold text-slate-900">{t("ai.nucleus.contextual")}</span>
                                        </div>
                                    </button>

                                    <div className="flex flex-col gap-2">
                                        <button onClick={handleRead} className="flex-1 flex items-center gap-4 p-4 rounded-3xl bg-white border border-slate-100 hover:bg-amber-50 hover:border-amber-100 transition-all group shadow-sm hover:shadow-md">
                                            <div className="w-10 h-10 rounded-2xl bg-amber-100/50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                                                <Volume2 size={20} />
                                            </div>
                                            <div className="flex flex-col items-start">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-amber-600">{t("ai.nucleus.phonics")}</span>
                                                <span className="text-[11px] font-bold text-slate-900">{t("ai.nucleus.speech")}</span>
                                            </div>
                                        </button>
                                        <div className="flex items-center justify-between px-2">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">{t("ai.nucleus.ipaMode")}</span>
                                            <button
                                                onClick={() => { setIpaEnabled(!ipaEnabled); if (!ipaEnabled) fetchIPA(); }}
                                                className={`w-8 h-4 rounded-full transition-all relative ${ipaEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                            >
                                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${ipaEnabled ? 'left-4.5' : 'left-0.5'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                {ipaEnabled && ipaText && (
                                    <div className="p-3 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl text-[10px] font-mono text-center text-indigo-700 animate-in zoom-in-95 duration-300">
                                        {ipaText}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'translate-select' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("ai.nucleus.target")}</span>
                                    <button onClick={() => setActiveTab('options')} className="text-[9px] font-black text-indigo-600 uppercase hover:underline">{t("ui.back")}</button>
                                </div>
                                <div className="grid grid-cols-3 gap-2 grammy-lang-grid overflow-y-auto max-h-56 p-1">
                                    {LANGUAGES.map(lang => (
                                        <button
                                            key={lang.code}
                                            onClick={() => handleTranslate(lang.code)}
                                            className="flex flex-col items-center gap-1 p-3 rounded-2xl border border-slate-100 hover:bg-indigo-50 hover:border-indigo-200 transition-all"
                                        >
                                            <span className="text-lg">{lang.flag || '🌐'}</span>
                                            <span className="text-[9px] font-black text-slate-800 line-clamp-1">{lang.nativeName}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'refine-select' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("ai.nucleus.selectTone")}</span>
                                    <button onClick={() => setActiveTab('options')} className="text-[9px] font-black text-indigo-600 uppercase hover:underline">{t("ui.back")}</button>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {[
                                        { id: 'Professional', icon: <BookOpen size={18} />, color: 'blue', desc: t("ai.nucleus.tone.professionalDesc"), label: t("ai.nucleus.tone.professional") },
                                        { id: 'Creative', icon: <Zap size={18} />, color: 'purple', desc: t("ai.nucleus.tone.creativeDesc"), label: t("ai.nucleus.tone.creative") },
                                        { id: 'Concise', icon: <AlignLeft size={18} />, color: 'emerald', desc: t("ai.nucleus.tone.conciseDesc"), label: t("ai.nucleus.tone.concise") }
                                    ].map(tone => (
                                        <button
                                            key={tone.id}
                                            onClick={() => handleRefine(tone.id)}
                                            className="flex items-center gap-4 p-4 rounded-3xl bg-white border border-slate-100 hover:bg-slate-50 hover:border-indigo-200 transition-all group"
                                        >
                                            <div className={`w-10 h-10 rounded-2xl bg-${tone.color}-100/50 flex items-center justify-center text-${tone.color}-600`}>
                                                {tone.icon}
                                            </div>
                                            <div className="flex flex-col items-start text-left">
                                                <span className="text-[11px] font-black text-slate-900 uppercase tracking-wide">{tone.label}</span>
                                                <span className="text-[10px] font-medium text-slate-400">{tone.desc}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(activeTab === 'result' || activeTab === 'explanation') && (
                            <div className="space-y-6 flex flex-col h-full">
                                {loading ? (
                                    <div className="flex-1 flex flex-col items-center justify-center gap-6 py-10">
                                        <div className="relative">
                                            <div className="w-16 h-16 border-4 border-indigo-50 border-t-indigo-600 rounded-full animate-spin" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Cpu size={20} className="text-indigo-600 animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-900">{t("ai.nucleus.processing")}</p>
                                            <p className="text-[10px] font-medium text-slate-400 mt-1">{t("ai.nucleus.neuralActive")}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden flex flex-col">
                                        <div className="flex-1 p-6 bg-indigo-50/40 border border-indigo-100/50 rounded-[2rem] text-[13px] leading-relaxed max-h-60 overflow-y-auto font-medium text-slate-700 shadow-inner scrollbar-hide">
                                            {aiResult?.text}
                                        </div>

                                        <div className="flex gap-3">
                                            {mode === 'writer' && activeTab === 'result' && (
                                                <button
                                                    onClick={handleApply}
                                                    className="flex-1 flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-200 hover:-translate-y-1 active:scale-95"
                                                >
                                                    <Check size={16} strokeWidth={3} /> {t("ai.nucleus.apply")}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setActiveTab('options')}
                                                className="flex-1 flex items-center justify-center gap-3 bg-white border border-slate-100 hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 p-4 rounded-2xl transition-all"
                                            >
                                                <RefreshCw size={14} /> {t("ui.back")}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            <style>{`
                .grammy-lang-grid::-webkit-scrollbar { width: 4px; }
                .grammy-lang-grid::-webkit-scrollbar-track { background: transparent; }
                .grammy-lang-grid::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 99px; }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </AnimatePresence>
    );
}
