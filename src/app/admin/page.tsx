'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Users, Settings, Search, UserPlus, Trash2,
  CheckCircle2, Loader2, X, Star
} from 'lucide-react';

interface Member {
  id: string;
  name: string;
  email: string;
  phone?: string;
  studentId?: string;
  role?: string;
  batch: string;
  grade: string;
}

const FIREBASE_API_KEY = "AIzaSyCTjh2GXaDC_bBL8LCLPyrAO5k84eACLiM";

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const emptyNewMember = { name: '', email: '', phone: '', studentId: '', batch: '', grade: '' };
  const [newMember, setNewMember] = useState(emptyNewMember);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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

  const changeRole = async (member: Member, newRole: string) => {
    if (member.email === user?.email) {
      alert("자신의 권한은 변경할 수 없습니다.");
      return;
    }

    const roleName = newRole === 'admin' ? '관리자' : newRole === 'manager' ? '연구실장' : '일반 멤버';
    const confirmMessage = `${member.name} 사용자를 ${roleName}(으)로 변경하시겠습니까?`;
    
    if (!confirm(confirmMessage)) return;

    setUpdatingId(member.id);
    try {
      await updateDoc(doc(db, 'members', member.id), { role: newRole });
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: newRole } : m));
      showToast(`${member.name}님이 ${roleName}(으)로 변경되었습니다.`);
    } catch (error) {
      console.error("Error updating role:", error);
      showToast("권한 변경 중 오류가 발생했습니다.", 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteMember = async (member: Member) => {
    if (member.email === user?.email) {
      alert("자신을 삭제할 수 없습니다.");
      return;
    }
    if (!confirm(`"${member.name}" 멤버를 정말 삭제하시겠습니까?\n\n⚠️ Firestore에서 멤버 정보가 삭제됩니다.`)) return;

    setUpdatingId(member.id);
    try {
      await deleteDoc(doc(db, 'members', member.id));
      setMembers(prev => prev.filter(m => m.id !== member.id));
      showToast(`${member.name}님이 삭제되었습니다.`);
    } catch (error) {
      console.error("Error deleting member:", error);
      showToast("멤버 삭제 중 오류가 발생했습니다.", 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      // 1. Firebase Auth 계정 생성
      const phoneDigits = newMember.phone.replace(/[^0-9]/g, '');
      if (phoneDigits.length < 6) {
        showToast('전화번호는 6자리 이상이어야 합니다.', 'error');
        setIsAdding(false);
        return;
      }

      const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newMember.email,
          password: phoneDigits,
          returnSecureToken: false
        })
      });
      const authData = await authRes.json();
      if (authData.error) {
        if (authData.error.message === 'EMAIL_EXISTS') {
          showToast('이미 등록된 이메일입니다.', 'error');
        } else {
          showToast(`계정 생성 오류: ${authData.error.message}`, 'error');
        }
        setIsAdding(false);
        return;
      }

      // 2. Firestore에 멤버 정보 추가
      const docRef = await addDoc(collection(db, 'members'), {
        name: newMember.name,
        email: newMember.email,
        phone: newMember.phone,
        studentId: newMember.studentId,
        batch: newMember.batch,
        grade: newMember.grade,
        role: 'member',
        photoUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(newMember.name)}`,
        createdAt: serverTimestamp(),
      });

      setMembers(prev => [...prev, { id: docRef.id, ...newMember, role: 'member' }]);
      showToast(`${newMember.name}님이 성공적으로 추가되었습니다!`);
      setNewMember(emptyNewMember);
      setIsAddOpen(false);
    } catch (error) {
      console.error("Error adding member:", error);
      showToast("멤버 추가 중 오류가 발생했습니다.", 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const filteredMembers = members.filter(m => 
    (m.name || '').includes(searchTerm) || (m.email || '').includes(searchTerm) || (m.batch || '').includes(searchTerm)
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
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-3 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
            <CheckCircle2 size={18} /> {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 text-[#2d5a27] font-bold mb-2">
            <Shield size={20} />
            <span className="text-sm tracking-wider uppercase">System Administration</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">관리자 센터</h1>
          <p className="text-slate-500 mt-2">멤버 관리 및 권한 설정을 관리합니다.</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-[#2d5a27] text-white rounded-2xl font-bold hover:bg-[#1f3f1b] transition-all shadow-lg shadow-emerald-900/10"
          >
            <UserPlus size={18} />
            멤버 추가
          </button>
        </div>
      </div>

      {/* 멤버 추가 모달 */}
      <AnimatePresence>
        {isAddOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsAddOpen(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white max-w-lg w-full rounded-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><UserPlus size={20} className="text-[#2d5a27]"/> 새 멤버 추가</h2>
                <button onClick={() => setIsAddOpen(false)} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition"><X size={20}/></button>
              </div>
              <form onSubmit={handleAddMember} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold text-slate-600 mb-1 block">이름 *</label><input required className="input-field" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} /></div>
                  <div><label className="text-xs font-bold text-slate-600 mb-1 block">학번</label><input className="input-field" value={newMember.studentId} onChange={e => setNewMember({...newMember, studentId: e.target.value})} /></div>
                </div>
                <div><label className="text-xs font-bold text-slate-600 mb-1 block">이메일 * (로그인 ID)</label><input required type="email" className="input-field" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-slate-600 mb-1 block">전화번호 * (초기 비밀번호: 숫자만)</label><input required className="input-field" placeholder="010-1234-5678" value={newMember.phone} onChange={e => setNewMember({...newMember, phone: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold text-slate-600 mb-1 block">기수</label><input className="input-field" placeholder="예: 3기" value={newMember.batch} onChange={e => setNewMember({...newMember, batch: e.target.value})} /></div>
                  <div><label className="text-xs font-bold text-slate-600 mb-1 block">과정</label><input className="input-field" placeholder="예: 석사 1학기" value={newMember.grade} onChange={e => setNewMember({...newMember, grade: e.target.value})} /></div>
                </div>
                <button type="submit" className="w-full bg-[#2d5a27] text-white py-4 rounded-xl font-black hover:bg-[#1f3f1b] transition flex items-center justify-center gap-2" disabled={isAdding}>
                  {isAdding ? <><Loader2 size={18} className="animate-spin" /> 추가 중...</> : '멤버 추가하기'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <span className="text-xs font-bold text-slate-400">Admins & Managers</span>
            </div>
            <p className="text-3xl font-black text-slate-900">{members.filter(m => m.role === 'admin' || m.role === 'manager').length}</p>
            <p className="text-sm text-slate-500 mt-1">관리 권한 계정</p>
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
                    <th className="px-6 py-4 text-right">권한 관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/50 transition-colors group">
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
                        ) : member.role === 'manager' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100">
                            <Star size={10} /> 연구실장
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-full border border-slate-100">
                            MEMBER
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select 
                            value={member.role || 'member'} 
                            onChange={(e) => changeRole(member, e.target.value)}
                            disabled={updatingId === member.id || member.email === user?.email}
                            className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-emerald-500/10 disabled:opacity-50"
                          >
                            <option value="member">일반 멤버</option>
                            <option value="manager">연구실장</option>
                            <option value="admin">최고 관리자</option>
                          </select>
                          
                          {member.email !== user?.email && (
                            <button 
                              onClick={() => handleDeleteMember(member)}
                              disabled={updatingId === member.id}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                              title="멤버 삭제"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
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
