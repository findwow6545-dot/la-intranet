'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, Users, Search, Mail, Phone, MapPin, 
  BookOpen, Trash2, X, CheckCircle2,
  GraduationCap, Edit2, Building2, Briefcase, Globe
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { 
  collection, addDoc, updateDoc, serverTimestamp, query, 
  orderBy, onSnapshot, doc, deleteDoc 
} from 'firebase/firestore';

interface Alumni {
  id: string;
  studentId: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  batch: string; // 기수
  graduationYear: string; // 졸업년도
  company: string; // 소속회사
  position: string; // 직책
  companyAddress: string; // 회사주소
  homepage: string; // 홈페이지
  photoUrl: string;
  researchFields: string;
  createdAt: any;
}

export default function AlumniPage() {
  const [alumniList, setAlumniList] = useState<Alumni[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null);

  const emptyForm = {
    studentId: '', name: '', phone: '', email: '', 
    address: '', batch: '', graduationYear: '', 
    company: '', position: '', companyAddress: '', homepage: '',
    photoUrl: '', researchFields: ''
  };
  const [formData, setFormData] = useState(emptyForm);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const q = query(collection(db, 'alumni'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Alumni[];
      setAlumniList(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const savePayload = {
      ...formData,
      photoUrl: formData.photoUrl || 'https://api.dicebear.com/9.x/initials/svg?seed=' + encodeURIComponent(formData.name)
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'alumni', editingId), savePayload);
        showToast(`${formData.name} 님의 정보가 수정되었습니다!`);
      } else {
        await addDoc(collection(db, 'alumni'), {
          ...savePayload,
          createdAt: serverTimestamp()
        });
        showToast(`${formData.name} 님이 졸업생 명부에 등록되었습니다!`);
      }
      setIsFormOpen(false);
      setEditingId(null);
      setFormData(emptyForm);
    } catch (err) {
      showToast('저장 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleEdit = (e: React.MouseEvent, a: Alumni) => {
    e.stopPropagation();
    setFormData({
      studentId: a.studentId || '', name: a.name || '', phone: a.phone || '', email: a.email || '', 
      address: a.address || '', batch: a.batch || '', graduationYear: a.graduationYear || '',
      company: a.company || '', position: a.position || '', companyAddress: a.companyAddress || '', homepage: a.homepage || '',
      photoUrl: a.photoUrl || '', researchFields: a.researchFields || ''
    });
    setEditingId(a.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    const adminId = window.prompt('관리자 아이디를 입력하세요:');
    if (adminId !== 'admin') {
      alert('아이디가 일치하지 않습니다.');
      return;
    }
    const adminPw = window.prompt('관리자 비밀번호를 입력하세요:');
    if (adminPw !== '1234') {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    if (!confirm(`"${name}" 님의 정보를 정말 삭제하시겠습니까?`)) return;
    try {
      await deleteDoc(doc(db, 'alumni', id));
      if (selectedAlumni?.id === id) setSelectedAlumni(null);
      showToast(`${name} 님의 정보가 삭제되었습니다.`);
    } catch (err) {
      showToast('삭제 중 오류가 발생했습니다.', 'error');
    }
  };

  const filteredAlumni = alumniList.filter(a => 
    a.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.studentId?.includes(searchTerm) || 
    a.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.batch?.includes(searchTerm)
  ).sort((a, b) => {
    const parseBatch = (batchStr: string) => parseInt((batchStr || '').replace(/[^0-9]/g, '')) || 0;
    return parseBatch(b.batch) - parseBatch(a.batch);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-3 ${toast.type === 'success' ? 'bg-[#2d5a27] text-white' : 'bg-red-600 text-white'}`}>
            <CheckCircle2 size={18} /> {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-[#2d5a27]" /> 졸업생 명부
          </h1>
          <p className="text-slate-500 mt-1 text-sm">사회로 진출한 연구실 졸업생들의 소중한 네트워크입니다.</p>
        </div>
        <button onClick={() => {
            setIsFormOpen(!isFormOpen);
            if (!isFormOpen) { setFormData(emptyForm); setEditingId(null); }
          }} 
          className="btn-primary flex items-center gap-2"
        >
          {isFormOpen ? <X size={18} /> : <UserPlus size={18} />} {isFormOpen ? '닫기' : '졸업생 등록'}
        </button>
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <motion.form initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} onSubmit={handleSubmit} className="glass-card mb-8 p-6 sm:p-8 rounded-2xl overflow-hidden">
            <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <UserPlus size={20} className="text-[#2d5a27]"/> {editingId ? '졸업생 정보 수정' : '신규 졸업생 등록'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
               <div className="space-y-1.5"><label className="text-xs font-bold text-slate-600">이름 *</label><input required className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
               <div className="space-y-1.5"><label className="text-xs font-bold text-slate-600">학번 *</label><input required className="input-field" value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})} /></div>
               <div className="space-y-1.5"><label className="text-xs font-bold text-slate-600">기수 (예: 2기)</label><input className="input-field" value={formData.batch} onChange={e => setFormData({...formData, batch: e.target.value})} /></div>
               <div className="space-y-1.5"><label className="text-xs font-bold text-slate-600">졸업년월 (예: 2024.02)</label><input className="input-field" value={formData.graduationYear} onChange={e => setFormData({...formData, graduationYear: e.target.value})} /></div>
               <div className="space-y-1.5"><label className="text-xs font-bold text-slate-600">전화번호</label><input className="input-field" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
               <div className="space-y-1.5"><label className="text-xs font-bold text-slate-600">이메일</label><input type="email" className="input-field" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
               
               <div className="space-y-1.5"><label className="text-xs font-bold text-slate-800">소속 회사</label><input className="input-field border-emerald-100 focus:border-emerald-500" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} /></div>
               <div className="space-y-1.5"><label className="text-xs font-bold text-slate-800">직책</label><input className="input-field border-emerald-100 focus:border-emerald-500" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} /></div>
               <div className="space-y-1.5"><label className="text-xs font-bold text-slate-800">홈페이지</label><input className="input-field border-emerald-100 focus:border-emerald-500" value={formData.homepage} onChange={e => setFormData({...formData, homepage: e.target.value})} /></div>
               
               <div className="md:col-span-2 lg:col-span-3 space-y-1.5"><label className="text-xs font-bold text-slate-800">회사 주소</label><input className="input-field border-emerald-100 focus:border-emerald-500" value={formData.companyAddress} onChange={e => setFormData({...formData, companyAddress: e.target.value})} /></div>
               
               <div className="md:col-span-2 lg:col-span-3 space-y-1.5"><label className="text-xs font-bold text-slate-600">거주지 주소</label><input className="input-field" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
               <div className="md:col-span-2 lg:col-span-3 space-y-1.5"><label className="text-xs font-bold text-slate-600">사진 URL</label><input className="input-field" value={formData.photoUrl} onChange={e => setFormData({...formData, photoUrl: e.target.value})} /></div>
               <div className="md:col-span-2 lg:col-span-3 space-y-1.5"><label className="text-xs font-bold text-slate-600">주요 경력 및 연구분야</label><textarea className="input-field h-24 resize-none" value={formData.researchFields} onChange={e => setFormData({...formData, researchFields: e.target.value})} /></div>
               
               <div className="md:col-span-2 lg:col-span-3 pt-2"><button type="submit" className="btn-primary w-full text-base py-4 font-black">{editingId ? '정보 수정 완료' : '졸업생 등록하기'}</button></div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="mb-6 relative">
        <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
        <input type="text" placeholder="이름, 학번, 기수, 소속 회사 검색..." className="input-field pl-12 h-14 text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-400 font-bold">데이터를 불러오는 중입니다...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredAlumni.map(alumni => (
              <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key={alumni.id} onClick={() => setSelectedAlumni(alumni)} className="glass-card rounded-2xl overflow-hidden cursor-pointer group hover:shadow-lg hover:border-emerald-300 transition-all duration-300">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4 items-center">
                      <img src={alumni.photoUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(alumni.name)}`} alt={alumni.name} className="w-16 h-16 rounded-full border border-slate-200 object-cover" />
                      <div>
                        <h3 className="text-lg font-black text-slate-900">{alumni.name}</h3>
                        <div className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-1"><Building2 size={12}/> {alumni.company || '소속 미정'}</div>
                      </div>
                    </div>
                    <button onClick={(e) => handleEdit(e, alumni)} className="text-slate-300 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"><Edit2 size={16} /></button>
                  </div>
                  <div className="space-y-1.5 text-sm text-slate-600">
                    <div className="flex gap-2 mb-2">
                       {alumni.batch && <span className="text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded-md text-slate-500">{alumni.batch}</span>}
                       {alumni.graduationYear && <span className="text-[10px] font-black bg-emerald-50 px-2 py-0.5 rounded-md text-emerald-600">{alumni.graduationYear} 졸업</span>}
                    </div>
                    {alumni.position && <div className="flex items-center gap-2"><Briefcase size={14} className="text-slate-400" /> {alumni.position}</div>}
                    {alumni.email && <div className="flex items-center gap-2"><Mail size={14} className="text-slate-400" /> <span className="truncate">{alumni.email}</span></div>}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {selectedAlumni && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedAlumni(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white max-w-xl w-full rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="bg-[#2d5a27] h-32 relative shrink-0">
                <button onClick={() => setSelectedAlumni(null)} className="absolute top-4 right-4 bg-white/20 text-white p-2 rounded-full hover:bg-white/40 backdrop-blur-md transition"><X size={20}/></button>
              </div>
              <div className="px-8 pb-8 relative overflow-y-auto custom-scrollbar">
                <img src={selectedAlumni.photoUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(selectedAlumni.name)}`} alt={selectedAlumni.name} className="w-28 h-28 rounded-full border-4 border-white shadow-lg -mt-14 object-cover bg-white" />
                <div className="mt-4 mb-6 relative">
                  <div className="flex items-end gap-3 flex-wrap">
                    <h2 className="text-3xl font-black text-slate-900">{selectedAlumni.name}</h2>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded-lg text-sm mb-1">{selectedAlumni.batch}</span>
                  </div>
                  <p className="text-slate-500 text-sm font-medium mt-1 flex items-center gap-2"><GraduationCap size={16}/> {selectedAlumni.graduationYear} 졸업 ({selectedAlumni.studentId})</p>
                  
                  <div className="flex gap-2 mt-4">
                    <button onClick={(e) => { setSelectedAlumni(null); handleEdit(e, selectedAlumni!); }} className="text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 px-4 py-2 rounded-xl transition flex items-center gap-2">
                      <Edit2 size={14}/> 수정
                    </button>
                    <button onClick={(e) => handleDelete(e, selectedAlumni!.id, selectedAlumni!.name)} className="text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-xl transition flex items-center gap-2">
                      <Trash2 size={14}/> 삭제
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-emerald-50 p-5 rounded-2xl space-y-3 border border-emerald-100">
                    <div className="flex items-start gap-4">
                      <Building2 size={20} className="text-[#2d5a27] shrink-0 mt-1" />
                      <div>
                        <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">소속 정보</p>
                        <p className="text-slate-900 font-black text-lg">{selectedAlumni.company || '-'}</p>
                        <p className="text-slate-600 font-bold text-sm">{selectedAlumni.position || '-'}</p>
                      </div>
                    </div>
                    {selectedAlumni.companyAddress && (
                      <div className="flex items-start gap-3 pl-9">
                        <MapPin size={16} className="text-emerald-600 shrink-0" />
                        <p className="text-slate-600 text-xs font-medium">{selectedAlumni.companyAddress}</p>
                      </div>
                    )}
                    {selectedAlumni.homepage && (
                      <div className="flex items-start gap-3 pl-9">
                        <Globe size={16} className="text-emerald-600 shrink-0" />
                        <a href={selectedAlumni.homepage.startsWith('http') ? selectedAlumni.homepage : `https://${selectedAlumni.homepage}`} target="_blank" rel="noopener noreferrer" className="text-emerald-700 text-xs font-bold hover:underline">
                          {selectedAlumni.homepage}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 p-5 rounded-2xl space-y-3 border border-slate-100">
                    <div className="flex items-start gap-3"><Phone size={18} className="text-slate-400 shrink-0" /><div><p className="text-[10px] font-black text-slate-400">연락처</p><p className="text-slate-700 font-bold">{selectedAlumni.phone || '-'}</p></div></div>
                    <div className="flex items-start gap-3"><Mail size={18} className="text-slate-400 shrink-0" /><div><p className="text-[10px] font-black text-slate-400">이메일</p><p className="text-slate-700 font-bold break-all">{selectedAlumni.email || '-'}</p></div></div>
                  </div>

                  {selectedAlumni.researchFields ? (
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-800 font-black text-sm mb-2"><BookOpen size={16}/> 상세 정보 및 연구분야</div>
                      <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap font-medium">{selectedAlumni.researchFields}</p>
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
