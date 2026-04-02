import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, Sparkles, X } from 'lucide-react';
import { signInWithGoogle } from '../firebase';

export function AuthModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
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
            className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-black text-zinc-900">Welcome to Optiwrite</h2>
              <p className="text-zinc-500 mt-2">Sign in to start generating SEO-optimized content with 3 free credits.</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={async () => {
                  try {
                    await signInWithGoogle();
                    onClose();
                  } catch (error) {
                    console.error("Sign in error:", error);
                  }
                }}
                className="w-full flex items-center justify-center gap-3 bg-zinc-900 text-white font-bold py-4 rounded-2xl hover:bg-zinc-800 transition-all active:scale-95"
              >
                <LogIn className="w-5 h-5" />
                Sign in with Google
              </button>
              
              <p className="text-[10px] text-center text-zinc-400 uppercase tracking-widest font-bold">
                Secure Authentication via Firebase
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
