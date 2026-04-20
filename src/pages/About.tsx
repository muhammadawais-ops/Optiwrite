import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Sparkles, 
  Clock, 
  Split, 
  Cpu, 
  Rocket,
  Heart,
  User,
  Coffee,
  CheckCircle2,
  Workflow
} from 'lucide-react';

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 text-zinc-900 font-sans antialiased">
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

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-24 h-24 bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-2xl rotate-3 hover:rotate-0 transition-transform">
              <User className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-zinc-900 tracking-tight leading-none mb-8">
              Hello! This is My Story.
            </h1>
            <p className="text-zinc-500 text-xl font-medium leading-relaxed">
              I have been helping people on the internet for over <span className="text-zinc-900 font-bold underline decoration-blue-100">8 years</span>. My name is Muhammad Awais, and I love building things that make life easier.
            </p>
          </motion.div>
        </div>
      </section>

      {/* The Journey */}
      <section className="py-20 px-6 bg-zinc-50">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl font-black uppercase tracking-tighter">The "Old Way" of Writing</h2>
            <p className="text-zinc-500 text-base leading-relaxed font-medium">
              A long time ago, before the smart robots (AI) were here, writing a good story for a website took me <span className="text-zinc-900 font-bold">4 or 5 hours</span>. 
            </p>
            <div className="space-y-4">
              {[
                "Switching between many tabs on my browser.",
                "Searching for internal and external links manually.",
                "Waiting for designers to make pictures.",
                "Buying expensive tools just to check if it's 'readable'."
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-red-50 text-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock size={14} />
                  </div>
                  <span className="text-sm font-bold text-zinc-600">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-zinc-100 rotate-2">
              <h3 className="text-2xl font-black mb-6 italic">Too much work?</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                I was tired. My eyes were heavy. Every blog was a struggle against time and too many tools. I knew there had to be a better way.
              </p>
              <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                <div className="w-3/4 h-full bg-red-400 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The AI Era */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="relative order-2 md:order-1">
             <div className="bg-zinc-900 rounded-[3rem] p-10 text-white shadow-3xl -rotate-2">
                <Cpu className="w-12 h-12 text-blue-400 mb-8" />
                <h3 className="text-2xl font-black mb-6 uppercase tracking-tight">The Lightbulb Moment</h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                  When AI came, work got faster—down to <span className="text-white font-bold">1 hour</span>. But the problem remained: too many tabs, expensive subscriptions, and content that sounded like a robot.
                </p>
                <div className="flex gap-4">
                   <div className="px-4 py-2 bg-blue-500/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-blue-400 border border-blue-500/20">Efficiency</div>
                   <div className="px-4 py-2 bg-purple-500/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-purple-400 border border-purple-500/20">Quality</div>
                </div>
             </div>
          </div>
          <div className="space-y-8 order-1 md:order-2">
            <h2 className="text-4xl font-black uppercase tracking-tighter">Why I Built AI Suite</h2>
            <p className="text-zinc-500 text-lg leading-relaxed font-medium">
              I wanted to build <span className="text-zinc-900 font-black">ONE</span> tool that does it all. A tool that follows Google's rules, writes like a human, and doesn't make you switch tabs.
            </p>
            <ul className="space-y-4">
               {[
                 "Humanized content that passes every test.",
                 "Built-in image and logo generation.",
                 "Automatic linking and SEO research.",
                 "Professional email copywriting in seconds."
               ].map((item, index) => (
                 <li key={index} className="flex items-center gap-3">
                   <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                   <span className="text-sm font-bold text-zinc-700">{item}</span>
                 </li>
               ))}
            </ul>
          </div>
        </div>
      </section>

      {/* The Mission */}
      <section className="py-24 px-6 bg-zinc-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Heart className="w-16 h-16 text-red-500 mx-auto mb-10 animate-pulse" />
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-10">Our Mission is Simple.</h2>
          <p className="text-zinc-400 text-xl font-medium leading-relaxed mb-12">
            Help entrepreneurs and writers scale their business without the stress of "Tech Overload". We keep the brain human, and let the AI do the heavy lifting of the hands.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
               <p className="text-3xl font-black mb-1 italic">8+</p>
               <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Years Experience</p>
            </div>
            <div>
               <p className="text-3xl font-black mb-1 italic">10k+</p>
               <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Reports Generated</p>
            </div>
            <div>
               <p className="text-3xl font-black mb-1 italic">1M+</p>
               <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Words Published</p>
            </div>
            <div>
               <p className="text-3xl font-black mb-1 italic">0</p>
               <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Tab Switching</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <footer className="py-24 px-6 border-t border-zinc-100 text-center">
        <h2 className="text-3xl font-black mb-8 uppercase tracking-tighter italic">Join us on this journey.</h2>
        <div className="flex justify-center gap-6">
          <button 
            onClick={() => navigate('/optiwrite')}
            className="bg-zinc-900 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl active:scale-95"
          >
            Launch The Suite
          </button>
        </div>
        <p className="mt-20 text-[10px] font-black uppercase tracking-[0.5em] text-zinc-300">© 2026 AI SUITE — BY MUHAMMAD AWAIS</p>
      </footer>
    </div>
  );
}
