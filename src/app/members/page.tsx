'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, Users, Search, Mail, Phone, MapPin, 
  Calendar, BookOpen, Camera, Trash2, X, CheckCircle2,
  GraduationCap, Edit2, Lock
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { 
  collection, addDoc, updateDoc, serverTimestamp, query, 
  orderBy, onSnapshot, doc, deleteDoc 
} from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';

interface Member {
  id: string;
  studentId: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  batch: string;
  grade: string;
  photoUrl: string;
  researchFields: string;
  createdAt: any;
}

export default function MembersPage() {
  const { user, isAdmin } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const emptyForm = {
    studentId: '', name: '', phone: '', email: '', 
    address: '', batch: '', grade: '', photoUrl: '', researchFields: ''
  };
  const [formData, setFormData] = useState(emptyForm);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const q = query(collection(db, 'members'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Member[];
      setMembers(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAdmin) {
      showToast('권한이 없습니다.', 'error');
      return;
    }

    const savePayload = {
      ...formData,
      photoUrl: formData.photoUrl || 'https://api.dicebear.com/9.x/initials/svg?seed=' + encodeURIComponent(formData.name)
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'members', editingId), savePayload);
        showToast(`${formData.name} 님의 정보가 수정되었습니다!`);
      } else {
        await addDoc(collection(db, 'members'), {
          ...savePayload,
          createdAt: serverTimestamp()
        });
        showToast(`${formData.name} 님이 성공적으로 등록되었습니다!`);
      }
      setIsFormOpen(false);
      setEditingId(null);
      setFormData(emptyForm);
    } catch (err) {
      showToast('저장 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleEdit = (e: React.MouseEvent, m: Member) => {
    e.stopPropagation();
    if (!isAdmin) return;
    
    setFormData({
      studentId: m.studentId || '', name: m.name || '', phone: m.phone || '', email: m.email || '', 
      address: m.address || '', batch: m.batch || '', grade: m.grade || '', photoUrl: m.photoUrl || '', researchFields: m.researchFields || ''
    });
    setEditingId(m.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    
    if (!isAdmin) {
      alert('관리자만 삭제 권한이 있습니다.');
      return;
    }
    
    if (!confirm(`"${name}" 님의 정보를 정말 삭제하시겠습니까?`)) return;
    try {
      await deleteDoc(doc(db, 'members', id));
      if (selectedMember?.id === id) setSelectedMember(null);
      showToast(`${name} 님의 정보가 삭제되었습니다.`);
    } catch (err) {
      showToast('삭제 중 오류가 발생했습니다.', 'error');
    }
  };

  const maskInfo = (text: string | undefined, type: 'phone' | 'email' | 'address' | 'studentId') => {
    if (!text) return '-';
    if (user) return text; // 멤버(로그인 사용자)는 전체 확인 가능

    // 비멤버인 경우 마스킹 처리
    if (type === 'phone') {
      const parts = text.split('-');
      if (parts.length === 3) return `${parts[0]}-****-${parts[2]}`;
      return text.substring(0, 3) + '****' + text.substring(text.length - 2);
    }
    if (type === 'email') {
      const [id, domain] = text.split('@');
      if (!domain) return text.substring(0, 2) + '***';
      return id.substring(0, 2) + '***@' + domain;
    }
    if (type === 'studentId') {
      return text.substring(0, 4) + '****';
    }
    if (type === 'address') {
      return text.split(' ').slice(0, 2).join(' ') + ' ***';
    }
    return '***';
  };

  const filteredMembers = members.filter(m => 
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.studentId?.includes(searchTerm) || 
    m.researchFields?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.batch?.includes(searchTerm)
  ).sort((a, b) => {
    const parseBatch = (batchStr: string) => parseInt((batchStr || '').replace(/[^0-9]/g, '')) || 0;
    return parseBatch(b.batch) - parseBatch(a.batch);
  });

  const stats = {
    total: members.length,
    masters: members.filter(m => m.grade?.includes('석사')).length,
    phds: members.filter(m => m.grade?.includes('박사')).length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-3 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
            <CheckCircle2 size={18} /> {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-[#2d5a27]" /> 연구실 연구생 명부
          </h1>
          <p className="text-slate-500 mt-1 text-sm">멤버 상세정보를 보려면 카드를 클릭하세요. {!user && <span className="text-amber-600 font-bold ml-2">(비회원은 일부 정보가 제한됩니다)</span>}</p>
        </div>
        
        {isAdmin && (
          <button onClick={() => {
              setIsFormOpen(!isFormOpen);
              if (!isFormOpen) { setFormData(emptyForm); setEditingId(null); }
            }} 
            className="bg-[#2d5a27] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#1f3f1b] transition flex items-center gap-2 shadow-lg shadow-emerald-900/10"
          >
            {isFormOpen ? <X size={18} /> : <UserPlus size={18} />} {isFormOpen ? '닫기' : '신규 멤버 등록'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: '전체 인원', value: stats.total, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
          { label: '석사과정', value: stats.masters, color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: '박사과정', value: stats.phds, color: 'bg-purple-50 text-purple-700 border-purple-100' },
        ].map((stat, i) => (
          <div key={i} className={`${stat.color} border rounded-2xl p-4 text-center`}>
            <p className="text-2xl font-black">{stat.value}</p>
            <p className="text-xs font-bold mt-1 opacity-70">{stat.label}</p>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isFormOpen && isAdmin && (
          <motion.form initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} onSubmit={handleSubmit} className="bg-white border border-slate-200 shadow-sm mb-8 p-6 sm:p-8 rounded-2xl overflow-hidden">
            <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <UserPlus size={20} className="text-[#2d5a27]"/> {editingId ? '연구원 정보 수정' : '신규 연구원 등록'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               <div className="space-y-1.5"><label className="text-xs font-bold text-slate-600">이름 *</label><input required className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
               <div className="space-y-1.5"><label className="text-xs font-bold text-slate-600">학번 *</label><input required className="input-field" value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})} /></div>
               <div className="space-y-1.5"><label className="text-xs font-bold text-slate-600">전화번호</label><input className="input-field" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
               <div className="space-y-1.5"><label className="text-xs font-bold text-slate-600">이메일</label><input type="email" className="input-field" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
               <div className="space-y-1.5"><label className="text-xs font-bold text-slate-600">기수 (예: 2기)</label><input className="input-field" value={formData.batch} onChange={e => setFormData({...formData, batch: e.target.value})} /></div>
               <div className="space-y-1.5"><label className="text-xs font-bold text-slate-600">현재 과정 (예: 4학년, 석사)</label><input className="input-field" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} /></div>
               <div className="md:col-span-2 space-y-1.5"><label className="text-xs font-bold text-slate-600">주소</label><input className="input-field" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
               <div className="md:col-span-2 space-y-1.5"><label className="text-xs font-bold text-slate-600">사진 URL (비워두면 이니셜)</label><input className="input-field" value={formData.photoUrl} onChange={e => setFormData({...formData, photoUrl: e.target.value})} /></div>
               <div className="md:col-span-2 space-y-1.5"><label className="text-xs font-bold text-slate-600">관심 연구 분야</label><textarea className="input-field h-24 resize-none" value={formData.researchFields} onChange={e => setFormData({...formData, researchFields: e.target.value})} /></div>
               <div className="md:col-span-2 pt-2"><button type="submit" className="bg-[#2d5a27] text-white w-full py-4 rounded-xl font-black hover:bg-[#1f3f1b] transition shadow-lg shadow-emerald-900/10">{editingId ? '수정 완료하기' : '등록하기'}</button></div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="mb-6 relative">
        <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
        <input type="text" placeholder="이름, 학번, 기수, 연구 분야 검색..." className="input-field pl-12 h-14 text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredMembers.map(member => (
            <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key={member.id} onClick={() => setSelectedMember(member)} className="bg-white border border-slate-100 rounded-2xl overflow-hidden cursor-pointer group hover:shadow-lg hover:border-emerald-300 transition-all duration-300 shadow-sm">
               <div className="p-6">
                 <div className="flex justify-between items-start mb-4">
                   <div className="flex gap-4 items-center">
                     <img src={member.photoUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(member.name)}`} alt={member.name} className="w-16 h-16 rounded-full border border-slate-200 object-cover" />
                     <div>
                       <h3 className="text-lg font-black text-slate-900">{member.name}</h3>
                       <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1"><GraduationCap size={12}/> {member.grade || '소속 미정'}</div>
                     </div>
                   </div>
                   <div className="flex gap-1">
                     {isAdmin && (
                       <button onClick={(e) => handleEdit(e, member)} className="text-slate-300 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"><Edit2 size={16} /></button>
                     )}
                   </div>
                 </div>
                 <div className="space-y-1.5 text-sm text-slate-600">
                   {member.batch && <div className="text-xs font-bold text-emerald-600 bg-emerald-50 w-max px-2 py-0.5 rounded-md mb-2">{member.batch}</div>}
                   <div className="flex items-center gap-2"><Phone size={14} className="text-slate-400" /> {maskInfo(member.phone, 'phone')}</div>
                   <div className="flex items-center gap-2"><Mail size={14} className="text-slate-400" /> <span className="truncate">{maskInfo(member.email, 'email')}</span></div>
                 </div>
               </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {selectedMember && (
         <AnimatePresence>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedMember(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white max-w-xl w-full rounded-[2rem] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="bg-[#2d5a27] h-32 relative">
                <button onClick={() => setSelectedMember(null)} className="absolute top-4 right-4 bg-white/20 text-white p-2 rounded-full hover:bg-white/40 backdrop-blur-md transition"><X size={20}/></button>
              </div>
              <div className="px-8 pb-8 relative">
                <img src={selectedMember.photoUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(selectedMember.name)}`} alt={selectedMember.name} className="w-28 h-28 rounded-full border-4 border-white shadow-lg -mt-14 object-cover bg-white" />
                <div className="mt-4 mb-6 relative">
                  <div className="flex items-end gap-3">
                    <h2 className="text-3xl font-black text-slate-900">{selectedMember.name}</h2>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded-lg text-sm mb-1">{selectedMember.batch}</span>
                  </div>
                  <p className="text-slate-500 text-sm font-medium mt-1 flex items-center gap-2"><GraduationCap size={16}/> {selectedMember.grade} ({maskInfo(selectedMember.studentId, 'studentId')})</p>
                  
                  {isAdmin && (
                    <div className="absolute right-0 top-0 flex gap-2">
                      <button onClick={(e) => { setSelectedMember(null); handleEdit(e, selectedMember!); }} className="text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 px-4 py-2 rounded-xl transition flex items-center gap-2">
                        <Edit2 size={16}/> 정보 수정
                      </button>
                      <button onClick={(e) => handleDelete(e, selectedMember!.id, selectedMember!.name)} className="text-sm font-bold bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-xl transition flex items-center gap-2">
                        <Trash2 size={16}/> 삭제하기
                      </button>
                    </div>
                  )}
                </div>
                {!user && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-800">
                    <Lock size={18} />
                    <p className="text-xs font-bold">비회원인 경우 개인정보 보호를 위해 일부 정보가 마스킹 처리됩니다.</p>
                  </div>
                )}
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
                    <div className="flex items-start gap-3"><Phone size={18} className="text-[#2d5a27] shrink-0" /><div><p className="text-xs font-bold text-slate-400">연락처</p><p className="text-slate-700 font-medium">{maskInfo(selectedMember.phone, 'phone')}</p></div></div>
                    <div className="flex items-start gap-3"><Mail size={18} className="text-[#2d5a27] shrink-0" /><div><p className="text-xs font-bold text-slate-400">이메일</p><p className="text-slate-700 font-medium">{maskInfo(selectedMember.email, 'email')}</p></div></div>
                    <div className="flex items-start gap-3"><MapPin size={18} className="text-[#2d5a27] shrink-0" /><div><p className="text-xs font-bold text-slate-400">거주지 주소</p><p className="text-slate-700 font-medium">{maskInfo(selectedMember.address, 'address')}</p></div></div>
                  </div>
                  {selectedMember.researchFields ? (
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                      <div className="flex items-center gap-2 text-emerald-800 font-black text-sm mb-2"><BookOpen size={16}/> 상세 연구 분야 및 관심사</div>
                      <p className="text-emerald-700 text-sm leading-relaxed whitespace-pre-wrap">{selectedMember.researchFields}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
