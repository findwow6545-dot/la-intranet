'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Plus, MapPin, Clock, Trash2, X, CheckCircle2, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, serverTimestamp, query, onSnapshot, doc, deleteDoc } from 'firebase/firestore';

interface Schedule {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string;
  location: string;
  description: string;
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const emptyForm = { title: '', date: '', time: '', location: '', description: '' };
  const [formData, setFormData] = useState(emptyForm);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const q = query(collection(db, 'schedule'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSchedules(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Schedule[]);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'schedule', editingId), formData);
        showToast('일정이 수정되었습니다!');
      } else {
        await addDoc(collection(db, 'schedule'), { ...formData, createdAt: serverTimestamp() });
        showToast('일정이 등록되었습니다!');
      }
      setIsFormOpen(false);
      setEditingId(null);
      setFormData(emptyForm);
    } catch (err) {
      showToast('저장 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleEdit = (sch: Schedule) => {
    setFormData({ title: sch.title, date: sch.date, time: sch.time || '', location: sch.location || '', description: sch.description || '' });
    setEditingId(sch.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" 일정을 정말 삭제하시겠습니까?`)) return;
    await deleteDoc(doc(db, 'schedule', id));
    if (selectedSchedule?.id === id) setSelectedSchedule(null);
    showToast('일정이 삭제되었습니다.');
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthName = currentDate.toLocaleString('ko-KR', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const blanks = Array(firstDayOfMonth).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const paddingMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
    const paddingDay = String(d).padStart(2, '0');
    return `${currentDate.getFullYear()}-${paddingMonth}-${paddingDay}`;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 relative">
      <AnimatePresence>
        {toast && (
           <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-3 ${toast.type === 'success' ? 'bg-rose-600 text-white' : 'bg-red-600 text-white'}`}>
            <CheckCircle2 size={18} /> {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3"><CalendarIcon className="text-rose-600 w-8 h-8" /> 월간 일정 및 미팅</h1>
          <p className="text-slate-500 mt-1 text-sm">달력에서 일정을 클릭하여 세부정보를 확인하세요.</p>
        </div>
        <button onClick={() => { 
            setIsFormOpen(!isFormOpen); 
            if (!isFormOpen) { setFormData(prev => ({...emptyForm, date: selectedDate || ''})); setEditingId(null); }
          }} className="bg-rose-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-rose-700 transition flex items-center gap-2">
          {isFormOpen ? <X size={18} /> : <Plus size={18} />} 일정 추가
        </button>
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <motion.form initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <h2 className="text-lg font-bold mb-2 md:col-span-2">{editingId ? '일정 수정하기' : '새 일정 등록'}</h2>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-600">일정 제목 *</label><input required className="input-field" value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})}/></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-600">날짜 *</label><input required type="date" className="input-field" value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})}/></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-600">시간</label><input type="time" className="input-field" value={formData.time} onChange={e=>setFormData({...formData, time: e.target.value})}/></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-600">장소</label><input className="input-field" value={formData.location} onChange={e=>setFormData({...formData, location: e.target.value})}/></div>
            <div className="space-y-1 md:col-span-2"><label className="text-xs font-bold text-slate-600">상세 설명</label><textarea className="input-field" value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})}/></div>
            <button type="submit" className="md:col-span-2 bg-rose-600 text-white w-full py-3 rounded-xl font-bold">{editingId ? '수정 내용 저장' : '일정 캘린더에 추가하기'}</button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between p-6 bg-slate-50/50 border-b border-slate-100">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-200 rounded-full transition"><ChevronLeft size={24} className="text-slate-600"/></button>
          <h2 className="text-2xl font-black text-slate-800">{monthName}</h2>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-200 rounded-full transition"><ChevronRight size={24} className="text-slate-600"/></button>
        </div>
        
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/80">
          {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
            <div key={day} className={`py-3 text-center text-xs font-black ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-500'}`}>{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 auto-rows-[120px]">
          {blanks.map((_, i) => (
            <div key={`blank-${i}`} className="border-b border-r border-slate-100 bg-slate-50/20"></div>
          ))}
          {days.map((dateString, i) => {
            const daySchedules = schedules.filter(s => s.date === dateString);
            const isToday = dateString === new Date().toISOString().split('T')[0];
            const isSunday = new Date(dateString).getDay() === 0;
            const isSaturday = new Date(dateString).getDay() === 6;

            return (
              <div 
                key={dateString} 
                className={`border-b border-r border-slate-100 p-2 hover:bg-slate-50 transition cursor-pointer flex flex-col ${isToday ? 'bg-rose-50/30' : ''}`}
                onClick={() => {
                  if (daySchedules.length > 0) setSelectedSchedule(daySchedules[0]);
                  else { setSelectedDate(dateString); setIsFormOpen(true); }
                }}
              >
                <div className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1
                  ${isToday ? 'bg-rose-600 text-white' : isSunday ? 'text-red-500' : isSaturday ? 'text-blue-500' : 'text-slate-700'}
                `}>
                  {i + 1}
                </div>
                <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1">
                  {daySchedules.map(sch => (
                    <div 
                       key={sch.id} 
                       className="text-[10px] font-bold bg-rose-100 text-rose-800 px-1.5 py-1 rounded line-clamp-1 border border-rose-200"
                       onClick={(e) => { e.stopPropagation(); setSelectedSchedule(sch); }}
                    >
                      {sch.time && <span className="mr-1 opacity-70">{sch.time}</span>}
                      {sch.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedSchedule && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedSchedule(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white max-w-lg w-full rounded-[2rem] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="bg-rose-600 p-6 text-white relative">
                <button onClick={() => setSelectedSchedule(null)} className="absolute top-4 right-4 bg-white/20 text-white p-2 rounded-full hover:bg-white/40 backdrop-blur-md transition"><X size={20}/></button>
                <div className="text-rose-200 font-extrabold flex items-center gap-2 text-sm mb-3"><CalendarIcon size={16}/> {selectedSchedule.date}</div>
                <h2 className="text-3xl font-black leading-tight pr-8">{selectedSchedule.title}</h2>
              </div>
              <div className="p-8 pb-10">
                <div className="bg-slate-50 p-5 rounded-2xl space-y-4 mb-6 border border-slate-100">
                  <div className="flex items-center gap-4 text-slate-700">
                     <Clock size={20} className="text-rose-500" /> 
                     <span className="font-bold">{selectedSchedule.time || '시간 미정'}</span>
                  </div>
                  {selectedSchedule.location && (
                    <div className="flex items-center gap-4 text-slate-700">
                       <MapPin size={20} className="text-rose-500" /> 
                       <span className="font-bold">{selectedSchedule.location}</span>
                    </div>
                  )}
                </div>
                
                {selectedSchedule.description && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">상세 내용</h4>
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{selectedSchedule.description}</p>
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
                   <button onClick={() => { setSelectedSchedule(null); handleEdit(selectedSchedule!); }} className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl transition">
                     <Edit2 size={16}/> 이 일정 수정
                   </button>
                   <button onClick={() => handleDelete(selectedSchedule.id, selectedSchedule.title)} className="flex items-center gap-2 text-xs font-bold text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition">
                     <Trash2 size={16}/> 이 일정 삭제
                   </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
