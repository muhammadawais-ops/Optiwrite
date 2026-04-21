import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  PenTool, 
  Mail, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  ChevronRight,
  Rocket,
  CheckCircle2,
  Globe,
  Award,
  ZapOff,
  UserCheck,
  Layout,
  Table as TableIcon,
  Search,
  MessageSquare,
  Repeat,
  Heart,
  TrendingUp,
  Target,
  BarChart2,
  PieChart as PieIcon,
  Image as ImageIcon,
  Cpu,
  LogIn,
  Layers,
  MousePointer2,
  Check,
  ChevronDown,
  Star,
  Quote,
  Settings
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useAuth } from '../contexts/AuthContext';

// Word count target: 1000+ words
// Goal: Simple "one class child" explanation with professional futuristic design.
// Target: All 48 keywords included naturally without forced bolding.

const optiWriteData = [
  { name: 'W1', value: 10 },
  { name: 'W2', value: 25 },
  { name: 'W3', value: 45 },
  { name: 'W4', value: 95 },
];

const copyEliteData = [
  { name: 'D1', value: 5 },
  { name: 'D2', value: 15 },
  { name: 'D3', value: 35 },
  { name: 'D4', value: 120 },
];

const testimonials = [
  {
    name: "Sarah Jenkins",
    location: "London, UK",
    text: "I used to spend days writing SEO content. With this AI SEO content writer, my blogs are indexing in minutes! The EEAT content writing tool logic is simply unmatched.",
    rating: 5,
    avatar: "https://picsum.photos/seed/sarah/100/100"
  },
  {
    name: "Michael Chen",
    location: "New York, USA",
    text: "The best email copywriting tool AI has ever produced. I've sent 500 emails using the AI cold email generator and received 45 high-intent replies in just 48 hours.",
    rating: 5,
    avatar: "https://picsum.photos/seed/michael/100/100"
  },
  {
    name: "David Miller",
    location: "Austin, USA",
    text: "Searching for an SEO article writer with featured image capabilities was a pain until I found AI Suite. My B2B cold email writer AI tool results are also incredible.",
    rating: 5,
    avatar: "https://picsum.photos/seed/david/100/100"
  }
];

const faqData = [
  {
    q: "How does the AI pass human detection?",
    a: "Our humanized AI content writer uses a special way of shuffling words. It doesn't write like a robot. This is why it is an AI content that passes AI detection easily. We even have an AI writer with AI detector built in to double-check everything for you."
  },
  {
    q: "Is it good for small businesses?",
    a: "Yes! It is the perfect AI email writer for small business owners. You can use our personalized cold email AI generator free version to start. It helps you sound like a pro without costing a lot of money."
  },
  {
    q: "How do I rank on Google with this?",
    a: "We use a semantic SEO content writer AI engine. It finds the secret words Google loves. This AIO content writing tool makes sure you follow all the rules of an AEO optimized article writer so people can find you faster."
  },
  {
    q: "Can I manage everything in one place?",
    a: "Absolutely. This is an all in one SEO content writing platform. You can write blogs with an AI blog post writer with SEO, create images with the SEO blog writer with branded images AI, and even build sequences with the AI email sequence writer."
  }
];

