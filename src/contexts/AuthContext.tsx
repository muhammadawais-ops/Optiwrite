import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, increment } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { isAfter, parseISO } from 'date-fns';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  credits: number;
  subscriptionStatus: 'free' | 'pending' | 'active' | 'expired';
  expiryDate?: string;
  planName?: string;
  showWelcomePopup?: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  teamProfile: any | null;
  loading: boolean;
  isAdmin: boolean;
  isSubscribed: boolean;
  hasCredits: boolean;
  useCredit: (amount?: number) => Promise<void>;
  checkAccess: (requiredCredits?: number) => boolean;
  refreshProfile: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [teamProfile, setTeamProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        setProfile(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as UserProfile;
        const isAdminEmail = user.email === 'muhammadawais@carpediem.company' || user.email === 'fazalsubhaniwriter@gmail.com';
        
        // Sync admin role if email matches but role is not admin
        if (isAdminEmail && data.role !== 'admin') {
          await updateDoc(userDocRef, { role: 'admin' });
          // Snapshot will trigger again
        } else {
          setProfile(data);
        }
      } else {
        // Create initial profile
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          role: (user.email === 'muhammadawais@carpediem.company' || user.email === 'fazalsubhaniwriter@gmail.com') ? 'admin' : 'user',
          credits: 10,
          subscriptionStatus: 'free',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, newProfile);
        setProfile(newProfile);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore error in AuthProvider:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user || !user.email) {
      setTeamProfile(null);
      return;
    }

    const domain = user.email.split('@')[1];
    const publicDomains = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com'];
    
    if (!domain || publicDomains.includes(domain.toLowerCase())) {
      setTeamProfile(null);
      return;
    }

    const teamDocRef = doc(db, 'teams', domain.toLowerCase());
    const unsubscribe = onSnapshot(teamDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.expiryDate && isAfter(parseISO(data.expiryDate), new Date())) {
          setTeamProfile(data);
        } else {
          setTeamProfile(null);
        }
      } else {
        setTeamProfile(null);
      }
    }, (error) => {
      console.error("Firestore error in Team access check:", error);
      setTeamProfile(null);
    });

    return unsubscribe;
  }, [user]);

  const useCredit = async (amount: number = 1) => {
    if (!user || !profile) return;
    if (profile.role === 'admin') return; 
    
    // If user has team access, they use team credits first
    if (teamProfile) {
      if (teamProfile.credits < amount) throw new Error("Team credits exhausted");
      const domain = user.email?.split('@')[1];
      if (domain) {
        await updateDoc(doc(db, 'teams', domain.toLowerCase()), {
          credits: increment(-amount)
        });
        return;
      }
    }

    // Otherwise use personal credits (even if active sub, they have a limit now)
    if (profile.credits < amount) throw new Error("No credits remaining");
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, {
      credits: increment(-amount)
    });
  };

  const checkAccess = (requiredCredits: number = 1) => {
    if (!user) return false;
    if (profile?.role === 'admin') return true;
    
    // Check team credits first
    if (teamProfile && teamProfile.credits >= requiredCredits) return true;
    
    // Check personal credits
    return (profile?.credits || 0) >= requiredCredits;
  };

  const isAdmin = profile?.role === 'admin';
  const isSubscribed = (profile?.subscriptionStatus === 'active' && 
                      profile.expiryDate && 
                      isAfter(parseISO(profile.expiryDate), new Date())) ||
                      (teamProfile !== null);
  const hasCredits = (profile?.credits || 0) > 0 || (teamProfile?.credits || 0) > 0;

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      teamProfile,
      loading, 
      isAdmin, 
      isSubscribed, 
      hasCredits,
      useCredit,
      checkAccess,
      refreshProfile: () => {} // Handled by onSnapshot
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
