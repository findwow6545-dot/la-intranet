'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, Users, Search, Mail, Phone, MapPin, 
  Calendar, BookOpen, Camera, Trash2, X, CheckCircle2
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { 
  collection, addDoc, serverTimestamp, query, 
  orderBy, onSnapshot, doc, deleteDoc 
} from 'firebase/firestore';

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
  const [members, setMembers] = useState<Member[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    batch: '',
    grade: '',
    photoUrl: '',
    researchFields: ''
  });

  // Toast helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch Members
  useEffect(() => {
    const q = query(collection(db, 'members'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as Member[];
      setMembers(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'members'), {
        ...formData,
        photoUrl: formData.photoUrl || 'https://api.dicebear.com/9.x/initials/svg?seed=' + encodeURIComponent(formData.name),
        createdAt: serverTimestamp()
      });
      showToast(`${formData.name} 님이 성공적으로 등록되었습니다!`);
      setIsFormOpen(false);
      setFormData({
        studentId: '', name: '', phone: '', email: '', 
        address: '', batch: '', grade: '', photoUrl: '', researchFields: ''
      });
    } catch (err) {
      console.error(err);
      showToast('등록 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 님의 정보를 정말 삭제하시겠습니까?`)) return;
    try {
      await deleteDoc(doc(db, 'members', id));
      showToast(`${name} 님의 정보가 삭제되었습니다.`);
    } catch (err) {
      console.error(err);
      showToast('삭제 중 오류가 발생했습니다.', 'error');
    }
  };

  const filteredMembers = members.filter(m => 
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.studentId?.includes(searchTerm) || 
    m.researchFields?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.batch?.includes(searchTerm)
  );

  // 통계 집계
  const stats = {
    total: members.length,
    masters: members.filter(m => m.grade === '석사과정').length,
    phds: members.filter(m => m.grade === '박사과정').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-3
              ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}
          >
            <CheckCircle2 size={18} />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-[#2d5a27]" />
            연구실 회원 명부
          </h1>
          <p className="text-slate-500 mt-1 text-sm">조경표현연구실 멤버들의 통합 데이터베이스입니다.</p>
        </div>
        
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="btn-primary flex items-center justify-center gap-2"
        >
          {isFormOpen ? <X size={18} /> : <UserPlus size={18} />}
          {isFormOpen ? '닫기' : '신규 멤버 등록'}
        </button>
      </div>

      {/* Stats Bar */}
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

      {/* Registration Form */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mb-8"
          >
            <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8 rounded-2xl">
              <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                <UserPlus size={20} className="text-[#2d5a27]" />
                신규 연구원 등록
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">이름 *</label>
                  <input required className="input-field" placeholder="홍길동" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">학번 *</label>
                  <input required className="input-field" placeholder="20240001" value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">전화번호 *</label>
                  <input required className="input-field" placeholder="010-0000-0000" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">이메일 *</label>
                  <input required type="email" className="input-field" placeholder="example@email.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">기수 *</label>
                  <input required className="input-field" placeholder="10기" value={formData.batch} onChange={e => setFormData({...formData, batch: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">현재 학년/과정 *</label>
                  <select required className="input-field" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})}>
                    <option value="">선택하세요</option>
                    <option value="학부생">학부생</option>
                    <option value="석사과정">석사과정</option>
                    <option value="박사과정">박사과정</option>
                    <option value="연구원">연구원</option>
                    <option value="교수">교수</option>
                  </select>
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">주소</label>
                  <input className="input-field" placeholder="서울특별시..." value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">프로필 사진 URL <span className="text-slate-400 font-normal">(비워두면 이니셜 아바타가 생성됩니다)</span></label>
                  <input className="input-field" placeholder="https://example.com/photo.jpg" value={formData.photoUrl} onChange={e => setFormData({...formData, photoUrl: e.target.value})} />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">관심 연구 분야</label>
                  <textarea className="input-field h-24 resize-none" placeholder="예: 디지털 트윈 기반 조경 설계, AI 경관 분석, 생태 모니터링 등" value={formData.researchFields} onChange={e => setFormData({...formData, researchFields: e.target.value})} />
                </div>
                <div className="md:col-span-2 pt-2">
                  <button type="submit" className="btn-primary w-full text-base py-4">멤버 정보 등록하기</button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="text-slate-400" size={18} />
        </div>
        <input 
          type="text" 
          placeholder="이름, 학번, 기수, 또는 연구 분야로 검색..."
          className="input-field pl-12 h-14 text-sm"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Member List Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-[#2d5a27]"></div>
          <p className="text-slate-400 text-sm font-medium">멤버 정보를 불러오는 중...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredMembers.map((member) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={member.id}
                className="glass-card rounded-2xl overflow-hidden group hover:border-emerald-200 transition-all duration-300"
              >
                <div className="h-1.5 bg-gradient-to-r from-[#2d5a27] to-emerald-400 w-full opacity-30 group-hover:opacity-100 transition-opacity"></div>
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-emerald-50 shrink-0 border border-slate-100">
                      <img 
                        src={member.photoUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(member.name)}`}
                        alt={member.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(member.name)}`;
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-black text-slate-900">{member.name}</h3>
                        <button 
                          onClick={() => handleDelete(member.id, member.name)} 
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {member.grade && (
                        <span className="inline-block mt-1 px-2.5 py-0.5 bg-emerald-50 text-[#2d5a27] text-[10px] font-black rounded-lg">
                          {member.grade}
                        </span>
                      )}
                      <div className="flex items-center gap-1 text-slate-400 text-[11px] mt-1.5 font-medium">
                        <Calendar size={10} />
                        <span>{member.batch} · {member.studentId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center gap-3 text-slate-600">
                      <Phone size={14} className="text-slate-400 shrink-0" />
                      <span>{member.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <Mail size={14} className="text-slate-400 shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    {member.address && (
                      <div className="flex items-start gap-3 text-slate-600">
                        <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                        <span className="line-clamp-1">{member.address}</span>
                      </div>
                    )}
                    {member.researchFields && (
                      <div className="pt-3 border-t border-slate-50 mt-3">
                        <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-[#2d5a27]">
                          <BookOpen size={12} />
                          <span>관심 연구 분야</span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                          {member.researchFields}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {!isLoading && filteredMembers.length === 0 && (
        <div className="text-center py-24 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <Users size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-400 font-bold text-lg mb-1">
            {searchTerm ? '검색 결과가 없습니다' : '아직 등록된 멤버가 없습니다'}
          </p>
          <p className="text-slate-400 text-sm">
            {searchTerm ? '다른 키워드로 검색해보세요.' : '위의 "신규 멤버 등록" 버튼을 눌러 첫 멤버를 추가해보세요!'}
          </p>
        </div>
      )}
    </div>
  );
}
