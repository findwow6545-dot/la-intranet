'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Search, Trash2, Download, ExternalLink, X, CheckCircle2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';

interface LibraryItem {
  id: string;
  title: string;
  type: string;
  link: string;
  description: string;
  uploader: string;
  createdAt: any;
}

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({ title: '', type: '논문', link: '', description: '', uploader: '' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const q = query(collection(db, 'library'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LibraryItem[]);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'library'), { ...formData, createdAt: serverTimestamp() });
      showToast('자료가 등록되었습니다!');
      setIsFormOpen(false);
      setFormData({ title: '', type: '논문', link: '', description: '', uploader: '' });
    } catch (err) {
      showToast('등록 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" 자료를 정말 삭제하시겠습니까?`)) return;
    await deleteDoc(doc(db, 'library', id));
    showToast('자료가 삭제되었습니다.');
  };

  const filteredItems = items.filter(i => i.title.includes(searchTerm) || i.description.includes(searchTerm));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <AnimatePresence>
        {toast && (
           <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-3 ${toast.type === 'success' ? 'bg-amber-600 text-white' : 'bg-red-600 text-white'}`}>
            <CheckCircle2 size={18} /> {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3"><BookOpen className="text-amber-600 w-8 h-8" /> 데이터 라이브러리</h1>
          <p className="text-slate-500 mt-1 text-sm">연구 논문 및 데이터셋을 보관하고 공유합니다.</p>
        </div>
        <button onClick={() => setIsFormOpen(!isFormOpen)} className="bg-amber-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-amber-700 transition flex items-center gap-2">
          {isFormOpen ? <X size={18} /> : <Plus size={18} />} 자료 등록
        </button>
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <motion.form initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <h2 className="text-lg font-bold mb-2 md:col-span-2">새 자료 등록</h2>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-600">자료명</label><input required className="input-field" value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})}/></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-600">자료 유형</label>
              <select className="input-field" value={formData.type} onChange={e=>setFormData({...formData, type: e.target.value})}>
                <option value="논문">논문</option><option value="데이터셋">데이터셋</option><option value="기타 자료">기타 자료</option>
              </select>
            </div>
            <div className="space-y-1 md:col-span-2"><label className="text-xs font-bold text-slate-600">다운로드 또는 참고 링크 (URL)</label><input required type="url" className="input-field" placeholder="https://" value={formData.link} onChange={e=>setFormData({...formData, link: e.target.value})}/></div>
            <div className="space-y-1 md:col-span-2"><label className="text-xs font-bold text-slate-600">자료 설명</label><textarea className="input-field" value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})}/></div>
            <div className="space-y-1 md:col-span-2"><label className="text-xs font-bold text-slate-600">등록자 이름</label><input required className="input-field" value={formData.uploader} onChange={e=>setFormData({...formData, uploader: e.target.value})}/></div>
            <button type="submit" className="md:col-span-2 bg-amber-600 text-white w-full py-3 rounded-xl font-bold">자료 추가하기</button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-black px-2 py-1 bg-amber-50 text-amber-600 rounded-md">{item.type}</span>
              <button onClick={() => handleDelete(item.id, item.title)} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">{item.title}</h3>
            <p className="text-slate-500 text-xs line-clamp-3 mb-4">{item.description}</p>
            <div className="flex items-center justify-between mt-auto border-t pt-4 border-slate-50">
              <span className="text-xs text-slate-400 font-medium">등록: {item.uploader}</span>
              <a href={item.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-amber-600 font-bold text-xs hover:underline">
                <ExternalLink size={12}/> 열기
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
