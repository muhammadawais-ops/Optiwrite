import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, CheckCircle2, XCircle, ExternalLink, Loader2, X, AlertCircle, RefreshCw, Users, CreditCard as PaymentIcon, MessageCircle, MoreVertical, Trash2, Key } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, getDocs, writeBatch, orderBy, setDoc, deleteField } from 'firebase/firestore';
import { db } from '../firebase';
import { addDays } from 'date-fns';
import { cn } from '../lib/utils';

interface Payment {
  id: string;
  uid: string;
  userEmail: string;
  senderName?: string;
  whatsappNumber?: string;
  proofUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  planId?: string;
  planName?: string;
  credits?: number;
  amountPKR?: number;
  amountUSD?: number;
  submittedAt: string;
}

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  credits: number;
  subscriptionStatus: string;
  expiryDate?: string;
  planId?: string;
  planName?: string;
}

export function AdminPanel({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'payments' | 'users'>('payments');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;

    setLoading(true);
    let unsubscribe: () => void;

    if (activeTab === 'payments') {
      const q = query(collection(db, 'payments'), where('status', '==', 'pending'), orderBy('submittedAt', 'desc'));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
        setPayments(data);
        setLoading(false);
      }, (err) => {
        console.error("Admin fetch error:", err);
        setError("Failed to fetch pending payments.");
        setLoading(false);
      });
    } else {
      const q = query(collection(db, 'users'), orderBy('email', 'asc'));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
        setUsers(data);
        setLoading(false);
      }, (err) => {
        console.error("Admin fetch error:", err);
        setError("Failed to fetch users.");
        setLoading(false);
      });
    }

    return () => unsubscribe?.();
  }, [isOpen, isAuthenticated, activeTab]);

  const resetAllCredits = async () => {
    if (!window.confirm("Are you sure you want to reset ALL users' credits to 10?")) return;
    
    setIsResetting(true);
    console.log("Starting global credit reset...");
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      console.log(`Found ${usersSnap.size} users to reset.`);
      const batch = writeBatch(db);
      usersSnap.docs.forEach(userDoc => {
        batch.update(userDoc.ref, { credits: 10 });
      });
      await batch.commit();
      console.log("Global reset successful.");
      alert("All users' credits reset to 10!");
    } catch (err: any) {
      console.error("Global reset error:", err);
      alert(`Failed to reset credits: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const [resettingUser, setResettingUser] = useState<string | null>(null);

  const resetUserCredits = async (userId: string, email: string) => {
    setResettingUser(userId);
    setOpenMenuId(null);
    console.log(`Resetting credits for user: ${email} (${userId})`);
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { 
        credits: 10,
        subscriptionStatus: 'free',
        planId: deleteField(),
        planName: deleteField(),
        expiryDate: deleteField()
      });
      console.log(`Reset successful for ${email}`);
    } catch (err: any) {
      console.error(`Reset error for ${email}:`, err);
      alert(`Failed to reset credits: ${err.message}`);
    } finally {
      setResettingUser(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    if (deletePassword !== "Aksafasihu") {
      setDeleteError("Invalid admin password.");
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteDoc(doc(db, 'users', userToDelete.uid));
      setUserToDelete(null);
      setDeletePassword("");
      alert("User deleted successfully.");
    } catch (err: any) {
      console.error("Delete error:", err);
      setDeleteError(`Failed to delete user: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApprove = async (payment: Payment) => {
    try {
      const expiryDate = addDays(new Date(), 30).toISOString();
      const creditsToAdd = payment.credits || 10;
      
      // Update payment status
      await updateDoc(doc(db, 'payments', payment.id), {
        status: 'approved',
        verifiedAt: new Date().toISOString()
      });

      // Update user subscription
      await updateDoc(doc(db, 'users', payment.uid), {
        subscriptionStatus: 'active',
        expiryDate: expiryDate,
        credits: creditsToAdd,
        planId: payment.planId,
        planName: payment.planName || 'Pro',
        showWelcomePopup: true // Flag to show the popup on next login
      });

      // If it's a team plan, also update the teams collection for domain-based access
      if (payment.planId === 'team' && payment.userEmail) {
        const domain = payment.userEmail.split('@')[1];
        // Exclude common public domains
        const publicDomains = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com'];
        if (domain && !publicDomains.includes(domain.toLowerCase())) {
          await setDoc(doc(db, 'teams', domain.toLowerCase()), {
            expiryDate: expiryDate,
            credits: creditsToAdd,
            ownerUid: payment.uid,
            planName: 'Team',
            updatedAt: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.error("Approval error:", err);
      alert("Failed to approve payment.");
    }
  };

  const handleReject = async (payment: Payment) => {
    try {
      await updateDoc(doc(db, 'payments', payment.id), {
        status: 'rejected',
        verifiedAt: new Date().toISOString()
      });

      await updateDoc(doc(db, 'users', payment.uid), {
        subscriptionStatus: 'free'
      });
    } catch (err) {
      console.error("Rejection error:", err);
      alert("Failed to reject payment.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-4xl h-[80vh] bg-white rounded-3xl p-8 shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 to-orange-600" />
            
            {!isAuthenticated ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
                  <Shield className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-black text-zinc-900 mb-2">Admin Security</h2>
                <p className="text-zinc-500 mb-8 max-w-xs">Please enter the security password to access the admin panel.</p>
                
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (password === "Aksafasihu") {
                      setIsAuthenticated(true);
                      setError(null);
                    } else {
                      setError("Invalid security password.");
                    }
                  }}
                  className="w-full max-w-xs space-y-4"
                >
                  <input 
                    type="password"
                    placeholder="Enter password"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                  />
                  {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
                  <button 
                    type="submit"
                    className="w-full bg-zinc-900 text-white font-bold py-4 rounded-2xl hover:bg-zinc-800 transition-all active:scale-95"
                  >
                    Access Panel
                  </button>
                  <button 
                    type="button"
                    onClick={onClose}
                    className="w-full text-zinc-400 text-xs font-bold uppercase tracking-widest hover:text-zinc-900 transition-colors"
                  >
                    Cancel
                  </button>
                </form>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-zinc-900 flex items-center gap-2">
                      <Shield className="w-6 h-6 text-red-600" />
                      Admin Panel
                    </h2>
                    <p className="text-zinc-500 mt-1">Manage payments and user credits.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => {
                        setLoading(true);
                        // This will trigger the useEffect re-fetch
                        setActiveTab(activeTab); 
                      }}
                      className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                      title="Refresh Data"
                    >
                      <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
                    </button>
                    <button 
                      onClick={onClose}
                      className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 mb-8">
                  <button
                    onClick={() => setActiveTab('payments')}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all",
                      activeTab === 'payments' 
                        ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200" 
                        : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                    )}
                  >
                    <PaymentIcon className="w-4 h-4" />
                    Pending Payments
                    {payments.length > 0 && (
                      <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                        {payments.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('users')}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all",
                      activeTab === 'users' 
                        ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200" 
                        : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                    )}
                  >
                    <Users className="w-4 h-4" />
                    User Management
                  </button>
                  
                  {activeTab === 'users' && (
                    <button 
                      onClick={resetAllCredits}
                      disabled={isResetting}
                      className="ml-auto flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-6 py-3 rounded-2xl font-bold transition-all disabled:opacity-50"
                    >
                      {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      Reset All Credits (10)
                    </button>
                  )}
                </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 flex items-center gap-2 font-bold">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            <div className="flex-1 overflow-y-auto pr-2">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-zinc-300 animate-spin" />
                </div>
              ) : activeTab === 'payments' ? (
                payments.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                    <CheckCircle2 className="w-16 h-16 mb-4" />
                    <h3 className="text-xl font-bold">All caught up!</h3>
                    <p>No pending payments to verify.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payments.map((payment) => (
                      <div key={payment.id} className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
                        <div className="w-full md:w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
                          <MessageCircle className="w-8 h-8" />
                        </div>

                        <div className="flex-1 text-center md:text-left">
                          <div className="text-lg font-black text-zinc-900">{payment.senderName || 'Unknown Sender'}</div>
                          <div className="text-sm text-zinc-500">{payment.userEmail}</div>
                          {payment.whatsappNumber && (
                            <a 
                              href={`https://wa.me/${payment.whatsappNumber.replace(/\+/g, '').replace(/\s/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-bold text-green-600 hover:underline mt-1"
                            >
                              <MessageCircle className="w-3 h-3" />
                              WhatsApp: {payment.whatsappNumber}
                            </a>
                          )}
                          <div className="text-xs text-zinc-400 mt-1">
                            Submitted: {new Date(payment.submittedAt).toLocaleString()}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                              {payment.planName || 'Pro'} Plan
                            </div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                              {payment.amountPKR || 999} PKR / ${payment.amountUSD || 3.58}
                            </div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                              {payment.credits || 0} Credits
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                          <button
                            onClick={() => handleReject(payment)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 font-bold px-6 py-3 rounded-xl hover:bg-red-50 transition-all active:scale-95"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                          <button
                            onClick={() => handleApprove(payment)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-200 active:scale-95"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Approve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="space-y-2">
                  {users.map((user) => (
                    <div key={user.uid} className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-zinc-900">{user.displayName || 'No Name'}</div>
                          <div className="text-xs text-zinc-400">•</div>
                          <div className="text-xs text-zinc-500">{user.email}</div>
                        </div>
                        <div className="text-xs text-zinc-500 flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" />
                            Credits: {user.role === 'admin' ? 'Unlimited' : user.credits}
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest",
                            user.subscriptionStatus === 'active' ? "bg-green-100 text-green-600" : 
                            user.subscriptionStatus === 'pending' ? "bg-blue-100 text-blue-600" :
                            "bg-zinc-200 text-zinc-600"
                          )}>
                            {user.subscriptionStatus === 'active' ? `${user.planName || 'Pro'} Plan` : user.subscriptionStatus}
                          </span>
                          {user.subscriptionStatus === 'active' && user.expiryDate && (
                            <span className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              Expires: {new Date(user.expiryDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === user.uid ? null : user.uid)}
                          className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        <AnimatePresence>
                          {openMenuId === user.uid && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setOpenMenuId(null)}
                              />
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="absolute right-0 mt-2 w-48 bg-white border border-zinc-200 rounded-2xl shadow-xl z-20 overflow-hidden"
                              >
                                <button
                                  onClick={() => resetUserCredits(user.uid, user.email)}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-colors"
                                >
                                  <RefreshCw className={cn("w-4 h-4", resettingUser === user.uid && "animate-spin")} />
                                  Renew Credits (10)
                                </button>
                                <button
                                  onClick={() => {
                                    setUserToDelete(user);
                                    setOpenMenuId(null);
                                    setDeletePassword("");
                                    setDeleteError(null);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete User
                                </button>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>

      {/* Delete Verification Modal */}
      <AnimatePresence>
        {userToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setUserToDelete(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-black text-zinc-900 mb-2">Delete User?</h3>
              <p className="text-zinc-500 mb-8 text-sm">
                Are you sure you want to delete <span className="font-bold text-zinc-900">{userToDelete.email}</span>? This action cannot be undone.
              </p>

              <div className="space-y-4">
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input 
                    type="password"
                    placeholder="Enter admin password"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    autoFocus
                  />
                </div>
                {deleteError && <p className="text-xs text-red-500 font-bold">{deleteError}</p>}
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setUserToDelete(null)}
                    className="flex-1 bg-zinc-100 text-zinc-600 font-bold py-4 rounded-2xl hover:bg-zinc-200 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDeleteUser}
                    disabled={isDeleting}
                    className="flex-1 bg-red-600 text-white font-bold py-4 rounded-2xl hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-200 disabled:opacity-50"
                  >
                    {isDeleting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Delete Now"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )}
</AnimatePresence>
  );
}
