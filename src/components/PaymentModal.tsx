import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, CheckCircle2, X, Loader2, AlertCircle, MessageCircle } from 'lucide-react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

export function PaymentModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { user } = useAuth();
  const [senderName, setSenderName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro' | 'team'>('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plans = [
    { 
      id: 'basic', 
      name: 'Basic', 
      pricePKR: 500, 
      priceUSD: 2, 
      credits: 700, 
      description: 'Perfect for beginners' 
    },
    { 
      id: 'pro', 
      name: 'Pro', 
      pricePKR: 1500, 
      priceUSD: 6, 
      credits: 2000, 
      description: 'Best for power users' 
    },
    { 
      id: 'team', 
      name: 'Team', 
      pricePKR: 14000, 
      priceUSD: 50, 
      credits: 50000, 
      description: 'For domains & teams' 
    }
  ];

  const handleSubmit = async () => {
    if (!user || !senderName.trim() || !whatsappNumber.trim()) {
      setError("Please provide your name and WhatsApp number.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const plan = plans.find(p => p.id === selectedPlan)!;

    try {
      console.log("Submitting payment request...");
      await addDoc(collection(db, 'payments'), {
        uid: user.uid,
        userEmail: user.email,
        senderName: senderName.trim(),
        whatsappNumber: whatsappNumber.trim(),
        status: 'pending',
        planId: plan.id,
        planName: plan.name,
        credits: plan.credits,
        amountPKR: plan.pricePKR,
        amountUSD: plan.priceUSD,
        submittedAt: new Date().toISOString()
      });

      console.log("Updating user status...");
      await updateDoc(doc(db, 'users', user.uid), {
        subscriptionStatus: 'pending'
      });
      
      setIsSuccess(true);
    } catch (err: any) {
      console.error("Submission error:", err);
      setError(err.message || "Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
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
            className="relative w-full max-w-2xl bg-white rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {isSuccess ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-black text-zinc-900">Request Submitted!</h2>
                <p className="text-zinc-500 mt-4">
                  Your request for the <strong>{plans.find(p => p.id === selectedPlan)?.name} Plan</strong> has been sent. 
                  Please make sure you have sent the screenshot to our WhatsApp.
                  We will activate your subscription within 2-4 hours.
                </p>
                <button
                  onClick={onClose}
                  className="mt-8 w-full bg-zinc-900 text-white font-bold py-4 rounded-2xl hover:bg-zinc-800 transition-all active:scale-95"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-zinc-900 flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                    Choose Your Plan
                  </h2>
                  <p className="text-zinc-500 mt-1">Select a plan that fits your needs.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {plans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id as any)}
                      className={cn(
                        "p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden group",
                        selectedPlan === plan.id 
                          ? "border-blue-600 bg-blue-50/50" 
                          : "border-zinc-100 hover:border-zinc-200"
                      )}
                    >
                      {selectedPlan === plan.id && (
                        <div className="absolute top-0 right-0 p-1.5 bg-blue-600 text-white rounded-bl-xl">
                          <CheckCircle2 className="w-3 h-3" />
                        </div>
                      )}
                      <div className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">{plan.name}</div>
                      <div className="text-lg font-black text-zinc-900">{plan.credits} Credits</div>
                      <div className="text-sm font-bold text-blue-600 mt-2">
                        {plan.pricePKR} PKR / ${plan.priceUSD}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-1 leading-tight">{plan.description}</div>
                    </button>
                  ))}
                </div>

                <div className="bg-zinc-50 rounded-2xl p-6 mb-8 border border-zinc-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Bank Details</h3>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase tracking-tighter">
                      <MessageCircle className="w-3 h-3" />
                      WhatsApp Proof Required
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-500">Bank Name</span>
                      <span className="text-sm font-bold text-zinc-900">Bank Alfalah</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-500">Account Number</span>
                      <span className="text-sm font-bold text-zinc-900">00311009261742</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-500">Account Name</span>
                      <span className="text-sm font-bold text-zinc-900">Muhammad Awais</span>
                    </div>
                    <div className="pt-3 mt-3 border-t border-zinc-200">
                      <p className="text-[11px] font-bold text-zinc-600 text-center">
                        Send screenshot on this WhatsApp no. <span className="text-blue-600">+923200984007</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
                      WhatsApp Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +923001234567"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm font-bold bg-red-50 p-4 rounded-xl mb-6">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <button
                  disabled={!senderName.trim() || !whatsappNumber.trim() || isSubmitting}
                  onClick={handleSubmit}
                  className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    `Request ${plans.find(p => p.id === selectedPlan)?.name} Plan`
                  )}
                </button>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
