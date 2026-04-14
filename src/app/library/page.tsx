'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Search, Trash2, X, CheckCircle2, User, Clock, Paperclip, FileImage, Video, Loader2, Edit2, Play } from 'lucide-react';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, updateDoc, serverTimestamp, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

interface LibraryItem {
  id: string;
  title: string;
  content: string;
  uploader: string;
  type: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'video' | 'file';
  createdAt: any;
}

const extractYoutubeId = (text: string) => {
  if (!text) return null;
  const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = text.match(regExp);
  return match ? match[1] : null;
};

const Linkify = ({ text }: { text: string }) => {
  const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
  if (!text) return null;
  const parts = text.split(urlRegex);
  return (
    <>
      {parts.map((part, i) => {
        if (part.match(urlRegex)) {
          return (
            <a key={i} href={part.startsWith('http') ? part : `https://${part}`} target="_blank" rel="noopener noreferrer" className="text-amber-500 font-medium hover:underline hover:text-amber-700 mx-1" onClick={(e) => e.stopPropagation()}>
              {part}
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);

  const emptyForm = { title: '', content: '', uploader: '', type: '논문' };
  const [formData, setFormData] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const getAttachmentType = (type: string) => {
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    return 'file';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    let attachmentUrl = '';
    let attachmentType = '';

    try {
      if (file) {
        const storageRef = ref(storage, `library/${Date.now()}_${file.name}`);
        const uploadTask = await uploadBytesResumable(storageRef, file);
        attachmentUrl = await getDownloadURL(uploadTask.ref);
        attachmentType = getAttachmentType(file.type);
      }

      const savePayload: any = { ...formData };
      if (file) {
        savePayload.attachmentUrl = attachmentUrl;
        savePayload.attachmentType = attachmentType;
      }

      if (savePayload.description === undefined) {
         savePayload.description = savePayload.content; 
      }

      if (editingId) {
        await updateDoc(doc(db, 'library', editingId), savePayload);
        showToast('자료가 성공적으로 수정되었습니다!');
      } else {
        await addDoc(collection(db, 'library'), { 
          ...savePayload,
          createdAt: serverTimestamp() 
        });
        showToast('자료가 성공적으로 등록되었습니다!');
      }

      setIsFormOpen(false);
      setEditingId(null);
      setFormData(emptyForm);
      setFile(null);
    } catch (err) {
      console.error(err);
      showToast('저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (e: React.MouseEvent, p: LibraryItem) => {
    e.stopPropagation();
    setFormData({ title: p.title, content: p.content || (p as any).description || '', uploader: p.uploader, type: p.type || '논문' });
    setEditingId(p.id);
    setFile(null);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    if (!confirm(`"${title}" 자료를 정말 삭제하시겠습니까?`)) return;
    await deleteDoc(doc(db, 'library', id));
    if (selectedItem?.id === id) setSelectedItem(null);
    showToast('자료가 삭제되었습니다.');
  };

  const filteredItems = items.filter(p => p.title.includes(searchTerm) || (p.content || (p as any).description || '').includes(searchTerm));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 relative">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-3 ${toast.type === 'success' ? 'bg-amber-600 text-white' : 'bg-red-600 text-white'}`}>
            <CheckCircle2 size={18} /> {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3"><BookOpen className="text-amber-600 w-8 h-8" /> 자료실</h1>
          <p className="text-slate-500 mt-1 text-sm">첨부파일(문서, 이미지, 영상)과 함께 연구 자료를 보관하고 공유합니다.</p>
        </div>
        <button onClick={() => {
            setIsFormOpen(!isFormOpen);
            if (!isFormOpen) { setFormData(emptyForm); setEditingId(null); setFile(null); }
          }} 
          className="bg-amber-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-amber-700 transition flex items-center gap-2" disabled={isUploading}
        >
          {isFormOpen ? <X size={18} /> : <Plus size={18} />} {isFormOpen ? '닫기' : '자료 등록'}
        </button>
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <motion.form initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <h2 className="text-lg font-bold mb-4 text-amber-900">{editingId ? '자료 수정' : '새 자료 등록'}</h2>
            <div className="space-y-4">
              <input required placeholder="자료명" className="input-field focus:border-amber-500 focus:ring-amber-500/10" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} disabled={isUploading}/>
              <div className="flex gap-4">
                <input required placeholder="등록자 이름" className="input-field flex-1 focus:border-amber-500 focus:ring-amber-500/10" value={formData.uploader} onChange={e => setFormData({...formData, uploader: e.target.value})} disabled={isUploading}/>
                <select className="input-field w-32 focus:border-amber-500 focus:ring-amber-500/10" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} disabled={isUploading}>
                  <option value="논문">논문</option><option value="데이터셋">데이터셋</option><option value="기타 자료">기타 자료</option>
                </select>
              </div>
              <textarea required placeholder="자료 설명 및 링크를 입력하세요..." className="input-field h-32 resize-none focus:border-amber-500 focus:ring-amber-500/10" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} disabled={isUploading}/>
              
              <div className="border-2 border-dashed border-slate-200 p-4 rounded-xl relative hover:bg-slate-50 transition">
                <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={isUploading}/>
                <div className="flex flex-col items-center justify-center text-slate-500 pointer-events-none">
                  {file ? (
                     <div className="font-bold text-amber-600 flex items-center gap-2"><Paperclip size={18}/> {file.name}</div>
                  ) : (
                     <>
                      <FileImage size={24} className="mb-2 text-slate-400" />
                      <p className="text-sm font-bold">새 파일 첨부 (수정 시 미선택하면 기존 파일 유지)</p>
                      <p className="text-xs mt-1">(논문 PDF, 이미지, 영상 가능. 링크만 원할 시 비워두세요.)</p>
                     </>
                  )}
                </div>
              </div>

              <button type="submit" className="bg-amber-600 text-white w-full py-4 rounded-xl font-black flex items-center justify-center gap-2" disabled={isUploading}>
                {isUploading && <Loader2 size={18} className="animate-spin" />}
                {isUploading ? '저장 중...' : (editingId ? '자료 수정 완료' : '자료 등록하기')}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="mb-6 relative">
        <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
        <input type="text" placeholder="자료명이나 설명으로 검색..." className="input-field pl-12 h-14 focus:border-amber-500 focus:ring-amber-500/10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredItems.map(item => {
          const contentStr = item.content || (item as any).description || '';
          const ytId = extractYoutubeId(contentStr) || extractYoutubeId((item as any).link || '');
          const attUrl = item.attachmentUrl || (item as any).link;
          
          return (
          <div key={item.id} onClick={() => setSelectedItem(item)} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-amber-300 hover:shadow-md transition cursor-pointer group flex flex-col">
            {item.attachmentType === 'image' && item.attachmentUrl ? (
              <div className="w-full h-48 bg-slate-100 mb-4 rounded-xl overflow-hidden shrink-0"><img src={item.attachmentUrl} alt="thumbnail" className="w-full h-full object-cover transition duration-300 group-hover:scale-105" /></div>
            ) : ytId ? (
              <div className="w-full h-48 bg-slate-100 mb-4 rounded-xl overflow-hidden relative shrink-0"><img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="youtube" className="w-full h-full object-cover transition duration-300 group-hover:scale-105" /><div className="absolute inset-0 flex items-center justify-center bg-black/10"><div className="w-12 h-12 bg-red-600/90 text-white rounded-full flex items-center justify-center pl-1 backdrop-blur-sm shadow-xl"><Play size={24} fill="currentColor" /></div></div></div>
            ) : item.attachmentType === 'video' && item.attachmentUrl ? (
              <div className="w-full h-48 bg-slate-900 mb-4 rounded-xl overflow-hidden relative shrink-0"><video src={item.attachmentUrl} className="w-full h-full object-cover opacity-70" preload="metadata" /><div className="absolute inset-0 flex items-center justify-center"><div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 shadow-xl"><Video size={24}/></div></div></div>
            ) : null}
            <div className="flex justify-between items-start mb-3">
              <div className="flex flex-col items-start gap-1">
                 <span className="text-[10px] font-black px-2 py-1 bg-amber-50 text-amber-600 rounded-md">{item.type || '자료'}</span>
                 <h3 className="text-xl font-black text-slate-900 group-hover:text-amber-600 transition">{item.title}</h3>
              </div>
              <div className="flex gap-1 shrink-0 ml-2">
                <button onClick={(e) => handleEdit(e, item)} className="text-slate-300 hover:text-amber-500 transition p-1"><Edit2 size={16} /></button>
                <button onClick={(e) => handleDelete(e, item.id, item.title)} className="text-slate-300 hover:text-red-500 transition p-1"><Trash2 size={16} /></button>
              </div>
            </div>
            
            <div className="text-slate-600 text-sm line-clamp-2 mb-4 flex-1 whitespace-pre-wrap"><Linkify text={contentStr} /></div>
            
            <div className="flex items-center justify-between text-xs font-medium text-slate-400 border-t border-slate-50 pt-4 mt-auto">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 bg-slate-100/50 px-2 py-1 rounded-md text-slate-600"><User size={12} /> {item.uploader}</span>
                <span className="flex items-center gap-1"><Clock size={12} /> {item.createdAt?.toDate?.()?.toLocaleDateString?.() || '상세 보기'}</span>
              </div>
              {attUrl && (
                <span className="flex items-center gap-1 text-amber-500 font-bold bg-amber-50 px-2 py-1 rounded-md shrink-0">
                   {item.attachmentType === 'video' || ytId ? <Video size={14}/> : <FileImage size={14}/>} 첨부됨
                </span>
              )}
            </div>
          </div>
        )})}
        {filteredItems.length === 0 && <p className="text-center text-slate-400 py-10 w-full md:col-span-2">조건에 맞는 자료가 없습니다.</p>}
      </div>

      {selectedItem && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white max-w-2xl w-full rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                     <span className="text-xs font-black px-2 py-1 bg-amber-100 text-amber-700 rounded-md">{selectedItem.type || '자료'}</span>
                     <h2 className="text-2xl font-black text-slate-900">{selectedItem.title}</h2>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1"><User size={14} className="text-amber-600"/> {selectedItem.uploader}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className="flex items-center gap-1"><Clock size={14}/> {selectedItem.createdAt?.toDate?.()?.toLocaleString?.() || '최근'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={(e) => { setSelectedItem(null); handleEdit(e, selectedItem); }} className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 font-bold text-sm flex items-center gap-1 transition"><Edit2 size={16}/> 수정</button>
                  <button onClick={() => setSelectedItem(null)} className="p-2 bg-slate-200/50 text-slate-500 rounded-lg hover:bg-slate-200 transition"><X size={20}/></button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <p className="text-slate-800 text-base leading-relaxed whitespace-pre-wrap mb-8"><Linkify text={selectedItem.content || (selectedItem as any).description || ''} /></p>
                
                {(selectedItem.attachmentUrl || (selectedItem as any).link) && (
                  <div className="mt-4 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50 p-2">
                    {selectedItem.attachmentType === 'image' && (
                      <img src={selectedItem.attachmentUrl} alt="첨부 이미지" className="w-full h-auto rounded-xl max-h-[500px] object-contain bg-black/5" />
                    )}
                    {selectedItem.attachmentType === 'video' && (
                      <video src={selectedItem.attachmentUrl} controls className="w-full h-auto rounded-xl max-h-[500px] bg-black" />
                    )}
                    {selectedItem.attachmentType === 'file' && (
                      <a href={selectedItem.attachmentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-amber-100 hover:border-amber-300 text-amber-600 font-bold transition">
                        <Paperclip size={24} /> 직접 업로드된 파일 다운로드 (새 탭에서 열기)
                      </a>
                    )}
                    {(selectedItem as any).link && !selectedItem.attachmentUrl && (
                      <a href={(selectedItem as any).link} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-amber-100 hover:border-amber-300 text-amber-600 font-bold transition">
                        <BookOpen size={24} /> 외부 링크 자료 열기 (새 탭에서 열기)
                      </a>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
