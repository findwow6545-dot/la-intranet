'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Plus, MapPin, Clock, Trash2, X, CheckCircle2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';

interface Schedule {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  createdAt: any;
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({ title: '', date: '', time: '', location: '', description: '' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const q = query(collection(db, 'schedule'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSchedules(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Schedule[]);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'schedule'), { ...formData, createdAt: serverTimestamp() });
      showToast('일정이 등록되었습니다!');
      setIsFormOpen(false);
      setFormData({ title: '', date: '', time: '', location: '', description: '' });
    } catch (err) {
      showToast('등록 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" 일정을 정말 삭제하시겠습니까?`)) return;
    await deleteDoc(doc(db, 'schedule', id));
    showToast('일정이 삭제되었습니다.');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <AnimatePresence>
        {toast && (
           <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-3 ${toast.type === 'success' ? 'bg-rose-600 text-white' : 'bg-red-600 text-white'}`}>
            <CheckCircle2 size={18} /> {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3"><CalendarIcon className="text-rose-600 w-8 h-8" /> 일정 및 미팅</h1>
          <p className="text-slate-500 mt-1 text-sm">주간 세미나 및 연구실 행사 일정을 관리합니다.</p>
        </div>
        <button onClick={() => setIsFormOpen(!isFormOpen)} className="bg-rose-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-rose-700 transition flex items-center gap-2">
          {isFormOpen ? <X size={18} /> : <Plus size={18} />} 일정 추가
        </button>
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <motion.form initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <h2 className="text-lg font-bold mb-2 md:col-span-2">새 일정 등록</h2>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-600">일정 제목</label><input required className="input-field" value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})}/></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-600">날짜</label><input required type="date" className="input-field" value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})}/></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-600">시간</label><input type="time" className="input-field" value={formData.time} onChange={e=>setFormData({...formData, time: e.target.value})}/></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-600">장소</label><input className="input-field" value={formData.location} onChange={e=>setFormData({...formData, location: e.target.value})}/></div>
            <div className="space-y-1 md:col-span-2"><label className="text-xs font-bold text-slate-600">상세 설명</label><textarea className="input-field" value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})}/></div>
            <button type="submit" className="md:col-span-2 bg-rose-600 text-white w-full py-3 rounded-xl font-bold">일정 저장하기</button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
        {schedules.map((schedule, i) => (
          <div key={schedule.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 group-hover:bg-rose-500 group-hover:text-white transition-colors">
              <CalendarIcon size={16} />
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group-hover:border-rose-200 transition relative">
              <div className="flex justify-between items-start mb-2">
                <span className="text-rose-600 font-black text-sm">{schedule.date}</span>
                <button onClick={() => handleDelete(schedule.id, schedule.title)} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{schedule.title}</h3>
              <div className="space-y-1 mb-3">
                {schedule.time && <div className="flex items-center gap-2 text-sm text-slate-500"><Clock size={14}/> {schedule.time}</div>}
                {schedule.location && <div className="flex items-center gap-2 text-sm text-slate-500"><MapPin size={14}/> {schedule.location}</div>}
              </div>
              <p className="text-slate-600 text-sm">{schedule.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
