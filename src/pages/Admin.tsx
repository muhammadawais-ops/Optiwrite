import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  CreditCard, 
  Check, 
  X, 
  Shield, 
  ArrowLeft, 
  Sparkles,
  Search,
  Zap,
  TrendingUp,
  Layout,
  Plus,
  BookOpen,
  Trash2,
  Edit2,
  Save,
  Image as ImageIcon
} from 'lucide-react';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  increment, 
  addDoc, 
  deleteDoc,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function Admin() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'users' | 'payments' | 'blogs'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Security
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState('');

  // Blog form
  const [isEditingBlog, setIsEditingBlog] = useState(false);
  const [currentBlog, setCurrentBlog] = useState<any>(null);
  const [blogForm, setBlogForm] = useState({
    title: '',
    content: '',
    imageUrl: '',
    category: 'SEO Strategy',
    author: 'Muhammad Awais'
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }

    const unsubUsers = onSnapshot(query(collection(db, 'users'), orderBy('createdAt', 'desc')), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubPayments = onSnapshot(query(collection(db, 'payments'), orderBy('submittedAt', 'desc')), (snapshot) => {
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubBlogs = onSnapshot(query(collection(db, 'blogs'), orderBy('createdAt', 'desc')), (snapshot) => {
      setBlogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubUsers();
      unsubPayments();
      unsubBlogs();
    };
  }, [isAdmin, navigate]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Aksafasihu') {
      setIsUnlocked(true);
      setError('');
    } else {
      setError('Invalid Access Key');
    }
  };

  const handleApprovePayment = async (payment: any) => {
    try {
      await updateDoc(doc(db, 'payments', payment.id), {
        status: 'approved',
        verifiedAt: new Date().toISOString()
      });
      await updateDoc(doc(db, 'users', payment.uid), {
        subscriptionStatus: 'active',
        credits: increment(payment.amount || 100),
        planName: 'Elite',
        showWelcomePopup: true,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
      alert('Payment approved and plan activated!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectPayment = async (payment: any) => {
    if (confirm('Are you sure you want to REJECT this payment?')) {
      try {
        await updateDoc(doc(db, 'payments', payment.id), {
          status: 'rejected',
          verifiedAt: new Date().toISOString()
        });
        alert('Payment rejected.');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleResetCredits = async (userId: string) => {
    const amountStr = prompt('Enter credits to GIVE (number):', '10');
    if (!amountStr) return;
    const amount = parseInt(amountStr);
    if (isNaN(amount)) return;

    try {
      await updateDoc(doc(db, 'users', userId), {
        credits: amount
      });
      alert(`Credits updated to ${amount}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveBlog = async () => {
    if (!blogForm.title || !blogForm.content) return;

    try {
      if (currentBlog) {
        await updateDoc(doc(db, 'blogs', currentBlog.id), {
          ...blogForm,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'blogs'), {
          ...blogForm,
          createdAt: new Date().toISOString()
        });
      }
      setIsEditingBlog(false);
      setBlogForm({ title: '', content: '', imageUrl: '', category: 'SEO Strategy', author: 'Muhammad Awais' });
      setCurrentBlog(null);
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '...';
    if (typeof date === 'string') return new Date(date).toLocaleDateString();
    if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString();
    return new Date(date).toLocaleDateString();
  };

  if (!isAdmin) return null;

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl text-center"
        >
          <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
             <Shield className="w-10 h-10 text-zinc-900" />
          </div>
          <h2 className="text-3xl font-black mb-2 tracking-tighter uppercase italic">Secure Access</h2>
          <p className="text-zinc-400 text-sm mb-8 font-medium italic">Identification required for AI Suite Control Center.</p>
          
          <form onSubmit={handleUnlock} className="space-y-4">
             <input 
                type="password"
                placeholder="Enter Admin Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-6 text-center font-black tracking-widest focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all"
             />
             {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{error}</p>}
             <button 
                type="submit"
                className="w-full bg-zinc-900 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl"
             >
                Unlock Terminal
             </button>
             <button 
                type="button"
                onClick={() => navigate('/')}
                className="w-full text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:text-zinc-900 mt-4"
             >
                Return to Surface
             </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans antialiased">
      {/* Sidebar / Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-zinc-100 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter">AI SUITE ADMIN</span>
          </div>
          <div className="flex bg-zinc-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              <Users size={14} /> Users
            </button>
            <button 
              onClick={() => setActiveTab('payments')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'payments' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              <CreditCard size={14} /> Payments
            </button>
            <button 
              onClick={() => setActiveTab('blogs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'blogs' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              <BookOpen size={14} /> Blog
            </button>
          </div>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-900 transition-all"
        >
          <ArrowLeft size={16} /> Exit
        </button>
      </nav>

      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
        {/* Search */}
        <div className="mb-8 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/10 font-bold"
          />
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'users' && (
            <motion.div 
              key="users"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Credits</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Created</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-bold divide-y divide-zinc-100">
                    {users.filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                      <tr key={u.id}>
                        <td className="px-6 py-4">
                          <p className="text-zinc-900">{u.displayName}</p>
                          <p className="text-xs text-zinc-400">{u.email}</p>
                        </td>
                        <td className="px-6 py-4 uppercase text-[10px]"><span className={u.role === 'admin' ? 'text-blue-600' : 'text-zinc-400'}>{u.role}</span></td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                             {u.credits}
                             <button 
                               onClick={() => handleResetCredits(u.id)}
                               className="p-1.5 bg-zinc-100 text-zinc-400 rounded-md hover:bg-zinc-200 hover:text-zinc-900 transition-all"
                               title="Give Credits"
                             >
                                <Plus size={10} />
                             </button>
                           </div>
                        </td>
                        <td className="px-6 py-4 uppercase text-[10px] tracking-widest">{u.subscriptionStatus}</td>
                        <td className="px-6 py-4 text-zinc-400">{formatDate(u.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'payments' && (
            <motion.div 
              key="payments"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {payments.filter(p => p.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                  <div key={p.id} className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400">
                        <CreditCard size={24} />
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${p.status === 'pending' ? 'bg-amber-100 text-amber-600' : p.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                        {p.status}
                      </span>
                    </div>
                    <h5 className="font-black text-lg tracking-tight mb-1 truncate">{p.userEmail}</h5>
                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-6">Submitted: {formatDate(p.submittedAt)}</p>
                    
                    {p.status === 'pending' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleApprovePayment(p)}
                          className="flex-grow bg-zinc-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button 
                          onClick={() => handleRejectPayment(p)}
                          className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'blogs' && (
            <motion.div 
              key="blogs"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-center bg-zinc-900 p-8 rounded-[2.5rem] text-white overflow-hidden relative">
                 <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Content Management</h3>
                    <p className="text-zinc-400 text-sm font-medium">Write, edit, and publish blogs to AI Suite.</p>
                 </div>
                 <button 
                    onClick={() => {
                      setIsEditingBlog(true);
                      setCurrentBlog(null);
                      setBlogForm({ title: '', content: '', imageUrl: '', category: 'SEO Strategy', author: 'Muhammad Awais' });
                    }}
                    className="bg-white text-zinc-900 w-12 h-12 rounded-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
                 >
                    <Plus size={24} />
                 </button>
              </div>

              {isEditingBlog ? (
                <div className="bg-white p-10 rounded-[3rem] border border-zinc-200 shadow-2xl space-y-6">
                  <div className="flex justify-between items-center mb-6">
                     <h4 className="text-xl font-black uppercase tracking-tighter">{currentBlog ? 'Edit' : 'New'} Blog Post</h4>
                     <button onClick={() => setIsEditingBlog(false)} className="text-zinc-400 hover:text-zinc-900 transition-colors"><X size={24} /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Post Title</label>
                       <input 
                          type="text" 
                          value={blogForm.title}
                          onChange={(e) => setBlogForm({...blogForm, title: e.target.value})}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 font-bold focus:outline-none"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Category</label>
                       <input 
                          type="text" 
                          value={blogForm.category}
                          onChange={(e) => setBlogForm({...blogForm, category: e.target.value})}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 font-bold focus:outline-none"
                       />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Image URL</label>
                       <input 
                          type="text" 
                          value={blogForm.imageUrl}
                          onChange={(e) => setBlogForm({...blogForm, imageUrl: e.target.value})}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 font-bold focus:outline-none"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Author</label>
                       <input 
                          type="text" 
                          value={blogForm.author}
                          onChange={(e) => setBlogForm({...blogForm, author: e.target.value})}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 font-bold focus:outline-none"
                       />
                    </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Content (Markdown)</label>
                     <textarea 
                        rows={12}
                        value={blogForm.content}
                        onChange={(e) => setBlogForm({...blogForm, content: e.target.value})}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-4 px-4 font-bold focus:outline-none resize-none"
                     />
                  </div>
                  <button 
                    onClick={handleSaveBlog}
                    className="w-full bg-zinc-900 text-white py-6 rounded-[2rem] text-sm font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl flex items-center justify-center gap-3"
                  >
                    <Save size={18} /> Save & Publish
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {blogs.map(b => (
                    <div key={b.id} className="bg-white p-6 rounded-[2.5rem] border border-zinc-200 flex gap-6">
                       <div className="w-24 h-24 bg-zinc-100 rounded-2xl flex-shrink-0 overflow-hidden relative">
                          {b.imageUrl ? (
                            <img src={b.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-300"><BookOpen size={32} /></div>
                          )}
                       </div>
                       <div className="flex-grow flex flex-col justify-between overflow-hidden">
                          <div>
                            <h4 className="font-bold text-zinc-900 mb-1 truncate">{b.title}</h4>
                            <div className="flex items-center gap-2">
                               <span className="text-[8px] font-black uppercase tracking-widest bg-zinc-100 px-2 py-0.5 rounded text-zinc-500">{b.category || 'Insights'}</span>
                               <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">{formatDate(b.createdAt)}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                             <button 
                               onClick={() => {
                                 setBlogForm({ 
                                   title: b.title, 
                                   content: b.content, 
                                   imageUrl: b.imageUrl || '', 
                                   category: b.category || 'SEO Strategy',
                                   author: b.author || 'Muhammad Awais' 
                                 });
                                 setCurrentBlog(b);
                                 setIsEditingBlog(true);
                               }}
                               className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all border border-blue-100"
                             >
                                <Edit2 size={14} />
                             </button>
                             <button 
                               onClick={() => {
                                  if(confirm('Delete blog?')) deleteDoc(doc(db, 'blogs', b.id));
                               }}
                               className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all border border-red-100"
                             >
                                <Trash2 size={14} />
                             </button>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