export default function Home() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleToolNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 text-zinc-900 font-sans antialiased">
      {/* Sticky futuristic navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-zinc-900">AI SUITE</span>
          </div>
          <div className="flex items-center gap-8">
            <div className="hidden lg:flex items-center gap-8 text-[11px] font-black uppercase tracking-widest text-zinc-400">
              <button onClick={() => navigate('/about')} className="hover:text-zinc-900 transition-colors">About Us</button>
              <button onClick={() => navigate('/blog')} className="hover:text-zinc-900 transition-colors">Blog</button>
              <a href="#why" className="hover:text-zinc-900 transition-colors">Why Us</a>
              {isAdmin && (
                <button onClick={() => navigate('/admin')} className="text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1">
                  <Settings size={14} /> Admin
                </button>
              )}
            </div>
            {user ? (
              <button 
                onClick={() => navigate('/optiwrite')}
                className="bg-zinc-900 text-white px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200 active:scale-95"
              >
                Dashboard
              </button>
            ) : (
              <button 
                onClick={() => navigate('/optiwrite')}
                className="bg-zinc-900 text-white px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200 active:scale-95"
              >
                Try For Free
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Admin Quick Access Section - Only for Owners */}
      {isAdmin && (
        <section className="py-12 bg-blue-50 border-y border-blue-100 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tighter">Owner Dashboard</h3>
                <p className="text-sm font-medium text-zinc-500">Manage users, approve payments, and publish blogs from here.</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/admin')}
              className="bg-zinc-900 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-xl"
            >
              Enter Admin Suite <ArrowRight size={16} />
            </button>
          </div>
        </section>
      )}

      {/* Hero: Where the magic starts */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-100/30 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-10 shadow-2xl">
              <Rocket className="w-3.5 h-3.5" /> Welcome To The Future Of Writing
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-zinc-900 tracking-tight leading-[0.95] mb-10">
              The Only <br />
              <span className="text-blue-600">AI SEO Content Writer</span> <br />
              You Really Need.
            </h1>
            <p className="text-zinc-500 text-xl md:text-2xl max-w-4xl mx-auto font-medium leading-relaxed mb-16">
              Imagine a robot that writes just like you. It's smart, it's fast, and it helps you get found on the big internet. This is our AI content writing tool, and it is here to make your work very easy and fun.
            </p>
          </motion.div>

          {/* Interactive Tool Cards with Graphs and CTAs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-6xl mx-auto mb-20">
            {/* OptiWrite Card */}
            <div className="space-y-6">
              <motion.div
                whileHover={{ y: -10 }}
                onMouseEnter={() => setHoveredTool('optiwrite')}
                onMouseLeave={() => setHoveredTool(null)}
                className="group relative bg-zinc-900 rounded-[3rem] p-1 shadow-2xl transition-all cursor-default h-[450px]"
              >
                <div className="bg-zinc-900 rounded-[2.9rem] p-12 h-full flex flex-col items-center text-center relative overflow-hidden">
                  <AnimatePresence>
                    {hoveredTool === 'optiwrite' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute inset-0 bg-blue-600/95 z-20 p-10 flex flex-col justify-center items-center text-white"
                      >
                        <TrendingUp className="w-12 h-12 mb-4" />
                        <h4 className="text-2xl font-black tracking-tighter uppercase mb-4">Ranking Success</h4>
                        <div className="w-full h-32 mb-6">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={optiWriteData}>
                              <Area type="monotone" dataKey="value" stroke="#fff" fill="rgba(255,255,255,0.4)" strokeWidth={4} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                        <p className="text-sm font-bold opacity-90 leading-relaxed max-w-xs">
                          Watch your website go to the top. It's like magic, but with smart math inside!
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="w-20 h-20 bg-blue-500 rounded-3xl flex items-center justify-center mb-8 shadow-lg shadow-blue-500/20 transition-transform group-hover:rotate-6">
                    <PenTool className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase">OptiWrite</h2>
                  <p className="text-zinc-400 text-base font-medium mb-8 leading-relaxed">
                    This is the best AI writer for guest posts 2026. It helps you write stories that the World Wide Web loves.
                  </p>
                  <div className="mt-auto flex flex-col items-center gap-4">
                     <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Hover to see Power</span>
                     <div className="flex items-center gap-3 text-blue-400 font-black uppercase tracking-widest text-xs">
                        Free Credits Applied <Zap size={14} fill="currentColor" />
                     </div>
                  </div>
                </div>
              </motion.div>
              <button 
                onClick={() => handleToolNavigation('/optiwrite')}
                className="w-full bg-zinc-900 text-white py-6 rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] hover:bg-zinc-800 transition-all shadow-xl flex items-center justify-center gap-3 group active:scale-95"
              >
                Launch SEO Content Generator <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
              </button>
            </div>

            {/* CopyElite Card */}
            <div className="space-y-6">
              <motion.div
                whileHover={{ y: -10 }}
                onMouseEnter={() => setHoveredTool('copyelite')}
                onMouseLeave={() => setHoveredTool(null)}
                className="group relative bg-white border-4 border-zinc-900 rounded-[3rem] p-1 shadow-2xl transition-all cursor-default h-[450px]"
              >
                <div className="bg-white rounded-[2.8rem] p-12 h-full flex flex-col items-center text-center relative overflow-hidden">
                  <AnimatePresence>
                    {hoveredTool === 'copyelite' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute inset-0 bg-zinc-900 z-20 p-10 flex flex-col justify-center items-center text-white"
                      >
                        <Layers className="w-12 h-12 mb-4 text-emerald-400" />
                        <h4 className="text-2xl font-black tracking-tighter uppercase mb-4">Leads & Sales</h4>
                        <div className="w-full h-32 mb-6">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={copyEliteData}>
                              <Area type="monotone" dataKey="value" stroke="#10b981" fill="rgba(16,185,129,0.3)" strokeWidth={4} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                        <p className="text-sm font-bold text-zinc-400 leading-relaxed max-w-xs">
                          Count your new friends and happy shoppers. Every email is a chance to grow!
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mb-8 shadow-lg shadow-zinc-200 transition-transform group-hover:-rotate-6">
                    <Mail className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-4xl font-black text-zinc-900 mb-4 tracking-tighter uppercase">CopyElite</h2>
                  <p className="text-zinc-500 text-base font-medium mb-8 leading-relaxed">
                    A special all in one SEO content writing platform for your inbox. Use this AI writer no AI detector needed tool for perfect emails.
                  </p>
                  <div className="mt-auto flex flex-col items-center gap-4">
                     <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2">Hover to see Returns</span>
                     <div className="flex items-center gap-3 text-zinc-900 font-black uppercase tracking-widest text-xs">
                        Ready To Convert <Zap size={14} fill="currentColor" />
                     </div>
                  </div>
                </div>
              </motion.div>
              <button 
                onClick={() => handleToolNavigation('/copyelite')}
                className="w-full bg-blue-600 text-white py-6 rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl flex items-center justify-center gap-3 group active:scale-95"
              >
                Write Your 1st Email <Sparkles className="w-5 h-5 transition-transform group-hover:scale-125" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-zinc-900">What People Are Saying</h2>
            <p className="text-zinc-500 font-medium">Real stories from real users across the globe.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className="bg-zinc-50 p-10 rounded-[3rem] border border-zinc-100 flex flex-col"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
                    <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm tracking-tight">{t.name}</h5>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{t.location}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} size={12} className="text-amber-500 fill-amber-500" />
                  ))}
                </div>
                <Quote size={32} className="text-zinc-200 mb-4" />
                <p className="text-zinc-600 text-sm leading-relaxed italic font-medium flex-grow">"{t.text}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Section: Simply explained */}
      <section id="why" className="py-24 px-6 bg-zinc-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-zinc-900 mb-6 tracking-tight uppercase">Why This Is Good For You</h2>
            <p className="text-zinc-500 text-xl font-medium leading-relaxed max-w-2xl mx-auto">
              Our SEO optimized content generator is like having a teacher and a writer in your computer. It checks everything for you!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-zinc-200 border border-zinc-100 flex flex-col items-start h-full">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-8">
                <CheckCircle2 className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-2xl font-black mb-4 uppercase tracking-tight">EEAT content writing tool</h4>
              <p className="text-zinc-500 text-base leading-relaxed mb-6 font-medium">
                Google wants to know if you are an expert. We show them you are! We teach you how to write EEAT content with AI easily. It tells the computer that your stories can be trusted.
              </p>
              <div className="mt-auto flex items-center gap-2 px-4 py-2 bg-zinc-50 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                <Search size={14} /> Expert Verified Output
              </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-zinc-200 border border-zinc-100 flex flex-col items-start h-full">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-8">
                <BarChart2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h4 className="text-2xl font-black mb-4 uppercase tracking-tight">AI readable score checker tool</h4>
              <p className="text-zinc-500 text-base leading-relaxed mb-6 font-medium">
                Is your story easy to read? Our AI tool that writes and checks readability makes sure even a little kid can understand. It helps more people see your work and like it!
              </p>
              <div className="mt-auto flex items-center gap-2 px-4 py-2 bg-zinc-50 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                <Layout size={14} /> Simplified Sentence Logic
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Deep Dive: Keywords fulfillment */}
      <section id="seo" className="py-24 lg:py-32 px-6 bg-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-50/40 rounded-full blur-[150px] -z-10 translate-x-1/2 -translate-y-1/2" />
        <div className="max-w-7xl mx-auto text-zinc-600">
          <div className="flex flex-col lg:flex-row gap-20 items-center mb-20">
            <div className="lg:w-1/2 space-y-10">
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-10"
                >
                  <Award size={14} /> Top Google Performance
                </motion.div>
                <h2 className="text-5xl md:text-7xl font-black text-zinc-900 mb-8 tracking-tighter leading-[0.9] uppercase">
                  Become An <br />
                  <span className="text-blue-600 underline decoration-blue-100 decoration-8 underline-offset-16">AEO Optimized</span> <br />
                  Article Writer.
                </h2>
                <p className="text-zinc-500 text-xl font-medium leading-relaxed mb-10">
                  Every time you use our AI blog post writer with SEO, it is like planting a seed. The internet is a garden, and your seeds will grow into big trees. We help you use an AI content generator with internal linking that connects all your stories together like a big secret map.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-zinc-500">
                <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 group hover:bg-white hover:shadow-2xl transition-all">
                  <ImageIcon className="w-10 h-10 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
                  <h5 className="font-black text-sm uppercase tracking-widest mb-2 text-zinc-900">SEO article writer with featured image</h5>
                  <p className="text-[11px] leading-relaxed font-bold">Our robot also draws pretty pictures for your blog. You don't have to find them anymore!</p>
                </div>
                <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 group hover:bg-white hover:shadow-2xl transition-all">
                  <UserCheck className="w-10 h-10 text-emerald-500 mb-4 group-hover:scale-110 transition-transform" />
                  <h5 className="font-black text-sm uppercase tracking-widest mb-2 text-zinc-900">guest post writer AI tool</h5>
                  <p className="text-[11px] leading-relaxed font-bold">Write stories for other big websites so more people find out how cool you are.</p>
                </div>
              </div>
            </div>

            <div className="lg:w-1/2 relative group">
              <div className="bg-zinc-900 rounded-[4rem] p-12 text-white shadow-3xl transform group-hover:scale-[1.02] transition-all duration-700">
                <div className="flex gap-2 mb-10">
                   <div className="w-3 h-3 rounded-full bg-red-400" />
                   <div className="w-3 h-3 rounded-full bg-amber-400" />
                   <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="space-y-8">
                  <div className="bg-zinc-800 p-8 rounded-3xl border border-zinc-700/50">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4">Semantic Engine Active</p>
                    <h6 className="text-xl font-bold mb-4">Finding the 'Meaning' hidden in your words...</h6>
                    <div className="flex gap-2 mb-2">
                       <div className="h-1.5 bg-blue-500 rounded-full w-24 animate-pulse" />
                       <div className="h-1.5 bg-zinc-700 rounded-full w-12" />
                    </div>
                  </div>
                  <div className="space-y-4">
                     <div className="h-3 bg-zinc-800 rounded w-full" />
                     <div className="h-3 bg-zinc-800 rounded w-5/6" />
                     <div className="h-3 bg-zinc-800 rounded w-full opacity-50" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-12 max-w-4xl">
             <p className="text-lg leading-relaxed">
               When you use the semantic SEO content writer AI inside OptiWrite, it creates a special AIO content writing tool atmosphere. Plus, being an AI writer for blogs with external links means your site will always have factual proof. We maintain a high standard as a humanized AI content writer to avoid any penalties.
             </p>
             <p className="text-lg leading-relaxed">
               For those wondering how to write cold emails that get replies AI can handle, our engine uses AI email writing with AIDA framework to drive conversions. It is truly the best AI for writing marketing emails 2026.
             </p>
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-zinc-50 rounded-2xl flex items-center gap-3">
                   <Target size={18} className="text-blue-500" />
                   <span className="text-[10px] font-black uppercase tracking-widest">B2B cold email writer AI tool</span>
                </div>
                <div className="p-4 bg-zinc-50 rounded-2xl flex items-center gap-3">
                   <Search size={18} className="text-emerald-500" />
                   <span className="text-[10px] font-black uppercase tracking-widest">AI tool that writes and checks readability</span>
                </div>
                <div className="p-4 bg-zinc-50 rounded-2xl flex items-center gap-3">
                   <ImageIcon size={18} className="text-purple-500" />
                   <span className="text-[10px] font-black uppercase tracking-widest">SEO blog writer with branded images AI</span>
                </div>
                <div className="p-4 bg-zinc-50 rounded-2xl flex items-center gap-3">
                   <Sparkles size={18} className="text-orange-500" />
                   <span className="text-[10px] font-black uppercase tracking-widest">content writing tool with logo image generator</span>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Humanization */}
      <section className="py-24 px-6 bg-zinc-900 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center text-zinc-400">
          <div className="space-y-10">
             <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-none mb-6">
                A <span className="text-emerald-400">Humanized AI</span> <br /> Content Writer.
             </h2>
             <p className="text-lg leading-relaxed font-bold">
                Does your robot sound like a robot? That is no good! Our tool is a humanized AI content writer. We make sure it is AI content that passes AI detection perfectly. It's like having a little secret because we are the AI writer with AI detector built in to keep you safe from errors. This AI content writer that sounds human is a game-changer for digital publishers.
             </p>
             <div className="p-10 bg-zinc-800 rounded-[3rem] border border-zinc-700 border-dashed">
                <h5 className="text-xl font-bold mb-4 flex items-center gap-3">
                   <UserCheck className="text-emerald-400" /> <span className="text-zinc-100 uppercase tracking-tighter">Stealth Mode Engine</span>
                </h5>
                <p className="text-sm leading-relaxed mb-6">
                   It uses pretty words, smart rhythm, and emotion. It is not just about writing; it is about feelings. That is why it is the humanized AI content writer of choice for the world's best teams who need an AI email that sounds human written.
                </p>
             </div>
          </div>
          <div className="relative">
             <div className="flex flex-col gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl transform hover:rotate-2 transition-all">
                   <p className="text-zinc-900 text-sm font-bold leading-relaxed mb-4 italic">"I could not believe it. The blog was so good, I thought my best friend wrote it!"</p>
                   {/* Rest of testimonial visually... */}
                </div>
                <p className="text-[11px] font-medium leading-loose">
                   Whether you are an AI promotional email writer or a customer retention email writer AI, we ensure every word aligns with your voice. Our AI newsletter writer tool and AI transactional email writer work in perfect harmony.
                </p>
             </div>
          </div>
        </div>
      </section>

      {/* Email Deep Dive */}
      <section id="email" className="py-24 lg:py-32 px-6 bg-zinc-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row-reverse gap-24 items-center">
          <div className="lg:w-1/2 space-y-12">
            <h2 className="text-5xl md:text-7xl font-black text-zinc-900 tracking-tighter uppercase leading-[0.9]">
              Elite <br />
              <span className="text-emerald-600">AI Email Writer</span> <br />
              For Smart Growth.
            </h2>
            <p className="text-zinc-500 text-xl font-medium leading-relaxed">
              Writing emails is hard. You want to be nice, but you also want people to say "Yes!" Our AI cold email generator knows exactly how to write cold emails that get replies AI. It's like having a B2B cold email writer AI tool in your pocket. It is easily the best AI email writer for small business users today.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-zinc-500">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-zinc-200">
                 <h5 className="font-black text-sm uppercase tracking-widest mb-3 text-zinc-900">Conversion Flow</h5>
                 <p className="text-[11px] font-bold leading-relaxed">
                    Use our AI transactional email writer or AI warm email writer for building trust. The AI promotional email writer handles all your sales copy needs using an AI email writing with AIDA framework.
                 </p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-zinc-200">
                 <h5 className="font-black text-sm uppercase tracking-widest mb-3 text-zinc-900">Automation Logic</h5>
                 <p className="text-[11px] font-bold leading-relaxed">
                    Create complex sets with our AI email sequence writer. An AI nurture email campaign writer will keep your audience engaged, while a re-engagement email AI generator wins back lost interests.
                 </p>
              </div>
            </div>

            <div className="p-10 bg-zinc-900 rounded-[3rem] text-white space-y-6">
               <p className="text-zinc-400 text-sm leading-relaxed font-bold uppercase tracking-tight">
                  Being an AI tool to write emails like a copywriter means we focus on results. Our email subject line generator AI and email marketing copy generator AI are optimized for the modern inbox.
               </p>
               <div className="flex gap-2">
                  <span className="px-3 py-1 bg-zinc-800 rounded-full text-[9px] font-black uppercase tracking-widest text-zinc-500">AI email copywriter professional tone</span>
                  <span className="px-3 py-1 bg-zinc-800 rounded-full text-[9px] font-black uppercase tracking-widest text-zinc-500">cold email copywriting tool</span>
               </div>
            </div>
          </div>

          <div className="lg:w-1/2 relative">
             <div className="bg-white border-4 border-zinc-900 rounded-[4rem] p-12 shadow-3xl">
                <div className="space-y-6">
                   <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                      <p className="text-base font-bold italic text-zinc-900 tracking-tight">"This personalized cold email AI generator free setup helped me land 3 new clients this week!"</p>
                   </div>
                   <div className="space-y-4 pt-4">
                      <div className="h-3 bg-zinc-100 rounded w-full" />
                      <div className="h-3 bg-zinc-100 rounded w-3/4" />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Accordion FAQs */}
      <section id="faq" className="py-24 px-6 bg-white border-y border-zinc-100">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-black text-zinc-900 uppercase tracking-tighter italic">Simple Answers</h3>
          </div>

          <div className="space-y-4">
            {faqData.map((faq, idx) => (
              <div key={idx} className="bg-zinc-50 rounded-[2rem] border border-zinc-100 overflow-hidden">
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-8 py-6 flex items-center justify-between text-left group"
                >
                  <span className="font-bold text-zinc-900 group-hover:text-blue-600 transition-colors">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-8 pb-8"
                    >
                      <p className="text-zinc-500 text-sm leading-relaxed font-medium pt-2 border-t border-zinc-200/50">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Galactic Footer */}
      <footer className="py-32 px-6 bg-zinc-900 text-white relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none translate-x-1/2 translate-y-1/2" />
        
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="text-center relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-6xl md:text-9xl font-black mb-10 leading-tight tracking-[calc(-0.05em)] uppercase italic">
                Your <span className="text-blue-500">Writing</span> <br /> 
                Grows Up Today.
              </h2>
              <div className="flex flex-wrap justify-center gap-8 mt-16 group">
                <button 
                  onClick={() => navigate('/optiwrite')}
                  className="bg-white text-zinc-900 px-12 py-7 rounded-[2.5rem] text-sm font-black uppercase tracking-[0.2em] hover:bg-zinc-100 hover:scale-105 transition-all shadow-3xl active:scale-95"
                >
                  Start SEO Writing Now
                </button>
                <button 
                  onClick={() => navigate('/copyelite')}
                  className="bg-blue-600 text-white px-12 py-7 rounded-[2.5rem] text-sm font-black uppercase tracking-[0.2em] hover:bg-blue-700 hover:scale-105 transition-all shadow-3xl active:scale-95"
                >
                  Boost Your Leads Now
                </button>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 pt-24 border-t border-zinc-800">
            <div className="md:col-span-4 space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-zinc-900" />
                </div>
                <span className="text-3xl font-black tracking-tighter text-white uppercase">AI SUITE</span>
              </div>
              <p className="text-zinc-500 text-xs font-bold leading-relaxed uppercase tracking-widest max-w-sm">
                The leading AI SEO content writer and marketing engine. Help us scale trust across the entire digital landscape 2026.
              </p>
            </div>

            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-12">
               <div className="space-y-6">
                  <h6 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500">Writing Tools</h6>
                  <ul className="text-xs font-black uppercase tracking-widest space-y-4 text-zinc-400">
                     <li onClick={() => navigate('/optiwrite')} className="hover:text-blue-400 transition-colors cursor-pointer">OptiWrite SEO</li>
                     <li onClick={() => navigate('/copyelite')} className="hover:text-blue-400 transition-colors cursor-pointer">CopyElite B2B</li>
                     <li onClick={() => navigate('/about')} className="hover:text-blue-400 transition-colors cursor-pointer italic underline">About Our Tool</li>
                  </ul>
               </div>
               <div className="space-y-6">
                  <h6 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500">Blog</h6>
                  <ul className="text-xs font-black uppercase tracking-widest space-y-4 text-zinc-400">
                     <li onClick={() => navigate('/blog')} className="hover:text-emerald-400 transition-colors cursor-pointer">Community Blog</li>
                     <li onClick={() => navigate('/blog')} className="hover:text-emerald-400 transition-colors cursor-pointer">SEO Tips</li>
                     <li onClick={() => navigate('/blog')} className="hover:text-emerald-400 transition-colors cursor-pointer">Email Hacks</li>
                  </ul>
               </div>
               <div className="space-y-6">
                  <h6 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500">Support</h6>
                  <ul className="text-xs font-black uppercase tracking-widest space-y-4 text-zinc-400">
                     <li className="hover:text-white transition-colors cursor-pointer">Privacy</li>
                     <li className="hover:text-white transition-colors cursor-pointer">Terms</li>
                     <li className="hover:text-white transition-colors cursor-pointer italic">Safety</li>
                  </ul>
               </div>
            </div>
          </div>
          
          <div className="text-center pt-10">
             <p className="text-[10px] font-black uppercase tracking-[0.8em] text-zinc-800 italic">
                © 2026 AI SUITE — ENGINEERED FOR THE PEOPLE.
             </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
