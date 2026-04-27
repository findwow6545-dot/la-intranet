'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Search, Trash2, X, CheckCircle2, User, Clock, Paperclip, FileImage, Video, Loader2, Edit2, Play, Tag, Lock } from 'lucide-react';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, updateDoc, serverTimestamp, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/lib/auth-context';
import { useBoardCategories } from '@/lib/use-board-categories';
import CategoryManager from '@/components/CategoryManager';
import Link from 'next/link';

interface LibraryItem {
  id: string;
  title: string;
  content: string;
  uploader: string;
  uploaderEmail?: string;
  type: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'video' | 'file';
  createdAt: any;
}

const FALLBACK = '기타';

const CATEGORY_STYLES: Record<string, string> = {
  '논문': 'bg-amber-50 text-amber-700 border-amber-200',
  '앱/웹개발': 'bg-blue-50 text-blue-700 border-blue-200',
  '디자인': 'bg-pink-50 text-pink-700 border-pink-200',
  '회의록': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '기타': 'bg-gray-50 text-gray-700 border-gray-200',
};
const getCategoryColor = (type: string) => CATEGORY_STYLES[type] || 'bg-slate-50 text-slate-600 border-slate-100';

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
  const { user, isAdmin, userName, loading: authLoading } = useAuth();
  const { categories: boardCategories, addCategory, deleteCategory, renameCategory } = useBoardCategories({
    boardName: 'library',
    postsCollection: 'library',
    categoryField: 'type',
    fallbackCategory: FALLBACK,
  });

  const [items, setItems] = useState<LibraryItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);

  const emptyForm = { title: '', content: '', uploader: '', type: boardCategories[0] || FALLBACK };
  const [formData, setFormData] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const canEditDelete = (item: LibraryItem) => {
    if (!user) return false;
    if (isAdmin) return true;
    return item.uploaderEmail === user.email;
  };

  useEffect(() => {
    if (authLoading || !user) return;
    const q = query(collection(db, 'library'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LibraryItem[]);
    });
    return () => unsubscribe();
  }, [user, authLoading]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { '전체': items.length };
    items.forEach(item => {
      const t = item.type || FALLBACK;
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  }, [items]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isFormOpen || isUploading) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const f = new File([blob], `pasted-image-${Date.now()}.png`, { type: blob.type });
            setFile(f);
            showToast('클립보드 이미지가 첨부되었습니다.');
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isFormOpen, isUploading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const getAttachmentType = (type: string) => {
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    return 'file';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { showToast('로그인이 필요합니다.', 'error'); return; }
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

      const savePayload: any = { 
        title: formData.title, content: formData.content,
        uploader: formData.uploader || userName || user.email,
        uploaderEmail: user.email, type: formData.type,
      };
      if (file) { savePayload.attachmentUrl = attachmentUrl; savePayload.attachmentType = attachmentType; }

      if (editingId) {
        await updateDoc(doc(db, 'library', editingId), savePayload);
        showToast('자료가 성공적으로 수정되었습니다!');
      } else {
        await addDoc(collection(db, 'library'), { ...savePayload, createdAt: serverTimestamp() });
        showToast('자료가 성공적으로 등록되었습니다!');
      }
      setIsFormOpen(false); setEditingId(null); setFormData(emptyForm); setFile(null);
    } catch (err) { console.error(err); showToast('저장 중 오류가 발생했습니다.', 'error'); }
    finally { setIsUploading(false); }
  };

  const handleEdit = (e: React.MouseEvent, p: LibraryItem) => {
    e.stopPropagation();
    if (!canEditDelete(p)) return;
    setFormData({ title: p.title, content: p.content || (p as any).description || '', uploader: p.uploader, type: p.type || FALLBACK });
    setEditingId(p.id); setFile(null); setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    if (!confirm(`"${title}" 자료를 정말 삭제하시겠습니까?`)) return;
    await deleteDoc(doc(db, 'library', id));
    if (selectedItem?.id === id) setSelectedItem(null);
    showToast('자료가 삭제되었습니다.');
  };

  const filteredItems = items
    .filter(p => selectedCategory === '전체' || p.type === selectedCategory)
    .filter(p => p.title.includes(searchTerm) || (p.content || (p as any).description || '').includes(searchTerm));

  if (!authLoading && !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-6">
          <Lock size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">멤버 전용 서비스</h2>
        <p className="text-slate-500 mb-8 max-w-sm">
          자료실은 연구실 멤버만 열람 가능합니다.<br />
          로그인 후 이용해 주세요.
        </p>
        <Link href="/login" className="bg-amber-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-amber-700 transition shadow-lg shadow-amber-600/20">
          로그인 페이지로 이동
        </Link>
      </div>
    );
  }

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
          <p className="text-slate-500 mt-1 text-sm">논문, 앱/웹개발, 디자인, 회의록 등의 자료를 올리고 학습하는 공간입니다.</p>
        </div>
        {user && (
          <button onClick={() => {
              setIsFormOpen(!isFormOpen);
              if (!isFormOpen) { setFormData({ ...emptyForm, uploader: userName || '', type: boardCategories[0] || FALLBACK }); setEditingId(null); setFile(null); }
            }} 
            className="bg-amber-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-amber-700 transition flex items-center gap-2" disabled={isUploading}
          >
            {isFormOpen ? <X size={18} /> : <Plus size={18} />} {isFormOpen ? '닫기' : '자료 등록'}
          </button>
        )}
      </div>

      {/* 카테고리 탭 + 관리 버튼 */}
      <div className="mb-6 flex items-center gap-2">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1">
          <button onClick={() => setSelectedCategory('전체')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border whitespace-nowrap transition-all
              ${selectedCategory === '전체' ? 'bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-600/20' : 'bg-white text-slate-500 border-slate-200 hover:border-amber-300 hover:text-amber-600'}`}
          >
            <BookOpen size={16} /> 전체
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedCategory === '전체' ? 'bg-white/20' : 'bg-slate-100'}`}>{categoryCounts['전체'] || 0}</span>
          </button>
          {boardCategories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border whitespace-nowrap transition-all
                ${selectedCategory === cat ? 'bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-600/20' : 'bg-white text-slate-500 border-slate-200 hover:border-amber-300 hover:text-amber-600'}`}
            >
              <Tag size={14} /> {cat}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedCategory === cat ? 'bg-white/20' : 'bg-slate-100'}`}>{categoryCounts[cat] || 0}</span>
            </button>
          ))}
        </div>
        <CategoryManager categories={boardCategories} fallbackCategory={FALLBACK} addCategory={addCategory} deleteCategory={deleteCategory} renameCategory={renameCategory} accentColor="amber" />
      </div>

      <AnimatePresence>
        {isFormOpen && user && (
          <motion.form initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <h2 className="text-lg font-bold mb-4 text-amber-900">{editingId ? '자료 수정' : '새 자료 등록'}</h2>
            <div className="space-y-4">
              <input required placeholder="자료명" className="input-field focus:border-amber-500 focus:ring-amber-500/10" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} disabled={isUploading}/>
              <div className="flex gap-4">
                <input required placeholder="등록자 이름" className="input-field flex-1 focus:border-amber-500 focus:ring-amber-500/10" value={formData.uploader} onChange={e => setFormData({...formData, uploader: e.target.value})} disabled={isUploading}/>
                <select className="input-field w-36 focus:border-amber-500 focus:ring-amber-500/10" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} disabled={isUploading}>
                  {boardCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <textarea required placeholder="자료 설명 및 링크를 입력하세요..." className="input-field h-32 resize-none focus:border-amber-500 focus:ring-amber-500/10" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} disabled={isUploading}/>
              
              <div className="border-2 border-dashed border-slate-200 p-4 rounded-xl relative hover:bg-slate-50 transition">
                <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={isUploading}/>
                <div className="flex flex-col items-center justify-center text-slate-500 pointer-events-none">
                  {file ? (
                     <div className="font-bold text-amber-600 flex items-center gap-2"><Paperclip size={18}/> {file.name}</div>
                  ) : (
                     <><FileImage size={24} className="mb-2 text-slate-400" /><p className="text-sm font-bold">파일 첨부 (논문 PDF, 이미지, 영상)</p></>
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
          const editable = canEditDelete(item);
          return (
          <div key={item.id} onClick={() => setSelectedItem(item)} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-amber-300 hover:shadow-md transition cursor-pointer group flex flex-col shadow-sm">
            {item.attachmentType === 'image' && item.attachmentUrl ? (
              <div className="w-full h-48 bg-slate-100 mb-4 rounded-xl overflow-hidden shrink-0"><img src={item.attachmentUrl} alt="thumbnail" className="w-full h-full object-cover transition duration-300 group-hover:scale-105" /></div>
            ) : ytId ? (
              <div className="w-full h-48 bg-slate-100 mb-4 rounded-xl overflow-hidden relative shrink-0"><img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="youtube" className="w-full h-full object-cover transition duration-300 group-hover:scale-105" /><div className="absolute inset-0 flex items-center justify-center bg-black/10"><div className="w-12 h-12 bg-red-600/90 text-white rounded-full flex items-center justify-center pl-1 backdrop-blur-sm shadow-xl"><Play size={24} fill="currentColor" /></div></div></div>
            ) : item.attachmentType === 'video' && item.attachmentUrl ? (
              <div className="w-full h-48 bg-slate-900 mb-4 rounded-xl overflow-hidden relative shrink-0"><video src={item.attachmentUrl} className="w-full h-full object-cover opacity-70" preload="metadata" /><div className="absolute inset-0 flex items-center justify-center"><div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 shadow-xl"><Video size={24}/></div></div></div>
            ) : null}
            <div className="flex justify-between items-start mb-3">
              <div className="flex flex-col items-start gap-1">
                 <span className={`text-[10px] font-black px-2 py-1 rounded-md border ${getCategoryColor(item.type)}`}>{item.type || '자료'}</span>
                 <h3 className="text-xl font-black text-slate-900 group-hover:text-amber-600 transition">{item.title}</h3>
              </div>
              {editable && (
                <div className="flex gap-1 shrink-0 ml-2">
                  <button onClick={(e) => handleEdit(e, item)} className="text-slate-300 hover:text-amber-500 transition p-1"><Edit2 size={16} /></button>
                  <button onClick={(e) => handleDelete(e, item.id, item.title)} className="text-slate-300 hover:text-red-500 transition p-1"><Trash2 size={16} /></button>
                </div>
              )}
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
                     <span className={`text-xs font-black px-2 py-1 rounded-md border ${getCategoryColor(selectedItem.type)}`}>{selectedItem.type || '자료'}</span>
                     <h2 className="text-2xl font-black text-slate-900">{selectedItem.title}</h2>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1"><User size={14} className="text-amber-600"/> {selectedItem.uploader}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className="flex items-center gap-1"><Clock size={14}/> {selectedItem.createdAt?.toDate?.()?.toLocaleString?.() || '최근'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {canEditDelete(selectedItem) && (
                    <button onClick={(e) => { setSelectedItem(null); handleEdit(e, selectedItem); }} className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 font-bold text-sm flex items-center gap-1 transition"><Edit2 size={16}/> 수정</button>
                  )}
                  <button onClick={() => setSelectedItem(null)} className="p-2 bg-slate-200/50 text-slate-500 rounded-lg hover:bg-slate-200 transition"><X size={20}/></button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <p className="text-slate-800 text-base leading-relaxed whitespace-pre-wrap mb-8"><Linkify text={selectedItem.content || (selectedItem as any).description || ''} /></p>
                {(selectedItem.attachmentUrl || (selectedItem as any).link) && (
                  <div className="mt-4 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50 p-2">
                    {selectedItem.attachmentType === 'image' && <img src={selectedItem.attachmentUrl} alt="첨부 이미지" className="w-full h-auto rounded-xl max-h-[500px] object-contain bg-black/5" />}
                    {selectedItem.attachmentType === 'video' && <video src={selectedItem.attachmentUrl} controls className="w-full h-auto rounded-xl max-h-[500px] bg-black" />}
                    {selectedItem.attachmentType === 'file' && (
                      <a href={selectedItem.attachmentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-amber-100 hover:border-amber-300 text-amber-600 font-bold transition">
                        <Paperclip size={24} /> 파일 다운로드 (새 탭에서 열기)
                      </a>
                    )}
                    {(selectedItem as any).link && !selectedItem.attachmentUrl && (
                      <a href={(selectedItem as any).link} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-amber-100 hover:border-amber-300 text-amber-600 font-bold transition">
                        <BookOpen size={24} /> 외부 링크 자료 열기
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
