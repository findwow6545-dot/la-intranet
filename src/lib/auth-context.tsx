'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  userRole: string | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  userRole: null,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        // Firestore에서 역할 정보 가져오기
        try {
          // 이메일을 ID로 사용하거나 별도의 맵핑이 필요할 수 있음
          // 여기서는 members 컬렉션에서 해당 이메일을 가진 문서를 찾는다고 가정
          // 만약 문서 ID가 이메일이 아니라면 쿼리를 사용해야 함
          // 우선은 문서 ID를 이메일로 사용하는 구조를 권장하나, 기존 데이터에 따라 다를 수 있음
          
          // 기존 seed.mjs에서는 랜덤 ID로 생성되는 구조이므로 쿼리 필요
          // 하지만 성능상 사용자 정보를 담은 별도의 'users' 컬렉션을 두거나 
          // 'members' 문서 ID를 이메일로 통일하는 것이 좋음.
          
          // 일단 members 컬렉션에서 email 필드로 찾기
          const { collection, query, where, getDocs } = await import('firebase/firestore');
          const membersRef = collection(db, 'members');
          const q = query(membersRef, where('email', '==', firebaseUser.email));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            const role = userData.role || 'member';
            setUserRole(role);
            setIsAdmin(role === 'admin');
          } else {
            setUserRole('member');
            setIsAdmin(false);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole(null);
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setUserRole(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, userRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
