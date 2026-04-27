'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Users, 
  Settings, 
  Search, 
  UserPlus, 
  MoreHorizontal, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ChevronRight
} from 'lucide-react';

interface Member {
  id: string;
  name: string;
  email: string;
  role?: string;
  batch: string;
  grade: string;
}

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/');
    }
  }, [user, isAdmin, loading, router]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const q = query(collection(db, 'members'), orderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);
        const memberList: Member[] = [];
        querySnapshot.forEach((doc) => {
          memberList.push({ id: doc.id, ...doc.data() } as Member);
        });
        setMembers(memberList);
      } catch (error) {
        console.error("Error fetching members:", error);
      } finally {
        setIsFetching(false);
      }
    };

    if (isAdmin) {
      fetchMembers();
    }
  }, [isAdmin]);

  const toggleAdminRole = async (member: Member) => {
    if (member.email === user?.email) {
      alert("자신의 권한은 변경할 수 없습니다.");
      return;
    }

    const newRole = member.role === 'admin' ? 'member' : 'admin';
    const confirmMessage = `${member.name} 사용자를 ${newRole === 'admin' ? '관리자' : '일반 멤버'}로 변경하시겠습니까?`;
    
    if (!confirm(confirmMessage)) return;

    setUpdatingId(member.id);
    try {
      await updateDoc(doc(db, 'members', member.id), {
        role: newRole
      });
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: newRole } : m));
    } catch (error) {
      console.error("Error updating role:", error);
      alert("권한 변경 중 오류가 발생했습니다.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.includes(searchTerm) || m.email.includes(searchTerm) || m.batch.includes(searchTerm)
  );

  if (loading || isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#2d5a27]" size={40} />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 text-[#2d5a27] font-bold mb-2">
            <Shield size={20} />
            <span className="text-sm tracking-wider uppercase">System Administration</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">관리자 센터</h1>
          <p className="text-slate-500 mt-2">멤버 권한 관리 및 시스템 설정을 관리합니다.</p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-3 bg-[#2d5a27] text-white rounded-2xl font-bold hover:bg-[#1f3f1b] transition-all shadow-lg shadow-emerald-900/10">
            <UserPlus size={18} />
            멤버 추가
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Stats */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Users size={20} />
              </div>
              <span className="text-xs font-bold text-slate-400">Total</span>
            </div>
            <p className="text-3xl font-black text-slate-900">{members.length}</p>
            <p className="text-sm text-slate-500 mt-1">전체 멤버 수</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                <Shield size={20} />
              </div>
              <span className="text-xs font-bold text-slate-400">Admins</span>
            </div>
            <p className="text-3xl font-black text-slate-900">{members.filter(m => m.role === 'admin').length}</p>
            <p className="text-sm text-slate-500 mt-1">관리자 계정</p>
          </div>
        </div>

        {/* Member Table */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="font-bold text-slate-900">멤버 리스트</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="이름, 이메일, 기수 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-[#2d5a27]/10 outline-none w-full sm:w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">이름 / 기수</th>
                    <th className="px-6 py-4">이메일</th>
                    <th className="px-6 py-4">역할</th>
                    <th className="px-6 py-4 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <AnimatePresence>
                    {filteredMembers.map((member) => (
                      <motion.tr 
                        key={member.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-slate-900">{member.name}</p>
                            <p className="text-xs text-slate-500">{member.batch} · {member.grade}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{member.email}</td>
                        <td className="px-6 py-4">
                          {member.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-full border border-purple-100">
                              <Shield size={10} /> ADMIN
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-full border border-slate-100">
                              MEMBER
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => toggleAdminRole(member)}
                            disabled={updatingId === member.id}
                            className="p-2 text-slate-400 hover:text-[#2d5a27] hover:bg-emerald-50 rounded-lg transition-all disabled:opacity-50"
                          >
                            {updatingId === member.id ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Settings size={18} />
                            )}
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {filteredMembers.length === 0 && (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={32} />
                </div>
                <p className="text-slate-500 font-medium">검색 결과가 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
