import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  ArrowRight,
  Calendar, 
  User, 
  Share2, 
  Clock, 
  BookOpen, 
  Sparkles,
  ChevronRight,
  Target
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Blog {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  author?: string;
  category?: string;
  createdAt: any;
}

export default function Article() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'blogs', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBlog({ id: docSnap.id, ...docSnap.data() } as Blog);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [id]);

  const formatDate = (date: any) => {
    if (!date) return '...';
    // Handle both ISO string and Firestore Timestamp
    if (typeof date === 'string') return new Date(date).toLocaleDateString();
    if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString();
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-3xl font-black mb-4">Article Not Found</h2>
        <button 
          onClick={() => navigate('/blog')}
          className="bg-zinc-900 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2"
        >
          <ArrowLeft size={18} /> Back to Blog
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 text-zinc-900 font-sans antialiased">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-zinc-900 uppercase">AI SUITE</span>
          </div>
          <button 
            onClick={() => navigate('/blog')}
            className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft size={16} /> All Articles
          </button>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
             <div className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20">
                {blog.category || 'Insights'}
             </div>
             <div className="w-1 h-1 bg-zinc-200 rounded-full" />
             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                <Clock size={14} /> 5 Min Read
             </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-zinc-900 tracking-tight leading-[1.1] mb-10">
            {blog.title}
          </h1>
          <div className="flex items-center gap-6 pb-12 border-b border-zinc-100">
             <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                   <User className="text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-zinc-900">{blog.author || 'AI Strategist'}</p>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Lead Copywriter</p>
                </div>
             </div>
             <div className="h-8 w-px bg-zinc-100" />
             <div className="flex flex-col">
                <p className="text-sm font-black text-zinc-900">{formatDate(blog.createdAt)}</p>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Published Date</p>
             </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pb-24 px-6">
        <article className="max-w-3xl mx-auto">
          {blog.imageUrl && (
            <div className="relative aspect-video rounded-[2.5rem] overflow-hidden mb-16 shadow-2xl">
              <img 
                src={blog.imageUrl} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
                alt={blog.title} 
              />
            </div>
          )}
          
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{blog.content}</ReactMarkdown>
          </div>

          {/* Engagement */}
          <div className="mt-20 p-10 bg-zinc-900 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 border border-zinc-800 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] pointer-events-none" />
             <div>
                <h4 className="text-2xl font-black mb-2 uppercase tracking-tight italic">Liked this breakdown?</h4>
                <p className="text-zinc-500 text-sm font-medium">Share it with your community of writers and marketers.</p>
             </div>
             <div className="flex gap-4">
                <button className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                  <Share2 size={16} /> Copy Link
                </button>
             </div>
          </div>
        </article>
      </main>

      {/* Recommended Footer */}
      <section className="py-24 bg-zinc-50 border-t border-zinc-100 px-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
             <div>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-2">Next Journey</p>
                <h3 className="text-3xl font-black tracking-tight mb-8">Ready to generate your own?</h3>
                <button 
                  onClick={() => navigate('/optiwrite')}
                  className="group bg-zinc-900 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-3 shadow-xl"
                >
                  Launch OptiWrite <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </button>
             </div>
             <div className="hidden md:block w-32 h-32 bg-white rounded-3xl border border-zinc-100 shadow-lg p-6 rotate-12">
                <Target size={48} className="text-zinc-100" />
             </div>
          </div>
      </section>
    </div>
  );
}
