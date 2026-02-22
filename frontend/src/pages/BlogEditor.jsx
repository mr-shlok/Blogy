import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLingo, setLingoLocale } from "lingo.dev/react/client";
import { Send, ArrowLeft, Type, AlignLeft, Languages, Image, Video, Link, FileText, Paperclip, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LanguageSelector from '../components/LanguageSelector';
import Grammy from '../components/Grammy';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

export default function BlogEditor() {
    const navigate = useNavigate();
    const { dictionary } = useLingo();
    const setLingoLocaleFn = setLingoLocale;
    const { user, authLoading } = useAuth();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [baseLang, setBaseLang] = useState('en');

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: t("editor.contentPlaceholder"),
            }),
        ],
        content: '',
        onUpdate: ({ editor }) => {
            setContent(editor.getHTML());
        },
    });
    const [loading, setLoading] = useState(false);
    const [attachments, setAttachments] = useState([]);
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/');
        }
    }, [user, authLoading, navigate]);

    const t = (key) => {
        return dictionary && dictionary[key] ? dictionary[key] : key;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            alert('You must be logged in to create a post');
            setLoading(false);
            navigate('/');
            return;
        }

        const { data, error } = await supabase
            .from('posts')
            .insert([
                {
                    title,
                    content,
                    base_lang: baseLang,
                    user_id: user.id,
                    metadata: { attachments }
                }
            ])
            .select();

        if (error) {
            console.error('Error creating post:', error);
            alert('Failed to publish post: ' + error.message);
        } else {
            navigate(`/post/${data[0].id}`);
        }
        setLoading(false);
    };

    const handleFileUpload = async (event, type) => {
        const file = event.target.files[0];
        if (!file) return;

        setLoading(true);
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
            setLoading(false);
        }
    };

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
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-700">
            <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-8 py-5 flex justify-between items-center">
                    <button
                        onClick={() => navigate('/')}
                        className="group flex items-center gap-3 text-slate-400 hover:text-indigo-600 transition-all font-black uppercase tracking-widest text-[10px] bg-white px-5 py-2.5 rounded-xl border border-slate-100 hover:border-indigo-100 shadow-sm hover:shadow-md"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-black">{t("editor.back") || "Back"}</span>
                    </button>

                    <div className="flex items-center gap-5">
                        <LanguageSelector
                            currentLocale={baseLang}
                            onChange={(val) => {
                                setBaseLang(val);
                                setLingoLocaleFn(val);
                            }}
                            className="min-w-[200px]"
                        />

                        <button
                            onClick={handleSubmit}
                            disabled={loading || !title || !content}
                            className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-slate-200 hover:-translate-y-0.5 active:scale-95"
                        >
                            <Send size={16} />
                            {loading ? t("editor.publishing") : t("editor.publish")}
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-8 py-16">
                <form className="space-y-16">
                    <div className="relative group">
                        <Type className="absolute -left-16 top-4 text-slate-100 group-focus-within:text-indigo-400 transition-colors hidden xl:block" size={40} />
                        <input
                            type="text"
                            placeholder={t("editor.titlePlaceholder")}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-transparent border-none text-5xl md:text-8xl font-black outline-none placeholder-slate-100 focus:placeholder-slate-200 transition-all tracking-tight leading-[1.1] text-slate-900"
                        />
                    </div>

                    <div className="relative group min-h-[40vh]">
                        <AlignLeft className="absolute -left-16 top-2 text-slate-100 group-focus-within:text-indigo-400 transition-colors hidden xl:block" size={40} />
                        <EditorContent
                            editor={editor}
                            className="prose prose-slate max-w-none text-2xl md:text-3xl leading-relaxed outline-none focus:outline-none selection:bg-indigo-100 selection:text-indigo-700 font-medium text-slate-600"
                        />
                    </div>

                    {/* Attachments Display */}
                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-5 pt-16 border-t border-slate-50">
                            {attachments.map((attach, index) => (
                                <div key={index} className="flex items-center gap-4 bg-white p-3 pr-6 rounded-[1.5rem] border border-slate-100 group relative transition-all hover:border-indigo-200 shadow-sm hover:shadow-xl hover:-translate-y-1">
                                    {attach.type === 'photo' ? (
                                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100">
                                            <img src={attach.url} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-inner ${attach.type === 'video' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                            attach.type === 'link' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            }`}>
                                            {attach.type === 'video' && <Video size={20} />}
                                            {attach.type === 'link' && <Link size={20} />}
                                            {attach.type === 'document' && <FileText size={20} />}
                                        </div>
                                    )}
                                    <div className="flex flex-col min-w-0 max-w-[180px]">
                                        <span className="text-xs font-black text-slate-900 truncate tracking-tight">{attach.name}</span>
                                        <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest mt-0.5">{attach.type} {t("editor.asset")}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeAttachment(index)}
                                        className="p-2 bg-slate-50 hover:bg-red-50 hover:text-red-500 text-slate-300 rounded-xl transition-all border border-slate-100 hover:border-red-100"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Toolbar */}
                    <div className="sticky bottom-12 bg-white/80 backdrop-blur-2xl border border-slate-200 rounded-[2rem] p-3 flex items-center gap-3 max-w-fit mx-auto shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] mb-20 animate-in fade-in slide-in-from-bottom-5 duration-700">
                        <label className="p-4 hover:bg-slate-50 rounded-2xl cursor-pointer transition-all text-slate-400 hover:text-indigo-600 group relative border border-transparent hover:border-slate-100">
                            <Image size={24} />
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'photo')} />
                            <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none">{t("editor.tool.photo")}</span>
                        </label>
                        <label className="p-4 hover:bg-slate-50 rounded-2xl cursor-pointer transition-all text-slate-400 hover:text-indigo-600 group relative border border-transparent hover:border-slate-100">
                            <Video size={24} />
                            <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'video')} />
                            <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none">{t("editor.tool.video")}</span>
                        </label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowLinkInput(!showLinkInput)}
                                className={`p-4 hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-indigo-600 group relative border ${showLinkInput ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'border-transparent hover:border-slate-100'}`}
                            >
                                <Link size={24} />
                                <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none">{t("editor.tool.reference")}</span>
                            </button>
                            {showLinkInput && (
                                <div className="absolute bottom-full mb-8 left-1/2 -translate-x-1/2 bg-white border border-slate-200 p-4 rounded-[2rem] shadow-2xl flex gap-3 min-w-[350px] animate-in zoom-in-95 duration-200">
                                    <input
                                        type="url"
                                        placeholder={t("editor.linkPlaceholder")}
                                        value={linkUrl}
                                        onChange={(e) => setLinkUrl(e.target.value)}
                                        className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 font-bold text-slate-900"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={addLink}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-100"
                                    >
                                        {t("editor.add")}
                                    </button>
                                </div>
                            )}
                        </div>
                        <label className="p-4 hover:bg-slate-50 rounded-2xl cursor-pointer transition-all text-slate-400 hover:text-indigo-600 group relative border border-transparent hover:border-slate-100">
                            <FileText size={24} />
                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'document')} />
                            <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none">{t("editor.tool.document")}</span>
                        </label>
                    </div>
                </form>

            </main>

            <div className="fixed bottom-10 right-10 text-slate-300 text-[10px] font-black select-none uppercase tracking-[0.3em] flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                {t("editor.cloudSynced")} • {baseLang.toUpperCase()} {t("editor.translationReady")}
            </div>
            <Grammy mode="editor" baseLang={baseLang} />
        </div>
    );
}
