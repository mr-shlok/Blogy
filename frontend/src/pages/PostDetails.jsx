import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useLingo, useLingoLocale, setLingoLocale } from "lingo.dev/react/client";
import {
    ArrowLeft, MessageSquare, ThumbsUp, Share2, Send, Sparkles, Wand2,
    Languages, BookOpen, Download, FileText, Link, Globe, Trash2, X,
    Play, Volume2, Maximize2, LogIn, LogOut, User, Loader2, Paperclip,
    Image, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LanguageSelector from '../components/LanguageSelector';
import AuthModal from '../components/AuthModal';
import Grammy from '../components/Grammy';
import { translateContent } from '../lib/lingo';
import { generateSummary, summarizeComments } from '../lib/ai';
import PremiumBackground from '../components/PremiumBackground';


export default function PostDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { dictionary } = useLingo();
    const currentLocale = useLingoLocale();
    const setLocale = setLingoLocale;

    const [post, setPost] = useState(null);
    const [translatedPost, setTranslatedPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');

    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const { user, signOut } = useAuth();
    const [loading, setLoading] = useState(true);
    const [translating, setTranslating] = useState(false);
    const [feedbackSummary, setFeedbackSummary] = useState('');
    const [postSummary, setPostSummary] = useState('');
    const [summarizing, setSummarizing] = useState(false);
    const [summarizingPost, setSummarizingPost] = useState(false);
    const [attachmentSummaries, setAttachmentSummaries] = useState({});
    const [summarizingAttachment, setSummarizingAttachment] = useState({});
    const [readerOpen, setReaderOpen] = useState(false);
    const [readingContent, setReadingContent] = useState('');
    const [readingTitle, setReadingTitle] = useState('');
    const [loadingReader, setLoadingReader] = useState(false);


    const t = (key) => {
        return dictionary && dictionary[key] ? dictionary[key] : key;
    };

    useEffect(() => {
        fetchPost();
        fetchComments();
    }, [id]);

    useEffect(() => {
        if (post) {
            handleTranslation();
        }
    }, [currentLocale, post]);

    const fetchPost = async () => {
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching post:', error);
            navigate('/');
        } else {
            // Ensure metadata is a proper object
            let processedData = { ...data };
            if (!processedData.metadata) {
                processedData.metadata = { attachments: [] };
            } else if (typeof data.metadata === 'string') {
                try {
                    processedData.metadata = JSON.parse(data.metadata);
                } catch (e) {
                    console.error('Error parsing metadata:', e);
                    processedData.metadata = { attachments: [] };
                }
            }
            // Ensure attachments is always an array
            if (!Array.isArray(processedData.metadata?.attachments)) {
                processedData.metadata.attachments = [];
            }

            setPost(processedData);
            setTranslatedPost(processedData);
        }
    };

    const fetchComments = async () => {
        const { data, error } = await supabase
            .from('comments')
            .select('*')
            .eq('blog_id', id)
            .order('created_at', { ascending: true });


        if (error) {
            console.error('Error fetching comments:', error);
        } else {
            setComments(data);
        }
        setLoading(false);
    };

    const handleTranslation = async () => {
        if (!post) return;
        if (post.base_lang === currentLocale) {
            setTranslatedPost(post);
            return;
        }

        setTranslating(true);
        const translated = await translateContent(
            { title: post.title, content: post.content },
            post.base_lang,
            currentLocale
        );
        setTranslatedPost({ ...post, ...translated });
        setTranslating(false);
    };

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!newComment || !user) {
            if (!user) setIsAuthModalOpen(true);
            return;
        }

        const { data, error } = await supabase
            .from('comments')
            .insert([{
                blog_id: id,
                user_id: user.id,
                comment_text: newComment,
                original_language: currentLocale || 'en'
            }])
            .select();


        if (!error) {
            setComments([...comments, data[0]]);
            setNewComment('');
        }
    };

    const handleSummarizeFeedback = async () => {
        setSummarizing(true);
        const summary = await summarizeComments(comments, currentLocale);
        setFeedbackSummary(summary);
        setSummarizing(false);
    };

    const handleSummarizePost = async () => {
        if (!post) return;
        setSummarizingPost(true);
        const summary = await generateSummary(post.content, currentLocale);
        setPostSummary(summary);
        setSummarizingPost(false);
    };

    const handleReadDocument = async (attach) => {
        setReadingTitle(attach.name);
        setReaderOpen(true);
        setLoadingReader(true);
        setReadingContent('');

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/extract-text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileUrl: attach.url,
                    fileName: attach.name
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to extract content');
            }

            if (data.content) {
                setReadingContent(data.content);
            } else {
                setReadingContent('No readable content found in this document.');
            }
        } catch (error) {
            console.error('Extraction failed:', error);
            setReadingContent(`Failed to load document content: ${error.message}. Please ensure the document is public and try again.`);
        } finally {
            setLoadingReader(false);
        }
    };

    const handleAttachmentSummary = async (attach) => {
        if (summarizingAttachment[attach.url]) return;

        setSummarizingAttachment(prev => ({ ...prev, [attach.url]: true }));
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/summarize-document`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileUrl: attach.url,
                    fileName: attach.name,
                    locale: currentLocale || 'en'
                })
            });

            if (response.ok) {
                const data = await response.json();
                setAttachmentSummaries(prev => ({ ...prev, [attach.url]: data.response }));
            }
        } catch (error) {
            console.error('Attachment summary failed:', error);
        } finally {
            setSummarizingAttachment(prev => ({ ...prev, [attach.url]: false }));
        }
    };

    const getYouTubeId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    if (loading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">{t("ui.loading")}</div>;

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-700 pb-20 relative">
            <PremiumBackground />
            {/* Nav */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
                <div className="max-w-4xl mx-auto px-8 py-5 flex justify-between items-center">
                    <motion.button
                        whileHover={{ x: -10 }}
                        onClick={() => navigate('/')}
                        className="group flex items-center gap-3 text-slate-600 hover:text-indigo-600 transition-all font-black uppercase tracking-widest text-[10px] bg-white px-5 py-2.5 rounded-xl border border-slate-100 hover:border-indigo-100 shadow-sm hover:shadow-md"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        {t("editor.back")}
                    </motion.button>
                    <div className="flex items-center gap-5">
                        <select
                            value={currentLocale || ""}
                            onChange={(e) => setLocale(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer hover:bg-slate-100"
                        >
                            <option value="en">English (US)</option>
                            <option value="hi">Hindi (हिंदी)</option>
                            <option value="ja">Japanese (日本語)</option>
                            <option value="fr">French (Français)</option>
                            <option value="es">Spanish (Español)</option>
                        </select>

                        {user ? (
                            <div className="flex items-center gap-5 pl-5 border-l border-slate-100">
                                <span className="text-xs font-black text-slate-600 uppercase tracking-widest hidden md:block">{user.email?.split('@')[0]}</span>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={signOut}
                                    className="p-2.5 bg-slate-50 hover:bg-red-50 hover:text-red-500 text-slate-400 rounded-xl transition-all border border-slate-100 hover:border-red-100"
                                    title="Sign Out"
                                >
                                    <LogOut size={18} />
                                </motion.button>
                            </div>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsAuthModalOpen(true)}
                                className="bg-slate-900 hover:bg-slate-800 text-white px-7 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-slate-200"
                            >
                                <LogIn size={14} className="inline mr-2" />
                                {t("nav.login")}
                            </motion.button>
                        )}
                    </div>
                </div>
            </nav>

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />


            <main className="max-w-4xl mx-auto px-8 py-16 space-y-12">
                <article className="bg-white border border-slate-100 rounded-[3rem] p-10 md:p-16 shadow-2xl shadow-slate-200/50 relative overflow-hidden z-20">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-900"></div>

                    <div className="flex items-center gap-4 mb-10">
                        <span className="bg-indigo-600/10 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                            {post.base_lang} <ChevronRight size={10} className="inline mx-1" /> {currentLocale}
                        </span>
                        {translating && (
                            <span className="flex items-center gap-2 text-indigo-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
                                <Globe size={14} /> {t("post.translating")}
                            </span>
                        )}
                    </div>

                    <h1 className="text-4xl md:text-7xl font-black mb-12 leading-[1.1] text-slate-900 tracking-tight">
                        {translatedPost.title}
                    </h1>

                    <div className="flex items-center gap-5 mb-16 pb-8 border-b border-slate-100">
                        <div className="w-14 h-14 bg-slate-900 rounded-[1.25rem] flex items-center justify-center font-black text-white text-xl shadow-lg ring-4 ring-white transition-all">
                            {post.user_id?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div>
                            <p className="font-black text-slate-900 text-lg tracking-tight">{t("post.author")}</p>
                            <p className="text-slate-600 text-xs font-black uppercase tracking-widest mt-1">
                                {new Date(post.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} • {t("post.readTime").replace('{{count}}', 5)}
                            </p>
                        </div>
                    </div>

                    <div className="text-xl md:text-2xl leading-[1.6] text-slate-700 whitespace-pre-wrap mb-16 font-black selection:bg-indigo-100 selection:text-indigo-700">
                        {translatedPost.content}
                    </div>

                    {/* Attachments Section */}
                    {post.metadata?.attachments?.length > 0 && (
                        <div className="space-y-8 pt-10 border-t border-slate-50">
                            <h4 className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-3 text-slate-400">
                                <Paperclip size={16} className="text-indigo-500" />
                                {t("post.attachments")}
                            </h4>
                            <div className="grid grid-cols-1 gap-8">
                                {post.metadata.attachments.map((attach, idx) => {
                                    const ytId = attach.type === 'link' ? getYouTubeId(attach.url) : null;
                                    const isDocLink = attach.type === 'link' && (attach.url.toLowerCase().endsWith('.pdf') || attach.url.toLowerCase().endsWith('.docx'));

                                    return (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="bg-slate-50 border border-slate-100 rounded-[2.5rem] overflow-hidden hover:border-indigo-200 transition-all group/card shadow-sm hover:shadow-xl hover:-translate-y-1"
                                        >
                                            {/* Photo UI */}
                                            {attach.type === 'photo' && (
                                                <div className="relative aspect-[16/10] overflow-hidden">
                                                    <img
                                                        src={attach.url}
                                                        alt={attach.name}
                                                        className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-1000"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
                                                    <div className="absolute bottom-6 left-8 flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/30">
                                                            <Image size={20} />
                                                        </div>
                                                        <span className="text-sm font-black text-white uppercase tracking-widest">{attach.name}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Video UI */}
                                            {attach.type === 'video' && (
                                                <div className="aspect-[16/10] bg-slate-900 relative group/video">
                                                    <video src={attach.url} controls className="w-full h-full" />
                                                </div>
                                            )}

                                            {/* YouTube UI */}
                                            {attach.type === 'link' && ytId && (
                                                <div className="aspect-video">
                                                    <iframe
                                                        width="100%"
                                                        height="100%"
                                                        src={`https://www.youtube.com/embed/${ytId}`}
                                                        title="YouTube video player"
                                                        frameBorder="0"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                        allowFullScreen
                                                    ></iframe>
                                                </div>
                                            )}

                                            {/* Generic / Doc Link */}
                                            {attach.type === 'link' && !ytId && (
                                                <div
                                                    className={`p-8 flex items-start gap-6 transition-all ${isDocLink ? 'cursor-pointer hover:bg-white' : ''}`}
                                                    onClick={() => isDocLink && handleReadDocument(attach)}
                                                >
                                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg border ${isDocLink ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                        {isDocLink ? <FileText size={32} /> : <Link size={32} />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h5 className="font-black text-xl mb-1 truncate text-slate-900">{attach.name}</h5>
                                                        <p className={`text-xs break-all mb-4 font-bold ${isDocLink ? 'text-emerald-600/70' : 'text-slate-400'}`}>{attach.url}</p>
                                                        {isDocLink && (
                                                            <span className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg font-black uppercase tracking-widest flex items-center gap-2 w-fit border border-indigo-100">
                                                                <BookOpen size={12} /> {t("post.interactiveReader")}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Document Asset */}
                                            {attach.type === 'document' && (
                                                <div className="flex flex-col">
                                                    <div className="p-8 flex items-start gap-6 cursor-pointer hover:bg-white transition-all" onClick={() => handleReadDocument(attach)}>
                                                        <div className="w-16 h-16 bg-emerald-50 rounded-[1.25rem] flex items-center justify-center text-emerald-600 flex-shrink-0 shadow-lg border border-emerald-100">
                                                            <FileText size={32} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h5 className="font-black text-2xl mb-1 truncate text-slate-900">{attach.name}</h5>
                                                            <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-6">{t("post.verifiedAsset")}</p>
                                                            <div className="flex items-center gap-4">
                                                                <button onClick={(e) => { e.stopPropagation(); handleReadDocument(attach); }} className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-indigo-100">
                                                                    <BookOpen size={16} /> {t("post.openReader")}
                                                                </button>
                                                                <a href={attach.url} download onClick={(e) => e.stopPropagation()} className="flex items-center gap-3 bg-white hover:bg-slate-50 text-slate-600 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border border-slate-200">
                                                                    <Download size={16} /> {t("post.download")}
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {attach.url.toLowerCase().endsWith('.pdf') && (
                                                        <div className="mx-8 mb-8 h-[600px] border border-slate-100 rounded-[2rem] overflow-hidden bg-white shadow-inner">
                                                            <iframe src={`${attach.url}#toolbar=0`} className="w-full h-full" title="PDF Document" />
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* AI Analysis Footer */}
                                            <div className="px-8 pb-8 flex flex-col gap-6">
                                                {(attach.type === 'document' || attach.type === 'link') && (
                                                    <div className="bg-white p-6 rounded-3xl border border-slate-100 relative group/summary shadow-sm">
                                                        {attachmentSummaries[attach.url] ? (
                                                            <div className="space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                                                        <Sparkles size={12} /> {t("post.aiInsights")}
                                                                    </span>
                                                                    <button onClick={() => setAttachmentSummaries(prev => { const n = { ...prev }; delete n[attach.url]; return n; })} className="text-slate-300 hover:text-red-500 transition-colors">
                                                                        <X size={16} />
                                                                    </button>
                                                                </div>
                                                                <p className="text-slate-600 text-sm leading-relaxed font-medium italic">"{attachmentSummaries[attach.url]}"</p>
                                                            </div>
                                                        ) : (
                                                            <button onClick={() => handleAttachmentSummary(attach)} disabled={summarizingAttachment[attach.url]} className="w-full flex items-center justify-center gap-3 py-4 bg-slate-50 hover:bg-indigo-50 text-indigo-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-slate-100 hover:border-indigo-100 disabled:opacity-50">
                                                                {summarizingAttachment[attach.url] ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                                                {summarizingAttachment[attach.url] ? t("post.analyzing") : t("post.generateSummary")}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full ${attach.type === 'photo' ? 'bg-pink-400' : attach.type === 'video' ? 'bg-purple-400' : attach.type === 'link' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                                                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{attach.type} {t("editor.asset")}</span>
                                                    </div>
                                                    <a href={attach.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-black uppercase tracking-widest text-[9px] transition-colors">
                                                        <Globe size={14} /> {t("post.viewSource")}
                                                    </a>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </article>

                {/* AI Post Insights Section */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl shadow-slate-200 relative overflow-hidden group cursor-default"
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.15),transparent)] group-hover:scale-110 transition-transform duration-1000"></div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                        <div>
                            <div className="flex items-center gap-4 mb-3">
                                <motion.div
                                    whileHover={{ rotate: 360 }}
                                    transition={{ duration: 0.8 }}
                                    className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20"
                                >
                                    <Sparkles className="text-indigo-200" size={24} />
                                </motion.div>
                                <div>
                                    <h4 className="text-2xl font-black tracking-tight">{t("post.aiSummaryTitle")}</h4>
                                    <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mt-1">{t("post.aiSummarySubtitle")}</p>
                                </div>
                            </div>
                            {!postSummary && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleSummarizePost}
                                    disabled={summarizingPost}
                                    className="px-6 py-3 bg-white hover:bg-slate-50 text-indigo-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl disabled:opacity-50"
                                >
                                    {summarizingPost ? t("post.summarizing") : t("post.generateInsights")}
                                </motion.button>
                            )}
                        </div>

                        <AnimatePresence mode="wait">
                            {postSummary ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    <p className="text-xl leading-relaxed text-slate-100 font-black italic">"{postSummary}"</p>
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => setPostSummary('')} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">{t("post.dismissSummary")}</button>
                                        <button onClick={handleSummarizePost} className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-colors">{t("post.regenerate")}</button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-slate-400 text-sm font-black italic border-l-2 border-white/10 pl-6"
                                >
                                    {t("post.aiHelpText")}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Discussion Section */}
                <section className="space-y-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
                        <div>
                            <h3 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                                <MessageSquare className="text-indigo-600" size={36} />
                                {t("post.discussion")}
                            </h3>
                            <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-xs">{t("post.participants").replace('{{count}}', comments.length)}</p>
                        </div>
                        <button
                            onClick={handleSummarizeFeedback}
                            disabled={summarizing || comments.length === 0}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 transition-all border border-indigo-100"
                        >
                            {summarizing ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                            {summarizing ? t("post.analyzingFeedback") : t("post.synthesizeFeedback")}
                        </button>
                    </div>

                    <AnimatePresence>
                        {feedbackSummary && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-slate-200 relative group overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                                    <Sparkles size={80} />
                                </div>
                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">{t("post.aiConsensus")}</span>
                                    <button onClick={() => setFeedbackSummary('')} className="text-slate-500 hover:text-white transition-colors shadow-none"><X size={18} /></button>
                                </div>
                                <p className="text-xl leading-relaxed font-bold italic text-slate-100">"{feedbackSummary}"</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="bg-white border border-slate-100 p-10 rounded-[3rem] shadow-xl shadow-slate-100/50">
                        {!user ? (
                            <div className="mb-10 p-6 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col md:flex-row items-center gap-6 justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-2xl shadow-sm"><LogIn className="text-indigo-600" /></div>
                                    <p className="text-slate-600 font-black uppercase tracking-widest text-[10px]">{t("post.signToParticipate")}</p>
                                </div>
                                <button
                                    onClick={() => setIsAuthModalOpen(true)}
                                    className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all whitespace-nowrap"
                                >
                                    {t("post.signInNow")}
                                </button>
                            </div>
                        ) : (
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">{t("post.postPerspective")}</h4>
                        )}
                        <form onSubmit={handlePostComment} className="space-y-8">
                            <div className="relative group">
                                <textarea
                                    placeholder={user ? t("post.commentPlaceholder") : t("post.commentDisabled")}
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    disabled={!user}
                                    className="bg-slate-50 border border-slate-100 rounded-3xl px-8 py-6 w-full h-40 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 resize-none transition-all placeholder-slate-300 font-bold text-slate-900 text-lg disabled:opacity-50"
                                />
                                <div className="absolute bottom-6 right-8 flex items-center gap-2">
                                    <div className="bg-white/80 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {t("post.activeLocale")} {currentLocale}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                                    <Globe size={16} className="text-indigo-500" />
                                    {t("post.aiDistribution")}
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newComment || !user}
                                    className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-10 py-4.5 rounded-[1.25rem] font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-4 transition-all shadow-xl shadow-slate-200 hover:-translate-y-1 active:scale-95"
                                >
                                    <Send size={18} />
                                    {t("post.publishInsights")}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="space-y-8">
                        {comments.length === 0 ? (
                            <div className="text-center py-20 bg-slate-50 border border-dashed border-slate-200 rounded-[3rem]">
                                <MessageSquare size={48} className="text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">{t("post.noResponses")}</p>
                            </div>
                        ) : (
                            comments.map((comment) => (
                                <CommentItem key={comment.id} comment={comment} targetLocale={currentLocale} />
                            ))
                        )}
                    </div>
                </section>
            </main>
            {/* Document Reader Modal */}
            <AnimatePresence>
                {readerOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setReaderOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-6xl h-full bg-white border border-slate-200 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between gap-6 bg-white/80 backdrop-blur-md">
                                <div className="flex items-center gap-5 min-w-0">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 flex-shrink-0 border border-indigo-100">
                                        <BookOpen size={24} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-black text-xl truncate text-slate-900 tracking-tight">{readingTitle}</h3>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{t("dashboard.reader.title")}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setReaderOpen(false)}
                                    className="p-3 hover:bg-red-50 hover:text-red-500 text-slate-400 rounded-2xl transition-all border border-transparent hover:border-red-100"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-10 md:p-20 custom-scrollbar bg-slate-50/30">
                                {loadingReader ? (
                                    <div className="h-full flex flex-col items-center justify-center gap-6 py-20">
                                        <div className="relative">
                                            <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <FileText size={28} className="text-indigo-600 animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-black text-slate-900 tracking-tight">{t("post.extractingInsights")}</p>
                                            <p className="text-slate-400 font-medium text-sm mt-1">{t("post.aiProcessing")}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="max-w-4xl mx-auto">
                                        <div className="mb-12 p-8 bg-indigo-600 rounded-[2.5rem] shadow-xl shadow-indigo-100 flex items-start gap-5 text-white">
                                            <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl mt-1">
                                                <Sparkles size={20} />
                                            </div>
                                            <div>
                                                <p className="text-lg leading-relaxed font-medium italic">
                                                    {t("post.extractionComplete")}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="whitespace-pre-wrap text-xl text-slate-700 leading-bold font-medium selection:bg-indigo-100 selection:text-indigo-700">
                                            {readingContent}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-8 border-t border-slate-100 bg-white flex items-center justify-between">
                                <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.3em]">{t("post.endOfStream")}</p>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setReaderOpen(false)} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all">{t("post.closeReader")}</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            ` }} />
            <Grammy mode="viewer" baseLang={currentLocale} />
        </div>
    );
}

function CommentItem({ comment, targetLocale }) {
    const { dictionary } = useLingo();
    const t = (key) => dictionary?.[key] || key;
    const [displayContent, setDisplayContent] = useState(comment.comment_text);
    const [translating, setTranslating] = useState(false);

    useEffect(() => {
        const translateComment = async () => {
            if (targetLocale === comment.original_language) {
                setDisplayContent(comment.comment_text);
                return;
            }
            setTranslating(true);
            const translated = await translateContent(comment.comment_text, comment.original_language, targetLocale);
            setDisplayContent(translated);
            setTranslating(false);
        };
        translateComment();
    }, [targetLocale, comment.comment_text]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:border-indigo-100 group"
        >
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-50">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-all">
                        <User size={24} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <div>
                        <p className="font-black text-slate-900 tracking-tight">{t("post.postBy")} {comment.user_id?.slice(0, 5) || t("post.anonymous")}</p>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">
                            {new Date(comment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>
                </div>
                <div className="bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all">
                    {comment.original_language}
                </div>
            </div>
            <div className="relative min-h-[1.5rem]">
                <AnimatePresence mode="wait">
                    {translating ? (
                        <motion.div
                            key="translating"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-3 text-indigo-500 text-[10px] font-black uppercase tracking-widest"
                        >
                            <Loader2 size={14} className="animate-spin" />
                            {t("post.syncSemantics")}
                        </motion.div>
                    ) : (
                        <motion.p
                            key="content"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-slate-600 leading-relaxed font-medium text-lg"
                        >
                            {displayContent}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

