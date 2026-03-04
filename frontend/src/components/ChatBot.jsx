import { useState, useRef, useEffect } from 'react';
import { useLingoLocale } from 'lingo.dev/react/client';
import { MessageSquare, X, Send, Loader2, Bot, User, Paperclip, FileText, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../lib/axios';

export default function ChatBot() {
    const locale = useLingoLocale();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [attachment, setAttachment] = useState(null);
    const scrollRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
        }
    }, [open]);

    const sendMessage = async (e) => {
        if (e) e.preventDefault();
        if ((!input.trim() && !attachment) || loading) return;

        const userMessage = {
            role: 'user',
            content: attachment ? `[File: ${attachment.name}] ${input.trim() || 'Please summarize this document.'}` : input.trim()
        };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            let data;
            if (attachment) {
                ({ data } = await axiosInstance.post('/api/summarize-document', {
                    fileUrl: attachment.url,
                    fileName: attachment.name,
                    locale: locale || 'en'
                }));
            } else {
                ({ data } = await axiosInstance.post('/api/chat', {
                    message: userMessage.content,
                    locale: locale || 'en',
                    history: messages.slice(-10)
                }));
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response || data.summary || 'Summary generated.'
            }]);
            setAttachment(null);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `⚠️ ${error.response?.data?.error || error.message || 'Something went wrong. Please try again.'}`
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // In a real app, you'd upload this to Supabase Storage first
        // For this demo/integration, let's assume we use a temporary upload or mock it
        // Since we have Supabase configured in the project, we'll try to use it if possible
        // But Blogy AI assistant might just need the text.
        // For now, let's just set the attachment state and handle it in sendMessage
        setLoading(true);
        try {
            // Mocking or simple upload logic - using the same bucket as blog posts for simplicity
            const { supabase } = await import('../lib/supabase');
            const fileExt = file.name.split('.').pop();
            const fileName = `ai-assistant/${Math.random()}.${fileExt}`;

            const { data, error } = await supabase.storage
                .from('blog-attachments')
                .upload(fileName, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('blog-attachments')
                .getPublicUrl(fileName);

            setAttachment({ name: file.name, url: publicUrl });
        } catch (error) {
            console.error('Attachment error:', error);
            alert('Failed to attach file: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-10 right-10 z-[100] flex flex-col items-end">
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.9, y: 40, filter: 'blur(10px)' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                        className="mb-6 w-[440px] bg-white border border-slate-100 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden" style={{ height: 'min(580px, calc(100vh - 120px))' }}
                    >
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-slate-50 bg-white/80 backdrop-blur-xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                                        <Bot size={24} className="text-white" />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-4 border-white rounded-full"></div>
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 tracking-tight">Blogy Intellect</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Autonomous Unit</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-red-50 hover:text-red-500 text-slate-300 transition-all border border-transparent hover:border-red-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50/30">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center py-10 px-6">
                                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-slate-200/50 border border-slate-50">
                                        <Sparkles size={32} className="text-indigo-500" />
                                    </div>
                                    <h4 className="text-xl font-black text-slate-900 tracking-tight mb-2">Omnipresent Support</h4>
                                    <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-[280px]">
                                        I am synchronized and ready to assist with your creative workflow. How may I augment your experience?
                                    </p>
                                </div>
                            )}

                            {messages.map((msg, i) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    key={i}
                                    className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                >
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user'
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-white border border-slate-100 text-indigo-600'
                                        }`}>
                                        {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                    </div>
                                    <div className={`max-w-[80%] px-5 py-3.5 rounded-[2rem] text-sm leading-relaxed font-medium shadow-sm border ${msg.role === 'user'
                                        ? 'bg-slate-900 text-white border-slate-800 rounded-tr-md'
                                        : 'bg-white text-slate-600 border-slate-100 rounded-tl-md'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))}

                            {loading && (
                                <div className="flex gap-4">
                                    <div className="w-9 h-9 bg-white border border-slate-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                                        <Bot size={16} />
                                    </div>
                                    <div className="bg-white border border-slate-100 rounded-[2rem] rounded-tl-md px-6 py-4 flex items-end gap-1.5 shadow-sm">
                                        <div className="flex gap-1 items-end h-4">
                                            <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 bg-indigo-500 rounded-full" />
                                            <motion.div animate={{ height: [6, 16, 6] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }} className="w-1 bg-indigo-500 rounded-full" />
                                            <motion.div animate={{ height: [8, 10, 8] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1 bg-indigo-500 rounded-full" />
                                            <motion.div animate={{ height: [4, 14, 4] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }} className="w-1 bg-indigo-500 rounded-full" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 ml-2">Analyzing</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-6 bg-white border-t border-slate-50 space-y-4">
                            {attachment && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center justify-between bg-indigo-50 p-3 rounded-2xl border border-indigo-100"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                                            <FileText size={16} />
                                        </div>
                                        <span className="text-xs font-black text-indigo-600 truncate max-w-[240px]">{attachment.name}</span>
                                    </div>
                                    <button onClick={() => setAttachment(null)} className="p-2 hover:bg-white rounded-xl text-indigo-300 hover:text-indigo-600 transition-all">
                                        <X size={16} />
                                    </button>
                                </motion.div>
                            )}
                            <form onSubmit={sendMessage} className="flex items-center gap-3">
                                <label className="w-12 h-12 flex items-center justify-center hover:bg-slate-50 rounded-2xl cursor-pointer transition-all text-slate-400 hover:text-indigo-600 shrink-0 border border-transparent hover:border-slate-100">
                                    <Paperclip size={20} />
                                    <input type="file" className="hidden" onChange={handleFileChange} />
                                </label>
                                <div className="flex-1 relative">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder={attachment ? "Provide context..." : "Ask your assistant..."}
                                        disabled={loading}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3.5 text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-200 transition-all text-slate-900 font-medium placeholder-slate-300 disabled:opacity-50"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={(!input.trim() && !attachment) || loading}
                                    className="w-12 h-12 bg-slate-900 hover:bg-slate-800 disabled:opacity-20 text-white rounded-2xl flex items-center justify-center transition-all shadow-xl shadow-slate-100 shrink-0 active:scale-90"
                                >
                                    {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setOpen(!open)}
                className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] transition-all relative overflow-hidden group ${open
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-900 border border-slate-100'
                    }`}
            >
                {!open && (
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
                {open ? <X size={24} /> : <MessageSquare size={24} className="group-hover:scale-110 transition-transform" />}
            </motion.button>

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
        </div>
    );
}
