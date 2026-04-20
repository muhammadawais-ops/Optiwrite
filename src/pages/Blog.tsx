import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Sparkles, 
  Calendar, 
  User, 
  ChevronRight,
  Search,
  BookOpen
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface Blog {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  author?: string;
  category?: string;
  createdAt: any;
}

export default function Blog() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const blogData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Blog[];
      setBlogs(blogData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const categories = ['All', ...Array.from(new Set(blogs.map(b => b.category || 'Insights')))];

  const filteredBlogs = blogs.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         b.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || (b.category || 'Insights') === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (date: any) => {
    if (!date) return '...';
    if (typeof date === 'string') return new Date(date).toLocaleDateString();
    if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString();
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-zinc-50 selection:bg-blue-100 text-zinc-900 font-sans antialiased">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-zinc-900">AI SUITE</span>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft size={18} /> Back Home
          </button>
        </div>
      </nav>

      {/* Header */}
      <header className="pt-32 pb-20 px-6 bg-white border-b border-zinc-100">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h1 className="text-5xl md:text-7xl font-black text-zinc-900 tracking-tight leading-none mb-8 uppercase">
              The <span className="text-blue-600">Community</span> Blog.
            </h1>
            <p className="text-zinc-500 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
              Read the latest stories, SEO tips, and email marketing hacks shared by our experts.
            </p>
          </motion.div>

          <div className="mt-12 max-w-2xl mx-auto">
             <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                <input 
                   type="text" 
                   placeholder="Search articles..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                />
             </div>
             
             {/* Category Chips */}
             <div className="flex flex-wrap justify-center gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
                  >
                    {cat}
                  </button>
                ))}
             </div>
          </div>
        </div>
      </header>

      {/* Blog Grid */}
      <main className="py-20 px-6 max-w-7xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 grayscale opacity-20">
             <div className="w-16 h-16 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin mb-4" />
             <p className="text-xs font-black uppercase tracking-widest text-zinc-900">Scanning Knowledge Base...</p>
          </div>
        ) : filteredBlogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBlogs.map((blog, idx) => (
              <motion.article 
                key={blog.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => navigate(`/blog/${blog.id}`)}
                className="group bg-white rounded-[2.5rem] overflow-hidden border border-zinc-100 shadow-xl shadow-zinc-200/20 hover:shadow-2xl transition-all cursor-pointer flex flex-col"
              >
                <div className="h-56 bg-zinc-100 relative overflow-hidden">
                   {blog.imageUrl ? (
                     <img 
                       src={blog.imageUrl} 
                       alt={blog.title} 
                       className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                       referrerPolicy="no-referrer"
                     />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center">
                        <BookOpen size={48} className="text-zinc-200" />
                     </div>
                   )}
                   <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-900 shadow-sm">
                      {blog.category || 'Article'}
                   </div>
                </div>
                <div className="p-8 flex flex-col flex-grow">
                   <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4">
                      <div className="flex items-center gap-1.5"><Calendar size={12} /> {formatDate(blog.createdAt)}</div>
                      <div className="flex items-center gap-1.5"><User size={12} /> {blog.author || 'Admin'}</div>
                   </div>
                   <h3 className="text-xl font-black text-zinc-900 mb-4 group-hover:text-blue-600 transition-colors leading-tight line-clamp-2">{blog.title}</h3>
                   <div className="text-zinc-500 text-sm leading-relaxed mb-6 line-clamp-3 font-medium">
                      {blog.content.replace(/[#*`]/g, '')}
                   </div>
                   <div className="mt-auto flex items-center gap-2 text-zinc-900 font-black text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                      Read Article <ChevronRight size={16} />
                   </div>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
             <p className="text-zinc-400 font-medium">No articles found matching your search.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-zinc-200 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-300 italic">
          © 2026 AI SUITE — COMMUNITY KNOWLEDGE
        </p>
      </footer>
    </div>
  );
}
