'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  userRole: string | null;
  userName: string | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  isManager: false,
  userRole: null,
  userName: null,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const membersRef = collection(db, 'members');
          const q = query(membersRef, where('email', '==', firebaseUser.email));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            const role = userData.role || 'member';
            setUserRole(role);
            
            const isAdm = role === 'admin';
            const isMng = role === 'manager';
            
            setIsManager(isMng);
            // 관리자 권한은 어드민이거나 연구실장(manager)인 경우 모두 부여
            setIsAdmin(isAdm || isMng);
            setUserName(userData.name || null);
          } else {
            setUserRole('member');
            setIsAdmin(false);
            setIsManager(false);
            setUserName(firebaseUser.email?.split('@')[0] || null);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole(null);
          setIsAdmin(false);
          setIsManager(false);
          setUserName(null);
        }
      } else {
        setUser(null);
        setUserRole(null);
        setIsAdmin(false);
        setIsManager(false);
        setUserName(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isManager, userRole, userName, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
