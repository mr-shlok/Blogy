import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLingo, useLingoLocale, setLingoLocale } from "lingo.dev/react/client";
import { LANGUAGES } from '../lingo/dictionary';
import { translateContent } from '../lib/lingo';
import axiosInstance from '../lib/axios';
import {
    generateTitle, generateSEODescription, generateHashtags,
    generateSummary, improveWriting
} from '../lib/ai';
import {
    BookOpen, PenTool, LogOut, User, Send, Globe, Sparkles,
    MessageSquare, ChevronLeft, ChevronRight, Plus, FileText,
    List, Hash, AlignLeft, Type, Loader2, Wand2, RefreshCw,
    Edit2, Trash2, Mic, Square, Play, Volume2, Clock, Check,
    Zap, Quote, Image, Video, Link, Paperclip, X
} from 'lucide-react';
import Grammy from '../components/Grammy';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSelector from '../components/LanguageSelector';
import PremiumBackground from '../components/PremiumBackground';

const stripHtmlTags = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
};

export default function Dashboard() {
    const navigate = useNavigate();
    const { user, loading: authLoading, signOut } = useAuth();
    const { dictionary } = useLingo();
    const locale = useLingoLocale();

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeView, setActiveView] = useState('create');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [baseLang, setBaseLang] = useState('en');
    const [publishing, setPublishing] = useState(false);

    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [postSummary, setPostSummary] = useState('');
    const [summarizing, setSummarizing] = useState(false);

    const [aiLoading, setAiLoading] = useState({});
    const [aiResults, setAiResults] = useState({});
    const [aiErrors, setAiErrors] = useState({});
    const [attachments, setAttachments] = useState([]);
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');

    // Management & Voice State
    const [isEditing, setIsEditing] = useState(false);
    const [editingPostId, setEditingPostId] = useState(null);
    const [speakingPostId, setSpeakingPostId] = useState(null);
    const [attachmentSummaries, setAttachmentSummaries] = useState({});
    const [summarizingAttachment, setSummarizingAttachment] = useState({});
    const [readerOpen, setReaderOpen] = useState(false);
    const [loadingReader, setLoadingReader] = useState(false);
    const [readingTitle, setReadingTitle] = useState('');
    const [readingContent, setReadingContent] = useState('');
    
    const [cursorX, setCursorX] = useState(0);
    const [cursorY, setCursorY] = useState(0);
    const [cursorVisible, setCursorVisible] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Write your story...',
            }),
        ],
        content: content,
        onUpdate: ({ editor }) => {
            setContent(editor.getHTML());
        },
    });

    // Update editor content if state changes (e.g. when editing a post)
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [isEditing, editingPostId]); // Only sync when switching posts/modes to avoid cycles

    const t = (key) => dictionary?.[key] || key;

    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
    }, [user, authLoading, navigate]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        if (user) fetchPosts();
    }, [user]);

    useEffect(() => {
        let lastX = 0;
        let lastY = 0;
        let rafId = null;

        const handleMouseMove = (e) => {
            if (!rafId) {
                rafId = requestAnimationFrame(() => {
                    setCursorX(e.clientX);
                    setCursorY(e.clientY);
                    setCursorVisible(true);
                    rafId = null;
                });
            }
        };

        const handleMouseLeave = () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            setCursorVisible(false);
        };

        document.addEventListener('mousemove', handleMouseMove, { passive: true });
        document.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    const fetchPosts = async () => {
        setLoadingPosts(true);
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });
        if (!error) setPosts(data || []);
        setLoadingPosts(false);
    };

    const handlePublish = async (e) => {
        e.preventDefault();
        if (!title || !content) return;
        setPublishing(true);

        const postData = {
            title,
            content,
            base_lang: baseLang,
            user_id: user.id,
            metadata: { attachments }
        };

        let result;
        if (isEditing && editingPostId) {
            result = await supabase
                .from('posts')
                .update(postData)
                .eq('id', editingPostId)
                .select();
        } else {
            result = await supabase
                .from('posts')
                .insert([postData])
                .select();
        }

        if (!result.error && result.data) {
            setTitle('');
            setContent('');
            setAttachments([]);
            setAiResults({});
            setIsEditing(false);
            setEditingPostId(null);
            fetchPosts();
            setActiveView('posts');
        } else {
            console.error('Publishing failed:', result.error);
        }
        setPublishing(false);
    };

    const handleDelete = async (postId) => {
        if (!window.confirm(t("ui.confirmDelete") || "Are you sure you want to delete this post?")) return;
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId);

        if (!error) {
            setPosts(posts.filter(p => p.id !== postId));
            if (selectedPost?.id === postId) {
                setActiveView('posts');
                setSelectedPost(null);
            }
        } else {
            console.error('Delete failed:', error);
        }
    };

    const handleEdit = (post) => {
        setTitle(post.title);
        setContent(post.content);
        setBaseLang(post.base_lang);
        setAttachments(post.metadata?.attachments || []);
        setIsEditing(true);
        setEditingPostId(post.id);
        setActiveView('create');
    };

    const handleSpeech = (post) => {
        if (speakingPostId === post.id) {
            window.speechSynthesis.cancel();
            setSpeakingPostId(null);
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(`${post.title}. ${post.content}`);
        utterance.lang = post.base_lang === 'en' ? 'en-US' : post.base_lang;
        utterance.onend = () => setSpeakingPostId(null);
        utterance.onerror = () => setSpeakingPostId(null);

        setSpeakingPostId(post.id);
        window.speechSynthesis.speak(utterance);
    };

    const handleAttachmentSummary = async (attach) => {
        if (summarizingAttachment[attach.url]) return;

        setSummarizingAttachment(prev => ({ ...prev, [attach.url]: true }));
        try {
            const { data } = await axiosInstance.post('/api/summarize-document', {
                fileUrl: attach.url,
                fileName: attach.name,
                locale: locale || 'en'
            });
            setAttachmentSummaries(prev => ({ ...prev, [attach.url]: data.response }));
        } catch (error) {
            console.error('Attachment summary failed:', error);
        } finally {
            setSummarizingAttachment(prev => ({ ...prev, [attach.url]: false }));
        }
    };

    const handleReadDocument = async (attach) => {
        setReadingTitle(attach.name);
        setReaderOpen(true);
        setLoadingReader(true);
        setReadingContent('');

        try {
            const { data } = await axiosInstance.post('/api/extract-text', {
                fileUrl: attach.url,
                fileName: attach.name
            });

            if (data.content) {
                setReadingContent(data.content);
            } else {
                setReadingContent('No readable content found in this document.');
            }
        } catch (error) {
            console.error('Extraction failed:', error);
            setReadingContent(`Failed to load document content: ${error.response?.data?.message || error.message}. Please ensure the document is public and try again.`);
        } finally {
            setLoadingReader(false);
        }
    };

    const selectPost = async (post) => {
        setSelectedPost(post);
        setActiveView('detail');
        setPostSummary('');
        const { data } = await supabase
            .from('comments')
            .select('*')
            .eq('blog_id', post.id)
            .order('created_at', { ascending: true });
        setComments(data || []);
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!newComment || !selectedPost) return;
        const { data, error } = await supabase
            .from('comments')
            .insert([{
                blog_id: selectedPost.id,
                user_id: user.id,
                comment_text: newComment,
                original_language: locale || 'en'
            }])
            .select();
        if (!error && data) {
            setComments([...comments, data[0]]);
            setNewComment('');
        }
    };

    const handleSummarize = async () => {
        if (!selectedPost) return;
        setSummarizing(true);
        const summary = await generateSummary(selectedPost.content, locale);
        setPostSummary(summary);
        setSummarizing(false);
    };

    const handleAI = async (type) => {
        setAiLoading(prev => ({ ...prev, [type]: true }));
        setAiErrors(prev => ({ ...prev, [type]: null }));
        try {
            const topic = title || content.slice(0, 200);

            if (type === 'improve') {
                const improved = await improveWriting(content, baseLang);
                if (improved && improved !== content) {
                    setContent(improved);
                    if (editor) editor.commands.setContent(improved);
                    setAiResults(prev => ({ ...prev, improve: improved }));
                }
            } else {
                let result;
                if (type === 'title') {
                    result = await generateTitle(topic, baseLang);
                    if (result) setTitle(result);
                    setAiResults(prev => ({ ...prev, title: result }));
                } else if (type === 'seo') {
                    result = await generateSEODescription(topic, baseLang);
                    setAiResults(prev => ({ ...prev, seo: result }));
                } else if (type === 'hashtags') {
                    result = await generateHashtags(topic, baseLang);
                    setAiResults(prev => ({ ...prev, hashtags: result }));
                } else if (type === 'summary') {
                    result = await generateSummary(topic, baseLang);
                    setAiResults(prev => ({ ...prev, summary: result }));
                }
            }
        } catch (err) {
            const errorMessage = err.message || 'An error occurred. Please try again.';
            console.error(`AI ${type} failed:`, err);
            setAiErrors(prev => ({ ...prev, [type]: errorMessage }));
        }
        setAiLoading(prev => ({ ...prev, [type]: false }));
    };

    const handleFileUpload = async (event, type) => {
        const file = event.target.files[0];
        if (!file) return;

        setPublishing(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            let { error: uploadError } = await supabase.storage
                .from('blog-attachments')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('blog-attachments')
                .getPublicUrl(filePath);

            setAttachments(prev => [...prev, { type, url: publicUrl, name: file.name }]);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Error uploading file: ' + error.message);
        } finally {
            setPublishing(false);
        }
    };


    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    return (
        <PremiumBackground contentClassName="flex">
            <CustomCursor x={cursorX} y={cursorY} isVisible={cursorVisible} />


            <AnimatePresence>
                {sidebarOpen && (
                    <motion.aside
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="w-[280px] min-h-screen bg-white border-r border-slate-100 flex flex-col fixed left-0 top-0 z-40 shadow-xl shadow-slate-200/50"
                    >
                        <div className="p-6 border-b border-slate-50">
                            <motion.div
                                className="flex items-center gap-3 cursor-pointer group"
                                onClick={() => navigate('/')}
                                whileHover={{ y: -2 }}
                            >
                                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg transition-all duration-500 group-hover:bg-indigo-600">
                                    <BookOpen className="text-white" size={20} />
                                </div>
                                <span className="text-2xl font-black text-slate-900 tracking-tight transition-all duration-500 uppercase">Blogy</span>
                            </motion.div>
                        </div>

                        <div className="p-4 border-b border-slate-50">
                            <motion.div
                                whileHover={{ y: -2, boxShadow: "0 8px 24px -4px rgba(99,102,241,0.2)" }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setActiveView('profile')}
                                className={`flex items-center gap-3 rounded-2xl p-3 border cursor-pointer transition-all ${activeView === 'profile' ? 'bg-indigo-50 border-indigo-100 shadow-sm' : 'bg-slate-50 border-slate-100 shadow-sm hover:border-indigo-100'}`}
                            >
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <User size={18} className="text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-slate-900 truncate">{user?.email?.split('@')[0]}</p>
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Premium Member</p>
                                </div>
                                <ChevronRight size={14} className="text-slate-300 shrink-0" />
                            </motion.div>
                        </div>

                        <nav className="flex-1 p-4 space-y-1">
                            <SidebarItem
                                icon={<Plus size={18} />}
                                label={t("nav.createPost")}
                                active={activeView === 'create'}
                                onClick={() => setActiveView('create')}
                            />
                            <SidebarItem
                                icon={<FileText size={18} />}
                                label={t("nav.myPosts")}
                                active={activeView === 'myposts'}
                                onClick={() => { setActiveView('myposts'); setIsEditing(false); fetchPosts(); }}
                            />
                            <SidebarItem
                                icon={<List size={18} />}
                                label={t("nav.allPosts")}
                                active={activeView === 'posts'}
                                onClick={() => { setActiveView('posts'); setIsEditing(false); fetchPosts(); }}
                            />
                        </nav>

                        <div className="p-4 border-t border-slate-50 space-y-3">
                            <LanguageSelector
                                currentLocale={locale}
                                onChange={(val) => setLingoLocale(val)}
                                position="top"
                                className="w-full"
                            />
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all text-sm font-black"
                            >
                                <LogOut size={18} />
                                {t("nav.logout")}
                            </button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-[280px]' : 'ml-0'} relative z-10`}>
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100">
                    <div className="px-8 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-2.5 hover:bg-slate-50 text-slate-600 hover:text-indigo-600 rounded-xl transition-all border border-transparent hover:border-slate-100"
                            >
                                {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                            </motion.button>
                            <div>
                                <h2 className="text-lg font-black tracking-tighter text-slate-900 leading-none">{t("dashboard.title")}</h2>
                                <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] mt-1">{activeView}</p>
                            </div>
                        </div>
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm"
                        >
                            <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                            <span className="text-xs font-black text-slate-800 tracking-wide uppercase">
                                {t("dashboard.welcome")}, <span className="text-indigo-600">{user?.email?.split('@')[0]}</span>
                            </span>
                        </motion.div>
                    </div>
                </header>

                <main className="p-8 pb-32 max-w-7xl mx-auto">
                    {activeView === 'create' && (
                        <CreatePostView
                            title={title}
                            setTitle={setTitle}
                            content={content}
                            setContent={setContent}
                            baseLang={baseLang}
                            setBaseLang={setBaseLang}
                            publishing={publishing}
                            handlePublish={handlePublish}
                            aiLoading={aiLoading}
                            aiResults={aiResults}
                            aiErrors={aiErrors}
                            handleAI={handleAI}
                            attachments={attachments}
                            setAttachments={setAttachments}
                            handleFileUpload={handleFileUpload}
                            showLinkInput={showLinkInput}
                            setShowLinkInput={setShowLinkInput}
                            linkUrl={linkUrl}
                            setLinkUrl={setLinkUrl}
                            isEditing={isEditing}
                            onCancel={() => {
                                setIsEditing(false);
                                setEditingPostId(null);
                                setTitle('');
                                setContent('');
                                setAttachments([]);
                                setActiveView('posts');
                            }}
                            t={t}
                            editor={editor}
                        />
                    )}

                    {activeView === 'profile' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-3xl mx-auto space-y-8"
                        >
                            {/* Profile Header */}
                            <div className="relative rounded-[2.5rem] overflow-hidden bg-slate-900 p-10 shadow-2xl">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/60 via-violet-900/40 to-slate-900" />
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(99,102,241,0.3),transparent_60%)]" />
                                <div className="relative z-10 flex items-center gap-6">
                                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-900/50">
                                        <User size={36} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black text-white tracking-tight">{user?.email?.split('@')[0]}</h2>
                                        <p className="text-indigo-400 text-sm font-black uppercase tracking-widest mt-1">{user?.email}</p>
                                        <div className="flex items-center gap-2 mt-3">
                                            <span className="bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">⭐ {t("dashboard.account.premium")}</span>
                                            <span className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">● Active</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-4">
                                {[{
                                    label: t("dashboard.stats.totalPosts"),
                                    value: posts.length,
                                    icon: <FileText size={22} className="text-indigo-500" />,
                                    color: 'from-indigo-50 to-blue-50',
                                    border: 'border-indigo-100'
                                }, {
                                    label: t("dashboard.stats.myPosts"),
                                    value: posts.filter(p => p.user_id === user?.id).length,
                                    icon: <PenTool size={22} className="text-violet-500" />,
                                    color: 'from-violet-50 to-purple-50',
                                    border: 'border-violet-100'
                                }, {
                                    label: t("dashboard.stats.languages"),
                                    value: [...new Set(posts.filter(p => p.user_id === user?.id).map(p => p.base_lang))].length || 1,
                                    icon: <Globe size={22} className="text-emerald-500" />,
                                    color: 'from-emerald-50 to-teal-50',
                                    border: 'border-emerald-100'
                                }].map((stat, i) => (
                                    <motion.div
                                        key={i}
                                        whileHover={{ y: -4, boxShadow: '0 16px 32px -8px rgba(99,102,241,0.15)' }}
                                        className={`bg-gradient-to-br ${stat.color} border ${stat.border} rounded-2xl p-6 text-center transition-all`}
                                    >
                                        <div className="flex justify-center mb-3">{stat.icon}</div>
                                        <p className="text-4xl font-black text-slate-900">{stat.value}</p>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{stat.label}</p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Recent Activity */}
                            <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm">
                                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2"><Clock size={18} className="text-indigo-500" /> {t("dashboard.activity.title")}</h3>
                                <div className="space-y-3">
                                    {posts.filter(p => p.user_id === user?.id).slice(0, 5).map((post, i) => (
                                        <motion.div
                                            key={post.id}
                                            whileHover={{ x: 4 }}
                                            onClick={() => selectPost(post)}
                                            className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 cursor-pointer transition-all border border-transparent hover:border-slate-100 group"
                                        >
                                            <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                                                <span className="text-xs font-black text-indigo-600">{i + 1}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{post.title || 'Untitled'}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                            </div>
                                            <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0" />
                                        </motion.div>
                                    ))}
                                    {posts.filter(p => p.user_id === user?.id).length === 0 && (
                                        <p className="text-center text-sm text-slate-400 font-black py-8">{t("dashboard.activity.noPosts")}</p>
                                    )}
                                </div>
                            </div>

                            {/* Account Info */}
                            <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm">
                                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2"><User size={18} className="text-indigo-500" /> {t("dashboard.account.title")}</h3>
                                <div className="space-y-4">
                                    {[{ label: t("dashboard.account.email"), value: user?.email }, { label: t("dashboard.account.username"), value: user?.email?.split('@')[0] }, { label: t("dashboard.account.plan"), value: t("dashboard.account.premium") }, { label: t("dashboard.account.id"), value: user?.id?.slice(0, 16) + '...' }].map(item => (
                                        <div key={item.label} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                                            <span className="text-sm font-black text-slate-800">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {(activeView === 'posts' || activeView === 'myposts') && (
                        <PostListView
                            posts={activeView === 'myposts' ? posts.filter(p => p.user_id === user?.id) : posts}
                            loading={loadingPosts}
                            onSelect={selectPost}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onSpeech={handleSpeech}
                            speakingPostId={speakingPostId}
                            showActions={activeView === 'myposts'}
                            t={t}
                            locale={locale}
                        />
                    )}

                    {activeView === 'detail' && selectedPost && (
                        <PostDetailView
                            post={selectedPost}
                            comments={comments}
                            newComment={newComment} setNewComment={setNewComment}
                            handleComment={handleComment}
                            postSummary={postSummary}
                            summarizing={summarizing}
                            handleSummarize={handleSummarize}
                            attachmentSummaries={attachmentSummaries}
                            setAttachmentSummaries={setAttachmentSummaries}
                            summarizingAttachment={summarizingAttachment}
                            handleAttachmentSummary={handleAttachmentSummary}
                            handleReadDocument={handleReadDocument}
                            readerOpen={readerOpen}
                            setReaderOpen={setReaderOpen}
                            readingContent={readingContent}
                            readingTitle={readingTitle}
                            loadingReader={loadingReader}
                            locale={locale}
                            t={t}
                            onBack={() => setActiveView('posts')}
                        />
                    )}
                </main>
            </div>

            {/* Reader Modal */}
            <AnimatePresence>
                {readerOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
                    >
                        <motion.div
                            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                            animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
                            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                            onClick={() => setReaderOpen(false)}
                            className="absolute inset-0 bg-black/60 shadow-2xl"
                        />
                        <motion.div
                            initial={{ scale: 0.9, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 20, opacity: 0 }}
                            className="relative w-full max-w-5xl max-h-[90vh] bg-white border border-slate-100 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-xl">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-indigo-600 rounded-[1.2rem] flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                                        <BookOpen size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">{readingTitle}</h3>
                                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">{t("dashboard.reader.title")}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setReaderOpen(false)}
                                    className="w-12 h-12 flex items-center justify-center bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-2xl transition-all border border-slate-100 hover:border-red-100"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-slate-50/20">
                                {loadingReader ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-8">
                                        <div className="relative">
                                            <div className="w-24 h-24 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
                                            <Sparkles className="absolute inset-0 m-auto text-indigo-400 animate-pulse" size={40} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xl font-black text-slate-900 tracking-tight lowercase">{t("dashboard.reader.extracting")}</p>
                                            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mt-2 animate-pulse">{t("dashboard.reader.neural")}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="prose prose-slate max-w-none"
                                    >
                                        <div className="bg-white border border-slate-100 p-12 rounded-[2.5rem] mb-8 shadow-sm">
                                            <p className="text-xl leading-[2] text-slate-600 whitespace-pre-wrap font-serif">
                                                {readingContent}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-center gap-3 text-slate-300 text-[10px] font-black uppercase tracking-[0.3em] py-12">
                                            <div className="h-px w-20 bg-slate-100"></div>
                                            <span className="flex items-center gap-2"><Check size={14} /> {t("dashboard.reader.done")}</span>
                                            <div className="h-px w-20 bg-slate-100"></div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <Grammy
                mode={activeView === 'create' ? 'writer' : 'viewer'}
                baseLang={baseLang}
                onReplace={(newText) => {
                    if (editor) {
                        editor.commands.insertContent(newText);
                    }
                }}
            />
        </PremiumBackground>
    );
}

function SidebarItem({ icon, label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all relative group ${active
                ? 'bg-indigo-50 text-indigo-700 shadow-sm inner-ring'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
        >
            {active && (
                <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 w-1.5 h-6 bg-gradient-to-b from-indigo-400 to-indigo-600 rounded-r-full"
                />
            )}

            <span className={`${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600 transition-colors'}`}>
                {icon}
            </span>
            {label}
        </button>
    );
}

function ToolbarLabel({ label, icon, onChange, accept = "*", gradient = "from-indigo-400 via-purple-400 to-cyan-400" }) {
    return (
        <motion.div
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.9 }}
            className="relative group inline-flex"
        >
            {/* Gradient glow background */}
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-20 blur-md transition-all duration-300 scale-110`} />
            <label className="relative w-12 h-12 flex items-center justify-center bg-white hover:bg-white/80 rounded-2xl cursor-pointer transition-all text-slate-700 hover:text-indigo-700 shrink-0 border border-slate-200 hover:border-indigo-200 shadow-sm hover:shadow-lg">
                <span className="text-slate-700 group-hover:text-indigo-700 transition-colors">{icon}</span>
                <input type="file" className="hidden" onChange={onChange} accept={accept} />
            </label>
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">{label}</span>
        </motion.div>
    );
}

function CreatePostView({
    title, setTitle, content,
    baseLang, setBaseLang, publishing, handlePublish,
    aiLoading, aiResults, aiErrors, handleAI,
    attachments, setAttachments, handleFileUpload,
    showLinkInput, setShowLinkInput, linkUrl, setLinkUrl,
    isEditing, onCancel,
    t, editor
}) {
    const addLink = () => {
        if (linkUrl) {
            setAttachments(prev => [...prev, { type: 'link', url: linkUrl, name: linkUrl }]);
            setLinkUrl('');
            setShowLinkInput(false);
        }
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };
    return (
        <div className="max-w-4xl mx-auto space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h3 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                        <PenTool size={32} className="text-indigo-600" />
                        {isEditing ? "Edit Post" : t("nav.createPost")}
                    </h3>
                    <p className="text-sm font-bold text-slate-500 mt-2 uppercase tracking-widest">{isEditing ? "Modify your masterpiece" : "Share your thoughts with the world"}</p>
                </div>
                <div className="flex items-center gap-3">
                    {isEditing && (
                        <button
                            onClick={onCancel}
                            className="text-slate-500 hover:text-slate-900 px-5 py-2.5 text-sm font-black uppercase tracking-widest transition-all"
                        >
                            {t("ui.cancel") || "Cancel"}
                        </button>
                    )}
                    <motion.div
                        whileHover={{ scale: 1.03, y: -1, boxShadow: "0 8px 24px -4px rgba(99,102,241,0.25)" }}
                        whileTap={{ scale: 0.97 }}
                        className="relative group"
                    >
                        <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors z-10 pointer-events-none" />
                        <select
                            value={baseLang}
                            onChange={(e) => setBaseLang(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded-2xl pl-11 pr-10 py-3 text-sm font-bold text-white focus:ring-4 focus:ring-indigo-900/50 shadow-lg outline-none appearance-none cursor-pointer hover:border-indigo-500 transition-all"
                        >
                            {LANGUAGES.map(l => (
                                <option key={l.code} value={l.code}>{l.nativeName}</option>
                            ))}
                        </select>
                        <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
                    </motion.div>
                    <motion.button
                        onClick={handlePublish}
                        disabled={publishing || !title || !content}
                        whileHover={{ scale: 1.04, y: -2, boxShadow: "0 20px 40px -8px rgba(99,102,241,0.65), 0 8px 20px -4px rgba(139,92,246,0.5)" }}
                        whileTap={{ scale: 0.96 }}
                        className="relative overflow-hidden flex items-center gap-3 bg-slate-900 disabled:opacity-40 text-white px-8 py-3.5 rounded-2xl font-black text-sm transition-all shadow-xl group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.15),transparent_70%)] opacity-0 group-hover:opacity-100 transition-all duration-300" />
                        <span className="relative z-10 flex items-center gap-3">
                            {publishing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            {publishing ? t("editor.publishing") : (isEditing ? (t("editor.update") || "Update") : t("editor.publish"))}
                        </span>
                    </motion.button>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-700 rounded-[2.5rem] p-10 space-y-8 shadow-2xl shadow-slate-900/20">
                <div className="relative group">
                    <Type className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={24} />
                    <input
                        type="text"
                        placeholder={t("editor.titlePlaceholder")}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-[1.5rem] py-6 pl-16 pr-6 text-3xl font-black text-white outline-none focus:bg-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-900/50 transition-all placeholder-slate-500"
                    />
                </div>

                <div className="relative group">
                    <div className="absolute left-6 top-6 text-slate-300 group-focus-within:text-indigo-600 transition-colors z-10 pointer-events-none">
                        <AlignLeft size={24} />
                    </div>
                    <div className="min-h-[400px] w-full bg-slate-50 border border-transparent rounded-[1.5rem] focus-within:bg-white focus-within:border-indigo-100 focus-within:ring-4 focus:ring-indigo-50 transition-all overflow-hidden">
                        <EditorContent
                            editor={editor}
                            className="tiptap-editor-container p-10 pl-16 outline-none prose prose-indigo max-w-none text-lg text-slate-700 leading-relaxed min-h-[400px]"
                        />
                    </div>
                </div>

                {/* Attachments Display */}
                {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-4 pt-8 border-t border-slate-50">
                        {attachments.map((attach, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-100 group relative shadow-sm hover:shadow-md transition-all hover:border-indigo-100"
                            >
                                <div className="p-2 bg-slate-50 rounded-lg">
                                    {attach.type === 'photo' && <Image size={16} className="text-pink-500" />}
                                    {attach.type === 'video' && <Video size={16} className="text-purple-500" />}
                                    {attach.type === 'link' && <Link size={16} className="text-blue-500" />}
                                    {attach.type === 'document' && <FileText size={16} className="text-emerald-500" />}
                                </div>
                                <span className="text-xs font-black text-slate-600 truncate max-w-[150px]">{attach.name}</span>
                                <button
                                    type="button"
                                    onClick={() => removeAttachment(index)}
                                    className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Toolbar */}
                <div className="flex items-center gap-3 pt-4">
                    <ToolbarLabel label="Photo" icon={<Image size={20} />} onChange={(e) => handleFileUpload(e, 'photo')} accept="image/*" gradient="from-pink-400 via-rose-400 to-orange-300" />
                    <ToolbarLabel label="Video" icon={<Video size={20} />} onChange={(e) => handleFileUpload(e, 'video')} accept="video/*" gradient="from-purple-400 via-violet-400 to-indigo-400" />

                    <div className="relative">
                        <motion.button
                            whileHover={{ scale: 1.1, y: -2 }}
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            onClick={() => setShowLinkInput(!showLinkInput)}
                            className={`relative overflow-hidden p-3.5 rounded-2xl transition-all text-slate-400 hover:text-blue-600 border border-slate-100 hover:border-blue-200 bg-white hover:shadow-lg group ${showLinkInput ? 'bg-blue-50 border-blue-200 text-blue-600' : ''}`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-cyan-400 to-sky-300 opacity-0 group-hover:opacity-10 transition-all duration-300 rounded-2xl" />
                            <div className="absolute -inset-1 bg-gradient-to-br from-blue-400 via-cyan-400 to-sky-300 opacity-0 group-hover:opacity-20 blur-lg transition-all duration-300" />
                            <Link size={20} className="relative z-10" />
                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">Add Link</span>
                        </motion.button>
                        {showLinkInput && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className="absolute bottom-full mb-6 left-0 bg-white border border-slate-100 p-4 rounded-[1.5rem] shadow-2xl flex gap-3 min-w-[350px] z-50 shadow-indigo-100/50"
                            >
                                <input
                                    type="url"
                                    placeholder="Paste link here..."
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    className="flex-1 bg-slate-50 border border-transparent rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:bg-white focus:border-indigo-100 transition-all"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={addLink}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-100"
                                >
                                    Add
                                </button>
                            </motion.div>
                        )}
                    </div>
                    <ToolbarLabel label="Document" icon={<FileText size={20} />} onChange={(e) => handleFileUpload(e, 'document')} gradient="from-emerald-400 via-teal-400 to-cyan-300" />
                </div>
            </div>

            <div className="glass-premium rounded-[2.5rem] p-10 space-y-8 shadow-xl shadow-slate-200/20 relative overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.03),transparent)]" />
                <div className="flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg transition-all duration-500 group-hover:bg-indigo-600">
                        <Sparkles size={22} className="text-white" />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-slate-900 tracking-tight">AI Assistant</h4>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Neural Writing Suite</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    <AIButton
                        icon={<Type size={16} />}
                        label={t("ai.generateTitle")}
                        loading={aiLoading.title}
                        onClick={() => handleAI('title')}
                        disabled={!title && !content}
                        gradient="from-indigo-400 via-blue-400 to-sky-300"
                        shadowColor="rgba(79,70,229,0.55)"
                    />
                    <AIButton
                        icon={<Globe size={16} />}
                        label={t("ai.generateSEO")}
                        loading={aiLoading.seo}
                        onClick={() => handleAI('seo')}
                        disabled={!title && !content}
                        gradient="from-violet-500 via-purple-400 to-fuchsia-400"
                        shadowColor="rgba(124,58,237,0.55)"
                    />
                    <AIButton
                        icon={<Hash size={16} />}
                        label={t("ai.generateHashtags")}
                        loading={aiLoading.hashtags}
                        onClick={() => handleAI('hashtags')}
                        disabled={!title && !content}
                        gradient="from-pink-400 via-rose-400 to-orange-300"
                        shadowColor="rgba(219,39,119,0.55)"
                    />
                    <AIButton
                        icon={<FileText size={16} />}
                        label={t("ai.generateSummary")}
                        loading={aiLoading.summary}
                        onClick={() => handleAI('summary')}
                        disabled={!title && !content}
                        gradient="from-emerald-400 via-teal-400 to-cyan-300"
                        shadowColor="rgba(5,150,105,0.55)"
                    />
                </div>

                <motion.button
                    whileHover={{ scale: 1.02, y: -2, boxShadow: "0 20px 40px -8px rgba(99,102,241,0.4), 0 8px 16px -4px rgba(99,102,241,0.2)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAI('improve')}
                    disabled={aiLoading.improve || (!title && !content)}
                    className="relative overflow-hidden w-full flex items-center justify-center gap-2 bg-indigo-100/60 disabled:opacity-50 text-slate-900 px-4 py-3 rounded-xl font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-100/40 border border-indigo-200 hover:border-indigo-300 group"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 opacity-0 group-hover:opacity-10 transition-all duration-300" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.05),transparent_70%)] opacity-0 group-hover:opacity-100 transition-all duration-300" />
                    <span className="relative z-10 flex items-center gap-2">
                        {aiLoading.improve ? <Loader2 size={16} className="animate-spin text-slate-900" /> : <Wand2 size={16} className="text-slate-900" />}
                        {t("ai.improveWriting")}
                    </span>
                </motion.button>

                {Object.values(aiErrors).some(e => e) && (
                    <div className="space-y-3">
                        {Object.entries(aiErrors).map(([type, error]) => error && (
                            <div key={type} className="bg-red-50/50 border border-red-100 rounded-2xl p-6 transition-all">
                                <p className="text-[10px] font-black text-red-700 uppercase tracking-[0.2em] mb-3">Error - {type}</p>
                                <p className="text-red-800 text-sm leading-relaxed font-black">{error}</p>
                            </div>
                        ))}
                    </div>
                )}

                {(aiResults.title || aiResults.seo || aiResults.hashtags || aiResults.summary || aiResults.fileSummary) && (
                    <div className="space-y-3">
                        {aiResults.title && (
                            <ResultCard label="Generated Title" content={aiResults.title} />
                        )}
                        {aiResults.seo && (
                            <ResultCard label="SEO Description" content={aiResults.seo} />
                        )}
                        {aiResults.hashtags && (
                            <ResultCard label="Hashtags" content={aiResults.hashtags} />
                        )}
                        {aiResults.summary && (
                            <ResultCard label="Summary" content={aiResults.summary} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function AIButton({ icon, label, loading, onClick, disabled, gradient = "from-indigo-400 via-purple-400 to-cyan-400", shadowColor = "rgba(99,102,241,0.55)" }) {
    return (
        <motion.button
            whileHover={{ scale: 1.05, y: -4, boxShadow: `0 20px 40px -8px ${shadowColor.replace('0.55', '0.7')}, 0 8px 16px -4px ${shadowColor.replace('0.55', '0.7')}` }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            disabled={loading || disabled}
            className="relative overflow-hidden flex items-center justify-center gap-2 bg-slate-100 disabled:opacity-50 text-slate-900 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border border-slate-200 hover:border-white/60 shadow-md group"
        >
            {/* Solid neon fill – main background glow */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.18] transition-all duration-300`} />
            {/* Bright center shimmer for neon sheen */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.55),transparent_70%)] opacity-0 group-hover:opacity-100 transition-all duration-300" />
            {/* Outer blur halo */}
            <div className={`absolute -inset-2 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-25 blur-xl transition-all duration-300`} />
            {/* Neon border glow */}
            <div className={`absolute inset-0 rounded-2xl ring-1 ring-transparent group-hover:ring-white/40 transition-all duration-300`} />
            <span className="relative z-10 flex items-center gap-2 drop-shadow-sm">
                {loading ? <Loader2 size={16} className="animate-spin text-indigo-700" /> : <span className="text-indigo-700 group-hover:text-indigo-800">{icon}</span>}
                <span className="text-slate-900 font-black">{label}</span>
            </span>
        </motion.button>
    );
}

function ResultCard({ label, content }) {
    return (
        <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-6 transition-all hover:bg-white hover:shadow-sm">
            <p className="text-[10px] font-black text-indigo-700 uppercase tracking-[0.2em] mb-3">{label}</p>
            <p className="text-slate-800 text-sm leading-relaxed font-black">{content}</p>
        </div>
    );
}

function PostListView({ posts, loading, onSelect, onEdit, onDelete, onSpeech, speakingPostId, showActions, t, locale }) {
    const [translatedPosts, setTranslatedPosts] = useState([]);
    const [translating, setTranslating] = useState(false);

    useEffect(() => {
        const translateAll = async () => {
            if (!posts.length) { setTranslatedPosts([]); return; }
            setTranslating(true);
            const results = await Promise.all(
                posts.map(async (post) => {
                    if (post.base_lang === locale) return post;
                    try {
                        const translatedTitle = await translateContent(post.title, post.base_lang, locale);
                        const translatedContent = await translateContent(post.content, post.base_lang, locale);
                        return { ...post, title: translatedTitle, content: translatedContent };
                    } catch {
                        return post;
                    }
                })
            );
            setTranslatedPosts(results);
            setTranslating(false);
        };
        translateAll();
    }, [posts, locale]);

    const displayPosts = translatedPosts.length > 0 ? translatedPosts : posts;

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-slate-50/50 border border-slate-100 rounded-[2.5rem] p-8 h-[320px] relative overflow-hidden">
                        <div className="flex justify-between mb-8">
                            <div className="w-16 h-4 bg-slate-200 rounded-lg shimmer opacity-10"></div>
                            <div className="w-24 h-4 bg-slate-200 rounded-lg shimmer opacity-10"></div>
                        </div>
                        <div className="w-3/4 h-8 bg-slate-200 rounded-xl mb-4 shimmer opacity-10"></div>
                        <div className="w-full h-4 bg-slate-200 rounded-lg mb-2 shimmer opacity-10"></div>
                        <div className="w-5/6 h-4 bg-slate-200 rounded-lg mb-2 shimmer opacity-10"></div>
                        <div className="w-2/3 h-4 bg-slate-200 rounded-lg shimmer opacity-10"></div>
                        <div className="absolute bottom-8 left-8 right-8 flex justify-between">
                            <div className="w-10 h-10 bg-slate-200 rounded-xl shimmer opacity-10"></div>
                            <div className="w-24 h-10 bg-slate-200 rounded-xl shimmer opacity-10"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="text-center py-32 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                <div className="w-20 h-20 bg-white shadow-sm border border-slate-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                    <FileText className="text-slate-300" size={32} />
                </div>
                <p className="text-2xl font-black text-slate-900 mb-2">{t("ui.empty")}</p>
                <p className="text-slate-400 font-bold">Start your writing journey today</p>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {translating && (
                <div className="flex items-center gap-3 text-indigo-600 text-xs font-black uppercase tracking-widest px-6 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl w-fit animate-pulse">
                    <Globe size={16} /> {t("ui.translating") || "Translating posts..."}
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {displayPosts.map((post, i) => (
                    <motion.article
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="premium-card"
                        onClick={() => onSelect(post)}
                    >

                        <div className="flex-1 relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <span className="bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest">
                                        {post.base_lang}
                                    </span>
                                    {post.base_lang !== locale && (
                                        <div className="flex items-center gap-2">
                                            <ChevronRight size={10} className="text-slate-400" />
                                            <span className="text-indigo-600 text-[10px] font-black px-3 py-1 bg-white border border-indigo-100 rounded-lg uppercase tracking-widest shadow-sm">{locale}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-slate-800 font-black text-[10px] uppercase tracking-widest">
                                    <Clock size={12} strokeWidth={3} className="text-indigo-600" />
                                    {new Date(post.created_at).toLocaleDateString()}
                                </div>
                            </div>

                            <h3 className="text-2xl font-black text-slate-900 mb-4 hover:text-indigo-600 transition-all duration-300 line-clamp-2 leading-tight tracking-tight">
                                {post.title}
                            </h3>
                            <p className="text-slate-800 text-sm line-clamp-4 leading-relaxed font-black mb-2">
                                {stripHtmlTags(post.content)}
                            </p>
                        </div>

                        <div className="mt-8 flex items-center justify-between border-t border-slate-50 pt-6 relative z-10">
                            <div className="flex items-center gap-2">
                                <IconButton
                                    icon={speakingPostId === post.id ? <Square size={14} fill="currentColor" /> : <Volume2 size={18} />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSpeech(post);
                                    }}
                                    active={speakingPostId === post.id}
                                    color="indigo"
                                    title="Listen"
                                />
                            </div>
                            {showActions && (
                                <div className="flex items-center gap-2">
                                    <IconButton
                                        icon={<Edit2 size={16} />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(post);
                                        }}
                                        color="blue"
                                        title="Edit"
                                    />
                                    <IconButton
                                        icon={<Trash2 size={16} />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(post.id);
                                        }}
                                        color="red"
                                        title="Delete"
                                    />
                                </div>
                            )}
                        </div>
                    </motion.article>
                ))}
            </div>
        </div>
    );
}

function IconButton({ icon, onClick, active, color = 'indigo', title }) {
    const colors = {
        indigo: 'text-indigo-500 hover:bg-indigo-50 border-transparent',
        red: 'text-red-500 hover:bg-red-50 border-transparent',
        blue: 'text-blue-500 hover:bg-blue-50 border-transparent',
    };

    return (
        <motion.button
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClick}
            title={title}
            className={`p-2.5 rounded-xl transition-all border shadow-sm ${active ? 'bg-slate-900 border-transparent text-white shadow-lg' : colors[color] + ' bg-white border-slate-100 hover:border-slate-200'}`}
        >
            {icon}
        </motion.button>
    );
}

function PostDetailView({ post, comments, newComment, setNewComment, handleComment, postSummary, summarizing, handleSummarize, attachmentSummaries, setAttachmentSummaries, summarizingAttachment, handleAttachmentSummary, handleReadDocument, locale, t, onBack }) {
    const [translatedPost, setTranslatedPost] = useState(post);
    const [postTranslating, setPostTranslating] = useState(false);

    useEffect(() => {
        const translatePost = async () => {
            if (post.base_lang === locale) {
                setTranslatedPost(post);
                return;
            }
            setPostTranslating(true);
            try {
                const translatedTitle = await translateContent(post.title, post.base_lang, locale);
                const translatedContent = await translateContent(post.content, post.base_lang, locale);
                setTranslatedPost({ ...post, title: translatedTitle, content: translatedContent });
            } catch {
                setTranslatedPost(post);
            }
            setPostTranslating(false);
        };
        translatePost();
    }, [post, locale]);

    return (
        <div className="max-w-4xl mx-auto space-y-12">
            <motion.button
                whileHover={{ x: -10 }}
                onClick={onBack}
                className="group flex items-center gap-3 text-slate-600 hover:text-indigo-600 transition-all font-black uppercase tracking-widest text-[10px] bg-white px-5 py-2.5 rounded-xl border border-slate-100 hover:border-indigo-100 shadow-sm hover:shadow-md"
            >
                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                {t("editor.back") || "Back"}
            </motion.button>

            <article className="bg-white border border-slate-100 rounded-[3rem] p-10 md:p-16 shadow-2xl shadow-slate-100/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 blur-[100px] -z-10 rounded-full opacity-50"></div>

                <header className="mb-12">
                    <div className="flex flex-wrap items-center gap-4 mb-8">
                        <span className="bg-indigo-600/10 text-indigo-600 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-indigo-100">
                            {post.base_lang} <ChevronRight size={10} className="inline mx-1" /> {locale}
                        </span>
                        {postTranslating && (
                            <span className="flex items-center gap-2 text-indigo-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
                                <Globe size={14} /> {t("ui.translating") || "Translating..."}
                            </span>
                        )}
                        <span className="text-slate-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                            <Clock size={12} className="text-indigo-500" />
                            {new Date(post.created_at).toLocaleDateString()}
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight mb-8">
                        {translatedPost.title}
                    </h2>
                    <div className="w-20 h-2 height bg-gradient-premium rounded-full"></div>
                </header>

                <div className="prose prose-indigo max-w-none">
                    <p className="text-xl text-slate-700 leading-[1.8] font-black whitespace-pre-wrap mb-12">
                        {stripHtmlTags(translatedPost.content)}
                    </p>
                </div>

                {/* Attachments Section */}
                {post.metadata?.attachments?.length > 0 && (
                    <div className="mt-16 pt-12 border-t border-slate-50 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                                <Paperclip size={16} className="text-indigo-600" />
                            </div>
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">
                                Attachments & Media
                            </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {post.metadata.attachments.map((attach, index) => {
                                const ytId = attach.type === 'link' ? (() => {
                                    try {
                                        const u = new URL(attach.url);
                                        if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
                                        if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
                                    } catch { return null; }
                                    return null;
                                })() : null;

                                const isDocLink = attach.type === 'link' && (attach.url.toLowerCase().endsWith('.pdf') || attach.url.toLowerCase().endsWith('.docx'));

                                return (
                                    <div key={index} className="bg-slate-50 border border-slate-100 rounded-[2rem] overflow-hidden hover:border-indigo-200 transition-all group shadow-sm hover:shadow-xl hover:shadow-indigo-100/20">
                                        {/* Photo */}
                                        {attach.type === 'photo' && (
                                            <div className="w-full bg-white flex items-center justify-center p-2">
                                                <img
                                                    src={attach.url}
                                                    alt={attach.name}
                                                    className="w-full max-h-[400px] object-cover rounded-[1.5rem]"
                                                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                                />
                                                <div style={{ display: 'none' }} className="p-10 flex flex-col items-center gap-4 text-slate-300">
                                                    <Image size={40} />
                                                    <span className="text-xs font-bold uppercase tracking-widest">{attach.name}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Native Video */}
                                        {attach.type === 'video' && (
                                            <div className="w-full aspect-video bg-slate-900 relative">
                                                <video controls className="w-full h-full">
                                                    <source src={attach.url} />
                                                </video>
                                            </div>
                                        )}

                                        {/* YouTube Embed */}
                                        {ytId && (
                                            <div className="w-full aspect-video">
                                                <iframe
                                                    className="w-full h-full"
                                                    src={`https://www.youtube.com/embed/${ytId}`}
                                                    title="YouTube video player"
                                                    frameBorder="0"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                    allowFullScreen
                                                ></iframe>
                                            </div>
                                        )}

                                        {/* Caption / Actions bar */}
                                        <div
                                            className="p-6 flex items-center justify-between gap-4 cursor-pointer hover:bg-white transition-colors"
                                            onClick={() => handleReadDocument(attach)}
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-slate-50 ${(attach.type === 'document' || isDocLink) ? 'text-emerald-500' : 'text-indigo-600'
                                                    }`}>
                                                    {attach.type === 'photo' && <Image size={18} />}
                                                    {attach.type === 'video' && <Video size={18} />}
                                                    {(attach.type === 'link' && !isDocLink) && <Link size={18} />}
                                                    {(attach.type === 'document' || isDocLink) && <FileText size={18} />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-black text-xs text-slate-900 truncate">{attach.name}</p>
                                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-0.5">
                                                        {(isDocLink) ? 'document link' : attach.type}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {(attach.type === 'document' || isDocLink) && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleReadDocument(attach);
                                                        }}
                                                        className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all border border-indigo-100 shadow-sm"
                                                        title="Read Document"
                                                    >
                                                        <BookOpen size={16} />
                                                    </button>
                                                )}
                                                <a href={attach.url} target="_blank" rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-10 h-10 flex items-center justify-center bg-white text-slate-400 hover:text-indigo-600 rounded-xl border border-slate-50 hover:border-indigo-100 shadow-sm transition-all"
                                                >
                                                    <Globe size={16} />
                                                </a>
                                            </div>
                                        </div>

                                        {/* AI Summary */}
                                        {(attach.type === 'document' || attach.type === 'link') && (
                                            <div className="px-6 pb-6">
                                                {attachmentSummaries[attach.url] ? (
                                                    <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 relative group animate-in fade-in slide-in-from-bottom-2">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <Sparkles size={12} className="text-indigo-600" />
                                                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">AI Intelligence</span>
                                                            </div>
                                                            <button
                                                                onClick={() => setAttachmentSummaries(prev => {
                                                                    const next = { ...prev };
                                                                    delete next[attach.url];
                                                                    return next;
                                                                })}
                                                                className="text-slate-300 hover:text-red-500 transition-colors"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </div>
                                                        <p className="text-sm text-slate-600 italic font-medium leading-relaxed">
                                                            {attachmentSummaries[attach.url]}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAttachmentSummary(attach)}
                                                        disabled={summarizingAttachment[attach.url]}
                                                        className="w-full flex items-center justify-center gap-3 py-3 bg-white hover:bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-100 hover:border-indigo-100 shadow-sm"
                                                    >
                                                        {summarizingAttachment[attach.url] ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                                        {summarizingAttachment[attach.url] ? 'Analyzing Content...' : 'Generate AI Summary'}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </article>

            <motion.div
                whileHover={{ y: -5 }}
                className="glass-premium rounded-[3rem] p-12 relative overflow-hidden group cursor-default shadow-2xl"
            >
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent)] transition-transform duration-1000 group-hover:scale-110"></div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                    <div>
                        <div className="flex items-center gap-4 mb-3">
                            <motion.div
                                className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-[1.25rem] flex items-center justify-center border border-white/10"
                                whileHover={{ rotate: 360 }}
                                transition={{ duration: 0.8 }}
                            >
                                <Sparkles size={24} className="text-indigo-400" />
                            </motion.div>
                            <h4 className="text-3xl font-black text-slate-900 tracking-tight">AI Insights</h4>
                        </div>
                        <p className="text-indigo-600 font-black uppercase tracking-widest text-[10px]">Neural Analysis Suite</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.5)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSummarize}
                        disabled={summarizing}
                        className="bg-white hover:bg-slate-50 disabled:opacity-50 text-indigo-950 px-10 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl whitespace-nowrap inner-ring"
                    >
                        {summarizing ? <Loader2 size={18} className="animate-spin text-indigo-600" /> : <Zap size={18} fill="currentColor" className="text-indigo-600" />}
                        {summarizing ? 'Analyzing...' : t("ai.generateSummary")}
                    </motion.button>
                </div>
                {postSummary && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-10 p-8 bg-slate-50/50 backdrop-blur-md rounded-[2rem] border border-slate-100 relative"
                    >
                        <Quote size={40} className="absolute -top-4 -left-4 text-slate-100 opacity-50" />
                        <p className="text-xl text-slate-900 italic leading-relaxed font-black">"{postSummary}"</p>
                    </motion.div>
                )}
            </motion.div>

            <section className="space-y-10">
                <div className="flex items-center justify-between px-2">
                    <h4 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        <MessageSquare size={32} className="text-indigo-600" />
                        Discussion
                        <span className="text-sm font-black text-slate-300 bg-slate-50 px-4 py-1 rounded-full uppercase tracking-widest">{comments.length}</span>
                    </h4>
                </div>

                <form onSubmit={handleComment} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-100/50">
                    <textarea
                        placeholder="Join the conversation..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="w-full bg-slate-50 border border-transparent rounded-[1.5rem] px-8 py-6 h-32 outline-none focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 resize-none text-lg font-medium placeholder-slate-300 mb-6 transition-all"
                    />
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-100">
                            <Globe size={12} />
                            Posting in {locale?.toUpperCase()}
                        </div>
                        <button
                            type="submit"
                            disabled={!newComment}
                            className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl shadow-slate-200 hover:-translate-y-1 active:scale-95"
                        >
                            <Send size={18} />
                            Post Comment
                        </button>
                    </div>
                </form>

                <div className="space-y-6">
                    {comments.map((comment, i) => (
                        <CommentItem key={comment.id} comment={comment} targetLocale={locale} index={i} />
                    ))}
                </div>
            </section>
        </div>
    );
}

function CommentItem({ comment, targetLocale, index }) {
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
    }, [targetLocale, comment.comment_text, comment.original_language]);

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative group overflow-hidden"
        >
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-[1.25rem] flex items-center justify-center shadow-sm group-hover:border-indigo-200 transition-colors">
                        <User size={20} className="text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-900 tracking-tight">Post Enthusiast</p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{new Date(comment.created_at).toLocaleDateString()}</p>
                            <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{comment.original_language}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pl-16">
                {translating ? (
                    <div className="flex items-center gap-2 text-indigo-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
                        <Loader2 size={12} className="animate-spin" /> {t("ui.translating") || "Translating..."}
                    </div>
                ) : (
                    <p className="text-slate-900 text-lg leading-relaxed font-black">{displayContent}</p>
                )}
            </div>
        </motion.div>
    );
}
