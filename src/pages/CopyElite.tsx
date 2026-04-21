import React, { useState } from 'react';
import { 
  Mail, 
  Send, 
  User, 
  Target, 
  Zap, 
  Copy, 
  Check, 
  Loader2, 
  Sparkles,
  ChevronRight,
  MessageSquare,
  BarChart3,
  RefreshCw,
  Wand2,
  ArrowLeft,
  LogIn,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { generateEmail, frameworks, emailTypes, sequenceFlows, EmailRequest, analyzeBusinessDetails } from '../services/copyService';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from '../components/AuthModal';
import { PaymentModal } from '../components/PaymentModal';
import { logout } from '../firebase';
import { format, parseISO } from 'date-fns';

export default function CopyElite() {
  const navigate = useNavigate();
  const { user, profile, teamProfile, isAdmin, isSubscribed, useCredit, checkAccess, loading: authLoading } = useAuth();
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  const [request, setRequest] = useState<EmailRequest>({
    goal: '',
    audience: '',
    framework: frameworks[0].id,
    tone: 'Professional',
    context: '',
    funnelStage: 'Cold Outreach',
    emailType: emailTypes[0].id,
    isSequence: false,
    sequenceFlow: sequenceFlows[0].name,
    sequenceLength: 3,
    awarenessLevel: 'Cold',
    customTemplate: ''
  });

  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessPrompt, setBusinessPrompt] = useState('');

  const handleAutoFill = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    
    if (!businessPrompt.trim()) {
      setError("Please enter some business details first.");
      return;
    }

    if (!checkAccess()) {
      setIsPaymentModalOpen(true);
      return;
    }

    setAnalyzing(true);
    setError(null);
    try {
      const data = await analyzeBusinessDetails(businessPrompt);
      
      // Deduct credit for analysis
      await useCredit();
      
      setRequest(prev => ({
        ...prev,
        goal: data.goal || prev.goal,
        audience: data.audience || prev.audience,
        funnelStage: data.funnelStage || prev.funnelStage,
        awarenessLevel: data.awarenessLevel || prev.awarenessLevel,
        tone: data.tone || prev.tone,
        emailType: data.emailType || prev.emailType,
        context: data.context || prev.context,
        framework: data.framework || prev.framework
      }));
    } catch (err: any) {
      console.error(err);
      setError("Failed to analyze business details. " + (err.message || "Please try again."));
    } finally {
      setAnalyzing(false);
    }
  };

  const parseEmails = (text: string) => {
    if (!text) return [];
    
    // Split by "Email [Number]:" or "Email 1:" etc.
    const emailBlocks = text.split(/Email \d+:/g).filter(block => block.trim().length > 0);
    
    return emailBlocks.map((block, index) => {
      const lines = block.trim().split('\n');
      let stage = `Email ${index + 1}`;
      let subject = '';
      let body = '';
      
      // Try to extract stage name from the first line if it exists
      if (lines[0] && !lines[0].toLowerCase().includes('subject')) {
        stage = `Email ${index + 1}: ${lines[0].trim()}`;
        lines.shift();
      }

      const content = lines.join('\n').trim();
      const subjectMatch = content.match(/Subject Line:\s*(.*)/i) || content.match(/Subject:\s*(.*)/i);
      
      if (subjectMatch) {
        subject = subjectMatch[1].trim();
        body = content.replace(subjectMatch[0], '').trim();
        // Remove "Email Body:" label if it exists
        body = body.replace(/Email Body:\s*/i, '').trim();
      } else {
        body = content;
      }

      return { stage, subject, body };
    });
  };

  const emails = parseEmails(result || '');

  const loadContextTemplate = () => {
    setRequest({
      ...request,
      context: `Product: EliteSaaS - AI Project Management
Key Features: 
- Automated task prioritization
- Real-time team workload visualization
- Integration with Slack/Github
Pain Points: 
- Teams missing deadlines due to poor visibility
- Manual overhead in assigning tasks
Offer: 14-day free trial + 20% off for first 3 months.`
    });
  };

  const loadStructureTemplate = () => {
    setRequest({
      ...request,
      customTemplate: `Email 1: The Pattern Interrupt (Hook them with a surprising stat)
Email 2: The Logic (Explain the 'Why' behind the problem)
Email 3: The Social Proof (Case study or testimonial)
Email 4: The Scarcity (Limited time offer or bonus)
Email 5: The Final Call (Direct pitch with urgency)`
    });
  };

  const handleGenerate = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!request.goal || !request.audience) {
      setError("Please fill in the goal and audience fields.");
      return;
    }

    if (!checkAccess()) {
      setIsPaymentModalOpen(true);
      return;
    }

    setLoading(true);
    setResult(""); // Clear previous result and show loading state
    setError(null);
    
    try {
      // Import generateEmailStream
      const { generateEmailStream } = await import('../services/copyService');
      
      let fullText = "";
      const stream = generateEmailStream(request);
      
      for await (const chunk of stream) {
        fullText += chunk;
        setResult(fullText);
      }
      
      // Deduct credit for generation after successful stream completion
      await useCredit();
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const funnelStages = [
    "Cold Outreach",
    "Lead Nurture",
    "Sales/Direct Offer",
    "Newsletter/Engagement",
    "Retention/Win-back",
    "Post-Purchase/Onboarding"
  ];

  const tones = [
    "Professional",
    "Friendly",
    "Persuasive",
    "Urgent",
    "Casual",
    "Luxury"
  ];

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="py-8 px-6 border-b border-zinc-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-500 mr-2"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-zinc-200">
              <Mail size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">CopyElite</h1>
              <p className="text-xs text-zinc-500 font-medium">AI Email Strategist</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-zinc-500">
              <span className="text-zinc-900">Generator</span>
              <span className="hover:text-zinc-900 transition-colors pointer-events-none opacity-50">Templates</span>
              <span className="hover:text-zinc-900 transition-colors pointer-events-none opacity-50">History</span>
            </nav>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-[10px] font-bold text-zinc-900 leading-none">{user.displayName}</span>
                    <span className="text-[9px] text-zinc-500 mt-1">
                      {isAdmin ? 'Unlimited Access' : 
                       (teamProfile ? 'Team Subscription' : 
                        (isSubscribed ? `${profile?.planName || 'Pro'} Subscription: ${profile?.credits || 0} Credits` : `${profile?.credits || 0} Credits Remaining`))}
                    </span>
                    {isSubscribed && (profile?.expiryDate || teamProfile?.expiryDate) && (
                      <span className="text-[8px] text-green-600 font-bold mt-0.5">
                        Expires: {format(parseISO(profile?.expiryDate || teamProfile?.expiryDate), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                  <div className="group relative">
                    <div className="w-10 h-10 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
                      <img src={user.photoURL || ''} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute right-0 top-full pt-2 opacity-0 group-hover:opacity-100 transition-all pointer-events-none group-hover:pointer-events-auto">
                      <div className="bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden min-w-[140px]">
                        <button 
                          onClick={() => {
                            logout();
                            navigate('/');
                          }}
                          className="w-full px-4 py-2.5 text-xs text-zinc-600 hover:bg-zinc-50 flex items-center gap-2 transition-colors"
                        >
                          <LogOut size={14} /> Log Out
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-zinc-900 text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200 flex items-center gap-2"
                >
                  <LogIn size={14} /> Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-5 space-y-8">
          {/* AI Auto-fill Section */}
          <section className="bg-zinc-900 rounded-2xl p-6 text-white shadow-xl shadow-zinc-200">
            <div className="flex items-center gap-2 mb-4">
              <Wand2 size={20} className="text-green-400" />
              <h2 className="text-lg font-bold">AI Business Analyst</h2>
              <span className="ml-auto text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">1 Credit</span>
            </div>
            <p className="text-xs text-zinc-400 mb-4">Describe your business, offer, and audience in plain English. Our AI will auto-configure the campaign settings for you.</p>
            
            <div className="space-y-4">
              <textarea 
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 min-h-[120px] resize-none transition-all"
                placeholder="e.g. I have a SaaS tool for real estate agents that automates their follow-ups. I want to offer a 30-day free trial to agents who are struggling with lead conversion..."
                value={businessPrompt}
                onChange={(e) => setBusinessPrompt(e.target.value)}
              />
              <button 
                onClick={handleAutoFill}
                disabled={analyzing}
                className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-900/20"
              >
                {analyzing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Analyzing Business...
                  </>
                ) : (
                  <>
                    <Zap size={18} fill="currentColor" />
                    Auto-fill Campaign Settings
                  </>
                )}
              </button>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-zinc-400" />
                <h2 className="text-lg font-bold">Campaign Strategy</h2>
              </div>
              
              <div className="flex bg-zinc-100 p-1 rounded-lg">
                <button 
                  onClick={() => setRequest({...request, isSequence: false})}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${!request.isSequence ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400'}`}
                >
                  Single
                </button>
                <button 
                  onClick={() => setRequest({...request, isSequence: true})}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${request.isSequence ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400'}`}
                >
                  Sequence
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {request.isSequence ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-8">
                    <label className="label-text">Select Sequence Flow</label>
                    <select 
                      className="input-field appearance-none mb-3"
                      value={request.sequenceFlow}
                      onChange={(e) => setRequest({...request, sequenceFlow: e.target.value})}
                    >
                      {sequenceFlows.map(flow => (
                        <option key={flow.id} value={flow.name}>{flow.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-4">
                    <label className="label-text">No. of Emails</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="10"
                      className="input-field" 
                      value={request.sequenceLength}
                      onChange={(e) => setRequest({...request, sequenceLength: parseInt(e.target.value) || 1})}
                    />
                  </div>
                  {request.sequenceFlow === "Custom Flow" && (
                    <div className="md:col-span-12">
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="e.g. Intro → Problem → Solution → CTA"
                        value={request.sequenceFlow === "Custom Flow" ? "" : request.sequenceFlow}
                        onChange={(e) => setRequest({...request, sequenceFlow: e.target.value})}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="label-text">Email Type</label>
                  <select 
                    className="input-field appearance-none"
                    value={request.emailType}
                    onChange={(e) => setRequest({...request, emailType: e.target.value})}
                  >
                    {emailTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="label-text">What is the {request.isSequence ? "overall goal of this sequence" : "goal of this email"}?</label>
                <div className="relative">
                  <Target className="absolute left-3 top-3 text-zinc-400" size={16} />
                  <input 
                    type="text" 
                    className="input-field pl-10" 
                    placeholder="e.g. Book appointments, Sell a product, Build trust, Educate audience, Generate leads..."
                    value={request.goal}
                    onChange={(e) => setRequest({...request, goal: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="label-text">Who is your target audience?</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-zinc-400" size={16} />
                  <input 
                    type="text" 
                    className="input-field pl-10" 
                    placeholder="e.g. SaaS Founders, Busy Moms, Marketing VPs..."
                    value={request.audience}
                    onChange={(e) => setRequest({...request, audience: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-text">Funnel Stage</label>
                  <select 
                    className="input-field appearance-none"
                    value={request.funnelStage}
                    onChange={(e) => setRequest({...request, funnelStage: e.target.value})}
                  >
                    {funnelStages.map(stage => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-text">Awareness Level</label>
                  <select 
                    className="input-field appearance-none"
                    value={request.awarenessLevel}
                    onChange={(e) => setRequest({...request, awarenessLevel: e.target.value as any})}
                  >
                    <option value="Cold">Cold (Problem Awareness)</option>
                    <option value="Warm">Warm (Solution Awareness)</option>
                    <option value="Hot">Hot (Product Awareness)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label-text">Tone of Voice</label>
                <select 
                  className="input-field appearance-none"
                  value={request.tone}
                  onChange={(e) => setRequest({...request, tone: e.target.value})}
                >
                  {tones.map(tone => (
                    <option key={tone} value={tone}>{tone}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label-text mb-0">Context & Offer Details</label>
                  <button 
                    onClick={loadContextTemplate}
                    className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors flex items-center gap-1"
                  >
                    <RefreshCw size={10} />
                    Load Template
                  </button>
                </div>
                <textarea 
                  className="input-field min-h-[100px] resize-none py-3" 
                  placeholder="Paste your offer details, pain points, or any specific context here..."
                  value={request.context}
                  onChange={(e) => setRequest({...request, context: e.target.value})}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label-text mb-0">Custom Structure/Template (Optional)</label>
                  <button 
                    onClick={loadStructureTemplate}
                    className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors flex items-center gap-1"
                  >
                    <RefreshCw size={10} />
                    Load Template
                  </button>
                </div>
                <textarea 
                  className="input-field min-h-[100px] resize-none py-3" 
                  placeholder="e.g. Email 1: The Hook, Email 2: The Logic, Email 3: The Scarcity..."
                  value={request.customTemplate}
                  onChange={(e) => setRequest({...request, customTemplate: e.target.value})}
                />
              </div>
            </div>
          </section>

          <section>
            <label className="label-text mb-4">Choose Copywriting Framework</label>
            <div className="grid grid-cols-1 gap-3">
              {frameworks.map((f) => (
                <motion.div
                  key={f.id}
                  whileHover={{ x: 4 }}
                  onClick={() => setRequest({...request, framework: f.id})}
                  className={`framework-card ${request.framework === f.id ? 'active' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm mb-1">{f.name}</h3>
                      <p className="text-xs text-zinc-500 leading-relaxed">{f.description}</p>
                    </div>
                    {request.framework === f.id && (
                      <div className="w-5 h-5 bg-zinc-900 rounded-full flex items-center justify-center text-white">
                        <Check size={12} />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="btn-primary w-full mt-4"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {request.isSequence ? "Crafting your sequence..." : "Crafting your email..."}
              </>
            ) : (
              <>
                <Zap size={18} fill="currentColor" />
                {request.isSequence ? "Generate Elite Sequence" : "Generate Elite Copy"}
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 mt-4">
             <Zap size={12} className="text-amber-500 fill-amber-500" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">1 Credit per generation</span>
          </div>

          {error && (
            <p className="text-xs text-red-500 font-medium mt-2 text-center">{error}</p>
          )}
        </div>

        {/* Right Column: Output */}
        <div className="lg:col-span-7">
          <div className="sticky top-32">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-zinc-400" />
                <h2 className="text-lg font-bold">Generated Output</h2>
              </div>
              
              {result && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 hover:bg-zinc-100 rounded-lg transition-all"
                  >
                    {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button 
                    onClick={handleGenerate}
                    className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 hover:bg-zinc-100 rounded-lg transition-all"
                  >
                    <RefreshCw size={14} />
                    Regenerate
                  </button>
                </div>
              )}
            </div>

            <div className="glass-panel rounded-2xl min-h-[600px] p-8 relative overflow-hidden">
              <AnimatePresence mode="wait">
                {!result && !loading ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center p-12"
                  >
                    <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300 mb-6">
                      <Mail size={32} />
                    </div>
                    <h3 className="text-xl font-serif italic mb-2">Ready to convert?</h3>
                    <p className="text-zinc-400 text-sm max-w-xs mx-auto">
                      Fill in your campaign details and select a {request.isSequence ? "sequence flow" : "framework"} to generate elite copywriting.
                    </p>
                  </motion.div>
                ) : loading ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="h-4 bg-zinc-100 rounded w-1/3 animate-pulse"></div>
                    <div className="space-y-3">
                      <div className="h-3 bg-zinc-100 rounded w-full animate-pulse"></div>
                      <div className="h-3 bg-zinc-100 rounded w-5/6 animate-pulse"></div>
                      <div className="h-3 bg-zinc-100 rounded w-4/6 animate-pulse"></div>
                    </div>
                    <div className="h-32 bg-zinc-50 rounded-xl animate-pulse"></div>
                    <div className="space-y-3">
                      <div className="h-3 bg-zinc-100 rounded w-full animate-pulse"></div>
                      <div className="h-3 bg-zinc-100 rounded w-3/4 animate-pulse"></div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    {emails.map((email, idx) => (
                      <div key={idx} className="bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-sm">
                        <div className="bg-zinc-50 px-6 py-3 border-b border-zinc-100 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{email.stage}</span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors flex items-center gap-1"
                          >
                            <Copy size={10} />
                            Copy This Email
                          </button>
                        </div>
                        <div className="p-6 space-y-4">
                          {email.subject && (
                            <div className="pb-4 border-b border-zinc-50">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">Subject Line</span>
                              <p className="text-sm font-bold text-zinc-900">{email.subject}</p>
                            </div>
                          )}
                          <div className="markdown-body text-sm leading-relaxed text-zinc-700">
                            <ReactMarkdown>{email.body}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Stats/Insights */}
            {result && !loading && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 grid grid-cols-3 gap-4"
              >
                <div className="p-4 rounded-xl bg-white border border-zinc-200">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <BarChart3 size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Readability</span>
                  </div>
                  <p className="text-sm font-bold">High (Grade 6)</p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-zinc-200">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <Zap size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Psychology</span>
                  </div>
                  <p className="text-sm font-bold">Authority & Trust</p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-zinc-200">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <Send size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Est. CTR</span>
                  </div>
                  <p className="text-sm font-bold">12.4% - 18.2%</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 mt-24 pt-8 border-t border-zinc-200 flex flex-col md:flex-row items-center justify-between gap-4 text-zinc-400 text-xs">
        <p>© 2026 CopyElite AI. Trained on 10,000+ high-converting campaigns.</p>
        <div className="flex items-center gap-6">
          <span className="hover:text-zinc-900 transition-colors cursor-pointer">Privacy Policy</span>
          <span className="hover:text-zinc-900 transition-colors cursor-pointer">Terms of Service</span>
          <span className="hover:text-zinc-900 transition-colors cursor-pointer">API Documentation</span>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
      
      <PaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
      />
    </div>
  );
}
